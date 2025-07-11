import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, DollarSign, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface DPRHistoryProps {
  projectId: number;
}

interface DailyReport {
  id: number;
  reportDate: string;
  progressPercentage: string;
  extraBudgetUsed: string;
  extraBudgetReason: string | null;
  weatherData: any;
  resourceUsage: any;
  aiAnalysis: any;
  createdAt: string;
}

export function DPRHistory({ projectId }: DPRHistoryProps) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/daily-reports`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.sort((a: DailyReport, b: DailyReport) => 
          new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
        ));
      }
    } catch (error) {
      console.error("Error fetching DPR history:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (reportId: number) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            DPR History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading DPR history...</div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            DPR History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No daily reports submitted yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          DPR History ({reports.length} reports)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-semibold">
                      {format(new Date(report.reportDate), "MMMM dd, yyyy")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Submitted {format(new Date(report.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {report.progressPercentage}% Progress
                  </Badge>
                  {parseFloat(report.extraBudgetUsed) > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(report.extraBudgetUsed)} Extra
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(report.id)}
                  className="flex items-center gap-2"
                >
                  {expandedReport === report.id ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      View Details
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            {expandedReport === report.id && (
              <CardContent className="pt-0 space-y-6">
                {/* Weather Data */}
                {report.weatherData && (
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      🌤️ Weather Conditions
                    </h5>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Temperature:</span> {report.weatherData.temperature}°F
                        </div>
                        <div>
                          <span className="font-medium">Condition:</span> {report.weatherData.condition}
                        </div>
                        <div>
                          <span className="font-medium">Description:</span> {report.weatherData.description}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resource Usage */}
                {report.resourceUsage && Array.isArray(report.resourceUsage) && report.resourceUsage.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      🔧 Resource Usage
                    </h5>
                    <div className="space-y-2">
                      {report.resourceUsage.map((resource: any, index: number) => (
                        <div key={index} className="bg-muted p-3 rounded-lg">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Resource:</span> {resource.name}
                            </div>
                            <div>
                              <span className="font-medium">Required:</span> {resource.required}
                            </div>
                            <div>
                              <span className="font-medium">Available:</span> {resource.available}
                            </div>
                            <div>
                              <span className="font-medium">Utilization:</span> 
                              <Badge variant={
                                parseFloat(resource.available) >= parseFloat(resource.required) 
                                  ? "default" 
                                  : "destructive"
                              } className="ml-2">
                                {((parseFloat(resource.available) / parseFloat(resource.required)) * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extra Budget */}
                {parseFloat(report.extraBudgetUsed) > 0 && (
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Extra Budget Used
                    </h5>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-red-800">Amount:</span>
                        <span className="text-red-600 font-semibold">
                          {formatCurrency(report.extraBudgetUsed)}
                        </span>
                      </div>
                      {report.extraBudgetReason && (
                        <div>
                          <span className="font-medium text-red-800">Reason:</span>
                          <p className="text-red-700 mt-1">{report.extraBudgetReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {report.aiAnalysis && (
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      🤖 AI Analysis & Predictions
                    </h5>
                    <div className="space-y-4">
                      {/* ML Predictions */}
                      {report.aiAnalysis.ml_prediction && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <h6 className="font-medium text-blue-800 mb-2">ML Predictions</h6>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Predicted Delay:</span>
                              <span className="ml-2 text-blue-600">
                                {report.aiAnalysis.ml_prediction.predicted_delay_days} days
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Confidence:</span>
                              <span className="ml-2 text-blue-600">
                                {report.aiAnalysis.ml_prediction.confidence_percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Recommendations */}
                      {report.aiAnalysis.ai_analysis?.action_plan && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                          <h6 className="font-medium text-green-800 mb-2">AI Recommendations</h6>
                          
                          {report.aiAnalysis.ai_analysis.action_plan.immediate_actions && (
                            <div className="mb-3">
                              <span className="font-medium text-green-700">Immediate Actions:</span>
                              <ul className="list-disc list-inside mt-1 text-sm text-green-600">
                                {report.aiAnalysis.ai_analysis.action_plan.immediate_actions.map((action: string, index: number) => (
                                  <li key={index}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {report.aiAnalysis.ai_analysis.action_plan.short_term_strategies && (
                            <div>
                              <span className="font-medium text-green-700">Short-term Strategies:</span>
                              <ul className="list-disc list-inside mt-1 text-sm text-green-600">
                                {report.aiAnalysis.ai_analysis.action_plan.short_term_strategies.map((strategy: string, index: number) => (
                                  <li key={index}>{strategy}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
