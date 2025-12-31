#!/usr/bin/env bash

echo "========================================"
echo "🧪 ULTRARSLANOGLU API GATEWAY TEST"
echo "========================================"

BASE_URL="http://localhost:5000"

echo ""
echo "🔍 Testing Health Check..."
curl -s $BASE_URL/health | jq '.'

echo ""
echo "🔍 Testing API Info..."
curl -s $BASE_URL/api/info | jq '.'

echo ""
echo "🔍 Testing Video Module..."
curl -s $BASE_URL/api/video/health | jq '.'

echo ""
echo "🔍 Testing AI Editor Module..."
curl -s $BASE_URL/api/ai-editor/health | jq '.'

echo ""
echo "🔍 Testing Analytics Module..."
curl -s $BASE_URL/api/analytics/health | jq '.'

echo ""
echo "🔍 Testing Automation Module..."
curl -s $BASE_URL/api/automation/health | jq '.'

echo ""
echo "🔍 Testing Brand Kit Module..."
curl -s $BASE_URL/api/brand/health | jq '.'

echo ""
echo "🔍 Testing Scheduler Module..."
curl -s $BASE_URL/api/scheduler/health | jq '.'

echo ""
echo "========================================"
echo "✅ Test completed!"
echo "========================================"
