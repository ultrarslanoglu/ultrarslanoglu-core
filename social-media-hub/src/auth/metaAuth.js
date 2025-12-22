const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config');
const Token = require('../models/Token');
const logger = require('../utils/logger');

/**
 * Meta (Facebook & Instagram) OAuth Service
 * Facebook Login ve Instagram Basic Display API entegrasyonu
 */
class MetaAuthService {
  constructor() {
    this.appId = config.meta.appId;
    this.appSecret = config.meta.appSecret;
    this.redirectUri = config.meta.redirectUri;
    this.scope = config.meta.scope;
    this.authorizationURL = config.meta.authorizationURL;
    this.tokenURL = config.meta.tokenURL;
    this.apiBaseURL = config.meta.apiBaseURL;
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
      platform: 'meta',
      createdAt: Date.now()
    };

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      state: csrfState,
      scope: this.scope,
      response_type: 'code'
    });

    return `${this.authorizationURL}?${params.toString()}`;
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

      // Short-lived access token al
      const tokenResponse = await axios.get(this.tokenURL, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: this.redirectUri,
          code
        }
      });

      const shortToken = tokenResponse.data.access_token;

      // Long-lived access token'a çevir
      const longTokenResponse = await axios.get(`${this.apiBaseURL}oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortToken
        }
      });

      const tokenData = longTokenResponse.data;

      // Kullanıcı bilgilerini al
      const userInfo = await this.getUserInfo(tokenData.access_token);

      // Instagram hesaplarını al
      const instagramAccounts = await this.getInstagramAccounts(tokenData.access_token, userInfo.id);

      // Token'ı veritabanına kaydet
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      
      const token = await Token.findOneAndUpdate(
        { userId: stateData.userId, platform: 'meta' },
        {
          accessToken: tokenData.access_token,
          tokenType: tokenData.token_type || 'Bearer',
          expiresAt,
          scope: this.scope.split(','),
          platformUserId: userInfo.id,
          platformUsername: userInfo.name,
          isActive: true,
          metadata: {
            email: userInfo.email,
            instagramAccounts: instagramAccounts,
            pages: userInfo.accounts?.data || []
          }
        },
        { upsert: true, new: true }
      );

      logger.info(`Meta OAuth successful for user ${stateData.userId}`);

      return {
        success: true,
        token,
        userInfo,
        instagramAccounts
      };

    } catch (error) {
      logger.error('Meta OAuth error:', error);
      throw error;
    }
  }

  /**
   * Access token ile kullanıcı bilgilerini çeker
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.apiBaseURL}me`, {
        params: {
          fields: 'id,name,email,accounts{id,name,access_token,instagram_business_account}',
          access_token: accessToken
        }
      });

      return response.data;

    } catch (error) {
      logger.error('Meta getUserInfo error:', error);
      throw error;
    }
  }

  /**
   * Kullanıcının Instagram Business hesaplarını çeker
   */
  async getInstagramAccounts(accessToken, userId) {
    try {
      const response = await axios.get(`${this.apiBaseURL}${userId}/accounts`, {
        params: {
          fields: 'instagram_business_account{id,username,profile_picture_url,followers_count}',
          access_token: accessToken
        }
      });

      const accounts = [];
      
      if (response.data.data) {
        for (const page of response.data.data) {
          if (page.instagram_business_account) {
            accounts.push({
              pageId: page.id,
              instagramId: page.instagram_business_account.id,
              username: page.instagram_business_account.username,
              profilePicture: page.instagram_business_account.profile_picture_url,
              followersCount: page.instagram_business_account.followers_count
            });
          }
        }
      }

      return accounts;

    } catch (error) {
      logger.error('Meta getInstagramAccounts error:', error);
      return [];
    }
  }

  /**
   * Token'ı yeniler (Meta long-lived token'lar 60 gün geçerlidir)
   */
  async refreshAccessToken(currentToken) {
    try {
      const response = await axios.get(`${this.apiBaseURL}oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: currentToken
        }
      });

      const tokenData = response.data;
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      return {
        accessToken: tokenData.access_token,
        expiresAt
      };

    } catch (error) {
      logger.error('Meta token refresh error:', error);
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
        platform: 'meta',
        isActive: true 
      }).select('+accessToken');

      if (!token) {
        throw new Error('No active Meta token found');
      }

      // Meta token'ı revoke et
      await axios.delete(`${this.apiBaseURL}${token.platformUserId}/permissions`, {
        params: {
          access_token: token.accessToken
        }
      });

      token.isActive = false;
      await token.save();

      logger.info(`Meta access revoked for user ${userId}`);

      return { success: true };

    } catch (error) {
      logger.error('Meta revoke error:', error);
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
        platform: 'meta',
        isActive: true 
      }).select('+accessToken');

      if (!token) {
        throw new Error('No Meta token found');
      }

      // Token debug info al
      const debugInfo = await this.debugToken(token.accessToken);
      
      // Token geçerliliğini kontrol et
      if (!debugInfo.is_valid) {
        throw new Error('Meta token is invalid');
      }

      // Token yenilenmeye yakınsa yenile (30 günden az kaldıysa)
      const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
      if (debugInfo.expires_at * 1000 < thirtyDaysFromNow) {
        logger.info(`Refreshing Meta token for user ${userId}`);
        const newTokenData = await this.refreshAccessToken(token.accessToken);

        token.accessToken = newTokenData.accessToken;
        token.expiresAt = newTokenData.expiresAt;
        await token.save();

        return token.accessToken;
      }

      return token.accessToken;

    } catch (error) {
      logger.error('Meta ensureValidToken error:', error);
      throw error;
    }
  }

  /**
   * Token'ın debug bilgilerini çeker
   */
  async debugToken(accessToken) {
    try {
      const appAccessToken = `${this.appId}|${this.appSecret}`;
      
      const response = await axios.get(`${this.apiBaseURL}debug_token`, {
        params: {
          input_token: accessToken,
          access_token: appAccessToken
        }
      });

      return response.data.data;

    } catch (error) {
      logger.error('Meta debugToken error:', error);
      throw error;
    }
  }
}

module.exports = new MetaAuthService();
