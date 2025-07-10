import { apiRequest } from "./queryClient";
import type { 
  Project, 
  InsertProject, 
  ProjectWithRelations,
  HumanResource,
  InsertHumanResource,
  Material,
  InsertMaterial,
  Equipment,
  InsertEquipment,
  MiscellaneousItem,
  InsertMiscellaneousItem,
  DailyProjectReport,
  InsertDailyProjectReport,
  ChatMessage,
  InsertChatMessage
} from "@shared/schema";

// Projects API
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await apiRequest("GET", "/api/projects");
    return response.json();
  },

  getById: async (id: number): Promise<ProjectWithRelations> => {
    const response = await apiRequest("GET", `/api/projects/${id}`);
    return response.json();
  },

  create: async (project: InsertProject): Promise<Project> => {
    const response = await apiRequest("POST", "/api/projects", project);
    return response.json();
  },

  update: async (id: number, project: Partial<InsertProject>): Promise<Project> => {
    const response = await apiRequest("PUT", `/api/projects/${id}`, project);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/projects/${id}`);
  },
};

// Human Resources API
export const humanResourcesApi = {
  getByProject: async (projectId: number): Promise<HumanResource[]> => {
    const response = await apiRequest("GET", `/api/projects/${projectId}/human-resources`);
    return response.json();
  },

  create: async (projectId: number, humanResource: Omit<InsertHumanResource, 'projectId'>): Promise<HumanResource> => {
    const response = await apiRequest("POST", `/api/projects/${projectId}/human-resources`, humanResource);
    return response.json();
  },

  update: async (id: number, humanResource: Partial<InsertHumanResource>): Promise<HumanResource> => {
    const response = await apiRequest("PUT", `/api/human-resources/${id}`, humanResource);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/human-resources/${id}`);
  },
};

// Materials API
export const materialsApi = {
  getByProject: async (projectId: number): Promise<Material[]> => {
    const response = await apiRequest("GET", `/api/projects/${projectId}/materials`);
    return response.json();
  },

  create: async (projectId: number, material: Omit<InsertMaterial, 'projectId'>): Promise<Material> => {
    const response = await apiRequest("POST", `/api/projects/${projectId}/materials`, material);
    return response.json();
  },

  update: async (id: number, material: Partial<InsertMaterial>): Promise<Material> => {
    const response = await apiRequest("PUT", `/api/materials/${id}`, material);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/materials/${id}`);
  },
};

// Equipment API
export const equipmentApi = {
  getByProject: async (projectId: number): Promise<Equipment[]> => {
    const response = await apiRequest("GET", `/api/projects/${projectId}/equipment`);
    return response.json();
  },

  create: async (projectId: number, equipment: Omit<InsertEquipment, 'projectId'>): Promise<Equipment> => {
    const response = await apiRequest("POST", `/api/projects/${projectId}/equipment`, equipment);
    return response.json();
  },

  update: async (id: number, equipment: Partial<InsertEquipment>): Promise<Equipment> => {
    const response = await apiRequest("PUT", `/api/equipment/${id}`, equipment);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/equipment/${id}`);
  },
};

// Miscellaneous Items API
export const miscellaneousItemsApi = {
  getByProject: async (projectId: number): Promise<MiscellaneousItem[]> => {
    const response = await apiRequest("GET", `/api/projects/${projectId}/miscellaneous-items`);
    return response.json();
  },

  create: async (projectId: number, item: Omit<InsertMiscellaneousItem, 'projectId'>): Promise<MiscellaneousItem> => {
    const response = await apiRequest("POST", `/api/projects/${projectId}/miscellaneous-items`, item);
    return response.json();
  },

  update: async (id: number, item: Partial<InsertMiscellaneousItem>): Promise<MiscellaneousItem> => {
    const response = await apiRequest("PUT", `/api/miscellaneous-items/${id}`, item);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/miscellaneous-items/${id}`);
  },
};

// Daily Project Reports API
export const dailyReportsApi = {
  getByProject: async (projectId: number): Promise<DailyProjectReport[]> => {
    const response = await apiRequest("GET", `/api/projects/${projectId}/daily-reports`);
    return response.json();
  },

  getByDate: async (projectId: number, date: string): Promise<DailyProjectReport> => {
    const response = await apiRequest("GET", `/api/projects/${projectId}/daily-reports/${date}`);
    return response.json();
  },

  create: async (projectId: number, report: Omit<InsertDailyProjectReport, 'projectId'>): Promise<DailyProjectReport> => {
    const response = await apiRequest("POST", `/api/projects/${projectId}/daily-reports`, report);
    return response.json();
  },

  update: async (id: number, report: Partial<InsertDailyProjectReport>): Promise<DailyProjectReport> => {
    const response = await apiRequest("PUT", `/api/daily-reports/${id}`, report);
    return response.json();
  },
};

// Weather API
export const weatherApi = {
  getByLocation: async (location: string): Promise<any> => {
    const response = await apiRequest("GET", `/api/weather/${encodeURIComponent(location)}`);
    return response.json();
  },
};

// Chat API
export const chatApi = {
  getByProject: async (projectId: number): Promise<ChatMessage[]> => {
    const response = await apiRequest("GET", `/api/projects/${projectId}/chat`);
    return response.json();
  },

  sendMessage: async (projectId: number, message: string): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> => {
    const response = await apiRequest("POST", `/api/projects/${projectId}/chat`, { message });
    return response.json();
  },
};

// Analytics API
export const analyticsApi = {
  getOverview: async (): Promise<{
    totalProjects: number;
    activeProjects: number;
    delayedProjects: number;
    totalBudget: number;
  }> => {
    const response = await apiRequest("GET", "/api/analytics/overview");
    return response.json();
  },

  getProgressData: async (projectId: number): Promise<{ date: string; progress: number }[]> => {
    const response = await apiRequest("GET", `/api/analytics/projects/${projectId}/progress`);
    return response.json();
  },

  getDelayData: async (projectId: number): Promise<Record<string, number>> => {
    const response = await apiRequest("GET", `/api/analytics/projects/${projectId}/delays`);
    return response.json();
  },
};

// Combined API object for easier imports
export const api = {
  projects: projectsApi,
  humanResources: humanResourcesApi,
  materials: materialsApi,
  equipment: equipmentApi,
  miscellaneousItems: miscellaneousItemsApi,
  dailyReports: dailyReportsApi,
  weather: weatherApi,
  chat: chatApi,
  analytics: analyticsApi,
};

export default api;
