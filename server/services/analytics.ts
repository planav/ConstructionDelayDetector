import type { ProjectWithRelations } from "@shared/schema";

// Timeline Risk Calculation
export function calculateTimelineRisk(project: ProjectWithRelations, reports: any[]) {
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const currentDate = new Date();
  
  const totalDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const expectedProgress = Math.min(100, (elapsedDays / totalDuration) * 100);
  const actualProgress = parseFloat(project.currentProgress || "0");
  const progressVariance = actualProgress - expectedProgress;
  
  let riskLevel = 'LOW';
  let riskScore = 0;
  
  if (progressVariance < -20 || remainingDays < 0) {
    riskLevel = 'CRITICAL';
    riskScore = 90;
  } else if (progressVariance < -10 || remainingDays < 7) {
    riskLevel = 'HIGH';
    riskScore = 70;
  } else if (progressVariance < -5 || remainingDays < 14) {
    riskLevel = 'MEDIUM';
    riskScore = 50;
  } else {
    riskLevel = 'LOW';
    riskScore = 20;
  }
  
  return {
    level: riskLevel,
    score: riskScore,
    progressVariance,
    remainingDays,
    factors: [
      progressVariance < -10 ? 'Behind schedule' : null,
      remainingDays < 14 ? 'Tight deadline' : null,
      actualProgress < 10 && elapsedDays > totalDuration * 0.3 ? 'Slow start' : null
    ].filter(Boolean)
  };
}

// Budget Risk Calculation
export function calculateBudgetRisk(project: ProjectWithRelations, reports: any[]) {
  const totalBudget = parseFloat(project.totalBudget);
  const budgetUsed = reports.reduce((sum, report) => sum + (parseFloat(report.budgetUtilized || "0")), 0);
  const extraBudgetUsed = reports.reduce((sum, report) => sum + (parseFloat(report.extraBudgetUsed || "0")), 0);
  
  const budgetUtilization = (budgetUsed / totalBudget) * 100;
  const actualProgress = parseFloat(project.currentProgress || "0");
  const budgetEfficiency = actualProgress / Math.max(budgetUtilization, 1);
  
  let riskLevel = 'LOW';
  let riskScore = 0;
  
  if (budgetUtilization > 90 || budgetEfficiency < 0.7 || extraBudgetUsed > totalBudget * 0.2) {
    riskLevel = 'CRITICAL';
    riskScore = 85;
  } else if (budgetUtilization > 75 || budgetEfficiency < 0.8 || extraBudgetUsed > totalBudget * 0.1) {
    riskLevel = 'HIGH';
    riskScore = 65;
  } else if (budgetUtilization > 60 || budgetEfficiency < 0.9 || extraBudgetUsed > totalBudget * 0.05) {
    riskLevel = 'MEDIUM';
    riskScore = 40;
  } else {
    riskLevel = 'LOW';
    riskScore = 15;
  }
  
  return {
    level: riskLevel,
    score: riskScore,
    budgetUtilization,
    budgetEfficiency,
    extraBudgetUsed,
    factors: [
      budgetUtilization > 80 ? 'High budget utilization' : null,
      budgetEfficiency < 0.8 ? 'Poor budget efficiency' : null,
      extraBudgetUsed > totalBudget * 0.1 ? 'Significant budget overruns' : null
    ].filter(Boolean)
  };
}

// Resource Risk Calculation
export function calculateResourceRisk(project: ProjectWithRelations, reports: any[]) {
  const recentReports = reports.slice(0, 5);
  let resourceShortages = 0;
  let totalResourceChecks = 0;
  
  recentReports.forEach(report => {
    if (report.resourceUsage && Array.isArray(report.resourceUsage)) {
      report.resourceUsage.forEach((resource: any) => {
        totalResourceChecks++;
        if (resource.required > resource.available) {
          resourceShortages++;
        }
      });
    }
  });
  
  const shortageRate = totalResourceChecks > 0 ? (resourceShortages / totalResourceChecks) * 100 : 0;
  
  let riskLevel = 'LOW';
  let riskScore = 0;
  
  if (shortageRate > 50) {
    riskLevel = 'CRITICAL';
    riskScore = 80;
  } else if (shortageRate > 30) {
    riskLevel = 'HIGH';
    riskScore = 60;
  } else if (shortageRate > 15) {
    riskLevel = 'MEDIUM';
    riskScore = 35;
  } else {
    riskLevel = 'LOW';
    riskScore = 10;
  }
  
  return {
    level: riskLevel,
    score: riskScore,
    shortageRate,
    totalResources: project.humanResources.length + project.materials.length + project.equipment.length,
    factors: [
      shortageRate > 30 ? 'Frequent resource shortages' : null,
      project.humanResources.length < 3 ? 'Limited human resources' : null,
      project.materials.length < 5 ? 'Limited material diversity' : null
    ].filter(Boolean)
  };
}

