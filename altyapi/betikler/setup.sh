#!/bin/bash
# Setup Script - Ultrarslanoglu Project Infrastructure

set -e

echo "🚀 Ultrarslanoglu Infrastructure Setup"
echo "======================================="
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "📦 Step 1: Python Environment"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "✅ Virtual environment created"
fi
source .venv/bin/activate
pip install --upgrade pip setuptools wheel
echo "✅ Python packages upgraded"

echo ""
echo "📦 Step 2: API Gateway Dependencies"
cd api-gateway
pip install -r requirements.txt
echo "✅ API Gateway dependencies installed"
cd ..

echo ""
echo "📦 Step 3: Node.js Dependencies"
cd social-media-hub
npm install --legacy-peer-deps
echo "✅ Social Media Hub dependencies installed"

cd ../ultrarslanoglu-website
npm install --legacy-peer-deps
echo "✅ Website dependencies installed"
cd ..

echo ""
echo "🐳 Step 4: Docker Services"
docker-compose -f docker-compose.prod.yml up -d mongodb redis
echo "✅ Docker containers started"

echo ""
echo "✅ ======================================"
echo "   Infrastructure Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Configure .env file with credentials"
echo "2. Run: ./start-complete.sh"
echo ""
