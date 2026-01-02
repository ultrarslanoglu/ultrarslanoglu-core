#!/bin/bash

# ============================================
# Environment selector script for Docker Compose
# Usage: source scripts/select-env.sh
# ============================================

# Basılı renkler
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}Ortam Seçimi${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""
echo -e "${YELLOW}Lütfen bir ortam seçin:${NC}"
echo "1) Development (Local)"
echo "2) Testing (CI/CD)"
echo "3) Production"
echo ""

read -p "Seçiminiz (1-3): " choice

case $choice in
  1)
    echo -e "${GREEN}✓ Development ortamı seçildi${NC}"
    export ENV_FILE=".env.development"
    export COMPOSE_PROJECT_NAME="ultrarslanoglu-dev"
    export DOCKER_COMPOSE_FILE="docker-compose.yml:docker-compose.dev.yml"
    ;;
  2)
    echo -e "${GREEN}✓ Testing ortamı seçildi${NC}"
    export ENV_FILE=".env.testing"
    export COMPOSE_PROJECT_NAME="ultrarslanoglu-test"
    export DOCKER_COMPOSE_FILE="docker-compose.yml"
    ;;
  3)
    echo -e "${GREEN}✓ Production ortamı seçildi${NC}"
    export ENV_FILE=".env.production"
    export COMPOSE_PROJECT_NAME="ultrarslanoglu"
    export DOCKER_COMPOSE_FILE="docker-compose.yml:docker-compose.prod.yml"
    ;;
  *)
    echo -e "${YELLOW}Geçersiz seçim${NC}"
    exit 1
    ;;
esac

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}⚠️  $ENV_FILE dosyası bulunamadı!${NC}"
  echo "Lütfen dosyayı oluşturun: cp .env.example $ENV_FILE"
  exit 1
fi

echo ""
echo -e "${GREEN}Ortam Yapılandırması:${NC}"
echo "  ENV_FILE: $ENV_FILE"
echo "  PROJECT_NAME: $COMPOSE_PROJECT_NAME"
echo "  COMPOSE_FILES: $DOCKER_COMPOSE_FILE"
echo ""
echo -e "${BLUE}İpucu: Artık şu komutları çalıştırabilirsiniz:${NC}"
echo "  docker-compose --env-file $ENV_FILE up -d"
echo "  docker-compose --env-file $ENV_FILE logs -f"
echo "  docker-compose --env-file $ENV_FILE down"
