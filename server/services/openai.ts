import { GoogleGenAI } from "@google/genai";
import type { ProjectWithRelations } from "@shared/schema";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeProjectDelayAndCost(
  project: ProjectWithRelations,
  resourceUsage: any[]
): Promise<any> {
  try {
    const prompt = `
You are an AI construction project analyst. Analyze the following project data and resource usage to provide delay and cost impact analysis.

Project: ${project.name}
Location: ${project.location}
Current Progress: ${project.currentProgress}%
Budget: $${project.totalBudget}

Resource Usage Today:
${JSON.stringify(resourceUsage, null, 2)}

Human Resources Available:
${project.humanResources.map(hr => `${hr.roleName}: ${hr.numberOfWorkers} workers at $${hr.dailyCostPerWorker}/day`).join('\n')}

Materials Available:
${project.materials.map(m => `${m.name}: ${m.totalQuantity} units at $${m.costPerUnit}/unit`).join('\n')}

Equipment Available:
${project.equipment.map(e => `${e.name}: ${e.numberOfUnits} units at $${e.rentalCostPerDay}/day`).join('\n')}

Analyze the resource shortages and provide:
1. Estimated delay in days
2. Cost impact in dollars
3. Primary delay reasons
4. Specific actionable recommendations

Respond in JSON format with the following structure:
{
  "estimatedDelayDays": number,
  "costImpact": number,
  "delayReasons": ["reason1", "reason2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}
`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are an expert construction project analyst with deep knowledge of resource planning, delay analysis, and cost estimation.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            estimatedDelayDays: { type: "number" },
            costImpact: { type: "number" },
            delayReasons: {
              type: "array",
              items: { type: "string" }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["estimatedDelayDays", "costImpact", "delayReasons", "recommendations"]
        }
      },
      contents: prompt,
    });

    const analysis = JSON.parse(response.text || "{}");
    
    return {
      estimatedDelayDays: analysis.estimatedDelayDays || 0,
      costImpact: analysis.costImpact || 0,
      delayReasons: analysis.delayReasons || [],
      recommendations: analysis.recommendations || [],
    };
  } catch (error) {
    console.error("Error analyzing project delay and cost:", error);
    return {
      estimatedDelayDays: 0,
      costImpact: 0,
      delayReasons: ["Unable to analyze - AI service unavailable"],
      recommendations: ["Contact project manager for manual analysis"],
    };
  }
}

export async function generateAIRecommendations(
  projects: ProjectWithRelations[]
): Promise<string[]> {
  try {
    const prompt = `
Analyze the following construction projects and provide high-level AI-powered recommendations for workflow optimization and risk mitigation.

Projects Data:
${projects.map(p => `
Project: ${p.name}
Progress: ${p.currentProgress}%
Status: ${p.status}
Budget: $${p.totalBudget}
Daily Reports: ${p.dailyProjectReports.length}
`).join('\n')}

Provide 3-5 strategic recommendations for:
1. Pattern recognition across projects
2. Resource optimization opportunities
3. Risk mitigation strategies
4. Workflow improvements

Respond in JSON format:
{
  "recommendations": ["recommendation1", "recommendation2", ...]
}
`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are a senior construction project consultant with expertise in portfolio management and strategic planning.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["recommendations"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result.recommendations || [];
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return ["AI recommendations currently unavailable"];
  }
}

export async function handleChatMessage(
  message: string,
  project: ProjectWithRelations
): Promise<string> {
  try {
    const prompt = `
You are an AI assistant for construction project management. Answer questions about the following project:

Project: ${project.name}
Location: ${project.location}
Progress: ${project.currentProgress}%
Status: ${project.status}
Budget: $${project.totalBudget}

Resources:
- Human Resources: ${project.humanResources.length} roles defined
- Materials: ${project.materials.length} materials tracked
- Equipment: ${project.equipment.length} equipment items
- Daily Reports: ${project.dailyProjectReports.length} reports filed

Recent Activity:
${project.dailyProjectReports.slice(0, 3).map(report => `
Date: ${report.reportDate}
Progress: ${report.progressPercentage}%
Extra Budget: $${report.extraBudgetUsed}
${report.extraBudgetReason ? `Reason: ${report.extraBudgetReason}` : ''}
`).join('\n')}

User Question: "${message}"

Provide a helpful, specific response based on the project data. If the question is about delays, costs, or recommendations, provide actionable insights. Keep responses concise but informative.
`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are a knowledgeable construction project AI assistant. Provide practical, actionable advice based on project data.",
      },
      contents: prompt,
    });

    return response.text || "I'm sorry, I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Error handling chat message:", error);
    return "I'm experiencing technical difficulties. Please try again later or contact your project manager.";
  }
}
