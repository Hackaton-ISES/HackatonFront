import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "high" | "medium" | "low";
}

const accentStyles = {
  default: "text-foreground",
  high: "text-risk-high",
  medium: "text-risk-medium",
  low: "text-risk-low",
};

export function StatCard({ label, value, hint, accent = "default" }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-elevation-sm transition-all hover:shadow-elevation-md">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      <p className={cn("text-3xl font-bold font-mono tabular-nums", accentStyles[accent])}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}
