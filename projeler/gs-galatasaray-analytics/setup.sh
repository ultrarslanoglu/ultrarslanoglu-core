#!/bin/bash

# Galatasaray Analytics Platform - Setup Script

echo "🚀 Galatasaray Analytics Platform - Kurulum Başladı"
echo "=================================================="

# Python version check
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Python sürümü: $python_version"

# Virtual environment
if [ ! -d "venv" ]; then
    echo "🔧 Virtual environment oluşturuluyor..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate
echo "✅ Virtual environment aktif"

# Requirements
echo "📦 Dependencies yükleniyor..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Dependencies yüklendi"

# .env setup
if [ ! -f ".env" ]; then
    echo "📝 .env dosyası oluşturuluyor..."
    cp .env.example .env
    echo "⚠️  .env dosyasını API keys ile güncelleyin!"
fi

# Logs directory
mkdir -p logs
echo "📁 Logs directory hazırlandı"

echo ""
echo "=================================================="
echo "✅ Kurulum Tamamlandı!"
echo "=================================================="
echo ""
echo "🚀 Başlamak için:"
echo "   python main.py"
echo ""
echo "📖 Daha fazla bilgi için README.md'yi okuyun"
echo ""
