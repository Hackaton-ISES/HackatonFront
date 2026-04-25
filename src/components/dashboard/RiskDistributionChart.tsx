import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Tender } from "@/types/tender";

interface RiskDistributionChartProps {
  tenders: Tender[];
}

export function RiskDistributionChart({ tenders }: RiskDistributionChartProps) {
  const counts = tenders.reduce(
    (acc, t) => {
      acc[t.riskLevel]++;
      return acc;
    },
    { LOW: 0, MEDIUM: 0, HIGH: 0 } as Record<string, number>,
  );

  const data = [
    { name: "Low", value: counts.LOW, color: "hsl(var(--risk-low))" },
    { name: "Medium", value: counts.MEDIUM, color: "hsl(var(--risk-medium))" },
    { name: "High", value: counts.HIGH, color: "hsl(var(--risk-high))" },
  ].filter((d) => d.value > 0);

  const total = tenders.length;

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-elevation-sm">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Risk Distribution
        </h3>
        <span className="text-xs text-muted-foreground font-mono">{total} tenders</span>
      </div>
      <div className="h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono text-foreground">{counts.HIGH}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">High risk</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">
              {d.name} <span className="font-mono text-foreground font-medium">{d.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
