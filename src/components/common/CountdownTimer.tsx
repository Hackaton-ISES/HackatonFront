import { Clock } from "lucide-react";
import { daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  deadline: string;
  className?: string;
}

/**
 * Visual countdown to a tender deadline.
 */
export function CountdownTimer({ deadline, className }: CountdownTimerProps) {
  const days = daysUntil(deadline);
  const expired = days < 0;
  const urgent = !expired && days <= 14;

  const label = expired
    ? "Muddati tugagan"
    : days === 0
      ? "Oxirgi kun"
      : `${days} kun qoldi`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
        expired
          ? "bg-muted text-muted-foreground"
          : urgent
            ? "bg-risk-medium-bg text-risk-medium"
            : "bg-risk-low-bg text-risk-low",
        className,
      )}
      title={expired ? "Muddat tugagan" : `Muddatgacha ${days} kun`}
    >
      <Clock className="h-3 w-3" />
      {expired ? "⏳ Muddati tugagan" : `⏳ ${label}`}
    </span>
  );
}
