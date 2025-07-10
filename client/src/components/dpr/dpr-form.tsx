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
import { Sun, Cloud, CloudRain, AlertCircle, DollarSign } from "lucide-react";
import { z } from "zod";
import type { Project, ProjectWithRelations } from "@shared/schema";

type FormData = z.infer<typeof insertDailyProjectReportSchema>;

interface ResourceUsage {
  type: string;
  name: string;
  required: number;
  available: number;
  used: boolean;
}

export default function DPRForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: selectedProject } = useQuery<ProjectWithRelations>({
    queryKey: ["/api/projects", selectedProjectId],
    enabled: !!selectedProjectId,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertDailyProjectReportSchema),
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
      const response = await apiRequest("POST", `/api/projects/${selectedProjectId}/daily-reports`, {
        ...data,
        resourceUsage,
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
  };

  const initializeResourceUsage = () => {
    if (!selectedProject) return;

    const usage: ResourceUsage[] = [];

    // Add human resources
    selectedProject.humanResources.forEach(hr => {
      usage.push({
        type: "human",
        name: hr.roleName,
        required: 0,
        available: 0,
        used: false,
      });
    });

    // Add materials
    selectedProject.materials.forEach(material => {
      usage.push({
        type: "material",
        name: material.name,
        required: 0,
        available: 0,
        used: false,
      });
    });

    // Add equipment
    selectedProject.equipment.forEach(eq => {
      usage.push({
        type: "equipment",
        name: eq.name,
        required: 0,
        available: 0,
        used: false,
      });
    });

    setResourceUsage(usage);
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
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case "clouds":
        return <Cloud className="h-6 w-6 text-gray-500" />;
      case "rain":
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />;
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
                  <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    {weatherQuery.data && getWeatherIcon(weatherQuery.data.condition)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {weatherQuery.data?.condition || "Loading..."}
                      </div>
                      <div className="text-sm text-gray-600">
                        {weatherQuery.data?.temperature || "--"}°F,{" "}
                        {weatherQuery.data?.description || "Loading weather..."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resource Usage Tracking */}
          {selectedProject && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Resource Usage</h4>
                {resourceUsage.length === 0 && (
                  <Button
                    type="button"
                    onClick={initializeResourceUsage}
                    variant="outline"
                  >
                    Initialize Resources
                  </Button>
                )}
              </div>

              {resourceUsage.length > 0 && (
                <div className="space-y-6">
                  {/* Human Resources */}
                  <div>
                    <h5 className="text-md font-medium text-gray-700 mb-3">Human Resources</h5>
                    <div className="space-y-3">
                      {resourceUsage
                        .filter(r => r.type === "human")
                        .map((resource, index) => {
                          const actualIndex = resourceUsage.findIndex(r => r === resource);
                          return (
                            <div key={actualIndex} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium text-gray-900">{resource.name}</div>
                              <div>
                                <Label className="text-xs text-gray-600">Required Today</Label>
                                <Input
                                  type="number"
                                  value={resource.required}
                                  onChange={(e) => updateResourceUsage(actualIndex, "required", parseInt(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Available Today</Label>
                                <Input
                                  type="number"
                                  value={resource.available}
                                  onChange={(e) => updateResourceUsage(actualIndex, "available", parseInt(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={resource.used}
                                  onCheckedChange={(checked) => updateResourceUsage(actualIndex, "used", checked)}
                                />
                                <Label className="text-sm text-gray-600">Used Today</Label>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <h5 className="text-md font-medium text-gray-700 mb-3">Materials</h5>
                    <div className="space-y-3">
                      {resourceUsage
                        .filter(r => r.type === "material")
                        .map((resource, index) => {
                          const actualIndex = resourceUsage.findIndex(r => r === resource);
                          return (
                            <div key={actualIndex} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium text-gray-900">{resource.name}</div>
                              <div>
                                <Label className="text-xs text-gray-600">Required Today</Label>
                                <Input
                                  type="number"
                                  value={resource.required}
                                  onChange={(e) => updateResourceUsage(actualIndex, "required", parseInt(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Available Today</Label>
                                <Input
                                  type="number"
                                  value={resource.available}
                                  onChange={(e) => updateResourceUsage(actualIndex, "available", parseInt(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={resource.used}
                                  onCheckedChange={(checked) => updateResourceUsage(actualIndex, "used", checked)}
                                />
                                <Label className="text-sm text-gray-600">Used Today</Label>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <h5 className="text-md font-medium text-gray-700 mb-3">Equipment</h5>
                    <div className="space-y-3">
                      {resourceUsage
                        .filter(r => r.type === "equipment")
                        .map((resource, index) => {
                          const actualIndex = resourceUsage.findIndex(r => r === resource);
                          return (
                            <div key={actualIndex} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium text-gray-900">{resource.name}</div>
                              <div>
                                <Label className="text-xs text-gray-600">Required Today</Label>
                                <Input
                                  type="number"
                                  value={resource.required}
                                  onChange={(e) => updateResourceUsage(actualIndex, "required", parseInt(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Available Today</Label>
                                <Input
                                  type="number"
                                  value={resource.available}
                                  onChange={(e) => updateResourceUsage(actualIndex, "available", parseInt(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={resource.used}
                                  onCheckedChange={(checked) => updateResourceUsage(actualIndex, "used", checked)}
                                />
                                <Label className="text-sm text-gray-600">Used Today</Label>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
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
                  value={parseFloat(selectedProject?.currentProgress || "0")}
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
