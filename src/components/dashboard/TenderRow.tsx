import { ChevronRight, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RiskBadge } from "./RiskBadge";
import { formatCompactCurrency, priceDeltaPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tender } from "@/types/tender";

interface TenderRowProps {
  tender: Tender;
  onSelect: (tender: Tender) => void;
}

export function TenderRow({ tender, onSelect }: TenderRowProps) {
  const delta = priceDeltaPct(tender.budget, tender.finalPrice);
  const DeltaIcon = delta > 5 ? TrendingUp : delta < -5 ? TrendingDown : Minus;
  const deltaColor =
    delta > 15 ? "text-risk-high" : delta > 5 ? "text-risk-medium" : "text-muted-foreground";

  const top3 = tender.riskFlags.slice(0, 3);

  return (
    <TooltipProvider delayDuration={200}>
      <tr
        onClick={() => onSelect(tender)}
        className={cn(
          "group cursor-pointer border-b border-border last:border-0",
          "transition-colors duration-200 hover:bg-muted/50",
        )}
      >
        <td className="py-4 pl-6 pr-3">
          <div className="flex flex-col gap-0.5 max-w-md">
            <span className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {tender.title}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{tender.id}</span>
          </div>
        </td>
        <td className="py-4 px-3">
          <span className="text-sm text-foreground/80">{tender.organization}</span>
        </td>
        <td className="py-4 px-3 text-right">
          <span className="font-mono text-sm tabular-nums text-foreground/80">
            {formatCompactCurrency(tender.budget)}
          </span>
        </td>
        <td className="py-4 px-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="font-mono text-sm tabular-nums font-medium text-foreground">
              {formatCompactCurrency(tender.finalPrice)}
            </span>
            <span className={cn("inline-flex items-center text-xs font-mono", deltaColor)}>
              <DeltaIcon className="h-3 w-3" />
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          </div>
        </td>
        <td className="py-4 px-3 text-center">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono",
              tender.participantsCount === 1
                ? "bg-risk-high-bg text-risk-high"
                : tender.participantsCount <= 2
                  ? "bg-risk-medium-bg text-risk-medium"
                  : "bg-muted text-muted-foreground",
            )}
          >
            <Users className="h-3 w-3" />
            {tender.participantsCount}
          </span>
        </td>
        <td className="py-4 px-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <RiskBadge score={tender.riskScore} level={tender.riskLevel} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1.5 py-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Top risk indicators
                </p>
                <ul className="space-y-1">
                  {top3.map((f, i) => (
                    <li key={i} className="text-xs leading-relaxed">
                      {f.severity === "critical" ? "❌" : "⚠️"} {f.message}
                    </li>
                  ))}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </td>
        <td className="py-4 pl-3 pr-6">
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </td>
      </tr>
    </TooltipProvider>
  );
}
