import { Trophy, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/format";
import type { RecommendedWinner } from "@/lib/api";

interface RecommendedWinnerCardProps {
  recommendation: RecommendedWinner | null;
}

export function RecommendedWinnerCard({ recommendation }: RecommendedWinnerCardProps) {
  return (
    <section className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-risk-medium" />
        <h2 className="text-base font-semibold text-foreground">Recommended Winner</h2>
      </div>

      {!recommendation ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          No applications yet — recommendation will appear once bids are submitted.
        </div>
      ) : (
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-risk-low-bg p-3">
              <Trophy className="h-5 w-5 text-risk-low" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                Suggested winner
              </p>
              <Link
                to={`/companies/${recommendation.application.companyId}`}
                className="text-lg font-semibold text-foreground hover:text-primary transition-colors hover:underline"
              >
                {recommendation.application.companyName}
              </Link>
              <p className="text-sm text-muted-foreground font-mono">
                Bid: {formatCurrency(recommendation.application.proposedPrice)}
              </p>
            </div>
          </div>

          <div className="sm:ml-auto flex flex-wrap gap-2">
            {recommendation.reasons.map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-risk-low-bg text-risk-low px-2.5 py-1 text-xs font-medium"
              >
                ✓ {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
