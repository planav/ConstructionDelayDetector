import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  HardHat, 
  Play, 
  AlertTriangle, 
  DollarSign, 
  LineChart, 
  BarChart3, 
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Legend
} from "recharts";
import type { Project, ProjectWithRelations } from "@shared/schema";

export default function Charts() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

  const { data: progressData } = useQuery({
    queryKey: ["/api/analytics/projects", selectedProjectId, "progress"],
    enabled: !!selectedProjectId,
  });

  const { data: delayData } = useQuery({
    queryKey: ["/api/analytics/projects", selectedProjectId, "delays"],
    enabled: !!selectedProjectId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "status-on-track";
      case "delayed":
        return "status-delayed";
      case "critical":
        return "status-critical";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "On Track";
      case "delayed":
        return "Delayed";
      case "critical":
        return "Critical";
      default:
        return status;
    }
  };

  // Mock budget data for charts
  const budgetData = [
    { name: "Human Resources", budgeted: 450000, actual: 420000 },
    { name: "Materials", budgeted: 1200000, actual: 1350000 },
    { name: "Equipment", budgeted: 200000, actual: 180000 },
    { name: "Miscellaneous", budgeted: 100000, actual: 90000 },
  ];

  // Transform delay data for pie chart
  const delayChartData = delayData ? Object.entries(delayData).map(([reason, count]) => ({
    name: reason,
    value: count as number,
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`
  })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.totalProjects || 0}
                </p>
              </div>
              <div className="bg-blue-500 text-white p-3 rounded-full">
                <HardHat className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.activeProjects || 0}
                </p>
              </div>
              <div className="bg-green-500 text-white p-3 rounded-full">
                <Play className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delayed Projects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.delayedProjects || 0}
                </p>
              </div>
              <div className="bg-yellow-500 text-white p-3 rounded-full">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics?.totalBudget?.toLocaleString() || "0"}
                </p>
              </div>
              <div className="bg-red-500 text-white p-3 rounded-full">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Project Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select a project to analyze" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="mr-2 h-5 w-5" />
              Project Progress Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {progressData && progressData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [`${value}%`, "Progress"]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="#4CAF50" 
                      strokeWidth={2}
                      dot={{ fill: "#4CAF50", strokeWidth: 2, r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a project to view progress data</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Budget Usage vs Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="budgeted" fill="#1976D2" name="Budgeted" />
                  <Bar dataKey="actual" fill="#FF9800" name="Actual" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delay Analysis and AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delay Reasons Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Delay Reasons Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {delayChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={delayChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {delayChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No delay data available</p>
                    <p className="text-sm">Select a project with delay history</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Pattern Analysis
                </h4>
                <p className="text-sm text-blue-700">
                  Weather-related delays are 40% higher on Mondays. Consider adjusting work schedules for optimal productivity.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Resource Optimization
                </h4>
                <p className="text-sm text-green-700">
                  Material usage efficiency has improved by 15% this month. Continue current procurement strategies.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Risk Alert
                </h4>
                <p className="text-sm text-yellow-700">
                  {analytics?.delayedProjects || 0} projects are approaching critical delay threshold. Immediate action required.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timeline
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {project.location}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{parseFloat(project.currentProgress)}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <Progress value={parseFloat(project.currentProgress)} className="h-2" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(project.totalBudget).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <HardHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No projects found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
