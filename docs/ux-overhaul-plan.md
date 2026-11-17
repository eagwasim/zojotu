# UX / UI Overhaul Plan

_Drafted 2026-11-17. Scope: the operator app (`src/app/(app)`). The customer portal is out of scope for now, but it reuses the same design tokens, so it picks up phase 1 changes for free._

## 0. Decisions (2026-11-17)
| Question | Answer | Effect on the plan |
|---|---|---|
| Brand direction | Light "paper and ink"; no existing brand colours | Phase 1 builds a light theme first. Dark mode is deferred. |
| Fee model | A flat % per platform is fine | Stored as an `app_settings` row, not a new table (see `db-changes.md`). |
| Asking price and listing date | Yes, track them | Phase 2 schema additions go ahead. |
| Service business | Complementary to reselling | The dashboard leads with reselling; service is a secondary tab or section. |
| Device | Mostly desktop, sometimes phone | Desktop density comes first; layouts must still work on a phone. |

**The app is live.** Every database change is logged in [`db-changes.md`](./db-changes.md) before it ships.

### Found during Phase 1: profit excluded fees
`getDashboardKPIs` (`src/lib/queries/dashboard.ts`) computes gross profit, net profit, margin, return on cost, monthly profit and brand profit as **sale price − (purchase cost + parts)**. It never subtracts `platformFee` or `shippingInsurance`. Only the per-platform figures deduct them, so headline profit is overstated by total fees. **Fixed (approved by the owner on 2026-11-17):** all of these figures now use one helper, `src/lib/profit.ts` (profit = sale price − fees − shipping − cost basis), which the watch page also uses. Covered by `src/__tests__/unit/dashboard-kpis.test.ts`. Headline profit numbers will drop by the total fees once deployed. This is expected.

## 1. What's wrong today

### Forms are tedious
- **The watch is the centre of the business, but you can't act on it from its page.** `inventory/[id]` only shows data. To add a part you go to **Parts & Mods**, open a dialog, and search for the watch you were already looking at in a combobox. Recording a sale works the same way.
- **Nothing is remembered.** Every form starts empty: today's date, your usual source/supplier/platform, and the last brand/movement all get typed again.
- **Free text where the data repeats.** `source`, `supplier` and `brand` are plain inputs, so you retype them and end up with variants like "ebay", "eBay" and "Ebay", which also splits the dashboard numbers.
- **Status is managed separately from what actually happened.** A sale doesn't feel like the moment a watch becomes "Sold". Listing a watch has no asking price or listing date.
- **Sale fees are worked out by hand.** Platform fee and shipping are manual numbers even though each platform's fee is mostly a fixed %. You also don't see the expected profit while you type the price.
- **Dialog-only, mouse-heavy workflow.** There's no keyboard shortcut to add something, no "save & add another", no inline edit, and no bulk status change.
- Forms use uncontrolled `FormData` with server-only validation, so errors appear as a toast after submit instead of next to the field.

