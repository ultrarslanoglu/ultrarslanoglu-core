#!/usr/bin/env node
/**
 * Sosyal Medya Bağlantı Test CLI
 * Tüm platformların bağlantı durumlarını test eder
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');
const ConnectionTester = require('../src/utils/connectionTester');

async function main() {
  try {
    // MongoDB bağlantısı
    console.log('📦 Veritabanına bağlanılıyor...');
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('✅ Veritabanı bağlantısı başarılı\n');

    // Test başlat
    const tester = new ConnectionTester();
    await tester.testAll();

    // JSON sonuçları kaydet (opsiyonel)
    const results = tester.getResults();
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, '..', 'connection-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detaylı rapor kaydedildi: ${reportPath}`);

    // Bağlantıyı kapat
    await mongoose.connection.close();
    
    // Exit code (başarısız testler varsa 1)
    const hasFailures = results.summary.configured > results.summary.connected;
    process.exit(hasFailures ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Test sırasında hata oluştu:', error);
    process.exit(1);
  }
}

// Script doğrudan çalıştırıldıysa
if (require.main === module) {
  main();
}

module.exports = main;
