import * as pgSchema from "./schema-pg";
import * as sqliteSchema from "./schema-sqlite";

const driver = process.env.DB_DRIVER || "postgres";

function createDatabase() {
  if (driver === "sqlite") {
    const Database = require("better-sqlite3");
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    const path = require("path");
    const fs = require("fs");

    const dbPath =
      process.env.DB_SQLITE_PATH ||
      path.join(process.cwd(), "data", "van_christaan.db");

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    return drizzle(sqlite, { schema: sqliteSchema });
  } else {
    const postgres = require("postgres");
    const { drizzle } = require("drizzle-orm/postgres-js");

    const connectionString =
      process.env.DATABASE_URL || "postgres://localhost:5432/van_christaan";

    const client = postgres(connectionString);
    return drizzle(client, { schema: pgSchema });
  }
}

export const db: any = createDatabase();
export { driver as dbDriver };
