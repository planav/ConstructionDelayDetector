import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Manually set DATABASE_URL to bypass .env parsing issues
const DATABASE_URL = "postgresql://neondb_owner:npg_pdiwCjA0SWQ9@ep-black-butterfly-aem90cpj.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("DATABASE_URL being used:", JSON.stringify(DATABASE_URL));
export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });