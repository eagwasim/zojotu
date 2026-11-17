// Local dev only: bring a SQLite file up to the current schema's watch/service_jobs columns.
// Usage: node scripts/apply-sqlite-migration.mjs [path-to-db]   (default: data/van_christaan.db)
// Never point this at production; production is Postgres (see docs/db-changes.md).
import Database from "better-sqlite3";

const file = process.argv[2] || "data/van_christaan.db";
const db = new Database(file);

const wanted = {
  watches: {
    asking_price: "real",
    listed_date: "text",
    listed_platform: "text",
    serial: "text",
    condition: "text",
    primary_image_id: "integer",
  },
  // Added by the payments work (a883acc); older local files may lack it.
  service_jobs: { payment_information: "text" },
};

for (const [table, cols] of Object.entries(wanted)) {
  const have = new Set(db.prepare(`pragma table_info(${table})`).all().map((c) => c.name));
  for (const [col, type] of Object.entries(cols)) {
    if (have.has(col)) continue;
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
    console.log(`added ${table}.${col}`);
  }
}
console.log(`${file} is up to date`);
