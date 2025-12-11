#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000"

exp_data = {
    "name": "Robustness-Test-Fixed",
    "dataset": "sample_images",
    "transforms": [
        {"name": "jpeg", "quality": 60},
        {"name": "resize", "width": 64, "height": 64},
        {"name": "noise", "sigma": 0.1}
    ],
    "message": "Testing real robustness with harsh transforms",
    "dryRun": True
}

try:
    response = requests.post(
        f"{BASE_URL}/experiments",
        json=exp_data,
        timeout=30
    )
    if response.status_code == 201:
        result = response.json()
        exp_id = result.get("id")
        print(f"✓ Experiment created: {exp_id}")
        print(f"✓ Name: {result.get('name')}")
    else:
        print(f"✗ Failed with status {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"✗ Error: {e}")
