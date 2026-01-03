#!/usr/bin/env python3
"""
MongoDB Initialization Script
Initializes database with default collections and test data
"""

import sys
import json
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

try:
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
    db = client['ultrarslanoglu']
    
    # Test connection
    client.admin.command('ping')
    print("✓ MongoDB connected successfully\n")
    
    # Initialize collections
    collections_info = {
        'users': {
            'indexes': ['email', 'username', 'created_at'],
            'description': 'User accounts and profiles'
        },
        'videos': {
            'indexes': ['user_id', 'created_at', 'status'],
            'description': 'Video content storage'
        },
        'social_connections': {
            'indexes': ['user_id', 'platform', 'active'],
            'description': 'Social media account connections'
        },
        'content_schedules': {
            'indexes': ['user_id', 'scheduled_time', 'status'],
            'description': 'Scheduled content for publishing'
        },
        'analytics': {
            'indexes': ['user_id', 'timestamp', 'event_type'],
            'description': 'Analytics and events data'
        },
        'brand_kits': {
            'indexes': ['user_id', 'name'],
            'description': 'Brand kit configurations'
        }
    }
    
    print("Initializing collections...\n")
    
    for collection_name, info in collections_info.items():
        if collection_name not in db.list_collection_names():
            db.create_collection(collection_name)
            print(f"  ✓ Created {collection_name} ({info['description']})")
        else:
            print(f"  ✓ {collection_name} already exists")
        
        # Create indexes
        collection = db[collection_name]
        for index in info['indexes']:
            try:
                collection.create_index(index)
            except:
                pass
    
    print("\n✓ All collections initialized!")
    print(f"✓ Database: {db.name}")
    print(f"✓ Collections: {len(db.list_collection_names())}")
    
    # Create admin user for testing (optional)
    users = db['users']
    if users.count_documents({'email': 'admin@ultrarslanoglu.com'}) == 0:
        print("\nCreating test admin user...")
        users.insert_one({
            'email': 'admin@ultrarslanoglu.com',
            'username': 'admin',
            'role': 'admin',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
        print("  ✓ Test admin user created")
    
    print("\n✅ Database initialization complete!\n")
    
except ConnectionFailure:
    print("❌ Error: Cannot connect to MongoDB")
    print("   Make sure MongoDB is running on localhost:27017")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {str(e)}")
    sys.exit(1)
