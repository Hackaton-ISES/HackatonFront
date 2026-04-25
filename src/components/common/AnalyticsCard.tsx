import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  emoji?: string;
  hint?: string;
  accent?: "default" | "high" | "medium" | "low";
}

const accentStyles = {
  default: "text-foreground",
  high: "text-risk-high",
  medium: "text-risk-medium",
  low: "text-risk-low",
};

const accentBg = {
  default: "bg-muted",
  high: "bg-risk-high-bg",
  medium: "bg-risk-medium-bg",
  low: "bg-risk-low-bg",
};

export function AnalyticsCard({
  label,
  value,
  icon: Icon,
  emoji,
  hint,
  accent = "default",
}: AnalyticsCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm",
            accentBg[accent],
          )}
        >
          {emoji ?? (Icon ? <Icon className={cn("h-4 w-4", accentStyles[accent])} /> : null)}
        </span>
      </div>
      <p className={cn("text-3xl font-bold font-mono tabular-nums", accentStyles[accent])}>
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}
