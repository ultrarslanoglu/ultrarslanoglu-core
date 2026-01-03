# PowerShell Test Script for API Gateway

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 ULTRARSLANOGLU API GATEWAY TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )
    
    Write-Host "`n🔍 Testing $Name..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10
        return $true
    }
    catch {
        Write-Host "❌ FAILED: $_" -ForegroundColor Red
        return $false
    }
}

# Test endpoints
$results = @()
$results += Test-Endpoint "Health Check" "$baseUrl/health"
$results += Test-Endpoint "API Info" "$baseUrl/api/info"
$results += Test-Endpoint "Video Module" "$baseUrl/api/video/health"
$results += Test-Endpoint "AI Editor Module" "$baseUrl/api/ai-editor/health"
$results += Test-Endpoint "Analytics Module" "$baseUrl/api/analytics/health"
$results += Test-Endpoint "Automation Module" "$baseUrl/api/automation/health"
$results += Test-Endpoint "Brand Kit Module" "$baseUrl/api/brand/health"
$results += Test-Endpoint "Scheduler Module" "$baseUrl/api/scheduler/health"

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_ -eq $true }).Count
$total = $results.Count

Write-Host "Passed: $passed / $total" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -eq $total) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Some tests failed." -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
