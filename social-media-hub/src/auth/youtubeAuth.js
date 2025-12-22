const { google } = require('googleapis');
const config = require('../../config');
const Token = require('../models/Token');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Google (YouTube) OAuth Service
 * YouTube Data API v3 entegrasyonu
 */
class YouTubeAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  /**
   * OAuth akışını başlatmak için authorization URL'ini oluşturur
   */
  getAuthorizationUrl(userId) {
    const csrfState = crypto.randomBytes(16).toString('hex');

    // State'i sakla
    global.authStates = global.authStates || {};
    global.authStates[csrfState] = {
      userId,
      platform: 'youtube',
      createdAt: Date.now()
    };

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Refresh token almak için
      scope: config.google.scope,
      state: csrfState,
      prompt: 'consent' // Her zaman consent ekranı göster (refresh token için)
    });

    return authUrl;
  }

  /**
   * Authorization code'u access token'a çevirir
   */
  async handleCallback(code, state) {
    try {
      // State validation
      const stateData = global.authStates?.[state];
      if (!stateData) {
        throw new Error('Invalid state parameter');
      }

      delete global.authStates[state];

      // Token exchange
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Kullanıcı bilgilerini al
      const userInfo = await this.getUserInfo(tokens.access_token);

      // YouTube kanal bilgilerini al
      const channelInfo = await this.getChannelInfo(tokens.access_token);

      // Token'ı veritabanına kaydet
      const expiresAt = new Date(tokens.expiry_date);
      
      const token = await Token.findOneAndUpdate(
        { userId: stateData.userId, platform: 'youtube' },
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenType: tokens.token_type,
          expiresAt,
          scope: tokens.scope.split(' '),
          platformUserId: channelInfo.id,
          platformUsername: channelInfo.title,
          isActive: true,
          metadata: {
            email: userInfo.email,
            channelId: channelInfo.id,
            channelTitle: channelInfo.title,
            channelDescription: channelInfo.description,
            subscriberCount: channelInfo.subscriberCount,
            videoCount: channelInfo.videoCount,
            viewCount: channelInfo.viewCount,
            thumbnail: channelInfo.thumbnail
          }
        },
        { upsert: true, new: true }
      );

      logger.info(`YouTube OAuth successful for user ${stateData.userId}`);

      return {
        success: true,
        token,
        userInfo,
        channelInfo
      };

    } catch (error) {
      logger.error('YouTube OAuth error:', error);
      throw error;
    }
  }

  /**
   * Access token ile kullanıcı bilgilerini çeker
   */
  async getUserInfo(accessToken) {
    try {
      const oauth2 = google.oauth2({
        version: 'v2',
        auth: this.oauth2Client
      });

      this.oauth2Client.setCredentials({ access_token: accessToken });

      const { data } = await oauth2.userinfo.get();

      return data;

    } catch (error) {
      logger.error('YouTube getUserInfo error:', error);
      throw error;
    }
  }

  /**
   * YouTube kanal bilgilerini çeker
   */
  async getChannelInfo(accessToken) {
    try {
      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      this.oauth2Client.setCredentials({ access_token: accessToken });

      const response = await youtube.channels.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        mine: true
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('No YouTube channel found');
      }

      const channel = response.data.items[0];

      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        publishedAt: channel.snippet.publishedAt,
        thumbnail: channel.snippet.thumbnails.default.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        videoCount: parseInt(channel.statistics.videoCount),
        viewCount: parseInt(channel.statistics.viewCount)
      };

    } catch (error) {
      logger.error('YouTube getChannelInfo error:', error);
      throw error;
    }
  }

  /**
   * Refresh token ile yeni access token alır
   */
  async refreshAccessToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return {
        accessToken: credentials.access_token,
        expiresAt: new Date(credentials.expiry_date)
      };

    } catch (error) {
      logger.error('YouTube token refresh error:', error);
      throw error;
    }
  }

  /**
   * OAuth bağlantısını iptal eder
   */
  async revokeAccess(userId) {
    try {
      const token = await Token.findOne({ 
        userId, 
        platform: 'youtube',
        isActive: true 
      }).select('+accessToken');

      if (!token) {
        throw new Error('No active YouTube token found');
      }

      // Google token'ı revoke et
      await this.oauth2Client.revokeToken(token.accessToken);

      token.isActive = false;
      await token.save();

      logger.info(`YouTube access revoked for user ${userId}`);

      return { success: true };

    } catch (error) {
      logger.error('YouTube revoke error:', error);
      throw error;
    }
  }

  /**
   * Token'ın geçerliliğini kontrol eder ve gerekirse yeniler
   */
  async ensureValidToken(userId) {
    try {
      const token = await Token.findOne({ 
        userId, 
        platform: 'youtube',
        isActive: true 
      }).select('+accessToken +refreshToken');

      if (!token) {
        throw new Error('No YouTube token found');
      }

      // Token süresi dolmamışsa direkt döndür
      if (!token.needsRefresh()) {
        this.oauth2Client.setCredentials({ access_token: token.accessToken });
        return token.accessToken;
      }

      // Token yenileme gerekiyor
      logger.info(`Refreshing YouTube token for user ${userId}`);
      const newTokenData = await this.refreshAccessToken(token.refreshToken);

      // Yeni token'ı kaydet
      token.accessToken = newTokenData.accessToken;
      token.expiresAt = newTokenData.expiresAt;
      await token.save();

      this.oauth2Client.setCredentials({ access_token: token.accessToken });
      return token.accessToken;

    } catch (error) {
      logger.error('YouTube ensureValidToken error:', error);
      throw error;
    }
  }

  /**
   * OAuth2Client'ı döndürür (upload işlemleri için)
   */
  getOAuth2Client(accessToken) {
    const client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
    client.setCredentials({ access_token: accessToken });
    return client;
  }
}

module.exports = new YouTubeAuthService();
