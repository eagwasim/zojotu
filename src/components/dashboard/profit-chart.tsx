"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { axisProps, chrome, formatAxisEuro, formatMonthLabel, gridProps, series } from "@/lib/chart-theme";
import type { MonthPoint } from "@/lib/dashboard/compute";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-tooltip";

const LOSS = "#d03b3b"; // status: critical. A loss month means something.

function MonthTooltip({ active, payload }: { active?: boolean; payload?: { payload: MonthPoint }[] }) {
  if (!active || !payload?.length) return null;
  const m = payload[0].payload;
  const rows: [string, number][] = [
    ["Revenue", m.revenue],
    ["Fees & shipping", -m.fees],
    ["Cost of watches sold", -m.cogs],
    ["Operating expenses", -m.opex],
    ...(m.writeOffs ? [["Written off", -m.writeOffs] as [string, number]] : []),
  ];
  return (
    <div className="min-w-52 rounded-lg bg-popover px-3 py-2.5 text-xs shadow-raised">
      <p className="mb-1.5 font-medium text-foreground">{formatMonthLabel(m.month)}</p>
      <p className="mb-1.5 text-base font-semibold tabular-nums text-foreground">
        {formatCurrency(m.netProfit)} <span className="text-xs font-normal text-muted-foreground">net profit</span>
      </p>
      <dl className="flex flex-col gap-0.5 tabular-nums">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-foreground">{formatCurrency(v || 0)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 pt-1">
          <dt className="text-muted-foreground">Watches sold</dt>
          <dd className="text-foreground">{m.sold}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Net profit per month. One series; loss months are marked. Revenue and costs live in the tooltip and table. */
export function ProfitChart({ data }: { data: MonthPoint[] }) {
  const hasData = data.some((m) => m.revenue || m.opex || m.writeOffs);
  return (
    <ChartCard
      title="Net profit by month"
      description="Watch sales after fees, shipping, cost, operating expenses and write-offs."
      table={{
        columns: [
          { key: "month", label: "Month" },
          { key: "sold", label: "Sold", align: "right" },
          { key: "revenue", label: "Revenue", align: "right" },
          { key: "costs", label: "Fees, cost, expenses & write-offs", align: "right" },
          { key: "net", label: "Net profit", align: "right" },
        ],
        rows: data.map((m) => ({
          month: formatMonthLabel(m.month),
          sold: m.sold,
          revenue: formatCurrency(m.revenue),
          costs: formatCurrency(m.fees + m.cogs + m.opex + m.writeOffs),
          net: formatCurrency(m.netProfit),
        })),
      }}
    >
      {!hasData ? (
        <ChartEmpty height={280}>No sales or expenses in this period.</ChartEmpty>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="month" {...axisProps} tickFormatter={formatMonthLabel} minTickGap={12} />
            <YAxis {...axisProps} axisLine={false} tickFormatter={formatAxisEuro} width={64} />
            <ReferenceLine y={0} stroke={chrome.axis} />
            <Tooltip cursor={{ fill: chrome.grid, fillOpacity: 0.4 }} content={<MonthTooltip />} />
            <Bar dataKey="netProfit" name="Net profit" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
              {data.map((m) => (
                <Cell key={m.month} fill={m.netProfit < 0 ? LOSS : series[0]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
