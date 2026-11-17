import type { WatchRecord } from "@/components/watches/watch-form-sheet";
import { isoDate } from "@/components/ui/date-input";

const COLUMNS: { header: string; value: (w: WatchRecord) => string | number | null | undefined }[] = [
  { header: "Brand", value: (w) => w.brand },
  { header: "Model", value: (w) => w.model },
  { header: "Reference", value: (w) => w.reference },
  { header: "Serial", value: (w) => w.serial },
  { header: "Movement", value: (w) => w.movementType },
  { header: "Condition", value: (w) => w.condition },
  { header: "Status", value: (w) => w.status },
  { header: "Acquisition date", value: (w) => w.acquisitionDate },
  { header: "Source", value: (w) => w.source },
  { header: "Base cost", value: (w) => w.baseCost },
  { header: "Asking price", value: (w) => w.askingPrice },
  { header: "Listed date", value: (w) => w.listedDate },
  { header: "Listed platform", value: (w) => w.listedPlatform },
  { header: "Notes", value: (w) => w.notes },
];

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  // Spreadsheets run text starting with these as formulas; a leading quote keeps it as text.
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function watchesToCsv(watches: WatchRecord[]): string {
  const lines = [
    COLUMNS.map((c) => cell(c.header)).join(","),
    ...watches.map((w) => COLUMNS.map((c) => cell(c.value(w))).join(",")),
  ];
  return lines.join("\r\n");
}

/** Download watches as `watches-YYYY-MM-DD.csv`. The BOM makes Excel read € and accents correctly. */
export function downloadWatchesCsv(watches: WatchRecord[]) {
  const blob = new Blob(["﻿", watchesToCsv(watches)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `watches-${isoDate()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
