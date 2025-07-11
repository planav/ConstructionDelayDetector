# Construction Delay Prediction ML System

## 🎯 Overview

This is a hybrid AI system that combines:
1. **Custom ML Model** - Trained on construction project data for precise delay prediction
2. **Gemini AI Analysis** - Strategic insights, cost analysis, and actionable recommendations

## 🚀 Quick Start

### Step 1: Install Python Dependencies
```bash
cd ml_training
pip install -r requirements.txt
```

### Step 2: Generate Training Dataset
```bash
python generate_construction_dataset.py
```
This creates `construction_delay_dataset.csv` with 2,000 realistic construction projects.

### Step 3: Train the ML Model
```bash
python delay_predictor.py
```
This will:
- Train multiple ML models (Random Forest, XGBoost, Gradient Boosting)
- Select the best performing model
- Save the trained model as `construction_delay_model.pkl`

### Step 4: Start the ML API Service
```bash
python ml_api.py
```
The API will be available at `http://localhost:5000`

### Step 5: Update Your Node.js Environment
Add to your `.env` file:
```
ML_API_URL=http://localhost:5000
```

## 📊 Dataset Features

The generated dataset includes 29 features based on real construction patterns:

### Project Characteristics
- `project_type`: residential, commercial, infrastructure, industrial
- `project_size_budget`: Total project budget
- `project_duration_planned`: Planned duration in days
- `project_complexity_score`: 1-10 complexity rating
- `location`: Project location
- `climate_zone`: Climate classification
- `season_started`: Season when project started

### Progress Metrics
- `progress_variance`: Actual vs expected progress
- `daily_progress_velocity`: Average daily progress rate
- `milestone_achievement_rate`: Percentage of milestones met on time
- `progress_consistency_score`: Variance in daily progress

### Resource Factors
- `labor_utilization_efficiency`: Labor productivity ratio
- `material_shortage_frequency`: Days with material shortages
- `equipment_availability_ratio`: Equipment availability percentage
- `resource_cost_variance`: Actual vs planned resource costs

### External Factors
- `weather_impact_days`: Days affected by adverse weather
- `weather_severity_score`: Average weather severity
- `supply_chain_disruption_days`: Supply chain delay days
- `regulatory_delay_days`: Regulatory/permit delay days

### Financial Metrics
- `budget_burn_rate`: Budget utilization efficiency
- `cash_flow_consistency`: Spending pattern consistency
- `cost_overrun_percentage`: Budget overrun percentage

### Quality Metrics
- `rework_frequency`: Frequency of quality issues
- `inspection_failure_rate`: Failed inspection percentage
- `safety_incident_count`: Number of safety incidents

### Historical Performance
- `contractor_past_performance_score`: Contractor track record
- `regional_construction_index`: Regional performance index
- `similar_project_avg_delay`: Average delay for similar projects

### Target Variable
- `actual_delay_days`: **What we predict** - actual project delay in days

## 🤖 ML Model Performance

The system trains multiple models and selects the best performer:

- **Random Forest**: Great for feature importance and interpretability
- **XGBoost**: Excellent performance with tabular data
- **Gradient Boosting**: Strong ensemble performance

Expected performance:
- **Mean Absolute Error**: 5-8 days
- **R² Score**: 0.75-0.85
- **Confidence**: 75-95% depending on project characteristics

## 🔗 API Endpoints

### Health Check
```bash
GET /health
```

### Predict Delay
```bash
POST /predict-delay
Content-Type: application/json

{
  "project_type": "commercial",
  "project_size_budget": 5000000,
  "project_duration_planned": 300,
  "progress_variance": -12.5,
  "labor_utilization_efficiency": 0.78,
  // ... other features
}
```

Response:
```json
{
  "success": true,
  "prediction": {
    "predicted_delay_days": 23,
    "confidence_interval": [18, 28],
    "confidence_percentage": 82,
    "model_used": "xgboost",
    "feature_importance": {
      "progress_variance": 0.25,
      "labor_utilization_efficiency": 0.20,
      "weather_impact_days": 0.15
    }
  }
}
```

