"""
Azure Cosmos DB Veritabanı Yöneticisi
Galatasaray verilerinin merkezi depolanması
"""

from azure.cosmos import CosmosClient, PartitionKey, exceptions
from azure.cosmos.container import ContainerProxy
import pymongo
from pymongo import MongoClient
from loguru import logger
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json
from config.config import Config

class CosmosDBManager:
    """Azure Cosmos DB Yöneticisi"""
    
    def __init__(self, endpoint: str, key: str, database_name: str):
        self.endpoint = endpoint
        self.key = key
        self.database_name = database_name
        self.client = None
        self.database = None
        self.containers = {}
        self._connect()
    
    def _connect(self):
        """Azure Cosmos DB'ye bağlan"""
        try:
            self.client = CosmosClient(self.endpoint, self.key)
            self.database = self.client.get_database_client(self.database_name)
            logger.info(f"✅ Azure Cosmos DB bağlantısı başarılı: {self.database_name}")
        except Exception as e:
            logger.error(f"❌ Azure Cosmos DB bağlantısı başarısız: {e}")
            raise
    
    def create_containers(self):
        """Gerekli container'ları oluştur"""
        containers_config = {
            "social_media_posts": {
                "partition_key": "/platform",  # Twitter, Instagram, YouTube, TikTok
                "unique_keys": ["/external_id"],  # API'den gelen unique ID
                "indexing_policy": {
                    "indexing_mode": "consistent",
                    "included_paths": [
                        {"path": "/*"}
                    ],
                    "excluded_paths": [
                        {"path": "/\"_etag\"/?"}
                    ]
                }
            },
            "sentiment_analysis": {
                "partition_key": "/post_id",
                "unique_keys": [],
                "indexing_policy": None
            },
            "engagement_metrics": {
                "partition_key": "/platform",
                "unique_keys": [],
                "indexing_policy": None
            },
            "daily_aggregations": {
                "partition_key": "/date",
                "unique_keys": ["/aggregation_key"],
                "indexing_policy": None
            },
            "player_mentions": {
                "partition_key": "/player_id",
                "unique_keys": [],
                "indexing_policy": None
            },
            "team_performance": {
                "partition_key": "/match_date",
                "unique_keys": [],
                "indexing_policy": None
            },
            "reports": {
                "partition_key": "/report_type",
                "unique_keys": ["/report_id"],
                "indexing_policy": None
            }
        }
        
        for container_name, config in containers_config.items():
            try:
                container = self.database.create_container(
                    id=container_name,
                    partition_key=PartitionKey(path=config["partition_key"])
                )
                self.containers[container_name] = container
                logger.info(f"✅ Container oluşturuldu: {container_name}")
            except exceptions.CosmosResourceExistsError:
                container = self.database.get_container_client(container_name)
                self.containers[container_name] = container
                logger.info(f"✓ Container zaten mevcut: {container_name}")
            except Exception as e:
                logger.error(f"❌ Container oluşturma hatası ({container_name}): {e}")
    
    def insert_document(self, container_name: str, document: Dict) -> str:
        """Dokuman ekle"""
        try:
            container = self.containers[container_name]
            response = container.create_item(body=document)
            logger.debug(f"Dokuman eklendi: {container_name} - ID: {response.get('id')}")
            return response.get('id')
        except Exception as e:
            logger.error(f"❌ Dokuman ekleme hatası: {e}")
            raise
    
    def query_documents(self, container_name: str, query: str, parameters: List[Dict] = None) -> List[Dict]:
        """SQL sorgusu ile dokuman ara"""
        try:
            container = self.containers[container_name]
            if parameters:
                items = list(container.query_items(query=query, parameters=parameters))
            else:
                items = list(container.query_items(query=query))
            return items
        except Exception as e:
            logger.error(f"❌ Sorgu hatası: {e}")
            return []
    
    def update_document(self, container_name: str, document_id: str, partition_key: str, updates: Dict) -> Dict:
        """Dokuman güncelle"""
        try:
            container = self.containers[container_name]
            # Dokuman getir
            document = container.read_item(item=document_id, partition_key=partition_key)
            # Güncelle
            document.update(updates)
            document['updated_at'] = datetime.utcnow().isoformat()
            # Kaydet
            response = container.replace_item(item=document_id, body=document)
            logger.debug(f"Dokuman güncellendi: {container_name} - ID: {document_id}")
            return response
        except Exception as e:
            logger.error(f"❌ Dokuman güncelleme hatası: {e}")
            raise
    
    def delete_document(self, container_name: str, document_id: str, partition_key: str):
        """Dokuman sil"""
        try:
            container = self.containers[container_name]
            container.delete_item(item=document_id, partition_key=partition_key)
            logger.debug(f"Dokuman silindi: {container_name} - ID: {document_id}")
        except Exception as e:
            logger.error(f"❌ Dokuman silme hatası: {e}")
            raise


