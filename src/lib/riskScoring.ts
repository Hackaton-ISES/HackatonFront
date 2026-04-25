import type {
  BidRecord,
  CompanyHistory,
  RiskFlag,
  RiskLevel,
  Tender,
} from "@/types/tender";
import { getMarketPrice } from "./marketData";

// =================================================================
// Tender Risk Scoring Engine
// -----------------------------------------------------------------
// Each rule is a pure function that takes the tender (and optional
// supporting data) and returns a list of RiskFlag entries. Each flag
// carries the points it contributed so the UI can show explanations
// like "Price is 35% higher than market (+20)".
// Combine all rules with `scoreTender()`.
// =================================================================

export interface RiskScoreResult {
  riskScore: number;
  riskLevel: RiskLevel;
  flags: RiskFlag[];
  /** Human-readable reasons (one per triggered rule) — convenient for APIs/exports. */
  reasons: string[];
}

// ---------- Thresholds ----------
export const THRESHOLDS = {
  PRICE_ANOMALY_RATIO: 1.3, // final_price > market_price * 1.3
  PRICE_ANOMALY_POINTS: 20,
  FAILED_EXECUTION_POINTS_PER: 15,
  CONSECUTIVE_WIN_THRESHOLD: 3,
  CONSECUTIVE_WINS_POINTS: 25,
  PRICE_SIMILARITY_PCT: 0.02, // < 2% spread
  PRICE_SIMILARITY_POINTS: 20,
  REPEATED_PARTICIPANT_LOSS_THRESHOLD: 4, // company lost ≥4 prior tenders
  REPEATED_PARTICIPANTS_POINTS: 15,
} as const;

// ---------- Rule 1: Price anomaly ----------
export function checkPriceAnomaly(tender: Pick<Tender, "finalPrice" | "category">): RiskFlag[] {
  const market = getMarketPrice(tender.category);
  if (market <= 0 || tender.finalPrice <= 0) return [];
  const ratio = tender.finalPrice / market;
  if (ratio <= THRESHOLDS.PRICE_ANOMALY_RATIO) return [];
  const overPct = Math.round((ratio - 1) * 100);
  return [
    {
      severity: "critical",
      rule: "PRICE_ANOMALY",
      points: THRESHOLDS.PRICE_ANOMALY_POINTS,
      message: `Price is ${overPct}% higher than market average (+${THRESHOLDS.PRICE_ANOMALY_POINTS})`,
    },
  ];
}

// ---------- Rule 2: Company failed previous executions ----------
export function checkFailedExecutions(winnerHistory?: CompanyHistory): RiskFlag[] {
  if (!winnerHistory || winnerHistory.failedExecutions <= 0) return [];
  const points = winnerHistory.failedExecutions * THRESHOLDS.FAILED_EXECUTION_POINTS_PER;
  return [
    {
      severity: "critical",
      rule: "FAILED_EXECUTION",
      points,
      message: `Winner failed ${winnerHistory.failedExecutions} previous tender${
        winnerHistory.failedExecutions === 1 ? "" : "s"
      } (+${points})`,
    },
  ];
}

// ---------- Rule 3: Consecutive wins ----------
export function checkConsecutiveWins(winnerHistory?: CompanyHistory): RiskFlag[] {
  if (!winnerHistory) return [];
  if (winnerHistory.consecutiveWins < THRESHOLDS.CONSECUTIVE_WIN_THRESHOLD) return [];
  return [
    {
      severity: "warning",
      rule: "CONSECUTIVE_WINS",
      points: THRESHOLDS.CONSECUTIVE_WINS_POINTS,
      message: `${winnerHistory.consecutiveWins} consecutive wins by ${winnerHistory.companyName} (+${THRESHOLDS.CONSECUTIVE_WINS_POINTS})`,
    },
  ];
}

// ---------- Rule 4a: Suspicious price similarity ----------
export function checkPriceSimilarity(bids: BidRecord[]): RiskFlag[] {
  if (bids.length < 2) return [];
  const prices = bids.map((b) => b.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min <= 0) return [];
  const spread = (max - min) / min;
  if (spread >= THRESHOLDS.PRICE_SIMILARITY_PCT) return [];
  const spreadPct = (spread * 100).toFixed(1);
  return [
    {
      severity: "critical",
      rule: "PRICE_SIMILARITY",
      points: THRESHOLDS.PRICE_SIMILARITY_POINTS,
      message: `Suspicious price clustering: only ${spreadPct}% spread between bids (+${THRESHOLDS.PRICE_SIMILARITY_POINTS})`,
    },
  ];
}

// ---------- Rule 4b: Repeated filler participants ----------
export function checkRepeatedParticipants(
  bids: BidRecord[],
  historyByCompany: Record<string, CompanyHistory>,
  winnerName?: string,
): RiskFlag[] {
  if (bids.length < 2) return [];
  const fillers = bids.filter((b) => {
    if (b.companyName === winnerName) return false;
    const h = historyByCompany[b.companyId];
    return (
      h && h.losingParticipations >= THRESHOLDS.REPEATED_PARTICIPANT_LOSS_THRESHOLD
    );
  });
  if (fillers.length === 0) return [];
  const names = fillers.map((f) => f.companyName).join(", ");
  return [
    {
      severity: "warning",
      rule: "REPEATED_PARTICIPANTS",
      points: THRESHOLDS.REPEATED_PARTICIPANTS_POINTS,
      message: `Repeated losing bidder${fillers.length === 1 ? "" : "s"} detected: ${names} (+${THRESHOLDS.REPEATED_PARTICIPANTS_POINTS})`,
    },
  ];
}

// ---------- Combiner ----------
export function toRiskLevel(score: number): RiskLevel {
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

export interface ScoreTenderContext {
  bids?: BidRecord[];
  historyByCompany?: Record<string, CompanyHistory>;
}

export function scoreTender(tender: Tender, ctx: ScoreTenderContext = {}): RiskScoreResult {
  const bids = ctx.bids ?? [];
  const historyByCompany = ctx.historyByCompany ?? {};

  // Resolve winner history by name match (MVP — would use stable IDs in production).
  const winnerHistory = Object.values(historyByCompany).find(
    (h) => h.companyName === tender.winner,
  );

  const flags: RiskFlag[] = [
    ...checkPriceAnomaly(tender),
    ...checkFailedExecutions(winnerHistory),
    ...checkConsecutiveWins(winnerHistory),
    ...checkPriceSimilarity(bids),
    ...checkRepeatedParticipants(bids, historyByCompany, tender.winner),
  ];

  const riskScore = Math.min(
    100,
    flags.reduce((sum, f) => sum + (f.points ?? 0), 0),
  );
  const riskLevel = toRiskLevel(riskScore);

  // If nothing triggered, add a neutral "all clear" indicator.
  if (flags.length === 0) {
    flags.push({
      severity: "warning",
      points: 0,
      message: "All checks passed within normal thresholds",
    });
  }

  return {
    riskScore,
    riskLevel,
    flags,
    reasons: flags.filter((f) => (f.points ?? 0) > 0).map((f) => f.message),
  };
}
