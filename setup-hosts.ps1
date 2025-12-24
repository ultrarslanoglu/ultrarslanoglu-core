# Ultrarslanoglu Website - Hosts File Setup (Windows)
# Run as Administrator: powershell -ExecutionPolicy Bypass -File setup-hosts.ps1

# Check if running as Administrator
$isAdmin = [bool]([Security.Principal.WindowsIdentity]::GetCurrent().Groups -match 'S-1-5-32-544')

if (-not $isAdmin) {
    Write-Host "❌ Error: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please follow these steps:"
    Write-Host "1. Open PowerShell"
    Write-Host "2. Right-click and select 'Run as administrator'"
    Write-Host "3. Run: powershell -ExecutionPolicy Bypass -File setup-hosts.ps1"
    exit 1
}

$hostFile = "C:\Windows\System32\drivers\etc\hosts"
$entries = @(
    "127.0.0.1 ultrarslanoglu.local",
    "127.0.0.1 www.ultrarslanoglu.local",
    "127.0.0.1 api.local",
    "127.0.0.1 api.ultrarslanoglu.local"
)

Write-Host "🔧 Setting up local domains..." -ForegroundColor Cyan
Write-Host ""

try {
    $content = Get-Content $hostFile -Raw
    $newContent = $content
    
    foreach ($entry in $entries) {
        if ($content -match [regex]::Escape($entry)) {
            Write-Host "✓ Already exists: $entry" -ForegroundColor Green
        } else {
            Write-Host "Adding: $entry" -ForegroundColor Yellow
            $newContent += "`r`n$entry"
        }
    }
    
    Set-Content -Path $hostFile -Value $newContent -Force
    Write-Host ""
    Write-Host "✅ Hosts file updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test with:" -ForegroundColor Cyan
    Write-Host "  http://ultrarslanoglu.local:3001" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
