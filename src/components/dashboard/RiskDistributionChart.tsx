import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SuspicionStats } from "@/types/tender";

interface RiskDistributionChartProps {
  stats: SuspicionStats;
}

export function RiskDistributionChart({ stats }: RiskDistributionChartProps) {
  const data = [
    { name: "Past", value: stats.low, color: "hsl(var(--risk-low))" },
    { name: "O'rta", value: stats.medium, color: "hsl(var(--risk-medium))" },
    { name: "Yuqori", value: stats.high, color: "hsl(var(--risk-high))" },
  ].filter((entry) => entry.value > 0);

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-elevation-sm animate-fade-in">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Shubha taqsimoti
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {stats.totalAnalyzedCompanies} ta tahlil qilingan
        </span>
      </div>

      <div className="relative h-[20rem] sm:h-[22rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={78}
              outerRadius={122}
              paddingAngle={3}
              dataKey="value"
              stroke="hsl(var(--card))"
              strokeWidth={3}
              isAnimationActive
              animationBegin={150}
              animationDuration={950}
              animationEasing="ease-out"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value}`, "Kompaniyalar"]}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Yuqori shubha
          </span>
          <span className="mt-1 text-5xl font-bold font-mono text-foreground sm:text-6xl">{stats.high}</span>
          <span className="mt-1 text-xs text-muted-foreground">
            jami {stats.total} ta kompaniyadan
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">
              {entry.name} <span className="font-mono font-medium text-foreground">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
