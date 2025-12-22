const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../../config');
const metaAuth = require('../auth/metaAuth');
const logger = require('../utils/logger');

/**
 * Meta (Instagram & Facebook) API Client
 * Reels/Video upload ve insights işlemleri
 */
class MetaClient {
  constructor() {
    this.apiBaseURL = config.meta.apiBaseURL;
  }

  /**
   * Instagram Reel yükleme (2 aşamalı: Container oluştur -> Publish)
   */
  async uploadInstagramReel(userId, videoUrl, metadata) {
    try {
      const accessToken = await metaAuth.ensureValidToken(userId);
      
      // Instagram Business Account ID'yi metadata'dan al
      const igAccountId = metadata.instagramAccountId;
      if (!igAccountId) {
        throw new Error('Instagram account ID is required');
      }

      // 1. Container oluştur
      const containerResponse = await axios.post(
        `${this.apiBaseURL}${igAccountId}/media`,
        {
          media_type: 'REELS',
          video_url: videoUrl, // Public URL gerekli
          caption: this.formatCaption(metadata.caption, metadata.hashtags),
          share_to_feed: metadata.shareToFeed !== false,
          cover_url: metadata.coverUrl,
          location_id: metadata.locationId,
          thumb_offset: metadata.thumbOffset || 0
        },
        {
          params: { access_token: accessToken }
        }
      );

      const containerId = containerResponse.data.id;

      // 2. Container status kontrolü
      await this.waitForContainerReady(igAccountId, containerId, accessToken);

      // 3. Publish
      const publishResponse = await axios.post(
        `${this.apiBaseURL}${igAccountId}/media_publish`,
        {
          creation_id: containerId
        },
        {
          params: { access_token: accessToken }
        }
      );

      const mediaId = publishResponse.data.id;

      logger.info(`Instagram Reel uploaded successfully for user ${userId}`);

      return {
        success: true,
        platform: 'instagram',
        mediaId,
        containerId,
        permalink: await this.getMediaPermalink(mediaId, accessToken)
      };

    } catch (error) {
      logger.error('Instagram Reel upload error:', error);
      throw error;
    }
  }

