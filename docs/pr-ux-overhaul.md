**Title:** UX overhaul: paper & ink design system, fast data entry, net-of-fees profit

> ⚠️ **Run DB migration 0001 on production BEFORE deploying.** Without it, every watch query fails. Steps are below and in `docs/db-changes.md`.

## Summary
Phases 0–2 of `docs/ux-overhaul-plan.md`, in three commits:

1. **Design system and UI pass** (`c5afd53`)
   - **Theme:** light "paper & ink" palette with a validated chart palette and reserved status colours.
   - **Components:** rebuilt on Base UI, so dialogs trap focus, close with Escape and have proper ARIA roles.
   - **Navigation:** grouped, collapsible sidebar, a mobile drawer, and a ⌘K command palette.
   - **Dashboard:** charts reworked (no dual axis, no donuts, € axes) and every metric has a definition.
   - **Clean-up:** all pages and the customer portal moved off hard-coded dark colours and per-row animations.
2. **Profit fix** (`68f7796`): dashboard gross/net profit, margin, return on cost, monthly profit and brand profit now deduct platform fees and shipping. One shared helper (`src/lib/profit.ts`) is used by both the dashboard and the watch page. **Headline profit drops by total fees after deploy. This is expected.**
3. **Fast data entry** (`d5c6306`)
   - **Watch page workspace:** stage stepper, photo upload, inline parts, mark as listed with expected profit, and record sale.
   - **Forms:** side-sheet forms with autocomplete from previous values, today's date by default, € inputs, per-field errors, and "Save & add another".
   - **Fees:** a per-platform fee % (Settings) that fills in the fee on a sale.
   - **Shortcuts:** N / ⌘K to add a watch from anywhere.
   - **Inventory list:** bulk stage change, an inline stage menu, and CSV export.

## Database
Six nullable columns on `watches`: `asking_price`, `listed_date`, `listed_platform`, `serial`, `condition`, `primary_image_id`. Platform fees are stored as an `app_settings` row (data only, no schema change).

1. `pg_dump "$DATABASE_URL" > backup-$(date +%F).sql`
2. `psql "$DATABASE_URL" -f src/lib/db/manual-migrations/0001_watch_listing_fields.pg.sql`
3. `psql "$DATABASE_URL" -c "\d watches"` should list the six new columns.
4. Deploy this branch.

The migration is additive and idempotent, and it is safe to run while the current version is live (the old code ignores the new columns). It was verified against Postgres (PGlite) and SQLite. Avoid `db:push`: there is no migration history, so it diffs the whole schema.

Local SQLite: `node scripts/apply-sqlite-migration.mjs`. This also adds `service_jobs.payment_information`, which older local files are missing.

## Fixes and hardening
- Validated PUT bodies for watches, sales, parts and expenses. They previously wrote the raw request body. The sale update schema has no defaults, so a partial edit can't zero a saved fee.
- Images: delete is now admin-only (before, any logged-in user, including portal customers, could delete). Uploads are limited to JPEG/PNG/WebP up to 15 MB, and the file extension is derived from the MIME type.
- `updated_at` now uses SQL `CURRENT_TIMESTAMP`. JS `Date` can't bind on SQLite, which broke watch edits and recording sales in local dev. Postgres behaviour is unchanged.

## Known follow-ups (not in this PR)
- **Unvalidated PUTs:** service-catalog, service-job and user PUT routes still accept unvalidated bodies.
- **Customer API access:** portal customers can read `GET /api/watches` and `GET /api/images`. Only the pages are restricted.
- **Photo storage:** photos are stored in `data/images` on local disk. They need a persistent volume in Docker, or they're lost on redeploy.

## Test plan
- [x] `tsc --noEmit` is clean and `next build` passes.
- [x] `vitest`: 69 tests pass, including new tests that run `getDashboardKPIs` against a mocked DB, the profit helpers, and the phase 2 validators (partial updates, bulk status never Sold, fee parsing).
- [x] ESLint: 104 errors on this branch vs 118 on `main`. No new errors.
- [x] API checks against a seeded local DB:
  - validation 400s
  - a status-only update keeps notes
  - the listed date is stamped once and never overwritten
  - bulk status skips sold watches
  - recording a sale marks the watch Sold, with the correct profit
  - non-image uploads are rejected
  - a customer gets 403 on image delete
- [x] Clicked through in headless Chrome:
  - dashboard, inventory, and the watch page at 1440 px and 390 px
  - record sale with auto-filled fee and live profit
  - inline stage menu, bulk bar, and the N shortcut
  - the Settings fees card
- [ ] Owner: run the migration on staging/production and click through Inventory → a watch → Mark as listed → Record sale.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
