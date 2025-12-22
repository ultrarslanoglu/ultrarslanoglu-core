const axios = require('axios');
const config = require('../../config');
const analyticsService = require('../services/analytics');
const logger = require('../utils/logger');

/**
 * AI Decision Engine
 * Performans verilerini analiz ederek otomatik kararlar verir
 * 
 * Bu engine, sosyal medya içerik stratejilerini optimize etmek için
 * performans metriklerini değerlendirir ve öneriler sunar.
 */
class DecisionEngine {
  constructor() {
    this.aiEndpoint = config.ai.endpoint;
    this.confidenceThreshold = config.ai.confidenceThreshold;
  }

  /**
   * Ana karar verme fonksiyonu
   * Performans verilerini analiz eder ve öneriler sunar
   */
  async makeDecision(userId, contentMetadata) {
    try {
      logger.info(`Making AI decision for user ${userId}`);

      // 1. Geçmiş performans verilerini topla
      const performanceData = await this.gatherPerformanceData(userId);

      // 2. İçerik analizi yap
      const contentAnalysis = this.analyzeContent(contentMetadata);

      // 3. Platform karşılaştırması
      const platformComparison = this.comparePlatforms(performanceData);

      // 4. Timing analizi
      const timingAnalysis = this.analyzeOptimalTiming(performanceData);

      // 5. AI model'e gönder (opsiyonel - harici ML servis varsa)
      let aiPrediction = null;
      if (this.aiEndpoint) {
        try {
          aiPrediction = await this.getAIPrediction({
            performance: performanceData,
            content: contentAnalysis,
            platforms: platformComparison,
            timing: timingAnalysis
          });
        } catch (error) {
          logger.warn('AI prediction service unavailable, using rule-based decisions');
        }
      }

      // 6. Karar oluştur
      const decision = this.buildDecision(
        performanceData,
        contentAnalysis,
        platformComparison,
        timingAnalysis,
        aiPrediction
      );

      logger.info(`AI decision completed for user ${userId}`);

      return decision;

    } catch (error) {
      logger.error('AI decision error:', error);
      throw error;
    }
  }

  /**
   * Geçmiş performans verilerini toplar
   */
  async gatherPerformanceData(userId) {
    try {
      const stats = await analyticsService.getAllStats(userId);

      return {
        tiktok: this.extractPlatformMetrics(stats.stats.tiktok),
        instagram: this.extractPlatformMetrics(stats.stats.instagram),
        youtube: this.extractPlatformMetrics(stats.stats.youtube),
        x: this.extractPlatformMetrics(stats.stats.x),
        overall: stats.overallSummary
      };

    } catch (error) {
      logger.error('Gather performance data error:', error);
      return {};
    }
  }

  /**
   * Platform metriklerini çıkarır
   */
  extractPlatformMetrics(platformData) {
    if (!platformData || platformData.error) {
      return {
        available: false,
        averageEngagement: 0,
        totalContent: 0
      };
    }

    const summary = platformData.summary || {};

    return {
      available: true,
      averageEngagement: summary.averageEngagement || 0,
      totalViews: summary.totalViews || summary.totalImpressions || 0,
      totalLikes: summary.totalLikes || 0,
      totalComments: summary.totalComments || 0,
      totalShares: summary.totalShares || 0,
      totalContent: summary.totalVideos || summary.totalTweets || 0,
      performanceScore: this.calculatePerformanceScore(summary)
    };
  }

  /**
   * Performans skoru hesaplar (0-100)
   */
  calculatePerformanceScore(summary) {
    if (!summary.totalViews && !summary.totalImpressions) return 0;

    const views = summary.totalViews || summary.totalImpressions || 0;
    const engagement = summary.averageEngagement || 0;
    const contentCount = summary.totalVideos || summary.totalTweets || 1;

    // Normalize edilmiş metrikler
    const normalizedViews = Math.min(views / 10000, 1) * 40; // Max 40 puan
    const normalizedEngagement = Math.min(engagement, 10) * 4; // Max 40 puan
    const normalizedConsistency = Math.min(contentCount / 50, 1) * 20; // Max 20 puan

    return Math.round(normalizedViews + normalizedEngagement + normalizedConsistency);
  }

