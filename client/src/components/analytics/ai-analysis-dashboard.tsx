import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  Wrench,
  Cloud,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Brain,
  BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { Project } from "@shared/schema";

export default function AIAnalysisDashboard() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: aiAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ["/api/analytics/projects", selectedProjectId, "ai-analysis"],
    enabled: !!selectedProjectId,
  });

  const { data: riskAssessment, isLoading: riskLoading } = useQuery({
    queryKey: ["/api/analytics/projects", selectedProjectId, "risk-assessment"],
    enabled: !!selectedProjectId,
  });

  const { data: performanceTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/analytics/projects", selectedProjectId, "performance-trends"],
    enabled: !!selectedProjectId,
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW': return <CheckCircle className="h-4 w-4" />;
      case 'MEDIUM': return <Clock className="h-4 w-4" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4" />;
      case 'CRITICAL': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Analysis & Predictions
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced AI-powered project analysis, delay prediction, and recommendations
          </p>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Select Project for Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a project to analyze..." />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name} - {project.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <Tabs defaultValue="ai-analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
            <TabsTrigger value="performance-trends">Performance Trends</TabsTrigger>
          </TabsList>

          {/* AI Analysis Tab */}
          <TabsContent value="ai-analysis" className="space-y-6">
            {analysisLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3">Analyzing project with AI...</span>
                </CardContent>
              </Card>
            ) : aiAnalysis?.analysis ? (
              <>
                {/* ML Prediction Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🤖 ML Prediction Results
                      <Badge variant="secondary">Advanced ML Model</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Predictions from Random Forest + Gradient Boosting models trained on 2000+ construction projects
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Estimated Delay</p>
                              <p className="text-2xl font-bold text-red-600">
                                {aiAnalysis.analysis.estimatedDelayDays} days
                              </p>
                            </div>
                            <Calendar className="h-8 w-8 text-red-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Cost Impact</p>
                              <p className="text-2xl font-bold text-orange-600">
                                ${(aiAnalysis.analysis.costImpact || 0)?.toLocaleString()}
                              </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-orange-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Confidence Level</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {aiAnalysis.analysis.confidenceLevel || 75}%
                              </p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Risk Level</p>
                              <Badge className={getRiskColor(aiAnalysis.analysis.riskLevel || 'MEDIUM')}>
                                {getRiskIcon(aiAnalysis.analysis.riskLevel || 'MEDIUM')}
                                <span className="ml-1">{aiAnalysis.analysis.riskLevel || 'MEDIUM'}</span>
                              </Badge>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Root Causes of Delays */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Root Causes of Delays
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(aiAnalysis.analysis.ai_analysis?.root_causes || aiAnalysis.analysis.delayReasons)?.map((reason: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <span className="text-sm text-red-800">{reason}</span>
                        </div>
                      )) || <p className="text-gray-500">No specific delay factors identified</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600">Immediate Actions</CardTitle>
                      <p className="text-sm text-gray-600">Next 24-48 hours</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(aiAnalysis.analysis.ai_analysis?.action_plan?.immediate_actions || aiAnalysis.analysis.recommendations?.immediate)?.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-red-800">{rec}</span>
                          </div>
                        )) || <p className="text-gray-500">No immediate actions required</p>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-orange-600">Short-term Strategies</CardTitle>
                      <p className="text-sm text-gray-600">Next 1-2 weeks</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(aiAnalysis.analysis.ai_analysis?.action_plan?.short_term_strategies || aiAnalysis.analysis.recommendations?.shortTerm)?.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                            <Clock className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-orange-800">{rec}</span>
                          </div>
                        )) || <p className="text-gray-500">No short-term strategies needed</p>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-green-600">Long-term Optimizations</CardTitle>
                      <p className="text-sm text-gray-600">Strategic improvements</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(aiAnalysis.analysis.ai_analysis?.action_plan?.long_term_optimizations || aiAnalysis.analysis.recommendations?.longTerm)?.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                            <Target className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-green-800">{rec}</span>
                          </div>
                        )) || <p className="text-gray-500">No long-term optimizations identified</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cost Impact Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      Cost Impact Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Labor Overrun</p>
                        <p className="text-lg font-semibold text-blue-600">
                          ${(aiAnalysis.analysis.ai_analysis?.cost_breakdown?.laborOverrun || aiAnalysis.analysis.budgetBreakdown?.laborOverrun || 0)?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Material Inflation</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${(aiAnalysis.analysis.ai_analysis?.cost_breakdown?.materialInflation || aiAnalysis.analysis.budgetBreakdown?.materialInflation || 0)?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Equipment Extension</p>
                        <p className="text-lg font-semibold text-purple-600">
                          ${(aiAnalysis.analysis.ai_analysis?.cost_breakdown?.equipmentExtension || aiAnalysis.analysis.budgetBreakdown?.equipmentExtension || 0)?.toLocaleString()}
                        </p>
                        </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-600">Penalties</p>
                        <p className="text-lg font-semibold text-red-600">
                          ${(aiAnalysis.analysis.ai_analysis?.cost_breakdown?.penalties || aiAnalysis.analysis.budgetBreakdown?.penalties || 0)?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No AI analysis available for this project</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Risk Assessment Tab */}
          <TabsContent value="risk-assessment" className="space-y-6">
            {riskLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3">Calculating risk assessment...</span>
                </CardContent>
              </Card>
            ) : riskAssessment ? (
              <>
                {/* Overall Risk Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Overall Project Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Badge className={`${getRiskColor(riskAssessment.overallRisk)} text-lg px-4 py-2`}>
                        {getRiskIcon(riskAssessment.overallRisk)}
                        <span className="ml-2">{riskAssessment.overallRisk} RISK</span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(riskAssessment.riskFactorsDetailed || riskAssessment.riskFactors || {}).map(([key, risk]: [string, any]) => (
                    <Card key={key}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm capitalize flex items-center gap-2">
                          {key === 'timelineRisk' && <Calendar className="h-4 w-4" />}
                          {key === 'budgetRisk' && <DollarSign className="h-4 w-4" />}
                          {key === 'resourceRisk' && <Users className="h-4 w-4" />}
                          {key === 'weatherRisk' && <Cloud className="h-4 w-4" />}
                          {key === 'qualityRisk' && <Wrench className="h-4 w-4" />}
                          {key.replace('Risk', '').replace(/([A-Z])/g, ' $1').trim()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Badge className={getRiskColor(risk.level)}>
                            {getRiskIcon(risk.level)}
                            <span className="ml-1">{risk.level}</span>
                          </Badge>
                          <Progress value={risk.score} className="h-2" />
                          <p className="text-xs text-gray-600">Risk Score: {risk.score}/100</p>
                          {risk.description && (
                            <p className="text-xs text-gray-500 mt-2">{risk.description}</p>
                          )}
                          {risk.factors && risk.factors.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Key Factors:</p>
                              {risk.factors.map((factor: string, index: number) => (
                                <p key={index} className="text-xs text-gray-600">• {factor}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Predictions */}
                {riskAssessment.predictions && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-600">Completion Prediction</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Predicted Date:</p>
                          <p className="text-lg font-semibold">{riskAssessment.predictions.completionDate}</p>
                          <p className="text-sm text-gray-600">Confidence: {riskAssessment.predictions.confidence || 'N/A'}%</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-green-600">Budget Prediction</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Final Budget:</p>
                          <p className="text-lg font-semibold">${riskAssessment.predictions.finalBudget?.toLocaleString() || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Confidence: {riskAssessment.predictions.budgetConfidence || 'N/A'}%</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-purple-600">Success Probability</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Success Rate:</p>
                          <p className="text-lg font-semibold">{riskAssessment.predictions.successProbability || 'N/A'}%</p>
                          <Progress value={riskAssessment.predictions.successProbability || 0} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No risk assessment available for this project</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Trends Tab */}
          <TabsContent value="performance-trends" className="space-y-6">
            {trendsLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3">Analyzing performance trends...</span>
                </CardContent>
              </Card>
            ) : performanceTrends ? (
              <>
                {/* Performance Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Performance Score</p>
                          <p className="text-2xl font-bold text-blue-600">{performanceTrends.performanceScore}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Avg Velocity</p>
                          <p className="text-2xl font-bold text-green-600">{performanceTrends.summary.averageVelocity}%/day</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Quality Score</p>
                          <p className="text-2xl font-bold text-purple-600">{performanceTrends.summary.averageQuality}</p>
                        </div>
                        <Target className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Trend Direction</p>
                          <p className="text-2xl font-bold text-orange-600">{performanceTrends.summary.trendDirection}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Trend Chart */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Progress Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performanceTrends.progressTrend?.data && performanceTrends.progressTrend.data.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceTrends.progressTrend.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                            formatter={(value) => [`${value}%`, 'Progress']}
                          />
                          <Line
                            type="monotone"
                            dataKey="progress"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <p>No progress data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Progress Trend Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        Progress Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Trend:</span>
                          <Badge className={
                            performanceTrends.progressTrend?.trend === 'improving' ? 'bg-green-100 text-green-800' :
                            performanceTrends.progressTrend?.trend === 'declining' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {performanceTrends.progressTrend?.trend === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {performanceTrends.progressTrend?.trend === 'declining' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {performanceTrends.progressTrend?.trend || 'Stable'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Velocity:</span>
                          <span className="font-medium">{performanceTrends.progressTrend?.velocity || 0}% per day</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Reports:</span>
                          <span className="font-medium">{performanceTrends.summary.totalReports}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                {/* Budget Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      Budget Utilization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Spent:</span>
                        <span className="font-medium">${performanceTrends.budgetTrend?.totalSpent?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Daily Average:</span>
                        <span className="font-medium">${performanceTrends.budgetTrend?.averageDailySpend?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Budget Status:</span>
                        <Badge className={
                          performanceTrends.budgetTrend?.trend === 'high' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {performanceTrends.budgetTrend?.trend === 'high' ? 'Over Budget' : 'On Track'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>

                {/* Additional Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resource Utilization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      Resource Utilization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Utilization:</span>
                        <span className="font-medium">{performanceTrends.resourceUtilizationTrend?.averageUtilization || 0}%</span>
                      </div>
                      <Progress value={performanceTrends.resourceUtilizationTrend?.averageUtilization || 0} className="h-2" />
                      <Badge className={
                        performanceTrends.resourceUtilizationTrend?.trend === 'high' ? 'bg-red-100 text-red-800' :
                        performanceTrends.resourceUtilizationTrend?.trend === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {performanceTrends.resourceUtilizationTrend?.trend || 'Low'} Utilization
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Weather Impact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-blue-500" />
                      Weather Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Impact Rate:</span>
                        <span className="font-medium">{performanceTrends.weatherImpactTrend?.impactRate || 0}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Adverse Days:</span>
                        <span className="font-medium">{performanceTrends.weatherImpactTrend?.adverseWeatherDays || 0} of {performanceTrends.weatherImpactTrend?.totalDays || 0}</span>
                      </div>
                      <Progress value={performanceTrends.weatherImpactTrend?.impactRate || 0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No performance trends available for this project</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
