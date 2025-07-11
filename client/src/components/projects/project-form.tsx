import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema } from "@shared/schema";
import { Plus, X } from "lucide-react";
import { z } from "zod";

type FormData = z.infer<typeof insertProjectSchema>;

interface Resource {
  id: string;
  name: string;
  value1: string;
  value2: string;
  value3?: string;
}

export default function ProjectForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [humanResources, setHumanResources] = useState<Resource[]>([]);
  const [materials, setMaterials] = useState<Resource[]>([]);
  const [equipment, setEquipment] = useState<Resource[]>([]);
  const [miscItems, setMiscItems] = useState<Resource[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(insertProjectSchema.refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.startDate) < new Date(data.endDate);
        }
        return true;
      },
      {
        message: "End date must be after start date",
        path: ["endDate"],
      }
    )),
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

  const createProjectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Create the project first
      const projectResponse = await apiRequest("POST", "/api/projects", data);
      const project = await projectResponse.json();

      // Create all resources for the project
      const promises = [];

      // Create human resources
      for (const hr of humanResources) {
        if (hr.name.trim() && hr.value1.trim() && hr.value2.trim() &&
            parseInt(hr.value1) > 0 && parseFloat(hr.value2) > 0) {
          promises.push(
            apiRequest("POST", `/api/projects/${project.id}/human-resources`, {
              roleName: hr.name.trim(),
              numberOfWorkers: parseInt(hr.value1),
              dailyCostPerWorker: hr.value2.trim(),
            })
          );
        }
      }

      // Create materials
      for (const material of materials) {
        if (material.name.trim() && material.value1.trim() && material.value2.trim() &&
            parseFloat(material.value1) > 0 && parseFloat(material.value2) > 0) {
          promises.push(
            apiRequest("POST", `/api/projects/${project.id}/materials`, {
              name: material.name.trim(),
              totalQuantity: material.value1.trim(),
              costPerUnit: material.value2.trim(),
            })
          );
        }
      }

      // Create equipment
      for (const eq of equipment) {
        if (eq.name.trim() && eq.value1.trim() && eq.value2.trim() &&
            parseInt(eq.value1) > 0 && parseFloat(eq.value2) > 0) {
          promises.push(
            apiRequest("POST", `/api/projects/${project.id}/equipment`, {
              name: eq.name.trim(),
              numberOfUnits: parseInt(eq.value1),
              rentalCostPerDay: eq.value2.trim(),
            })
          );
        }
      }

      // Create miscellaneous items
      for (const misc of miscItems) {
        if (misc.name.trim() && misc.value1.trim() && parseFloat(misc.value1) > 0) {
          promises.push(
            apiRequest("POST", `/api/projects/${project.id}/miscellaneous-items`, {
              category: misc.name.trim(),
              amount: misc.value1.trim(),
            })
          );
        }
      }

      // Wait for all resources to be created
      const results = await Promise.allSettled(promises);

      // Count successful and failed resource creations
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > 0) {
        console.warn(`${failed} resources failed to create out of ${results.length} total`);
      }

      return { ...project, resourceStats: { successful, failed, total: results.length } };
    },
    onSuccess: (result: any) => {
      const project = result;
      let message = `${project.name} has been created successfully.`;

      if (project.resourceStats) {
        const { successful, failed, total } = project.resourceStats;
        if (failed > 0) {
          message += ` ${successful}/${total} resources were added successfully.`;
        } else if (total > 0) {
          message += ` All ${total} resources were added successfully.`;
        }
      }

      toast({
        title: "Project Created",
        description: message,
        variant: project.resourceStats?.failed > 0 ? "default" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      form.reset();
      setHumanResources([]);
      setMaterials([]);
      setEquipment([]);
      setMiscItems([]);
    },
    onError: (error: any) => {
      console.error("Project creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addResource = (type: string) => {
    const newResource: Resource = {
      id: Date.now().toString(),
      name: "",
      value1: "",
      value2: "",
      value3: type === "humanResources" ? "" : undefined,
    };

    switch (type) {
      case "humanResources":
        setHumanResources([...humanResources, newResource]);
        break;
      case "materials":
        setMaterials([...materials, newResource]);
        break;
      case "equipment":
        setEquipment([...equipment, newResource]);
        break;
      case "miscItems":
        setMiscItems([...miscItems, newResource]);
        break;
    }
  };

  const removeResource = (type: string, id: string) => {
    switch (type) {
      case "humanResources":
        setHumanResources(humanResources.filter(r => r.id !== id));
        break;
      case "materials":
        setMaterials(materials.filter(r => r.id !== id));
        break;
      case "equipment":
        setEquipment(equipment.filter(r => r.id !== id));
        break;
      case "miscItems":
        setMiscItems(miscItems.filter(r => r.id !== id));
        break;
    }
  };

  const updateResource = (type: string, id: string, field: string, value: string) => {
    const updateArray = (resources: Resource[]) =>
      resources.map(r => r.id === id ? { ...r, [field]: value } : r);

    switch (type) {
      case "humanResources":
        setHumanResources(updateArray(humanResources));
        break;
      case "materials":
        setMaterials(updateArray(materials));
        break;
      case "equipment":
        setEquipment(updateArray(equipment));
        break;
      case "miscItems":
        setMiscItems(updateArray(miscItems));
        break;
    }
  };

  const calculateBudgets = () => {
    const hrBudget = humanResources.reduce((sum, hr) => {
      return sum + (parseFloat(hr.value1) || 0) * (parseFloat(hr.value2) || 0);
    }, 0);

    const materialBudget = materials.reduce((sum, m) => {
      return sum + (parseFloat(m.value1) || 0) * (parseFloat(m.value2) || 0);
    }, 0);

    const equipmentBudget = equipment.reduce((sum, e) => {
      return sum + (parseFloat(e.value1) || 0) * (parseFloat(e.value2) || 0);
    }, 0);

    const miscBudget = miscItems.reduce((sum, m) => {
      return sum + (parseFloat(m.value1) || 0);
    }, 0);

    const totalBudget = hrBudget + materialBudget + equipmentBudget + miscBudget;

    return {
      humanResourceBudget: hrBudget.toString(),
      materialBudget: materialBudget.toString(),
      equipmentBudget: equipmentBudget.toString(),
      miscellaneousBudget: miscBudget.toString(),
      totalBudget: totalBudget.toString(),
    };
  };

  const onSubmit = (data: FormData) => {
    const budgets = calculateBudgets();
    createProjectMutation.mutate({ ...data, ...budgets });
  };

  const budgets = calculateBudgets();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter project name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...form.register("location")}
                placeholder="Enter project location"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...form.register("endDate")}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>
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
              <Select onValueChange={(value) => form.setValue("countryCalendar", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Human Resources Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Human Resources</h4>
              <Button
                type="button"
                onClick={() => addResource("humanResources")}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </div>
            <div className="space-y-4">
              {humanResources.map((hr) => (
                <div key={hr.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Role Name</Label>
                    <Input
                      placeholder="e.g., Mason, Manager"
                      value={hr.name}
                      onChange={(e) => updateResource("humanResources", hr.id, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Number of Workers</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={hr.value1}
                      onChange={(e) => updateResource("humanResources", hr.id, "value1", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Daily Cost per Worker ($)</Label>
                    <Input
                      type="number"
                      placeholder="150"
                      value={hr.value2}
                      onChange={(e) => updateResource("humanResources", hr.id, "value2", e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeResource("humanResources", hr.id)}
                    >
                      <X className="h-4 w-4" />
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
                onClick={() => addResource("materials")}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </div>
            <div className="space-y-4">
              {materials.map((material) => (
                <div key={material.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Material Name</Label>
                    <Input
                      placeholder="e.g., Concrete, Steel"
                      value={material.name}
                      onChange={(e) => updateResource("materials", material.id, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Total Quantity (units)</Label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={material.value1}
                      onChange={(e) => updateResource("materials", material.id, "value1", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Cost per Unit ($)</Label>
                    <Input
                      type="number"
                      placeholder="25.50"
                      value={material.value2}
                      onChange={(e) => updateResource("materials", material.id, "value2", e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeResource("materials", material.id)}
                    >
                      <X className="h-4 w-4" />
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
              {equipment.map((eq) => (
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
                      placeholder="500"
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
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Miscellaneous Budget Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Miscellaneous Budget</h4>
              <Button
                type="button"
                onClick={() => addResource("miscItems")}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
            <div className="space-y-4">
              {miscItems.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Category Name</Label>
                    <Input
                      placeholder="e.g., Security, Transport"
                      value={item.name}
                      onChange={(e) => updateResource("miscItems", item.id, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={item.value1}
                      onChange={(e) => updateResource("miscItems", item.id, "value1", e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeResource("miscItems", item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Summary */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Budget Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Human Resources</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${parseFloat(budgets.humanResourceBudget).toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Materials</div>
                <div className="text-2xl font-bold text-green-900">
                  ${parseFloat(budgets.materialBudget).toLocaleString()}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Equipment</div>
                <div className="text-2xl font-bold text-purple-900">
                  ${parseFloat(budgets.equipmentBudget).toLocaleString()}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Miscellaneous</div>
                <div className="text-2xl font-bold text-orange-900">
                  ${parseFloat(budgets.miscellaneousBudget).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-500 text-white rounded-lg">
              <div className="text-center">
                <div className="text-sm font-medium">Total Project Budget</div>
                <div className="text-3xl font-bold">
                  ${parseFloat(budgets.totalBudget).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
