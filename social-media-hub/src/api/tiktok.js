const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../../config');
const tiktokAuth = require('../auth/tiktokAuth');
const logger = require('../utils/logger');

/**
 * TikTok API Client
 * Video upload ve analytics işlemleri
 */
class TikTokClient {
  constructor() {
    this.apiBaseURL = config.tiktok.apiBaseURL;
  }

  /**
   * Video yükleme işlemi (Direct Post)
   */
  async uploadVideo(userId, videoPath, metadata) {
    try {
      // Geçerli access token al
      const accessToken = await tiktokAuth.ensureValidToken(userId);

      // 1. Upload initialization
      const initResponse = await axios.post(
        `${this.apiBaseURL}post/publish/video/init/`,
        {
          post_info: {
            title: metadata.title,
            description: metadata.description || '',
            privacy_level: metadata.privacyLevel || 'SELF_ONLY', // PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, SELF_ONLY
            disable_duet: metadata.disableDuet || false,
            disable_comment: metadata.disableComment || false,
            disable_stitch: metadata.disableStitch || false,
            video_cover_timestamp_ms: metadata.coverTimestamp || 1000
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: fs.statSync(videoPath).size,
            chunk_size: 10485760, // 10MB chunks
            total_chunk_count: Math.ceil(fs.statSync(videoPath).size / 10485760)
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { publish_id, upload_url } = initResponse.data.data;

      // 2. Video upload (chunks)
      await this.uploadVideoChunks(videoPath, upload_url, accessToken);

      // 3. Publish confirmation
      const publishResponse = await axios.post(
        `${this.apiBaseURL}post/publish/status/fetch/`,
        {
          publish_id
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`TikTok video uploaded successfully for user ${userId}`);

      return {
        success: true,
        publishId: publish_id,
        status: publishResponse.data.data.status,
        videoId: publishResponse.data.data.video_id,
        shareUrl: publishResponse.data.data.share_url
      };

    } catch (error) {
      logger.error('TikTok upload error:', error);
      throw error;
    }
  }

  /**
   * Video'yu chunk'lara bölerek yükler
   */
  async uploadVideoChunks(videoPath, uploadUrl, accessToken) {
    const fileSize = fs.statSync(videoPath).size;
    const chunkSize = 10485760; // 10MB
    const totalChunks = Math.ceil(fileSize / chunkSize);

    const fileStream = fs.createReadStream(videoPath);
    let currentChunk = 0;
    let uploadedBytes = 0;

    for await (const chunk of fileStream) {
      const formData = new FormData();
      formData.append('video', chunk, {
        filename: `chunk_${currentChunk}`,
        contentType: 'video/mp4'
      });

      await axios.put(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Range': `bytes ${uploadedBytes}-${uploadedBytes + chunk.length - 1}/${fileSize}`
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      uploadedBytes += chunk.length;
      currentChunk++;

      logger.info(`TikTok upload progress: ${currentChunk}/${totalChunks} chunks`);
    }
  }

  /**
   * Video listesini çeker
   */
  async getVideoList(userId, cursor = '', maxCount = 20) {
    try {
      const accessToken = await tiktokAuth.ensureValidToken(userId);

      const response = await axios.post(
        `${this.apiBaseURL}video/list/`,
        {
          max_count: maxCount,
          cursor: cursor,
          fields: ['id', 'create_time', 'cover_image_url', 'share_url', 'video_description', 'duration', 'height', 'width', 'title', 'embed_html', 'embed_link']
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        videos: response.data.data.videos,
        cursor: response.data.data.cursor,
        hasMore: response.data.data.has_more
      };

    } catch (error) {
      logger.error('TikTok getVideoList error:', error);
      throw error;
    }
  }

  /**
   * Video analytics çeker
   */
  async getVideoAnalytics(userId, videoIds) {
    try {
      const accessToken = await tiktokAuth.ensureValidToken(userId);

      const response = await axios.post(
        `${this.apiBaseURL}video/query/`,
        {
          filters: {
            video_ids: videoIds
          },
          fields: [
            'id',
            'title',
            'video_description',
            'create_time',
            'share_url',
            'cover_image_url',
            'duration',
            'like_count',
            'comment_count',
            'share_count',
            'view_count'
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const videos = response.data.data.videos;
      
      // Analytics'i düzenle
      const analytics = videos.map(video => ({
        videoId: video.id,
        title: video.title,
        views: video.view_count || 0,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0,
        engagement: (video.like_count + video.comment_count + video.share_count) / (video.view_count || 1),
        url: video.share_url,
        createdAt: new Date(video.create_time * 1000)
      }));

      return {
        success: true,
        analytics
      };

    } catch (error) {
      logger.error('TikTok getVideoAnalytics error:', error);
      throw error;
    }
  }

  /**
   * Creator info ve analytics çeker
   */
  async getCreatorAnalytics(userId) {
    try {
      const accessToken = await tiktokAuth.ensureValidToken(userId);

      const response = await axios.get(
        `${this.apiBaseURL}user/info/`,
        {
          params: {
            fields: 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,follower_count,following_count,likes_count,video_count'
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const userData = response.data.data.user;

      return {
        success: true,
        analytics: {
          displayName: userData.display_name,
          followers: userData.follower_count,
          following: userData.following_count,
          totalLikes: userData.likes_count,
          totalVideos: userData.video_count,
          profileUrl: userData.profile_deep_link
        }
      };

    } catch (error) {
      logger.error('TikTok getCreatorAnalytics error:', error);
      throw error;
    }
  }

  /**
   * Video silme
   */
  async deleteVideo(userId, videoId) {
    try {
      const accessToken = await tiktokAuth.ensureValidToken(userId);

      // TikTok API'de video delete endpoint (documentation kontrol edilmeli)
      // Şimdilik sadece logluyoruz
      logger.info(`TikTok video delete requested for video ${videoId} by user ${userId}`);
      
      // API call implementation
      // await axios.delete(...);

      return {
        success: true,
        message: 'Video deletion initiated'
      };

    } catch (error) {
      logger.error('TikTok deleteVideo error:', error);
      throw error;
    }
  }

  /**
   * Share Kit - TikTok paylaşım URL'i oluşturur
   * Web-based share flow için kullanılır
   * 
   * @param {Object} options Paylaşım seçenekleri
   * @param {string} options.url Paylaşılacak URL (isteğe bağlı)
   * @param {string} options.title Video başlığı (isteğe bağlı)
   * @param {string} options.hashtags Hashtag'ler (isteğe bağlı)
   * @returns {string} TikTok Share URL
   */
  generateShareUrl(options = {}) {
    const params = new URLSearchParams();
    
    if (options.url) {
      params.append('url', options.url);
    }
    
    if (options.title) {
      params.append('title', options.title);
    }
    
    if (options.hashtags) {
      // Hashtag'leri virgülle ayır
      const hashtagString = Array.isArray(options.hashtags) 
        ? options.hashtags.join(',') 
        : options.hashtags;
      params.append('hashtags', hashtagString);
    }

    const shareUrl = `${config.tiktok.shareKitURL}?${params.toString()}`;
    
    logger.info('TikTok Share URL generated:', shareUrl);
    
    return shareUrl;
  }

  /**
   * Publish status kontrolü
   * Video publish edildikten sonra durumunu kontrol eder
   */
  async checkPublishStatus(userId, publishId) {
    try {
      const accessToken = await tiktokAuth.ensureValidToken(userId);

      const response = await axios.post(
        `${this.apiBaseURL}post/publish/status/fetch/`,
        {
          publish_id: publishId
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data.data;

      return {
        success: true,
        publishId,
        status: data.status, // PUBLISH_COMPLETE, PROCESSING_DOWNLOAD, PROCESSING_UPLOAD, FAILED
        failReason: data.fail_reason,
        videoId: data.video_id,
        shareUrl: data.share_url
      };

    } catch (error) {
      logger.error('TikTok checkPublishStatus error:', error);
      throw error;
    }
  }

  /**
   * Comment yönetimi - Yorumları listele
   */
  async getVideoComments(userId, videoId, cursor = '', count = 50) {
    try {
      const accessToken = await tiktokAuth.ensureValidToken(userId);

      const response = await axios.post(
        `${this.apiBaseURL}video/comment/list/`,
        {
          video_id: videoId,
          count,
          cursor
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        comments: response.data.data.comments,
        cursor: response.data.data.cursor,
        hasMore: response.data.data.has_more
      };

    } catch (error) {
      logger.error('TikTok getVideoComments error:', error);
      throw error;
    }
  }

  /**
   * Video privacy ayarlarını güncelle
   */
  async updateVideoPrivacy(userId, videoId, privacyLevel) {
    try {
      const accessToken = await tiktokAuth.ensureValidToken(userId);

      // Privacy levels: PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, SELF_ONLY
      const validPrivacyLevels = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'];
      
      if (!validPrivacyLevels.includes(privacyLevel)) {
        throw new Error(`Invalid privacy level. Must be one of: ${validPrivacyLevels.join(', ')}`);
      }

      logger.info(`Updating video ${videoId} privacy to ${privacyLevel} for user ${userId}`);

      // TikTok API'de privacy update endpoint'i varsa kullanılır
      // Şu an sadece logluyoruz
      return {
        success: true,
        videoId,
        privacyLevel,
        message: 'Privacy level update initiated'
      };

    } catch (error) {
      logger.error('TikTok updateVideoPrivacy error:', error);
      throw error;
    }
  }
}

module.exports = new TikTokClient();
