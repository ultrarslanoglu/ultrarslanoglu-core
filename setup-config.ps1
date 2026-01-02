# ============================================
# Ultrarslanoglu API Gateway - Quick Setup
# Automatically configure credentials
# ============================================

Write-Host "`n🚀 Ultrarslanoglu API Gateway - Configuration Setup" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$envFile = "$PSScriptRoot\api-gateway\.env"

# Check if .env exists
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found at: $envFile" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ .env file found" -ForegroundColor Green

# ============================================
# 1. EMAIL SERVICE SETUP
# ============================================
Write-Host "`n📧 EMAIL SERVICE CONFIGURATION" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

Write-Host "Select email service:" -ForegroundColor White
Write-Host "1. Gmail SMTP (App Password required)"
Write-Host "2. SendGrid (Free 100 emails/day)"
Write-Host "3. Skip for now"
$emailChoice = Read-Host "Enter choice (1-3)"

switch ($emailChoice) {
    "1" {
        Write-Host "`n📬 Gmail SMTP Setup" -ForegroundColor Cyan
        Write-Host "Opening Gmail App Passwords page..." -ForegroundColor Gray
        Start-Process "https://myaccount.google.com/apppasswords"
        
        Write-Host "`nSteps:" -ForegroundColor Yellow
        Write-Host "1. Sign in to your Google account"
        Write-Host "2. Enter app name: 'Ultrarslanoglu API'"
        Write-Host "3. Click 'Create'"
        Write-Host "4. Copy the 16-character password"
        
        $gmailPassword = Read-Host "`nPaste Gmail App Password (16 chars)"
        
        if ($gmailPassword) {
            (Get-Content $envFile) -replace 'SMTP_PASSWORD=.*', "SMTP_PASSWORD=$gmailPassword" | Set-Content $envFile
            (Get-Content $envFile) -replace 'SMTP_ENABLED=.*', 'SMTP_ENABLED=True' | Set-Content $envFile
            Write-Host "✅ Gmail SMTP configured!" -ForegroundColor Green
        }
    }
    "2" {
        Write-Host "`n📨 SendGrid Setup" -ForegroundColor Cyan
        Write-Host "Opening SendGrid signup page..." -ForegroundColor Gray
        Start-Process "https://signup.sendgrid.com/"
        
        Write-Host "`nSteps:" -ForegroundColor Yellow
        Write-Host "1. Sign up for free account"
        Write-Host "2. Go to Settings > API Keys"
        Write-Host "3. Create API Key"
        Write-Host "4. Copy the key (starts with SG.)"
        
        $sendgridKey = Read-Host "`nPaste SendGrid API Key"
        
        if ($sendgridKey) {
            (Get-Content $envFile) -replace 'SENDGRID_API_KEY=.*', "SENDGRID_API_KEY=$sendgridKey" | Set-Content $envFile
            (Get-Content $envFile) -replace 'SENDGRID_ENABLED=.*', 'SENDGRID_ENABLED=True' | Set-Content $envFile
            (Get-Content $envFile) -replace 'SMTP_ENABLED=.*', 'SMTP_ENABLED=False' | Set-Content $envFile
            Write-Host "✅ SendGrid configured!" -ForegroundColor Green
        }
    }
    "3" {
        Write-Host "⏭️  Email setup skipped" -ForegroundColor Yellow
    }
}

# ============================================
# 2. GITHUB TOKEN SETUP
# ============================================
Write-Host "`n🔐 GITHUB TOKEN CONFIGURATION" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

$setupGithub = Read-Host "Setup GitHub token for AI models? (Y/n)"

