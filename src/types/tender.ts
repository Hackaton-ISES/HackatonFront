export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type RiskFlagSeverity = "warning" | "critical";

export interface RiskFlag {
  severity: RiskFlagSeverity;
  message: string;
  /** Points contributed to the total risk score by the rule that produced this flag. */
  points?: number;
  /** Stable rule identifier for grouping/filtering. */
  rule?:
    | "PRICE_ANOMALY"
    | "FAILED_EXECUTION"
    | "CONSECUTIVE_WINS"
    | "PRICE_SIMILARITY"
    | "REPEATED_PARTICIPANTS";
}

/** Per-tender bid record used by fake-competition detection. */
export interface BidRecord {
  companyId: string;
  companyName: string;
  price: number;
}

/** Aggregated company performance signals used by the risk engine. */
export interface CompanyHistory {
  companyId: string;
  companyName: string;
  /** Number of tenders won but not completed. */
  failedExecutions: number;
  /** Length of current consecutive-wins streak. */
  consecutiveWins: number;
  /** Total losing participations (used to detect filler bidders). */
  losingParticipations: number;
}

export type ApplicationStatus = "Pending" | "Won" | "Lost";

export interface Application {
  id: string;
  tenderId: string;
  companyId: string;
  companyName: string;
  proposedPrice: number;
  productName: string;
  productDescription: string;
  status: ApplicationStatus;
  submittedAt: string;
}

export interface Tender {
  id: string;
  title: string;
  organization: string;
  budget: number;
  averageMarketPrice?: number;
  finalPrice: number;
  participantsCount: number;
  winner: string;
  winnerCompanyId?: string | null;
  category: string;
  publishedAt: string;
  deadline: string;
  description: string;
  status?: string;
  reasons?: string[];
}

export interface SuspicionReason {
  id: number;
  title: string;
  description: string;
  score: number;
  createdAt: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  totalParticipations: number;
  totalWins: number;
  completedProjects: number;
  failedProjects: number;
  suspicionScore: number;
  suspicionLevel: RiskLevel;
  suspicionFlags: RiskFlag[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyDetail extends CompanySummary {
  suspicionAnalysis?: {
    totalScore: number;
    suspicionLevel: RiskLevel;
    priceScore: number;
    failedDeliveryScore: number;
    consecutiveWinsScore: number;
    fakeCompetitionScore: number;
    analyzedAt?: string;
    reasons: SuspicionReason[];
  };
  reasons: SuspicionReason[];
}

export interface SuspicionStats {
  total: number;
  high: number;
  medium: number;
  low: number;
  distribution: Record<RiskLevel, number>;
  topSuspiciousCompanies: Array<{
    companyId: string;
    companyName: string;
    totalScore: number;
    suspicionLevel: RiskLevel;
  }>;
  totalAnalyzedCompanies: number;
}

export type UserRole = "admin" | "company";

export interface User {
  id: string;
  login: string;
  name: string;
  role: UserRole;
}
