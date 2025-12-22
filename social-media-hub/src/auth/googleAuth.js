const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const User = require('../models/User');
const Token = require('../models/Token');
const config = require('../../config');

class GoogleAuthService {
  /**
   * YouTube OAuth2 login URL'i oluştur (PKCE ile)
   */
  static getAuthorizationUrl(state = null) {
    if (!state) {
      state = crypto.randomBytes(32).toString('hex');
    }

    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.redirectUri,
      response_type: 'code',
      scope: config.google.scope.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent' // Her zaman consent ekranı göster (refresh token almak için)
    });

    return {
      url: `${config.google.authorizationURL}?${params.toString()}`,
      state: state
    };
  }

  /**
   * OAuth callback'ten gelen authorization code'u token'a dönüştür
   */
  static async handleCallback(code, state) {
    try {
      // Authorization code → Access token exchange
      const tokenResponse = await axios.post(config.google.tokenURL, {
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: config.google.redirectUri
      });

      const {
        access_token,
        refresh_token,
        expires_in,
        token_type,
        scope
      } = tokenResponse.data;

      // Kullanıcı bilgilerini al
      const userInfo = await this.getUserInfo(access_token);

      // User bul veya oluştur
      let user = await User.findOne({ googleId: userInfo.id });
      if (!user) {
        user = await User.create({
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          profileImage: userInfo.picture,
          connectedAccounts: {
            google: true
          }
        });
      } else {
        // Varsa güncelle
        user.email = userInfo.email;
        user.name = userInfo.name;
        user.profileImage = userInfo.picture;
        if (!user.connectedAccounts) user.connectedAccounts = {};
        user.connectedAccounts.google = true;
        await user.save();
      }

      // Token kaydet
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

      let tokenRecord = await Token.findOne({
        userId: user._id,
        provider: 'google'
      });

      if (!tokenRecord) {
        tokenRecord = await Token.create({
          userId: user._id,
          provider: 'google',
          accessToken: access_token,
          refreshToken: refresh_token,
          expiryDate: expiryDate,
          scope: scope,
          tokenType: token_type
        });
      } else {
        tokenRecord.accessToken = access_token;
        if (refresh_token) tokenRecord.refreshToken = refresh_token;
        tokenRecord.expiryDate = expiryDate;
        tokenRecord.scope = scope;
        await tokenRecord.save();
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          googleId: user.googleId,
          profileImage: user.profileImage
        },
        token: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiryDate: expiryDate,
          tokenType: token_type
        }
      };
    } catch (error) {
      console.error('Google OAuth callback error:', error.response?.data || error.message);
      throw new Error(`Google OAuth error: ${error.message}`);
    }
  }

  /**
   * Google+ API'den kullanıcı bilgilerini al
   */
  static async getUserInfo(accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture,
        verified_email: response.data.verified_email
      };
    } catch (error) {
      console.error('Error getting user info:', error.message);
      throw error;
    }
  }

  /**
   * Refresh token kullanarak yeni access token al
   */
  static async refreshAccessToken(userId) {
    try {
      const tokenRecord = await Token.findOne({
        userId: userId,
        provider: 'google'
      });

      if (!tokenRecord || !tokenRecord.refreshToken) {
        throw new Error('Refresh token not found. Please re-authenticate.');
      }

      const response = await axios.post(config.google.tokenURL, {
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        refresh_token: tokenRecord.refreshToken,
        grant_type: 'refresh_token'
      });

      const {
        access_token,
        expires_in,
        token_type,
        scope
      } = response.data;

      // Token güncelle
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

      tokenRecord.accessToken = access_token;
      tokenRecord.expiryDate = expiryDate;
      if (scope) tokenRecord.scope = scope;
      await tokenRecord.save();

      return {
        accessToken: access_token,
        expiryDate: expiryDate,
        tokenType: token_type
      };
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Token'ın geçerliliğini kontrol et ve gerekirse yenile
   */
  static async ensureValidToken(userId) {
    try {
      const tokenRecord = await Token.findOne({
        userId: userId,
        provider: 'google'
      });

      if (!tokenRecord) {
        throw new Error('No token found for this user');
      }

      // Token'ın süresi 5 dakika içinde bitmişse yenile
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      const expiryDate = new Date(tokenRecord.expiryDate);

      if (now.getTime() >= expiryDate.getTime() - bufferTime) {
        // Refresh token'ı kullan
        return await this.refreshAccessToken(userId);
      }

      return {
        accessToken: tokenRecord.accessToken,
        expiryDate: tokenRecord.expiryDate,
        tokenType: tokenRecord.tokenType
      };
    } catch (error) {
      console.error('Token validation error:', error.message);
      throw error;
    }
  }

  /**
   * Token'ı debug et (geçerlilik kontrol et)
   */
  static async debugToken(accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/tokeninfo', {
        params: {
          access_token: accessToken
        }
      });

      return {
        isValid: !response.data.error,
        clientId: response.data.issued_to,
        userId: response.data.user_id,
        scopes: response.data.scope ? response.data.scope.split(' ') : [],
        issuedAt: new Date(response.data.issued_at * 1000),
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * YouTube'daki authenticated kullanıcının channels'ını al
   */
  static async getYoutubeChannels(userId) {
    try {
      const token = await this.ensureValidToken(userId);
      const youtubeApi = require('../api/youtube');
      return await youtubeApi.getChannels(token.accessToken);
    } catch (error) {
      console.error('Error getting YouTube channels:', error.message);
      throw error;
    }
  }
}

module.exports = GoogleAuthService;
