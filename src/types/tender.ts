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
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  riskFlags: RiskFlag[];
  winner: string;
  winnerCompanyId?: string | null;
  category: string;
  publishedAt: string;
  deadline: string;
  description: string;
  status?: string;
  reasons?: string[];
}

export type UserRole = "admin" | "company";

export interface User {
  id: string;
  login: string;
  name: string;
  role: UserRole;
}
