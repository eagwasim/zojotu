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

### Phase 2: Fast data entry (planned, not yet built)
| Change | Type | Live-safe? | Notes |
|---|---|---|---|
| `watches.asking_price` (real, nullable) | add column | yes | |
| `watches.listed_date` (text, nullable) | add column | yes | ISO date, same format as `acquisition_date` |
| `watches.listed_platform` (text, nullable) | add column | yes | |
| `watches.serial` (text, nullable) | add column | yes | Optional |
| `watches.condition` (text, nullable) | add column | yes | Optional |
| `watches.primary_image_id` (integer, nullable) | add column | yes | No FK constraint, to avoid cycles with `watch_images` |
| Platform fee % | `app_settings` row (`platform_fees` = JSON `{ "eBay": 0.13, ... }`) | yes | Data only, no schema change |

Backfill: none required. Existing "Listed" watches will show "no asking price" until one is entered.
Rollback: the columns are unused by older code and can be left in place.
