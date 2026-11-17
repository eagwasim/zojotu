-- 0002: write off watches (local SQLite). Not idempotent: or run `node scripts/apply-sqlite-migration.mjs`.
ALTER TABLE watches ADD COLUMN written_off_date text;
ALTER TABLE watches ADD COLUMN written_off_reason text;
