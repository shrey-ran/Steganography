#!/usr/bin/env python3
import requests
import json
import time

BASE_URL = "http://localhost:8000"

# Three test scenarios with different robustness levels
test_scenarios = [
    {
        "name": "Full-Retrieval-Test",
        "dataset": "sample_images",
        "message": "This message should be fully recoverable with gentle transforms",
        "transforms": [
            {"name": "jpeg", "quality": 95},  # Very high quality - preserves LSBs
            {"name": "resize", "width": 256, "height": 256}  # Moderate resize
        ],
        "description": "Gentle transforms - message should SURVIVE"
    },
    {
        "name": "Partial-Retrieval-Test",
        "dataset": "coco_subset",
        "message": "This message has partial recovery through moderate transforms applied",
        "transforms": [
            {"name": "jpeg", "quality": 70},  # Medium quality - some LSB loss
            {"name": "noise", "sigma": 0.05},  # Light noise
            {"name": "resize", "width": 128, "height": 128}  # Moderate resize
        ],
        "description": "Moderate transforms - message may PARTIALLY SURVIVE"
    },
    {
        "name": "No-Retrieval-Test",
        "dataset": "imagenet_mini",
        "message": "This message will be completely lost with harsh destructive transforms",
        "transforms": [
            {"name": "jpeg", "quality": 50},  # Low quality - destroys LSBs
            {"name": "noise", "sigma": 0.2},  # High noise
            {"name": "resize", "width": 64, "height": 64}  # Aggressive resize
        ],
        "description": "Harsh transforms - message should NOT SURVIVE"
    }
]

def create_experiment(scenario):
    """Create a single experiment"""
    exp_data = {
        "name": scenario["name"],
        "dataset": scenario["dataset"],
        "transforms": scenario["transforms"],
        "message": scenario["message"],
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
            exp_id = result.get("id")
            print(f"✓ Created: {scenario['name']}")
            print(f"  ID: {exp_id}")
            print(f"  Description: {scenario['description']}")
            return exp_id
        else:
            print(f"✗ Failed: {scenario['name']} - Status {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Error creating {scenario['name']}: {e}")
        return None

def run_experiment(exp_id, name):
    """Run an experiment"""
    try:
        requests.post(f"{BASE_URL}/experiments/{exp_id}/run", timeout=5)
        print(f"  Running: {name}...")
        return True
    except Exception as e:
        print(f"  Error running: {e}")
        return False

def check_experiment_status(exp_id):
    """Check if experiment is complete"""
    try:
        response = requests.get(f"{BASE_URL}/experiments/{exp_id}", timeout=5)
        if response.status_code == 200:
            return response.json().get("status")
        return None
    except:
        return None

if __name__ == "__main__":
    print("="*70)
    print("Creating 3 Robustness Test Scenarios")
    print("="*70)
    print()
    
    experiment_ids = []
    
    # Create all experiments
    print("1. CREATING EXPERIMENTS:")
    print("-" * 70)
    for scenario in test_scenarios:
        exp_id = create_experiment(scenario)
        if exp_id:
            experiment_ids.append((exp_id, scenario["name"]))
        print()
    
    # Run all experiments
    print()
    print("2. RUNNING EXPERIMENTS:")
    print("-" * 70)
    for exp_id, name in experiment_ids:
        run_experiment(exp_id, name)
    
    # Wait and check status
    print()
    print("3. WAITING FOR COMPLETION:")
    print("-" * 70)
    max_wait = 120  # 2 minutes max
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        all_complete = True
        for exp_id, name in experiment_ids:
            status = check_experiment_status(exp_id)
            if status not in ['completed', 'failed']:
                all_complete = False
            print(f"  {name}: {status}")
        
        if all_complete:
            break
        
        print()
        time.sleep(5)
    
    # Display results
    print()
    print("4. FINAL RESULTS:")
    print("="*70)
    
    for exp_id, name in experiment_ids:
        try:
            response = requests.get(f"{BASE_URL}/experiments/{exp_id}")
            if response.status_code == 200:
                exp = response.json()
                print()
                print(f"📊 {exp['name']}")
                print(f"   Status: {exp['status']}")
                print(f"   Message: {exp.get('message', 'N/A')[:50]}...")
                
                # Try to get metrics
                metrics_path = f"/Users/apple/Desktop/Stegnography/scripts/output/{exp_id}/metrics.json"
                try:
                    import os
                    if os.path.exists(metrics_path):
                        with open(metrics_path) as f:
                            metrics = json.load(f)
                            if metrics.get('samples'):
                                sample = metrics['samples'][0]
                                print(f"   Hidden: {sample.get('hiddenMessage', 'N/A')[:40]}...")
                                print(f"   Extracted: {sample.get('extractedMessage', 'N/A')[:40]}...")
                                print(f"   Verified: {sample.get('messageVerified', False)}")
                                print(f"   Robustness: {sample.get('robustnessScore', 0)*100:.1f}%")
                except:
                    pass
        except Exception as e:
            print(f"Error retrieving {name}: {e}")
    
    print()
    print("="*70)
    print("✓ All test scenarios created and running!")
    print("="*70)
