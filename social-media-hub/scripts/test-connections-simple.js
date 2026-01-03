#!/usr/bin/env node
/**
 * Sosyal Medya Bağlantı Test CLI (Veritabanı olmadan)
 * Sadece yapılandırma ve API endpoint'lerini test eder
 */

require('dotenv').config();
const axios = require('axios');
const { google } = require('googleapis');
const config = require('../config');

class SimpleConnectionTester {
  constructor() {
    this.results = {
      tiktok: { configured: false, apiReachable: false, error: null },
      meta: { configured: false, apiReachable: false, error: null },
      youtube: { configured: false, apiReachable: false, error: null },
      x: { configured: false, apiReachable: false, error: null }
    };
  }

  async testAll() {
    console.log('\n🔍 Sosyal Medya Bağlantı Testi (Config & API Kontrolü)\n');
    console.log('═'.repeat(80));

    await this.testTikTok();
    await this.testMeta();
    await this.testYouTube();
    await this.testX();

    console.log('\n═'.repeat(80));
    this.printSummary();

    return this.results;
  }

  async testTikTok() {
    console.log('\n📱 TikTok');
    console.log('─'.repeat(80));

    try {
      const configured = !!(config.tiktok.clientKey && config.tiktok.clientSecret);
      this.results.tiktok.configured = configured;

      console.log(`   Client Key: ${config.tiktok.clientKey ? '✅ Tanımlı (' + config.tiktok.clientKey.substring(0, 10) + '...)' : '❌ Tanımsız'}`);
      console.log(`   Client Secret: ${config.tiktok.clientSecret ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Redirect URI: ${config.tiktok.redirectUri}`);
      console.log(`   Scope: ${config.tiktok.scope}`);

      if (!configured) {
        throw new Error('Kimlik bilgileri eksik');
      }

      // API endpoint erişilebilirlik testi
      try {
        await axios.head(config.tiktok.apiBaseURL, { timeout: 5000 });
        this.results.tiktok.apiReachable = true;
        console.log(`   ✅ API Endpoint Erişilebilir: ${config.tiktok.apiBaseURL}`);
      } catch (apiError) {
        console.log(`   ⚠️  API Endpoint Erişilemedi (Normal, auth gerekir)`);
        this.results.tiktok.apiReachable = 'requires_auth';
      }

    } catch (error) {
      console.log(`   ❌ ${error.message}`);
      this.results.tiktok.error = error.message;
    }
  }

  async testMeta() {
    console.log('\n📘 Meta (Facebook/Instagram)');
    console.log('─'.repeat(80));

    try {
      const configured = !!(config.meta.appId && config.meta.appSecret);
      this.results.meta.configured = configured;

      console.log(`   App ID: ${config.meta.appId ? '✅ Tanımlı (' + config.meta.appId.substring(0, 10) + '...)' : '❌ Tanımsız'}`);
      console.log(`   App Secret: ${config.meta.appSecret ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Redirect URI: ${config.meta.redirectUri}`);
      console.log(`   API Version: ${config.meta.apiVersion}`);

      if (!configured) {
        throw new Error('Kimlik bilgileri eksik');
      }

      // App Access Token testi
      try {
        const response = await axios.get(`${config.meta.apiBaseURL}oauth/access_token`, {
          params: {
            client_id: config.meta.appId,
            client_secret: config.meta.appSecret,
            grant_type: 'client_credentials'
          },
          timeout: 10000
        });

        if (response.data.access_token) {
          this.results.meta.apiReachable = true;
          console.log(`   ✅ API Bağlantısı Başarılı`);
          console.log(`   ✅ App Access Token Alındı`);
        }
      } catch (apiError) {
        console.log(`   ⚠️  API Testi Başarısız: ${apiError.response?.data?.error?.message || apiError.message}`);
        this.results.meta.error = apiError.response?.data?.error?.message || apiError.message;
      }

    } catch (error) {
      console.log(`   ❌ ${error.message}`);
      this.results.meta.error = error.message;
    }
  }

