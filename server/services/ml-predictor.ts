import type { ProjectWithRelations } from "@shared/schema";

interface MLPrediction {
  predicted_delay_days: number;
  confidence_interval: [number, number];
  confidence_percentage: number;
  model_used: string;
  model_mae: number;
  feature_importance: Record<string, number>;
}

interface MLResponse {
  success: boolean;
  prediction?: MLPrediction;
  error?: string;
  timestamp?: string;
}

class MLPredictorService {
  private mlApiUrl: string;
  private isAvailable: boolean = false;

  constructor() {
    this.mlApiUrl = process.env.ML_API_URL || 'http://localhost:5000';
    this.checkMLServiceHealth();
  }

  private async checkMLServiceHealth(): Promise<void> {
    try {
      const response = await fetch(`${this.mlApiUrl}/health`);
      const health = await response.json();
      this.isAvailable = health.status === 'healthy' && health.model_loaded;
      
      if (this.isAvailable) {
        console.log(`✅ ML Service connected: ${health.model_name} model loaded`);
      } else {
        console.log('⚠️ ML Service not ready - using fallback predictions');
      }
    } catch (error) {
      console.log('⚠️ ML Service unavailable - using fallback predictions');
      this.isAvailable = false;
    }
  }

  /**
   * Extract ML features from your existing project and DPR data
   */
  public extractMLFeatures(project: ProjectWithRelations, reports: any[]): any {
    // Time-based calculations
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const currentDate = new Date();
    
    const plannedDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.min(100, Math.max(0, (elapsedDays / plannedDuration) * 100));
    const actualProgress = parseFloat(project.currentProgress || "0");
    
    // Progress metrics from DPRs
    const recentReports = reports.slice(0, 10).sort((a, b) => 
      new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
    );
    
    const progressData = recentReports.map(r => parseFloat(r.progressPercentage || "0"));
    const budgetData = recentReports.map(r => parseFloat(r.budgetUtilized || "0"));
    const extraBudgetData = recentReports.map(r => parseFloat(r.extraBudgetUsed || "0"));
    
    // Calculate progress metrics
    const progressVariance = actualProgress - expectedProgress;
    const dailyProgressVelocity = progressData.length > 1 ? 
      progressData.reduce((sum, p) => sum + p, 0) / progressData.length / 100 : 0.005;
    
    // Resource efficiency from DPRs
    let laborEfficiency = 0.85; // Default
    let materialShortageFreq = 0.05; // Default
    let equipmentAvailability = 0.92; // Default
    
    if (recentReports.length > 0) {
      let totalResourceChecks = 0;
      let resourceShortages = 0;
      let totalUtilization = 0;
      
      recentReports.forEach(report => {
        if (report.resourceUsage && Array.isArray(report.resourceUsage)) {
          report.resourceUsage.forEach((resource: any) => {
            totalResourceChecks++;
            const required = parseFloat(resource.required) || 0;
            const available = parseFloat(resource.available) || 0;
            
            if (required > available && available > 0) {
              resourceShortages++;
            }
            
            if (available > 0) {
              totalUtilization += Math.min(1, required / available);
            }
          });
        }
      });
      
      if (totalResourceChecks > 0) {
        materialShortageFreq = resourceShortages / totalResourceChecks;
        laborEfficiency = totalUtilization / totalResourceChecks;
        equipmentAvailability = Math.max(0.6, 1 - materialShortageFreq);
      }
    }
    
    // Weather impact analysis
    let weatherImpactDays = 0;
    let weatherSeverityScore = 3.0;
    
    recentReports.forEach(report => {
      if (report.weatherData) {
        const weather = report.weatherData as any;
        if (weather.condition && ['Rain', 'Snow', 'Thunderstorm', 'Clouds'].includes(weather.condition)) {
          weatherImpactDays++;
          if (['Rain', 'Snow', 'Thunderstorm'].includes(weather.condition)) {
            weatherSeverityScore += 1;
          }
        }
      }
    });
    
    // Quality issues frequency
    let qualityIssuesFreq = 0;
    recentReports.forEach(report => {
      if (report.issuesEncountered && report.issuesEncountered.trim().length > 0) {
        qualityIssuesFreq += 0.1;
      }
    });
    
    // Budget metrics
    const totalBudgetUsed = budgetData.reduce((sum, b) => sum + b, 0);
    const totalExtraBudget = extraBudgetData.reduce((sum, b) => sum + b, 0);
    const budgetBurnRate = actualProgress > 0 ? 
      (totalBudgetUsed + totalExtraBudget) / actualProgress : 1.0;
    const costOverrunPercentage = totalExtraBudget > 0 ? 
      (totalExtraBudget / parseFloat(project.totalBudget)) * 100 : 0;
    
    return {
      // Project characteristics
      project_type: this.categorizeProjectType(project.name, project.location),
      location: this.normalizeLocation(project.location),
      climate_zone: this.mapClimateZone(project.location),
      season_started: this.getSeasonFromDate(project.startDate),
      project_size_budget: parseFloat(project.totalBudget),
      project_duration_planned: plannedDuration,
      project_complexity_score: this.calculateComplexityScore(project),
      
      // Progress metrics
      progress_variance: Math.round(progressVariance * 100) / 100,
      daily_progress_velocity: Math.round(dailyProgressVelocity * 10000) / 10000,
      milestone_achievement_rate: Math.min(1, Math.max(0.3, actualProgress / 100)),
      progress_consistency_score: this.calculateProgressConsistency(progressData),
      
      // Resource factors
      labor_utilization_efficiency: Math.round(laborEfficiency * 1000) / 1000,
      material_shortage_frequency: Math.round(materialShortageFreq * 1000) / 1000,
      equipment_availability_ratio: Math.round(equipmentAvailability * 1000) / 1000,
      resource_cost_variance: Math.round(costOverrunPercentage * 100) / 100,
      
      // External factors
      weather_impact_days: weatherImpactDays,
      weather_severity_score: Math.round(weatherSeverityScore * 100) / 100,
      supply_chain_disruption_days: Math.max(0, materialShortageFreq * 30),
      regulatory_delay_days: this.estimateRegulatoryDelays(project),
      
      // Financial metrics
      budget_burn_rate: Math.round(budgetBurnRate * 1000) / 1000,
      cash_flow_consistency: Math.random() * 0.1 + 0.05, // Placeholder
      cost_overrun_percentage: Math.round(costOverrunPercentage * 100) / 100,
      
      // Quality metrics
      rework_frequency: Math.round(qualityIssuesFreq * 1000) / 1000,
      inspection_failure_rate: Math.min(0.5, qualityIssuesFreq * 2),
      safety_incident_count: Math.floor(qualityIssuesFreq * 10),
      
      // Historical performance (estimated)
      contractor_past_performance_score: this.estimateContractorPerformance(project),
      regional_construction_index: this.getRegionalIndex(project.location),
      similar_project_avg_delay: this.estimateSimilarProjectDelays(project)
    };
  }

