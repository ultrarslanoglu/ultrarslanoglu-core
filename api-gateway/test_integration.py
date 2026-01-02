#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Gateway Integration Tests - Extended with comprehensive workflows
Tests complete user journeys and system interactions
"""

import sys
from datetime import datetime

import requests

# Configuration
API_URL = "http://localhost:5000"
TIMEOUT = 5
TEST_USER = {
    "email": "integration_test@ultrarslanoglu.com",
    "password": "TestPassword123!",
    "username": f"testuser_{int(datetime.now().timestamp())}",
}


class Colors:
    """ANSI color codes"""

    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    END = "\033[0m"
    BOLD = "\033[1m"


def print_header(text):
    """Print header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}\n")


def print_success(text):
    """Print success"""
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")


def print_error(text):
    """Print error"""
    print(f"{Colors.RED}❌ {text}{Colors.END}")


def print_warning(text):
    """Print warning"""
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")


def test_health_check():
    """Test /health endpoint"""
    print_header("Health Check Test")
    try:
        response = requests.get(f"{API_URL}/health", timeout=TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print_success("Health check successful")
            print(f"  Service: {data.get('service')}")
            print(f"  Version: {data.get('version')}")
            print(f"  Status: {data.get('status')}")
            return True
        else:
            print_error(f"Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check error: {e}")
        return False


def test_api_info():
    """Test /api/info endpoint"""
    print_header("API Info Test")
    try:
        response = requests.get(f"{API_URL}/api/info", timeout=TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print_success("API info retrieved")
            print(f"  Name: {data.get('name')}")
            print(f"  Version: {data.get('version')}")
            print(f"  Modules: {len(data.get('modules', []))}")
            for module in data.get("modules", []):
                print(f"    - {module['name']}: {module['path']}")
            return True
        else:
            print_error(f"API info failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"API info error: {e}")
        return False


def test_module_health(module_name, module_path):
    """Test module health endpoint"""
    print(f"\n  Testing {module_name}...", end=" ")
    try:
        response = requests.get(f"{API_URL}/api/{module_path}/health", timeout=TIMEOUT)
        if response.status_code == 200:
            print_success(f"{module_name} is healthy")
            return True
        else:
            print_warning(f"{module_name} status: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"{module_name} error: {e}")
        return False


def test_all_modules():
    """Test all module health checks"""
    print_header("Module Health Tests")
    modules = [
        ("Auth", "auth"),
        ("Video", "video"),
        ("AI Editor", "ai-editor"),
        ("Analytics", "analytics"),
        ("Automation", "automation"),
        ("Brand Kit", "brand"),
        ("Scheduler", "scheduler"),
    ]

    results = []
    for module_name, module_path in modules:
        result = test_module_health(module_name, module_path)
        results.append((module_name, result))

    print("\n" + "=" * 40)
    print("Module Health Summary:")
    for module_name, result in results:
        status = "✅" if result else "⚠️"
        print(f"  {status} {module_name}")

    return all(result for _, result in results)


def test_auth_endpoints():
    """Test authentication endpoints"""
    print_header("Authentication Tests")

    # Test register
    print("Testing register endpoint...", end=" ")
    register_data = {
        "email": f"test_{datetime.now().timestamp()}@example.com",
        "password": "TestPassword123",
        "name": "Test User",
    }
    try:
        response = requests.post(
            f"{API_URL}/api/auth/register", json=register_data, timeout=TIMEOUT
        )
        if response.status_code in [201, 200]:
            result = response.json()
            if result.get("success"):
                user_id = result.get("user_id")
                print_success(f"Register successful (User ID: {user_id})")
                return register_data, user_id
            else:
                print_warning(f"Register returned: {result.get('error')}")
                return None, None
        else:
            print_warning(f"Register status: {response.status_code}")
            print(response.text[:100] if response.text else "")
            return None, None
    except Exception as e:
        print_warning(f"Register error: {e}")
        return None, None


def test_login(email, password):
    """Test login endpoint"""
    print("Testing login endpoint...", end=" ")
    login_data = {"email": email, "password": password}
    try:
        response = requests.post(
            f"{API_URL}/api/auth/login", json=login_data, timeout=TIMEOUT
        )
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                token = result.get("token")
                print_success("Login successful (Token received)")
                return token
            else:
                print_warning(f"Login returned: {result.get('error')}")
                return None
        else:
            print_warning(f"Login status: {response.status_code}")
            return None
    except Exception as e:
        print_warning(f"Login error: {e}")
        return None


def test_database_connection():
    """Test database connection through analytics endpoint"""
    print_header("Database Connection Test")
    print("Testing database through analytics endpoint...", end=" ")

    try:
        response = requests.post(
            f"{API_URL}/api/analytics/metrics",
            json={"platform": "test", "metric_type": "test_metric", "value": 100},
            timeout=TIMEOUT,
        )
        if response.status_code in [201, 200]:
            result = response.json()
            if result.get("success"):
                print_success(
                    f"Database connection works (Metric ID: {result.get('metric_id')})"
                )
                return True
            else:
                print_warning(f"Database response: {result}")
                return False
        else:
            print_warning(f"Database status: {response.status_code}")
            return False
    except Exception as e:
        print_warning(f"Database test error: {e}")
        return False


def run_all_tests():
    """Run all tests"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("=" * 60)
    print(" ULTRARSLANOGLU API GATEWAY - INTEGRATION TEST SUITE")
    print(f"  API URL: {API_URL}")
    print(f"  Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    print(f"{Colors.END}\n")

    results = {
        "health_check": test_health_check(),
        "api_info": test_api_info(),
        "modules": test_all_modules(),
        "database": test_database_connection(),
    }

    # Auth tests
    register_data, user_id = test_auth_endpoints()
    if register_data and user_id:
        token = test_login(register_data["email"], register_data["password"])
        results["auth"] = token is not None
    else:
        results["auth"] = False

    # Summary
    print_header("Test Summary")
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)

    for test_name, result in results.items():
        status = "✅" if result else "❌"
        print(f"  {status} {test_name.upper()}: {'PASSED' if result else 'FAILED'}")

    print(
        f"\n{Colors.BOLD}Overall: {passed_tests}/{total_tests} tests passed{Colors.END}"
    )

    if passed_tests == total_tests:
        print(f"{Colors.GREEN}{Colors.BOLD}✅ ALL TESTS PASSED!{Colors.END}")
        return 0
    else:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  SOME TESTS FAILED{Colors.END}")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
