#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

# Different messages for each experiment
messages = [
    "The quick brown fox jumps over the lazy dog",
    "Steganography is the practice of concealing data",
    "Hidden message number three with special chars: !@#$%",
    "Image processing with LSB embedding technique",
    "Robustness testing of steganographic methods",
    "Encryption and data hiding in digital images",
    "Advanced security through image steganography",
    "Testing message extraction capabilities",
    "Verifying custom message embedding feature",
    "Final experiment with comprehensive testing"
]

# Different dataset and transform combinations
configs = [
    {
        "dataset": "sample_images",
        "transforms": [{"name": "jpeg", "quality": 85}]
    },
    {
        "dataset": "coco_subset",
        "transforms": [{"name": "resize", "width": 256, "height": 256}]
    },
    {
        "dataset": "imagenet_mini",
        "transforms": [{"name": "noise", "sigma": 0.05}]
    },
    {
        "dataset": "sample_images",
        "transforms": [
            {"name": "jpeg", "quality": 75},
            {"name": "resize", "width": 512, "height": 512}
        ]
    },
    {
        "dataset": "coco_subset",
        "transforms": [
            {"name": "resize", "width": 128, "height": 128},
            {"name": "noise", "sigma": 0.1}
        ]
    },
    {
        "dataset": "imagenet_mini",
        "transforms": [{"name": "jpeg", "quality": 90}]
    },
    {
        "dataset": "sample_images",
        "transforms": [
            {"name": "noise", "sigma": 0.02},
            {"name": "jpeg", "quality": 80}
        ]
    },
    {
        "dataset": "coco_subset",
        "transforms": [{"name": "resize", "width": 384, "height": 384}]
    },
    {
        "dataset": "imagenet_mini",
        "transforms": [
            {"name": "jpeg", "quality": 95},
            {"name": "noise", "sigma": 0.03}
        ]
    },
    {
        "dataset": "sample_images",
        "transforms": [
            {"name": "resize", "width": 320, "height": 320},
            {"name": "jpeg", "quality": 85}
        ]
    }
]

def create_experiment(index):
    """Create a single experiment"""
    exp_data = {
        "name": f"Test-Exp-{index+1:02d}",
        "dataset": configs[index]["dataset"],
        "transforms": configs[index]["transforms"],
        "message": messages[index],
        "dryRun": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/experiments",
            json=exp_data,
            timeout=5
        )
        if response.status_code == 201:
            result = response.json()
            print(f"✓ Exp {index+1:2d}: {exp_data['name']} - Message: {messages[index][:30]}...")
            return True
        else:
            print(f"✗ Exp {index+1}: Failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Exp {index+1}: Error - {str(e)}")
        return False

if __name__ == "__main__":
    print("Creating 10 experiments with different messages...\n")
    
    success_count = 0
    for i in range(10):
        if create_experiment(i):
            success_count += 1
    
    print(f"\n✓ Successfully created {success_count}/10 experiments")
    
    # Verify
    try:
        response = requests.get(f"{BASE_URL}/experiments", timeout=5)
        if response.status_code == 200:
            count = len(response.json().get("experiments", []))
            print(f"Total experiments in database: {count}")
    except Exception as e:
        print(f"Error verifying: {e}")
