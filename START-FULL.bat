@echo off
REM ========================================
REM ULTRARSLANOGLU - FULL STARTUP
REM All services start automatically
REM ========================================

setlocal enabledelayedexpansion

cls
echo.
echo ╔═════════════════════════════════════════════════════════╗
echo ║   ULTRARSLANOGLU - COMPLETE STARTUP (All Services)    ║
echo ║   %date% %time%
echo ╚═════════════════════════════════════════════════════════╝
echo.

set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

REM Colors via brackets
echo [INFO] Starting all services...
echo.

REM === STEP 1: Python Environment ===
echo [STEP 1] Python Environment
if not exist ".venv" (
    echo   Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
echo   ✓ Python activated
echo.

REM === STEP 2: Docker Services ===
echo [STEP 2] Docker Services
docker ps >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Docker is not running
    pause
    exit /b 1
)

echo   Starting MongoDB and Redis...
docker-compose -f docker-compose.prod.yml up -d mongodb redis >nul 2>&1
timeout /t 5 /nobreak >nul
echo   ✓ MongoDB running on :27017
echo   ✓ Redis running on :6379
echo.

REM === STEP 3: API Gateway ===
echo [STEP 3] API Gateway (Port 5000)
start "Ultrarslanoglu API Gateway" cmd /k "title Ultrarslanoglu API Gateway & cd /d "%PROJECT_ROOT%api-gateway" & ..\\.venv\Scripts\activate.bat & python main_v2.py"
timeout /t 4 /nobreak >nul

:check_api
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo   ⟳ API Gateway initializing...
    timeout /t 2 /nobreak >nul
    goto check_api
)
echo   ✓ API Gateway running
echo.

REM === STEP 4: Social Media Hub ===
echo [STEP 4] Social Media Hub (Port 3000)
start "Social Media Hub" cmd /k "title Ultrarslanoglu Social Media Hub & cd /d "%PROJECT_ROOT%social-media-hub" & npm run dev"
timeout /t 3 /nobreak >nul
echo   ✓ Social Media Hub starting...
echo.

REM === STEP 5: Website ===
echo [STEP 5] Website/Portal (Port 3001)
start "Ultrarslanoglu Website" cmd /k "title Ultrarslanoglu Website & cd /d "%PROJECT_ROOT%ultrarslanoglu-website" & npm run dev"
timeout /t 3 /nobreak >nul
echo   ✓ Website starting...
echo.

REM === STEP 6: Browser ===
echo [STEP 6] Opening Browser Windows
timeout /t 3 /nobreak >nul
start http://localhost:5000/health
timeout /t 1 /nobreak >nul
start http://localhost:3001

REM === SUCCESS MESSAGE ===
echo.
echo ╔═════════════════════════════════════════════════════════╗
echo ║   ALL SERVICES STARTED SUCCESSFULLY!                  ║
echo ╚═════════════════════════════════════════════════════════╝
echo.
echo [SERVICES]
echo   API Gateway  → http://localhost:5000
echo   Social Hub   → http://localhost:3000
echo   Website      → http://localhost:3001
echo   MongoDB      → localhost:27017
echo   Redis        → localhost:6379
echo.
echo [QUICK LINKS]
echo   Health:      http://localhost:5000/health
echo   Status:      http://localhost:5000/api/status
echo   Version:     http://localhost:5000/api/version
echo.
echo [LOGS]
echo   API:         api-gateway\logs\api-gateway.log
echo   Social:      social-media-hub\logs\social-hub.log
echo   Website:     ultrarslanoglu-website\logs\website.log
echo.
echo [COMMANDS]
echo   Stop all:      docker-compose -f docker-compose.prod.yml down
echo   View logs:     docker logs ultrarslanoglu-mongodb
echo   Test API:      curl http://localhost:5000/health
echo.
echo ⏹️  Close terminal windows to stop services
echo.
pause
