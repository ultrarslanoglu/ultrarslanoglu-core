const tiktokClient = require('../api/tiktok');
const metaClient = require('../api/meta');
const youtubeClient = require('../api/youtube');
const xClient = require('../api/x');
const Upload = require('../models/Upload');
const logger = require('../utils/logger');
const path = require('path');

/**
 * Uploader Service
 * Tüm platformlara video/içerik yükleme servisi
 */
class UploaderService {
  /**
   * TikTok'a video yükle
   */
  async uploadToTikTok(userId, videoPath, metadata) {
    try {
      logger.info(`Starting TikTok upload for user ${userId}`);

      const result = await tiktokClient.uploadVideo(userId, videoPath, {
        title: metadata.title,
        description: metadata.description,
        privacyLevel: metadata.privacy || 'PUBLIC_TO_EVERYONE',
        disableDuet: metadata.disableDuet || false,
        disableComment: metadata.disableComment || false,
        disableStitch: metadata.disableStitch || false
      });

      return {
        platform: 'tiktok',
        success: true,
        videoId: result.videoId,
        url: result.shareUrl,
        publishId: result.publishId
      };

    } catch (error) {
      logger.error('TikTok upload failed:', error);
      return {
        platform: 'tiktok',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Instagram'a Reel yükle
   */
  async uploadToInstagram(userId, videoUrl, metadata) {
    try {
      logger.info(`Starting Instagram Reel upload for user ${userId}`);

      if (!metadata.instagramAccountId) {
        throw new Error('Instagram account ID is required');
      }

      const result = await metaClient.uploadInstagramReel(userId, videoUrl, {
        instagramAccountId: metadata.instagramAccountId,
        caption: metadata.caption || metadata.title,
        hashtags: metadata.hashtags || [],
        shareToFeed: metadata.shareToFeed !== false,
        coverUrl: metadata.coverUrl
      });

      return {
        platform: 'instagram',
        success: true,
        mediaId: result.mediaId,
        url: result.permalink
      };

    } catch (error) {
      logger.error('Instagram upload failed:', error);
      return {
        platform: 'instagram',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * YouTube'a video yükle
   */
  async uploadToYouTube(userId, videoPath, metadata) {
    try {
      logger.info(`Starting YouTube upload for user ${userId}`);

      const result = await youtubeClient.uploadVideo(userId, videoPath, {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags || [],
        categoryId: metadata.categoryId || '22',
        privacyStatus: metadata.privacy || 'private',
        language: metadata.language || 'tr',
        thumbnailPath: metadata.thumbnailPath,
        playlistId: metadata.playlistId
      });

      return {
        platform: 'youtube',
        success: true,
        videoId: result.videoId,
        url: result.url
      };

    } catch (error) {
      logger.error('YouTube upload failed:', error);
      return {
        platform: 'youtube',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * X (Twitter)'a video/medya ile tweet at
   */
  async uploadToX(userId, videoPath, metadata) {
    try {
      logger.info(`Starting X (Twitter) upload for user ${userId}`);

      // Önce videoyu yükle
      const mediaResult = await xClient.uploadMedia(userId, videoPath, 'video');

      // Sonra tweet oluştur
      const tweetResult = await xClient.createTweetWithMedia(
        userId,
        metadata.text || metadata.title,
        [mediaResult.mediaId]
      );

      return {
        platform: 'x',
        success: true,
        tweetId: tweetResult.tweetId,
        url: tweetResult.url,
        mediaId: mediaResult.mediaId
      };

    } catch (error) {
      logger.error('X (Twitter) upload failed:', error);
      return {
        platform: 'x',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Çoklu platforma aynı anda yükleme
   */
  async uploadToMultiplePlatforms(userId, uploadId, platforms, videoPath, metadata) {
    try {
      const upload = await Upload.findById(uploadId);
      if (!upload) {
        throw new Error('Upload record not found');
      }

      const results = [];

      // Her platform için paralel upload
      const uploadPromises = platforms.map(async (platform) => {
        try {
          let result;

          switch (platform) {
            case 'tiktok':
              result = await this.uploadToTikTok(userId, videoPath, metadata);
              break;

            case 'instagram':
              // Instagram için public URL gerekli (CDN veya temporary URL)
              const videoUrl = metadata.instagramVideoUrl || metadata.publicVideoUrl;
              if (!videoUrl) {
                throw new Error('Public video URL required for Instagram');
              }
              result = await this.uploadToInstagram(userId, videoUrl, metadata);
              break;

            case 'youtube':
              result = await this.uploadToYouTube(userId, videoPath, metadata);
              break;

            case 'x':
              result = await this.uploadToX(userId, videoPath, metadata);
              break;

            default:
              throw new Error(`Unsupported platform: ${platform}`);
          }

          // Upload modelini güncelle
          const platformData = {
            platform: result.platform,
            status: result.success ? 'success' : 'failed',
            platformPostId: result.videoId || result.mediaId || result.tweetId,
            platformUrl: result.url,
            uploadedAt: result.success ? new Date() : undefined,
            error: result.error,
            metadata: new Map(Object.entries({
              publishId: result.publishId,
              containerId: result.containerId
            }))
          };

          // Platform bilgisini ekle veya güncelle
          const existingPlatformIndex = upload.platforms.findIndex(
            p => p.platform === result.platform
          );

          if (existingPlatformIndex >= 0) {
            upload.platforms[existingPlatformIndex] = platformData;
          } else {
            upload.platforms.push(platformData);
          }

          results.push(result);

        } catch (error) {
          logger.error(`Upload to ${platform} failed:`, error);
          
          // Hata durumunu kaydet
          const platformData = {
            platform: platform,
            status: 'failed',
            error: error.message
          };

          const existingPlatformIndex = upload.platforms.findIndex(
            p => p.platform === platform
          );

          if (existingPlatformIndex >= 0) {
            upload.platforms[existingPlatformIndex] = platformData;
          } else {
            upload.platforms.push(platformData);
          }

          results.push({
            platform,
            success: false,
            error: error.message
          });
        }
      });

      await Promise.all(uploadPromises);

      // Overall status'u güncelle
      upload.updateOverallStatus();
      await upload.save();

      logger.info(`Multi-platform upload completed for user ${userId}`);

      return {
        success: true,
        uploadId,
        results,
        overallStatus: upload.overallStatus
      };

    } catch (error) {
      logger.error('Multi-platform upload error:', error);
      throw error;
    }
  }

  /**
   * Zamanlanmış upload'ları kontrol et ve yayınla
   */
  async processScheduledUploads() {
    try {
      const now = new Date();

      // Zamanlanmış ve henüz yayınlanmamış upload'ları bul
      const scheduledUploads = await Upload.find({
        'scheduling.isScheduled': true,
        'scheduling.publishAt': { $lte: now },
        overallStatus: 'scheduled'
      }).populate('userId');

      logger.info(`Found ${scheduledUploads.length} scheduled uploads to process`);

      for (const upload of scheduledUploads) {
        try {
          // Status'u publishing yap
          upload.overallStatus = 'publishing';
          await upload.save();

          // Yayınlanacak platformları belirle
          const platforms = upload.platforms
            .filter(p => p.status === 'pending')
            .map(p => p.platform);

          // Upload'ı başlat
          await this.uploadToMultiplePlatforms(
            upload.userId._id,
            upload._id,
            platforms,
            upload.video.path,
            {
              title: upload.content.title,
              description: upload.content.description,
              tags: upload.content.tags,
              hashtags: upload.content.tags,
              language: upload.content.language,
              instagramAccountId: upload.userId.connectedPlatforms
                .find(p => p.platform === 'instagram')?.accountId
            }
          );

          logger.info(`Scheduled upload ${upload._id} processed successfully`);

        } catch (error) {
          logger.error(`Failed to process scheduled upload ${upload._id}:`, error);
          
          upload.overallStatus = 'failed';
          await upload.save();
        }
      }

    } catch (error) {
      logger.error('Process scheduled uploads error:', error);
      throw error;
    }
  }

  /**
   * Upload durumunu sorgula
   */
  async getUploadStatus(uploadId) {
    try {
      const upload = await Upload.findById(uploadId);
      
      if (!upload) {
        throw new Error('Upload not found');
      }

      return {
        success: true,
        uploadId: upload._id,
        overallStatus: upload.overallStatus,
        platforms: upload.platforms.map(p => ({
          platform: p.platform,
          status: p.status,
          url: p.platformUrl,
          error: p.error,
          uploadedAt: p.uploadedAt
        })),
        createdAt: upload.createdAt,
        updatedAt: upload.updatedAt
      };

    } catch (error) {
      logger.error('Get upload status error:', error);
      throw error;
    }
  }
}

module.exports = new UploaderService();
