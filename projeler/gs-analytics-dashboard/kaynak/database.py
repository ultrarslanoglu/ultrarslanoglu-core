#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GS Analytics Dashboard - MongoDB Database Manager
Analitik verileri ve raporları yöneten database modülü
"""

import os
from datetime import datetime
from typing import Dict, List, Optional
from pymongo import MongoClient, ASCENDING, DESCENDING
from loguru import logger


class Database:
    """MongoDB database yöneticisi"""
    
    def __init__(self):
        """Database connection"""
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
        self.db_name = os.getenv('MONGODB_DATABASE', 'gs_analytics')
        
        try:
            self.client = MongoClient(self.mongodb_uri)
            self.db = self.client[self.db_name]
            
            # Collections
            self.metrics = self.db['metrics']
            self.reports = self.db['reports']
            self.dashboards = self.db['dashboards']
            self.insights = self.db['insights']
            
            # Indexes
            self._create_indexes()
            logger.info(f"✅ MongoDB bağlantısı başarılı: {self.db_name}")
            
        except Exception as e:
            logger.error(f"❌ MongoDB bağlantı hatası: {e}")
            raise
    
    def _create_indexes(self):
        """Gerekli indexleri oluştur"""
        # Metrics indexes
        self.metrics.create_index([("platform", ASCENDING), ("metric_type", ASCENDING)])
        self.metrics.create_index([("timestamp", DESCENDING)])
        self.metrics.create_index([("created_at", DESCENDING)])
        
        # Reports indexes
        self.reports.create_index([("report_type", ASCENDING)])
        self.reports.create_index([("created_at", DESCENDING)])
        self.reports.create_index([("status", ASCENDING)])
        
        # Dashboards indexes
        self.dashboards.create_index([("dashboard_id", ASCENDING)], unique=True)
        self.dashboards.create_index([("created_at", DESCENDING)])
        
        # Insights indexes
        self.insights.create_index([("insight_type", ASCENDING)])
        self.insights.create_index([("priority", DESCENDING)])
        self.insights.create_index([("created_at", DESCENDING)])
    
    # Metrics operations
    def save_metric(self, metric_data: Dict) -> str:
        """Metrik kaydet"""
        metric_data['created_at'] = datetime.utcnow()
        result = self.metrics.insert_one(metric_data)
        logger.info(f"📊 Metrik kaydedildi: {result.inserted_id}")
        return str(result.inserted_id)
    
    def get_metrics(self, platform: Optional[str] = None, 
                   metric_type: Optional[str] = None,
                   start_date: Optional[datetime] = None,
                   end_date: Optional[datetime] = None,
                   limit: int = 100) -> List[Dict]:
        """Metrikleri getir"""
        query = {}
        
        if platform:
            query['platform'] = platform
        if metric_type:
            query['metric_type'] = metric_type
        if start_date or end_date:
            query['timestamp'] = {}
            if start_date:
                query['timestamp']['$gte'] = start_date
            if end_date:
                query['timestamp']['$lte'] = end_date
        
        metrics = list(self.metrics.find(query).sort('timestamp', DESCENDING).limit(limit))
        
        # Convert ObjectId to string
        for metric in metrics:
            metric['_id'] = str(metric['_id'])
        
        return metrics
    
    def aggregate_metrics(self, pipeline: List[Dict]) -> List[Dict]:
        """Metrik aggregation"""
        return list(self.metrics.aggregate(pipeline))
    
    # Reports operations
    def create_report(self, report_data: Dict) -> str:
        """Rapor oluştur"""
        report_data['created_at'] = datetime.utcnow()
        report_data['updated_at'] = datetime.utcnow()
        report_data['status'] = report_data.get('status', 'pending')
        
        result = self.reports.insert_one(report_data)
        logger.info(f"📝 Rapor oluşturuldu: {result.inserted_id}")
        return str(result.inserted_id)
    
    def get_report(self, report_id: str) -> Optional[Dict]:
        """Rapor getir"""
        from bson.objectid import ObjectId
        
        report = self.reports.find_one({"_id": ObjectId(report_id)})
        if report:
            report['_id'] = str(report['_id'])
        
        return report
    
    def update_report_status(self, report_id: str, status: str, data: Optional[Dict] = None) -> bool:
        """Rapor durumunu güncelle"""
        from bson.objectid import ObjectId
        
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow()
        }
        
        if data:
            update_data.update(data)
        
        result = self.reports.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    def list_reports(self, report_type: Optional[str] = None, 
                    status: Optional[str] = None,
                    limit: int = 50, skip: int = 0) -> List[Dict]:
        """Raporları listele"""
        query = {}
        
        if report_type:
            query['report_type'] = report_type
        if status:
            query['status'] = status
        
        reports = list(
            self.reports.find(query)
            .sort('created_at', DESCENDING)
            .skip(skip)
            .limit(limit)
        )
        
        for report in reports:
            report['_id'] = str(report['_id'])
        
        return reports
    
    # Dashboards operations
    def create_dashboard(self, dashboard_data: Dict) -> str:
        """Dashboard oluştur"""
        dashboard_data['created_at'] = datetime.utcnow()
        dashboard_data['updated_at'] = datetime.utcnow()
        
        result = self.dashboards.insert_one(dashboard_data)
        logger.info(f"📊 Dashboard oluşturuldu: {result.inserted_id}")
        return str(result.inserted_id)
    
    def get_dashboard(self, dashboard_id: str) -> Optional[Dict]:
        """Dashboard getir"""
        dashboard = self.dashboards.find_one({"dashboard_id": dashboard_id})
        if dashboard:
            dashboard['_id'] = str(dashboard['_id'])
        
        return dashboard
    
    def update_dashboard(self, dashboard_id: str, updates: Dict) -> bool:
        """Dashboard güncelle"""
        updates['updated_at'] = datetime.utcnow()
        
        result = self.dashboards.update_one(
            {"dashboard_id": dashboard_id},
            {"$set": updates}
        )
        
        return result.modified_count > 0
    
    def list_dashboards(self, limit: int = 20, skip: int = 0) -> List[Dict]:
        """Dashboardları listele"""
        dashboards = list(
            self.dashboards.find()
            .sort('created_at', DESCENDING)
            .skip(skip)
            .limit(limit)
        )
        
        for dashboard in dashboards:
            dashboard['_id'] = str(dashboard['_id'])
        
        return dashboards
    
    # Insights operations
    def save_insight(self, insight_data: Dict) -> str:
        """İçgörü kaydet"""
        insight_data['created_at'] = datetime.utcnow()
        result = self.insights.insert_one(insight_data)
        logger.info(f"💡 İçgörü kaydedildi: {result.inserted_id}")
        return str(result.inserted_id)
    
    def get_insights(self, insight_type: Optional[str] = None,
                    priority: Optional[str] = None,
                    limit: int = 50) -> List[Dict]:
        """İçgörüleri getir"""
        query = {}
        
        if insight_type:
            query['insight_type'] = insight_type
        if priority:
            query['priority'] = priority
        
        insights = list(
            self.insights.find(query)
            .sort([('priority', DESCENDING), ('created_at', DESCENDING)])
            .limit(limit)
        )
        
        for insight in insights:
            insight['_id'] = str(insight['_id'])
        
        return insights


# Singleton pattern
_database_instance = None

def get_database() -> Database:
    """Database singleton instance"""
    global _database_instance
    if _database_instance is None:
        _database_instance = Database()
    return _database_instance
