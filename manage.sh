#!/usr/bin/env bash
# Ultrarslanoglu Complete Project - Docker Start & Management

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         ULTRARSLANOGLU - COMPLETE PROJECT SUITE            ║"
    echo "║      Galatasaray Dijital Liderlik Platformu 2025           ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Commands
start_project() {
    print_banner
    echo ""
    print_info "Starting Ultrarslanoglu ecosystem..."
    echo ""
    
    print_info "Starting core services (MongoDB, Redis)..."
    docker-compose up -d mongodb redis
    
    print_info "Starting website (Next.js)..."
    docker-compose up -d ultrarslanoglu-website
    
    echo ""
    print_status "All services started!"
    echo ""
    print_info "Services running:"
    docker-compose ps
}

start_all() {
    print_banner
    echo ""
    print_info "Starting ALL services..."
    docker-compose up -d
    
    sleep 2
    echo ""
    print_info "Services status:"
    docker-compose ps
}

stop_project() {
    print_info "Stopping all services..."
    docker-compose down
    print_status "All services stopped"
}

logs_website() {
    print_info "Website logs (press Ctrl+C to exit):"
    docker-compose logs -f ultrarslanoglu-website
}

status() {
    print_banner
    echo ""
    print_info "Service Status:"
    echo ""
    docker-compose ps
    
    echo ""
    print_info "Service URLs:"
    echo -e "${GREEN}Website:${NC}          http://localhost:3001"
    echo -e "${GREEN}API Health:${NC}       http://localhost:3001/api/health"
    echo -e "${GREEN}MongoDB:${NC}          mongodb://localhost:27017"
    echo -e "${GREEN}Redis:${NC}            redis://localhost:6379"
    echo ""
}

rebuild() {
    service=$1
    if [ -z "$service" ]; then
        print_error "Usage: rebuild <service-name>"
        echo "Available services:"
        echo "  - ultrarslanoglu-website"
        echo "  - gs-ai-editor"
        echo "  - gs-analytics-dashboard"
        echo "  - gs-automation-tools"
        exit 1
    fi
    
    print_info "Rebuilding $service..."
    docker-compose up -d "$service" --build
    print_status "$service rebuilt and started"
}

# Show help
show_help() {
    cat << EOF
${BLUE}Ultrarslanoglu Project Manager${NC}

Usage: $(basename "$0") <command>

Commands:
    start           Start core services (MongoDB, Redis, Website)
    start-all       Start all services
    stop            Stop all services
    status          Show service status
    logs            Stream website logs
    rebuild <svc>   Rebuild and restart a service
    help            Show this help message

Examples:
    $(basename "$0") start
    $(basename "$0") logs
    $(basename "$0") rebuild ultrarslanoglu-website

Services:
    - ultrarslanoglu-website  (Next.js + React, port 3001)
    - gs-ai-editor            (Flask, port 5001)
    - gs-analytics-dashboard  (Flask, port 5002)
    - gs-automation-tools     (Flask, port 5003)
    - gs-brand-kit            (Flask, port 5004)
    - gs-content-scheduler    (Flask, port 5005)
    - gs-video-pipeline       (Flask, port 5006)
    - social-media-hub        (Node.js, port 3000)
    - mongodb                 (Database, port 27017)
    - redis                   (Cache, port 6379)

For more info, see: WEBSITE_SETUP_COMPLETE.md
EOF
}

# Main
case "${1:-}" in
    start)
        start_project
        ;;
    start-all)
        start_all
        ;;
    stop)
        stop_project
        ;;
    status)
        status
        ;;
    logs)
        logs_website
        ;;
    rebuild)
        rebuild "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            print_banner
            echo ""
            print_info "No command specified. Use 'help' for usage."
            echo ""
        else
            print_error "Unknown command: $1"
        fi
        echo "Try: $(basename "$0") help"
        exit 1
        ;;
esac
