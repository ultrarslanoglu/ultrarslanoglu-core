const tiktokClient = require('../api/tiktok');
const metaClient = require('../api/meta');
const youtubeClient = require('../api/youtube');
const xClient = require('../api/x');
const Upload = require('../models/Upload');
const Token = require('../models/Token');
const logger = require('../utils/logger');

/**
 * Analytics Service
 * Tüm platformlardan performans verilerini çeker ve analiz eder
 */
class AnalyticsService {
  /**
   * TikTok istatistiklerini çeker
   */
  async getTikTokStats(userId, videoIds = null) {
    try {
      logger.info(`Fetching TikTok stats for user ${userId}`);

      // Video ID'ler verilmediyse son upload'ları kullan
      if (!videoIds) {
        const uploads = await Upload.find({
          userId,
          'platforms.platform': 'tiktok',
          'platforms.status': 'success'
        })
          .sort({ createdAt: -1 })
          .limit(10);

        videoIds = uploads
          .map(u => u.platforms.find(p => p.platform === 'tiktok')?.platformPostId)
          .filter(Boolean);
      }

      if (videoIds.length === 0) {
        return {
          platform: 'tiktok',
          videos: [],
          summary: this.getEmptySummary()
        };
      }

      // Video analytics çek
      const analyticsResult = await tiktokClient.getVideoAnalytics(userId, videoIds);
      
      // Creator analytics çek
      const creatorResult = await tiktokClient.getCreatorAnalytics(userId);

      // Summary oluştur
      const summary = this.calculateSummary(analyticsResult.analytics);

      return {
        platform: 'tiktok',
        videos: analyticsResult.analytics,
        creator: creatorResult.analytics,
        summary
      };

    } catch (error) {
      logger.error('TikTok stats error:', error);
      throw error;
    }
  }

  /**
   * Instagram istatistiklerini çeker
   */
  async getInstagramStats(userId, igAccountId, mediaIds = null) {
    try {
      logger.info(`Fetching Instagram stats for user ${userId}`);

      if (!igAccountId) {
        const token = await Token.findOne({
          userId,
          platform: 'meta',
          isActive: true
        });

        if (!token || !token.metadata?.instagramAccounts?.length) {
          throw new Error('No Instagram account found');
        }

        igAccountId = token.metadata.instagramAccounts[0].instagramId;
      }

      // Media listesini çek
      const mediaList = await metaClient.getInstagramMediaList(userId, igAccountId, 25);

      // Her media için insights çek
      const videosWithInsights = [];

      for (const media of mediaList.media) {
        if (media.media_type === 'VIDEO' || media.media_type === 'REELS') {
          try {
            const insights = await metaClient.getInstagramMediaInsights(
              userId,
              media.id,
              ['impressions', 'reach', 'likes', 'comments', 'shares', 'saves', 'plays']
            );

            videosWithInsights.push({
              mediaId: media.id,
              caption: media.caption,
              url: media.permalink,
              createdAt: media.timestamp,
              ...insights.insights
            });
          } catch (error) {
            logger.warn(`Failed to get insights for media ${media.id}:`, error.message);
          }
        }
      }

      // Account insights çek
      const accountInsights = await metaClient.getInstagramAccountInsights(
        userId,
        igAccountId,
        ['impressions', 'reach', 'follower_count', 'profile_views'],
        'day'
      );

      // Summary oluştur
      const summary = {
        totalVideos: videosWithInsights.length,
        totalImpressions: videosWithInsights.reduce((sum, v) => sum + (v.impressions || 0), 0),
        totalReach: videosWithInsights.reduce((sum, v) => sum + (v.reach || 0), 0),
        totalLikes: videosWithInsights.reduce((sum, v) => sum + (v.likes || 0), 0),
        totalComments: videosWithInsights.reduce((sum, v) => sum + (v.comments || 0), 0),
        totalShares: videosWithInsights.reduce((sum, v) => sum + (v.shares || 0), 0),
        totalSaves: videosWithInsights.reduce((sum, v) => sum + (v.saves || 0), 0),
        averageEngagement: this.calculateAverageEngagement(videosWithInsights)
      };

      return {
        platform: 'instagram',
        videos: videosWithInsights,
        account: accountInsights.insights,
        summary
      };

    } catch (error) {
      logger.error('Instagram stats error:', error);
      throw error;
    }
  }

