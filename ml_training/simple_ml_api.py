#!/usr/bin/env python3
"""
Simple ML API for Construction Delay Prediction
"""
import sys
import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import joblib

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from delay_predictor import ConstructionDelayPredictor
    predictor = ConstructionDelayPredictor()
    
    # Load the trained model
    if os.path.exists('construction_delay_model.pkl'):
        predictor.load_model('construction_delay_model.pkl')
        print("✅ ML Model loaded successfully!")
        model_loaded = True
    else:
        print("❌ No trained model found!")
        model_loaded = False
        
except Exception as e:
    print(f"❌ Error loading ML model: {e}")
    predictor = None
    model_loaded = False

class MLAPIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'status': 'healthy',
                'model_loaded': model_loaded,
                'model_name': predictor.best_model_name if model_loaded else None
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif parsed_path.path == '/model-info':
            if not model_loaded:
                self.send_error(500, 'ML model not loaded')
                return
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'model_name': predictor.best_model_name,
                'feature_count': len(predictor.feature_names),
                'features': predictor.feature_names
            }
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_error(404, 'Endpoint not found')
    
    def do_POST(self):
        if self.path == '/predict-delay':
            if not model_loaded:
                self.send_error(500, 'ML model not loaded')
                return
                
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                project_data = json.loads(post_data.decode('utf-8'))
                
                # Make prediction
                prediction = predictor.predict_delay(project_data)
                
                # Convert numpy types to regular Python types for JSON serialization
                def convert_numpy(obj):
                    if hasattr(obj, 'item'):
                        return obj.item()
                    elif isinstance(obj, dict):
                        return {k: convert_numpy(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [convert_numpy(v) for v in obj]
                    return obj
                
                prediction = convert_numpy(prediction)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    'success': True,
                    'prediction': prediction
                }
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_error(500, f'Prediction error: {str(e)}')
        else:
            self.send_error(404, 'Endpoint not found')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server(port=5000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, MLAPIHandler)
    
    print("="*60)
    print("🤖 Construction Delay Prediction ML API")
    print("="*60)
    print(f"🚀 Server starting on http://localhost:{port}")
    print(f"📊 Model loaded: {model_loaded}")
    if model_loaded:
        print(f"🧠 Best model: {predictor.best_model_name}")
    print("\n📋 Available endpoints:")
    print(f"  GET  http://localhost:{port}/health")
    print(f"  GET  http://localhost:{port}/model-info")
    print(f"  POST http://localhost:{port}/predict-delay")
    print("="*60)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
