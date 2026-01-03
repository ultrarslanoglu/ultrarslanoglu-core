#!/usr/bin/env python3
"""
Quick test script for API Gateway
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_info():
    """Test info endpoint"""
    print("\n🔍 Testing info endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/info")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_video_health():
    """Test video module health"""
    print("\n🔍 Testing video module...")
    try:
        response = requests.get(f"{BASE_URL}/api/video/health")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_ai_editor_health():
    """Test AI editor module health"""
    print("\n🔍 Testing AI editor module...")
    try:
        response = requests.get(f"{BASE_URL}/api/ai-editor/health")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_analytics_health():
    """Test analytics module health"""
    print("\n🔍 Testing analytics module...")
    try:
        response = requests.get(f"{BASE_URL}/api/analytics/health")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("🚀 ULTRARSLANOGLU API GATEWAY TEST")
    print("=" * 60)
    
    results = []
    results.append(("Health Check", test_health()))
    results.append(("Info", test_info()))
    results.append(("Video Module", test_video_health()))
    results.append(("AI Editor Module", test_ai_editor_health()))
    results.append(("Analytics Module", test_analytics_health()))
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n📈 Score: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
    else:
        print("⚠️ Some tests failed. Check the output above.")

if __name__ == "__main__":
    main()
