const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../../config');
const xAuth = require('../auth/xAuth');
const logger = require('../utils/logger');

/**
 * X (Twitter) API Client
 * Media upload ve engagement işlemleri
 */
class XClient {
  constructor() {
    this.apiBaseURL = config.x.apiBaseURL;
    this.uploadBaseURL = 'https://upload.twitter.com/1.1/';
  }

  /**
   * Tweet oluşturma (sadece text)
   */
  async createTweet(userId, text, options = {}) {
    try {
      const accessToken = await xAuth.ensureValidToken(userId);

      const requestBody = {
        text: text
      };

      // Reply ise
      if (options.replyToTweetId) {
        requestBody.reply = {
          in_reply_to_tweet_id: options.replyToTweetId
        };
      }

      // Quote tweet ise
      if (options.quoteTweetId) {
        requestBody.quote_tweet_id = options.quoteTweetId;
      }

      // Poll varsa
      if (options.poll) {
        requestBody.poll = options.poll;
      }

      const response = await axios.post(
        `${this.apiBaseURL}tweets`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        tweetId: response.data.data.id,
        text: response.data.data.text,
        url: `https://twitter.com/i/web/status/${response.data.data.id}`
      };

    } catch (error) {
      logger.error('X createTweet error:', error);
      throw error;
    }
  }

