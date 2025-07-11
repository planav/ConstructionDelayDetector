import {
  users,
  projects,
  humanResources,
  materials,
  equipment,
  miscellaneousItems,
  dailyProjectReports,
  chatMessages,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type HumanResource,
  type InsertHumanResource,
  type Material,
  type InsertMaterial,
  type Equipment,
  type InsertEquipment,
  type MiscellaneousItem,
  type InsertMiscellaneousItem,
  type DailyProjectReport,
  type InsertDailyProjectReport,
  type ChatMessage,
  type InsertChatMessage,
  type ProjectWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<ProjectWithRelations | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Human Resources
  getHumanResourcesByProject(projectId: number): Promise<HumanResource[]>;
  createHumanResource(humanResource: InsertHumanResource): Promise<HumanResource>;
  updateHumanResource(id: number, humanResource: Partial<InsertHumanResource>): Promise<HumanResource>;
  deleteHumanResource(id: number): Promise<void>;

  // Materials
  getMaterialsByProject(projectId: number): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material>;
  deleteMaterial(id: number): Promise<void>;

  // Equipment
  getEquipmentByProject(projectId: number): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, equipment: Partial<InsertEquipment>): Promise<Equipment>;
  deleteEquipment(id: number): Promise<void>;

  // Miscellaneous Items
  getMiscellaneousItemsByProject(projectId: number): Promise<MiscellaneousItem[]>;
  createMiscellaneousItem(item: InsertMiscellaneousItem): Promise<MiscellaneousItem>;
  updateMiscellaneousItem(id: number, item: Partial<InsertMiscellaneousItem>): Promise<MiscellaneousItem>;
  deleteMiscellaneousItem(id: number): Promise<void>;

  // Daily Project Reports
  getDailyProjectReports(projectId: number): Promise<DailyProjectReport[]>;
  getDailyProjectReport(projectId: number, reportDate: string): Promise<DailyProjectReport | undefined>;
  createDailyProjectReport(report: InsertDailyProjectReport): Promise<DailyProjectReport>;
  updateDailyProjectReport(id: number, report: Partial<InsertDailyProjectReport>): Promise<DailyProjectReport>;

  // Chat Messages
  getChatMessages(projectId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<ProjectWithRelations | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return undefined;

    const [humanResourcesData, materialsData, equipmentData, miscellaneousItemsData, dailyProjectReportsData, chatMessagesData] = await Promise.all([
      db.select().from(humanResources).where(eq(humanResources.projectId, id)),
      db.select().from(materials).where(eq(materials.projectId, id)),
      db.select().from(equipment).where(eq(equipment.projectId, id)),
      db.select().from(miscellaneousItems).where(eq(miscellaneousItems.projectId, id)),
      db.select().from(dailyProjectReports).where(eq(dailyProjectReports.projectId, id)),
      db.select().from(chatMessages).where(eq(chatMessages.projectId, id)),
    ]);

    return {
      ...project,
      humanResources: humanResourcesData,
      materials: materialsData,
      equipment: equipmentData,
      miscellaneousItems: miscellaneousItemsData,
      dailyProjectReports: dailyProjectReportsData,
      chatMessages: chatMessagesData,
    };
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db.update(projects).set({ ...project, updatedAt: new Date() }).where(eq(projects.id, id)).returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Human Resources
  async getHumanResourcesByProject(projectId: number): Promise<HumanResource[]> {
    return await db.select().from(humanResources).where(eq(humanResources.projectId, projectId));
  }

  async createHumanResource(humanResource: InsertHumanResource): Promise<HumanResource> {
    const [newHumanResource] = await db.insert(humanResources).values(humanResource).returning();
    return newHumanResource;
  }

  async updateHumanResource(id: number, humanResource: Partial<InsertHumanResource>): Promise<HumanResource> {
    const [updatedHumanResource] = await db.update(humanResources).set(humanResource).where(eq(humanResources.id, id)).returning();
    return updatedHumanResource;
  }

  async deleteHumanResource(id: number): Promise<void> {
    await db.delete(humanResources).where(eq(humanResources.id, id));
  }

  // Materials
  async getMaterialsByProject(projectId: number): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.projectId, projectId));
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db.insert(materials).values(material).returning();
    return newMaterial;
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material> {
    const [updatedMaterial] = await db.update(materials).set(material).where(eq(materials.id, id)).returning();
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<void> {
    await db.delete(materials).where(eq(materials.id, id));
  }

  // Equipment
  async getEquipmentByProject(projectId: number): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.projectId, projectId));
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const [newEquipment] = await db.insert(equipment).values(insertEquipment).returning();
    return newEquipment;
  }

  async updateEquipment(id: number, updateEquipment: Partial<InsertEquipment>): Promise<Equipment> {
    const [updatedEquipment] = await db.update(equipment).set(updateEquipment).where(eq(equipment.id, id)).returning();
    return updatedEquipment;
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  }

  // Miscellaneous Items
  async getMiscellaneousItemsByProject(projectId: number): Promise<MiscellaneousItem[]> {
    return await db.select().from(miscellaneousItems).where(eq(miscellaneousItems.projectId, projectId));
  }

  async createMiscellaneousItem(item: InsertMiscellaneousItem): Promise<MiscellaneousItem> {
    const [newItem] = await db.insert(miscellaneousItems).values(item).returning();
    return newItem;
  }

  async updateMiscellaneousItem(id: number, item: Partial<InsertMiscellaneousItem>): Promise<MiscellaneousItem> {
    const [updatedItem] = await db.update(miscellaneousItems).set(item).where(eq(miscellaneousItems.id, id)).returning();
    return updatedItem;
  }

  async deleteMiscellaneousItem(id: number): Promise<void> {
    await db.delete(miscellaneousItems).where(eq(miscellaneousItems.id, id));
  }

  // Daily Project Reports
  async getDailyProjectReports(projectId: number): Promise<DailyProjectReport[]> {
    return await db.select().from(dailyProjectReports).where(eq(dailyProjectReports.projectId, projectId)).orderBy(desc(dailyProjectReports.reportDate));
  }

  async getDailyProjectReport(projectId: number, reportDate: string): Promise<DailyProjectReport | undefined> {
    const [report] = await db.select().from(dailyProjectReports).where(and(eq(dailyProjectReports.projectId, projectId), eq(dailyProjectReports.reportDate, reportDate)));
    return report || undefined;
  }

  async createDailyProjectReport(report: InsertDailyProjectReport): Promise<DailyProjectReport> {
    const [newReport] = await db.insert(dailyProjectReports).values(report).returning();
    return newReport;
  }

  async updateDailyProjectReport(id: number, report: Partial<InsertDailyProjectReport>): Promise<DailyProjectReport> {
    const [updatedReport] = await db.update(dailyProjectReports).set(report).where(eq(dailyProjectReports.id, id)).returning();
    return updatedReport;
  }

  // Chat Messages
  async getChatMessages(projectId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.projectId, projectId)).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
