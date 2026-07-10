import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  "In Inventory": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Modding: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Listed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Sold: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusColors[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
      )}
    >
      {status}
    </span>
  );
}
