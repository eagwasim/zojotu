import { sql } from "drizzle-orm";

/**
 * "Now" for updated_at-style columns, evaluated by the database.
 * A JS Date works on Postgres but SQLite (local dev) can't bind it, so use SQL instead.
 */
export const dbNow = () => sql`CURRENT_TIMESTAMP`;
