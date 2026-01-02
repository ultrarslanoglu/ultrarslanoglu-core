#!/usr/bin/env pwsh
# ============================================
# DOCKER START SCRIPT
# Ultrarslanoglu Core - Hızlı Başlangıç
# ============================================

param(
    [switch]$Build,
    [switch]$Production,
    [switch]$Stop,
    [switch]$Clean,
    [string]$Service
)

$ErrorActionPreference = "Continue"

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Yellow
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Text)
    Write-Host ">>> $Text" -ForegroundColor Green
}

function Write-Info {
    param([string]$Text)
    Write-Host "    $Text" -ForegroundColor White
}

# Banner
Clear-Host
Write-Header "ULTRARSLANOGLU CORE - DOCKER MANAGER"

# Stop işlemi
if ($Stop) {
    Write-Step "Stopping all services..."
    docker-compose stop
    Write-Host "✓ All services stopped" -ForegroundColor Green
    exit 0
}

# Clean işlemi
if ($Clean) {
    Write-Step "Cleaning up..."
    Write-Host "⚠️  This will remove all containers and volumes!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? (yes/no)"
    if ($confirm -eq "yes") {
        docker-compose down -v
        docker system prune -f
        Write-Host "✓ Cleanup complete" -ForegroundColor Green
    } else {
        Write-Host "✗ Cleanup cancelled" -ForegroundColor Yellow
    }
    exit 0
}

# Environment kontrolü
Write-Step "Checking environment..."
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Red
    Write-Info "Copying from .env.example..."
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created. Please edit it with your API keys." -ForegroundColor Yellow
    notepad .env
    Write-Host ""
    $continue = Read-Host "Continue with startup? (yes/no)"
    if ($continue -ne "yes") {
        exit 0
    }
}

# Docker kontrolü
Write-Step "Checking Docker..."
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed or not running!" -ForegroundColor Red
    Write-Info "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
}

# Build parametresi
$buildFlag = ""
if ($Build) {
    Write-Step "Building images..."
    $buildFlag = "--build"
}

# Production modu
$profile = ""
if ($Production) {
    Write-Step "Starting in PRODUCTION mode..."
    $profile = "--profile production"
} else {
    Write-Step "Starting in DEVELOPMENT mode..."
}

# Belirli servis
if ($Service) {
    Write-Step "Starting service: $Service"
    docker-compose up -d $buildFlag $Service
} else {
    Write-Step "Starting all services..."
    docker-compose up -d $buildFlag $profile
}

# Başlatma bekleme
Write-Host ""
Write-Info "Waiting for services to start..."
Start-Sleep -Seconds 10

# Health check
Write-Header "SERVICE STATUS"
docker-compose ps

# Servis URL'leri
Write-Header "SERVICE URLS"
Write-Info "📱 Website:           http://localhost:3001"
Write-Info "🔗 Social Media Hub:  http://localhost:3000"
Write-Info "⚡ API Gateway:       http://localhost:5000"
Write-Info "📊 MongoDB:           mongodb://localhost:27017"
Write-Info "🔴 Redis:             redis://localhost:6379"

Write-Host ""
Write-Info "🔍 AI Editor:         http://localhost:5001"
Write-Info "📈 Analytics:         http://localhost:5002"
Write-Info "🤖 Automation:        http://localhost:5003"
Write-Info "🎨 Brand Kit:         http://localhost:5004"
Write-Info "📅 Scheduler:         http://localhost:5005"
Write-Info "🎬 Video Pipeline:    http://localhost:5006"

# Komutlar
Write-Header "QUICK COMMANDS"
Write-Info "View logs:           docker-compose logs -f"
Write-Info "Stop all:            .\START-DOCKER.ps1 -Stop"
Write-Info "Restart:             docker-compose restart"
Write-Info "Clean all:           .\START-DOCKER.ps1 -Clean"
Write-Info "Run tests:           .\TEST-DOCKER.ps1"

Write-Host ""
Write-Host "✅ Startup complete!" -ForegroundColor Green
Write-Host ""

# Logs göster mi?
$showLogs = Read-Host "Show logs? (yes/no)"
if ($showLogs -eq "yes") {
    docker-compose logs -f
}
