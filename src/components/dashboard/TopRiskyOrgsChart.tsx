import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Tender } from "@/types/tender";

interface TopRiskyOrgsChartProps {
  tenders: Tender[];
}

export function TopRiskyOrgsChart({ tenders }: TopRiskyOrgsChartProps) {
  const byOrg = new Map<string, { total: number; count: number }>();
  tenders.forEach((t) => {
    const cur = byOrg.get(t.organization) ?? { total: 0, count: 0 };
    cur.total += t.riskScore;
    cur.count += 1;
    byOrg.set(t.organization, cur);
  });

  const data = Array.from(byOrg.entries())
    .map(([org, { total, count }]) => ({
      org: org.replace(/^(Ministry of |Department of |City )/, ""),
      fullOrg: org,
      avg: Math.round(total / count),
      count,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const colorFor = (avg: number) =>
    avg >= 70 ? "hsl(var(--risk-high))" : avg >= 40 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-low))";

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-elevation-sm">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Eng xavfli tashkilotlar
        </h3>
        <span className="text-xs text-muted-foreground">O'rtacha xavf bali</span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="org"
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(v: number) => [`${v}`, "O'rtacha xavf"]}
              labelFormatter={(_, p) => p?.[0]?.payload?.fullOrg ?? ""}
            />
            <Bar dataKey="avg" radius={[0, 6, 6, 0]} barSize={18}>
              {data.map((d, i) => (
                <Cell key={i} fill={colorFor(d.avg)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
