import { AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskFlag } from "@/types/tender";

interface RiskFlagItemProps {
  flag: RiskFlag;
  positive?: boolean;
}

export function RiskFlagItem({ flag, positive }: RiskFlagItemProps) {
  const Icon = positive ? CheckCircle2 : flag.severity === "critical" ? XCircle : AlertTriangle;
  const color = positive
    ? "text-risk-low"
    : flag.severity === "critical"
      ? "text-risk-high"
      : "text-risk-medium";

  // The rule message already embeds "(+N)" for triggered rules. We surface the points
  // separately as a chip when available so the breakdown is scannable at a glance.
  const points = flag.points ?? 0;
  const cleanMessage = points > 0 ? flag.message.replace(/\s*\(\+\d+\)\s*$/, "") : flag.message;

  return (
    <li className="flex items-start gap-2.5 text-sm group transition-colors">
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
      <span className="text-foreground/90 leading-relaxed flex-1">{cleanMessage}</span>
      {points > 0 && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold tabular-nums border",
            flag.severity === "critical"
              ? "bg-risk-high-bg text-risk-high border-risk-high-border"
              : "bg-risk-medium-bg text-risk-medium border-risk-medium-border",
          )}
          title={`+${points} risk points`}
        >
          +{points}
        </span>
      )}
    </li>
  );
}
