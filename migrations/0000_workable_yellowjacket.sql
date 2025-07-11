CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"message" text NOT NULL,
	"response" text,
	"is_from_user" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_project_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"report_date" date NOT NULL,
	"weather_data" jsonb,
	"progress_percentage" numeric(5, 2) NOT NULL,
	"extra_budget_used" numeric(10, 2) DEFAULT '0' NOT NULL,
	"extra_budget_reason" text,
	"resource_usage" jsonb,
	"ai_analysis" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"number_of_units" integer NOT NULL,
	"rental_cost_per_day" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "human_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"role_name" text NOT NULL,
	"number_of_workers" integer NOT NULL,
	"daily_cost_per_worker" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"total_quantity" numeric(12, 2) NOT NULL,
	"cost_per_unit" numeric(10, 2) NOT NULL,
	"used_quantity" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "miscellaneous_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"working_days_per_month" integer NOT NULL,
	"country_calendar" text NOT NULL,
	"human_resource_budget" numeric(12, 2) DEFAULT '0' NOT NULL,
	"material_budget" numeric(12, 2) DEFAULT '0' NOT NULL,
	"equipment_budget" numeric(12, 2) DEFAULT '0' NOT NULL,
	"miscellaneous_budget" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_budget" numeric(12, 2) DEFAULT '0' NOT NULL,
	"current_progress" numeric(5, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'Project Manager' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_project_reports" ADD CONSTRAINT "daily_project_reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_resources" ADD CONSTRAINT "human_resources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "miscellaneous_items" ADD CONSTRAINT "miscellaneous_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;