import { useEffect, useMemo, useRef, useState } from "react";
import type { ElementType } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Eye,
  FileWarning,
  Layers,
  Network,
  Scale,
  ShieldAlert,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { AppPagination } from "@/components/common/AppPagination";
import { AnalyticsCard } from "@/components/common/AnalyticsCard";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { getCompanyPage, getSuspicionStats } from "@/lib/api";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import { compareSuspicionLevelDesc } from "@/lib/utils";
import type { Application, CompanySummary, RiskLevel, SuspicionStats, Tender } from "@/types/tender";

type SuspicionFilter = "ALL" | RiskLevel;
const COMPANIES_PER_PAGE = 10;

interface InvestigationCase {
  company: CompanySummary;
  tender?: Tender;
  winningApplication?: Application;
  companyApplications: Application[];
  wonApplications: Application[];
  riskValue: number;
  priceDelta: number | null;
  evidence: Array<{
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
    icon: ElementType;
  }>;
}

const severityStyles = {
  high: "border-risk-high-border bg-risk-high-bg text-risk-high",
  medium: "border-risk-medium-border bg-risk-medium-bg text-risk-medium",
  low: "border-risk-low-border bg-risk-low-bg text-risk-low",
};

function buildInvestigationCase(
  companies: CompanySummary[],
  stats: SuspicionStats | null,
  tenders: Tender[],
  applications: Application[],
): InvestigationCase | null {
  if (!companies.length) return null;

  const statsTopId = stats?.topSuspiciousCompanies[0]?.companyId;
  const topCompany =
    companies.find((company) => company.id === statsTopId) ??
    [...companies].sort(
      (a, b) => compareSuspicionLevelDesc(a, b) || b.failedProjects - a.failedProjects || b.totalWins - a.totalWins,
    )[0];

  if (!topCompany) return null;

  const companyApplications = applications.filter((application) => application.companyId === topCompany.id);
  const wonApplications = companyApplications.filter((application) => application.status === "Won");
  const tenderById = new Map(tenders.map((tender) => [tender.id, tender]));

  const winningApplication =
    wonApplications
      .map((application) => ({ application, tender: tenderById.get(application.tenderId) }))
      .sort((a, b) => (b.tender?.finalPrice ?? b.application.proposedPrice) - (a.tender?.finalPrice ?? a.application.proposedPrice))[0]
      ?.application ?? companyApplications[0];

  const tender = winningApplication ? tenderById.get(winningApplication.tenderId) : undefined;
  const tenderValue = tender?.finalPrice || tender?.budget || winningApplication?.proposedPrice || 0;
  const marketBaseline = tender?.averageMarketPrice || tender?.budget || 0;
  const priceDelta =
    tender && marketBaseline > 0
      ? Math.round(((tenderValue - marketBaseline) / marketBaseline) * 100)
      : null;

  const evidence: InvestigationCase["evidence"] = [];

  if (topCompany.suspicionFlags.length > 0) {
    evidence.push(
      ...topCompany.suspicionFlags.slice(0, 2).map((flag) => ({
        title: flag.rule ? flag.rule.replace(/_/g, " ") : "Xavf qoidasi ishga tushdi",
        description: flag.message,
        severity: flag.severity === "critical" ? "high" as const : "medium" as const,
        icon: FileWarning,
      })),
    );
  }

  if (priceDelta !== null && Math.abs(priceDelta) >= 10) {
    evidence.push({
      title: "Narx anomaliyasi",
      description:
        priceDelta > 0
          ? `G'olib qiymati bozor yoki byudjet bazasidan ${priceDelta}% yuqori.`
          : `G'olib qiymati bozor yoki byudjet bazasidan ${Math.abs(priceDelta)}% past.`,
      severity: priceDelta > 20 ? "high" : "medium",
      icon: DollarSign,
    });
  }

  if (topCompany.totalWins >= 3) {
    evidence.push({
      title: "Takroriy g'oliblik holati",
      description: `${topCompany.name} ${topCompany.totalParticipations} ta ishtirok ichida ${topCompany.totalWins} ta tender yutgan.`,
      severity: topCompany.totalWins >= 5 ? "high" : "medium",
      icon: Trophy,
    });
  }

  if (topCompany.failedProjects > 0) {
    evidence.push({
      title: "Yetkazib berish xavfi",
      description: `Kompaniya tarixida ${topCompany.failedProjects} ta muammoli loyiha topildi.`,
      severity: topCompany.failedProjects >= 2 ? "high" : "medium",
      icon: AlertTriangle,
    });
  }

  if (companyApplications.length >= 3 && wonApplications.length > 0) {
    evidence.push({
      title: "Ishtirok tarmog'i",
      description: `Kompaniya ${companyApplications.length} ta arizada qatnashgan, ${wonApplications.length} ta g'alaba tekshiruv talab qiladi.`,
      severity: "medium",
      icon: Network,
    });
  }

  if (evidence.length === 0) {
    evidence.push({
      title: "Monitoring holati",
      description: "Bu kompaniya hozir eng yuqori shubha balliga ega va nazoratda qolishi kerak.",
      severity: topCompany.suspicionLevel === "HIGH" ? "high" : topCompany.suspicionLevel === "MEDIUM" ? "medium" : "low",
      icon: Eye,
    });
  }

  return {
    company: topCompany,
    tender,
    winningApplication,
    companyApplications,
    wonApplications,
    riskValue: tenderValue,
    priceDelta,
    evidence: evidence.slice(0, 4),
  };
}

