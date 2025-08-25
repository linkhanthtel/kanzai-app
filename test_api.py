#!/usr/bin/env python3
"""
Simple test script for the AI Sign Language API
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint, method="GET", data=None):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, data=data)
        else:
            print(f"Unsupported method: {method}")
            return False
            
        print(f"{method} {endpoint}: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")
        print("-" * 50)
        return response.status_code == 200
        
    except requests.exceptions.ConnectionError:
        print(f"Connection error: Make sure the API is running on {BASE_URL}")
        return False
    except Exception as e:
        print(f"Error testing {endpoint}: {e}")
        return False

def main():
    """Test all API endpoints"""
    print("Testing AI Sign Language API...")
    print("=" * 50)
    
    # Test basic endpoints
    test_endpoint("/")
    test_endpoint("/health")
    test_endpoint("/signs")
    test_endpoint("/sign/A")
    test_endpoint("/sign/X")
    
    print("\nAPI testing completed!")
    print("\nTo test image upload, use the interactive docs at:")
    print(f"{BASE_URL}/docs")

if __name__ == "__main__":
    main()

