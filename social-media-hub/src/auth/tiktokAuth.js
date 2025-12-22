const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config');
const Token = require('../models/Token');
const logger = require('../utils/logger');

/**
 * TikTok OAuth Service
 * TikTok Login Kit ve Content Posting API entegrasyonu
 */
class TikTokAuthService {
  constructor() {
    this.clientKey = config.tiktok.clientKey;
    this.clientSecret = config.tiktok.clientSecret;
    this.redirectUri = config.tiktok.redirectUri;
    this.scope = config.tiktok.scope;
    this.authorizationURL = config.tiktok.authorizationURL;
    this.tokenURL = config.tiktok.tokenURL;
  }

  /**
   * OAuth akışını başlatmak için authorization URL'ini oluşturur
   */
  getAuthorizationUrl(userId) {
    const csrfState = crypto.randomBytes(16).toString('hex');
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    // State ve code_verifier'ı session'da sakla
    // Gerçek uygulamada Redis veya session storage kullanılmalı
    global.authStates = global.authStates || {};
    global.authStates[csrfState] = {
      userId,
      codeVerifier,
      platform: 'tiktok',
      createdAt: Date.now()
    };

    const params = new URLSearchParams({
      client_key: this.clientKey,
      scope: this.scope,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state: csrfState,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
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

      // State'i temizle
      delete global.authStates[state];

      // Token exchange
      const response = await axios.post(
        this.tokenURL,
        {
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
          code_verifier: stateData.codeVerifier
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenData = response.data;

      // Kullanıcı bilgilerini al
      const userInfo = await this.getUserInfo(tokenData.access_token);

      // Token'ı veritabanına kaydet
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      
      const token = await Token.findOneAndUpdate(
        { userId: stateData.userId, platform: 'tiktok' },
        {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenType: tokenData.token_type,
          expiresAt,
          scope: tokenData.scope.split(','),
          platformUserId: userInfo.open_id,
          platformUsername: userInfo.display_name,
          isActive: true,
          metadata: {
            avatar: userInfo.avatar_url,
            followerCount: userInfo.follower_count
          }
        },
        { upsert: true, new: true }
      );

      logger.info(`TikTok OAuth successful for user ${stateData.userId}`);

      return {
        success: true,
        token,
        userInfo
      };

    } catch (error) {
      logger.error('TikTok OAuth error:', error);
      throw error;
    }
  }

  /**
   * Refresh token ile yeni access token alır
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(
        this.tokenURL,
        {
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenData = response.data;
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt
      };

    } catch (error) {
      logger.error('TikTok token refresh error:', error);
      throw error;
    }
  }

  /**
   * Access token ile kullanıcı bilgilerini çeker
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(
        `${config.tiktok.apiBaseURL}user/info/`,
        {
          params: {
            fields: 'open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count'
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.user;

    } catch (error) {
      logger.error('TikTok getUserInfo error:', error);
      throw error;
    }
  }

  /**
   * OAuth bağlantısını iptal eder (revoke)
   */
  async revokeAccess(userId) {
    try {
      const token = await Token.findOne({ 
        userId, 
        platform: 'tiktok',
        isActive: true 
      }).select('+accessToken');

      if (!token) {
        throw new Error('No active TikTok token found');
      }

      // TikTok revoke endpoint'i (dökümanlardan kontrol edilmeli)
      // Şu an için sadece veritabanından siliyoruz
      token.isActive = false;
      await token.save();

      logger.info(`TikTok access revoked for user ${userId}`);

      return { success: true };

    } catch (error) {
      logger.error('TikTok revoke error:', error);
      throw error;
    }
  }

  /**
   * PKCE için code verifier oluşturur
   */
  generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Code verifier'dan code challenge oluşturur
   */
  generateCodeChallenge(verifier) {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Token'ın geçerliliğini kontrol eder ve gerekirse yeniler
   */
  async ensureValidToken(userId) {
    try {
      const token = await Token.findOne({ 
        userId, 
        platform: 'tiktok',
        isActive: true 
      }).select('+accessToken +refreshToken');

      if (!token) {
        throw new Error('No TikTok token found');
      }

      // Token süresi dolmamışsa direkt döndür
      if (!token.needsRefresh()) {
        return token.accessToken;
      }

      // Token yenileme gerekiyor
      logger.info(`Refreshing TikTok token for user ${userId}`);
      const newTokenData = await this.refreshAccessToken(token.refreshToken);

      // Yeni token'ı kaydet
      token.accessToken = newTokenData.accessToken;
      token.refreshToken = newTokenData.refreshToken;
      token.expiresAt = newTokenData.expiresAt;
      await token.save();

      return token.accessToken;

    } catch (error) {
      logger.error('TikTok ensureValidToken error:', error);
      throw error;
    }
  }
}

module.exports = new TikTokAuthService();
