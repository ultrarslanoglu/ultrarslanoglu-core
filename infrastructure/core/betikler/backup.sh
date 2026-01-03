#!/bin/bash
# Backup Script - Ultrarslanoglu Project

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

echo "💾 Starting Backup..."
echo "Timestamp: $TIMESTAMP"

# Backup MongoDB
echo "  📊 Backing up MongoDB..."
mkdir -p "$BACKUP_PATH/mongodb"
docker exec ultrarslanoglu-mongodb mongodump --out /tmp/dump 2>/dev/null || true
docker cp ultrarslanoglu-mongodb:/tmp/dump "$BACKUP_PATH/mongodb/dump" 2>/dev/null || true

# Backup configuration files
echo "  ⚙️ Backing up configuration..."
mkdir -p "$BACKUP_PATH/config"
cp api-gateway/.env "$BACKUP_PATH/config/.env" 2>/dev/null || true
cp social-media-hub/.env "$BACKUP_PATH/config/social-media.env" 2>/dev/null || true
cp ultrarslanoglu-website/.env.local "$BACKUP_PATH/config/website.env" 2>/dev/null || true

# Backup source code
echo "  📝 Backing up source code..."
mkdir -p "$BACKUP_PATH/source"
tar -czf "$BACKUP_PATH/source/api-gateway.tar.gz" api-gateway/ --exclude=node_modules --exclude=__pycache__ 2>/dev/null || true
tar -czf "$BACKUP_PATH/source/social-hub.tar.gz" social-media-hub/ --exclude=node_modules 2>/dev/null || true
tar -czf "$BACKUP_PATH/source/website.tar.gz" ultrarslanoglu-website/ --exclude=node_modules --exclude=.next 2>/dev/null || true

# Create backup info
cat > "$BACKUP_PATH/backup.info" << EOF
Backup Date: $TIMESTAMP
Includes:
  - MongoDB database dump
  - Configuration files (.env)
  - Source code archives
EOF

echo ""
echo "✅ Backup completed: $BACKUP_PATH"
echo "   Size: $(du -sh $BACKUP_PATH | cut -f1)"

# Keep only last 10 backups
echo ""
echo "🧹 Cleaning old backups..."
ls -t "$BACKUP_DIR" | tail -n +11 | xargs -r rm -rf

echo "✅ Cleanup complete"