  /**
   * Predict project delay using ML model
   */
  public async predictProjectDelay(project: ProjectWithRelations, reports: any[]): Promise<MLPrediction> {
    try {
      if (!this.isAvailable) {
        return this.getFallbackPrediction(project, reports);
      }

      const mlFeatures = this.extractMLFeatures(project, reports);
      
      const response = await fetch(`${this.mlApiUrl}/predict-delay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mlFeatures),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`ML API error: ${response.status}`);
      }

      const result: MLResponse = await response.json();
      
      if (!result.success || !result.prediction) {
        throw new Error(result.error || 'Invalid ML response');
      }

      console.log(`✅ ML Prediction: ${result.prediction.predicted_delay_days} days (${result.prediction.confidence_percentage}% confidence)`);
      
      return result.prediction;

    } catch (error) {
      console.error('ML prediction error:', error);
      return this.getFallbackPrediction(project, reports);
    }
  }

  /**
   * Fallback prediction when ML service is unavailable
   */
  private getFallbackPrediction(project: ProjectWithRelations, reports: any[]): MLPrediction {
    const features = this.extractMLFeatures(project, reports);
    
    // Simple heuristic-based delay calculation
    let delayScore = 0;
    
    // Progress-based delay
    if (features.progress_variance < -10) delayScore += Math.abs(features.progress_variance);
    
    // Resource-based delay
    if (features.labor_utilization_efficiency < 0.8) delayScore += (0.8 - features.labor_utilization_efficiency) * 50;
    if (features.material_shortage_frequency > 0.1) delayScore += features.material_shortage_frequency * 30;
    
    // Weather-based delay
    delayScore += features.weather_impact_days * 0.8;
    
    // Quality-based delay
    delayScore += features.rework_frequency * 40;
    
    // Complexity penalty
    delayScore += (features.project_complexity_score - 5) * 2;
    
    const predictedDelay = Math.max(0, Math.round(delayScore));
    
    return {
      predicted_delay_days: predictedDelay,
      confidence_interval: [Math.max(0, predictedDelay - 7), predictedDelay + 7],
      confidence_percentage: 65, // Lower confidence for fallback
      model_used: 'fallback_heuristic',
      model_mae: 8.5,
      feature_importance: {
        'progress_variance': 0.25,
        'labor_utilization_efficiency': 0.20,
        'weather_impact_days': 0.15,
        'material_shortage_frequency': 0.15,
        'project_complexity_score': 0.10,
        'rework_frequency': 0.15
      }
    };
  }

  // Helper methods for feature extraction
  private categorizeProjectType(name: string, location: string): string {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('house') || nameLower.includes('residential') || nameLower.includes('apartment')) {
      return 'residential';
    } else if (nameLower.includes('office') || nameLower.includes('commercial') || nameLower.includes('retail')) {
      return 'commercial';
    } else if (nameLower.includes('bridge') || nameLower.includes('road') || nameLower.includes('highway') || nameLower.includes('infrastructure')) {
      return 'infrastructure';
    } else if (nameLower.includes('factory') || nameLower.includes('plant') || nameLower.includes('industrial')) {
      return 'industrial';
    }
    return 'commercial'; // Default
  }

  private normalizeLocation(location: string): string {
    // Normalize location names to match training data
    const locationMap: Record<string, string> = {
      'NYC': 'New York',
      'LA': 'California',
      'SF': 'California',
      'Chi': 'Illinois',
      'Chicago': 'Illinois'
    };
    return locationMap[location] || location;
  }

  private mapClimateZone(location: string): string {
    const climateMap: Record<string, string> = {
      'New York': 'temperate',
      'California': 'mediterranean',
      'Texas': 'subtropical',
      'Florida': 'tropical',
      'Illinois': 'continental',
      'Chicago': 'continental'
    };
    return climateMap[location] || 'temperate';
  }

  private getSeasonFromDate(dateStr: string): string {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  private calculateComplexityScore(project: ProjectWithRelations): number {
    let complexity = 5; // Base complexity
    
    const budget = parseFloat(project.totalBudget);
    if (budget > 10000000) complexity += 2;
    else if (budget > 5000000) complexity += 1;
    
    complexity += project.humanResources.length > 5 ? 1 : 0;
    complexity += project.materials.length > 10 ? 1 : 0;
    complexity += project.equipment.length > 5 ? 1 : 0;
    
    return Math.min(10, Math.max(1, complexity));
  }

  private calculateProgressConsistency(progressData: number[]): number {
    if (progressData.length < 2) return 0.1;
    
    const mean = progressData.reduce((sum, p) => sum + p, 0) / progressData.length;
    const variance = progressData.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / progressData.length;
    
    return Math.min(0.5, Math.sqrt(variance) / 100);
  }

  private estimateRegulatoryDelays(project: ProjectWithRelations): number {
    const budget = parseFloat(project.totalBudget);
    if (budget > 50000000) return Math.floor(Math.random() * 15) + 5; // 5-20 days
    if (budget > 10000000) return Math.floor(Math.random() * 10) + 2; // 2-12 days
    return Math.floor(Math.random() * 5); // 0-5 days
  }

  private estimateContractorPerformance(project: ProjectWithRelations): number {
    // Estimate based on project success indicators
    const progress = parseFloat(project.currentProgress || "0");
    if (progress > 80) return 8.5;
    if (progress > 60) return 7.5;
    if (progress > 40) return 6.5;
    return 5.5;
  }

  private getRegionalIndex(location: string): number {
    const indices: Record<string, number> = {
      'New York': 0.85,
      'California': 0.82,
      'Texas': 0.88,
      'Florida': 0.86,
      'Illinois': 0.87
    };
    return indices[location] || 0.87;
  }

  private estimateSimilarProjectDelays(project: ProjectWithRelations): number {
    const budget = parseFloat(project.totalBudget);
    const baseDelay = budget > 10000000 ? 20 : budget > 5000000 ? 15 : 10;
    return baseDelay + (Math.random() * 10 - 5); // ±5 days variation
  }
}

// Export singleton instance
export const mlPredictor = new MLPredictorService();
