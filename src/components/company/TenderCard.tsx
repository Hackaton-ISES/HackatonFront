import { Building2, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/common/CountdownTimer";
import { formatCurrency, formatDate, daysUntil } from "@/lib/format";
import type { Tender } from "@/types/tender";

interface TenderCardProps {
  tender: Tender;
  applied?: boolean;
  onApply?: (tender: Tender) => void;
}

export function TenderCard({ tender, applied, onApply }: TenderCardProps) {
  const expired = daysUntil(tender.deadline) < 0;

  return (
    <article className="group flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[10px] font-mono text-muted-foreground">{tender.id}</span>
        <CountdownTimer deadline={tender.deadline} />
      </div>

      <h3 className="text-base font-semibold text-foreground leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
        {tender.title}
      </h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{tender.description}</p>

      <dl className="grid grid-cols-1 gap-2 text-sm mb-5">
        <div className="flex items-center gap-2 text-foreground/80">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{tender.organization}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground/80">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-mono">{formatCurrency(tender.budget)}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground/80">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>Deadline {formatDate(tender.deadline)}</span>
        </div>
      </dl>

      <div className="mt-auto">
        {applied ? (
          <Button disabled variant="secondary" className="w-full">
            ✓ Applied
          </Button>
        ) : (
          <Button
            onClick={() => onApply?.(tender)}
            disabled={expired}
            className="w-full transition-transform hover:scale-[1.01]"
          >
            {expired ? "Closed" : "Apply"}
          </Button>
        )}
      </div>
    </article>
  );
}
