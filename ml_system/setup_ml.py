#!/usr/bin/env python3
"""
Setup script for ML system
Generates dataset, trains models, and starts API
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    print("📦 Installing Python requirements...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def generate_dataset():
    """Generate realistic construction dataset"""
    print("🏗️  Generating realistic construction dataset...")
    subprocess.check_call([sys.executable, "realistic_dataset_generator.py"])

def train_models():
    """Train ML models"""
    print("🤖 Training ML models...")
    subprocess.check_call([sys.executable, "train_model.py"])

def start_api():
    """Start ML API service"""
    print("🚀 Starting ML API service...")
    subprocess.check_call([sys.executable, "ml_api.py"])

def main():
    print("🎯 Setting up ML System for Construction Tracker")
    print("=" * 50)
    
    try:
        # Change to ml_system directory
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # Install requirements
        install_requirements()
        
        # Generate dataset
        generate_dataset()
        
        # Train models
        train_models()
        
        print("✅ ML System setup complete!")
        print("\nTo start the ML API service:")
        print("cd ml_system && python ml_api.py")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during setup: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