  /**
   * Facebook Page'e video yükleme
   */
  async uploadFacebookVideo(userId, videoPath, metadata) {
    try {
      const accessToken = await metaAuth.ensureValidToken(userId);
      
      const pageId = metadata.pageId;
      if (!pageId) {
        throw new Error('Facebook page ID is required');
      }

      // Resumable upload başlat
      const startResponse = await axios.post(
        `${this.apiBaseURL}${pageId}/videos`,
        {
          upload_phase: 'start',
          file_size: fs.statSync(videoPath).size
        },
        {
          params: { access_token: accessToken }
        }
      );

      const { video_id, upload_session_id } = startResponse.data;

      // Video'yu yükle
      const formData = new FormData();
      formData.append('upload_phase', 'transfer');
      formData.append('upload_session_id', upload_session_id);
      formData.append('video_file_chunk', fs.createReadStream(videoPath));

      await axios.post(
        `${this.apiBaseURL}${pageId}/videos`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          params: { access_token: accessToken },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      // Upload'ı sonlandır ve publish et
      const finishResponse = await axios.post(
        `${this.apiBaseURL}${pageId}/videos`,
        {
          upload_phase: 'finish',
          upload_session_id,
          title: metadata.title,
          description: metadata.description,
          published: metadata.published !== false
        },
        {
          params: { access_token: accessToken }
        }
      );

      logger.info(`Facebook video uploaded successfully for user ${userId}`);

      return {
        success: true,
        platform: 'facebook',
        videoId: video_id,
        postId: finishResponse.data.id
      };

    } catch (error) {
      logger.error('Facebook video upload error:', error);
      throw error;
    }
  }

  /**
   * Instagram media insights çeker
   */
  async getInstagramMediaInsights(userId, mediaId, metrics) {
    try {
      const accessToken = await metaAuth.ensureValidToken(userId);

      const defaultMetrics = metrics || [
        'impressions',
        'reach',
        'likes',
        'comments',
        'shares',
        'saves',
        'plays',
        'total_interactions'
      ];

      const response = await axios.get(
        `${this.apiBaseURL}${mediaId}/insights`,
        {
          params: {
            metric: defaultMetrics.join(','),
            access_token: accessToken
          }
        }
      );

      const insights = {};
      response.data.data.forEach(metric => {
        insights[metric.name] = metric.values[0].value;
      });

      return {
        success: true,
        mediaId,
        insights
      };

    } catch (error) {
      logger.error('Instagram media insights error:', error);
      throw error;
    }
  }

  /**
   * Instagram account insights çeker
   */
  async getInstagramAccountInsights(userId, igAccountId, metrics, period = 'day') {
    try {
      const accessToken = await metaAuth.ensureValidToken(userId);

      const defaultMetrics = metrics || [
        'impressions',
        'reach',
        'follower_count',
        'profile_views',
        'website_clicks'
      ];

      const response = await axios.get(
        `${this.apiBaseURL}${igAccountId}/insights`,
        {
          params: {
            metric: defaultMetrics.join(','),
            period: period, // day, week, days_28
            access_token: accessToken
          }
        }
      );

      const insights = {};
      response.data.data.forEach(metric => {
        insights[metric.name] = metric.values[0].value;
      });

      return {
        success: true,
        accountId: igAccountId,
        insights
      };

    } catch (error) {
      logger.error('Instagram account insights error:', error);
      throw error;
    }
  }

  /**
   * Facebook Page insights çeker
   */
  async getFacebookPageInsights(userId, pageId, metrics, period = 'day') {
    try {
      const accessToken = await metaAuth.ensureValidToken(userId);

      const defaultMetrics = metrics || [
        'page_impressions',
        'page_engaged_users',
        'page_video_views',
        'page_fan_adds',
        'page_post_engagements'
      ];

      const response = await axios.get(
        `${this.apiBaseURL}${pageId}/insights`,
        {
          params: {
            metric: defaultMetrics.join(','),
            period: period,
            access_token: accessToken
          }
        }
      );

      const insights = {};
      response.data.data.forEach(metric => {
        insights[metric.name] = metric.values[0]?.value || 0;
      });

      return {
        success: true,
        pageId,
        insights
      };

    } catch (error) {
      logger.error('Facebook Page insights error:', error);
      throw error;
    }
  }

  /**
   * Container'ın hazır olmasını bekler
   */
  async waitForContainerReady(igAccountId, containerId, accessToken, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await axios.get(
        `${this.apiBaseURL}${containerId}`,
        {
          params: {
            fields: 'status_code',
            access_token: accessToken
          }
        }
      );

      const status = response.data.status_code;

      if (status === 'FINISHED') {
        return true;
      } else if (status === 'ERROR') {
        throw new Error('Container processing failed');
      }

      // 3 saniye bekle
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    throw new Error('Container processing timeout');
  }

  /**
   * Media permalink çeker
   */
  async getMediaPermalink(mediaId, accessToken) {
    try {
      const response = await axios.get(
        `${this.apiBaseURL}${mediaId}`,
        {
          params: {
            fields: 'permalink',
            access_token: accessToken
          }
        }
      );

      return response.data.permalink;

    } catch (error) {
      logger.error('Get media permalink error:', error);
      return null;
    }
  }

  /**
   * Caption ve hashtag'leri formatlar
   */
  formatCaption(caption, hashtags) {
    let formatted = caption || '';
    
    if (hashtags && hashtags.length > 0) {
      formatted += '\n\n' + hashtags.map(tag => 
        tag.startsWith('#') ? tag : `#${tag}`
      ).join(' ');
    }

    return formatted;
  }

  /**
   * Instagram medya listesi çeker
   */
  async getInstagramMediaList(userId, igAccountId, limit = 25) {
    try {
      const accessToken = await metaAuth.ensureValidToken(userId);

      const response = await axios.get(
        `${this.apiBaseURL}${igAccountId}/media`,
        {
          params: {
            fields: 'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count',
            limit,
            access_token: accessToken
          }
        }
      );

      return {
        success: true,
        media: response.data.data,
        paging: response.data.paging
      };

    } catch (error) {
      logger.error('Instagram media list error:', error);
      throw error;
    }
  }
}

module.exports = new MetaClient();
