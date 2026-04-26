import type {
  Application,
  ApplicationStatus,
  CompanyDetail,
  CompanySummary,
  RiskFlag,
  RiskLevel,
  SuspicionReason,
  SuspicionStats,
  Tender,
  User,
} from "@/types/tender";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const USER_STORAGE_KEY = "tender_auth_user";
const TOKEN_STORAGE_KEY = "tender_auth_token";
const GET_CACHE_TTL_MS = 30_000;

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
  external_id?: string | null;
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
  reasons?: string[] | null;
  bids?: ApplicationDto[] | null;
}

interface SuspicionReasonDto {
  id: number;
  title: string;
  description: string;
  score: number;
  created_at: string;
}

interface CompanySummaryDto {
  id: string;
  name: string;
  total_participations: number;
  total_wins: number;
  completed_projects: number;
  failed_projects: number;
  created_at?: string;
  updated_at?: string;
  suspicionScore: number;
  suspicionLevel: RiskLevel;
  suspicionFlags?: RiskFlagDto[] | null;
}

interface CompanyDetailDto extends CompanySummaryDto {
  suspicionAnalysis?: {
    total_score: number;
    suspicion_level: string;
    price_score: number;
    failed_delivery_score: number;
    consecutive_wins_score: number;
    fake_competition_score: number;
    ai_summary?: string | null;
    analyzed_at?: string;
    reasons?: SuspicionReasonDto[] | null;
  } | null;
  reasons?: SuspicionReasonDto[] | null;
}

interface RiskStatsDto {
  total: number;
  high: number;
  medium: number;
  low: number;
  distribution: Record<RiskLevel, number>;
  top_suspicious_companies?: Array<{
    companyId: string;
    companyName: string;
    totalScore: number;
    suspicionLevel: RiskLevel;
  }>;
  total_analyzed_companies?: number;
}

interface ApplicationDto {
  id: string;
  external_id?: string | null;
  tenderId: string;
  tender_id?: string | null;
  companyId: string;
  company_id?: string | null;
  companyName: string;
  proposedPrice: string | number;
  productName: string;
  productDescription: string;
  status: string;
  submittedAt: string;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  auth?: boolean;
  body?: JsonValue;
}

interface PaginatedResponseDto<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

export interface PaginatedList<T> {
  items: T[];
  total: number;
  next: string | null;
  previous: string | null;
}

export interface CreateTenderInput {
  title: string;
  organization: string;
  category: string;
  budget: number;
  averageMarketPrice: number;
  deadline: string;
  createdAt?: string;
  finalPrice?: number;
  status?: string;
}

export interface CreateApplicationInput {
  tenderId: string;
  companyId: string;
  companyName: string;
  proposedPrice: number;
  productName: string;
  productDescription: string;
}

