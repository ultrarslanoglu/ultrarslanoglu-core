#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GS Analytics Dashboard - GitHub Models Client
AI destekli veri analizi ve içgörü üretimi
"""

import os
from typing import Dict, List, Optional
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from loguru import logger


class GitHubModelsClient:
    """GitHub Models (Azure AI Inference) client"""
    
    def __init__(self):
        """Initialize GitHub Models client"""
        self.github_token = os.getenv('GITHUB_TOKEN')
        
        if not self.github_token:
            logger.warning("⚠️ GITHUB_TOKEN bulunamadı, AI özellikleri devre dışı")
            self.client = None
            return
        
        self.endpoint = "https://models.inference.ai.azure.com"
        self.model = os.getenv('AI_MODEL', 'gpt-4')
        
        try:
            self.client = ChatCompletionsClient(
                endpoint=self.endpoint,
                credential=AzureKeyCredential(self.github_token)
            )
            logger.info(f"✅ GitHub Models bağlantısı başarılı (Model: {self.model})")
        except Exception as e:
            logger.error(f"❌ GitHub Models bağlantı hatası: {e}")
            self.client = None
    
    def chat_completion(self, messages: List[Dict], 
                       temperature: float = 0.7,
                       max_tokens: int = 1000) -> Optional[str]:
        """Chat completion isteği gönder"""
        if not self.client:
            logger.warning("GitHub Models client yapılandırılmamış")
            return None
        
        try:
            # Convert messages to proper format
            formatted_messages = []
            for msg in messages:
                if msg['role'] == 'system':
                    formatted_messages.append(SystemMessage(content=msg['content']))
                else:
                    formatted_messages.append(UserMessage(content=msg['content']))
            
            response = self.client.complete(
                messages=formatted_messages,
                model=self.model,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Chat completion hatası: {e}")
            return None
    
    def analyze_metrics(self, metrics_data: Dict, context: str = "") -> Optional[Dict]:
        """Metrikleri analiz et ve içgörüler üret"""
        if not self.client:
            return None
        
        prompt = f"""Sen bir veri analisti ve iş zekası uzmanısın. Aşağıdaki metrik verilerini analiz et ve içgörüler üret.

Metrik Verileri:
{metrics_data}

Bağlam: {context if context else 'Genel analiz'}

Lütfen şu formatta yanıt ver (JSON):
{{
    "summary": "Kısa özet",
    "key_insights": [
        {{"insight": "İçgörü metni", "priority": "high/medium/low"}},
        ...
    ],
    "trends": [
        {{"trend": "Trend açıklaması", "direction": "up/down/stable"}},
        ...
    ],
    "recommendations": [
        "Öneri 1",
        "Öneri 2"
    ],
    "anomalies": [
        {{"description": "Anomali açıklaması", "severity": "high/medium/low"}},
        ...
    ]
}}
"""
        
        messages = [
            {"role": "system", "content": "Sen profesyonel bir veri analisti ve iş zekası uzmanısın."},
            {"role": "user", "content": prompt}
        ]
        
        response = self.chat_completion(messages, temperature=0.3, max_tokens=2000)
        
        if response:
            try:
                import json
                # Extract JSON from response
                start = response.find('{')
                end = response.rfind('}') + 1
                if start != -1 and end > start:
                    analysis = json.loads(response[start:end])
                    return analysis
            except json.JSONDecodeError:
                logger.error("AI yanıtı JSON olarak parse edilemedi")
        
        return None
    
    def generate_insights(self, data_summary: Dict, insight_type: str = "general") -> Optional[List[Dict]]:
        """AI ile içgörü üret"""
        if not self.client:
            return None
        
        prompt = f"""Sen bir iş zekası ve sosyal medya analisti uzmanısın. Aşağıdaki veri özetini analiz et ve actionable içgörüler üret.

Veri Özeti:
{data_summary}

İçgörü Tipi: {insight_type}

Lütfen 3-5 adet önemli içgörü üret. Her içgörü için:
- Başlık (kısa ve öz)
- Açıklama (detaylı)
- Öncelik (high/medium/low)
- Eylem önerisi

JSON formatında yanıt ver:
{{
    "insights": [
        {{
            "title": "İçgörü başlığı",
            "description": "Detaylı açıklama",
            "priority": "high",
            "action": "Önerilen eylem"
        }},
        ...
    ]
}}
"""
        
        messages = [
            {"role": "system", "content": "Sen profesyonel bir iş zekası ve sosyal medya analisti uzmanısın."},
            {"role": "user", "content": prompt}
        ]
        
        response = self.chat_completion(messages, temperature=0.5, max_tokens=1500)
        
        if response:
            try:
                import json
                start = response.find('{')
                end = response.rfind('}') + 1
                if start != -1 and end > start:
                    result = json.loads(response[start:end])
                    return result.get('insights', [])
            except json.JSONDecodeError:
                logger.error("AI yanıtı JSON olarak parse edilemedi")
        
        return None
    
    def generate_report_summary(self, report_data: Dict) -> Optional[str]:
        """Rapor için AI özeti üret"""
        if not self.client:
            return None
        
        prompt = f"""Sen bir iş zekası rapor yazarısın. Aşağıdaki rapor verilerini özetle.

Rapor Verileri:
{report_data}

Lütfen şunları içeren bir executive summary yaz:
- Ana bulgular (3-4 madde)
- Önemli trendler
- Dikkat edilmesi gerekenler
- Genel değerlendirme

Özet 200-300 kelime arası olsun ve profesyonel bir dil kullan.
"""
        
        messages = [
            {"role": "system", "content": "Sen profesyonel bir iş zekası rapor yazarısın."},
            {"role": "user", "content": prompt}
        ]
        
        return self.chat_completion(messages, temperature=0.4, max_tokens=800)
    
    def predict_trends(self, historical_data: List[Dict], prediction_period: str = "7 days") -> Optional[Dict]:
        """AI ile trend tahmini yap"""
        if not self.client:
            return None
        
        prompt = f"""Sen bir veri bilimcisi ve trend analizi uzmanısın. Aşağıdaki geçmiş verilere dayanarak {prediction_period} için trend tahmini yap.

Geçmiş Veriler:
{historical_data}

Lütfen şu formatta yanıt ver (JSON):
{{
    "predictions": [
        {{
            "metric": "Metrik adı",
            "current_value": 0,
            "predicted_value": 0,
            "confidence": "high/medium/low",
            "reasoning": "Tahmin gerekçesi"
        }},
        ...
    ],
    "overall_trend": "up/down/stable",
    "risk_factors": ["Risk faktörü 1", "Risk faktörü 2"],
    "opportunities": ["Fırsat 1", "Fırsat 2"]
}}
"""
        
        messages = [
            {"role": "system", "content": "Sen profesyonel bir veri bilimcisi ve trend analizi uzmanısın."},
            {"role": "user", "content": prompt}
        ]
        
        response = self.chat_completion(messages, temperature=0.3, max_tokens=1500)
        
        if response:
            try:
                import json
                start = response.find('{')
                end = response.rfind('}') + 1
                if start != -1 and end > start:
                    predictions = json.loads(response[start:end])
                    return predictions
            except json.JSONDecodeError:
                logger.error("AI yanıtı JSON olarak parse edilemedi")
        
        return None


# Singleton pattern
_github_models_instance = None

def get_github_models_client() -> GitHubModelsClient:
    """GitHub Models client singleton instance"""
    global _github_models_instance
    if _github_models_instance is None:
        _github_models_instance = GitHubModelsClient()
    return _github_models_instance
