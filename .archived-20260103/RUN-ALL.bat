@echo off
REM Ultrarslanoglu Complete Project Startup
REM All services in one script

setlocal enabledelayedexpansion

cls
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║    ULTRARSLANOGLU - Complete Project Startup              ║
echo ║    %date% %time%
echo ╚═══════════════════════════════════════════════════════════╝
echo.

set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

REM Colors setup (via substrings for readability)
set "INFO=[INFO]"
set "OK=[OK]"
set "WAIT=[WAIT]"
set "ERROR=[ERROR]"

echo.
echo %INFO% Starting infrastructure and services...
echo.

REM Check Docker
echo %INFO% Checking Docker Desktop...
docker ps >nul 2>&1
if errorlevel 1 (
    echo %WAIT% Docker Desktop is not running or paused
    echo %INFO% Please start Docker Desktop manually
    echo.
    pause
    exit /b 1
)
echo %OK% Docker is running

REM Activate Python
echo.
echo %INFO% Activating Python environment...
if not exist ".venv" (
    echo %INFO% Creating Python virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
echo %OK% Python environment activated

REM Start Docker containers
echo.
echo %INFO% Starting Docker containers (MongoDB, Redis)...
docker-compose -f docker-compose.prod.yml up -d mongodb redis
timeout /t 5 /nobreak >nul
echo %OK% Docker containers started

REM API Gateway
echo.
echo %INFO% Starting API Gateway (port 5000)...
start "Ultrarslanoglu API Gateway" cmd /k "title Ultrarslanoglu API Gateway & cd api-gateway && python main_v2.py"
timeout /t 3 /nobreak >nul

echo %WAIT% Checking API Gateway health...
set retry=0
:api_retry
if %retry% geq 10 (
    echo %WAIT% API Gateway may still be starting...
    goto social_start
)
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    set /a retry+=1
    timeout /t 1 /nobreak >nul
    goto api_retry
)
echo %OK% API Gateway is healthy

REM Social Media Hub
:social_start
echo.
echo %INFO% Starting Social Media Hub (port 3000)...
start "Social Media Hub" cmd /k "title Social Media Hub & cd social-media-hub && npm run dev"
timeout /t 2 /nobreak >nul
echo %WAIT% Social Media Hub starting...

REM Website
echo.
echo %INFO% Starting Website (port 3001)...
start "Ultrarslanoglu Website" cmd /k "title Ultrarslanoglu Website & cd ultrarslanoglu-website && npm run dev"
timeout /t 2 /nobreak >nul
echo %WAIT% Website starting...

REM Open browsers
echo.
echo %INFO% Opening browser windows...
timeout /t 3 /nobreak >nul
start http://localhost:5000/health
timeout /t 1 /nobreak >nul
start http://localhost:3001

REM Summary
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║    ALL SERVICES STARTED SUCCESSFULLY!                     ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📋 SERVICES STATUS:
echo.
echo   🔗 API Gateway
echo      URL: http://localhost:5000
echo      Health: http://localhost:5000/health
echo      Docs: http://localhost:5000/api/status
echo.
echo   📱 Social Media Hub
echo      URL: http://localhost:3000
echo      Status: Starting...
echo.
echo   🌐 Website / Portal
echo      URL: http://localhost:3001
echo      Status: Starting...
echo.
echo   📊 MongoDB
echo      Host: localhost:27017
echo      Database: ultrarslanoglu
echo.
echo   🔴 Redis
echo      Host: localhost:6379
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║    TESTING ENDPOINTS                                      ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Give services time to start
timeout /t 5 /nobreak >nul

REM Test API Health
echo %INFO% Testing API Gateway...
curl -s http://localhost:5000/health | findstr "status" >nul 2>&1
if not errorlevel 1 (
    echo %OK% API Gateway health check passed
) else (
    echo %WAIT% API Gateway still initializing...
)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║    QUICK REFERENCE                                        ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📝 LOGS:
echo   - API Gateway: api-gateway/logs/api-gateway.log
echo   - Databases: Check Docker logs with: docker logs [container]
echo.
echo 🔧 USEFUL COMMANDS:
echo   - View Docker logs: docker logs ultrarslanoglu-mongodb
echo   - Stop all: docker-compose -f docker-compose.prod.yml down
echo   - Reset: docker-compose -f docker-compose.prod.yml down -v
echo.
echo 📊 MONITORING:
echo   - API Status: http://localhost:5000/api/status
echo   - Health Check: http://localhost:5000/health
echo.
echo ✅ Open the new browser windows to access services
echo ⏹️  Close each terminal window to stop a service
echo.
pause
