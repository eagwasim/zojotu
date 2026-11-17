/**
 * Chart palette and chrome. Mirrors the tokens in `src/app/globals.css`.
 * Recharts writes these into SVG attributes, so they are plain hex rather than CSS vars.
 *
 * Categorical slots are the dataviz reference order, validated against the card surface
 * (#fdfcfa) with validate_palette.js: every hard gate passes (worst adjacent CVD ΔE 9.1,
 * normal-vision ΔE 19.6). Slots 3, 4 and 5 sit below 3:1 contrast, so charts that use
 * them must carry visible labels or a table view.
 *
 * Rules: assign slots in order and never cycle (fold extras into "Other"); colour follows
 * the entity, not its rank; text never wears a series colour.
 */
export const series = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#6250d6", // 7 violet
  "#e34948", // 8 red
] as const;

export const MAX_SERIES = series.length;

/** Single-hue blue ramp for ordered buckets (light → dark). Light end clears 2:1 on the card. */
export const ordinalBlue = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"] as const;

export const chrome = {
  surface: "#fdfcfa",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  tick: "#6b675f",
  ink: "#1a1917",
  muted: "#6b675f",
  other: "#b9b4a9",
} as const;

/** Shared axis props: hairline baseline, no tick marks, muted labels. */
export const axisProps = {
  stroke: chrome.axis,
  tickLine: false,
  tick: { fill: chrome.tick, fontSize: 12 },
} as const;

/** Horizontal-only hairline grid; never dashed. */
export const gridProps = {
  stroke: chrome.grid,
  vertical: false,
} as const;

const compactEuro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});
const fullEuro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Axis tick money: in full under 10,000, compact above. */
export function formatAxisEuro(value: number) {
  return Math.abs(value) >= 10_000 ? compactEuro.format(value) : fullEuro.format(value);
}

/** "2026-03" → "Mar 26" */
export function formatMonthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1).toLocaleDateString("en-IE", { month: "short", year: "2-digit" });
}

/**
 * Keep the first (MAX_SERIES - 1) items and fold the rest into "Other",
 * so we never run out of distinguishable colours.
 */
export function foldOther<T>(
  items: T[],
  getValue: (item: T) => number,
  makeOther: (total: number, count: number) => T,
  max = MAX_SERIES
): T[] {
  if (items.length <= max) return items;
  const head = items.slice(0, max - 1);
  const tail = items.slice(max - 1);
  return [...head, makeOther(tail.reduce((s, i) => s + getValue(i), 0), tail.length)];
}