class MongoDBManager:
    """MongoDB Veritabanı Yöneticisi (Fallback)"""
    
    def __init__(self, uri: str):
        self.uri = uri
        self.client = None
        self.database = None
        self._connect()
    
    def _connect(self):
        """MongoDB'ye bağlan"""
        try:
            self.client = MongoClient(self.uri)
            self.database = self.client.get_database()
            logger.info(f"✅ MongoDB bağlantısı başarılı")
        except Exception as e:
            logger.error(f"❌ MongoDB bağlantısı başarısız: {e}")
            raise
    
    def create_collections(self):
        """Gerekli collection'ları oluştur"""
        collections = [
            "social_media_posts",
            "sentiment_analysis",
            "engagement_metrics",
            "daily_aggregations",
            "player_mentions",
            "team_performance",
            "reports"
        ]
        
        for collection_name in collections:
            try:
                self.database.create_collection(collection_name)
                logger.info(f"✅ Collection oluşturuldu: {collection_name}")
            except pymongo.errors.CollectionInvalid:
                logger.info(f"✓ Collection zaten mevcut: {collection_name}")
            except Exception as e:
                logger.error(f"❌ Collection oluşturma hatası: {e}")
        
        # Index'leri oluştur
        self._create_indexes()
    
    def _create_indexes(self):
        """Performans için index'ler oluştur"""
        indexes = {
            "social_media_posts": [
                [("platform", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)],
                [("external_id", pymongo.ASCENDING)],
                [("author_id", pymongo.ASCENDING)],
            ],
            "sentiment_analysis": [
                [("post_id", pymongo.ASCENDING)],
                [("sentiment", pymongo.ASCENDING)],
            ],
            "engagement_metrics": [
                [("platform", pymongo.ASCENDING), ("date", pymongo.DESCENDING)],
            ],
            "daily_aggregations": [
                [("date", pymongo.DESCENDING)],
            ],
            "player_mentions": [
                [("player_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)],
            ]
        }
        
        for collection_name, index_list in indexes.items():
            collection = self.database[collection_name]
            for index_spec in index_list:
                try:
                    collection.create_index(index_spec)
                    logger.debug(f"Index oluşturuldu: {collection_name}")
                except Exception as e:
                    logger.warning(f"Index oluşturma uyarısı: {e}")
    
    def insert_document(self, collection_name: str, document: Dict) -> str:
        """Dokuman ekle"""
        try:
            collection = self.database[collection_name]
            result = collection.insert_one(document)
            logger.debug(f"Dokuman eklendi: {collection_name}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"❌ Dokuman ekleme hatası: {e}")
            raise
    
    def query_documents(self, collection_name: str, query: Dict, limit: int = 100) -> List[Dict]:
        """Sorgu ile dokuman ara"""
        try:
            collection = self.database[collection_name]
            documents = list(collection.find(query).limit(limit))
            return documents
        except Exception as e:
            logger.error(f"❌ Sorgu hatası: {e}")
            return []
    
    def update_document(self, collection_name: str, query: Dict, updates: Dict) -> Dict:
        """Dokuman güncelle"""
        try:
            collection = self.database[collection_name]
            updates['updated_at'] = datetime.utcnow()
            result = collection.update_one(query, {"$set": updates})
            logger.debug(f"Dokuman güncellendi: {collection_name}")
            return {"matched": result.matched_count, "modified": result.modified_count}
        except Exception as e:
            logger.error(f"❌ Dokuman güncelleme hatası: {e}")
            raise


class DatabaseManager:
    """Veritabanı Yöneticisi (Auto-switching)"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        config = Config.get_database_config()
        
        if config["type"] == "cosmos":
            self.db = CosmosDBManager(
                endpoint=config["endpoint"],
                key=config["key"],
                database_name=config["database"]
            )
            self.db_type = "cosmos"
        else:
            self.db = MongoDBManager(uri=config["uri"])
            self.db_type = "mongodb"
        
        self.db.create_containers() if self.db_type == "cosmos" else self.db.create_collections()
        self._initialized = True
        logger.info(f"✅ Veritabanı Yöneticisi başlatıldı: {self.db_type}")
    
    def insert(self, collection: str, document: Dict) -> str:
        """Dokuman ekle"""
        return self.db.insert_document(collection, document)
    
    def query(self, collection: str, query: Dict = None, **kwargs) -> List[Dict]:
        """Sorgu yap"""
        if self.db_type == "cosmos":
            sql = kwargs.get('sql', f"SELECT * FROM c")
            return self.db.query_documents(collection, sql)
        else:
            return self.db.query_documents(collection, query or {}, limit=kwargs.get('limit', 100))
    
    def update(self, collection: str, query: Dict, updates: Dict, **kwargs) -> Dict:
        """Güncelle"""
        if self.db_type == "cosmos":
            doc_id = kwargs.get('document_id')
            partition_key = kwargs.get('partition_key')
            return self.db.update_document(collection, doc_id, partition_key, updates)
        else:
            return self.db.update_document(collection, query, updates)
    
    def delete(self, collection: str, query: Dict = None, **kwargs):
        """Sil"""
        if self.db_type == "cosmos":
            doc_id = kwargs.get('document_id')
            partition_key = kwargs.get('partition_key')
            self.db.delete_document(collection, doc_id, partition_key)
        else:
            self.db.database[collection].delete_one(query)

# Singleton instance
db = DatabaseManager()
