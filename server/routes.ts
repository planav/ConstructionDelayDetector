import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertHumanResourceSchema, insertMaterialSchema, insertEquipmentSchema, insertMiscellaneousItemSchema, insertDailyProjectReportSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateAIAnalysis } from "./services/openai";
import { getWeatherData } from "./services/weather";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
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
      console.error("Error creating project:", error);
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
      
      // Get ML prediction from trained model
      let mlPrediction = null;
      try {
        const mlResponse = await fetch('http://localhost:5001/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: {
              currentProgress: project.currentProgress || 0,
              startDate: project.startDate,
              endDate: project.endDate,
              totalBudget: project.totalBudget,
              location: project.location,
              humanResources: project.humanResources || [],
              materials: project.materials || [],
              equipment: project.equipment || []
            },
            resourceUsage: req.body.resourceUsage
          })
        });

        if (mlResponse.ok) {
          const mlData = await mlResponse.json();
          mlPrediction = mlData.prediction;
        }
      } catch (error) {
        console.log("ML API not available, using AI analysis only");
      }

      // Generate AI analysis
      const aiAnalysis = await analyzeProjectDelayAndCost(project, req.body.resourceUsage);

      // Combine ML and AI analysis
      const enhancedAnalysis = {
        ...aiAnalysis,
        ml_prediction: mlPrediction ? {
          predicted_delay_days: mlPrediction.delay_days,
          predicted_additional_cost: mlPrediction.additional_cost_usd,
          confidence_percentage: mlPrediction.confidence_percentage,
          confidence_interval: mlPrediction.confidence_interval,
          model_used: 'trained_ml_model',
          data_source: 'real_construction_data'
        } : {
          predicted_delay_days: aiAnalysis.estimatedDelayDays,
          confidence_percentage: aiAnalysis.confidenceLevel,
          model_used: 'ai_heuristic_fallback',
          data_source: 'ai_analysis'
        },
        ai_analysis: {
          cost_impact: {
            total_additional_cost: mlPrediction?.additional_cost_usd || aiAnalysis.costImpact,
            cost_breakdown: aiAnalysis.budgetBreakdown,
            budget_reallocation: aiAnalysis.budgetReallocation
          },
          action_plan: {
            immediate_actions: aiAnalysis.recommendations.immediate,
            short_term_strategies: aiAnalysis.recommendations.shortTerm,
            long_term_improvements: aiAnalysis.recommendations.longTerm
          },
          resource_optimization: {
            critical_bottlenecks: aiAnalysis.resourceOptimization.criticalBottlenecks,
            efficiency_improvements: aiAnalysis.resourceOptimization.efficiencyImprovements,
            specific_adjustments: aiAnalysis.resourceOptimization.specificAdjustments
          },
          timeline_recovery: aiAnalysis.timelineRecoveryPlan,
          risk_assessment: {
            current_risk_level: aiAnalysis.riskLevel,
            risk_factors: aiAnalysis.delayReasons,
            mitigation_strategies: aiAnalysis.recommendations.immediate
          }
        },
        hybrid_confidence: mlPrediction?.confidence_percentage || aiAnalysis.confidenceLevel,
        analysis_timestamp: new Date().toISOString(),
        ml_available: mlPrediction !== null
      };
      
      const validatedData = insertDailyProjectReportSchema.parse({
        ...req.body,
        projectId,
        weatherData,
        aiAnalysis: enhancedAnalysis,
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

      // Get ALL project data for comprehensive AI context
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Get complete project context
      const dailyReports = await storage.getDailyProjectReports(projectId);
      const chatHistory = await storage.getChatMessages(projectId);

      // Get current weather data
      let weatherData = null;
      try {
        const weatherResponse = await fetch(`http://localhost:8080/api/weather/${encodeURIComponent(project.location)}`);
        if (weatherResponse.ok) {
          weatherData = await weatherResponse.json();
        }
      } catch (error) {
        console.log("Weather data not available for chat");
      }

      // Get ML prediction if available
      let mlPrediction = null;
      try {
        const mlResponse = await fetch('http://localhost:5001/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: {
              currentProgress: project.currentProgress || 0,
              startDate: project.startDate,
              endDate: project.endDate,
              totalBudget: project.totalBudget,
              location: project.location,
              humanResources: project.humanResources || [],
              materials: project.materials || [],
              equipment: project.equipment || []
            }
          })
        });

        if (mlResponse.ok) {
          const mlData = await mlResponse.json();
          mlPrediction = mlData.prediction;
        }
      } catch (error) {
        console.log("ML prediction not available for chat");
      }

      // Generate AI response with complete context
      const aiResponse = await handleChatMessage(message, project, {
        dailyReports,
        chatHistory: chatHistory.slice(-10), // Last 10 messages for context
        weatherData,
        mlPrediction
      });

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

  // Enhanced AI Analytics endpoint
  app.get("/api/analytics/projects/:projectId/ai-analysis", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const reports = await storage.getDailyProjectReports(projectId);

      // Get the latest AI analysis from the most recent report
      const latestReport = reports[0];
      let aiAnalysis = null;

      if (latestReport && latestReport.aiAnalysis) {
        aiAnalysis = latestReport.aiAnalysis;
      } else {
        // Generate fresh analysis if no recent analysis exists
        aiAnalysis = await analyzeProjectDelayAndCost(project, []);
      }

      res.json({
        projectId,
        projectName: project.name,
        analysisDate: new Date().toISOString(),
        analysis: aiAnalysis,
        dataSource: latestReport ? 'latest_report' : 'fresh_analysis',
        reportCount: reports.length
      });
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      res.status(500).json({ error: "Failed to fetch AI analysis" });
    }
  });

  // Risk Assessment endpoint
  app.get("/api/analytics/projects/:projectId/risk-assessment", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const reports = await storage.getDailyProjectReports(projectId);

      // Calculate risk metrics
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      const currentDate = new Date();

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, totalDays - elapsedDays);

      const expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
      const actualProgress = parseFloat(project.currentProgress || "0");
      const progressVariance = actualProgress - expectedProgress;

      // Risk level calculation
      let riskLevel = "LOW";
      let riskScore = 0;
      const riskFactors = [];

      if (progressVariance < -20) {
        riskLevel = "CRITICAL";
        riskScore = 90;
        riskFactors.push("Severely behind schedule");
      } else if (progressVariance < -10) {
        riskLevel = "HIGH";
        riskScore = 70;
        riskFactors.push("Behind schedule");
      } else if (progressVariance < -5) {
        riskLevel = "MEDIUM";
        riskScore = 50;
        riskFactors.push("Slightly behind schedule");
      } else {
        riskLevel = "LOW";
        riskScore = 20;
      }

      // Budget risk
      const budget = parseFloat(project.totalBudget);
      if (budget > 10000000) {
        riskScore += 10;
        riskFactors.push("High-value project");
      }

      // Timeline pressure
      if (remainingDays < 30 && actualProgress < 80) {
        riskScore += 20;
        riskFactors.push("Timeline pressure");
      }

      // Resource complexity
      const totalResources = (project.humanResources?.length || 0) +
                            (project.materials?.length || 0) +
                            (project.equipment?.length || 0);
      if (totalResources > 15) {
        riskScore += 10;
        riskFactors.push("High resource complexity");
      }

      // Recent issues from DPRs
      const recentIssues = reports.slice(0, 5).filter(r =>
        r.extraBudgetReason && r.extraBudgetReason.trim().length > 0
      );
      if (recentIssues.length > 2) {
        riskScore += 15;
        riskFactors.push("Frequent issues reported");
      }

      riskScore = Math.min(100, riskScore);

      // Enhanced risk assessment with detailed breakdown
      const timelineRisk = remainingDays < 30 && actualProgress < 80 ? "HIGH" :
                          remainingDays < 60 && actualProgress < 60 ? "MEDIUM" : "LOW";
      const budgetRisk = budget > 10000000 ? "HIGH" : budget > 5000000 ? "MEDIUM" : "LOW";
      const resourceRisk = totalResources > 15 ? "HIGH" : totalResources > 8 ? "MEDIUM" : "LOW";
      const qualityRisk = recentIssues.length > 2 ? "HIGH" : recentIssues.length > 0 ? "MEDIUM" : "LOW";
      const weatherRisk = project.location?.toLowerCase().includes('mumbai') ||
                         project.location?.toLowerCase().includes('chennai') ? "MEDIUM" : "LOW";

      // Calculate predictions
      const predictedCompletionDate = new Date(endDate);
      if (progressVariance < -10) {
        predictedCompletionDate.setDate(predictedCompletionDate.getDate() + Math.abs(progressVariance));
      }

      const extraBudgetUsed = reports.reduce((sum, r) => sum + parseFloat(r.extraBudgetUsed || "0"), 0);
      const predictedFinalBudget = budget + extraBudgetUsed + (budget * 0.1); // 10% buffer

      const successProbability = Math.max(20, 100 - riskScore);

      const riskAssessment = {
        riskLevel,
        riskScore,
        riskFactors,
        overallRisk: riskLevel,
        progressVariance: progressVariance.toFixed(1),
        timelineStatus: remainingDays < 30 ? "URGENT" : remainingDays < 60 ? "ATTENTION" : "NORMAL",
        budgetRisk,
        resourceRisk,
        riskFactorsDetailed: {
          timelineRisk: {
            level: timelineRisk,
            score: timelineRisk === "HIGH" ? 80 : timelineRisk === "MEDIUM" ? 50 : 20,
            description: `${remainingDays} days remaining, ${actualProgress}% complete`
          },
          budgetRisk: {
            level: budgetRisk,
            score: budgetRisk === "HIGH" ? 80 : budgetRisk === "MEDIUM" ? 50 : 20,
            description: `$${budget.toLocaleString()} total budget, $${extraBudgetUsed.toLocaleString()} extra used`
          },
          resourceRisk: {
            level: resourceRisk,
            score: resourceRisk === "HIGH" ? 80 : resourceRisk === "MEDIUM" ? 50 : 20,
            description: `${totalResources} total resources across HR, materials, equipment`
          },
          qualityRisk: {
            level: qualityRisk,
            score: qualityRisk === "HIGH" ? 80 : qualityRisk === "MEDIUM" ? 50 : 20,
            description: `${recentIssues.length} issues reported in recent DPRs`
          },
          weatherRisk: {
            level: weatherRisk,
            score: weatherRisk === "HIGH" ? 80 : weatherRisk === "MEDIUM" ? 50 : 20,
            description: `Location: ${project.location} - weather impact assessment`
          }
        },
        predictions: {
          completionDate: predictedCompletionDate.toISOString().split('T')[0],
          confidence: Math.max(60, 100 - Math.abs(progressVariance)),
          finalBudget: Math.round(predictedFinalBudget),
          budgetConfidence: extraBudgetUsed > 0 ? 70 : 85,
          successProbability: Math.round(successProbability)
        },
        recommendations: [
          riskLevel === "CRITICAL" ? "Immediate intervention required" :
          riskLevel === "HIGH" ? "Implement corrective measures" :
          riskLevel === "MEDIUM" ? "Monitor closely" : "Continue current approach",
          remainingDays < 30 ? "Accelerate critical activities" : "Maintain current pace",
          recentIssues.length > 2 ? "Address recurring issues" : "Monitor for new issues"
        ]
      };

      res.json(riskAssessment);
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      res.status(500).json({ error: "Failed to fetch risk assessment" });
    }
  });

  // Performance Trends endpoint
  app.get("/api/analytics/projects/:projectId/performance-trends", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const reports = await storage.getDailyProjectReports(projectId);

      // Calculate performance trends
      const progressTrend = reports.map(report => ({
        date: report.reportDate,
        progress: parseFloat(report.progressPercentage || "0"),
        budgetUsed: parseFloat(report.extraBudgetUsed || "0"),
        issues: report.extraBudgetReason ? 1 : 0
      })).reverse(); // Reverse to get chronological order

      // Calculate velocity (progress per day)
      const velocityTrend = [];
      for (let i = 1; i < progressTrend.length; i++) {
        const current = progressTrend[i];
        const previous = progressTrend[i - 1];
        const daysDiff = Math.max(1, Math.ceil(
          (new Date(current.date).getTime() - new Date(previous.date).getTime()) / (1000 * 60 * 60 * 24)
        ));
        const velocity = (current.progress - previous.progress) / daysDiff;

        velocityTrend.push({
          date: current.date,
          velocity: Math.max(0, velocity),
          efficiency: velocity > 1 ? "HIGH" : velocity > 0.5 ? "MEDIUM" : "LOW"
        });
      }

      // Budget trend
      const budgetTrend = progressTrend.map(point => ({
        date: point.date,
        cumulativeBudgetUsed: point.budgetUsed,
        budgetEfficiency: point.progress > 0 ? (point.progress / Math.max(point.budgetUsed, 1)) * 100 : 0
      }));

      // Quality trend (issues frequency)
      const qualityTrend = progressTrend.map(point => ({
        date: point.date,
        issueCount: point.issues,
        qualityScore: point.issues === 0 ? 100 : 70 // Simple quality scoring
      }));

      // Overall performance score
      const avgVelocity = velocityTrend.length > 0 ?
        velocityTrend.reduce((sum, v) => sum + v.velocity, 0) / velocityTrend.length : 0;
      const avgQuality = qualityTrend.length > 0 ?
        qualityTrend.reduce((sum, q) => sum + q.qualityScore, 0) / qualityTrend.length : 100;

      const performanceScore = Math.round((avgVelocity * 30 + avgQuality * 0.7));

      // Enhanced performance trends with detailed breakdowns
      const totalBudgetSpent = progressTrend.reduce((sum, p) => sum + p.budgetUsed, 0);
      const avgDailySpend = reports.length > 0 ? totalBudgetSpent / reports.length : 0;

      // Resource utilization calculation
      const totalResources = (project.humanResources?.length || 0) +
                            (project.materials?.length || 0) +
                            (project.equipment?.length || 0);
      const resourceUtilization = totalResources > 0 ? Math.min(100, (reports.length * 5)) : 0;

      // Weather impact simulation
      const weatherImpactDays = Math.floor(reports.length * 0.2); // 20% weather impact
      const weatherImpactRate = reports.length > 0 ? (weatherImpactDays / reports.length) * 100 : 0;

      const performanceTrends = {
        performanceScore: Math.min(100, performanceScore),
        progressTrend: {
          data: progressTrend,
          trend: velocityTrend.length > 2 ?
            (velocityTrend[velocityTrend.length - 1].velocity > velocityTrend[0].velocity ? "improving" : "declining") : "stable",
          velocity: avgVelocity.toFixed(2)
        },
        velocityTrend,
        budgetTrend: {
          data: budgetTrend,
          totalSpent: Math.round(totalBudgetSpent),
          averageDailySpend: Math.round(avgDailySpend),
          trend: totalBudgetSpent > parseFloat(project.totalBudget) * 0.8 ? "high" : "normal"
        },
        qualityTrend,
        resourceUtilizationTrend: {
          averageUtilization: Math.round(resourceUtilization),
          trend: resourceUtilization > 80 ? "high" : resourceUtilization > 50 ? "medium" : "low",
          totalResources: totalResources
        },
        weatherImpactTrend: {
          impactRate: Math.round(weatherImpactRate),
          adverseWeatherDays: weatherImpactDays,
          totalDays: reports.length,
          trend: weatherImpactRate > 30 ? "high" : weatherImpactRate > 15 ? "medium" : "low"
        },
        summary: {
          averageVelocity: avgVelocity.toFixed(2),
          averageQuality: avgQuality.toFixed(1),
          totalReports: reports.length,
          trendDirection: velocityTrend.length > 2 ?
            (velocityTrend[velocityTrend.length - 1].velocity > velocityTrend[0].velocity ? "IMPROVING" : "DECLINING") : "STABLE"
        }
      };

      res.json(performanceTrends);
    } catch (error) {
      console.error("Error fetching performance trends:", error);
      res.status(500).json({ error: "Failed to fetch performance trends" });
    }
  });

  // Enhanced Analytics endpoints with ML-powered insights
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const projects = await storage.getProjects();

      // Get projects with relations for comprehensive analytics
      const projectsWithRelations = await Promise.all(
        projects.map(async (project) => {
          return await storage.getProject(project.id);
        })
      );

      // Filter out any null results
      const validProjects = projectsWithRelations.filter((p): p is NonNullable<typeof p> => p !== null);

      // Get comprehensive analytics data
      const analyticsData = await generateComprehensiveAnalytics(validProjects);

      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
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