function InvestigationHero({ investigation }: { investigation: InvestigationCase | null }) {
  const navigate = useNavigate();

  if (!investigation) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-muted p-3">
            <ShieldAlert className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Tekshiruv paneli</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hozircha kompaniya xavf ma'lumotlari yo'q. Tekshiruv yaratish uchun kompaniya, tender va arizalar qo'shing.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { company, tender, winningApplication, evidence, riskValue, priceDelta } = investigation;
  const riskTone = company.suspicionLevel === "HIGH" ? "high" : company.suspicionLevel === "MEDIUM" ? "medium" : "low";

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevation-md">
      <div className="border-b border-border bg-gradient-header p-6 text-primary-foreground">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">
              <Scale className="h-3.5 w-3.5" />
              Faol korrupsiya tekshiruvi
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              Shubhali xarid holati aniqlandi
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/70">
              Tizim eng xavfli kompaniyani tanlab, uni tender tarixi, g'olib qiymati va dalillar bilan bog'ladi.
            </p>
          </div>
          <RiskBadge
            score={company.suspicionScore}
            level={company.suspicionLevel}
            size="lg"
            className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground"
          />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Belgilangan kompaniya</p>
              <button
                type="button"
                onClick={() => navigate(`/companies/${company.id}`)}
                className="mt-2 text-left text-lg font-semibold text-foreground hover:text-primary hover:underline"
              >
                {company.name}
              </button>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{company.id}</p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Xavf ostidagi summa</p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-foreground">
                {riskValue > 0 ? formatCompactCurrency(riskValue) : "Noma'lum"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {priceDelta === null ? "Bazaviy narx yo'q" : `${priceDelta > 0 ? "+" : ""}${priceDelta}% bazaga nisbatan`}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Holat</p>
              <p className={`mt-2 text-lg font-semibold ${riskTone === "high" ? "text-risk-high" : riskTone === "medium" ? "text-risk-medium" : "text-risk-low"}`}>
                {company.suspicionLevel === "HIGH" ? "Audit kerak" : company.suspicionLevel === "MEDIUM" ? "Qo'lda tekshiruv" : "Kuzatuv"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {company.totalWins} g'alaba · {company.failedProjects} muammoli loyiha
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asosiy tender</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {tender?.title ?? winningApplication?.tenderId ?? "Bog'langan tender topilmadi"}
                </h3>
                {tender && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tender.organization} · muddati {formatDate(tender.deadline)}
                  </p>
                )}
              </div>
              {tender && (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/tenders/${tender.id}`)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Tenderni ochish
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Byudjet" value={tender ? formatCurrency(tender.budget) : "Noma'lum"} />
              <Metric label="G'olib / taklif" value={formatCurrency(riskValue)} />
              <Metric label="Ishtirokchilar" value={String(tender?.participantsCount ?? "Noma'lum")} />
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-muted/20 p-6 lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Dalillar zanjiri</h3>
            <span className="font-mono text-xs text-muted-foreground">{evidence.length} ta signal</span>
          </div>
          <div className="space-y-3">
            {evidence.map((item) => {
              const Icon = item.icon;
              return (
                <div key={`${item.title}-${item.description}`} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${severityStyles[item.severity]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => navigate(`/companies/${company.id}`)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Dalillarni ochish
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [stats, setStats] = useState<SuspicionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<SuspicionFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);

  const highAlerted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getCompanyPage({
        page: currentPage,
        pageSize: COMPANIES_PER_PAGE,
        search,
        suspicionLevel: levelFilter === "ALL" ? undefined : levelFilter,
      }),
      getSuspicionStats(),
    ])
      .then(([companyPage, dashboardStats]) => {
        if (cancelled) return;
        setCompanies(companyPage.items);
        setTotalCompanies(companyPage.total);
        setStats(dashboardStats);

        if (!highAlerted.current && dashboardStats.high > 0) {
          toast.error(`${dashboardStats.high} ta yuqori shubhali kompaniya aniqlandi`, {
            description: "Quyidagi panelda kompaniya shubha tafsilotlarini ko'ring.",
            duration: 6000,
          });
          highAlerted.current = true;
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Boshqaruv panelini yuklab bo'lmadi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, levelFilter, search]);

  const investigation = useMemo(
    () => buildInvestigationCase(companies, stats, [], []),
    [companies, stats],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return companies
      .filter((company) => {
        if (levelFilter !== "ALL" && company.suspicionLevel !== levelFilter) return false;
        if (!query) return true;
        return company.name.toLowerCase().includes(query);
      })
      .sort((a, b) => compareSuspicionLevelDesc(a, b) || b.failedProjects - a.failedProjects);
  }, [companies, levelFilter, search]);

  const pagedCompanies = filtered;
  const totalPages = Math.max(1, Math.ceil(totalCompanies / COMPANIES_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, levelFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const effectiveStats = stats ?? {
    total: companies.length,
    high: companies.filter((company) => company.suspicionLevel === "HIGH").length,
    medium: companies.filter((company) => company.suspicionLevel === "MEDIUM").length,
    low: companies.filter((company) => company.suspicionLevel === "LOW").length,
    distribution: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    topSuspiciousCompanies: [],
    totalAnalyzedCompanies: companies.length,
  };

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="rounded-lg bg-muted p-2">
          <ShieldAlert className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Kompaniya shubha paneli
          </h1>
          <p className="text-sm text-muted-foreground">
            Shubhali kompaniyalarni kuzating, backend tahlilini ko'ring va takroriy suiiste'mol holatlarini tekshiring.
          </p>
        </div>
      </div>

      {!loading && !error && <InvestigationHero investigation={investigation} />}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        <AnalyticsCard label="Jami kompaniyalar" value={effectiveStats.total} icon={Layers} hint="Backend kuzatuvida" />
        <AnalyticsCard label="Yuqori shubha" value={effectiveStats.high} emoji="🔴" accent="high" />
        <AnalyticsCard label="O'rta shubha" value={effectiveStats.medium} emoji="🟡" accent="medium" />
        <AnalyticsCard label="Past shubha" value={effectiveStats.low} emoji="🟢" accent="low" />
      </section>

      {!loading && stats && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up">
          <RiskDistributionChart stats={stats} />

          <div className="bg-card border border-border rounded-lg p-5 shadow-elevation-sm">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Eng shubhali kompaniyalar
              </h3>
              <span className="text-xs text-muted-foreground">Eng yuqori ballar</span>
            </div>
            <div className="space-y-3">
              {stats.topSuspiciousCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Shubhali kompaniyalar topilmadi.</p>
              ) : (
                [...stats.topSuspiciousCompanies]
                  .sort((a, b) =>
                    compareSuspicionLevelDesc({
                      suspicionLevel: a.suspicionLevel,
                      suspicionScore: a.totalScore,
                      name: a.companyName,
                    }, {
                      suspicionLevel: b.suspicionLevel,
                      suspicionScore: b.totalScore,
                      name: b.companyName,
                    }),
                  )
                  .map((company) => (
                  <button
                    key={company.companyId}
                    type="button"
                    onClick={() => navigate(`/companies/${company.companyId}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <div>
                      <p className="font-medium text-foreground">{company.companyName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{company.companyId}</p>
                    </div>
                    <RiskBadge score={company.totalScore} level={company.suspicionLevel} size="sm" />
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <section className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">Kompaniyalar shubha ro'yxati</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {filtered.length} / {totalCompanies}
            </span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kompaniya nomini qidirish..."
              className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
            />
            <div className="flex rounded-md border border-input bg-background p-1">
              {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setLevelFilter(level)}
                  className={`rounded px-3 py-1.5 text-sm ${levelFilter === level ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  {level === "ALL" ? "BARCHASI" : level === "HIGH" ? "YUQORI" : level === "MEDIUM" ? "O'RTA" : "PAST"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <div className="p-12 text-center text-sm text-risk-high">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Joriy filterlarga mos kompaniya topilmadi.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kompaniya</th>
                    <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shubha</th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">G'alabalar</th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Muammoli loyihalar</th>
                    <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asosiy sabablar</th>
                    <th className="py-3 pl-3 pr-6 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCompanies.map((company) => (
                    <tr
                      key={company.id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                    >
                      <td className="py-4 pl-6 pr-3">
                        <p className="font-medium text-foreground">{company.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{company.id}</p>
                      </td>
                      <td className="py-4 px-3">
                        <RiskBadge score={company.suspicionScore} level={company.suspicionLevel} size="sm" />
                      </td>
                      <td className="py-4 px-3 text-right font-mono text-sm text-foreground">{company.totalWins}</td>
                      <td className="py-4 px-3 text-right font-mono text-sm text-foreground">{company.failedProjects}</td>
                      <td className="py-4 px-3 text-sm text-muted-foreground">
                        {company.suspicionFlags.length > 0 ? company.suspicionFlags[0].message : "Shubha belgilari yo'q"}
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/companies/${company.id}`)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Ko'rish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 px-6 pb-6">
              <p className="text-center text-xs text-muted-foreground">
                {currentPage}/{totalPages}-sahifa · {totalCompanies} ta kompaniya
              </p>
              <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
