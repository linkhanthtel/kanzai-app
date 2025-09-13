#!/usr/bin/env python3
"""
Simple test script for the AI Sign Language API
Tests both the original MediaPipe version and the OpenCV-only version
"""

import requests
import json
import sys

def test_api(base_url="http://localhost:8000"):
    """Test the API endpoints"""
    
    print(f"Testing API at {base_url}")
    print("=" * 50)
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
        return False
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
        return False
    
    # Test signs endpoint
    try:
        response = requests.get(f"{base_url}/signs")
        print(f"✅ Signs endpoint: {response.status_code}")
        data = response.json()
        print(f"   Available signs: {len(data['available_signs'])}")
        print(f"   First 5 signs: {data['available_signs'][:5]}")
    except Exception as e:
        print(f"❌ Signs endpoint failed: {e}")
        return False
    
    # Test specific sign endpoint
    try:
        response = requests.get(f"{base_url}/sign/A")
        print(f"✅ Sign A endpoint: {response.status_code}")
        data = response.json()
        print(f"   Letter A: {data['description']}")
    except Exception as e:
        print(f"❌ Sign A endpoint failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All basic endpoints are working!")
    print(f"📖 Interactive API docs: {base_url}/docs")
    print(f"📖 Alternative docs: {base_url}/redoc")
    
    return True

if __name__ == "__main__":
    # Allow custom URL
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    test_api(url)
