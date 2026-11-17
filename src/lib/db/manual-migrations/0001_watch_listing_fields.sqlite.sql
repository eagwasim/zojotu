-- 0001: watch listing & identity fields (UX overhaul phase 2), SQLite / local dev.
-- SQLite has no ADD COLUMN IF NOT EXISTS; run once. Use scripts/apply-sqlite-migration.mjs to skip existing columns.
ALTER TABLE watches ADD COLUMN asking_price real;
ALTER TABLE watches ADD COLUMN listed_date text;
ALTER TABLE watches ADD COLUMN listed_platform text;
ALTER TABLE watches ADD COLUMN serial text;
ALTER TABLE watches ADD COLUMN condition text;
ALTER TABLE watches ADD COLUMN primary_image_id integer;
