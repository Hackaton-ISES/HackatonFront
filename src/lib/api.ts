import type { Application, ApplicationStatus, RiskFlag, RiskLevel, Tender, User } from "@/types/tender";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const USER_STORAGE_KEY = "tender_auth_user";
const TOKEN_STORAGE_KEY = "tender_auth_token";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

interface ApiUser {
  id: string;
  login: string;
  name: string;
  role: User["role"];
}

interface AuthResponseDto {
  user: ApiUser;
  token: string;
}

interface RiskFlagDto {
  severity?: string | null;
  message?: string | null;
  points?: number | null;
  rule?: RiskFlag["rule"];
}

interface TenderDto {
  id: string;
  title: string;
  organization: string;
  category?: string | null;
  budget?: string | number | null;
  averageMarketPrice?: string | number | null;
  average_market_price?: string | number | null;
  finalPrice?: string | number | null;
  final_price?: string | number | null;
  participantsCount?: number | null;
  winnerCompanyId?: string | null;
  winner_company_id?: string | null;
  winnerCompanyName?: string | null;
  winner_company_name?: string | null;
  status?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  publishedAt?: string | null;
  deadline: string;
  description?: string | null;
  riskScore?: number | null;
  riskLevel?: RiskLevel | null;
  riskFlags?: RiskFlagDto[] | null;
  reasons?: string[] | null;
  bids?: ApplicationDto[] | null;
}

interface ApplicationDto {
  id: string;
  tenderId: string;
  companyId: string;
  companyName: string;
  proposedPrice: string | number;
  productName: string;
  productDescription: string;
  status: string;
  submittedAt: string;
}

interface UserListItemDto {
  id: string;
  name: string;
  total_participations?: number;
  total_wins?: number;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  auth?: boolean;
  body?: JsonValue;
}

export interface CreateTenderInput {
  title: string;
  organization: string;
  category: string;
  budget: number;
  averageMarketPrice: number;
  deadline: string;
}

export interface CreateApplicationInput {
  tenderId: string;
  companyId: string;
  companyName: string;
  proposedPrice: number;
  productName: string;
  productDescription: string;
}

export interface CompanyProfile {
  companyId: string;
  companyName: string;
  totalParticipations: number;
  totalWins: number;
  winRate: number;
  history: Array<{
    application: Application;
    tender: Tender | undefined;
  }>;
}

function joinUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSession(user: User, token: string) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredSession() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeStatus(status: string): ApplicationStatus {
  const normalized = status.trim().toLowerCase();
  if (normalized === "won") return "Won";
  if (normalized === "lost") return "Lost";
  return "Pending";
}

function normalizeRiskFlags(flags: RiskFlagDto[] | null | undefined): RiskFlag[] {
  if (!flags?.length) {
    return [{ severity: "warning", message: "No risk flags returned by backend" }];
  }

  return flags.map((flag) => ({
    severity: flag.severity === "critical" ? "critical" : "warning",
    message: flag.message?.trim() || "Unknown risk indicator",
    points: typeof flag.points === "number" ? flag.points : undefined,
    rule: flag.rule,
  }));
}

function normalizeApplication(dto: ApplicationDto): Application {
  return {
    id: dto.id,
    tenderId: dto.tenderId,
    companyId: dto.companyId,
    companyName: dto.companyName,
    proposedPrice: toNumber(dto.proposedPrice),
    productName: dto.productName,
    productDescription: dto.productDescription,
    status: normalizeStatus(dto.status),
    submittedAt: dto.submittedAt,
  };
}

function resolveWinnerName(dto: TenderDto): string {
  const directName = dto.winnerCompanyName ?? dto.winner_company_name;
  if (directName) return directName;

  const winningBid = dto.bids?.find((bid) => normalizeStatus(bid.status) === "Won");
  if (winningBid) return winningBid.companyName;

  return dto.winnerCompanyId ?? dto.winner_company_id ?? "—";
}

