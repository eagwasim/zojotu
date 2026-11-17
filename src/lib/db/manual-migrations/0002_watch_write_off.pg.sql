-- 0002: write off watches that are broken beyond repair. See docs/db-changes.md.
-- Additive and nullable: safe to run while the current app version is serving traffic.
-- Apply BEFORE deploying the write-off code. Idempotent (IF NOT EXISTS).
BEGIN;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS written_off_date text;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS written_off_reason text;
COMMIT;

-- Rollback (only if the write-off code is NOT deployed; old code ignores these columns anyway).
-- Move any written-off watches back to a known stage first, or old code will show them as "Other":
-- UPDATE watches SET status = 'In Inventory' WHERE status = 'Written off';
-- ALTER TABLE watches DROP COLUMN written_off_date, DROP COLUMN written_off_reason;
