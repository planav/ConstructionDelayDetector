import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HardHat, Play, AlertTriangle, DollarSign } from "lucide-react";
import type { Project } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
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

  const getProgressBarColor = (progress: number) => {
    if (progress >= 80) return "progress-bar-success";
    if (progress >= 50) return "progress-bar-warning";
    return "progress-bar-error";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="space-y-6">
            {/* Analytics Overview */}
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

            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading projects...</p>
                  </div>
                ) : projects && projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            {project.name}
                          </h4>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status === "active" && "On Track"}
                            {project.status === "delayed" && "Delayed"}
                            {project.status === "critical" && "Critical"}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="w-4 mr-2">📍</span>
                            <span>{project.location}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-4 mr-2">📅</span>
                            <span>
                              {new Date(project.startDate).toLocaleDateString()} -{" "}
                              {new Date(project.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-4 mr-2">💰</span>
                            <span>${parseFloat(project.totalBudget).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{parseFloat(project.currentProgress)}%</span>
                          </div>
                          <Progress 
                            value={parseFloat(project.currentProgress)} 
                            className="h-2"
                          />
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Button
                            onClick={() => navigate(`/projects?edit=${project.id}`)}
                            className="flex-1"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => navigate(`/analytics?project=${project.id}`)}
                            variant="secondary"
                            className="flex-1"
                            size="sm"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <HardHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No projects found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Create your first project to get started
                    </p>
                    <Button
                      onClick={() => navigate("/projects")}
                      className="mt-4"
                    >
                      Create Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