export interface RegisterCompanyInput {
  companyName: string;
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface CompanyProfile extends CompanyDetail {
  winRate: number;
  wonTenders: Tender[];
  history: Array<{
    application: Application;
    tender: Tender | undefined;
  }>;
}

const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function joinUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function clearApiCache() {
  responseCache.clear();
  inFlightRequests.clear();
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSession(user: User, token: string) {
  clearApiCache();
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredSession() {
  clearApiCache();
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
  if (!flags?.length) return [];

  return flags.map((flag) => ({
    severity: flag.severity === "critical" ? "critical" : "warning",
    message: flag.message?.trim() || "Noma'lum xavf indikatori",
    points: typeof flag.points === "number" ? flag.points : undefined,
    rule: flag.rule,
  }));
}

function normalizeApplication(dto: ApplicationDto): Application {
  return {
    id: dto.id || dto.external_id || "",
    tenderId: dto.tenderId || dto.tender_id || "",
    companyId: dto.companyId || dto.company_id || "",
    companyName: dto.companyName,
    proposedPrice: toNumber(dto.proposedPrice),
    productName: dto.productName,
    productDescription: dto.productDescription,
    status: normalizeStatus(dto.status),
    submittedAt: dto.submittedAt,
  };
}

function normalizeSuspicionReason(dto: SuspicionReasonDto): SuspicionReason {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    score: dto.score,
    createdAt: dto.created_at,
  };
}

function normalizeSuspicionLevel(level: string | null | undefined): RiskLevel {
  const normalized = level?.trim().toUpperCase();
  if (normalized === "HIGH" || normalized === "MEDIUM") return normalized;
  return "LOW";
}

function normalizeCompanySummary(dto: CompanySummaryDto): CompanySummary {
  return {
    id: dto.id,
    name: dto.name,
    totalParticipations: dto.total_participations,
    totalWins: dto.total_wins,
    completedProjects: dto.completed_projects,
    failedProjects: dto.failed_projects,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    suspicionScore: dto.suspicionScore ?? 0,
    suspicionLevel: normalizeSuspicionLevel(dto.suspicionLevel),
    suspicionFlags: normalizeRiskFlags(dto.suspicionFlags),
  };
}

function normalizeCompanyDetail(dto: CompanyDetailDto): CompanyDetail {
  const summary = normalizeCompanySummary(dto);
  return {
    ...summary,
    suspicionAnalysis: dto.suspicionAnalysis
      ? {
          totalScore: dto.suspicionAnalysis.total_score,
          suspicionLevel: normalizeSuspicionLevel(dto.suspicionAnalysis.suspicion_level),
          priceScore: dto.suspicionAnalysis.price_score,
          failedDeliveryScore: dto.suspicionAnalysis.failed_delivery_score,
          consecutiveWinsScore: dto.suspicionAnalysis.consecutive_wins_score,
          fakeCompetitionScore: dto.suspicionAnalysis.fake_competition_score,
          aiSummary: dto.suspicionAnalysis.ai_summary?.trim() || "",
          analyzedAt: dto.suspicionAnalysis.analyzed_at,
          reasons: (dto.suspicionAnalysis.reasons ?? []).map(normalizeSuspicionReason),
        }
      : undefined,
    reasons: (dto.reasons ?? []).map(normalizeSuspicionReason),
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
    id: dto.id || dto.external_id || "",
    title: dto.title,
    organization: dto.organization,
    budget: toNumber(dto.budget),
    averageMarketPrice: toNumber(dto.averageMarketPrice ?? dto.average_market_price),
    finalPrice: toNumber(dto.finalPrice ?? dto.final_price),
    participantsCount: dto.participantsCount ?? dto.bids?.length ?? 0,
    winner: resolveWinnerName(dto),
    winnerCompanyId: dto.winnerCompanyId ?? dto.winner_company_id ?? null,
    category: dto.category?.trim() || "General",
    publishedAt,
    deadline: dto.deadline,
    description: dto.description?.trim() || "Tavsif kiritilmagan.",
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

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string" && value.trim()) {
      return `${key}: ${value}`;
    }
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      return `${key}: ${value[0]}`;
    }
  }