  /**
   * Medya yükleme (video veya resim)
   */
  async uploadMedia(userId, mediaPath, mediaType = 'video') {
    try {
      const accessToken = await xAuth.ensureValidToken(userId);
      
      const fileSize = fs.statSync(mediaPath).size;
      const mediaCategory = mediaType === 'video' ? 'tweet_video' : 'tweet_image';

      // 1. INIT
      const initResponse = await axios.post(
        `${this.uploadBaseURL}media/upload.json`,
        null,
        {
          params: {
            command: 'INIT',
            total_bytes: fileSize,
            media_type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
            media_category: mediaCategory
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const mediaId = initResponse.data.media_id_string;

      // 2. APPEND (chunk'lar halinde)
      await this.appendMediaChunks(mediaPath, mediaId, accessToken);

      // 3. FINALIZE
      const finalizeResponse = await axios.post(
        `${this.uploadBaseURL}media/upload.json`,
        null,
        {
          params: {
            command: 'FINALIZE',
            media_id: mediaId
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      // Video ise processing bekle
      if (mediaType === 'video' && finalizeResponse.data.processing_info) {
        await this.waitForProcessing(mediaId, accessToken);
      }

      logger.info(`X media uploaded successfully for user ${userId}`);

      return {
        success: true,
        mediaId
      };

    } catch (error) {
      logger.error('X uploadMedia error:', error);
      throw error;
    }
  }

  /**
   * Medya chunk'larını yükle
   */
  async appendMediaChunks(mediaPath, mediaId, accessToken) {
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const fileSize = fs.statSync(mediaPath).size;
    const totalChunks = Math.ceil(fileSize / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileSize);
      
      const chunk = fs.readFileSync(mediaPath, {
        start,
        end: end - 1
      });

      const formData = new FormData();
      formData.append('command', 'APPEND');
      formData.append('media_id', mediaId);
      formData.append('segment_index', i);
      formData.append('media', chunk, {
        filename: `chunk_${i}`,
        contentType: 'application/octet-stream'
      });

      await axios.post(
        `${this.uploadBaseURL}media/upload.json`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${accessToken}`
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      logger.info(`X media upload progress: ${i + 1}/${totalChunks} chunks`);
    }
  }

  /**
   * Video processing'in bitmesini bekle
   */
  async waitForProcessing(mediaId, accessToken, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await axios.get(
        `${this.uploadBaseURL}media/upload.json`,
        {
          params: {
            command: 'STATUS',
            media_id: mediaId
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const processingInfo = response.data.processing_info;

      if (!processingInfo) {
        return true;
      }

      if (processingInfo.state === 'succeeded') {
        return true;
      } else if (processingInfo.state === 'failed') {
        throw new Error('Media processing failed');
      }

      // Önerilen süre kadar bekle
      const checkAfterSecs = processingInfo.check_after_secs || 5;
      await new Promise(resolve => setTimeout(resolve, checkAfterSecs * 1000));
    }

    throw new Error('Media processing timeout');
  }

  /**
   * Medya ile tweet oluşturma
   */
  async createTweetWithMedia(userId, text, mediaIds) {
    try {
      const accessToken = await xAuth.ensureValidToken(userId);

      const response = await axios.post(
        `${this.apiBaseURL}tweets`,
        {
          text: text,
          media: {
            media_ids: mediaIds
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`X tweet with media created for user ${userId}`);

      return {
        success: true,
        tweetId: response.data.data.id,
        text: response.data.data.text,
        url: `https://twitter.com/i/web/status/${response.data.data.id}`
      };

    } catch (error) {
      logger.error('X createTweetWithMedia error:', error);
      throw error;
    }
  }

  /**
   * Tweet analytics çeker
   */
  async getTweetAnalytics(userId, tweetIds) {
    try {
      const accessToken = await xAuth.ensureValidToken(userId);

      const response = await axios.get(
        `${this.apiBaseURL}tweets`,
        {
          params: {
            ids: tweetIds.join(','),
            'tweet.fields': 'created_at,public_metrics,organic_metrics',
            expansions: 'author_id'
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const analytics = response.data.data.map(tweet => {
        const metrics = tweet.public_metrics;
        const organic = tweet.organic_metrics || {};

        return {
          tweetId: tweet.id,
          text: tweet.text,
          createdAt: tweet.created_at,
          retweets: metrics.retweet_count,
          replies: metrics.reply_count,
          likes: metrics.like_count,
          quotes: metrics.quote_count,
          impressions: organic.impression_count || 0,
          engagement: this.calculateEngagement(metrics, organic),
          url: `https://twitter.com/i/web/status/${tweet.id}`
        };
      });

      return {
        success: true,
        analytics
      };

    } catch (error) {
      logger.error('X getTweetAnalytics error:', error);
      throw error;
    }
  }

  /**
   * Kullanıcı tweets listesi çeker
   */
  async getUserTweets(userId, maxResults = 10, paginationToken = null) {
    try {
      const accessToken = await xAuth.ensureValidToken(userId);

      // Önce user ID'yi al
      const meResponse = await axios.get(
        `${this.apiBaseURL}users/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const xUserId = meResponse.data.data.id;

      // Tweets'leri çek
      const params = {
        max_results: maxResults,
        'tweet.fields': 'created_at,public_metrics',
        exclude: 'retweets,replies'
      };

      if (paginationToken) {
        params.pagination_token = paginationToken;
      }

      const response = await axios.get(
        `${this.apiBaseURL}users/${xUserId}/tweets`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        tweets: response.data.data || [],
        nextToken: response.data.meta?.next_token,
        resultCount: response.data.meta?.result_count
      };

    } catch (error) {
      logger.error('X getUserTweets error:', error);
      throw error;
    }
  }

  /**
   * Tweet silme
   */
  async deleteTweet(userId, tweetId) {
    try {
      const accessToken = await xAuth.ensureValidToken(userId);

      await axios.delete(
        `${this.apiBaseURL}tweets/${tweetId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      logger.info(`X tweet ${tweetId} deleted by user ${userId}`);

      return { success: true };

    } catch (error) {
      logger.error('X deleteTweet error:', error);
      throw error;
    }
  }

  /**
   * Engagement hesaplama
   */
  calculateEngagement(publicMetrics, organicMetrics) {
    const impressions = organicMetrics.impression_count || 0;
    
    if (impressions === 0) return 0;

    const engagements = 
      publicMetrics.like_count +
      publicMetrics.retweet_count +
      publicMetrics.reply_count +
      publicMetrics.quote_count;

    return (engagements / impressions) * 100;
  }
}

module.exports = new XClient();
