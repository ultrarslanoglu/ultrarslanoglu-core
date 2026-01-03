@echo off
echo ========================================
echo Ultrarslanoglu API Gateway - Quick Setup
echo ========================================
echo.

REM Check if .env exists
if not exist "api-gateway\.env" (
    echo [ERROR] .env file not found!
    echo Creating from .env.example...
    copy "api-gateway\.env.example" "api-gateway\.env"
    echo [OK] .env file created
)

echo.
echo ===========================================
echo CONFIGURATION STEPS
echo ===========================================
echo.

echo 1. EMAIL SERVICE
echo ---------------
echo Choose one option:
echo.
echo Option A: Gmail SMTP
echo   - Open: https://myaccount.google.com/apppasswords
echo   - Create app password for "Ultrarslanoglu API"
echo   - Edit api-gateway\.env
echo   - Set: SMTP_PASSWORD=your-16-char-password
echo.
echo Option B: SendGrid (Recommended)
echo   - Sign up: https://sendgrid.com/free
echo   - Get API key
echo   - Edit api-gateway\.env
echo   - Set: SENDGRID_ENABLED=True
echo   - Set: SENDGRID_API_KEY=SG.xxxxx
echo.

echo.
echo 2. GITHUB TOKEN (Required for AI)
echo --------------
echo   - Open: https://github.com/settings/tokens/new
echo   - Description: "Ultrarslanoglu API Gateway"
echo   - Select scopes: repo, read:packages
echo   - Generate token
echo   - Edit api-gateway\.env
echo   - Set: GITHUB_TOKEN=ghp_xxxxx
echo.

REM Open pages in browser
set /p OPEN_PAGES="Open configuration pages in browser? (Y/n): "
if /i "%OPEN_PAGES%"=="n" goto SKIP_BROWSER

echo Opening configuration pages...
start https://github.com/settings/tokens/new?description=Ultrarslanoglu-API-Gateway^&scopes=repo,read:packages
start https://myaccount.google.com/apppasswords

:SKIP_BROWSER

echo.
echo 3. START DOCKER SERVICES
echo ----------------------
set /p START_DOCKER="Start Docker containers? (Y/n): "
if /i "%START_DOCKER%"=="n" goto SKIP_DOCKER

echo Starting MongoDB and Redis...
docker-compose -f docker-compose.prod.yml up -d mongodb redis

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo Checking service health...
docker ps

:SKIP_DOCKER

echo.
echo ========================================
echo NEXT STEPS
echo ========================================
echo.
echo 1. Edit api-gateway\.env with your credentials
echo 2. Start API: cd api-gateway ^&^& python main_v2.py
echo 3. Test API: curl http://localhost:5000/health
echo 4. Run tests: cd api-gateway ^&^& python test_comprehensive.py
echo 5. Read docs: api-gateway\QUICK-START-V2.md
echo.
echo ========================================
echo READY TO CODE!
echo ========================================
echo.

pause