  return fallback;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...init } = options;
  const token = auth ? getStoredToken() : null;
  const requestHeaders = new Headers(headers);
  const method = (init.method ?? "GET").toUpperCase();
  const url = joinUrl(path);
  const cacheable = method === "GET" && body === undefined;
  const cacheKey = cacheable ? `${token ?? "public"}:${method}:${url}` : "";

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    requestHeaders.set("Authorization", `Token ${token}`);
  }

  if (cacheable) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const pending = inFlightRequests.get(cacheKey);
    if (pending) {
      return pending as Promise<T>;
    }
  }

  const execute = async (): Promise<T> => {
    const response = await fetch(url, {
      ...init,
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      throw new Error(getErrorMessage(payload, `Request failed with status ${response.status}`));
    }

    return payload as T;
  };

  if (!cacheable) {
    const payload = await execute();
    clearApiCache();
    return payload;
  }

  const pending = execute()
    .then((payload) => {
      responseCache.set(cacheKey, {
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
        value: payload,
      });
      return payload;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, pending);
  return pending;
}

function extractList<T>(payload: T[] | PaginatedResponseDto<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.results ?? [];
}

function normalizePaginatedList<TInput, TOutput>(
  payload: TInput[] | PaginatedResponseDto<TInput>,
  normalizeItem: (item: TInput) => TOutput,
): PaginatedList<TOutput> {
  if (Array.isArray(payload)) {
    const items = payload.map(normalizeItem);
    return {
      items,
      total: items.length,
      next: null,
      previous: null,
    };
  }

  const items = (payload.results ?? []).map(normalizeItem);
  return {
    items,
    total: payload.count ?? items.length,
    next: payload.next ?? null,
    previous: payload.previous ?? null,
  };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
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

export async function registerCompany(
  input: RegisterCompanyInput,
): Promise<{ user: User; token: string }> {
  const response = await request<AuthResponseDto>("/companies", {
    method: "POST",
    auth: false,
    body: {
      company_name: input.companyName,
      username: input.username,
      password: input.password,
      email: input.email?.trim() || "",
      first_name: input.firstName?.trim() || "",
      last_name: input.lastName?.trim() || "",
    },
  });
  return { user: response.user, token: response.token };
}

export async function logoutUser(): Promise<void> {
  await fetch(joinUrl("/auth/logout"), {
    method: "POST",
    headers: getStoredToken() ? { Authorization: `Token ${getStoredToken()}` } : undefined,
  });
}

export async function getTenders(): Promise<Tender[]> {
  const response = await request<TenderDto[] | PaginatedResponseDto<TenderDto>>("/tenders");
  return extractList(response).map(normalizeTender);
}

export async function getTenderPage(options?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedList<Tender>> {
  const query = buildQuery({
    page: options?.page,
    page_size: options?.pageSize,
  });
  const response = await request<TenderDto[] | PaginatedResponseDto<TenderDto>>(`/tenders${query}`);
  return normalizePaginatedList(response, normalizeTender);
}

export async function getCompanies(): Promise<CompanySummary[]> {
  const response = await request<CompanySummaryDto[] | PaginatedResponseDto<CompanySummaryDto>>("/companies");
  return extractList(response).map(normalizeCompanySummary);
}

export async function getCompanyPage(options?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedList<CompanySummary>> {
  const query = buildQuery({
    page: options?.page,
    page_size: options?.pageSize,
  });
  const response = await request<CompanySummaryDto[] | PaginatedResponseDto<CompanySummaryDto>>(`/companies${query}`);
  return normalizePaginatedList(response, normalizeCompanySummary);
}

export async function getCompanyById(companyId: string): Promise<CompanyDetail | null> {
  try {
    const response = await request<CompanyDetailDto>(`/companies/${companyId}`);
    return normalizeCompanyDetail(response);
  } catch (error) {
    if (error instanceof Error && /404/.test(error.message)) return null;
    throw error;
  }
}

export async function getSuspicionStats(): Promise<SuspicionStats> {
  const response = await request<RiskStatsDto>("/risk/stats");
  return {
    total: response.total,
    high: response.high,
    medium: response.medium,
    low: response.low,
    distribution: response.distribution,
    topSuspiciousCompanies: response.top_suspicious_companies ?? [],
    totalAnalyzedCompanies: response.total_analyzed_companies ?? response.total,
  };
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
      final_price: (input.finalPrice ?? 0).toFixed(2),
      status: input.status ?? "active",
      created_at: input.createdAt ?? nowIso(),
      deadline: new Date(input.deadline).toISOString(),
    },
  });
  return normalizeTender(response);
}

export async function updateTender(tenderId: string, input: CreateTenderInput): Promise<Tender> {
  const response = await request<TenderDto>(`/tenders/${tenderId}`, {
    method: "PUT",
    body: {
      title: input.title,
      organization: input.organization,
      category: input.category.trim(),
      budget: input.budget.toFixed(2),
      average_market_price: input.averageMarketPrice.toFixed(2),
      final_price: (input.finalPrice ?? 0).toFixed(2),
      status: input.status ?? "active",
      created_at: input.createdAt ?? nowIso(),
      deadline: new Date(input.deadline).toISOString(),
    },
  });
  return normalizeTender(response);
}

export async function getApplications(filters?: {
  companyId?: string;
  tenderId?: string;
}): Promise<Application[]> {
  const query = buildQuery({
    companyId: filters?.companyId,
    tenderId: filters?.tenderId,
  });
  const response = await request<ApplicationDto[] | PaginatedResponseDto<ApplicationDto>>(
    `/applications${query}`,
  );
  return extractList(response).map(normalizeApplication);
}

export async function getApplicationPage(filters?: {
  companyId?: string;
  tenderId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedList<Application>> {
  const query = buildQuery({
    companyId: filters?.companyId,
    tenderId: filters?.tenderId,
    page: filters?.page,
    page_size: filters?.pageSize,
  });
  const response = await request<ApplicationDto[] | PaginatedResponseDto<ApplicationDto>>(
    `/applications${query}`,
  );
  return normalizePaginatedList(response, normalizeApplication);
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
  const [company, applications, tenders] = await Promise.all([
    getCompanyById(companyId),
    getApplications({ companyId }),
    getTenders(),
  ]);

  const wins = applications.filter((application) => application.status === "Won").length;
  const wonTenders = tenders.filter((tender) => tender.winnerCompanyId === companyId);

  if (!company && applications.length === 0 && wonTenders.length === 0) return null;

  return {
    id: company?.id ?? companyId,
    name: company?.name ?? applications[0]?.companyName ?? companyId,
    totalParticipations: company?.totalParticipations ?? applications.length,
    totalWins: company?.totalWins ?? wins,
    completedProjects: company?.completedProjects ?? wonTenders.length,
    failedProjects: company?.failedProjects ?? 0,
    suspicionScore: company?.suspicionScore ?? 0,
    suspicionLevel: company?.suspicionLevel ?? "LOW",
    suspicionFlags: company?.suspicionFlags ?? [],
    createdAt: company?.createdAt,
    updatedAt: company?.updatedAt,
    suspicionAnalysis: company?.suspicionAnalysis,
    reasons: company?.reasons ?? [],
    winRate: applications.length ? Math.round((wins / applications.length) * 100) : 0,
    wonTenders,
    history: applications.map((application) => ({
      application,
      tender: tenders.find((tender) => tender.id === application.tenderId),
    })),
  };
}
