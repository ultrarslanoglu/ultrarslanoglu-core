@echo off
REM Quick API Health Check Script

echo.
echo ╔════════════════════════════════════════════╗
echo ║   API HEALTH CHECK                         ║
echo ║   Testing all endpoints                    ║
echo ╚════════════════════════════════════════════╝
echo.

setlocal enabledelayedexpansion

REM Test API Gateway
echo [1] API Gateway Health Check
timeout /t 1 /nobreak >nul
curl -s -w "\n" http://localhost:5000/health

echo.
echo [2] API Status
timeout /t 1 /nobreak >nul
curl -s http://localhost:5000/api/status | findstr "status" >nul 2>&1
if not errorlevel 1 (
    echo   ✓ Status endpoint responding
) else (
    echo   ✗ Status endpoint error
)

echo.
echo [3] API Version
timeout /t 1 /nobreak >nul
curl -s http://localhost:5000/api/version | findstr "version" >nul 2>&1
if not errorlevel 1 (
    echo   ✓ Version endpoint responding
) else (
    echo   ✗ Version endpoint error
)

echo.
echo [4] MongoDB Connection
timeout /t 1 /nobreak >nul
docker exec ultrarslanoglu-mongodb mongosh --eval "db.adminCommand('ping')" >nul 2>&1
if not errorlevel 1 (
    echo   ✓ MongoDB connected and healthy
) else (
    echo   ⚠ MongoDB initializing
)

echo.
echo [5] Redis Connection
timeout /t 1 /nobreak >nul
docker exec ultrarslanoglu-redis redis-cli ping >nul 2>&1
if not errorlevel 1 (
    echo   ✓ Redis connected and healthy
) else (
    echo   ✗ Redis connection failed
)

echo.
echo ════════════════════════════════════════════
echo Health check complete!
echo ════════════════════════════════════════════
echo.
pause
