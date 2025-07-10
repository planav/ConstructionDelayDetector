import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertHumanResourceSchema, insertMaterialSchema, insertEquipmentSchema, insertMiscellaneousItemSchema, insertDailyProjectReportSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { analyzeProjectDelayAndCost, generateAIRecommendations, handleChatMessage } from "./services/openai";
import { getWeatherData } from "./services/weather";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Human Resources
  app.get("/api/projects/:projectId/human-resources", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const humanResources = await storage.getHumanResourcesByProject(projectId);
      res.json(humanResources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch human resources" });
    }
  });

  app.post("/api/projects/:projectId/human-resources", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const validatedData = insertHumanResourceSchema.parse({ ...req.body, projectId });
      const humanResource = await storage.createHumanResource(validatedData);
      res.status(201).json(humanResource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid human resource data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create human resource" });
    }
  });

  app.put("/api/human-resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertHumanResourceSchema.partial().parse(req.body);
      const humanResource = await storage.updateHumanResource(id, validatedData);
      res.json(humanResource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid human resource data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update human resource" });
    }
  });

  app.delete("/api/human-resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHumanResource(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete human resource" });
    }
  });

  // Materials
  app.get("/api/projects/:projectId/materials", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const materials = await storage.getMaterialsByProject(projectId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.post("/api/projects/:projectId/materials", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const validatedData = insertMaterialSchema.parse({ ...req.body, projectId });
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid material data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create material" });
    }
  });

  app.put("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMaterialSchema.partial().parse(req.body);
      const material = await storage.updateMaterial(id, validatedData);
      res.json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid material data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaterial(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete material" });
    }
  });

  // Equipment
  app.get("/api/projects/:projectId/equipment", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const equipment = await storage.getEquipmentByProject(projectId);
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  app.post("/api/projects/:projectId/equipment", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const validatedData = insertEquipmentSchema.parse({ ...req.body, projectId });
      const equipment = await storage.createEquipment(validatedData);
      res.status(201).json(equipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid equipment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create equipment" });
    }
  });

  app.put("/api/equipment/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEquipmentSchema.partial().parse(req.body);
      const equipment = await storage.updateEquipment(id, validatedData);
      res.json(equipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid equipment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update equipment" });
    }
  });

  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEquipment(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete equipment" });
    }
  });

  // Miscellaneous Items
  app.get("/api/projects/:projectId/miscellaneous-items", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const items = await storage.getMiscellaneousItemsByProject(projectId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch miscellaneous items" });
    }
  });

  app.post("/api/projects/:projectId/miscellaneous-items", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const validatedData = insertMiscellaneousItemSchema.parse({ ...req.body, projectId });
      const item = await storage.createMiscellaneousItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid miscellaneous item data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create miscellaneous item" });
    }
  });

  app.put("/api/miscellaneous-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMiscellaneousItemSchema.partial().parse(req.body);
      const item = await storage.updateMiscellaneousItem(id, validatedData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid miscellaneous item data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update miscellaneous item" });
    }
  });

  app.delete("/api/miscellaneous-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMiscellaneousItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete miscellaneous item" });
    }
  });

  // Daily Project Reports
  app.get("/api/projects/:projectId/daily-reports", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const reports = await storage.getDailyProjectReports(projectId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily reports" });
    }
  });

  app.get("/api/projects/:projectId/daily-reports/:date", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const date = req.params.date;
      const report = await storage.getDailyProjectReport(projectId, date);
      if (!report) {
        return res.status(404).json({ error: "Daily report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily report" });
    }
  });

  app.post("/api/projects/:projectId/daily-reports", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Check if report for this date already exists
      const existingReport = await storage.getDailyProjectReport(projectId, req.body.reportDate);
      if (existingReport) {
        return res.status(400).json({ error: "Daily report for this date already exists" });
      }

      // Get weather data
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const weatherData = await getWeatherData(project.location);
      
      // Generate AI analysis
      const aiAnalysis = await analyzeProjectDelayAndCost(project, req.body.resourceUsage);
      
      const validatedData = insertDailyProjectReportSchema.parse({
        ...req.body,
        projectId,
        weatherData,
        aiAnalysis,
      });

      const report = await storage.createDailyProjectReport(validatedData);
      
      // Update project progress
      await storage.updateProject(projectId, {
        currentProgress: req.body.progressPercentage,
      });

      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid daily report data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create daily report" });
    }
  });

  // Weather API
  app.get("/api/weather/:location", async (req, res) => {
    try {
      const location = req.params.location;
      const weatherData = await getWeatherData(location);
      res.json(weatherData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  // Chat Messages
  app.get("/api/projects/:projectId/chat", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const messages = await storage.getChatMessages(projectId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/projects/:projectId/chat", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { message } = req.body;

      // Save user message
      const userMessage = await storage.createChatMessage({
        projectId,
        message,
        isFromUser: true,
      });

      // Get project data for AI context
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Generate AI response
      const aiResponse = await handleChatMessage(message, project);

      // Save AI response
      const aiMessage = await storage.createChatMessage({
        projectId,
        message: aiResponse,
        isFromUser: false,
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === "active").length;
      const delayedProjects = projects.filter(p => p.status === "delayed" || p.status === "critical").length;
      const totalBudget = projects.reduce((sum, p) => sum + parseFloat(p.totalBudget), 0);

      res.json({
        totalProjects,
        activeProjects,
        delayedProjects,
        totalBudget,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  });

  app.get("/api/analytics/projects/:projectId/progress", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const reports = await storage.getDailyProjectReports(projectId);
      
      const progressData = reports.map(report => ({
        date: report.reportDate,
        progress: parseFloat(report.progressPercentage),
      })).reverse();

      res.json(progressData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });

  app.get("/api/analytics/projects/:projectId/delays", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const reports = await storage.getDailyProjectReports(projectId);
      
      const delayReasons = reports.reduce((acc: Record<string, number>, report) => {
        if (report.aiAnalysis && (report.aiAnalysis as any).delayReasons) {
          const reasons = (report.aiAnalysis as any).delayReasons as string[];
          reasons.forEach(reason => {
            acc[reason] = (acc[reason] || 0) + 1;
          });
        }
        return acc;
      }, {});

      res.json(delayReasons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delay analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
