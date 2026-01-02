#!/bin/bash
# Monitor Script - Ultrarslanoglu Project Health Check

echo "🔍 Ultrarslanoglu Project Health Monitor"
echo "========================================"
echo ""

# Docker Services
echo "🐳 Docker Containers:"
docker ps --filter "name=ultrarslanoglu" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  ❌ Docker not running"

echo ""
echo "🌐 API Services:"

# API Gateway
if curl -s http://localhost:5000/health > /dev/null; then
    echo "  ✅ API Gateway (5000): HEALTHY"
else
    echo "  ❌ API Gateway (5000): DOWN"
fi

# Social Media Hub
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ Social Media Hub (3000): HEALTHY"
else
    echo "  ⏳ Social Media Hub (3000): STARTING"
fi

# Website
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "  ✅ Website (3001): HEALTHY"
else
    echo "  ⏳ Website (3001): STARTING"
fi

echo ""
echo "💾 Databases:"

# MongoDB
if docker exec ultrarslanoglu-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "  ✅ MongoDB (27017): HEALTHY"
else
    echo "  ❌ MongoDB (27017): DOWN"
fi

# Redis
if docker exec ultrarslanoglu-redis redis-cli ping > /dev/null 2>&1; then
    echo "  ✅ Redis (6379): HEALTHY"
else
    echo "  ❌ Redis (6379): DOWN"
fi

echo ""
echo "📊 System Resources:"
if command -v free &> /dev/null; then
    FREE_MEMORY=$(free -h | grep Mem | awk '{print "  Memory: " $3 "/" $2}')
    echo "$FREE_MEMORY"
fi

if command -v df &> /dev/null; then
    DISK_USAGE=$(df -h / | tail -1 | awk '{print "  Disk: " $3 "/" $2 " (" $5 ")"}')
    echo "$DISK_USAGE"
fi

echo ""
echo "📝 Recent Logs:"
echo "  API Gateway: api-gateway/logs/api-gateway.log"
echo "  Social Hub: social-media-hub/logs/social-hub.log"
echo "  Website: ultrarslanoglu-website/logs/website.log"

echo ""
echo "========================================"