  async testYouTube() {
    console.log('\n📺 YouTube (Google)');
    console.log('─'.repeat(80));

    try {
      const configured = !!(config.google.clientId && config.google.clientSecret);
      this.results.youtube.configured = configured;

      console.log(`   Client ID: ${config.google.clientId ? '✅ Tanımlı (' + config.google.clientId.substring(0, 20) + '...)' : '❌ Tanımsız'}`);
      console.log(`   Client Secret: ${config.google.clientSecret ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Redirect URI: ${config.google.redirectUri}`);

      if (!configured) {
        throw new Error('Kimlik bilgileri eksik');
      }

      // OAuth2 client oluşturabilme testi
      try {
        const oauth2Client = new google.auth.OAuth2(
          config.google.clientId,
          config.google.clientSecret,
          config.google.redirectUri
        );
        
        // Authorization URL oluşturabilme testi
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: config.google.scope
        });

        if (authUrl.includes('accounts.google.com')) {
          this.results.youtube.apiReachable = true;
          console.log(`   ✅ OAuth2 Client Yapılandırması Geçerli`);
          console.log(`   ✅ Authorization URL Oluşturulabilir`);
        }
      } catch (apiError) {
        console.log(`   ⚠️  OAuth2 Yapılandırma Hatası: ${apiError.message}`);
        this.results.youtube.error = apiError.message;
      }

    } catch (error) {
      console.log(`   ❌ ${error.message}`);
      this.results.youtube.error = error.message;
    }
  }

  async testX() {
    console.log('\n🐦 X (Twitter)');
    console.log('─'.repeat(80));

    try {
      const configured = !!(config.x.clientId && config.x.clientSecret);
      this.results.x.configured = configured;

      console.log(`   Client ID: ${config.x.clientId ? '✅ Tanımlı (' + config.x.clientId.substring(0, 10) + '...)' : '❌ Tanımsız'}`);
      console.log(`   Client Secret: ${config.x.clientSecret ? '✅ Tanımlı' : '❌ Tanımsız'}`);
      console.log(`   Redirect URI: ${config.x.redirectUri}`);
      console.log(`   Scope: ${config.x.scope}`);

      if (!configured) {
        throw new Error('Kimlik bilgileri eksik');
      }

      // API endpoint erişilebilirlik testi
      try {
        // X API v2 endpoint'i test et (public endpoint)
        await axios.head('https://api.twitter.com/2/', { timeout: 5000 });
        this.results.x.apiReachable = true;
        console.log(`   ✅ API Endpoint Erişilebilir: ${config.x.apiBaseURL}`);
      } catch (apiError) {
        console.log(`   ⚠️  API Endpoint Erişilemedi (Normal, auth gerekir)`);
        this.results.x.apiReachable = 'requires_auth';
      }

    } catch (error) {
      console.log(`   ❌ ${error.message}`);
      this.results.x.error = error.message;
    }
  }

  printSummary() {
    console.log('\n📊 Test Sonuçları Özeti');
    console.log('═'.repeat(80));

    const platforms = [
      { name: 'TikTok', key: 'tiktok', icon: '📱' },
      { name: 'Meta', key: 'meta', icon: '📘' },
      { name: 'YouTube', key: 'youtube', icon: '📺' },
      { name: 'X', key: 'x', icon: '🐦' }
    ];

    platforms.forEach(platform => {
      const result = this.results[platform.key];
      const configStatus = result.configured ? '✅' : '❌';
      const apiStatus = result.apiReachable === true ? '✅' : 
                       result.apiReachable === 'requires_auth' ? '⚠️' : '❌';
      
      console.log(`\n${platform.icon} ${platform.name}`);
      console.log(`   Yapılandırma: ${configStatus}`);
      console.log(`   API Erişimi: ${apiStatus}`);
      
      if (result.error) {
        console.log(`   Hata: ${result.error}`);
      }
    });

    console.log('\n' + '═'.repeat(80));

    const totalConfigured = Object.values(this.results).filter(r => r.configured).length;

    console.log(`\n✅ Yapılandırılmış Platformlar: ${totalConfigured}/4`);

    if (totalConfigured === 0) {
      console.log('\n⚠️  Hiçbir platform yapılandırılmamış!');
      console.log('📝 Lütfen .env dosyasını oluşturun ve API kimlik bilgilerini girin.');
      console.log('   Örnek için .env.example dosyasına bakın.');
    } else if (totalConfigured < 4) {
      console.log('\n⚠️  Bazı platformların kimlik bilgileri eksik.');
      console.log('📝 .env dosyasını kontrol edin ve eksik bilgileri tamamlayın.');
    } else {
      console.log('\n🎉 Tüm platformlar yapılandırılmış!');
      console.log('✅ OAuth akışını tamamlamak için /auth/{platform} endpoint\'lerini kullanın.');
    }

    console.log('\n💡 Detaylı test için (veritabanı ile): npm run test:connections');
    console.log('💡 API endpoint\'leri: /api/health/connections\n');
  }
}

async function main() {
  try {
    const tester = new SimpleConnectionTester();
    await tester.testAll();

    // JSON raporu kaydet
    const fs = require('fs');
    const path = require('path');
    
    const results = {
      summary: {
        totalPlatforms: 4,
        configured: Object.values(tester.results).filter(r => r.configured).length,
        apiReachable: Object.values(tester.results).filter(r => r.apiReachable === true).length
      },
      platforms: tester.results,
      timestamp: new Date().toISOString(),
      note: 'Bu test veritabanı bağlantısı gerektirmez. Sadece yapılandırma ve API erişilebilirliğini kontrol eder.'
    };

    const reportPath = path.join(__dirname, '..', 'connection-test-simple.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 Rapor kaydedildi: ${reportPath}\n`);

    // Exit code
    const hasFailures = results.summary.configured === 0;
    process.exit(hasFailures ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Test sırasında hata oluştu:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