### Model Information
```bash
GET /model-info
```

### Feature Importance
```bash
GET /feature-importance?top_n=15
```

### Batch Prediction
```bash
POST /batch-predict
Content-Type: application/json

{
  "projects": [
    { /* project 1 features */ },
    { /* project 2 features */ }
  ]
}
```

## 🧠 Integration with Your App

The ML predictions are automatically integrated with your existing DPR system:

1. **Feature Extraction**: Your project and DPR data is automatically converted to ML features
2. **ML Prediction**: Custom model predicts delay in days with confidence intervals
3. **Gemini Analysis**: AI provides strategic insights based on ML predictions
4. **Hybrid Results**: Combined ML + AI analysis with actionable recommendations

### In Your DPR Analysis:
```typescript
// This happens automatically when you submit DPR
const analysis = await getHybridAIAnalysis(project, resourceUsage, dailyReports);

// Returns:
{
  ml_prediction: {
    predicted_delay_days: 23,
    confidence_percentage: 82,
    feature_importance: { ... }
  },
  ai_analysis: {
    cost_impact: { total_additional_cost: 125000, ... },
    action_plan: { immediate: [...], short_term: [...] },
    resource_optimization: { ... }
  },
  hybrid_confidence: 85
}
```

## 📈 Model Training Results

After training, you'll see output like:
```
Training random_forest...
  Train MAE: 4.23, Test MAE: 6.78
  Train R²: 0.892, Test R²: 0.834
  CV MAE: 6.45 ± 1.23

Training xgboost...
  Train MAE: 3.89, Test MAE: 6.12
  Train R²: 0.908, Test R²: 0.851
  CV MAE: 5.98 ± 1.15

Best model: xgboost
Best CV MAE: 5.98

Top 15 Most Important Features (xgboost):
 1. progress_variance                    0.1845
 2. labor_utilization_efficiency        0.1234
 3. weather_impact_days                  0.0987
 4. project_complexity_score            0.0876
 5. material_shortage_frequency          0.0765
```

## 🔧 Customization

### Adding New Features
1. Update `generate_construction_dataset.py` to include new features
2. Modify `extractMLFeatures()` in `ml-predictor.ts` to extract from your data
3. Retrain the model

### Improving Accuracy
1. Add more training data
2. Fine-tune model hyperparameters
3. Add domain-specific features
4. Implement ensemble methods

### Integration Options
- **Real-time**: ML API runs alongside your Node.js app
- **Batch**: Process multiple projects at once
- **Embedded**: Load model directly in Node.js (requires TensorFlow.js conversion)

## 🚨 Troubleshooting

### ML API Not Starting
- Check Python dependencies: `pip install -r requirements.txt`
- Verify port 5000 is available
- Check logs for specific errors

### Low Prediction Accuracy
- Ensure training data quality
- Add more diverse training examples
- Check feature extraction logic
- Validate data preprocessing

### Integration Issues
- Verify ML_API_URL in environment variables
- Check network connectivity between services
- Validate feature extraction from your project data

## 📊 Monitoring & Maintenance

### Model Performance
- Monitor prediction accuracy vs actual outcomes
- Retrain periodically with new project data
- Track feature importance changes over time

### API Health
- Use `/health` endpoint for monitoring
- Set up alerts for API downtime
- Monitor response times and error rates

## 🎯 Next Steps

1. **Deploy ML Service**: Set up production ML API server
2. **Collect Feedback**: Track prediction accuracy vs reality
3. **Continuous Learning**: Retrain model with completed projects
4. **Feature Engineering**: Add more sophisticated features
5. **Ensemble Methods**: Combine multiple models for better accuracy

The system is designed to learn and improve over time as you complete more projects and gather more data!
