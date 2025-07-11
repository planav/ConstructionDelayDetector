from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import traceback
from delay_predictor import ConstructionDelayPredictor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global predictor instance
predictor = None

def initialize_predictor():
    """Initialize the ML predictor"""
    global predictor
    try:
        predictor = ConstructionDelayPredictor()
        
        # Check if trained model exists
        if os.path.exists('construction_delay_model.pkl'):
            logger.info("Loading pre-trained model...")
            predictor.load_model('construction_delay_model.pkl')
            logger.info("Model loaded successfully!")
        else:
            logger.warning("No pre-trained model found. Training new model...")
            # Train a new model
            from generate_construction_dataset import ConstructionDatasetGenerator
            
            # Generate dataset if it doesn't exist
            if not os.path.exists('construction_delay_dataset.csv'):
                logger.info("Generating training dataset...")
                generator = ConstructionDatasetGenerator()
                dataset = generator.generate_dataset(2000)
                dataset.to_csv('construction_delay_dataset.csv', index=False)
                logger.info("Dataset generated.")
            
            # Train model
            logger.info("Training model...")
            X, y, df = predictor.load_and_preprocess_data('construction_delay_dataset.csv')
            predictor.initialize_models()
            predictor.train_models(X, y)
            predictor.save_model('construction_delay_model.pkl')
            logger.info("Model trained and saved!")
            
    except Exception as e:
        logger.error(f"Error initializing predictor: {str(e)}")
        logger.error(traceback.format_exc())
        predictor = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': predictor is not None,
        'model_name': predictor.best_model_name if predictor else None
    })

@app.route('/predict-delay', methods=['POST'])
def predict_delay():
    """Predict construction delay for a project"""
    try:
        if predictor is None:
            return jsonify({'error': 'ML model not initialized'}), 500
        
        # Get project data from request
        project_data = request.json
        if not project_data:
            return jsonify({'error': 'No project data provided'}), 400
        
        logger.info(f"Received prediction request for project: {project_data.get('project_id', 'unknown')}")
        
        # Make prediction
        prediction = predictor.predict_delay(project_data)
        
        logger.info(f"Prediction completed: {prediction['predicted_delay_days']} days")
        
        return jsonify({
            'success': True,
            'prediction': prediction,
            'timestamp': str(pd.Timestamp.now())
        })
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    try:
        if predictor is None:
            return jsonify({'error': 'ML model not initialized'}), 500
        
        info = {
            'model_name': predictor.best_model_name,
            'feature_count': len(predictor.feature_names),
            'features': predictor.feature_names,
            'training_history': predictor.training_history if hasattr(predictor, 'training_history') else None
        }
        
        # Add feature importance if available
        if predictor.best_model_name in predictor.feature_importance:
            info['top_features'] = dict(predictor.feature_importance[predictor.best_model_name][:10])
        
        return jsonify(info)
        
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/retrain', methods=['POST'])
def retrain_model():
    """Retrain the model with new data"""
    try:
        if predictor is None:
            return jsonify({'error': 'ML predictor not initialized'}), 500
        
        # Get training parameters
        params = request.json or {}
        dataset_path = params.get('dataset_path', 'construction_delay_dataset.csv')
        
        if not os.path.exists(dataset_path):
            return jsonify({'error': f'Dataset file not found: {dataset_path}'}), 400
        
        logger.info(f"Starting model retraining with dataset: {dataset_path}")
        
        # Retrain model
        X, y, df = predictor.load_and_preprocess_data(dataset_path)
        predictor.initialize_models()
        results = predictor.train_models(X, y)
        
        # Save retrained model
        predictor.save_model('construction_delay_model.pkl')
        
        logger.info("Model retrained successfully")
        
        return jsonify({
            'success': True,
            'message': 'Model retrained successfully',
            'results': {name: {
                'cv_mae': result['cv_mae'],
                'test_mae': result['test_mae'],
                'test_r2': result['test_r2']
            } for name, result in results.items()},
            'best_model': predictor.best_model_name
        })
        
    except Exception as e:
        logger.error(f"Error retraining model: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/feature-importance', methods=['GET'])
def get_feature_importance():
    """Get feature importance for the current model"""
    try:
        if predictor is None:
            return jsonify({'error': 'ML model not initialized'}), 500
        
        if predictor.best_model_name not in predictor.feature_importance:
            return jsonify({'error': 'Feature importance not available'}), 400
        
        # Get top N features
        top_n = request.args.get('top_n', 20, type=int)
        top_features = predictor.feature_importance[predictor.best_model_name][:top_n]
        
        return jsonify({
            'model_name': predictor.best_model_name,
            'feature_importance': [
                {'feature': feature, 'importance': importance}
                for feature, importance in top_features
            ]
        })
        
    except Exception as e:
        logger.error(f"Error getting feature importance: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Predict delays for multiple projects"""
    try:
        if predictor is None:
            return jsonify({'error': 'ML model not initialized'}), 500
        
        # Get batch data
        batch_data = request.json
        if not batch_data or 'projects' not in batch_data:
            return jsonify({'error': 'No projects data provided'}), 400
        
        projects = batch_data['projects']
        if not isinstance(projects, list):
            return jsonify({'error': 'Projects must be a list'}), 400
        
        logger.info(f"Processing batch prediction for {len(projects)} projects")
        
        # Make predictions for all projects
        predictions = []
        for i, project in enumerate(projects):
            try:
                prediction = predictor.predict_delay(project)
                predictions.append({
                    'project_index': i,
                    'project_id': project.get('project_id', f'project_{i}'),
                    'prediction': prediction
                })
            except Exception as e:
                predictions.append({
                    'project_index': i,
                    'project_id': project.get('project_id', f'project_{i}'),
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'total_projects': len(projects),
            'successful_predictions': len([p for p in predictions if 'prediction' in p])
        })
        
    except Exception as e:
        logger.error(f"Error in batch prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Import pandas here to avoid import issues
    import pandas as pd
    
    print("Starting Construction Delay Prediction ML API...")
    print("=" * 50)
    
    # Initialize the predictor
    initialize_predictor()
    
    if predictor is None:
        print("ERROR: Failed to initialize ML predictor!")
        sys.exit(1)
    
    print(f"ML API ready with model: {predictor.best_model_name}")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  POST /predict-delay - Predict delay for single project")
    print("  POST /batch-predict - Predict delays for multiple projects")
    print("  GET  /model-info - Get model information")
    print("  GET  /feature-importance - Get feature importance")
    print("  POST /retrain - Retrain the model")
    print("=" * 50)
    
    # Start the Flask app
    app.run(host='0.0.0.0', port=5000, debug=False)
