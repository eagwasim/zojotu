-- 0001: watch listing & identity fields (UX overhaul phase 2). See docs/db-changes.md.
-- Additive and nullable: safe to run while the current app version is serving traffic.
-- Apply BEFORE deploying the phase 2 code. Idempotent (IF NOT EXISTS).
BEGIN;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS asking_price real;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS listed_date text;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS listed_platform text;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS serial text;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS condition text;
ALTER TABLE watches ADD COLUMN IF NOT EXISTS primary_image_id integer;
COMMIT;

-- Rollback (only if the phase 2 code is NOT deployed; old code ignores these columns anyway):
-- ALTER TABLE watches DROP COLUMN asking_price, DROP COLUMN listed_date, DROP COLUMN listed_platform,
--   DROP COLUMN serial, DROP COLUMN condition, DROP COLUMN primary_image_id;
