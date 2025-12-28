#!/usr/bin/env node

/**
 * MongoDB Bağlantı Test Scripti
 * Veritabanı bağlantısını kontrol eder
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoDB() {
  console.log('🔍 MongoDB bağlantısı kontrol ediliyor...');
  console.log(`📍 URI: ${process.env.MONGODB_URI}\n`);

  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB bağlantısı başarılı!\n');

    // Veritabanı bilgisini al
    const admin = mongoose.connection.db.admin();
    const status = await admin.ping();
    console.log('📊 Veritabanı Durumu:');
    console.log('   Status:', status.ok === 1 ? '✅ Aktif' : '❌ Pasif');

    // Bağlantı bilgisini göster
    const stats = await mongoose.connection.db.stats();
    console.log('   Veritabanlar:', stats.databases ? stats.databases.length : 'N/A');
    console.log('   Storage Size:', stats.dataSize ? `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB` : 'N/A');

    // Collections'ları listele
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📦 Collections (${collections.length} toplam):`);
    if (collections.length > 0) {
      collections.forEach((col) => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log('   (Henüz collection yok)');
    }

    console.log('\n✨ Her şey hazır!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('\n💡 Çözüm önerileri:');

    if (error.message.includes('ECONNREFUSED')) {
      console.error('   1. MongoDB servisi başlatılmamış');
      console.error('   2. Windows: mongod komutunu çalıştırın');
      console.error('   3. Veya: "MongoDB Community Server" hizmetini başlatın');
    } else if (error.message.includes('authentication')) {
      console.error('   1. MongoDB URI kullanıcı adı/şifre kontrol edin');
      console.error('   2. İzinler kontrol edin');
    } else if (error.message.includes('network')) {
      console.error('   1. MongoDB bağlantı adresini kontrol edin');
      console.error('   2. Firewall ayarlarını kontrol edin');
    }

    process.exit(1);
  }
}

testMongoDB();