// Weather Risk Calculation
export function calculateWeatherRisk(reports: any[]) {
  const recentReports = reports.slice(0, 10);
  let adverseWeatherDays = 0;
  
  recentReports.forEach(report => {
    if (report.weatherData) {
      const weather = report.weatherData as any;
      if (weather.condition && ['Rain', 'Snow', 'Thunderstorm'].includes(weather.condition)) {
        adverseWeatherDays++;
      }
    }
  });
  
  const adverseWeatherRate = recentReports.length > 0 ? (adverseWeatherDays / recentReports.length) * 100 : 0;
  
  let riskLevel = 'LOW';
  let riskScore = 0;
  
  if (adverseWeatherRate > 40) {
    riskLevel = 'HIGH';
    riskScore = 60;
  } else if (adverseWeatherRate > 20) {
    riskLevel = 'MEDIUM';
    riskScore = 35;
  } else {
    riskLevel = 'LOW';
    riskScore = 10;
  }
  
  return {
    level: riskLevel,
    score: riskScore,
    adverseWeatherRate,
    adverseWeatherDays,
    factors: [
      adverseWeatherRate > 30 ? 'Frequent adverse weather' : null,
      adverseWeatherDays > 3 ? 'Recent weather disruptions' : null
    ].filter(Boolean)
  };
}

// Quality Risk Calculation
export function calculateQualityRisk(reports: any[]) {
  const recentReports = reports.slice(0, 10);
  let issueReports = 0;
  
  recentReports.forEach(report => {
    if (report.issuesEncountered && report.issuesEncountered.trim().length > 0) {
      issueReports++;
    }
  });
  
  const issueRate = recentReports.length > 0 ? (issueReports / recentReports.length) * 100 : 0;
  
  let riskLevel = 'LOW';
  let riskScore = 0;
  
  if (issueRate > 50) {
    riskLevel = 'HIGH';
    riskScore = 70;
  } else if (issueRate > 25) {
    riskLevel = 'MEDIUM';
    riskScore = 40;
  } else {
    riskLevel = 'LOW';
    riskScore = 15;
  }
  
  return {
    level: riskLevel,
    score: riskScore,
    issueRate,
    recentIssues: issueReports,
    factors: [
      issueRate > 40 ? 'Frequent quality issues' : null,
      issueReports > 3 ? 'Recent quality problems' : null
    ].filter(Boolean)
  };
}

