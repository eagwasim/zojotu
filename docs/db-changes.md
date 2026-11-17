# Database change log

**The app is live.** Every schema or data change made during the UX overhaul (see `ux-overhaul-plan.md`) is recorded here *before* it ships, along with how to apply it and how to roll it back.

## How schema changes are applied today
- There are two schemas to keep in step: `src/lib/db/schema-pg.ts` (production, Postgres) and `src/lib/db/schema-sqlite.ts` (local).
- No migration files are committed (`src/lib/db/migrations-*` don't exist). Changes have been applied with `npm run db:push`.
- **For the live database, prefer generated migrations.** Run `npm run db:generate` and review the SQL. Commit it, take a backup, then run `npm run db:migrate`. `push` can propose destructive diffs without a reviewable file.

## Rules for this overhaul
1. **Additive only.** New columns must be nullable or have a default, and new tables are fine. No renames, drops or type changes without a separate written plan.
2. **Deploy order:** apply the migration first, then deploy the code. The old code must keep working against the new schema.
3. **Back up before migrating** (e.g. `pg_dump`).
4. Add an entry below for every change, including settings stored as rows in `app_settings`.

---

## Entries

### Phase 0 + 1: Housekeeping and design system (branch `features/design-system`)
**No database changes.** This phase is UI only.

### Phase 2: Fast data entry (branch `features/fast-data-entry`): **must be applied before deploy**
| Change | Type | Live-safe? | Notes |
|---|---|---|---|
| `watches.asking_price` (real, nullable) | add column | yes | |
| `watches.listed_date` (text, nullable) | add column | yes | ISO date, like `acquisition_date`. Set automatically when a watch moves to Listed, and never overwritten once set. |
| `watches.listed_platform` (text, nullable) | add column | yes | |
| `watches.serial` (text, nullable) | add column | yes | |
| `watches.condition` (text, nullable) | add column | yes | New / Excellent / Very good / Good / Fair / For parts |
| `watches.primary_image_id` (integer, nullable) | add column | yes | Cover photo. No FK, to avoid a cycle with `watch_images`. Deleting the image clears it. |
| Platform fee % | `app_settings` row `platform_fees` = JSON `{"eBay":0.13}` | yes | Data only. Edited in Settings and written via `PUT /api/platform-fees`. |

**SQL:** `src/lib/db/manual-migrations/0001_watch_listing_fields.pg.sql` (Postgres, idempotent, in one transaction) and `.sqlite.sql` (local).

**How to apply to production (Postgres)**
1. Back up: `pg_dump "$DATABASE_URL" > backup-$(date +%F).sql`
2. Run: `psql "$DATABASE_URL" -f src/lib/db/manual-migrations/0001_watch_listing_fields.pg.sql`
3. Check: `psql "$DATABASE_URL" -c "\d watches"` should list the six new columns.
4. Only then deploy the phase 2 code. **Phase 2 code against an unmigrated database fails on every watch query**, because Drizzle selects the new columns.

The current production code ignores the new columns, so step 2 is safe to run while it serves traffic.

Avoid `npm run db:push` here. With no committed migration history, push diffs the whole schema and may propose unrelated changes. If you use it, read every statement before accepting.

**Local SQLite:** `node scripts/apply-sqlite-migration.mjs` (default `data/van_christaan.db`). It also adds `service_jobs.payment_information`, which older local files are missing.

**Rollback:** not needed for old code, which ignores the columns. The drop statements are commented at the bottom of the `.pg.sql` file.

**Backfill:** none. Watches that were already Listed show "Not set" for asking price until one is entered, and their listed date stays empty until they are re-listed or edited.

### Write-offs: watches broken beyond repair: **must be applied before deploy**
| Change | Type | Live-safe? | Notes |
|---|---|---|---|
| `watches.written_off_date` (text, nullable) | add column | yes | ISO date. Set when a watch is written off; the loss lands in this date's period. Cleared on restore. |
| `watches.written_off_reason` (text, nullable) | add column | yes | Free text, e.g. "Cracked balance staff, no parts". |
| New status value `Written off` | data only | yes | `status` is plain text, so no constraint changes. The watch's cost basis (purchase + parts) counts as a loss in net profit. |

**SQL:** `src/lib/db/manual-migrations/0002_watch_write_off.pg.sql` (Postgres, idempotent, in one transaction) and `.sqlite.sql` (local).

**How to apply to production (Postgres)**
1. Back up: `pg_dump "$DATABASE_URL" > backup-$(date +%F).sql`
2. Run: `psql "$DATABASE_URL" -f src/lib/db/manual-migrations/0002_watch_write_off.pg.sql`
3. Check: `psql "$DATABASE_URL" -c "\d watches"` should list `written_off_date` and `written_off_reason`.
4. Only then deploy. **The new code against an unmigrated database fails on every watch query**, because Drizzle selects the new columns.

**Local SQLite:** `node scripts/apply-sqlite-migration.mjs`.

**Rollback:** not needed for old code, which ignores the columns. If you do roll back the code, first move written-off watches to another status (see the bottom of the `.pg.sql` file), otherwise old code shows them in stock as "Other".

**Backfill:** none.
