import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDailyProjectReportSchema } from "@shared/schema";
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Eye, AlertCircle, DollarSign, Plus, X } from "lucide-react";
import { z } from "zod";
import type { Project, ProjectWithRelations } from "@shared/schema";

type FormData = z.infer<typeof insertDailyProjectReportSchema>;

interface ResourceUsage {
  resourceId: number;
  type: string;
  name: string;
  required: string;
  available: string;
  used: boolean;
}

interface DPRFormProps {
  onProjectSelect?: (projectId: number) => void;
}

export default function DPRForm({ onProjectSelect }: DPRFormProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [showResourceForm, setShowResourceForm] = useState(false);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: selectedProject } = useQuery<ProjectWithRelations>({
    queryKey: ["/api/projects", selectedProjectId],
    enabled: !!selectedProjectId,
  });

  // Check for existing reports for the selected date
  const { data: existingReports } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "daily-reports"],
    enabled: !!selectedProjectId,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertDailyProjectReportSchema.refine(
      (data) => {
        // Check if report date is not before project start date
        if (selectedProject && data.reportDate) {
          const reportDate = new Date(data.reportDate);
          const projectStartDate = new Date(selectedProject.startDate);
          if (reportDate < projectStartDate) {
            return false;
          }
        }

        // Check if report for this date already exists
        if (existingReports && data.reportDate) {
          const reportExists = existingReports.some((report: any) =>
            report.reportDate === data.reportDate
          );
          if (reportExists) {
            return false;
          }
        }

        return true;
      },
      (data) => {
        if (selectedProject && data.reportDate) {
          const reportDate = new Date(data.reportDate);
          const projectStartDate = new Date(selectedProject.startDate);
          if (reportDate < projectStartDate) {
            return {
              message: `Report date cannot be before project start date (${selectedProject.startDate})`,
              path: ["reportDate"],
            };
          }
        }

        if (existingReports && data.reportDate) {
          const reportExists = existingReports.some((report: any) =>
            report.reportDate === data.reportDate
          );
          if (reportExists) {
            return {
              message: "A report for this date already exists",
              path: ["reportDate"],
            };
          }
        }

        return { message: "Invalid date", path: ["reportDate"] };
      }
    )),
    defaultValues: {
      projectId: 0,
      reportDate: new Date().toISOString().split('T')[0],
      progressPercentage: "0",
      extraBudgetUsed: "0",
      extraBudgetReason: "",
      resourceUsage: [],
      weatherData: null,
      aiAnalysis: null,
    },
  });

  const weatherQuery = useQuery({
    queryKey: ["/api/weather", selectedProject?.location],
    enabled: !!selectedProject?.location,
  });

  const createDPRMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Convert resource usage string values to numbers for API
      const processedResourceUsage = resourceUsage.map(resource => ({
        ...resource,
        required: parseFloat(resource.required) || 0,
        available: parseFloat(resource.available) || 0,
      }));

      const response = await apiRequest("POST", `/api/projects/${selectedProjectId}/daily-reports`, {
        ...data,
        resourceUsage: processedResourceUsage,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "DPR Submitted",
        description: "Daily Project Report has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "daily-reports"] });
      form.reset();
      setResourceUsage([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit DPR. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProjectChange = (projectId: string) => {
    const id = parseInt(projectId);
    setSelectedProjectId(id);
    form.setValue("projectId", id);
    setResourceUsage([]);
    setShowResourceForm(false);
    onProjectSelect?.(id);
  };

  const initializeResourceUsage = () => {
    if (!selectedProject) {
      toast({
        title: "No Project Selected",
        description: "Please select a project first.",
        variant: "destructive",
      });
      return;
    }

    // Load all resources from the selected project
    const allResources: ResourceUsage[] = [];

    // Add human resources
    selectedProject.humanResources.forEach((hr) => {
      allResources.push({
        resourceId: hr.id,
        type: "human",
        name: hr.roleName,
        required: "",
        available: "",
        used: false,
      });
    });

    // Add materials
    selectedProject.materials.forEach((material) => {
      allResources.push({
        resourceId: material.id,
        type: "material",
        name: material.name,
        required: "",
        available: "",
        used: false,
      });
    });

    // Add equipment
    selectedProject.equipment.forEach((eq) => {
      allResources.push({
        resourceId: eq.id,
        type: "equipment",
        name: eq.name,
        required: "",
        available: "",
        used: false,
      });
    });

    if (allResources.length === 0) {
      toast({
        title: "No Resources Available",
        description: "No resources available. Please edit the project and add them first.",
        variant: "destructive",
      });
      return;
    }

    setResourceUsage(allResources);
    setShowResourceForm(true);

    toast({
      title: "Resources Loaded",
      description: `Loaded ${allResources.length} resources from the project.`,
    });
  };

  const removeResourceRow = (index: number) => {
    const updated = resourceUsage.filter((_, i) => i !== index);
    setResourceUsage(updated);
  };

  const updateResourceUsage = (index: number, field: string, value: any) => {
    const updated = [...resourceUsage];
    updated[index] = { ...updated[index], [field]: value };
    setResourceUsage(updated);
  };

  const onSubmit = (data: FormData) => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project first.",
        variant: "destructive",
      });
      return;
    }

    createDPRMutation.mutate(data);
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case "clear":
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case "clouds":
      case "cloudy":
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case "rain":
      case "drizzle":
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case "snow":
        return <CloudSnow className="h-8 w-8 text-blue-300" />;
      case "mist":
      case "fog":
      case "haze":
        return <Eye className="h-8 w-8 text-gray-400" />;
      case "thunderstorm":
        return <CloudRain className="h-8 w-8 text-purple-600" />;
      case "wind":
        return <Wind className="h-8 w-8 text-gray-600" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Project Report</CardTitle>
        <p className="text-sm text-gray-600">
          Submit daily progress and resource usage for your project
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="project">Select Project</Label>
              <Select onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
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
            <div>
              <Label htmlFor="reportDate">Report Date</Label>
              <Input
                id="reportDate"
                type="date"
                {...form.register("reportDate")}
              />
              {form.formState.errors.reportDate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.reportDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Location & Weather */}
          {selectedProject && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Location & Weather
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Project Location</Label>
                  <Input value={selectedProject.location} readOnly />
                </div>
                <div>
                  <Label>Weather Conditions</Label>
                  {weatherQuery.isLoading ? (
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Loading weather...</span>
                    </div>
                  ) : weatherQuery.error ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-red-600 text-sm">
                        Unable to load weather data
                      </div>
                    </div>
                  ) : weatherQuery.data ? (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getWeatherIcon(weatherQuery.data.condition)}
                          <div>
                            <div className="font-semibold text-gray-900 text-lg">
                              {weatherQuery.data.temperature}°F
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              {weatherQuery.data.description}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            <div>Humidity: {weatherQuery.data.humidity}%</div>
                            <div>Wind: {weatherQuery.data.windSpeed} mph</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-600 text-sm">
                        Weather data not available
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resource Usage Tracking */}
          {selectedProject && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Resource Usage</h4>
                {!showResourceForm && resourceUsage.length === 0 && (
                  <Button
                    type="button"
                    onClick={initializeResourceUsage}
                    variant="outline"
                  >
                    Initialize Resources
                  </Button>
                )}
              </div>

              {/* Resource Loading Status */}
              {showResourceForm && resourceUsage.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p>Loading resources...</p>
                </div>
              )}

              {/* Selected Resources Display */}
              {resourceUsage.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h5 className="text-md font-medium text-gray-700">Today's Resource Usage</h5>
                  
                  {resourceUsage.map((resource, index) => (
                    <div key={`${resource.type}-${resource.resourceId}`} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {resource.type} (ID: {resource.resourceId})
                          </span>
                          <span className="font-medium text-gray-900">{resource.name}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600">Required Today</Label>
                        <Input
                          type="number"
                          value={resource.required}
                          onChange={(e) => updateResourceUsage(index, "required", e.target.value)}
                          className="text-sm"
                          placeholder="Enter quantity"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">Available Today</Label>
                        <Input
                          type="number"
                          value={resource.available}
                          onChange={(e) => updateResourceUsage(index, "available", e.target.value)}
                          className="text-sm"
                          placeholder="Enter quantity"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={resource.used}
                            onCheckedChange={(checked) => updateResourceUsage(index, "used", checked)}
                          />
                          <Label className="text-sm text-gray-600">Used Today</Label>
                        </div>
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeResourceRow(index)}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Project Progress */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Project Progress</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="progressPercentage">Today's Progress (%)</Label>
                <Input
                  id="progressPercentage"
                  type="number"
                  step="0.1"
                  {...form.register("progressPercentage")}
                  placeholder="2.5"
                />
              </div>
              <div>
                <Label htmlFor="currentProgress">Overall Progress (%)</Label>
                <Input
                  id="currentProgress"
                  type="number"
                  value={
                    selectedProject
                      ? Math.min(100, parseFloat(selectedProject.currentProgress || "0") + parseFloat(form.watch("progressPercentage") || "0"))
                      : 0
                  }
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Budget Usage */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Budget Usage</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="extraBudgetUsed">Extra Budget Used Today ($)</Label>
                <Input
                  id="extraBudgetUsed"
                  type="number"
                  step="0.01"
                  {...form.register("extraBudgetUsed")}
                  placeholder="500"
                />
              </div>
              <div>
                <Label htmlFor="extraBudgetReason">Reason for Extra Budget</Label>
                <Textarea
                  id="extraBudgetReason"
                  {...form.register("extraBudgetReason")}
                  placeholder="Explain the reason for additional budget usage..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* AI Analysis Preview */}
          {selectedProject && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                AI Analysis & Recommendations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h5 className="font-medium text-red-900 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Estimated Delay
                  </h5>
                  <div className="text-sm text-red-600">
                    Will be calculated after submission
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h5 className="font-medium text-orange-900 mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Cost Impact
                  </h5>
                  <div className="text-sm text-orange-600">
                    Will be calculated after submission
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Recommendations</h5>
                <div className="text-sm text-blue-700">
                  AI recommendations will be generated based on your resource usage and project data.
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline">
              Save Draft
            </Button>
            <Button 
              type="submit" 
              disabled={createDPRMutation.isPending || !selectedProjectId}
            >
              {createDPRMutation.isPending ? "Submitting..." : "Submit DPR"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
