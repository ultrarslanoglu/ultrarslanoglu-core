@echo off
REM Galatasaray Analytics Platform - Quick Start Script for Windows
REM Kullanım: start-dashboard.bat

cls
echo.
echo 0xED Galatasaray Analytics Platform
echo ===============================================
echo.

REM Docker kontrol
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Docker kurulu değil. Lütfen Docker Desktop'ı kurun.
    pause
    exit /b 1
)

REM Docker Compose kontrol
where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Docker Compose kurulu değil. Lütfen kurun.
    pause
    exit /b 1
)

echo [OK] Docker ve Docker Compose bulundu
echo.

:menu
echo Ne yapmak istiyorsunuz?
echo.
echo 1) [ROCKET] Docker ile tüm sistemi başlat
echo 2) [STOP] Tüm servisleri durdur
echo 3) [REFRESH] Servisleri yeniden başlat
echo 4) [CHART] Streamlit dashboard'unu aç
echo 5) [GLOBE] Web sayfasını aç
echo 6) [SEARCH] Logları izle
echo 7) [TRASH] Konteynerileri temizle
echo 8) [CLOSE] Çık
echo.
set /p choice="Seçim yapın (1-8): "

if "%choice%"=="1" goto start_system
if "%choice%"=="2" goto stop_system
if "%choice%"=="3" goto restart_system
if "%choice%"=="4" goto open_dashboard
if "%choice%"=="5" goto open_website
if "%choice%"=="6" goto show_logs
if "%choice%"=="7" goto clean_system
if "%choice%"=="8" goto exit_script
goto menu

:start_system
echo.
echo [INFO] Docker ile sistem başlatılıyor...
echo.

if not exist .env (
    echo [UYARI] .env dosyası bulunamadı. .env.example'den kopyalanıyor...
    copy .env.example .env
    echo [UYARI] Lütfen .env dosyasını düzenleyip API keys'leri girin!
    echo [UYARI] notepad .env
    pause
    exit /b 1
)

docker-compose up -d

echo.
echo [OK] Sistemler başlatıldı!
echo.
echo Erişim Noktaları:
echo   Flask API:     http://localhost:5002
echo   Streamlit:     http://localhost:8501
echo   MongoDB:       localhost:27017
echo   Redis:         localhost:6379
echo.
echo Kontrol et: docker ps
echo.
pause
goto menu

:stop_system
echo.
echo [INFO] Tüm servisleri durdurma...
docker-compose down
echo [OK] Servisleri durduruldu
echo.
pause
goto menu

:restart_system
echo.
echo [INFO] Servisleri yeniden başlatma...
docker-compose restart
echo [OK] Servisleri yeniden başlatıldı
echo.
pause
goto menu

:open_dashboard
echo.
echo [INFO] Streamlit dashboard'unu açıyor...
start http://localhost:8501
echo [OK] Dashboard açılıyor: http://localhost:8501
echo.
pause
goto menu

:open_website
echo.
echo [INFO] Web sayfasını açıyor...
start http://localhost:3000/galatasaray
echo [OK] Web sayfası açılıyor: http://localhost:3000/galatasaray
echo.
pause
goto menu

:show_logs
echo.
echo [INFO] Flask API logları (Ctrl+C ile çık)...
docker-compose logs -f galatasaray-analytics
goto menu

:clean_system
echo.
echo [UYARI] Tüm konteynerler, volumeler ve network'ü kaldıracak!
set /p confirm="Devam etmek istiyor musunuz (E/H)? "
if /i "%confirm%"=="E" (
    docker-compose down -v
    echo [OK] Kaynaklar temizlendi
) else (
    echo İşlem iptal edildi
)
echo.
pause
goto menu

:exit_script
cls
echo.
echo ===============================================
echo 0xED Keyifli analiz'ler! 0xED
echo ===============================================
echo.
exit /b 0