### The dashboard doesn't inform
- **It's a wall of equal-weight numbers.** There are about 22 KPI tiles and 8 charts in 5 sections, with no hierarchy and no answer to *"how am I doing, and what should I do next?"*
- **No comparison anywhere.** Nothing like "vs previous period", no trend arrows, no sparklines, so a number alone means little.
- **It isn't actionable.** Stagnating inventory is a passive list, and nothing highlights "listed for 60+ days, consider a price drop", "in Modding for 30 days", or "capital tied up".
- **Chart issues** (checked against the dataviz skill's anti-patterns):
  - `platform-chart.tsx` is a **dual-axis** chart ($ bars plus a margin % line). This is the #1 anti-pattern and must be split.
  - It uses dashed gridlines (`strokeDasharray="3 3"`) and colors hard-coded as OKLCH literals in every component, so they don't follow the theme tokens.
  - The palette has never been validated for colorblind safety, and status colors like `green-500` are mixed in with series colors.
  - Revenue, Profit and Fees are shown as three side-by-side bars per platform when the real story is margin. Margin should be the primary measure.
  - Pie/donut charts are likely used for brand and status distribution, which are better as ranked bars or a single segmented bar.
- **Metric definitions are opaque.** ROI uses COGS-only gross profit, net profit subtracts opex, and "Combined" mixes watch and service profit. None of this is explained on screen.
- **No capital view.** What a flipper most needs is _cash tied up in stock_, _aging buckets_, _expected profit on listed stock_, and _realised vs unrealised_. None of these exist.

### The UI looks generic
- It's a stock shadcn dark theme with a gold primary, Geist font, and `framer-motion` fades on every page and row (the fades on table rows are distracting).
- Every page is the same template: H1, subtitle, filter card, table, dialog.
- Tables are text only. There are **no photos in the list** even though `watch_images` exists, and for watches the photo *is* the identity.
- The nav has 9 flat items, and two of them use the same `Wrench` icon. Watch reselling and the service business are mixed together.
- Spinners are used instead of skeletons. Empty states are generic, and there's no mobile layout (the sidebar is fixed at `w-60`).
- No light mode, and no consistent type scale for numbers (no tabular figures).

### Polish audit (quick pass, using the `make-interfaces-feel-better` rules)
| Severity | Where | Issue | Fix |
|---|---|---|---|
| HIGH | `components/ui/dialog.tsx` | No `role="dialog"`/`aria-modal`, no focus trap, no Escape to close. The close button has no `aria-label`. | Rebuild on `@base-ui/react` Dialog (already a dependency), which handles all of this. |
| HIGH | Inventory/Sales/Parts row actions (`p-1.5` + `h-4` icon ≈ 28px) | Hit areas are under the 40px minimum, and the Edit and Delete buttons sit next to each other. | 40px targets. Move destructive actions into a row menu. |
| MEDIUM | 28 files use `motion.*`, every table row fades in, `AnimatePresence` is used without `initial={false}` | Animating high-frequency events costs attention on every page load and filter change. | Motion restraint: no row or page fades. Use `initial={false}`. |
| MEDIUM | All money and number cells (`font-mono` on cost, KPI tiles) | Proportional digits shift as values change, and monospace looks like code. | `tabular-nums` on the sans font. |
| MEDIUM | `components/ui/button.tsx` | `focus:` rings show on mouse click. There's no press feedback. | `focus-visible:` and `active:scale-[0.96] transition-transform`. |
| MEDIUM | `Card`, KPI tiles, table wrappers | 1px borders on every surface create depth by border only, so the page looks flat and gridded. | Layered soft shadows for elevation. Keep borders for real dividers. |
| LOW | Dialog spring (`damping 25`) bounces; exit mirrors enter | Exits should be softer than enters. | `bounce: 0`, a small `translateY` on exit. |
| LOW | Card `rounded-xl p-6` with `rounded-lg` icon chip | Corners aren't concentric (outer radius should equal inner radius plus padding). | Use one radius scale derived from padding. |
| LOW | Headings | No `text-wrap: balance`. | Add it globally to `h1`–`h3`. |

## 2. Guiding principles
1. **The watch is the hub.** Everything that happens to a watch (parts, images, listing, sale) is done from its page.
2. **Never ask for what we already know.** Use defaults, memory, autocomplete and derived values.
3. **The dashboard answers questions.** Start with a few hero numbers plus a comparison, then items needing action, then supporting charts.
4. **Quiet, premium, watch-trade aesthetic.** Use restraint, photography first, tabular numbers, and one accent color.
5. **Charts follow the dataviz method.** Pick the form first, validate the palette, never use dual axes, add hover tooltips, and offer a table view.
6. **One system** (taken from `design-taste-frontend`'s anti-slop rules):
   - One button pair, one card style, one radius scale, one link style.
   - Containers nest two levels deep at most.
   - Headings name things ("Stock on hand", not "Combined Totals").
   - Buttons are a verb plus an object ("Record sale").
   - Each error appears under its own field.

### How the skills map to this plan
| Skill | Used for | Not used for |
|---|---|---|
| `dataviz` | All dashboard and chart work in phase 3: form choice, validated palette, marks, tooltips, table views | n/a |
| `make-interfaces-feel-better` | Phase 1 primitives and the phase 4 polish pass. Run it in `full` review mode at the end of each phase. | n/a |
| `design-taste-frontend` | Its one-system, copy, accessibility and tap-size rules | Its house rules (one section per screen, hero entrances, photo moments, browser gate), which are written for marketing sites, not a dense internal tool |
| `stageshow` | **Phase 1.5 design previews**: still or animated mock-ups of the new Watch page and Record-sale flow, so you can approve the direction before any production code. Useful starting examples: `table-edit`, `form-error`, `chart-scrub`, `loading`. | Building the real app; it produces illustrations, not working screens |

## 3. Phased plan

### Phase 0: Housekeeping (½ day)
- Revert the stray leading whitespace before `"use client"` in `src/app/(app)/inventory/page.tsx` (currently uncommitted).
- Finish and merge the current `features/inventory-serverside-pagination` branch before starting the redesign.
- Read `node_modules/next/dist/docs/` for this Next 16 version before touching routing or data loading (as `AGENTS.md` requires).

### Phase 1: Design system foundation (2–3 days) ✅ built on `features/design-system`
_Everything else builds on this, so it comes first._
- **Tokens** (`globals.css`):
  - New neutral scale (a warm graphite instead of blue-tinted).
  - One accent color, kept from the gold but desaturated and used only for primary actions and focus.
  - Separate **status tokens** (good/warning/serious/critical) and **chart tokens**.
  - Add a light theme as its own set of tokens, not an automatic inversion.
- **Type:**
  - A display face for headings (e.g. a refined serif or grotesk) plus Geist for UI.
  - `font-variant-numeric: tabular-nums` on all money and number cells.
  - A defined scale: display / h1 / h2 / body / caption.
- **Chart palette:** derive 5 categorical slots, 1 sequential ramp and a diverging pair (profit vs loss). **Run `validate_palette.js`** in both dark and light mode against the real surfaces and commit the result to `src/lib/chart-theme.ts`. All charts import from there, with no inline OKLCH.
- **Motion:** remove the per-row and per-page `framer-motion` fades. Keep motion for dialogs, drawers and toasts only.
- **Primitives to add or upgrade** (`src/components/ui`):
  - `Sheet` (side drawer)
  - `Skeleton`
  - `EmptyState`
  - `StatTile` (value + delta + sparkline)
  - `DataTable` (sortable, selectable rows, sticky header, density toggle)
  - `CurrencyInput` (formatted, right-aligned)
  - `DateInput` (defaults to today, quick picks)
  - `CreatableCombobox` (autocomplete from previous values, create new inline)
  - `Kbd`
  - `CommandPalette`
- **Layout:**
  - Group the sidebar into **Stock** (Dashboard, Inventory, Sales, Parts), **Workshop** (Services, Catalog, Customers) and **Business** (Expenses, Settings).
  - Give every item a distinct icon.
  - Make the sidebar collapsible, with a mobile bottom bar or drawer.

- **Polish baseline:** fix every row in the polish audit above as part of building the primitives (Dialog rebuilt on base-ui, button focus and press states, `tabular-nums`, hit areas, shadow-based elevation, concentric radii).

### Phase 1.5: Design previews with `stageshow` (1 day, optional but recommended)
- Build 3 mock-ups using the new tokens:
  1. **Watch page** (still, realistic fidelity): hero photo, status stepper, cost basis, ask and expected profit.
  2. **Record sale** (animated): the fee auto-fills, and profit and margin update as the price is typed (based on `table-edit` and `form-error`).
  3. **Dashboard hero** (still): 4 stat tiles plus the "needs attention" list (based on `chart-scrub`).
- Each must pass `stageshow`'s `--gate` rehearsal. You review them, and we adjust tokens and layout before phases 2–4 commit to them.

### Phase 2: Make data entry fast (3–4 days) 🚧 on `features/fast-data-entry` (stacked on phase 1)
_Highest day-to-day payoff._
- **Watch page becomes the workspace** (`inventory/[id]`):
  - Header with hero photo, brand/model, status stepper (Acquired → Modding → Listed → Sold), and live **cost basis / ask / expected profit**.
  - Tabs or sections: Overview · Parts & Mods · Photos · Sale.
  - Inline "Add part" row: description, category, cost. Watch and date are prefilled.
  - "Mark as listed" sets asking price, platform and listed date.
  - "Record sale" opens a sheet prefilled with the watch and the listing platform. Saving it sets status to Sold automatically.
- **Smart defaults and memory:**
  - Dates default to today.
  - Source, supplier, platform and brand become `CreatableCombobox` fields fed by distinct existing values. Add a `GET /api/suggestions?field=` endpoint, or extend the existing queries.
  - Remember the last-used category and supplier for the session.
- **Derived fields:**
  - Store fee % per platform in **Settings**.
  - The sale form auto-calculates the platform fee from the price (editable) and shows a live breakdown: price − fees − shipping − cost basis = **profit / margin**.
- **Quick add:**
  - `N` opens "Add watch" from anywhere.
  - `⌘K` opens a command palette (jump to a watch by name or reference, run actions).
  - "Save & add another" on the add-watch and add-part forms.
- **Inline and bulk actions in the inventory table:** inline status change, multi-select → change status, export CSV.
- **Validation:**
  - Move to controlled forms validated client-side with the existing zod schemas (`src/lib/validators/*`), so errors appear next to each field as you type or leave a field.
  - The server keeps validating with the same schemas.
- **Schema additions** (drizzle migration, both pg and sqlite schemas):
  - `watches`: `askingPrice`, `listedDate`, `listedPlatform`, `serial`, `condition`, `primaryImageId`.
  - Platform fee %: one `app_settings` row (`platform_fees`, JSON). No new table.
- **Phase 2 stretch:** paste or drop photos directly on the add-watch form, and duplicate a watch as a template.

### Phase 3: A dashboard that informs (3–4 days)
Rebuild `dashboard/page.tsx` around 3 questions, using a pinned period control with comparison to the previous period:

1. **"How am I doing?"** A hero row of 4 `StatTile`s, each with Δ vs the previous period and a 12-month sparkline:
   - Net profit
   - Revenue
   - Avg margin
   - Watches sold

   Everything else moves to a "More metrics" disclosure or the drill-down pages.
2. **"Where is my money?"** A capital panel:
   - Cash tied up in stock (cost basis of unsold watches)
   - A single segmented bar by status (In stock / Modding / Listed)
   - Expected profit on listed stock (ask − cost basis − estimated fees)
   - **Aging buckets** (0–30 / 31–60 / 61–90 / 90+ days) as an ordinal sequential bar.
3. **"What needs attention?"** An **action list**, clickable through to the watch:
   - Listed for more than N days → consider a price drop
   - In Modding for more than N days
   - Unpaid or overdue service jobs
   - Pending service requests

**Chart rework** (apply the dataviz procedure to each):

| Current | Replace with |
|---|---|
| `profit-chart` (monthly) | One line or bar chart of monthly profit with a hover crosshair. Revenue goes in the tooltip, not on a second scale. |
| `platform-chart` (dual axis) | **Two charts**: ranked horizontal bars of profit by platform, plus a margin % dot plot. Or a table with inline bars. |
| `brand-profit-chart` | Ranked horizontal bars, one color, top 8 + "Other". |
| `brand-distribution` / `inventory-status` | A segmented bar or ranked bars. No pies. |
| `time-to-sell-chart` | Histogram with ordinal ramp, median marked. |
| `margin-insights`, `sales-velocity-cards` | Merge into the hero tiles and the action list. |

- Every chart gets hover tooltips, a "view as table" toggle, an empty state that explains *how to get data* (e.g. "Record your first sale"), and a skeleton loader.
- Hovering an info icon shows the **definition** of each metric (ROI, net vs gross, cost basis).
- Split **Watch business** and **Service business** into tabs on the dashboard, plus an "All" combined view, instead of stacking everything on one page.
- Backend (`src/lib/queries/dashboard.ts`):
  - Add `previousPeriod` figures, monthly sparkline series, a capital/aging breakdown and action items.
  - Move the heavy in-JS aggregation into SQL where practical.
  - Extend `dashboard-computations.test.ts` to cover the new numbers.

### Phase 4: Polish the rest of the app (2–3 days)
- **Inventory list:**
  - Thumbnail column and card/grid view toggle.
  - Sortable columns.
  - Show cost basis (base + parts), days in stock and asking price instead of Movement/Source.
  - Status filter as segmented tabs with counts.
- **Sales, Parts, Expenses:** same `DataTable`, with period totals in a summary strip above each table.
- **Services:** kanban-style board by status as an alternative to the table, since it's a pipeline.
- Skeletons everywhere, purposeful empty states, consistent page headers with primary action on the right.
- Responsive pass for phone use, which matters because you'll often be adding parts at the bench.
- Accessibility pass: focus rings, labels, contrast, keyboard navigation in dialogs and tables.
- Run `make-interfaces-feel-better` in `full` review mode over `src/components/ui` and every page. The phase is done when its verdict is `Approve`.

### Phase 5: Verify
- Unit tests for new derived values (fees, expected profit, aging, period deltas).
- Integration tests for new or changed API routes (`src/__tests__/integration`).
- Use the `run` skill to launch the app and screenshot each redesigned page in dark and light mode. Eyeball the charts for label collisions (step 7 of the dataviz procedure).
- Run `/code-review` on each phase's PR.

## 4. Suggested order and size

| # | Phase | Est. | Why this order |
|---|---|---|---|
| 0 | Housekeeping | ½ d | Clean base |
| 1 | Design system | 2–3 d | Everything else reuses it |
| 1.5 | Stageshow previews | 1 d | Agree on the look before building it everywhere |
| 2 | Fast data entry | 3–4 d | Biggest daily pain |
| 3 | Dashboard | 3–4 d | Depends on new fields (asking price, listed date) from phase 2 |
| 4 | App-wide polish | 2–3 d | Applies phase 1 primitives everywhere |
| 5 | Verify | ongoing | Per-phase |

Ship each phase as its own PR off `main`.

## 5. Open questions for you
1. **Brand direction:** keep dark-first with gold, or go for a lighter "paper and ink" look? Do you have a logo or brand colors? (The sidebar says "Zojotu", the repo is VanChristaan.)
2. **Fee model:** is a flat % per platform accurate enough, or do some platforms have fixed fees or tiers?
3. **Asking price and listing date:** do you want to track these? Phase 3's "expected profit" and "listed too long" alerts depend on them.
4. **Service business weight:** is it a side line or equal to reselling? This decides whether it gets a dashboard tab or equal billing.
5. **Device:** do you mostly use this on desktop, or also on your phone at the bench?
