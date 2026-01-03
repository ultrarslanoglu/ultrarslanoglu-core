const axios = require('axios');
const { google } = require('googleapis');
const config = require('../../config');
const Token = require('../models/Token');
const logger = require('./logger');

/**
 * Sosyal Medya Platformu Bağlantı Test Servisi
 * Tüm platformların API bağlantılarını ve kimlik bilgilerini doğrular
 */
class ConnectionTester {
  constructor() {
    this.results = {
      tiktok: { configured: false, connected: false, error: null },
      meta: { configured: false, connected: false, error: null },
      youtube: { configured: false, connected: false, error: null },
      x: { configured: false, connected: false, error: null }
    };
  }

  /**
   * Tüm platformları test et
   */
  async testAll() {
    console.log('\n🔍 Sosyal Medya Bağlantı Testi Başlatılıyor...\n');
    console.log('═'.repeat(80));

    await this.testTikTok();
    await this.testMeta();
    await this.testYouTube();
    await this.testX();

    console.log('\n═'.repeat(80));
    this.printSummary();

    return this.results;
  }

  /**
   * TikTok bağlantısını test et
   */
  async testTikTok() {
    console.log('\n📱 TikTok Bağlantısı Test Ediliyor...');
    console.log('─'.repeat(80));

    try {
      // Config kontrolü
      const configured = !!(config.tiktok.clientKey && config.tiktok.clientSecret);
      this.results.tiktok.configured = configured;

      console.log(`   Client Key: ${config.tiktok.clientKey ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Client Secret: ${config.tiktok.clientSecret ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Redirect URI: ${config.tiktok.redirectUri}`);
      console.log(`   Scope: ${config.tiktok.scope}`);

      if (!configured) {
        throw new Error('TikTok kimlik bilgileri eksik (TIKTOK_CLIENT_KEY veya TIKTOK_CLIENT_SECRET)');
      }

      // Aktif token kontrolü
      const activeTokens = await Token.find({ 
        platform: 'tiktok', 
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      console.log(`   Aktif Token Sayısı: ${activeTokens.length}`);

      if (activeTokens.length > 0) {
        // İlk aktif token ile API testi
        const testToken = activeTokens[0];
        console.log(`   Test Token: ${testToken.platformUsername || testToken.platformUserId}`);

        try {
          const response = await axios.get(`${config.tiktok.apiBaseURL}user/info/`, {
            headers: {
              'Authorization': `Bearer ${testToken.accessToken}`
            },
            params: {
              fields: 'display_name,avatar_url'
            }
          });

          if (response.data.data) {
            this.results.tiktok.connected = true;
            console.log(`   ✅ API Bağlantısı Başarılı`);
            console.log(`   Kullanıcı: ${response.data.data.user.display_name}`);
          }
        } catch (apiError) {
          console.log(`   ⚠️  API Testi Başarısız: ${apiError.message}`);
          this.results.tiktok.error = `API Hatası: ${apiError.response?.data?.error?.message || apiError.message}`;
        }
      } else {
        console.log(`   ℹ️  Henüz aktif bağlantı yok (OAuth akışı tamamlanmamış)`);
        this.results.tiktok.error = 'Aktif token bulunamadı';
      }

    } catch (error) {
      console.log(`   ❌ Hata: ${error.message}`);
      this.results.tiktok.error = error.message;
    }
  }

  /**
   * Meta (Facebook/Instagram) bağlantısını test et
   */
  async testMeta() {
    console.log('\n📘 Meta (Facebook/Instagram) Bağlantısı Test Ediliyor...');
    console.log('─'.repeat(80));

    try {
      // Config kontrolü
      const configured = !!(config.meta.appId && config.meta.appSecret);
      this.results.meta.configured = configured;

      console.log(`   App ID: ${config.meta.appId ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   App Secret: ${config.meta.appSecret ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Redirect URI: ${config.meta.redirectUri}`);
      console.log(`   Scope: ${config.meta.scope}`);

      if (!configured) {
        throw new Error('Meta kimlik bilgileri eksik (META_APP_ID veya META_APP_SECRET)');
      }

      // App Access Token ile basit API testi
      try {
        const appTokenResponse = await axios.get(`${config.meta.apiBaseURL}oauth/access_token`, {
          params: {
            client_id: config.meta.appId,
            client_secret: config.meta.appSecret,
            grant_type: 'client_credentials'
          }
        });

        if (appTokenResponse.data.access_token) {
          console.log(`   ✅ App Token Alındı`);

          // Token debug ile doğrulama
          const debugResponse = await axios.get(`${config.meta.apiBaseURL}debug_token`, {
            params: {
              input_token: appTokenResponse.data.access_token,
              access_token: appTokenResponse.data.access_token
            }
          });

          if (debugResponse.data.data.is_valid) {
            console.log(`   ✅ App Token Geçerli`);
            console.log(`   App ID: ${debugResponse.data.data.app_id}`);
          }
        }
      } catch (apiError) {
        console.log(`   ⚠️  App Token Testi Başarısız: ${apiError.message}`);
      }

      // Aktif kullanıcı token'ları kontrolü
      const activeTokens = await Token.find({ 
        platform: 'meta', 
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      console.log(`   Aktif Token Sayısı: ${activeTokens.length}`);

      if (activeTokens.length > 0) {
        const testToken = activeTokens[0];
        console.log(`   Test Token: ${testToken.platformUsername || testToken.platformUserId}`);

        try {
          // Kullanıcı bilgilerini kontrol et
          const response = await axios.get(`${config.meta.apiBaseURL}me`, {
            params: {
              access_token: testToken.accessToken,
              fields: 'id,name,email'
            }
          });

          if (response.data.id) {
            this.results.meta.connected = true;
            console.log(`   ✅ Kullanıcı API Bağlantısı Başarılı`);
            console.log(`   Kullanıcı: ${response.data.name}`);
          }
        } catch (apiError) {
          console.log(`   ⚠️  Kullanıcı API Testi Başarısız: ${apiError.message}`);
          this.results.meta.error = `API Hatası: ${apiError.response?.data?.error?.message || apiError.message}`;
        }
      } else {
        console.log(`   ℹ️  Henüz aktif kullanıcı bağlantısı yok`);
        this.results.meta.error = 'Aktif kullanıcı token bulunamadı';
      }

    } catch (error) {
      console.log(`   ❌ Hata: ${error.message}`);
      this.results.meta.error = error.message;
    }
  }

  /**
   * YouTube bağlantısını test et
   */
  async testYouTube() {
    console.log('\n📺 YouTube Bağlantısı Test Ediliyor...');
    console.log('─'.repeat(80));

    try {
      // Config kontrolü
      const configured = !!(config.google.clientId && config.google.clientSecret);
      this.results.youtube.configured = configured;

      console.log(`   Client ID: ${config.google.clientId ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Client Secret: ${config.google.clientSecret ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Redirect URI: ${config.google.redirectUri}`);

      if (!configured) {
        throw new Error('Google kimlik bilgileri eksik (GOOGLE_CLIENT_ID veya GOOGLE_CLIENT_SECRET)');
      }

      // Aktif token kontrolü
      const activeTokens = await Token.find({ 
        platform: 'youtube', 
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      console.log(`   Aktif Token Sayısı: ${activeTokens.length}`);

      if (activeTokens.length > 0) {
        const testToken = activeTokens[0];
        console.log(`   Test Token: ${testToken.platformUsername || testToken.platformUserId}`);

        try {
          // OAuth2 client oluştur
          const oauth2Client = new google.auth.OAuth2(
            config.google.clientId,
            config.google.clientSecret,
            config.google.redirectUri
          );

          oauth2Client.setCredentials({
            access_token: testToken.accessToken,
            refresh_token: testToken.refreshToken
          });

          // YouTube API ile kanal bilgilerini al
          const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
          const response = await youtube.channels.list({
            part: ['snippet', 'statistics'],
            mine: true
          });

          if (response.data.items && response.data.items.length > 0) {
            this.results.youtube.connected = true;
            const channel = response.data.items[0];
            console.log(`   ✅ API Bağlantısı Başarılı`);
            console.log(`   Kanal: ${channel.snippet.title}`);
            console.log(`   Abone Sayısı: ${channel.statistics.subscriberCount}`);
          }
        } catch (apiError) {
          console.log(`   ⚠️  API Testi Başarısız: ${apiError.message}`);
          this.results.youtube.error = `API Hatası: ${apiError.message}`;
        }
      } else {
        console.log(`   ℹ️  Henüz aktif bağlantı yok`);
        this.results.youtube.error = 'Aktif token bulunamadı';
      }

    } catch (error) {
      console.log(`   ❌ Hata: ${error.message}`);
      this.results.youtube.error = error.message;
    }
  }

  /**
   * X (Twitter) bağlantısını test et
   */
  async testX() {
    console.log('\n🐦 X (Twitter) Bağlantısı Test Ediliyor...');
    console.log('─'.repeat(80));

    try {
      if (!config.features?.xEnabled) {
        console.log('   ⏸️  X entegrasyonu devre dışı (ücretli erişim gerekiyor)');
        this.results.x.error = 'Integration disabled (paid access required)';
        return;
      }

      // Config kontrolü
      const configured = !!(config.x.clientId && config.x.clientSecret);
      this.results.x.configured = configured;

      console.log(`   Client ID: ${config.x.clientId ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Client Secret: ${config.x.clientSecret ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Redirect URI: ${config.x.redirectUri}`);
      console.log(`   Scope: ${config.x.scope}`);

      if (!configured) {
        throw new Error('X kimlik bilgileri eksik (X_CLIENT_ID veya X_CLIENT_SECRET)');
      }

      // Aktif token kontrolü
      const activeTokens = await Token.find({ 
        platform: 'x', 
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      console.log(`   Aktif Token Sayısı: ${activeTokens.length}`);

      if (activeTokens.length > 0) {
        const testToken = activeTokens[0];
        console.log(`   Test Token: ${testToken.platformUsername || testToken.platformUserId}`);

        try {
          // Kullanıcı bilgilerini al
          const response = await axios.get(`${config.x.apiBaseURL}users/me`, {
            headers: {
              'Authorization': `Bearer ${testToken.accessToken}`
            },
            params: {
              'user.fields': 'id,name,username,public_metrics'
            }
          });

          if (response.data.data) {
            this.results.x.connected = true;
            console.log(`   ✅ API Bağlantısı Başarılı`);
            console.log(`   Kullanıcı: @${response.data.data.username}`);
            console.log(`   Takipçi: ${response.data.data.public_metrics.followers_count}`);
          }
        } catch (apiError) {
          console.log(`   ⚠️  API Testi Başarısız: ${apiError.message}`);
          this.results.x.error = `API Hatası: ${apiError.response?.data?.detail || apiError.message}`;
        }
      } else {
        console.log(`   ℹ️  Henüz aktif bağlantı yok`);
        this.results.x.error = 'Aktif token bulunamadı';
      }

    } catch (error) {
      console.log(`   ❌ Hata: ${error.message}`);
      this.results.x.error = error.message;
    }
  }

  /**
   * Test sonuçlarını özetle
   */
  printSummary() {
    console.log('\n📊 Test Sonuçları Özeti');
    console.log('═'.repeat(80));

    const platforms = [
      { name: 'TikTok', key: 'tiktok', icon: '📱' },
      { name: 'Meta (Facebook/Instagram)', key: 'meta', icon: '📘' },
      { name: 'YouTube', key: 'youtube', icon: '📺' },
      { name: 'X (Twitter)', key: 'x', icon: '🐦' }
    ];

    platforms.forEach(platform => {
      const result = this.results[platform.key];
      const configStatus = result.configured ? '✅' : '❌';
      const connectionStatus = result.connected ? '✅' : '❌';
      
      console.log(`\n${platform.icon} ${platform.name}`);
      console.log(`   Yapılandırma: ${configStatus} ${result.configured ? 'Tamam' : 'Eksik'}`);
      console.log(`   Bağlantı: ${connectionStatus} ${result.connected ? 'Aktif' : 'Pasif'}`);
      
      if (result.error) {
        console.log(`   Hata: ${result.error}`);
      }
    });

    console.log('\n' + '═'.repeat(80));

    const totalConfigured = Object.values(this.results).filter(r => r.configured).length;
    const totalConnected = Object.values(this.results).filter(r => r.connected).length;

    console.log(`\n✅ Yapılandırılmış Platformlar: ${totalConfigured}/4`);
    console.log(`✅ Bağlı Platformlar: ${totalConnected}/4`);

    if (totalConfigured < 4) {
      console.log('\n⚠️  Bazı platformların kimlik bilgileri eksik. .env dosyasını kontrol edin.');
    }

    if (totalConnected < totalConfigured) {
      console.log('\n⚠️  Bazı platformlar için OAuth akışı tamamlanmamış. /auth/{platform} endpoint\'lerini kullanarak bağlantı yapın.');
    }

    if (totalConnected === 4) {
      console.log('\n🎉 Tüm platformlar başarıyla bağlı!');
    }

    console.log('\n');
  }

  /**
   * JSON formatında sonuç döndür
   */
  getResults() {
    return {
      summary: {
        totalPlatforms: 4,
        configured: Object.values(this.results).filter(r => r.configured).length,
        connected: Object.values(this.results).filter(r => r.connected).length
      },
      platforms: this.results,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ConnectionTester;
