#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Basit oyuncu bazlı video çıkarıcı.
İsimde oyuncu adı geçen videoları VIDEO_SOURCE_DIR içinden bulur
ve PLAYER_CLIPS_DIR altında oyuncu klasörüne kopyalar.
"""

import argparse
import json
import os
import shutil
from pathlib import Path
from typing import Iterable, List

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config.json"


def load_config() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_ext(ext: str) -> str:
    return ext.lower().lstrip(".")


def find_videos(source_dir: Path, allowed_exts: Iterable[str]) -> List[Path]:
    exts = {normalize_ext(ext) for ext in allowed_exts}
    return [p for p in source_dir.rglob("*") if p.is_file() and normalize_ext(p.suffix) in exts]


def matches_player(path: Path, player_tokens: List[str]) -> bool:
    name_lower = path.name.lower()
    return all(token in name_lower for token in player_tokens)


def copy_video(src: Path, dest_dir: Path) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    target = dest_dir / src.name
    shutil.copy2(src, target)
    return target


def extract_player_clips(player_name: str, dry_run: bool = False) -> dict:
    source_dir_env = os.getenv("VIDEO_SOURCE_DIR")
    clips_dir_env = os.getenv("PLAYER_CLIPS_DIR", "./data/player_clips")

    if not source_dir_env:
        raise SystemExit("VIDEO_SOURCE_DIR tanımlı değil. .env dosyanızı kontrol edin.")

    source_dir = Path(source_dir_env)
    if not source_dir.exists():
        raise SystemExit(f"Kaynak klasör bulunamadı: {source_dir}")

    output_dir = Path(clips_dir_env) / player_name.lower().replace(" ", "-")

    config = load_config()
    allowed_exts = config.get("video", {}).get("supported_formats", [])
    videos = find_videos(source_dir, allowed_exts)

    player_tokens = [t.strip().lower() for t in player_name.split() if t.strip()]
    matched = [v for v in videos if matches_player(v, player_tokens)]

    copied = []
    for video in matched:
        if dry_run:
            continue
        copied.append(copy_video(video, output_dir))

    return {
        "player": player_name,
        "source_dir": str(source_dir),
        "output_dir": str(output_dir),
        "matched": len(matched),
        "copied": len(copied),
        "copied_files": [str(p) for p in copied],
    }


def main():
    parser = argparse.ArgumentParser(description="Oyuncu bazlı video klip çıkarma")
    parser.add_argument("--player", default="leroy sane", help="Oyuncu adı (varsayılan: leroy sane)")
    parser.add_argument("--dry-run", action="store_true", help="Kopyalama yapmadan eşleşenleri listele")
    args = parser.parse_args()

    result = extract_player_clips(player_name=args.player, dry_run=args.dry_run)

    print("=== Oyuncu Klip Çıkarma ===")
    print(f"Oyuncu: {result['player']}")
    print(f"Kaynak klasör: {result['source_dir']}")
    print(f"Hedef klasör: {result['output_dir']}")
    print(f"Eşleşen video sayısı: {result['matched']}")
    if args.dry_run:
        print("Dry-run modunda çalıştınız, kopyalama yapılmadı.")
    else:
        print(f"Kopyalanan video sayısı: {result['copied']}")
        for path in result["copied_files"]:
            print(f"- {path}")


if __name__ == "__main__":
    main()