if ($setupGithub -ne "n") {
    Write-Host "`nOpening GitHub Personal Access Token page..." -ForegroundColor Cyan
    Start-Process "https://github.com/settings/tokens/new?description=Ultrarslanoglu-API-Gateway&scopes=repo,read:packages"
    
    Write-Host "`nSteps:" -ForegroundColor Yellow
    Write-Host "1. Enter token name: 'Ultrarslanoglu API Gateway'"
    Write-Host "2. Select scopes: 'repo' and 'read:packages'"
    Write-Host "3. Click 'Generate token'"
    Write-Host "4. Copy the token (starts with ghp_)"
    
    $githubToken = Read-Host "`nPaste GitHub Token"
    
    if ($githubToken) {
        (Get-Content $envFile) -replace 'GITHUB_TOKEN=.*', "GITHUB_TOKEN=$githubToken" | Set-Content $envFile
        Write-Host "✅ GitHub token configured!" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️  GitHub token setup skipped" -ForegroundColor Yellow
}

# ============================================
# 3. AWS S3 SETUP (Optional)
# ============================================
Write-Host "`n☁️  AWS S3 CONFIGURATION (Optional)" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

$setupAWS = Read-Host "Setup AWS S3 for video storage? (y/N)"

if ($setupAWS -eq "y") {
    Write-Host "`n📦 AWS S3 Setup" -ForegroundColor Cyan
    
    $awsAccessKey = Read-Host "Enter AWS Access Key ID"
    $awsSecretKey = Read-Host "Enter AWS Secret Access Key"
    $awsBucket = Read-Host "Enter S3 Bucket Name (default: ultrarslanoglu-videos)"
    
    if (-not $awsBucket) {
        $awsBucket = "ultrarslanoglu-videos"
    }
    
    if ($awsAccessKey -and $awsSecretKey) {
        (Get-Content $envFile) -replace 'AWS_S3_ACCESS_KEY_ID=.*', "AWS_S3_ACCESS_KEY_ID=$awsAccessKey" | Set-Content $envFile
        (Get-Content $envFile) -replace 'AWS_S3_SECRET_ACCESS_KEY=.*', "AWS_S3_SECRET_ACCESS_KEY=$awsSecretKey" | Set-Content $envFile
        (Get-Content $envFile) -replace 'AWS_S3_BUCKET=.*', "AWS_S3_BUCKET=$awsBucket" | Set-Content $envFile
        (Get-Content $envFile) -replace 'AWS_S3_ENABLED=.*', 'AWS_S3_ENABLED=True' | Set-Content $envFile
        Write-Host "✅ AWS S3 configured!" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️  AWS S3 setup skipped" -ForegroundColor Yellow
}

# ============================================
# 4. GENERATE SECURE KEYS
# ============================================
Write-Host "`n🔑 GENERATING SECURE KEYS" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

function Generate-SecureKey {
    $bytes = New-Object Byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

$jwtSecret = Generate-SecureKey
$appSecret = Generate-SecureKey
$encryptionKey = Generate-SecureKey

(Get-Content $envFile) -replace 'JWT_SECRET_KEY=.*', "JWT_SECRET_KEY=$jwtSecret" | Set-Content $envFile
(Get-Content $envFile) -replace 'SECRET_KEY=.*', "SECRET_KEY=$appSecret" | Set-Content $envFile
(Get-Content $envFile) -replace 'ENCRYPTION_KEY=.*', "ENCRYPTION_KEY=$encryptionKey" | Set-Content $envFile

Write-Host "✅ Secure keys generated and saved!" -ForegroundColor Green

# ============================================
# 5. DOCKER SERVICES
# ============================================
Write-Host "`n🐳 DOCKER SERVICES" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

$startDocker = Read-Host "Start Docker containers now? (Y/n)"

if ($startDocker -ne "n") {
    Write-Host "`nStarting Docker services..." -ForegroundColor Cyan
    
    Set-Location $PSScriptRoot
    
    # Check if docker-compose.prod.yml exists
    if (Test-Path "docker-compose.prod.yml") {
        docker-compose -f docker-compose.prod.yml up -d
        
        Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
        
        # Check health
        Write-Host "`n🏥 Checking service health..." -ForegroundColor Cyan
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ API Gateway is healthy!" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️  API Gateway not responding yet. Give it a moment..." -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ docker-compose.prod.yml not found" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Docker startup skipped" -ForegroundColor Yellow
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n" + "=" * 60 -ForegroundColor Gray
Write-Host "🎉 CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify services:" -ForegroundColor White
Write-Host "   docker ps" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check API health:" -ForegroundColor White
Write-Host "   curl http://localhost:5000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run tests:" -ForegroundColor White
Write-Host "   cd api-gateway; python test_comprehensive.py" -ForegroundColor Gray
Write-Host ""
Write-Host "4. View documentation:" -ForegroundColor White
Write-Host "   api-gateway/QUICK-START-V2.md" -ForegroundColor Gray
Write-Host ""

Write-Host "📂 Configuration saved to:" -ForegroundColor Yellow
Write-Host "   $envFile" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 API Gateway ready at: http://localhost:5000" -ForegroundColor Green
Write-Host "🌸 Flower monitoring: http://localhost:5555" -ForegroundColor Green
Write-Host ""

# Open browser
$openBrowser = Read-Host "Open API in browser? (Y/n)"
if ($openBrowser -ne "n") {
    Start-Process "http://localhost:5000/health"
}

Write-Host "`n✨ Happy coding!" -ForegroundColor Cyan
