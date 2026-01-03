#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Videolardan oyuncu tespiti ve basit performans metrikleri çıkarımı.
Zero-shot image classification (CLIP) ile video karelerinde oyuncu adı etiketleme yapar.
Sonuçları CSV ve JSON olarak kaydeder.
"""

import argparse
import csv
import json
import os
from collections import Counter
from pathlib import Path
from typing import Iterable, List, Tuple

import cv2
from dotenv import load_dotenv
from PIL import Image
from transformers import pipeline

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


def load_players(player_file: Path = None, names: List[str] = None) -> List[str]:
    if player_file and player_file.exists():
        return [line.strip() for line in player_file.read_text(encoding="utf-8").splitlines() if line.strip()]
    if names:
        return [name.strip() for name in names if name.strip()]
    return ["leroy sane"]


def iter_frames(video_path: Path, stride_sec: float, max_frames: int = None):
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Video açılamadı: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    frame_stride = max(1, int(fps * stride_sec))

    frame_idx = 0
    yielded = 0
    success, frame = cap.read()
    while success:
        if frame_idx % frame_stride == 0:
            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            yield Image.fromarray(img_rgb)
            yielded += 1
            if max_frames and yielded >= max_frames:
                break
        frame_idx += 1
        success, frame = cap.read()
    cap.release()


def analyze_video(video_path: Path, players: List[str], classifier, stride_sec: float, max_frames: int = None) -> dict:
    counts = Counter()
    frame_total = 0
    for frame in iter_frames(video_path, stride_sec=stride_sec, max_frames=max_frames):
        frame_total += 1
        result = classifier(frame, candidate_labels=players)
        if not result:
            continue
        top = result[0]
        counts[top["label"]] += 1

    return {
        "video": str(video_path),
        "frames_sampled": frame_total,
        "counts": counts,
    }


def summarize(results: List[dict]) -> Tuple[List[dict], Counter]:
    rows = []
    total_counts = Counter()
    for item in results:
        video = item["video"]
        frames = item["frames_sampled"]
        counts: Counter = item["counts"]
        for player, hits in counts.items():
            coverage = hits / frames if frames else 0.0
            rows.append({
                "video": video,
                "player": player,
                "frames_sampled": frames,
                "hits": hits,
                "coverage": round(coverage, 4),
            })
            total_counts[player] += hits
    return rows, total_counts


def save_csv(rows: List[dict], path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["video", "player", "frames_sampled", "hits", "coverage"])
        writer.writeheader()
        writer.writerows(rows)


def save_json(data: dict, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Video içi oyuncu tespiti (zero-shot, CLIP)")
    parser.add_argument("--players", nargs="*", help="Boşlukla ayrılmış oyuncu adları (ör: leroy sane muslera)")
    parser.add_argument("--player-file", help="Her satırda bir oyuncu olacak şekilde dosya yolu")
    parser.add_argument("--stride-sec", type=float, default=1.0, help="Kare örnekleme aralığı (saniye)")
    parser.add_argument("--max-frames", type=int, default=None, help="Maksimum örneklenecek kare sayısı")
    parser.add_argument("--model", default="openai/clip-vit-base-patch32", help="Hugging Face zero-shot modeli")
    args = parser.parse_args()

    source_dir_env = os.getenv("VIDEO_SOURCE_DIR")
    output_csv_env = os.getenv("PLAYER_PERFORMANCE_OUTPUT", "./data/player_performance.csv")
    output_json_env = os.getenv("PLAYER_PERFORMANCE_JSON", "./data/player_performance.json")

    if not source_dir_env:
        raise SystemExit("VIDEO_SOURCE_DIR tanımlı değil. .env dosyanızı kontrol edin.")

    source_dir = Path(source_dir_env)
    if not source_dir.exists():
        raise SystemExit(f"Kaynak klasör bulunamadı: {source_dir}")

    config = load_config()
    allowed_exts = config.get("video", {}).get("supported_formats", [])
    videos = find_videos(source_dir, allowed_exts)
    if not videos:
        raise SystemExit(f"Desteklenen uzantılarda video bulunamadı: {allowed_exts}")

    players = load_players(player_file=Path(args.player_file) if args.player_file else None, names=args.players)
    if not players:
        raise SystemExit("Analiz için en az bir oyuncu adı gerekli.")

    classifier = pipeline(
        "zero-shot-image-classification",
        model=args.model,
        device_map="auto"
    )

    per_video = []
    for video in videos:
        result = analyze_video(
            video_path=video,
            players=players,
            classifier=classifier,
            stride_sec=args.stride_sec,
            max_frames=args.max_frames,
        )
        per_video.append(result)
        print(f"Analiz tamamlandı: {video} (kare: {result['frames_sampled']})")

    rows, total_counts = summarize(per_video)

    output_csv = Path(output_csv_env)
    save_csv(rows, output_csv)
    save_json({
        "players": players,
        "totals": total_counts,
        "videos": per_video,
    }, Path(output_json_env))

    print("=== Özet ===")
    print(f"Oyuncular: {', '.join(players)}")
    print(f"Toplam isabet: {dict(total_counts)}")
    print(f"CSV: {output_csv}")
    print(f"JSON: {output_json_env}")


if __name__ == "__main__":
    main()