  /**
   * YouTube istatistiklerini çeker
   */
  async getYouTubeStats(userId, videoIds = null) {
    try {
      logger.info(`Fetching YouTube stats for user ${userId}`);

      // Video ID'ler verilmediyse son upload'ları kullan
      if (!videoIds) {
        const uploads = await Upload.find({
          userId,
          'platforms.platform': 'youtube',
          'platforms.status': 'success'
        })
          .sort({ createdAt: -1 })
          .limit(10);

        videoIds = uploads
          .map(u => u.platforms.find(p => p.platform === 'youtube')?.platformPostId)
          .filter(Boolean);
      }

      if (videoIds.length === 0) {
        return {
          platform: 'youtube',
          videos: [],
          summary: this.getEmptySummary()
        };
      }

      // Video analytics çek
      const analyticsResult = await youtubeClient.getVideoAnalytics(userId, videoIds);

      // Channel analytics çek (son 30 gün)
      const channelResult = await youtubeClient.getChannelAnalytics(userId);

      // Summary oluştur
      const summary = this.calculateSummary(analyticsResult.analytics);

      return {
        platform: 'youtube',
        videos: analyticsResult.analytics,
        channel: channelResult.analytics,
        summary
      };

    } catch (error) {
      logger.error('YouTube stats error:', error);
      throw error;
    }
  }

  /**
   * X (Twitter) istatistiklerini çeker
   */
  async getXStats(userId, tweetIds = null) {
    try {
      logger.info(`Fetching X (Twitter) stats for user ${userId}`);

      // Tweet ID'ler verilmediyse son upload'ları kullan
      if (!tweetIds) {
        const uploads = await Upload.find({
          userId,
          'platforms.platform': 'x',
          'platforms.status': 'success'
        })
          .sort({ createdAt: -1 })
          .limit(10);

        tweetIds = uploads
          .map(u => u.platforms.find(p => p.platform === 'x')?.platformPostId)
          .filter(Boolean);
      }

      if (tweetIds.length === 0) {
        return {
          platform: 'x',
          tweets: [],
          summary: this.getEmptySummary()
        };
      }

      // Tweet analytics çek
      const analyticsResult = await xClient.getTweetAnalytics(userId, tweetIds);

      // Summary oluştur
      const summary = {
        totalTweets: analyticsResult.analytics.length,
        totalImpressions: analyticsResult.analytics.reduce((sum, t) => sum + t.impressions, 0),
        totalLikes: analyticsResult.analytics.reduce((sum, t) => sum + t.likes, 0),
        totalRetweets: analyticsResult.analytics.reduce((sum, t) => sum + t.retweets, 0),
        totalReplies: analyticsResult.analytics.reduce((sum, t) => sum + t.replies, 0),
        totalQuotes: analyticsResult.analytics.reduce((sum, t) => sum + t.quotes, 0),
        averageEngagement: analyticsResult.analytics.reduce((sum, t) => sum + t.engagement, 0) / 
                          analyticsResult.analytics.length
      };

      return {
        platform: 'x',
        tweets: analyticsResult.analytics,
        summary
      };

    } catch (error) {
      logger.error('X (Twitter) stats error:', error);
      throw error;
    }
  }

