import { defineConfig } from "drizzle-kit";

const driver = process.env.DB_DRIVER || "postgres";

const pgConfig = defineConfig({
  schema: "./src/lib/db/schema-pg.ts",
  out: "./src/lib/db/migrations-pg",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://localhost:5432/van_christaan",
  },
});

const sqliteConfig = defineConfig({
  schema: "./src/lib/db/schema-sqlite.ts",
  out: "./src/lib/db/migrations-sqlite",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_SQLITE_PATH || "./data/van_christaan.db",
  },
});

export default driver === "sqlite" ? sqliteConfig : pgConfig;
