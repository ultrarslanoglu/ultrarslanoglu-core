#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GS AI Editor - GitHub Models Entegrasyon Modülü
Azure AI Inference kullanarak GitHub Models ile etkileşim
"""

import os
from typing import List, Dict, Optional
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from loguru import logger


class GitHubModelsClient:
    """GitHub Models API istemcisi"""
    
    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable is required")
        
        self.endpoint = "https://models.inference.ai.azure.com"
        self.model_name = os.getenv("AI_MODEL", "gpt-4o")
        
        self.client = ChatCompletionsClient(
            endpoint=self.endpoint,
            credential=AzureKeyCredential(self.token)
        )
        logger.info(f"GitHub Models client initialized with model: {self.model_name}")
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        Chat completion isteği gönder
        
        Args:
            messages: Mesaj listesi [{"role": "user", "content": "..."}]
            temperature: Yaratıcılık seviyesi (0-1)
            max_tokens: Maksimum token sayısı
            
        Returns:
            Model yanıtı
        """
        try:
            # Mesajları dönüştür
            formatted_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    formatted_messages.append(SystemMessage(content=msg["content"]))
                elif msg["role"] == "user":
                    formatted_messages.append(UserMessage(content=msg["content"]))
            
            # İstek gönder
            response = self.client.complete(
                messages=formatted_messages,
                model=self.model_name,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            result = response.choices[0].message.content
            logger.info(f"Completion successful: {len(result)} characters")
            return result
            
        except Exception as e:
            logger.error(f"Chat completion error: {e}")
            raise
    
    def analyze_video_content(self, video_path: str, prompt: str) -> str:
        """
        Video içeriğini analiz et
        
        Args:
            video_path: Video dosya yolu
            prompt: Analiz talimatı
            
        Returns:
            Analiz sonucu
        """
        messages = [
            {
                "role": "system",
                "content": "Sen profesyonel bir video editörü ve içerik analistisin. Galatasaray takımı için içerik üretiyorsun."
            },
            {
                "role": "user",
                "content": f"{prompt}\n\nVideo: {video_path}"
            }
        ]
        
        return self.chat_completion(messages, temperature=0.3)
    
    def suggest_edits(self, video_metadata: Dict) -> List[Dict]:
        """
        Video düzenleme önerileri üret
        
        Args:
            video_metadata: Video meta verileri
            
        Returns:
            Düzenleme önerileri listesi
        """
        prompt = f"""
        Video Meta Verileri:
        - Süre: {video_metadata.get('duration', 'N/A')}
        - Çözünürlük: {video_metadata.get('resolution', 'N/A')}
        - FPS: {video_metadata.get('fps', 'N/A')}
        - Konu: {video_metadata.get('topic', 'Galatasaray içeriği')}
        
        Bu video için profesyonel düzenleme önerileri sun:
        1. Kesim noktaları
        2. Efekt önerileri
        3. Müzik/ses önerileri
        4. Platform optimizasyonu (Instagram/TikTok/YouTube)
        5. Galatasaray marka kimliği uyumu
        
        JSON formatında döndür.
        """
        
        messages = [
            {"role": "system", "content": "Sen video düzenleme uzmanısın."},
            {"role": "user", "content": prompt}
        ]
        
        response = self.chat_completion(messages, temperature=0.6)
        
        try:
            import json
            suggestions = json.loads(response)
            logger.info(f"Generated {len(suggestions)} edit suggestions")
            return suggestions
        except json.JSONDecodeError:
            logger.warning("Could not parse JSON response, returning raw text")
            return [{"type": "raw", "content": response}]
    
    def generate_captions(self, transcript: str, platform: str = "instagram") -> List[str]:
        """
        Video için altyazı üret
        
        Args:
            transcript: Video transkripti
            platform: Hedef platform
            
        Returns:
            Altyazı önerileri
        """
        platform_specs = {
            "instagram": "Kısa, etkileyici, emoji kullan. Max 2200 karakter.",
            "tiktok": "Çok kısa, trend, hashtag'ler. Max 150 karakter.",
            "youtube": "Detaylı, SEO optimize, timestamp'ler. Max 5000 karakter.",
            "facebook": "Orta uzunlukta, soru sor, etkileşim teşvik et."
        }
        
        spec = platform_specs.get(platform, platform_specs["instagram"])
        
        prompt = f"""
        Video Transkripti:
        {transcript}
        
        Platform: {platform}
        Gereksinimler: {spec}
        
        Galatasaray takımı için 3 farklı altyazı önerisi üret.
        Her birinde farklı ton ve yaklaşım kullan.
        Türkçe yazın, emoji kullan, hashtag ekle.
        """
        
        messages = [
            {"role": "system", "content": "Sen sosyal medya içerik uzmanısın."},
            {"role": "user", "content": prompt}
        ]
        
        response = self.chat_completion(messages, temperature=0.8)
        
        # Yanıtı satırlara böl
        captions = [line.strip() for line in response.split('\n\n') if line.strip()]
        logger.info(f"Generated {len(captions)} caption options")
        return captions


# Singleton instance
_github_models_client = None

def get_github_models_client() -> GitHubModelsClient:
    """GitHub Models client singleton"""
    global _github_models_client
    if _github_models_client is None:
        _github_models_client = GitHubModelsClient()
    return _github_models_client
