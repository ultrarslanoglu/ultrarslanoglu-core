#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Galatasaray Analytics Platform - Setup Verification Script
Tüm bileşenlerin yüklendiğini ve çalıştığını kontrol et
"""

import os
import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'═'*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'═'*60}{Colors.END}\n")

def print_check(text, status=True):
    symbol = f"{Colors.GREEN}✅{Colors.END}" if status else f"{Colors.RED}❌{Colors.END}"
    print(f"  {symbol} {text}")

def check_file(path, description):
    """Dosya var mı kontrol et"""
    exists = Path(path).exists()
    print_check(f"{description}: {path}", exists)
    return exists

def check_directory(path, description):
    """Dizin var mı kontrol et"""
    exists = Path(path).is_dir()
    print_check(f"{description}: {path}/", exists)
    return exists

def check_command(cmd, description):
    """Komut kurulu mu kontrol et"""
    try:
        subprocess.run([cmd, "--version"], capture_output=True, check=True)
        print_check(f"{description} kurulu", True)
        return True
    except:
        print_check(f"{description} kurulu değil", False)
        return False

def main():
    print(f"\n{Colors.BOLD}{Colors.GREEN}")
    print("  🟡 GALATASARAY ANALYTICS PLATFORM")
    print("  Setup Verification v1.0")
    print(f"{Colors.END}")
    
    print(f"\n  {Colors.BOLD}Kontrol tarihi:{Colors.END} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        "files": [],
        "directories": [],
        "commands": [],
        "docker": [],
        "timestamp": datetime.now().isoformat()
    }
    
    # ==================== SİSTEM KONTROLLERİ ====================
    print_header("📦 Sistem Bileşenleri")
    
    results["commands"].append({
        "name": "Python",
        "status": check_command("python3", "Python 3")
    })
    
    results["commands"].append({
        "name": "Docker",
        "status": check_command("docker", "Docker")
    })
    
    results["commands"].append({
        "name": "Docker Compose",
        "status": check_command("docker-compose", "Docker Compose")
    })
    
    results["commands"].append({
        "name": "Git",
        "status": check_command("git", "Git")
    })
    
    # ==================== PROJESİ DÖSYALARı ====================
    print_header("📁 Proje Dosyaları")
    
    base_path = Path(__file__).parent
    
    critical_files = [
        ("main.py", "Flask API"),
        ("streamlit_dashboard.py", "Streamlit Dashboard"),
        ("requirements.txt", "Python Dependencies"),
        ("docker-compose.yml", "Docker Compose Config"),
        ("Dockerfile", "Docker Image"),
        (".env.example", "Environment Template"),
    ]
    
    for file, desc in critical_files:
        path = base_path / file
        status = check_file(str(path), desc)
        results["files"].append({"name": file, "status": status})
    
    # ==================== DİZİNLER ====================
    print_header("📂 Dizin Yapısı")
    
    directories = [
        ("src", "Source Code"),
        ("src/database", "Database Layer"),
        ("src/models", "Data Models"),
        ("src/services", "Services"),
        ("src/analyzers", "Analytics Engine"),
        ("config", "Configuration"),
        ("logs", "Logs"),
    ]
    
    for dir, desc in directories:
        path = base_path / dir
        status = check_directory(str(path), desc)
        results["directories"].append({"name": dir, "status": status})
    
    # ==================== KAYNAK DOSYALARI ====================
    print_header("🔧 Kaynak Kod Dosyaları")
    
    source_files = [
        ("src/database/manager.py", "Database Manager"),
        ("src/database/squad_data.py", "Player & Club Data"),
        ("src/models/schemas.py", "Data Models"),
        ("src/services/data_collector.py", "Data Collectors"),
        ("src/analyzers/analyzer.py", "Analytics Engine"),
        ("config/config.py", "Configuration"),
    ]
    
    for file, desc in source_files:
        path = base_path / file
        status = check_file(str(path), desc)
        results["files"].append({"name": file, "status": status})
    
    # ==================== DOKÜMENTASİON ====================
    print_header("📚 Dokümantasyon Dosyaları")
    
    docs = [
        ("README.md", "Technical Documentation"),
        ("QUICKSTART.md", "5-Minute Quick Start"),
        ("DASHBOARD.md", "Dashboard Guide"),
        ("WEB-INTEGRATION.md", "Web Integration Guide"),
        ("DEPLOYMENT.md", "Deployment Guide"),
        ("FINAL_SETUP.txt", "Setup Summary"),
    ]
    
    for file, desc in docs:
        path = base_path / file
        status = check_file(str(path), desc)
        results["files"].append({"name": file, "status": status})
    
    # ==================== DOCKER ====================
    print_header("🐳 Docker Kontrol")
    
    docker_status = check_command("docker", "Docker daemon")
    results["docker"].append({"name": "daemon", "status": docker_status})
    
    if docker_status:
        # Containers kontrol et
        try:
            result = subprocess.run(
                ["docker", "ps", "-a", "--format", "{{.Names}}"],
                capture_output=True,
                text=True
            )
            containers = result.stdout.strip().split('\n') if result.stdout.strip() else []
            
            gs_containers = [c for c in containers if 'gs-' in c or 'galatasaray' in c]
            if gs_containers:
                print_check(f"Galatasaray containers: {', '.join(gs_containers)}", True)
            else:
                print_check("Galatasaray containers henüz başlatılmadı (docker-compose up -d)", False)
            
            results["docker"].append({
                "name": "containers",
                "status": len(gs_containers) > 0,
                "count": len(gs_containers)
            })
        except Exception as e:
            print_check(f"Docker containers kontrol edilemedi: {e}", False)
    
    # ==================== KONFİGURASYON ====================
    print_header("⚙️ Konfigürasyon")
    
    # .env kontrolü
    env_path = base_path / ".env"
    env_exists = env_path.exists()
    print_check(f".env dosyası", env_exists)
    
    if not env_exists:
        env_example = base_path / ".env.example"
        if env_example.exists():
            print(f"\n  {Colors.YELLOW}→ .env dosyasını oluşturmak için:{Colors.END}")
            print(f"    cp .env.example .env")
            print(f"    nano .env  # API keys'leri girin")
    
    results["files"].append({"name": ".env", "status": env_exists, "critical": True})
    
    # ==================== ÖZET ====================
    print_header("📊 Özet Raporu")
    
    total_files = len([f for f in results["files"] if f.get("status", False)])
    total_dirs = len([d for d in results["directories"] if d.get("status", False)])
    total_commands = len([c for c in results["commands"] if c.get("status", False)])
    
    print(f"\n  {Colors.BOLD}Dosyalar:{Colors.END} {total_files}/{len(results['files'])} ✅")
    print(f"  {Colors.BOLD}Dizinler:{Colors.END} {total_dirs}/{len(results['directories'])} ✅")
    print(f"  {Colors.BOLD}Komutlar:{Colors.END} {total_commands}/{len(results['commands'])} ✅")
    
    all_ok = (
        total_files == len(results['files']) and
        total_dirs == len(results['directories']) and
        total_commands >= 2  # At least Python and one other
    )
    
    print_header("✨ Sonuç")
    
    if all_ok:
        print(f"\n  {Colors.GREEN}{Colors.BOLD}✅ SETUP BAŞARIYLA TAMAMLANDI!{Colors.END}")
        print(f"\n  {Colors.BOLD}Sonraki Adımlar:{Colors.END}")
        print(f"    1. .env dosyasını düzenle (API keys ekle)")
        print(f"    2. docker-compose up -d çalıştır")
        print(f"    3. http://localhost:8501 adresini ziyaret et")
        print(f"    4. Oyuncuları ve klub verilerini görüntüle")
    else:
        print(f"\n  {Colors.RED}{Colors.BOLD}⚠️ UYARI: Bazı dosyalar eksik!{Colors.END}")
        print(f"\n  {Colors.YELLOW}Eksik dosyalar:{Colors.END}")
        
        for file in results["files"]:
            if not file.get("status", False):
                print(f"    - {file['name']}")
    
    # ==================== JSON RAPOR ====================
    report_path = base_path / "setup_verification_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n  {Colors.BLUE}Detaylı rapor: {report_path}{Colors.END}\n")
    
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
