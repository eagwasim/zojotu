/** Dashboard period presets. The selection lives in the URL (?period=90d or ?period=custom&from&to). */
export type PeriodKey = "30d" | "90d" | "ytd" | "12m" | "all" | "custom";

export const PERIODS: { key: Exclude<PeriodKey, "custom">; label: string }[] = [
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "ytd", label: "Year to date" },
  { key: "12m", label: "12 months" },
  { key: "all", label: "All time" },
];

export const DEFAULT_PERIOD: PeriodKey = "90d";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Resolve a preset to an inclusive local-date range; `null` = all time. */
export function rangeFor(key: PeriodKey, today = new Date(), custom?: { from?: string | null; to?: string | null }) {
  const to = iso(today);
  const back = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1));
    return iso(d);
  };
  switch (key) {
    case "30d":
      return { from: back(30), to };
    case "90d":
      return { from: back(90), to };
    case "ytd":
      return { from: `${today.getFullYear()}-01-01`, to };
    case "12m": {
      const d = new Date(today);
      d.setFullYear(d.getFullYear() - 1);
      d.setDate(d.getDate() + 1);
      return { from: iso(d), to };
    }
    case "custom":
      return custom?.from && custom?.to && custom.from <= custom.to ? { from: custom.from, to: custom.to } : null;
    case "all":
    default:
      return null;
  }
}

/** "the previous 90 days" etc., for "vs …" labels. */
export function comparisonLabel(range: { from: string; to: string } | null) {
  if (!range) return undefined;
  const days =
    Math.round((Date.parse(range.to + "T00:00:00Z") - Date.parse(range.from + "T00:00:00Z")) / 86_400_000) + 1;
  return `vs previous ${days} days`;
}
