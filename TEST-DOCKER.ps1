# ============================================
# DOCKER TEST SCRIPT
# Ultrarslanoglu Core - Tüm Servisleri Test Et
# ============================================

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "ULTRARSLANOGLU CORE - DOCKER TEST" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Test fonksiyonu
function Test-Service {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing $Name..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " ✓ OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host " ✗ FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host " ✗ FAIL ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Container durumunu kontrol et
Write-Host "`n[1] Container Durumları" -ForegroundColor Cyan
Write-Host "-" * 60
docker-compose ps

Write-Host "`n[2] Health Check" -ForegroundColor Cyan
Write-Host "-" * 60

$results = @{}

# Core Infrastructure
Write-Host "`n>>> Core Infrastructure" -ForegroundColor Yellow
$results['MongoDB'] = Test-Service "MongoDB" "http://localhost:27017" -ExpectedStatus 0
$results['Redis'] = Test-Service "Redis" "http://localhost:6379" -ExpectedStatus 0

# API Services
Write-Host "`n>>> API Services" -ForegroundColor Yellow
$results['API Gateway'] = Test-Service "API Gateway" "http://localhost:5000/health"
$results['GS AI Editor'] = Test-Service "GS AI Editor" "http://localhost:5001/health"
$results['GS Analytics'] = Test-Service "GS Analytics Dashboard" "http://localhost:5002/health"
$results['GS Automation'] = Test-Service "GS Automation Tools" "http://localhost:5003/health"
$results['GS Brand Kit'] = Test-Service "GS Brand Kit" "http://localhost:5004/health"
$results['GS Scheduler'] = Test-Service "GS Content Scheduler" "http://localhost:5005/health"
$results['GS Video'] = Test-Service "GS Video Pipeline" "http://localhost:5006/health"

# Web Platforms
Write-Host "`n>>> Web Platforms" -ForegroundColor Yellow
$results['Website'] = Test-Service "Ultrarslanoglu Website" "http://localhost:3001"
$results['Social Media Hub'] = Test-Service "Social Media Hub" "http://localhost:3000/api/health"

# Sonuçları özetle
Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan

$totalTests = $results.Count
$passedTests = ($results.Values | Where-Object { $_ -eq $true }).Count
$failedTests = $totalTests - $passedTests

Write-Host "`nTotal Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red

if ($failedTests -gt 0) {
    Write-Host "`n⚠️  Some services are not responding!" -ForegroundColor Red
    Write-Host "Run 'docker-compose logs <service-name>' to check logs" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ All services are running!" -ForegroundColor Green
}

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan

# Kaynak kullanımı
Write-Host "`n[3] Resource Usage" -ForegroundColor Cyan
Write-Host "-" * 60
docker stats --no-stream

Write-Host "`n[4] Quick Commands" -ForegroundColor Cyan
Write-Host "-" * 60
Write-Host "View logs:              docker-compose logs -f [service-name]" -ForegroundColor White
Write-Host "Restart service:        docker-compose restart [service-name]" -ForegroundColor White
Write-Host "Stop all:               docker-compose stop" -ForegroundColor White
Write-Host "Remove all:             docker-compose down" -ForegroundColor White
Write-Host "`n"
