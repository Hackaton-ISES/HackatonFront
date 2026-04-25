import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/format";
import type { Application } from "@/types/tender";

interface RecommendedWinnerCardProps {
  winner: Application | null;
}

export function RecommendedWinnerCard({ winner }: RecommendedWinnerCardProps) {
  return (
    <section className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <Trophy className="h-4 w-4 text-risk-low" />
        <h2 className="text-base font-semibold text-foreground">Selected Winner</h2>
      </div>

      {!winner ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          No winner has been selected by the backend yet.
        </div>
      ) : (
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-risk-low-bg p-3">
              <Trophy className="h-5 w-5 text-risk-low" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                Backend-selected winner
              </p>
              <Link
                to={`/companies/${winner.companyId}`}
                className="text-lg font-semibold text-foreground hover:text-primary transition-colors hover:underline"
              >
                {winner.companyName}
              </Link>
              <p className="text-sm text-muted-foreground font-mono">
                Bid: {formatCurrency(winner.proposedPrice)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
