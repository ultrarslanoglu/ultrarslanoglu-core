@echo off
REM ========================================
REM ULTRARSLANOGLU - COMPLETE STARTUP
REM All services: Docker + Python + Node
REM ========================================

setlocal enabledelayedexpansion
color 0A
mode 120,40

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   ULTRARSLANOGLU - COMPLETE STARTUP                       ║
echo ║   All Services Starting...                                ║
echo ║   %date% %time%
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM === Check Docker ===
echo [Step 1] Docker Services
docker ps >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Docker not running!
    echo   Start Docker Desktop and try again.
    pause
    exit /b 1
)

REM === Start MongoDB and Redis ===
echo   Starting MongoDB and Redis...
docker start ultrarslanoglu-mongodb ultrarslanoglu-redis >nul 2>&1
timeout /t 5 /nobreak >nul
echo   ✓ MongoDB on :27017
echo   ✓ Redis on :6379
echo.

REM === Python Environment ===
echo [Step 2] Python Environment
if not exist ".venv" (
    echo   Creating .venv...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
echo   ✓ Virtual environment ready
echo.

REM === Initialize DB ===
echo [Step 3] Database Initialization
cd api-gateway
python init_db.py >nul 2>&1
cd ..
echo   ✓ Database initialized
echo.

REM === API Gateway ===
echo [Step 4] API Gateway (Port 5000)
start "Ultrarslanoglu API Gateway" cmd /k "title API Gateway & cd api-gateway & ..\\.venv\Scripts\activate.bat & python main_v2.py"
timeout /t 4 /nobreak >nul
echo   ✓ API Gateway starting...
echo.

REM === Social Media Hub ===
echo [Step 5] Social Media Hub (Port 3000)
start "Social Media Hub" cmd /k "title Social Media Hub & cd social-media-hub & npm run dev"
timeout /t 3 /nobreak >nul
echo   ✓ Social Media Hub starting...
echo.

REM === Website ===
echo [Step 6] Website (Port 3001)
start "Ultrarslanoglu Website" cmd /k "title Website & cd ultrarslanoglu-website & npm run dev"
timeout /t 3 /nobreak >nul
echo   ✓ Website starting...
echo.

REM === Open Browsers ===
echo [Step 7] Opening Browsers
timeout /t 3 /nobreak >nul
start http://localhost:5000/health
timeout /t 1 /nobreak >nul
start http://localhost:3001
echo   ✓ Browser windows opening...
echo.

REM === Success Message ===
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   ALL SERVICES STARTED SUCCESSFULLY!                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo [SERVICES RUNNING]
echo   API Gateway:      http://localhost:5000
echo   Social Hub:       http://localhost:3000
echo   Website:          http://localhost:3001
echo   MongoDB:          localhost:27017
echo   Redis:            localhost:6379
echo.
echo [QUICK TESTS]
echo   Health:           http://localhost:5000/health
echo   Status:           http://localhost:5000/api/status
echo.
echo [COMMANDS]
echo   Run tests:        cd api-gateway ^&^& python test_comprehensive.py
echo   Check health:     CHECK-HEALTH.bat
echo   Stop services:    docker stop ultrarslanoglu-mongodb ultrarslanoglu-redis
echo.
echo [LOGS]
echo   API:              api-gateway\logs\api-gateway.log
echo   Social:           social-media-hub\logs\social-hub.log
echo   Website:          ultrarslanoglu-website\logs\website.log
echo.
echo ═══════════════════════════════════════════════════════════════
echo Browser windows will open automatically!
echo Close terminal windows to stop services.
echo ═══════════════════════════════════════════════════════════════
echo.
pause
echo.
pause

REM Opsiyonel: Tamamen Dur
REM docker compose -f docker-compose.dev.yml down
