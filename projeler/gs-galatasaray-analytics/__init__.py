"""
Galatasaray Analytics Platform Package
Canlı veri çekme, analiz ve raporlama sistemi
"""

__version__ = "1.0.0"
__author__ = "Ultrarslanoglu"
__license__ = "MIT"

from src.database.manager import db, DatabaseManager
from src.services.data_collector import DataCollectorOrchestrator
from src.analyzers.analyzer import AnalysisOrchestrator

__all__ = [
    'db',
    'DatabaseManager',
    'DataCollectorOrchestrator',
    'AnalysisOrchestrator'
]
