#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive API Integration Tests
Tüm modüllerin end-to-end testleri
"""

import unittest
import json
import os
from datetime import datetime, timedelta
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from main_v2 import app
from src.shared.database import init_database


class APITestBase(unittest.TestCase):
    """Base test class"""
    
    @classmethod
    def setUpClass(cls):
        """Tüm testler için hazırlık"""
        cls.app = app.test_client()
        cls.app.testing = True
    
    def setUp(self):
        """Her test için hazırlık"""
        self.base_url = '/api'
        self.auth_token = None
    
    def tearDown(self):
        """Her test sonrası temizlik"""
        pass


class HealthCheckTests(APITestBase):
    """Health ve status testleri"""
    
    def test_health_check(self):
        """Health endpoint test"""
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('status', data)
        self.assertEqual(data['status'], 'healthy')
    
    def test_api_version(self):
        """API version endpoint test"""
        response = self.app.get('/api/version')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('version', data)
        self.assertEqual(data['version'], '2.0.0')
    
    def test_status_endpoint(self):
        """Status endpoint test"""
        response = self.app.get('/status')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('status', data)
        self.assertIn('modules', data)


class AuthenticationTests(APITestBase):
    """Authentication testleri"""
    
    def test_user_registration(self):
        """Kullanıcı kaydı test"""
        payload = {
            "username": f"testuser_{datetime.now().timestamp()}",
            "email": f"test_{datetime.now().timestamp()}@example.com",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        
        response = self.app.post(
            f'{self.base_url}/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        # Should succeed (201) or user exists (400)
        self.assertIn(response.status_code, [201, 400])
    
    def test_user_login(self):
        """Kullanıcı girişi test"""
        payload = {
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
        
        response = self.app.post(
            f'{self.base_url}/auth/login',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        # Should return 200 or 401 (invalid credentials)
        self.assertIn(response.status_code, [200, 401])


class ValidationTests(APITestBase):
    """Validation testleri"""
    
    def test_invalid_email_rejection(self):
        """Geçersiz email reddedilme"""
        payload = {
            "username": "testuser",
            "email": "invalid-email",
            "password": "TestPassword123!"
        }
        
        response = self.app.post(
            f'{self.base_url}/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        # Should be rejected (400)
        self.assertEqual(response.status_code, 400)
    
    def test_weak_password_rejection(self):
        """Zayıf şifre reddedilme"""
        payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "weak"  # Çok kısa ve zayıf
        }
        
        response = self.app.post(
            f'{self.base_url}/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        # Should be rejected (400)
        self.assertEqual(response.status_code, 400)
    
    def test_missing_required_fields(self):
        """Eksik zorunlu alanlar"""
        payload = {
            "username": "testuser"
            # email ve password eksik
        }
        
        response = self.app.post(
            f'{self.base_url}/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        # Should be rejected (400)
        self.assertEqual(response.status_code, 400)


class VideoModuleTests(APITestBase):
    """Video modülü testleri"""
    
    def test_video_upload_requires_auth(self):
        """Video yükleme kimlik doğrulama gerektiriyor"""
        response = self.app.post(
            f'{self.base_url}/video/upload',
            data={'video': (b'test video content', 'test.mp4')}
        )
        
        # Should be rejected without auth (401)
        self.assertEqual(response.status_code, 401)
    
    def test_list_videos_requires_auth(self):
        """Video listesi kimlik doğrulama gerektiriyor"""
        response = self.app.get(f'{self.base_url}/video')
        
        # Should be rejected without auth (401)
        self.assertEqual(response.status_code, 401)
    
    def test_video_health_check(self):
        """Video modülü health check"""
        response = self.app.get(f'{self.base_url}/video/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data.get('module'), 'video')


class AnalyticsModuleTests(APITestBase):
    """Analytics modülü testleri"""
    
    def test_analytics_health_check(self):
        """Analytics modülü health check"""
        response = self.app.get(f'{self.base_url}/analytics/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data.get('module'), 'analytics')
    
    def test_trending_endpoint(self):
        """Trending endpoint test"""
        response = self.app.get(f'{self.base_url}/analytics/trending')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('trending', data)


class AIEditorModuleTests(APITestBase):
    """AI Editor modülü testleri"""
    
    def test_ai_editor_health_check(self):
        """AI Editor modülü health check"""
        response = self.app.get(f'{self.base_url}/ai-editor/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data.get('module'), 'ai_editor')


class AutomationModuleTests(APITestBase):
    """Automation modülü testleri"""
    
    def test_automation_health_check(self):
        """Automation modülü health check"""
        response = self.app.get(f'{self.base_url}/automation/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data.get('module'), 'automation')


class ErrorHandlingTests(APITestBase):
    """Error handling testleri"""
    
    def test_404_not_found(self):
        """404 Not Found hatası"""
        response = self.app.get('/api/nonexistent-endpoint')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('error', data)
    
    def test_405_method_not_allowed(self):
        """405 Method Not Allowed hatası"""
        response = self.app.post('/health')  # GET only endpoint
        self.assertEqual(response.status_code, 405)
    
    def test_error_response_format(self):
        """Error response formatı"""
        response = self.app.get('/api/nonexistent')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        
        # Should have error structure
        self.assertIn('success', data)
        self.assertIn('error', data)
        self.assertFalse(data['success'])


class ResponseFormatTests(APITestBase):
    """Response format testleri"""
    
    def test_success_response_format(self):
        """Success response formatı"""
        response = self.app.get('/api/version')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Should have standard format
        self.assertIn('success', data)
        self.assertIn('data', data)
        self.assertTrue(data['success'])
    
    def test_response_headers(self):
        """Response headers"""
        response = self.app.get('/health')
        
        # Should have API headers
        self.assertIn('X-API-Version', response.headers)
        self.assertIn('X-Request-ID', response.headers)


class IntegrationTests(APITestBase):
    """End-to-end integration testleri"""
    
    def test_full_request_cycle(self):
        """Full request cycle test"""
        # 1. Health check
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        
        # 2. Get API version
        response = self.app.get('/api/version')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
    
    def test_error_recovery(self):
        """Error recovery test"""
        # Make invalid request
        response = self.app.get('/api/nonexistent')
        self.assertEqual(response.status_code, 404)
        
        # Verify system still works
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
    
    def test_request_response_flow(self):
        """Request/Response flow test"""
        response = self.app.get('/api/version')
        
        # Check response structure
        self.assertEqual(response.status_code, 200)
        self.assertIn('Content-Type', response.headers)
        self.assertIn('application/json', response.headers['Content-Type'])
        
        # Check data
        data = json.loads(response.data)
        self.assertIn('version', data)


def run_tests():
    """Test suite'i çalıştır"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all tests
    suite.addTests(loader.loadTestsFromTestCase(HealthCheckTests))
    suite.addTests(loader.loadTestsFromTestCase(AuthenticationTests))
    suite.addTests(loader.loadTestsFromTestCase(ValidationTests))
    suite.addTests(loader.loadTestsFromTestCase(VideoModuleTests))
    suite.addTests(loader.loadTestsFromTestCase(AnalyticsModuleTests))
    suite.addTests(loader.loadTestsFromTestCase(AIEditorModuleTests))
    suite.addTests(loader.loadTestsFromTestCase(AutomationModuleTests))
    suite.addTests(loader.loadTestsFromTestCase(ErrorHandlingTests))
    suite.addTests(loader.loadTestsFromTestCase(ResponseFormatTests))
    suite.addTests(loader.loadTestsFromTestCase(IntegrationTests))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("="*70 + "\n")
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