// Completion Date Prediction
export function predictCompletionDate(project: ProjectWithRelations, reports: any[]) {
  const currentProgress = parseFloat(project.currentProgress || "0");
  const remainingProgress = 100 - currentProgress;
  
  // Calculate average daily progress from recent reports
  const recentReports = reports.slice(0, 10).sort((a, b) => 
    new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
  );
  
  let averageDailyProgress = 0.5; // Default fallback
  if (recentReports.length > 1) {
    const progressValues = recentReports.map(r => parseFloat(r.progressPercentage || "0"));
    const totalProgress = progressValues.reduce((sum, p) => sum + p, 0);
    averageDailyProgress = Math.max(0.1, totalProgress / recentReports.length);
  }
  
  const estimatedDaysToComplete = remainingProgress / averageDailyProgress;
  const predictedCompletionDate = new Date();
  predictedCompletionDate.setDate(predictedCompletionDate.getDate() + Math.ceil(estimatedDaysToComplete));
  
  const originalEndDate = new Date(project.endDate);
  const delayDays = Math.max(0, Math.ceil((predictedCompletionDate.getTime() - originalEndDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  return {
    predictedDate: predictedCompletionDate.toISOString().split('T')[0],
    originalDate: project.endDate,
    delayDays,
    confidence: Math.min(95, Math.max(60, 90 - (delayDays * 2)))
  };
}

// Final Budget Prediction
export function predictFinalBudget(project: ProjectWithRelations, reports: any[]) {
  const totalBudget = parseFloat(project.totalBudget);
  const currentProgress = parseFloat(project.currentProgress || "0");
  const budgetUsed = reports.reduce((sum, report) => sum + (parseFloat(report.budgetUtilized || "0")), 0);
  const extraBudgetUsed = reports.reduce((sum, report) => sum + (parseFloat(report.extraBudgetUsed || "0")), 0);
  
  // Calculate burn rate
  const burnRate = currentProgress > 0 ? (budgetUsed + extraBudgetUsed) / currentProgress : 0;
  const projectedTotalCost = burnRate * 100;
  
  // Add buffer for delays and unforeseen costs
  const delayBuffer = Math.max(0, projectedTotalCost * 0.1); // 10% buffer
  const finalBudgetPrediction = projectedTotalCost + delayBuffer;
  
  const overrunAmount = Math.max(0, finalBudgetPrediction - totalBudget);
  const overrunPercentage = (overrunAmount / totalBudget) * 100;
  
  return {
    predictedBudget: Math.round(finalBudgetPrediction),
    originalBudget: totalBudget,
    overrunAmount: Math.round(overrunAmount),
    overrunPercentage: Math.round(overrunPercentage * 100) / 100,
    confidence: Math.min(90, Math.max(50, 85 - (overrunPercentage * 2)))
  };
}

// Success Probability Calculation
export function calculateSuccessProbability(project: ProjectWithRelations, reports: any[]) {
  const timelineRisk = calculateTimelineRisk(project, reports);
  const budgetRisk = calculateBudgetRisk(project, reports);
  const resourceRisk = calculateResourceRisk(project, reports);
  const weatherRisk = calculateWeatherRisk(reports);
  const qualityRisk = calculateQualityRisk(reports);
  
  // Weighted average of risk scores (lower risk = higher success probability)
  const overallRiskScore = (
    timelineRisk.score * 0.3 +
    budgetRisk.score * 0.25 +
    resourceRisk.score * 0.2 +
    weatherRisk.score * 0.15 +
    qualityRisk.score * 0.1
  );
  
  const successProbability = Math.max(10, Math.min(95, 100 - overallRiskScore));
  
  let successLevel = 'HIGH';
  if (successProbability < 40) successLevel = 'LOW';
  else if (successProbability < 70) successLevel = 'MEDIUM';
  
  return {
    probability: Math.round(successProbability),
    level: successLevel,
    overallRiskScore: Math.round(overallRiskScore)
  };
}

// Generate Risk Mitigation Recommendations
export async function generateRiskMitigationRecommendations(project: ProjectWithRelations, reports: any[]) {
  const timelineRisk = calculateTimelineRisk(project, reports);
  const budgetRisk = calculateBudgetRisk(project, reports);
  const resourceRisk = calculateResourceRisk(project, reports);

  const recommendations = [];

  // Timeline-based recommendations
  if (timelineRisk.level === 'HIGH' || timelineRisk.level === 'CRITICAL') {
    recommendations.push('Implement fast-track construction methods');
    recommendations.push('Consider working extended hours or additional shifts');
    recommendations.push('Prioritize critical path activities');
  }

  // Budget-based recommendations
  if (budgetRisk.level === 'HIGH' || budgetRisk.level === 'CRITICAL') {
    recommendations.push('Implement strict budget controls and approval processes');
    recommendations.push('Review and optimize resource allocation');
    recommendations.push('Negotiate better rates with suppliers and contractors');
  }

  // Resource-based recommendations
  if (resourceRisk.level === 'HIGH' || resourceRisk.level === 'CRITICAL') {
    recommendations.push('Secure backup suppliers and contractors');
    recommendations.push('Implement just-in-time resource delivery');
    recommendations.push('Cross-train workers for multiple roles');
  }

  return recommendations.length > 0 ? recommendations : ['Continue monitoring project metrics closely'];
}

// Progress Trend Calculation
export function calculateProgressTrend(reports: any[]) {
  const sortedReports = reports.slice(0, 30).sort((a, b) =>
    new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
  );

  if (sortedReports.length < 2) {
    return { trend: 'stable', velocity: 0, data: [] };
  }

  const progressData = sortedReports.map(report => ({
    date: report.reportDate,
    progress: parseFloat(report.progressPercentage || "0")
  }));

  // Calculate trend using simple linear regression
  const n = progressData.length;
  const sumX = progressData.reduce((sum, _, i) => sum + i, 0);
  const sumY = progressData.reduce((sum, point) => sum + point.progress, 0);
  const sumXY = progressData.reduce((sum, point, i) => sum + (i * point.progress), 0);
  const sumXX = progressData.reduce((sum, _, i) => sum + (i * i), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  let trend = 'stable';
  if (slope > 0.1) trend = 'improving';
  else if (slope < -0.1) trend = 'declining';

  return {
    trend,
    velocity: Math.round(slope * 100) / 100,
    data: progressData
  };
}

// Budget Trend Calculation
export function calculateBudgetTrend(reports: any[]) {
  const sortedReports = reports.slice(0, 30).sort((a, b) =>
    new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
  );

  const budgetData = sortedReports.map(report => ({
    date: report.reportDate,
    budgetUsed: parseFloat(report.budgetUtilized || "0"),
    extraBudget: parseFloat(report.extraBudgetUsed || "0")
  }));

  const totalBudgetUsed = budgetData.reduce((sum, point) => sum + point.budgetUsed + point.extraBudget, 0);
  const averageDailySpend = budgetData.length > 0 ? totalBudgetUsed / budgetData.length : 0;

  return {
    totalSpent: totalBudgetUsed,
    averageDailySpend: Math.round(averageDailySpend),
    data: budgetData
  };
}

// Resource Utilization Trend
export function calculateResourceTrend(reports: any[]) {
  const recentReports = reports.slice(0, 10);
  let totalResourceChecks = 0;
  let totalUtilization = 0;

  recentReports.forEach(report => {
    if (report.resourceUsage && Array.isArray(report.resourceUsage)) {
      report.resourceUsage.forEach((resource: any) => {
        totalResourceChecks++;
        const utilization = resource.available > 0 ? (resource.required / resource.available) * 100 : 0;
        totalUtilization += Math.min(100, utilization);
      });
    }
  });

  const averageUtilization = totalResourceChecks > 0 ? totalUtilization / totalResourceChecks : 0;

  return {
    averageUtilization: Math.round(averageUtilization),
    totalChecks: totalResourceChecks,
    trend: averageUtilization > 80 ? 'high' : averageUtilization > 60 ? 'medium' : 'low'
  };
}

// Weather Impact Trend
export function calculateWeatherImpactTrend(reports: any[]) {
  const recentReports = reports.slice(0, 15);
  let adverseWeatherDays = 0;
  let totalDays = 0;

  const weatherData = recentReports.map(report => {
    totalDays++;
    const isAdverse = report.weatherData &&
      ['Rain', 'Snow', 'Thunderstorm'].includes((report.weatherData as any).condition);

    if (isAdverse) adverseWeatherDays++;

    return {
      date: report.reportDate,
      condition: report.weatherData ? (report.weatherData as any).condition : 'Unknown',
      temperature: report.weatherData ? (report.weatherData as any).temperature : 0,
      isAdverse
    };
  });

  const impactRate = totalDays > 0 ? (adverseWeatherDays / totalDays) * 100 : 0;

  return {
    impactRate: Math.round(impactRate),
    adverseWeatherDays,
    totalDays,
    data: weatherData
  };
}

// Velocity Trend Calculation
export function calculateVelocityTrend(reports: any[]) {
  const sortedReports = reports.slice(0, 20).sort((a, b) =>
    new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
  );

  if (sortedReports.length < 2) {
    return { currentVelocity: 0, trend: 'stable', data: [] };
  }

  const velocityData = [];
  for (let i = 1; i < sortedReports.length; i++) {
    const currentProgress = parseFloat(sortedReports[i].progressPercentage || "0");
    const previousProgress = parseFloat(sortedReports[i-1].progressPercentage || "0");
    const velocity = currentProgress - previousProgress;

    velocityData.push({
      date: sortedReports[i].reportDate,
      velocity: Math.max(0, velocity)
    });
  }

  const averageVelocity = velocityData.length > 0 ?
    velocityData.reduce((sum, point) => sum + point.velocity, 0) / velocityData.length : 0;

  const recentVelocity = velocityData.slice(-5).reduce((sum, point) => sum + point.velocity, 0) / Math.min(5, velocityData.length);

  let trend = 'stable';
  if (recentVelocity > averageVelocity * 1.1) trend = 'accelerating';
  else if (recentVelocity < averageVelocity * 0.9) trend = 'decelerating';

  return {
    currentVelocity: Math.round(recentVelocity * 100) / 100,
    averageVelocity: Math.round(averageVelocity * 100) / 100,
    trend,
    data: velocityData
  };
}