function normalizeTender(dto: TenderDto): Tender {
  const publishedAt = dto.publishedAt ?? dto.createdAt ?? dto.created_at ?? new Date().toISOString();

  return {
    id: dto.id,
    title: dto.title,
    organization: dto.organization,
    budget: toNumber(dto.budget),
    averageMarketPrice: toNumber(dto.averageMarketPrice ?? dto.average_market_price),
    finalPrice: toNumber(dto.finalPrice ?? dto.final_price),
    participantsCount: dto.participantsCount ?? dto.bids?.length ?? 0,
    riskScore: dto.riskScore ?? 0,
    riskLevel: dto.riskLevel ?? "LOW",
    riskFlags: normalizeRiskFlags(dto.riskFlags),
    winner: resolveWinnerName(dto),
    winnerCompanyId: dto.winnerCompanyId ?? dto.winner_company_id ?? null,
    category: dto.category?.trim() || "General",
    publishedAt,
    deadline: dto.deadline,
    description: dto.description?.trim() || "No description provided.",
    status: dto.status ?? undefined,
    reasons: dto.reasons ?? undefined,
  };
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  if ("detail" in payload && typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }

  if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  for (const value of Object.values(payload)) {
    if (typeof value === "string" && value.trim()) return value;
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) return value[0];
  }

  return fallback;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...init } = options;
  const token = auth ? getStoredToken() : null;
  const requestHeaders = new Headers(headers);

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    requestHeaders.set("Authorization", `Token ${token}`);
  }

  const response = await fetch(joinUrl(path), {
    ...init,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, `Request failed with status ${response.status}`));
  }

  return payload as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function loginUser(login: string, password: string): Promise<{ user: User; token: string }> {
  const response = await request<AuthResponseDto>("/auth/login", {
    method: "POST",
    auth: false,
    body: { login, password },
  });
  return { user: response.user, token: response.token };
}

export async function getCurrentUser(): Promise<User> {
  return request<User>("/auth/me");
}

export async function logoutUser(): Promise<void> {
  await fetch(joinUrl("/auth/logout"), {
    method: "POST",
    headers: getStoredToken() ? { Authorization: `Token ${getStoredToken()}` } : undefined,
  });
}

export async function getTenders(): Promise<Tender[]> {
  const response = await request<TenderDto[]>("/tenders");
  return response.map(normalizeTender);
}

export async function getTenderById(id: string): Promise<Tender | undefined> {
  const response = await request<TenderDto>(`/tenders/${id}`);
  return normalizeTender(response);
}

export async function createTender(input: CreateTenderInput): Promise<Tender> {
  const response = await request<TenderDto>("/tenders", {
    method: "POST",
    body: {
      title: input.title,
      organization: input.organization,
      category: input.category.trim(),
      budget: input.budget.toFixed(2),
      average_market_price: input.averageMarketPrice.toFixed(2),
      final_price: "0.00",
      status: "active",
      created_at: nowIso(),
      deadline: new Date(input.deadline).toISOString(),
    },
  });
  return normalizeTender(response);
}

export async function getApplications(filters?: {
  companyId?: string;
  tenderId?: string;
}): Promise<Application[]> {
  const params = new URLSearchParams();
  if (filters?.companyId) params.set("companyId", filters.companyId);
  if (filters?.tenderId) params.set("tenderId", filters.tenderId);

  const query = params.toString();
  const response = await request<ApplicationDto[]>(`/applications${query ? `?${query}` : ""}`);
  return response.map(normalizeApplication);
}

export async function createApplication(input: CreateApplicationInput): Promise<Application> {
  const response = await request<ApplicationDto>("/applications", {
    method: "POST",
    body: input,
  });
  return normalizeApplication(response);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "Won" | "Lost",
): Promise<Application> {
  const response = await request<ApplicationDto>(`/applications/${applicationId}/status`, {
    method: "PATCH",
    body: { status: status.toLowerCase() },
  });
  return normalizeApplication(response);
}

export async function getCompanyProfile(companyId: string): Promise<CompanyProfile | null> {
  const [applications, tenders] = await Promise.all([
    getApplications({ companyId }),
    getTenders(),
  ]);

  let companyName = applications[0]?.companyName;

  if (!companyName) {
    try {
      const users = await request<UserListItemDto[]>("/users");
      companyName = users.find((item) => item.id === companyId)?.name;
    } catch {
      companyName = undefined;
    }
  }

  if (!companyName && applications.length === 0) return null;

  const wins = applications.filter((application) => application.status === "Won").length;
  return {
    companyId,
    companyName: companyName ?? companyId,
    totalParticipations: applications.length,
    totalWins: wins,
    winRate: applications.length ? Math.round((wins / applications.length) * 100) : 0,
    history: applications.map((application) => ({
      application,
      tender: tenders.find((tender) => tender.id === application.tenderId),
    })),
  };
}
