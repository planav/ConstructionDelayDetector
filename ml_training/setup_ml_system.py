#!/usr/bin/env python3
"""
Construction Delay Prediction ML System Setup Script
This script sets up the complete ML system for construction delay prediction.
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def print_header(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_step(step, description):
    print(f"\n🔧 Step {step}: {description}")
    print("-" * 40)

def run_command(command, description):
    print(f"Running: {command}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✅ Python version {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("Installing Python packages...")
    packages = [
        "pandas==2.1.4",
        "numpy==1.24.3", 
        "scikit-learn==1.3.2",
        "xgboost==2.0.3",
        "matplotlib==3.7.2",
        "seaborn==0.12.2",
        "flask==3.0.0",
        "flask-cors==4.0.0",
        "joblib==1.3.2"
    ]
    
    for package in packages:
        if not run_command(f"pip install {package}", f"Installing {package.split('==')[0]}"):
            return False
    return True

def generate_dataset():
    """Generate the training dataset"""
    print("Generating realistic construction dataset...")
    
    if os.path.exists('construction_delay_dataset.csv'):
        print("📊 Dataset already exists. Skipping generation.")
        return True
    
    try:
        from generate_construction_dataset import ConstructionDatasetGenerator
        generator = ConstructionDatasetGenerator()
        dataset = generator.generate_dataset(2000)
        dataset.to_csv('construction_delay_dataset.csv', index=False)
        print("✅ Dataset generated successfully!")
        print(f"   - {len(dataset)} projects created")
        print(f"   - Average delay: {dataset['actual_delay_days'].mean():.1f} days")
        return True
    except Exception as e:
        print(f"❌ Dataset generation failed: {str(e)}")
        return False

def train_model():
    """Train the ML model"""
    print("Training machine learning models...")
    
    if os.path.exists('construction_delay_model.pkl'):
        print("🤖 Trained model already exists. Skipping training.")
        return True
    
    try:
        from delay_predictor import ConstructionDelayPredictor
        
        predictor = ConstructionDelayPredictor()
        X, y, df = predictor.load_and_preprocess_data('construction_delay_dataset.csv')
        predictor.initialize_models()
        results = predictor.train_models(X, y)
        predictor.save_model('construction_delay_model.pkl')
        
        print("✅ Model training completed!")
        print(f"   - Best model: {predictor.best_model_name}")
        print(f"   - Expected error: ±{results[predictor.best_model_name]['cv_mae']:.1f} days")
        return True
    except Exception as e:
        print(f"❌ Model training failed: {str(e)}")
        return False

def test_model():
    """Test the trained model with sample data"""
    print("Testing trained model...")
    
    try:
        from delay_predictor import ConstructionDelayPredictor
        
        predictor = ConstructionDelayPredictor()
        predictor.load_model('construction_delay_model.pkl')
        
        # Test with sample project
        sample_project = {
            'project_type': 'commercial',
            'location': 'New York',
            'climate_zone': 'temperate',
            'season_started': 'spring',
            'project_size_budget': 5000000,
            'project_duration_planned': 300,
            'project_complexity_score': 6,
            'progress_variance': -12.5,
            'daily_progress_velocity': 0.28,
            'milestone_achievement_rate': 0.85,
            'progress_consistency_score': 0.12,
            'labor_utilization_efficiency': 0.78,
            'material_shortage_frequency': 0.15,
            'equipment_availability_ratio': 0.92,
            'resource_cost_variance': 8.5,
            'weather_impact_days': 18,
            'weather_severity_score': 6.2,
            'supply_chain_disruption_days': 5,
            'regulatory_delay_days': 8,
            'budget_burn_rate': 1.15,
            'cash_flow_consistency': 0.08,
            'cost_overrun_percentage': 12.5,
            'rework_frequency': 0.08,
            'inspection_failure_rate': 0.15,
            'safety_incident_count': 2,
            'contractor_past_performance_score': 7.5,
            'regional_construction_index': 0.85,
            'similar_project_avg_delay': 18.3
        }
        
        prediction = predictor.predict_delay(sample_project)
        
        print("✅ Model test successful!")
        print(f"   - Sample prediction: {prediction['predicted_delay_days']} days")
        print(f"   - Confidence: {prediction['confidence_percentage']}%")
        print(f"   - Model used: {prediction['model_used']}")
        return True
    except Exception as e:
        print(f"❌ Model test failed: {str(e)}")
        return False

def create_startup_script():
    """Create a script to start the ML API"""
    script_content = '''#!/usr/bin/env python3
"""
Start the Construction Delay Prediction ML API
"""
import os
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Starting Construction Delay Prediction ML API...")
    
    # Check if model exists
    if not os.path.exists('construction_delay_model.pkl'):
        print("❌ Trained model not found!")
        print("Please run: python setup_ml_system.py")
        sys.exit(1)
    
    # Start the API
    from ml_api import app
    print("🚀 ML API starting on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
'''
    
    with open('start_ml_api.py', 'w') as f:
        f.write(script_content)
    
    # Make it executable on Unix systems
    if os.name != 'nt':
        os.chmod('start_ml_api.py', 0o755)
    
    print("✅ Startup script created: start_ml_api.py")

def main():
    """Main setup function"""
    print_header("Construction Delay Prediction ML System Setup")
    print("This script will set up the complete ML system for construction delay prediction.")
    print("The process includes:")
    print("1. Checking Python compatibility")
    print("2. Installing dependencies")
    print("3. Generating training dataset")
    print("4. Training ML models")
    print("5. Testing the system")
    print("6. Creating startup scripts")
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    print(f"\nWorking directory: {os.getcwd()}")
    
    # Step 1: Check Python version
    print_step(1, "Checking Python compatibility")
    if not check_python_version():
        sys.exit(1)
    
    # Step 2: Install dependencies
    print_step(2, "Installing Python dependencies")
    if not install_dependencies():
        print("❌ Failed to install dependencies. Please check your Python environment.")
        sys.exit(1)
    
    # Step 3: Generate dataset
    print_step(3, "Generating training dataset")
    if not generate_dataset():
        print("❌ Failed to generate dataset.")
        sys.exit(1)
    
    # Step 4: Train model
    print_step(4, "Training ML models")
    if not train_model():
        print("❌ Failed to train models.")
        sys.exit(1)
    
    # Step 5: Test model
    print_step(5, "Testing trained model")
    if not test_model():
        print("❌ Model test failed.")
        sys.exit(1)
    
    # Step 6: Create startup script
    print_step(6, "Creating startup scripts")
    create_startup_script()
    
    # Success message
    print_header("Setup Complete! 🎉")
    print("✅ ML system setup completed successfully!")
    print("\n📋 What was created:")
    print("   - construction_delay_dataset.csv (2,000 realistic projects)")
    print("   - construction_delay_model.pkl (trained ML model)")
    print("   - start_ml_api.py (API startup script)")
    
    print("\n🚀 Next steps:")
    print("1. Start the ML API:")
    print("   python start_ml_api.py")
    print("\n2. Add to your Node.js .env file:")
    print("   ML_API_URL=http://localhost:5000")
    print("\n3. Your construction app will now use ML predictions!")
    
    print("\n📊 API will be available at:")
    print("   http://localhost:5000/health (health check)")
    print("   http://localhost:5000/predict-delay (predictions)")
    print("   http://localhost:5000/model-info (model details)")
    
    print("\n🎯 The hybrid AI system is ready!")
    print("   - ML model predicts delays with 75-95% confidence")
    print("   - Gemini AI provides strategic analysis and recommendations")
    print("   - Your DPR submissions will now include advanced AI insights")

if __name__ == "__main__":
    main()
