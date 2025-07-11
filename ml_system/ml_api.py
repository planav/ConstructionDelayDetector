#!/usr/bin/env python3
"""
ML API Service for Construction Delay Prediction
Provides REST API for trained ML models
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from train_model import ConstructionDelayPredictor
import os

app = Flask(__name__)
CORS(app)

# Global predictor instance
predictor = ConstructionDelayPredictor()

def load_models():
    """Load trained models on startup"""
    try:
        predictor.load_models()
        print("✅ ML models loaded successfully")
        return True
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        return False

def extract_features_from_project(project_data):
    """
    Extract ML features from real project data
    This maps real project attributes to our 5 ML features
    """
    
    # Calculate progress efficiency
    current_progress = float(project_data.get('currentProgress', 0)) / 100
    start_date = project_data.get('startDate')
    end_date = project_data.get('endDate')
    
    if start_date and end_date:
        from datetime import datetime
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        now = datetime.now(start.tzinfo)
        
        total_days = (end - start).days
        elapsed_days = (now - start).days
        
        if total_days > 0:
            expected_progress = min(1.0, max(0, elapsed_days / total_days))
            progress_variance = current_progress - expected_progress
            progress_efficiency = max(0.1, min(1.0, 1.0 + progress_variance))
        else:
            progress_efficiency = 0.8
    else:
        progress_efficiency = 0.8
    
    # Calculate resource availability
    human_resources = project_data.get('humanResources', [])
    materials = project_data.get('materials', [])
    equipment = project_data.get('equipment', [])
    
    total_resources = len(human_resources) + len(materials) + len(equipment)
    
    # Estimate resource availability based on resource count and budget
    budget = float(project_data.get('totalBudget', 1000000))
    if total_resources > 0:
        resource_density = min(1.0, total_resources / 15)  # Normalize to 15 resources
        budget_factor = min(1.0, budget / 10000000)  # Normalize to 10M budget
        resource_availability = (resource_density * 0.6 + budget_factor * 0.4)
    else:
        resource_availability = 0.5
    
    # Calculate project complexity
    budget_complexity = min(1.0, budget / 50000000)  # Normalize to 50M
    resource_complexity = min(1.0, total_resources / 20)  # Normalize to 20 resources
    project_complexity = (budget_complexity * 0.6 + resource_complexity * 0.4)
    
    # Weather impact (location-based)
    location = project_data.get('location', '').lower()
    weather_risk_map = {
        'delhi': 0.8, 'mumbai': 0.9, 'bangalore': 0.6, 'chennai': 0.8,
        'kolkata': 0.9, 'hyderabad': 0.7, 'pune': 0.7, 'ahmedabad': 0.8
    }
    
    weather_impact = 0.7  # Default
    for city, risk in weather_risk_map.items():
        if city in location:
            weather_impact = risk
            break
    
    # Timeline pressure
    if start_date and end_date:
        remaining_ratio = max(0, (end - now).days / total_days)
        if remaining_ratio < 0.3 and current_progress < 0.8:
            timeline_pressure = 0.8
        elif remaining_ratio < 0.5 and current_progress < 0.7:
            timeline_pressure = 0.6
        else:
            timeline_pressure = 0.3
    else:
        timeline_pressure = 0.4
    
    return {
        'progress_efficiency': round(progress_efficiency, 3),
        'resource_availability': round(resource_availability, 3),
        'project_complexity': round(project_complexity, 3),
        'weather_impact': round(weather_impact, 3),
        'timeline_pressure': round(timeline_pressure, 3)
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': predictor.delay_model is not None
    })

@app.route('/predict', methods=['POST'])
def predict_delay():
    """
    Predict construction delays and costs
    
    Expected input:
    {
        "project": {
            "currentProgress": 45,
            "startDate": "2024-01-01",
            "endDate": "2024-12-31",
            "totalBudget": "5000000",
            "location": "Delhi",
            "humanResources": [...],
            "materials": [...],
            "equipment": [...]
        },
        "resourceUsage": [...]  // Optional: current resource usage
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'project' not in data:
            return jsonify({'error': 'Project data required'}), 400
        
        project_data = data['project']
        
        # Extract ML features from project data
        features = extract_features_from_project(project_data)
        
        # Make prediction
        prediction = predictor.predict(features)
        
        # Format response
        response = {
            'success': True,
            'prediction': {
                'delay_days': round(prediction['predicted_delay_days'], 1),
                'additional_cost_usd': round(prediction['predicted_additional_cost'], 2),
                'confidence_percentage': prediction['model_confidence'],
                'confidence_interval': {
                    'delay_range': [round(x, 1) for x in prediction['delay_confidence_interval']],
                    'cost_range': [round(x, 2) for x in prediction['cost_confidence_interval']]
                }
            },
            'features_used': features,
            'model_info': {
                'model_type': 'RandomForest + GradientBoosting',
                'feature_count': len(features),
                'training_data_size': '2000 projects'
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """Batch prediction for multiple projects"""
    try:
        data = request.get_json()
        
        if not data or 'projects' not in data:
            return jsonify({'error': 'Projects array required'}), 400
        
        projects = data['projects']
        predictions = []
        
        for project in projects:
            features = extract_features_from_project(project)
            prediction = predictor.predict(features)
            
            predictions.append({
                'project_id': project.get('id', 'unknown'),
                'delay_days': round(prediction['predicted_delay_days'], 1),
                'additional_cost_usd': round(prediction['predicted_additional_cost'], 2),
                'confidence': prediction['model_confidence']
            })
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'total_projects': len(predictions)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/features/explain', methods=['POST'])
def explain_features():
    """Explain how features are calculated from project data"""
    try:
        data = request.get_json()
        project_data = data.get('project', {})
        
        features = extract_features_from_project(project_data)
        
        explanations = {
            'progress_efficiency': 'Based on actual vs expected progress given timeline',
            'resource_availability': 'Calculated from resource count and budget allocation',
            'project_complexity': 'Derived from budget size and resource complexity',
            'weather_impact': 'Location-based weather risk assessment',
            'timeline_pressure': 'Urgency based on remaining time and completion status'
        }
        
        return jsonify({
            'features': features,
            'explanations': explanations,
            'calculation_details': {
                'progress_efficiency': f"Current: {project_data.get('currentProgress', 0)}%, Timeline analysis",
                'resource_availability': f"Resources: {len(project_data.get('humanResources', []))} + {len(project_data.get('materials', []))} + {len(project_data.get('equipment', []))}",
                'project_complexity': f"Budget: ${project_data.get('totalBudget', 0)}, Resource complexity",
                'weather_impact': f"Location: {project_data.get('location', 'Unknown')}",
                'timeline_pressure': "Timeline vs progress analysis"
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting ML API Service...")
    
    # Load models
    if not load_models():
        print("⚠️  Models not found. Training new models...")
        os.system('python train_model.py')
        load_models()
    
    print("🌐 ML API running on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