  /**
   * Tüm platformların istatistiklerini toplu olarak çeker
   */
  async getAllStats(userId) {
    try {
      logger.info(`Fetching all platform stats for user ${userId}`);

      // Kullanıcının bağlı platformlarını bul
      const tokens = await Token.find({
        userId,
        isActive: true
      });

      const connectedPlatforms = tokens.map(t => t.platform);

      const stats = {};

      // Her platform için stats çek (paralel)
      const promises = [];

      if (connectedPlatforms.includes('tiktok')) {
        promises.push(
          this.getTikTokStats(userId)
            .then(result => { stats.tiktok = result; })
            .catch(error => { stats.tiktok = { error: error.message }; })
        );
      }

      if (connectedPlatforms.includes('meta')) {
        promises.push(
          this.getInstagramStats(userId)
            .then(result => { stats.instagram = result; })
            .catch(error => { stats.instagram = { error: error.message }; })
        );
      }

      if (connectedPlatforms.includes('youtube')) {
        promises.push(
          this.getYouTubeStats(userId)
            .then(result => { stats.youtube = result; })
            .catch(error => { stats.youtube = { error: error.message }; })
        );
      }

      if (connectedPlatforms.includes('x')) {
        promises.push(
          this.getXStats(userId)
            .then(result => { stats.x = result; })
            .catch(error => { stats.x = { error: error.message }; })
        );
      }

      await Promise.all(promises);

      // Genel özet oluştur
      const overallSummary = this.createOverallSummary(stats);

      return {
        success: true,
        stats,
        overallSummary,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Get all stats error:', error);
      throw error;
    }
  }

  /**
   * Upload'a ait analytics'leri günceller
   */
  async syncUploadAnalytics(uploadId) {
    try {
      const upload = await Upload.findById(uploadId);
      
      if (!upload) {
        throw new Error('Upload not found');
      }

      let totalViews = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;

      // Her platform için analytics çek
      for (const platform of upload.platforms) {
        if (platform.status !== 'success') continue;

        try {
          let analytics;

          switch (platform.platform) {
            case 'tiktok':
              const tiktokResult = await tiktokClient.getVideoAnalytics(
                upload.userId,
                [platform.platformPostId]
              );
              analytics = tiktokResult.analytics[0];
              break;

            case 'instagram':
              const igResult = await metaClient.getInstagramMediaInsights(
                upload.userId,
                platform.platformPostId
              );
              analytics = {
                views: igResult.insights.plays || 0,
                likes: igResult.insights.likes || 0,
                comments: igResult.insights.comments || 0,
                shares: igResult.insights.shares || 0
              };
              break;

            case 'youtube':
              const ytResult = await youtubeClient.getVideoAnalytics(
                upload.userId,
                [platform.platformPostId]
              );
              analytics = ytResult.analytics[0];
              break;

            case 'x':
              const xResult = await xClient.getTweetAnalytics(
                upload.userId,
                [platform.platformPostId]
              );
              analytics = {
                views: xResult.analytics[0].impressions,
                likes: xResult.analytics[0].likes,
                comments: xResult.analytics[0].replies,
                shares: xResult.analytics[0].retweets
              };
              break;
          }

          if (analytics) {
            totalViews += analytics.views || 0;
            totalLikes += analytics.likes || 0;
            totalComments += analytics.comments || 0;
            totalShares += analytics.shares || 0;
          }

        } catch (error) {
          logger.warn(`Failed to sync analytics for ${platform.platform}:`, error.message);
        }
      }

      // Upload analytics'i güncelle
      upload.analytics = {
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        engagement: totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 : 0,
        lastSyncedAt: new Date()
      };

      await upload.save();

      logger.info(`Analytics synced for upload ${uploadId}`);

      return {
        success: true,
        analytics: upload.analytics
      };

    } catch (error) {
      logger.error('Sync upload analytics error:', error);
      throw error;
    }
  }

  /**
   * Summary hesaplama yardımcı fonksiyonu
   */
  calculateSummary(analytics) {
    if (!analytics || analytics.length === 0) {
      return this.getEmptySummary();
    }

    return {
      totalVideos: analytics.length,
      totalViews: analytics.reduce((sum, a) => sum + (a.views || 0), 0),
      totalLikes: analytics.reduce((sum, a) => sum + (a.likes || 0), 0),
      totalComments: analytics.reduce((sum, a) => sum + (a.comments || 0), 0),
      totalShares: analytics.reduce((sum, a) => sum + (a.shares || 0), 0),
      averageEngagement: analytics.reduce((sum, a) => sum + (a.engagement || 0), 0) / analytics.length
    };
  }

  /**
   * Boş summary döndürür
   */
  getEmptySummary() {
    return {
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      averageEngagement: 0
    };
  }

  /**
   * Average engagement hesaplama
   */
  calculateAverageEngagement(videos) {
    if (videos.length === 0) return 0;

    const totalEngagement = videos.reduce((sum, v) => {
      const impressions = v.impressions || v.reach || v.views || 1;
      const interactions = (v.likes || 0) + (v.comments || 0) + (v.shares || 0) + (v.saves || 0);
      return sum + (interactions / impressions);
    }, 0);

    return (totalEngagement / videos.length) * 100;
  }

  /**
   * Genel özet oluşturma
   */
  createOverallSummary(stats) {
    const summary = {
      totalContent: 0,
      totalEngagement: 0,
      platformBreakdown: {}
    };

    for (const [platform, data] of Object.entries(stats)) {
      if (data.error) continue;

      const platformSummary = data.summary || {};
      summary.totalContent += platformSummary.totalVideos || platformSummary.totalTweets || 0;
      summary.platformBreakdown[platform] = platformSummary;
      
      const engagement = 
        (platformSummary.totalLikes || 0) +
        (platformSummary.totalComments || 0) +
        (platformSummary.totalShares || 0);
      
      summary.totalEngagement += engagement;
    }

    return summary;
  }
}

module.exports = new AnalyticsService();