  /**
   * İçerik analizi yapar
   */
  analyzeContent(metadata) {
    const analysis = {
      hasTitle: !!metadata.title,
      hasDescription: !!metadata.description,
      hasTags: metadata.tags && metadata.tags.length > 0,
      hasHashtags: metadata.hashtags && metadata.hashtags.length > 0,
      titleLength: metadata.title?.length || 0,
      descriptionLength: metadata.description?.length || 0,
      tagCount: metadata.tags?.length || 0,
      hashtagCount: metadata.hashtags?.length || 0
    };

    // İçerik kalite skoru (0-100)
    let qualityScore = 0;
    
    if (analysis.hasTitle) qualityScore += 20;
    if (analysis.hasDescription) qualityScore += 20;
    if (analysis.hasTags) qualityScore += 15;
    if (analysis.hasHashtags) qualityScore += 15;
    
    // Optimum uzunluklar
    if (analysis.titleLength >= 20 && analysis.titleLength <= 100) qualityScore += 15;
    if (analysis.descriptionLength >= 50) qualityScore += 15;

    analysis.qualityScore = qualityScore;

    return analysis;
  }

  /**
   * Platformları karşılaştırır ve sıralar
   */
  comparePlatforms(performanceData) {
    const platforms = ['tiktok', 'instagram', 'youtube', 'x'];
    
    const comparison = platforms
      .filter(p => performanceData[p]?.available)
      .map(platform => ({
        platform,
        performanceScore: performanceData[platform].performanceScore,
        averageEngagement: performanceData[platform].averageEngagement,
        totalContent: performanceData[platform].totalContent
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore);

    return {
      ranked: comparison,
      bestPlatform: comparison[0]?.platform || null,
      worstPlatform: comparison[comparison.length - 1]?.platform || null,
      recommendations: this.generatePlatformRecommendations(comparison)
    };
  }

  /**
   * Platform önerileri oluşturur
   */
  generatePlatformRecommendations(rankedPlatforms) {
    const recommendations = [];

    rankedPlatforms.forEach((platform, index) => {
      if (platform.performanceScore >= 70) {
        recommendations.push({
          platform: platform.platform,
          priority: 'high',
          reason: `${platform.platform} has excellent performance (${platform.performanceScore}/100)`
        });
      } else if (platform.performanceScore >= 40) {
        recommendations.push({
          platform: platform.platform,
          priority: 'medium',
          reason: `${platform.platform} shows moderate performance (${platform.performanceScore}/100)`
        });
      } else if (platform.totalContent < 5) {
        recommendations.push({
          platform: platform.platform,
          priority: 'low',
          reason: `Not enough data on ${platform.platform} to make reliable predictions`
        });
      } else {
        recommendations.push({
          platform: platform.platform,
          priority: 'low',
          reason: `${platform.platform} underperforming (${platform.performanceScore}/100) - consider strategy review`
        });
      }
    });

    return recommendations;
  }

  /**
   * Optimal zamanlama analizi
   */
  analyzeOptimalTiming(performanceData) {
    // Bu kısım daha gelişmiş zaman serisi analizi gerektirir
    // Şimdilik genel öneriler
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Pazar

    const recommendations = {
      immediate: false,
      suggestedTime: null,
      reasoning: []
    };

    // Hafta içi vs hafta sonu
    const isWeekend = currentDay === 0 || currentDay === 6;

    // TikTok: Genç kitle, öğleden sonra ve akşam
    // Instagram: Öğle arası ve akşam
    // YouTube: Akşam ve hafta sonu
    // X: İş saatleri ve akşam

    if (currentHour >= 18 && currentHour <= 22) {
      recommendations.immediate = true;
      recommendations.reasoning.push('Prime time for social media engagement (6 PM - 10 PM)');
    } else if (currentHour >= 11 && currentHour <= 14) {
      recommendations.immediate = true;
      recommendations.reasoning.push('Lunch time - good engagement window');
    } else {
      // En yakın prime time'ı öner
      let suggestedHour = 19; // Default 7 PM
      
      if (currentHour < 11) {
        suggestedHour = 12;
      } else if (currentHour >= 14 && currentHour < 18) {
        suggestedHour = 19;
      } else {
        // Gece ise ertesi gün öğle
        suggestedHour = 12;
        now.setDate(now.getDate() + 1);
      }

      const suggestedTime = new Date(now);
      suggestedTime.setHours(suggestedHour, 0, 0, 0);
      
      recommendations.suggestedTime = suggestedTime;
      recommendations.reasoning.push(
        `Current time not optimal. Suggested time: ${suggestedTime.toLocaleString('tr-TR')}`
      );
    }

    if (isWeekend) {
      recommendations.reasoning.push('Weekend typically has higher engagement');
    }

    return recommendations;
  }

  /**
   * Harici AI servisten tahmin alır
   */
  async getAIPrediction(data) {
    try {
      const response = await axios.post(
        this.aiEndpoint,
        data,
        {
          timeout: config.ai.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        available: true,
        confidence: response.data.confidence,
        predictions: response.data.predictions,
        suggestions: response.data.suggestions
      };

    } catch (error) {
      logger.error('AI prediction service error:', error);
      return { available: false };
    }
  }

  /**
   * Final karar oluşturur
   */
  buildDecision(performance, content, platforms, timing, aiPrediction) {
    const decision = {
      score: 0,
      confidence: 0,
      recommendations: [],
      suggestedPlatforms: [],
      suggestedTiming: null,
      contentOptimizations: [],
      analysis: {
        content: content,
        platforms: platforms,
        timing: timing
      }
    };

    // İçerik kalitesi
    decision.score += content.qualityScore * 0.3;

    // Platform seçimi
    const topPlatforms = platforms.ranked
      .filter(p => p.performanceScore >= 40)
      .slice(0, 3)
      .map(p => p.platform);

    if (topPlatforms.length === 0) {
      // Hiç veri yoksa veya performans düşükse tüm platformları öner
      decision.suggestedPlatforms = ['tiktok', 'instagram', 'youtube', 'x'];
      decision.recommendations.push('No sufficient performance data - publishing to all platforms');
    } else {
      decision.suggestedPlatforms = topPlatforms;
      decision.recommendations.push(
        `Focus on top performing platforms: ${topPlatforms.join(', ')}`
      );
      decision.score += 30;
    }

    // Zamanlama
    if (timing.immediate) {
      decision.suggestedTiming = new Date();
      decision.recommendations.push('Optimal time for publishing - proceed immediately');
      decision.score += 20;
    } else {
      decision.suggestedTiming = timing.suggestedTime;
      decision.recommendations.push(...timing.reasoning);
      decision.score += 10;
    }

    // İçerik optimizasyonu önerileri
    if (!content.hasTitle || content.titleLength < 20) {
      decision.contentOptimizations.push('Add a compelling title (20-100 characters)');
    }
    if (!content.hasDescription || content.descriptionLength < 50) {
      decision.contentOptimizations.push('Add detailed description (50+ characters)');
    }
    if (!content.hasTags) {
      decision.contentOptimizations.push('Add relevant tags for better discoverability');
    }
    if (!content.hasHashtags) {
      decision.contentOptimizations.push('Add trending hashtags to increase reach');
    }

    // AI prediction varsa entegre et
    if (aiPrediction?.available && aiPrediction.confidence >= this.confidenceThreshold) {
      decision.score += 20;
      decision.confidence = aiPrediction.confidence;
      decision.recommendations.push('AI model predictions integrated');
      
      if (aiPrediction.suggestions) {
        decision.recommendations.push(...aiPrediction.suggestions);
      }
    } else {
      decision.confidence = Math.min(decision.score / 100, 0.85);
      decision.recommendations.push('Using rule-based decision making');
    }

    // Platform-spesifik öneriler
    decision.recommendations.push(...platforms.recommendations.map(r => 
      `${r.platform}: ${r.reason}`
    ));

    // Final skoru normalize et (0-100)
    decision.score = Math.min(Math.round(decision.score), 100);

    return decision;
  }

  /**
   * Performans trend analizi
   */
  async analyzeTrends(userId, platform, days = 30) {
    try {
      // Son X günün verilerini çek ve trend analizi yap
      // Bu fonksiyon zaman serisi analizi için genişletilebilir
      
      logger.info(`Analyzing ${platform} trends for user ${userId} (${days} days)`);

      const stats = await analyticsService.getAllStats(userId);
      const platformData = stats.stats[platform];

      if (!platformData || platformData.error) {
        return {
          trend: 'unknown',
          reason: 'Insufficient data'
        };
      }

      // Basit trend analizi
      const avgEngagement = platformData.summary?.averageEngagement || 0;
      
      let trend = 'stable';
      if (avgEngagement > 5) {
        trend = 'growing';
      } else if (avgEngagement < 2) {
        trend = 'declining';
      }

      return {
        trend,
        averageEngagement: avgEngagement,
        totalContent: platformData.summary?.totalVideos || 0,
        recommendation: this.getTrendRecommendation(trend)
      };

    } catch (error) {
      logger.error('Analyze trends error:', error);
      throw error;
    }
  }

  /**
   * Trend'e göre öneri oluşturur
   */
  getTrendRecommendation(trend) {
    const recommendations = {
      growing: 'Great momentum! Continue your current content strategy.',
      stable: 'Consistent performance. Consider experimenting with new content formats.',
      declining: 'Performance declining. Review content strategy and posting times.',
      unknown: 'Not enough data to determine trend.'
    };

    return recommendations[trend] || recommendations.unknown;
  }
}

module.exports = new DecisionEngine();
