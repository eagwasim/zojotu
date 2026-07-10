import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbDriver } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({
    dbDriver,
    databaseUrl: dbDriver === "postgres"
      ? (process.env.DATABASE_URL || "postgres://localhost:5432/van_christaan").replace(/:[^:@]+@/, ":***@")
      : undefined,
    sqlitePath: dbDriver === "sqlite"
      ? (process.env.DB_SQLITE_PATH || "./data/van_christaan.db")
      : undefined,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { driver, databaseUrl, sqlitePath } = body;

  if (!driver || !["postgres", "sqlite"].includes(driver)) {
    return NextResponse.json(
      { error: "driver must be 'postgres' or 'sqlite'" },
      { status: 400 }
    );
  }

  const configPath = path.join(process.cwd(), "db-config.json");
  const config: Record<string, string> = {};

  config.DB_DRIVER = driver;
  if (driver === "postgres" && databaseUrl) {
    config.DATABASE_URL = databaseUrl;
  }
  if (driver === "sqlite" && sqlitePath) {
    config.DB_SQLITE_PATH = sqlitePath;
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  return NextResponse.json({
    success: true,
    message: "Database configuration saved. Restart the dev server for changes to take effect.",
    config: { driver },
  });
}
