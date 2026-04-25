import type { Application, Tender } from "@/types/tender";
import { mockApplications, mockTenders } from "./mockTenders";
import { mockBidsByTender, mockCompanyHistory } from "./mockCompanyHistory";
import { scoreTender } from "./riskScoring";

// Replace these mock implementations with real fetch/axios calls when the backend is ready.
// e.g. const res = await fetch(`${API_BASE}/tenders`); return res.json();

const NETWORK_DELAY = 400;
const wait = (ms = NETWORK_DELAY) => new Promise((r) => setTimeout(r, ms));

// In-memory store seeded from mocks. Persists for the session.
let tenders: Tender[] = [...mockTenders];
let applications: Application[] = [...mockApplications];

/** Run the modular risk engine over a tender and merge results back in. */
function applyRiskEngine(t: Tender): Tender {
  const result = scoreTender(t, {
    bids: mockBidsByTender[t.id],
    historyByCompany: mockCompanyHistory,
  });
  return {
    ...t,
    riskScore: result.riskScore,
    riskLevel: result.riskLevel,
    riskFlags: result.flags,
  };
}

export async function getTenders(): Promise<Tender[]> {
  await wait();
  return tenders.map(applyRiskEngine);
}

export async function getTenderById(id: string): Promise<Tender | undefined> {
  await wait(200);
  const t = tenders.find((x) => x.id === id);
  return t ? applyRiskEngine(t) : undefined;
}

export interface CreateTenderInput {
  title: string;
  organization: string;
  budget: number;
  deadline: string;
  description?: string;
  category?: string;
}

export async function createTender(input: CreateTenderInput): Promise<Tender> {
  await wait(300);
  const id = `T-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const tender: Tender = {
    id,
    title: input.title,
    organization: input.organization,
    budget: input.budget,
    finalPrice: input.budget,
    participantsCount: 0,
    riskScore: 0,
    riskLevel: "LOW",
    riskFlags: [{ severity: "warning", message: "Newly published — awaiting bids" }],
    winner: "—",
    category: input.category ?? "General",
    publishedAt: new Date().toISOString().slice(0, 10),
    deadline: input.deadline,
    description: input.description ?? "No description provided.",
  };
  tenders = [tender, ...tenders];
  return tender;
}

export async function getApplications(filters?: { companyId?: string; tenderId?: string }): Promise<Application[]> {
  await wait(250);
  return applications.filter((a) => {
    if (filters?.companyId && a.companyId !== filters.companyId) return false;
    if (filters?.tenderId && a.tenderId !== filters.tenderId) return false;
    return true;
  });
}

export interface CreateApplicationInput {
  tenderId: string;
  companyId: string;
  companyName: string;
  proposedPrice: number;
  productName: string;
  productDescription: string;
}

export async function createApplication(input: CreateApplicationInput): Promise<Application> {
  await wait(350);
  const app: Application = {
    id: `A-${Date.now().toString(36).toUpperCase()}`,
    ...input,
    status: "Pending",
    submittedAt: new Date().toISOString().slice(0, 10),
  };
  applications = [app, ...applications];
  // bump participants count on the tender
  tenders = tenders.map((t) =>
    t.id === input.tenderId ? { ...t, participantsCount: t.participantsCount + 1 } : t,
  );
  return app;
}

export interface RecommendedWinner {
  application: Application;
  reasons: string[];
  /** Heuristic 0-100 (lower = better fit) used purely for explanation. */
  score: number;
}

/**
 * Recommend the best applicant for a tender based on:
 *  - Lowest proposed price
 *  - Lowest tender risk score (proxy for company risk in MVP)
 * Returns null when there are no applicants.
 */
export function recommendWinner(
  tender: Pick<Tender, "id" | "riskScore">,
  apps: Application[],
): RecommendedWinner | null {
  const candidates = apps.filter((a) => a.tenderId === tender.id);
  if (candidates.length === 0) return null;

  const minPrice = Math.min(...candidates.map((c) => c.proposedPrice));
  const maxPrice = Math.max(...candidates.map((c) => c.proposedPrice));
  const priceRange = maxPrice - minPrice || 1;

  // Score each: 70% price competitiveness + 30% tender risk penalty
  const scored = candidates.map((c) => {
    const priceScore = ((c.proposedPrice - minPrice) / priceRange) * 70;
    const riskScore = (tender.riskScore / 100) * 30;
    return { app: c, score: priceScore + riskScore };
  });

  scored.sort((a, b) => a.score - b.score);
  const best = scored[0];

  const reasons: string[] = [];
  if (best.app.proposedPrice === minPrice) reasons.push("Lowest proposed price");
  if (tender.riskScore < 40) reasons.push("Low tender risk score");
  else if (tender.riskScore < 70) reasons.push("Acceptable risk profile");
  if (candidates.length >= 3) reasons.push(`Competitive pool (${candidates.length} bidders)`);
  if (reasons.length === 0) reasons.push("Best balance of price and risk");

  return { application: best.app, reasons, score: Math.round(best.score) };
}

export interface CompanyProfile {
  companyId: string;
  companyName: string;
  totalParticipations: number;
  totalWins: number;
  winRate: number; // 0-100
  history: Array<{
    application: Application;
    tender: Tender | undefined;
  }>;
}

export async function getCompanyProfile(companyId: string): Promise<CompanyProfile | null> {
  await wait(250);
  const apps = applications.filter((a) => a.companyId === companyId);
  if (apps.length === 0) {
    // unknown company id — derive a name from the most recent application elsewhere
    return null;
  }
  const wins = apps.filter((a) => a.status === "Won").length;
  return {
    companyId,
    companyName: apps[0].companyName,
    totalParticipations: apps.length,
    totalWins: wins,
    winRate: Math.round((wins / apps.length) * 100),
    history: apps.map((a) => ({
      application: a,
      tender: tenders.find((t) => t.id === a.tenderId),
    })),
  };
}
