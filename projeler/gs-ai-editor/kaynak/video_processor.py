#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GS AI Editor - Video İşleme Modülü
"""

import cv2
import numpy as np
from moviepy.editor import VideoFileClip, concatenate_videoclips, TextClip, CompositeVideoClip
from loguru import logger
from typing import List, Dict, Tuple, Optional
import os


class VideoProcessor:
    """Video işleme sınıfı"""
    
    def __init__(self):
        self.temp_dir = os.getenv("TEMP_DIR", "./temp")
        os.makedirs(self.temp_dir, exist_ok=True)
        logger.info("VideoProcessor initialized")
    
    def get_video_info(self, video_path: str) -> Dict:
        """
        Video bilgilerini al
        
        Args:
            video_path: Video dosya yolu
            
        Returns:
            Video meta verileri
        """
        try:
            clip = VideoFileClip(video_path)
            
            info = {
                "duration": clip.duration,
                "size": clip.size,
                "fps": clip.fps,
                "resolution": f"{clip.size[0]}x{clip.size[1]}",
                "width": clip.size[0],
                "height": clip.size[1],
                "aspect_ratio": clip.size[0] / clip.size[1]
            }
            
            clip.close()
            logger.info(f"Video info extracted: {info['resolution']} @ {info['fps']}fps")
            return info
            
        except Exception as e:
            logger.error(f"Error getting video info: {e}")
            raise
    
    def extract_frames(
        self, 
        video_path: str, 
        interval: float = 1.0,
        max_frames: int = 100
    ) -> List[np.ndarray]:
        """
        Videodan kareler çıkar
        
        Args:
            video_path: Video dosya yolu
            interval: Saniye cinsinden aralık
            max_frames: Maksimum kare sayısı
            
        Returns:
            Numpy array listesi
        """
        frames = []
        
        try:
            clip = VideoFileClip(video_path)
            duration = clip.duration
            
            times = np.arange(0, duration, interval)
            times = times[:max_frames]  # Limit frames
            
            for t in times:
                frame = clip.get_frame(t)
                frames.append(frame)
            
            clip.close()
            logger.info(f"Extracted {len(frames)} frames from video")
            return frames
            
        except Exception as e:
            logger.error(f"Error extracting frames: {e}")
            raise
    
    def detect_scenes(self, video_path: str, threshold: float = 30.0) -> List[Tuple[float, float]]:
        """
        Sahne değişikliklerini tespit et
        
        Args:
            video_path: Video dosya yolu
            threshold: Değişiklik eşiği
            
        Returns:
            (başlangıç, bitiş) zamanları listesi
        """
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        scenes = []
        prev_frame = None
        scene_start = 0
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            if prev_frame is not None:
                # Frame farkını hesapla
                diff = cv2.absdiff(prev_frame, gray)
                mean_diff = np.mean(diff)
                
                if mean_diff > threshold:
                    # Sahne değişikliği tespit edildi
                    scene_end = frame_count / fps
                    scenes.append((scene_start, scene_end))
                    scene_start = scene_end
            
            prev_frame = gray
            frame_count += 1
        
        # Son sahneyi ekle
        if frame_count > 0:
            scenes.append((scene_start, frame_count / fps))
        
        cap.release()
        logger.info(f"Detected {len(scenes)} scenes")
        return scenes
    
    def auto_cut(
        self, 
        video_path: str, 
        min_scene_duration: float = 2.0,
        max_scene_duration: float = 10.0
    ) -> List[VideoFileClip]:
        """
        Otomatik video kesimi
        
        Args:
            video_path: Video dosya yolu
            min_scene_duration: Minimum sahne süresi
            max_scene_duration: Maksimum sahne süresi
            
        Returns:
            Kesilen klipler listesi
        """
        scenes = self.detect_scenes(video_path)
        clip = VideoFileClip(video_path)
        
        cuts = []
        for start, end in scenes:
            duration = end - start
            
            # Çok kısa sahneleri atla
            if duration < min_scene_duration:
                continue
            
            # Uzun sahneleri böl
            if duration > max_scene_duration:
                num_parts = int(np.ceil(duration / max_scene_duration))
                part_duration = duration / num_parts
                
                for i in range(num_parts):
                    part_start = start + (i * part_duration)
                    part_end = min(part_start + part_duration, end)
                    cuts.append(clip.subclip(part_start, part_end))
            else:
                cuts.append(clip.subclip(start, end))
        
        logger.info(f"Created {len(cuts)} auto-cuts")
        return cuts
    
    def add_text_overlay(
        self,
        clip: VideoFileClip,
        text: str,
        position: Tuple[int, int] = ('center', 'bottom'),
        duration: Optional[float] = None
    ) -> VideoFileClip:
        """
        Videoya yazı ekle
        
        Args:
            clip: Video klibi
            text: Eklenecek yazı
            position: Yazı pozisyonu
            duration: Yazı süresi (None ise video süresi kadar)
            
        Returns:
            Yazılı video
        """
        txt_clip = TextClip(
            text,
            fontsize=50,
            color='white',
            font='Arial-Bold',
            stroke_color='black',
            stroke_width=2
        )
        
        txt_clip = txt_clip.set_position(position)
        txt_clip = txt_clip.set_duration(duration or clip.duration)
        
        result = CompositeVideoClip([clip, txt_clip])
        logger.info(f"Text overlay added: {text[:30]}...")
        return result
    
    def optimize_for_platform(
        self,
        video_path: str,
        platform: str,
        output_path: str
    ) -> str:
        """
        Platformlar için video optimizasyonu
        
        Args:
            video_path: Kaynak video yolu
            platform: Hedef platform (instagram/tiktok/youtube)
            output_path: Çıktı dosya yolu
            
        Returns:
            Optimize edilmiş video yolu
        """
        clip = VideoFileClip(video_path)
        
        # Platform özellikleri
        platform_specs = {
            "instagram": {
                "max_duration": 60,
                "aspect_ratio": (9, 16),  # Stories/Reels
                "resolution": (1080, 1920),
                "fps": 30
            },
            "tiktok": {
                "max_duration": 180,
                "aspect_ratio": (9, 16),
                "resolution": (1080, 1920),
                "fps": 30
            },
            "youtube": {
                "max_duration": None,
                "aspect_ratio": (16, 9),
                "resolution": (1920, 1080),
                "fps": 60
            }
        }
        
        spec = platform_specs.get(platform, platform_specs["instagram"])
        
        # Süre kısıtlaması
        if spec["max_duration"] and clip.duration > spec["max_duration"]:
            clip = clip.subclip(0, spec["max_duration"])
        
        # Çözünürlük ayarı
        target_width, target_height = spec["resolution"]
        clip = clip.resize(newsize=(target_width, target_height))
        
        # FPS ayarı
        clip = clip.set_fps(spec["fps"])
        
        # Dosyayı kaydet
        clip.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            temp_audiofile='temp-audio.m4a',
            remove_temp=True
        )
        
        clip.close()
        logger.info(f"Video optimized for {platform}: {output_path}")
        return output_path
    
    def merge_clips(self, clips: List[VideoFileClip], output_path: str) -> str:
        """
        Klipleri birleştir
        
        Args:
            clips: Birleştirilecek klipler
            output_path: Çıktı dosya yolu
            
        Returns:
            Birleştirilmiş video yolu
        """
        final_clip = concatenate_videoclips(clips, method="compose")
        
        final_clip.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac'
        )
        
        final_clip.close()
        logger.info(f"Merged {len(clips)} clips to {output_path}")
        return output_path


# Singleton instance
_video_processor = None

def get_video_processor() -> VideoProcessor:
    """VideoProcessor singleton"""
    global _video_processor
    if _video_processor is None:
        _video_processor = VideoProcessor()
    return _video_processor
