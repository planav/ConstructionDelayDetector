import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class ConstructionDelayPredictor:
    def __init__(self):
        self.models = {}
        self.best_model = None
        self.best_model_name = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_importance = {}
        self.feature_names = []
        self.training_history = {}
        
    def load_and_preprocess_data(self, csv_path):
        """Load and preprocess the construction dataset"""
        print("Loading dataset...")
        df = pd.read_csv(csv_path)
        print(f"Dataset shape: {df.shape}")
        
        # Handle categorical variables
        categorical_cols = ['project_type', 'location', 'climate_zone', 'season_started']
        
        for col in categorical_cols:
            if col in df.columns:
                self.label_encoders[col] = LabelEncoder()
                df[col] = self.label_encoders[col].fit_transform(df[col].astype(str))
        
        # Separate features and target
        target_col = 'actual_delay_days'
        feature_cols = [col for col in df.columns if col not in ['project_id', target_col]]
        
        X = df[feature_cols]
        y = df[target_col]
        
        self.feature_names = feature_cols
        
        print(f"Features: {len(feature_cols)}")
        print(f"Target variable: {target_col}")
        print(f"Target statistics: Mean={y.mean():.1f}, Std={y.std():.1f}, Min={y.min()}, Max={y.max()}")
        
        return X, y, df
    
    def initialize_models(self):
        """Initialize different ML models for comparison"""
        self.models = {
            'random_forest': RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            ),
            'gradient_boost': GradientBoostingRegressor(
                n_estimators=100,
                max_depth=8,
                learning_rate=0.1,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
        }
    
    def train_models(self, X, y):
        """Train multiple models and compare performance"""
        print("\nTraining models...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=pd.cut(y, bins=5, labels=False)
        )
        
        # Scale features for models that need it
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        results = {}
        
        for name, model in self.models.items():
            print(f"\nTraining {name}...")

            # Use scaled or unscaled data based on model type
            if name in ['random_forest', 'gradient_boost']:
                train_X, test_X = X_train, X_test
            else:
                train_X, test_X = X_train_scaled, X_test_scaled
            
            # Train model
            model.fit(train_X, y_train)
            
            # Make predictions
            train_pred = model.predict(train_X)
            test_pred = model.predict(test_X)
            
            # Calculate metrics
            train_mae = mean_absolute_error(y_train, train_pred)
            test_mae = mean_absolute_error(y_test, test_pred)
            train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
            test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
            train_r2 = r2_score(y_train, train_pred)
            test_r2 = r2_score(y_test, test_pred)
            
            # Cross-validation
            cv_scores = cross_val_score(model, train_X, y_train, cv=5, 
                                      scoring='neg_mean_absolute_error', n_jobs=-1)
            cv_mae = -cv_scores.mean()
            cv_std = cv_scores.std()
            
            results[name] = {
                'model': model,
                'train_mae': train_mae,
                'test_mae': test_mae,
                'train_rmse': train_rmse,
                'test_rmse': test_rmse,
                'train_r2': train_r2,
                'test_r2': test_r2,
                'cv_mae': cv_mae,
                'cv_std': cv_std,
                'predictions': test_pred,
                'actual': y_test
            }
            
            # Store feature importance
            if hasattr(model, 'feature_importances_'):
                importance_dict = dict(zip(self.feature_names, model.feature_importances_))
                self.feature_importance[name] = sorted(importance_dict.items(), 
                                                     key=lambda x: x[1], reverse=True)
            
            print(f"  Train MAE: {train_mae:.2f}, Test MAE: {test_mae:.2f}")
            print(f"  Train R²: {train_r2:.3f}, Test R²: {test_r2:.3f}")
            print(f"  CV MAE: {cv_mae:.2f} ± {cv_std:.2f}")
        
        # Select best model based on cross-validation MAE
        best_model_name = min(results.keys(), key=lambda x: results[x]['cv_mae'])
        self.best_model = results[best_model_name]['model']
        self.best_model_name = best_model_name
        
        print(f"\nBest model: {best_model_name}")
        print(f"Best CV MAE: {results[best_model_name]['cv_mae']:.2f}")
        
        self.training_history = results
        return results
    
    def analyze_feature_importance(self, top_n=15):
        """Analyze and display feature importance"""
        if self.best_model_name not in self.feature_importance:
            print("No feature importance available for the best model")
            return
        
        print(f"\nTop {top_n} Most Important Features ({self.best_model_name}):")
        print("-" * 60)
        
        top_features = self.feature_importance[self.best_model_name][:top_n]
        
        for i, (feature, importance) in enumerate(top_features, 1):
            print(f"{i:2d}. {feature:<35} {importance:.4f}")
        
        return top_features
    
    def predict_delay(self, project_features):
        """Predict delay for a single project"""
        if self.best_model is None:
            raise ValueError("Model not trained yet. Call train_models() first.")
        
        # Convert to DataFrame if it's a dict
        if isinstance(project_features, dict):
            df = pd.DataFrame([project_features])
        else:
            df = project_features.copy()
        
        # Apply label encoding to categorical features
        categorical_cols = ['project_type', 'location', 'climate_zone', 'season_started']
        for col in categorical_cols:
            if col in df.columns and col in self.label_encoders:
                # Handle unseen categories
                try:
                    df[col] = self.label_encoders[col].transform(df[col].astype(str))
                except ValueError:
                    # If unseen category, use the most frequent category
                    most_frequent = self.label_encoders[col].classes_[0]
                    df[col] = df[col].apply(lambda x: most_frequent if x not in self.label_encoders[col].classes_ else x)
                    df[col] = self.label_encoders[col].transform(df[col])
        
        # Ensure all required features are present
        missing_features = set(self.feature_names) - set(df.columns)
        if missing_features:
            print(f"Warning: Missing features: {missing_features}")
            for feature in missing_features:
                df[feature] = 0  # Default value for missing features
        
        # Select only the features used in training
        df = df[self.feature_names]
        
        # Make prediction
        if self.best_model_name in ['random_forest', 'gradient_boost']:
            prediction = self.best_model.predict(df)[0]
        else:
            df_scaled = self.scaler.transform(df)
            prediction = self.best_model.predict(df_scaled)[0]
        
        # Calculate prediction confidence based on model performance
        model_mae = self.training_history[self.best_model_name]['cv_mae']
        confidence_interval = [max(0, prediction - model_mae), prediction + model_mae]
        
        # Calculate confidence percentage (inverse of relative error)
        confidence_pct = max(60, min(95, 100 - (model_mae / max(1, prediction)) * 100))
        
        return {
            'predicted_delay_days': max(0, round(prediction, 1)),
            'confidence_interval': [round(ci, 1) for ci in confidence_interval],
            'confidence_percentage': round(confidence_pct, 1),
            'model_used': self.best_model_name,
            'model_mae': round(model_mae, 2),
            'feature_importance': dict(self.feature_importance[self.best_model_name][:10])
        }
    
    def save_model(self, filepath):
        """Save the trained model and preprocessing components"""
        model_data = {
            'best_model': self.best_model,
            'best_model_name': self.best_model_name,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
            'feature_importance': self.feature_importance,
            'training_history': self.training_history,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load a previously trained model"""
        model_data = joblib.load(filepath)
        
        self.best_model = model_data['best_model']
        self.best_model_name = model_data['best_model_name']
        self.scaler = model_data['scaler']
        self.label_encoders = model_data['label_encoders']
        self.feature_names = model_data['feature_names']
        self.feature_importance = model_data['feature_importance']
        self.training_history = model_data['training_history']
        
        print(f"Model loaded from {filepath}")
        print(f"Best model: {self.best_model_name}")
    
    def evaluate_model(self):
        """Evaluate model performance and display results"""
        if not self.training_history:
            print("No training history available")
            return
        
        print("\n" + "="*80)
        print("MODEL EVALUATION RESULTS")
        print("="*80)
        
        for name, results in self.training_history.items():
            print(f"\n{name.upper()}:")
            print(f"  Cross-Validation MAE: {results['cv_mae']:.2f} ± {results['cv_std']:.2f} days")
            print(f"  Test MAE: {results['test_mae']:.2f} days")
            print(f"  Test RMSE: {results['test_rmse']:.2f} days")
            print(f"  Test R²: {results['test_r2']:.3f}")
        
        print(f"\nBEST MODEL: {self.best_model_name}")
        best_results = self.training_history[self.best_model_name]
        print(f"Expected prediction error: ±{best_results['cv_mae']:.1f} days")
        
        return self.training_history

def main():
    """Main training pipeline"""
    print("Construction Delay Prediction Model Training")
    print("=" * 50)
    
    # Initialize predictor
    predictor = ConstructionDelayPredictor()
    
    # Generate dataset if it doesn't exist
    import os
    if not os.path.exists('construction_delay_dataset.csv'):
        print("Dataset not found. Generating realistic construction dataset...")
        from generate_construction_dataset import ConstructionDatasetGenerator
        generator = ConstructionDatasetGenerator()
        dataset = generator.generate_dataset(2000)
        dataset.to_csv('construction_delay_dataset.csv', index=False)
        print("Dataset generated and saved.")
    
    # Load and preprocess data
    X, y, df = predictor.load_and_preprocess_data('construction_delay_dataset.csv')
    
    # Initialize and train models
    predictor.initialize_models()
    results = predictor.train_models(X, y)
    
    # Analyze results
    predictor.evaluate_model()
    predictor.analyze_feature_importance()
    
    # Save the trained model
    predictor.save_model('construction_delay_model.pkl')
    
    # Test prediction with sample data
    print("\n" + "="*50)
    print("TESTING PREDICTION")
    print("="*50)
    
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
    print(f"Sample prediction: {prediction}")
    
    print("\nTraining completed successfully!")

if __name__ == "__main__":
    main()
