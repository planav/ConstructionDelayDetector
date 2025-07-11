#!/usr/bin/env python3
"""
Construction Delay Prediction Model Trainer
Uses realistic construction data to train ML models
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns

class ConstructionDelayPredictor:
    def __init__(self):
        self.delay_model = None
        self.cost_model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'progress_efficiency',
            'resource_availability', 
            'project_complexity',
            'weather_impact',
            'timeline_pressure'
        ]
        
    def prepare_data(self, df):
        """Prepare data for training"""
        # Select features
        X = df[self.feature_names].copy()
        
        # Target variables
        y_delay = df['delay_days'].copy()
        y_cost = df['additional_cost_usd'].copy()
        
        return X, y_delay, y_cost
    
    def train_models(self, df):
        """Train both delay and cost prediction models"""
        print("Preparing data...")
        X, y_delay, y_cost = self.prepare_data(df)
        
        # Split data
        X_train, X_test, y_delay_train, y_delay_test, y_cost_train, y_cost_test = train_test_split(
            X, y_delay, y_cost, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        print("Training delay prediction model...")
        # Train delay model - Random Forest works well for construction data
        self.delay_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        self.delay_model.fit(X_train_scaled, y_delay_train)
        
        print("Training cost prediction model...")
        # Train cost model - Gradient Boosting for cost prediction
        self.cost_model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        self.cost_model.fit(X_train_scaled, y_cost_train)
        
        # Evaluate models
        print("\nEvaluating models...")
        self.evaluate_models(X_test_scaled, y_delay_test, y_cost_test)
        
        # Feature importance
        self.analyze_feature_importance()
        
        return X_test_scaled, y_delay_test, y_cost_test
    
    def evaluate_models(self, X_test, y_delay_test, y_cost_test):
        """Evaluate model performance"""
        # Delay model evaluation
        delay_pred = self.delay_model.predict(X_test)
        delay_mae = mean_absolute_error(y_delay_test, delay_pred)
        delay_rmse = np.sqrt(mean_squared_error(y_delay_test, delay_pred))
        delay_r2 = r2_score(y_delay_test, delay_pred)
        
        print(f"\nDelay Model Performance:")
        print(f"MAE: {delay_mae:.2f} days")
        print(f"RMSE: {delay_rmse:.2f} days")
        print(f"R²: {delay_r2:.3f}")
        
        # Cost model evaluation
        cost_pred = self.cost_model.predict(X_test)
        cost_mae = mean_absolute_error(y_cost_test, cost_pred)
        cost_rmse = np.sqrt(mean_squared_error(y_cost_test, cost_pred))
        cost_r2 = r2_score(y_cost_test, cost_pred)
        
        print(f"\nCost Model Performance:")
        print(f"MAE: ${cost_mae:,.0f}")
        print(f"RMSE: ${cost_rmse:,.0f}")
        print(f"R²: {cost_r2:.3f}")
        
    def analyze_feature_importance(self):
        """Analyze and display feature importance"""
        delay_importance = self.delay_model.feature_importances_
        cost_importance = self.cost_model.feature_importances_
        
        print(f"\nFeature Importance for Delay Prediction:")
        for i, feature in enumerate(self.feature_names):
            print(f"{feature}: {delay_importance[i]:.3f}")
            
        print(f"\nFeature Importance for Cost Prediction:")
        for i, feature in enumerate(self.feature_names):
            print(f"{feature}: {cost_importance[i]:.3f}")
    
    def predict(self, features):
        """Make predictions for new data"""
        if self.delay_model is None or self.cost_model is None:
            raise ValueError("Models not trained yet!")
            
        # Ensure features are in correct format
        if isinstance(features, dict):
            feature_array = np.array([[features[name] for name in self.feature_names]])
        else:
            feature_array = np.array(features).reshape(1, -1)
        
        # Scale features
        features_scaled = self.scaler.transform(feature_array)
        
        # Make predictions
        delay_pred = self.delay_model.predict(features_scaled)[0]
        cost_pred = self.cost_model.predict(features_scaled)[0]
        
        # Calculate confidence intervals (using model uncertainty)
        delay_confidence = self._calculate_confidence(features_scaled, 'delay')
        cost_confidence = self._calculate_confidence(features_scaled, 'cost')
        
        return {
            'predicted_delay_days': max(0, delay_pred),
            'predicted_additional_cost': max(0, cost_pred),
            'delay_confidence_interval': delay_confidence,
            'cost_confidence_interval': cost_confidence,
            'model_confidence': self._calculate_overall_confidence(features_scaled)
        }
    
    def _calculate_confidence(self, features, model_type):
        """Calculate prediction confidence intervals"""
        if model_type == 'delay':
            # Use individual tree predictions for uncertainty estimation
            tree_predictions = np.array([tree.predict(features)[0] for tree in self.delay_model.estimators_])
            std = np.std(tree_predictions)
            mean_pred = np.mean(tree_predictions)
        else:
            # For gradient boosting, use staged predictions
            staged_preds = list(self.cost_model.staged_predict(features))
            std = np.std([pred[0] for pred in staged_preds[-10:]])  # Last 10 stages
            mean_pred = staged_preds[-1][0]
        
        # 95% confidence interval
        lower = max(0, mean_pred - 1.96 * std)
        upper = mean_pred + 1.96 * std
        
        return [lower, upper]
    
    def _calculate_overall_confidence(self, features):
        """Calculate overall model confidence (0-100)"""
        # Base confidence on feature values (closer to training data = higher confidence)
        # This is a simplified approach - in practice, you'd use more sophisticated methods
        base_confidence = 85
        
        # Reduce confidence for extreme values
        feature_values = features[0]
        for value in feature_values:
            if value < 0.1 or value > 0.9:
                base_confidence -= 5
        
        return max(60, min(95, base_confidence))
    
    def save_models(self, delay_path='delay_model.pkl', cost_path='cost_model.pkl', scaler_path='scaler.pkl'):
        """Save trained models"""
        joblib.dump(self.delay_model, delay_path)
        joblib.dump(self.cost_model, cost_path)
        joblib.dump(self.scaler, scaler_path)
        print(f"Models saved to {delay_path}, {cost_path}, {scaler_path}")
    
    def load_models(self, delay_path='delay_model.pkl', cost_path='cost_model.pkl', scaler_path='scaler.pkl'):
        """Load trained models"""
        self.delay_model = joblib.load(delay_path)
        self.cost_model = joblib.load(cost_path)
        self.scaler = joblib.load(scaler_path)
        print("Models loaded successfully")

def main():
    # Generate dataset if it doesn't exist
    try:
        df = pd.read_csv('realistic_construction_dataset.csv')
        print(f"Loaded existing dataset with {len(df)} projects")
    except FileNotFoundError:
        print("Dataset not found. Generating new dataset...")
        from realistic_dataset_generator import generate_realistic_construction_dataset
        df = generate_realistic_construction_dataset(2000)
        df.to_csv('realistic_construction_dataset.csv', index=False)
    
    # Train models
    predictor = ConstructionDelayPredictor()
    predictor.train_models(df)
    
    # Save models
    predictor.save_models()
    
    # Test prediction
    print("\nTesting prediction...")
    test_features = {
        'progress_efficiency': 0.7,
        'resource_availability': 0.8,
        'project_complexity': 0.6,
        'weather_impact': 0.5,
        'timeline_pressure': 0.4
    }
    
    result = predictor.predict(test_features)
    print(f"Test prediction: {result}")

if __name__ == "__main__":
    main()
