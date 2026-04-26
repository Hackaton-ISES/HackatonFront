import { AlertTriangle, CheckCircle2, Scale, ShieldCheck, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Application } from "@/types/tender";

type AwardRecommendation = "safe" | "review" | "audit";

interface ParticipantReview {
  recommendation: AwardRecommendation;
  priceDelta: number | null;
  reasons: string[];
  suspicionScore?: number;
}

interface RecommendedWinnerCardProps {
  winner: Application | null;
  participants?: Application[];
  reviewsByApplicationId?: Record<string, ParticipantReview>;
}

const recommendationRank: Record<AwardRecommendation, number> = {
  safe: 0,
  review: 1,
  audit: 2,
};

const recommendationLabels: Record<AwardRecommendation, string> = {
  safe: "Safe",
  review: "Review",
  audit: "Audit required",
};

const recommendationStyles: Record<AwardRecommendation, string> = {
  safe: "border-risk-low-border bg-risk-low-bg text-risk-low",
  review: "border-risk-medium-border bg-risk-medium-bg text-risk-medium",
  audit: "border-risk-high-border bg-risk-high-bg text-risk-high",
};

function getLowestRiskBid(
  participants: Application[],
  reviewsByApplicationId: Record<string, ParticipantReview>,
): Application | null {
  if (participants.length === 0) return null;

  return [...participants].sort((a, b) => {
    const aReview = reviewsByApplicationId[a.id];
    const bReview = reviewsByApplicationId[b.id];
    const aRank = aReview ? recommendationRank[aReview.recommendation] : 1;
    const bRank = bReview ? recommendationRank[bReview.recommendation] : 1;
    if (aRank !== bRank) return aRank - bRank;

    const aScore = aReview?.suspicionScore ?? 0;
    const bScore = bReview?.suspicionScore ?? 0;
    if (aScore !== bScore) return aScore - bScore;

    return a.proposedPrice - b.proposedPrice;
  })[0];
}

function SummaryCandidate({
  label,
  application,
  review,
  icon: Icon,
  muted,
}: {
  label: string;
  application: Application | null;
  review?: ParticipantReview;
  icon: React.ElementType;
  muted?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-background p-4", muted && "opacity-70")}>
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-card border border-border">
          <Icon className="h-4 w-4 text-foreground" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>

      {!application ? (
        <p className="text-sm text-muted-foreground">No participant available.</p>
      ) : (
        <div>
          <Link
            to={`/companies/${application.companyId}`}
            className="font-semibold text-foreground hover:text-primary hover:underline"
          >
            {application.companyName}
          </Link>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {formatCurrency(application.proposedPrice)}
            {review?.priceDelta !== null && review?.priceDelta !== undefined && (
              <span className={cn("ml-2", review.priceDelta >= 10 ? "text-risk-high" : "text-muted-foreground")}>
                {review.priceDelta > 0 ? "+" : ""}
                {review.priceDelta}%
              </span>
            )}
          </p>
          {review && (
            <div className="mt-3 space-y-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                  recommendationStyles[review.recommendation],
                )}
              >
                {review.recommendation === "safe" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {recommendationLabels[review.recommendation]}
              </span>
              {review.reasons[0] && (
                <p className="text-xs leading-5 text-muted-foreground">{review.reasons[0]}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RecommendedWinnerCard({
  winner,
  participants = [],
  reviewsByApplicationId = {},
}: RecommendedWinnerCardProps) {
  const cheapestBid =
    participants.length > 0 ? [...participants].sort((a, b) => a.proposedPrice - b.proposedPrice)[0] : null;
  const lowestRiskBid = getLowestRiskBid(participants, reviewsByApplicationId);
  const winnerReview = winner ? reviewsByApplicationId[winner.id] : undefined;
  const cheapestReview = cheapestBid ? reviewsByApplicationId[cheapestBid.id] : undefined;
  const lowestRiskReview = lowestRiskBid ? reviewsByApplicationId[lowestRiskBid.id] : undefined;

  const selectedIsNotCheapest = Boolean(winner && cheapestBid && winner.id !== cheapestBid.id);
  const selectedIsNotLowestRisk = Boolean(winner && lowestRiskBid && winner.id !== lowestRiskBid.id);
  const selectedNeedsAudit = winnerReview?.recommendation === "audit";

  return (
    <section className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-5 border-b border-border flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-foreground" />
          <h2 className="text-base font-semibold text-foreground">Winner Risk Review</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          Compares selected winner, cheapest bid, and lowest-risk bid
        </span>
      </div>

      {participants.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          No participant bids are available for winner review.
        </div>
      ) : (
        <div className="space-y-5 p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <SummaryCandidate
              label="Selected winner"
              application={winner}
              review={winnerReview}
              icon={Trophy}
              muted={!winner}
            />
            <SummaryCandidate
              label="Cheapest bid"
              application={cheapestBid}
              review={cheapestReview}
              icon={Scale}
            />
            <SummaryCandidate
              label="Lowest-risk bid"
              application={lowestRiskBid}
              review={lowestRiskReview}
              icon={ShieldCheck}
            />
          </div>

          {!winner ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              No winner has been selected yet. Use this review before finalizing the award.
            </div>
          ) : selectedNeedsAudit || selectedIsNotCheapest || selectedIsNotLowestRisk ? (
            <div className="rounded-lg border border-risk-high-border bg-risk-high-bg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                <div>
                  <p className="font-semibold text-risk-high">Selected winner requires explanation</p>
                  <div className="mt-1 space-y-1 text-sm text-risk-high/90">
                    {selectedNeedsAudit && <p>The selected company is classified as audit required.</p>}
                    {selectedIsNotCheapest && <p>The selected winner is not the cheapest bid.</p>}
                    {selectedIsNotLowestRisk && <p>The selected winner is not the lowest-risk bid.</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-risk-low-border bg-risk-low-bg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-risk-low" />
                <div>
                  <p className="font-semibold text-risk-low">Selected winner matches the risk review</p>
                  <p className="mt-1 text-sm text-risk-low/90">
                    The selected winner is aligned with the lowest-risk bid and does not require an audit block.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
