import { Building2, Calendar, Tag, Trophy, Users, DollarSign, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RiskBadge } from "./RiskBadge";
import { RiskFlagItem } from "./RiskFlagItem";
import { formatCurrency, formatDate, priceDeltaPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tender } from "@/types/tender";

interface TenderDetailsModalProps {
  tender: Tender | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MetaRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

function MetaRow({ icon: Icon, label, value, valueClassName }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className={cn("text-sm font-medium text-foreground", valueClassName)}>{value}</p>
      </div>
    </div>
  );
}

export function TenderDetailsModal({ tender, open, onOpenChange }: TenderDetailsModalProps) {
  if (!tender) return null;

  const delta = priceDeltaPct(tender.budget, tender.finalPrice);
  const isAllPositive = tender.riskLevel === "LOW";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="bg-gradient-header text-primary-foreground p-6 rounded-t-lg">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-primary-foreground/60 mb-1">{tender.id}</p>
                <DialogTitle className="text-xl text-primary-foreground leading-tight">
                  {tender.title}
                </DialogTitle>
              </div>
              <RiskBadge score={tender.riskScore} level={tender.riskLevel} size="lg" />
            </div>
            <DialogDescription className="text-primary-foreground/70 text-sm leading-relaxed">
              {tender.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Meta grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 border border-border rounded-lg p-4 bg-muted/20">
            <MetaRow icon={Building2} label="Organization" value={tender.organization} />
            <MetaRow icon={Trophy} label="Winner" value={tender.winner} />
            <MetaRow icon={Tag} label="Category" value={tender.category} />
            <MetaRow icon={Calendar} label="Published" value={formatDate(tender.publishedAt)} />
            <MetaRow
              icon={DollarSign}
              label="Budget"
              value={formatCurrency(tender.budget)}
              valueClassName="font-mono"
            />
            <MetaRow
              icon={TrendingUp}
              label="Final Price"
              value={
                <span className="flex items-baseline gap-2">
                  <span className="font-mono">{formatCurrency(tender.finalPrice)}</span>
                  <span
                    className={cn(
                      "text-xs font-mono",
                      delta > 15 ? "text-risk-high" : delta > 5 ? "text-risk-medium" : "text-risk-low",
                    )}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}%
                  </span>
                </span>
              }
            />
            <MetaRow
              icon={Users}
              label="Participants"
              value={`${tender.participantsCount} bidder${tender.participantsCount === 1 ? "" : "s"}`}
              valueClassName={tender.participantsCount === 1 ? "text-risk-high" : ""}
            />
          </div>

          {/* Risk Analysis */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Risk Analysis
              </h3>
              <span className="text-xs text-muted-foreground">
                {tender.riskFlags.length} indicator{tender.riskFlags.length === 1 ? "" : "s"}
              </span>
            </div>
            <div
              className={cn(
                "rounded-lg border p-4",
                tender.riskLevel === "HIGH" && "bg-risk-high-bg/40 border-risk-high-border",
                tender.riskLevel === "MEDIUM" && "bg-risk-medium-bg/40 border-risk-medium-border",
                tender.riskLevel === "LOW" && "bg-risk-low-bg/40 border-risk-low-border",
              )}
            >
              <ul className="space-y-2.5">
                {tender.riskFlags.map((flag, i) => (
                  <RiskFlagItem key={i} flag={flag} positive={isAllPositive} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
