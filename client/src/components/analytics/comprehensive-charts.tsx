import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, AlertTriangle, CheckCircle, BarChart3, PieChart, Target, Brain, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart, Line } from 'recharts';
import type { Project } from "@shared/schema";

interface ComprehensiveAnalytics {
  progressOverTime: Array<{
    projectName: string;
    expectedProgress: string;
    actualProgress: string;
    variance: string;
    daysElapsed: number;
    totalDays: number;
  }>;
  budgetUsageData: Array<{
    projectName: string;
    totalBudget: number;
    extraBudgetUsed: number;
    budgetUtilization: number;
    progressVsBudget: string;
  }>;
  delayReasons: Record<string, number>;
  mlPredictions: Array<{
    projectName: string;
    predictedDelay: number;
    predictedCost: number;
    confidence: number;
    riskLevel: string;
  }>;
  aiRecommendations: string[];
  summary: {
    totalProjects: number;
    averageProgress: string;
    projectsAtRisk: number;
    totalPredictedDelay: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ComprehensiveCharts() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Get all projects for the selector
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Get project-specific analytics data
  const { data: riskAssessment } = useQuery({
    queryKey: ["/api/analytics/projects", selectedProjectId, "risk-assessment"],
    enabled: !!selectedProjectId,
  });

  const { data: performanceTrends } = useQuery({
    queryKey: ["/api/analytics/projects", selectedProjectId, "performance-trends"],
    enabled: !!selectedProjectId,
  });

  const { data: aiAnalysis } = useQuery({
    queryKey: ["/api/analytics/projects", selectedProjectId, "ai-analysis"],
    enabled: !!selectedProjectId,
  });

  const { data: dailyReports } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "daily-reports"],
    enabled: !!selectedProjectId,
  });

  if (projectsLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading projects...</div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return <div>No projects found</div>;
  }

  // If no project is selected, show project selector
  if (!selectedProjectId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a Project for Detailed Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a project to analyze..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name} - {project.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare progress over time data for line chart
  const progressData = dailyReports ? dailyReports.map((report, index) => {
    const reportDate = new Date(report.reportDate);
    const startDate = new Date(selectedProject?.startDate || '');
    const endDate = new Date(selectedProject?.endDate || '');
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((reportDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

    return {
      date: report.reportDate,
      expectedProgress: expectedProgress.toFixed(1),
      actualProgress: parseFloat(report.progressPercentage || "0"),
      extraBudget: parseFloat(report.extraBudgetUsed || "0")
    };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];

  return (
    <div className="space-y-6">
      {/* Project Header with Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{selectedProject?.name} Analytics</h2>
          <p className="text-muted-foreground">{selectedProject?.location} • {selectedProject?.status}</p>
        </div>
        <Select value={selectedProjectId?.toString()} onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name} - {project.location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards for Selected Project */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Progress</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{selectedProject?.currentProgress || 0}%</div>
            <Progress value={parseFloat(selectedProject?.currentProgress || "0")} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{riskAssessment?.riskLevel || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground">
              Risk Score: {riskAssessment?.riskScore || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted Delay</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {aiAnalysis?.analysis?.estimatedDelayDays?.toFixed(1) || 0} days
            </div>
            <p className="text-xs text-muted-foreground">
              ML confidence: {aiAnalysis?.analysis?.confidenceLevel || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(parseFloat(selectedProject?.totalBudget || "0"))}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyReports?.length || 0} reports submitted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress Overview - Enhanced Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progress Overview & Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressData.length > 0 ? (
              <div className="space-y-6">
                {/* Progress Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {progressData[progressData.length - 1]?.actualProgress || 0}%
                    </div>
                    <p className="text-sm text-blue-600 font-medium">Current Progress</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {progressData[progressData.length - 1]?.expectedProgress || 0}%
                    </div>
                    <p className="text-sm text-green-600 font-medium">Expected Progress</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {(parseFloat(progressData[progressData.length - 1]?.actualProgress || "0") -
                        parseFloat(progressData[progressData.length - 1]?.expectedProgress || "0")).toFixed(1)}%
                    </div>
                    <p className="text-sm text-purple-600 font-medium">Variance</p>
                  </div>
                </div>

                {/* Enhanced Area Chart */}
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="expectedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      fontSize={12}
                      stroke="#64748b"
                    />
                    <YAxis domain={[0, 100]} fontSize={12} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelFormatter={(value) => `📅 ${new Date(value).toLocaleDateString()}`}
                      formatter={(value, name) => [
                        `${value}%`,
                        name === 'expectedProgress' ? '🎯 Expected' : '📈 Actual'
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="expectedProgress"
                      stroke="#94a3b8"
                      strokeWidth={3}
                      strokeDasharray="8 4"
                      name="Expected Progress"
                      dot={{ fill: '#94a3b8', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, fill: '#94a3b8' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actualProgress"
                      stroke="#3b82f6"
                      strokeWidth={4}
                      name="Actual Progress"
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 7 }}
                      activeDot={{ r: 9, fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Calendar className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No Progress Data Yet</p>
                <p className="text-sm">Submit your first DPR to start tracking progress</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Analysis Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Analysis & Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressData.length > 0 ? (
              <div className="space-y-6">
                {/* Budget Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Total Budget</p>
                        <p className="text-2xl font-bold text-green-800">
                          {formatCurrency(parseFloat(selectedProject?.totalBudget || "0"))}
                        </p>
                      </div>
                      <div className="p-2 bg-green-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-700">Extra Budget Used</p>
                        <p className="text-2xl font-bold text-red-800">
                          {formatCurrency(progressData.reduce((sum, item) => sum + item.extraBudget, 0))}
                        </p>
                      </div>
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Budget Usage Timeline */}
                {progressData.some(item => item.extraBudget > 0) ? (
                  <div>
                    <h4 className="font-medium mb-3">Extra Budget Usage Timeline</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={progressData.filter(item => item.extraBudget > 0)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          fontSize={12}
                          stroke="#64748b"
                        />
                        <YAxis
                          tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                          fontSize={12}
                          stroke="#64748b"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelFormatter={(value) => `📅 ${new Date(value).toLocaleDateString()}`}
                          formatter={(value) => [`💰 ${formatCurrency(Number(value))}`, 'Extra Budget']}
                        />
                        <Bar
                          dataKey="extraBudget"
                          fill="url(#budgetGradient)"
                          name="Extra Budget Used"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-lg font-medium text-green-800">Great Budget Control!</p>
                    <p className="text-sm text-green-600">No extra budget used so far</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <DollarSign className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No Budget Data Yet</p>
                <p className="text-sm">Submit DPRs to track budget usage</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskAssessment ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Risk Level:</span>
                  <Badge variant={
                    riskAssessment.riskLevel === 'CRITICAL' ? 'destructive' :
                    riskAssessment.riskLevel === 'HIGH' ? 'destructive' :
                    riskAssessment.riskLevel === 'MEDIUM' ? 'default' : 'secondary'
                  }>
                    {riskAssessment.riskLevel}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Risk Score:</span>
                  <span className="text-2xl font-bold">{riskAssessment.riskScore}/100</span>
                </div>
                <Progress value={riskAssessment.riskScore} className="mt-2" />

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Risk Factors:</h4>
                  <ul className="space-y-1">
                    {riskAssessment.riskFactors?.map((factor, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Loading risk assessment...
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI-Powered Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiAnalysis ? (
              <div className="space-y-4">
                {/* ML Prediction Summary (Actually AI) */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">ML Predictions</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Predicted Delay:</span>
                      <span className="ml-2 text-blue-600">
                        {aiAnalysis.analysis.estimatedDelayDays?.toFixed(1)} days
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span>
                      <span className="ml-2 text-blue-600">
                        {aiAnalysis.analysis.confidenceLevel}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                {aiAnalysis.analysis?.ai_analysis?.action_plan && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Immediate Actions:</h4>
                    {aiAnalysis.analysis.ai_analysis.action_plan.immediate_actions?.map((action, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-sm text-green-800">{action}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Loading AI analysis...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends Summary */}
      {performanceTrends && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{performanceTrends.performanceScore}</div>
                <p className="text-sm text-muted-foreground">Performance Score</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{performanceTrends.summary?.averageVelocity}</div>
                <p className="text-sm text-muted-foreground">Avg Velocity (%/day)</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{performanceTrends.summary?.averageQuality}</div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{performanceTrends.summary?.trendDirection}</div>
                <p className="text-sm text-muted-foreground">Trend Direction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
