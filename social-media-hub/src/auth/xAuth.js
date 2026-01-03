const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config');
const Token = require('../models/Token');
const logger = require('../utils/logger');

/**
 * X (Twitter) OAuth 2.0 Service
 * Twitter API v2 entegrasyonu
 */
class XAuthService {
  constructor() {
    this.clientId = config.x.clientId;
    this.clientSecret = config.x.clientSecret;
    this.redirectUri = config.x.redirectUri;
    this.scope = config.x.scope;
    this.authorizationURL = config.x.authorizationURL;
    this.tokenURL = config.x.tokenURL;
    this.apiBaseURL = config.x.apiBaseURL;
  }

  /**
   * OAuth akışını başlatmak için authorization URL'ini oluşturur
   */
  getAuthorizationUrl(userId) {
    const csrfState = crypto.randomBytes(16).toString('hex');
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    // State ve code_verifier'ı sakla
    global.authStates = global.authStates || {};
    global.authStates[csrfState] = {
      userId,
      codeVerifier,
      platform: 'x',
      createdAt: Date.now()
    };

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
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

      delete global.authStates[state];

      // Token exchange
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        this.tokenURL,
        new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
          code_verifier: stateData.codeVerifier
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
          }
        }
      );

      const tokenData = response.data;

      // Kullanıcı bilgilerini al
      const userInfo = await this.getUserInfo(tokenData.access_token);

      // Token'ı veritabanına kaydet
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      
      const token = await Token.findOneAndUpdate(
        { userId: stateData.userId, platform: 'x' },
        {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenType: tokenData.token_type,
          expiresAt,
          scope: tokenData.scope.split(' '),
          platformUserId: userInfo.id,
          platformUsername: userInfo.username,
          isActive: true,
          metadata: {
            name: userInfo.name,
            username: userInfo.username,
            profileImageUrl: userInfo.profile_image_url,
            followersCount: userInfo.public_metrics?.followers_count,
            followingCount: userInfo.public_metrics?.following_count,
            tweetCount: userInfo.public_metrics?.tweet_count,
            verified: userInfo.verified
          }
        },
        { upsert: true, new: true }
      );

      logger.info(`X OAuth successful for user ${stateData.userId}`);

      return {
        success: true,
        token,
        userInfo
      };

    } catch (error) {
      logger.error('X OAuth error:', error);
      throw error;
    }
  }

  /**
   * Access token ile kullanıcı bilgilerini çeker
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.apiBaseURL}users/me`, {
        params: {
          'user.fields': 'id,name,username,profile_image_url,public_metrics,verified'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data;

    } catch (error) {
      logger.error('X getUserInfo error:', error);
      throw error;
    }
  }

  /**
   * Refresh token ile yeni access token alır
   */
  async refreshAccessToken(refreshToken) {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        this.tokenURL,
        new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
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
      logger.error('X token refresh error:', error);
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
        platform: 'x',
        isActive: true 
      }).select('+accessToken');

      if (!token) {
        throw new Error('No active X token found');
      }

      // X token revoke endpoint
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      await axios.post(
        'https://api.twitter.com/2/oauth2/revoke',
        new URLSearchParams({
          token: token.accessToken,
          token_type_hint: 'access_token'
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
          }
        }
      );

      token.isActive = false;
      await token.save();

      logger.info(`X access revoked for user ${userId}`);

      return { success: true };

    } catch (error) {
      logger.error('X revoke error:', error);
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
        platform: 'x',
        isActive: true 
      }).select('+accessToken +refreshToken');

      if (!token) {
        throw new Error('No X token found');
      }

      // Token süresi dolmamışsa direkt döndür
      if (!token.needsRefresh()) {
        return token.accessToken;
      }

      // Token yenileme gerekiyor
      logger.info(`Refreshing X token for user ${userId}`);
      const newTokenData = await this.refreshAccessToken(token.refreshToken);

      // Yeni token'ı kaydet
      token.accessToken = newTokenData.accessToken;
      token.refreshToken = newTokenData.refreshToken;
      token.expiresAt = newTokenData.expiresAt;
      await token.save();

      return token.accessToken;

    } catch (error) {
      logger.error('X ensureValidToken error:', error);
      throw error;
    }
  }
}

module.exports = new XAuthService();
