import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Project Manager"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  workingDaysPerMonth: integer("working_days_per_month").notNull(),
  countryCalendar: text("country_calendar").notNull(),
  humanResourceBudget: decimal("human_resource_budget", { precision: 12, scale: 2 }).notNull().default("0"),
  materialBudget: decimal("material_budget", { precision: 12, scale: 2 }).notNull().default("0"),
  equipmentBudget: decimal("equipment_budget", { precision: 12, scale: 2 }).notNull().default("0"),
  miscellaneousBudget: decimal("miscellaneous_budget", { precision: 12, scale: 2 }).notNull().default("0"),
  totalBudget: decimal("total_budget", { precision: 12, scale: 2 }).notNull().default("0"),
  currentProgress: decimal("current_progress", { precision: 5, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("active"), // active, completed, cancelled, delayed, critical
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const humanResources = pgTable("human_resources", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  roleName: text("role_name").notNull(),
  numberOfWorkers: integer("number_of_workers").notNull(),
  dailyCostPerWorker: decimal("daily_cost_per_worker", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  totalQuantity: decimal("total_quantity", { precision: 12, scale: 2 }).notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  usedQuantity: decimal("used_quantity", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  numberOfUnits: integer("number_of_units").notNull(),
  rentalCostPerDay: decimal("rental_cost_per_day", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const miscellaneousItems = pgTable("miscellaneous_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyProjectReports = pgTable("daily_project_reports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  reportDate: date("report_date").notNull(),
  weatherData: jsonb("weather_data"), // { temperature, condition, description }
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).notNull(),
  extraBudgetUsed: decimal("extra_budget_used", { precision: 10, scale: 2 }).notNull().default("0"),
  extraBudgetReason: text("extra_budget_reason"),
  resourceUsage: jsonb("resource_usage"), // Array of resource usage data
  aiAnalysis: jsonb("ai_analysis"), // { estimatedDelay, costImpact, recommendations }
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  message: text("message").notNull(),
  response: text("response"),
  isFromUser: boolean("is_from_user").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  humanResources: many(humanResources),
  materials: many(materials),
  equipment: many(equipment),
  miscellaneousItems: many(miscellaneousItems),
  dailyProjectReports: many(dailyProjectReports),
  chatMessages: many(chatMessages),
}));

export const humanResourcesRelations = relations(humanResources, ({ one }) => ({
  project: one(projects, {
    fields: [humanResources.projectId],
    references: [projects.id],
  }),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  project: one(projects, {
    fields: [materials.projectId],
    references: [projects.id],
  }),
}));

export const equipmentRelations = relations(equipment, ({ one }) => ({
  project: one(projects, {
    fields: [equipment.projectId],
    references: [projects.id],
  }),
}));

export const miscellaneousItemsRelations = relations(miscellaneousItems, ({ one }) => ({
  project: one(projects, {
    fields: [miscellaneousItems.projectId],
    references: [projects.id],
  }),
}));

export const dailyProjectReportsRelations = relations(dailyProjectReports, ({ one }) => ({
  project: one(projects, {
    fields: [dailyProjectReports.projectId],
    references: [projects.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  project: one(projects, {
    fields: [chatMessages.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHumanResourceSchema = createInsertSchema(humanResources).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
});

export const insertMiscellaneousItemSchema = createInsertSchema(miscellaneousItems).omit({
  id: true,
  createdAt: true,
});

export const insertDailyProjectReportSchema = createInsertSchema(dailyProjectReports).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type HumanResource = typeof humanResources.$inferSelect;
export type InsertHumanResource = z.infer<typeof insertHumanResourceSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type MiscellaneousItem = typeof miscellaneousItems.$inferSelect;
export type InsertMiscellaneousItem = z.infer<typeof insertMiscellaneousItemSchema>;
export type DailyProjectReport = typeof dailyProjectReports.$inferSelect;
export type InsertDailyProjectReport = z.infer<typeof insertDailyProjectReportSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ProjectWithRelations = Project & {
  humanResources: HumanResource[];
  materials: Material[];
  equipment: Equipment[];
  miscellaneousItems: MiscellaneousItem[];
  dailyProjectReports: DailyProjectReport[];
  chatMessages: ChatMessage[];
};
