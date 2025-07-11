import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema } from "@shared/schema";
import { Plus, X } from "lucide-react";
import { z } from "zod";
import type { ProjectWithRelations } from "@shared/schema";

type FormData = z.infer<typeof insertProjectSchema>;

interface Resource {
  id: number;
  name: string;
  value1: string;
  value2: string;
  value3?: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface ProjectEditFormProps {
  projectId: number;
  onCancel: () => void;
}

export default function ProjectEditForm({ projectId, onCancel }: ProjectEditFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [humanResources, setHumanResources] = useState<Resource[]>([]);
  const [materials, setMaterials] = useState<Resource[]>([]);
  const [equipment, setEquipment] = useState<Resource[]>([]);
  const [miscItems, setMiscItems] = useState<Resource[]>([]);

  const { data: project, isLoading, error } = useQuery<ProjectWithRelations>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      location: "",
      startDate: "",
      endDate: "",
      workingDaysPerMonth: 22,
      countryCalendar: "",
      humanResourceBudget: "0",
      materialBudget: "0",
      equipmentBudget: "0",
      miscellaneousBudget: "0",
      totalBudget: "0",
      currentProgress: "0",
      status: "active",
    },
  });

  // Load project data when available
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        location: project.location,
        startDate: project.startDate,
        endDate: project.endDate,
        workingDaysPerMonth: project.workingDaysPerMonth,
        countryCalendar: project.countryCalendar,
        humanResourceBudget: project.humanResourceBudget,
        materialBudget: project.materialBudget,
        equipmentBudget: project.equipmentBudget,
        miscellaneousBudget: project.miscellaneousBudget,
        totalBudget: project.totalBudget,
        currentProgress: project.currentProgress,
        status: project.status,
      });

      // Load existing resources
      setHumanResources(
        project.humanResources.map((hr) => ({
          id: hr.id,
          name: hr.roleName,
          value1: hr.numberOfWorkers.toString(),
          value2: hr.dailyCostPerWorker,
        }))
      );

      setMaterials(
        project.materials.map((material) => ({
          id: material.id,
          name: material.name,
          value1: material.totalQuantity,
          value2: material.costPerUnit,
        }))
      );

      setEquipment(
        project.equipment.map((eq) => ({
          id: eq.id,
          name: eq.name,
          value1: eq.numberOfUnits.toString(),
          value2: eq.rentalCostPerDay,
        }))
      );

      setMiscItems(
        project.miscellaneousItems.map((misc) => ({
          id: misc.id,
          name: misc.category,
          value1: misc.amount,
        }))
      );
    }
  }, [project, form]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Update the project first
      const projectResponse = await apiRequest("PUT", `/api/projects/${projectId}`, data);
      const updatedProject = await projectResponse.json();

      // Handle resource updates
      const promises = [];

      // Handle human resources
      for (const hr of humanResources) {
        if (hr.isDeleted && !hr.isNew) {
          promises.push(apiRequest("DELETE", `/api/human-resources/${hr.id}`));
        } else if (hr.isNew && !hr.isDeleted && hr.name && hr.value1 && hr.value2) {
          promises.push(
            apiRequest("POST", `/api/projects/${projectId}/human-resources`, {
              roleName: hr.name,
              numberOfWorkers: parseInt(hr.value1) || 0,
              dailyCostPerWorker: hr.value2,
            })
          );
        } else if (!hr.isNew && !hr.isDeleted && hr.name && hr.value1 && hr.value2) {
          promises.push(
            apiRequest("PUT", `/api/human-resources/${hr.id}`, {
              roleName: hr.name,
              numberOfWorkers: parseInt(hr.value1) || 0,
              dailyCostPerWorker: hr.value2,
            })
          );
        }
      }

      // Handle materials
      for (const material of materials) {
        if (material.isDeleted && !material.isNew) {
          promises.push(apiRequest("DELETE", `/api/materials/${material.id}`));
        } else if (material.isNew && !material.isDeleted && material.name && material.value1 && material.value2) {
          promises.push(
            apiRequest("POST", `/api/projects/${projectId}/materials`, {
              name: material.name,
              totalQuantity: material.value1,
              costPerUnit: material.value2,
            })
          );
        } else if (!material.isNew && !material.isDeleted && material.name && material.value1 && material.value2) {
          promises.push(
            apiRequest("PUT", `/api/materials/${material.id}`, {
              name: material.name,
              totalQuantity: material.value1,
              costPerUnit: material.value2,
            })
          );
        }
      }

      // Handle equipment
      for (const eq of equipment) {
        if (eq.isDeleted && !eq.isNew) {
          promises.push(apiRequest("DELETE", `/api/equipment/${eq.id}`));
        } else if (eq.isNew && !eq.isDeleted && eq.name && eq.value1 && eq.value2) {
          promises.push(
            apiRequest("POST", `/api/projects/${projectId}/equipment`, {
              name: eq.name,
              numberOfUnits: parseInt(eq.value1) || 0,
              rentalCostPerDay: eq.value2,
            })
          );
        } else if (!eq.isNew && !eq.isDeleted && eq.name && eq.value1 && eq.value2) {
          promises.push(
            apiRequest("PUT", `/api/equipment/${eq.id}`, {
              name: eq.name,
              numberOfUnits: parseInt(eq.value1) || 0,
              rentalCostPerDay: eq.value2,
            })
          );
        }
      }

      // Handle miscellaneous items
      for (const misc of miscItems) {
        if (misc.isDeleted && !misc.isNew) {
          promises.push(apiRequest("DELETE", `/api/miscellaneous-items/${misc.id}`));
        } else if (misc.isNew && !misc.isDeleted && misc.name && misc.value1) {
          promises.push(
            apiRequest("POST", `/api/projects/${projectId}/miscellaneous-items`, {
              category: misc.name,
              amount: misc.value1,
            })
          );
        } else if (!misc.isNew && !misc.isDeleted && misc.name && misc.value1) {
          promises.push(
            apiRequest("PUT", `/api/miscellaneous-items/${misc.id}`, {
              category: misc.name,
              amount: misc.value1,
            })
          );
        }
      }

      // Wait for all resource updates to complete
      await Promise.all(promises);

      return updatedProject;
    },
    onSuccess: (project) => {
      toast({
        title: "Project Updated",
        description: `${project.name} has been updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      onCancel();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addResource = (type: string) => {
    const newId = Date.now(); // Temporary ID for new resources
    const newResource: Resource = {
      id: newId,
      name: "",
      value1: "",
      value2: "",
      isNew: true,
    };

    switch (type) {
      case "human":
        setHumanResources([...humanResources, newResource]);
        break;
      case "material":
        setMaterials([...materials, newResource]);
        break;
      case "equipment":
        setEquipment([...equipment, newResource]);
        break;
      case "misc":
        setMiscItems([...miscItems, newResource]);
        break;
    }
  };

  const removeResource = (type: string, id: number) => {
    switch (type) {
      case "human":
        setHumanResources(humanResources.map(hr => 
          hr.id === id ? { ...hr, isDeleted: true } : hr
        ).filter(hr => !(hr.isNew && hr.isDeleted)));
        break;
      case "material":
        setMaterials(materials.map(m => 
          m.id === id ? { ...m, isDeleted: true } : m
        ).filter(m => !(m.isNew && m.isDeleted)));
        break;
      case "equipment":
        setEquipment(equipment.map(eq => 
          eq.id === id ? { ...eq, isDeleted: true } : eq
        ).filter(eq => !(eq.isNew && eq.isDeleted)));
        break;
      case "misc":
        setMiscItems(miscItems.map(misc => 
          misc.id === id ? { ...misc, isDeleted: true } : misc
        ).filter(misc => !(misc.isNew && misc.isDeleted)));
        break;
    }
  };

  const updateResource = (type: string, id: number, field: string, value: string) => {
    switch (type) {
      case "human":
        setHumanResources(humanResources.map(hr => 
          hr.id === id ? { ...hr, [field]: value } : hr
        ));
        break;
      case "material":
        setMaterials(materials.map(m => 
          m.id === id ? { ...m, [field]: value } : m
        ));
        break;
      case "equipment":
        setEquipment(equipment.map(eq => 
          eq.id === id ? { ...eq, [field]: value } : eq
        ));
        break;
      case "misc":
        setMiscItems(miscItems.map(misc => 
          misc.id === id ? { ...misc, [field]: value } : misc
        ));
        break;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading project...</span>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-500">Project not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Project: {project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((data) => updateProjectMutation.mutate(data))} className="space-y-6">
          {/* Basic Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...form.register("location")}
                placeholder="Enter project location"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...form.register("endDate")}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="workingDaysPerMonth">Working Days per Month</Label>
              <Input
                id="workingDaysPerMonth"
                type="number"
                {...form.register("workingDaysPerMonth", { valueAsNumber: true })}
                placeholder="22"
              />
            </div>
            <div>
              <Label htmlFor="countryCalendar">Country Calendar</Label>
              <Input
                value={project?.countryCalendar || ""}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
                placeholder="Country calendar (read-only)"
              />
            </div>
          </div>

          {/* Budget Display (Read-only) */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview (Auto-calculated)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Human Resources Budget</Label>
                <Input value={`$${project.humanResourceBudget}`} readOnly className="bg-gray-100" />
              </div>
              <div>
                <Label>Materials Budget</Label>
                <Input value={`$${project.materialBudget}`} readOnly className="bg-gray-100" />
              </div>
              <div>
                <Label>Equipment Budget</Label>
                <Input value={`$${project.equipmentBudget}`} readOnly className="bg-gray-100" />
              </div>
              <div>
                <Label>Miscellaneous Budget</Label>
                <Input
                  type="number"
                  {...form.register("miscellaneousBudget")}
                  placeholder="Enter miscellaneous budget"
                />
              </div>
            </div>
          </div>

          {/* Human Resources Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Human Resources</h4>
              <Button
                type="button"
                onClick={() => addResource("human")}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Human Resource
              </Button>
            </div>
            <div className="space-y-4">
              {humanResources.filter(hr => !hr.isDeleted).map((hr) => (
                <div key={hr.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Role Name</Label>
                    <Input
                      placeholder="e.g., Site Engineer"
                      value={hr.name}
                      onChange={(e) => updateResource("human", hr.id, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Number of Workers</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={hr.value1}
                      onChange={(e) => updateResource("human", hr.id, "value1", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Daily Cost per Worker ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="150.00"
                      value={hr.value2}
                      onChange={(e) => updateResource("human", hr.id, "value2", e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeResource("human", hr.id)}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Materials Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Materials</h4>
              <Button
                type="button"
                onClick={() => addResource("material")}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </div>
            <div className="space-y-4">
              {materials.filter(m => !m.isDeleted).map((material) => (
                <div key={material.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Material Name</Label>
                    <Input
                      placeholder="e.g., Cement, Steel"
                      value={material.name}
                      onChange={(e) => updateResource("material", material.id, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Total Quantity</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1000"
                      value={material.value1}
                      onChange={(e) => updateResource("material", material.id, "value1", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Cost per Unit ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="25.00"
                      value={material.value2}
                      onChange={(e) => updateResource("material", material.id, "value2", e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeResource("material", material.id)}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Equipment</h4>
              <Button
                type="button"
                onClick={() => addResource("equipment")}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            </div>
            <div className="space-y-4">
              {equipment.filter(eq => !eq.isDeleted).map((eq) => (
                <div key={eq.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Equipment Name</Label>
                    <Input
                      placeholder="e.g., Crane, Bulldozer"
                      value={eq.name}
                      onChange={(e) => updateResource("equipment", eq.id, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Number of Units</Label>
                    <Input
                      type="number"
                      placeholder="2"
                      value={eq.value1}
                      onChange={(e) => updateResource("equipment", eq.id, "value1", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Rental Cost per Day ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="500.00"
                      value={eq.value2}
                      onChange={(e) => updateResource("equipment", eq.id, "value2", e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeResource("equipment", eq.id)}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProjectMutation.isPending}
            >
              {updateProjectMutation.isPending ? "Updating..." : "Update Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
