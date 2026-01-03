@echo off
REM Galatasaray Analytics Platform - Setup Script (Windows)

echo 🚀 Galatasaray Analytics Platform - Kurulum Basladi
echo ==================================================

REM Python version check
python --version
echo ✅ Python kontrolu yapildi

REM Virtual environment
if not exist "venv" (
    echo 🔧 Virtual environment olusturuluyor...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat
echo ✅ Virtual environment aktif

REM Requirements
echo 📦 Dependencies yukleniyor...
pip install --upgrade pip
pip install -r requirements.txt
echo ✅ Dependencies yuklendi

REM .env setup
if not exist ".env" (
    echo 📝 .env dosyasi olusturuluyor...
    copy .env.example .env
    echo ⚠️  .env dosyasini API keys ile guncelleyin!
)

REM Logs directory
if not exist "logs" mkdir logs
echo 📁 Logs directory hazirlandi

echo.
echo ==================================================
echo ✅ Kurulum Tamamlandi!
echo ==================================================
echo.
echo 🚀 Basmak icin:
echo    python main.py
echo.
echo 📖 Daha fazla bilgi icin README.md'yi okuyun
echo.
