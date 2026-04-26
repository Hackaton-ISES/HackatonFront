import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Eye,
  FileSearch,
  Landmark,
  Search,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getCompanyPage, getSuspicionStats, getTenders } from "@/lib/api";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import { cn, compareSuspicionLevelDesc } from "@/lib/utils";
import type { CompanySummary, RiskLevel, SuspicionStats, Tender } from "@/types/tender";

type PublicLoadState = "loading" | "ready" | "partial" | "error";

interface PublicMetricProps {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ElementType;
  tone?: "default" | "high" | "medium" | "low";
}

const toneStyles = {
  default: "bg-card text-foreground border-border",
  high: "bg-risk-high-bg text-risk-high border-risk-high-border",
  medium: "bg-risk-medium-bg text-risk-medium border-risk-medium-border",
  low: "bg-risk-low-bg text-risk-low border-risk-low-border",
};

function PublicMetric({ label, value, hint, icon: Icon, tone = "default" }: PublicMetricProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-foreground">{value}</p>
        </div>
        <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-lg border", toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-sm leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}

function getTenderRisk(tender: Tender, highRiskCompanyIds: Set<string>): RiskLevel {
  if (tender.winnerCompanyId && highRiskCompanyIds.has(tender.winnerCompanyId)) return "HIGH";
  const baseline = tender.averageMarketPrice || tender.budget;
  if (baseline > 0 && tender.finalPrice > baseline * 1.25) return "HIGH";
  if (baseline > 0 && tender.finalPrice > baseline * 1.1) return "MEDIUM";
  return "LOW";
}

function getTenderReason(tender: Tender, highRiskCompanyIds: Set<string>): string {
  if (tender.winnerCompanyId && highRiskCompanyIds.has(tender.winnerCompanyId)) {
    return "G'olib yuqori xavfli kompaniya profili bilan bog'langan.";
  }

  const baseline = tender.averageMarketPrice || tender.budget;
  if (baseline > 0 && tender.finalPrice > baseline) {
    const delta = Math.round(((tender.finalPrice - baseline) / baseline) * 100);
    return `Yakuniy narx mavjud bazadan ${delta}% yuqori.`;
  }

  if (!tender.winnerCompanyId) return "Hali g'olib e'lon qilinmagan.";
  return "Ochiq yuqori xavf signali aniqlanmadi.";
}

export default function PublicTransparencyPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [stats, setStats] = useState<SuspicionStats | null>(null);
  const [state, setState] = useState<PublicLoadState>("loading");
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"ALL" | RiskLevel>("ALL");

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    Promise.allSettled([
      getTenders(),
      getCompanyPage({ page: 1, pageSize: 50 }),
      getSuspicionStats(),
    ]).then(([tenderResult, companyResult, statsResult]) => {
      if (cancelled) return;

      const loadedTenders = tenderResult.status === "fulfilled" ? tenderResult.value : [];
      const loadedCompanies = companyResult.status === "fulfilled" ? companyResult.value.items : [];
      const loadedStats = statsResult.status === "fulfilled" ? statsResult.value : null;

      setTenders(loadedTenders);
      setCompanies(loadedCompanies);
      setStats(loadedStats);

      const failures = [tenderResult, companyResult, statsResult].filter((result) => result.status === "rejected").length;
      setState(failures === 3 ? "error" : failures > 0 ? "partial" : "ready");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const highRiskCompanyIds = useMemo(
    () => new Set(companies.filter((company) => company.suspicionLevel === "HIGH").map((company) => company.id)),
    [companies],
  );

  const enrichedTenders = useMemo(
    () =>
      tenders.map((tender) => ({
        tender,
        risk: getTenderRisk(tender, highRiskCompanyIds),
        reason: getTenderReason(tender, highRiskCompanyIds),
      })),
    [highRiskCompanyIds, tenders],
  );

  const filteredTenders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return enrichedTenders
      .filter(({ tender, risk }) => {
        if (riskFilter !== "ALL" && risk !== riskFilter) return false;
        if (!search) return true;
        return (
          tender.title.toLowerCase().includes(search) ||
          tender.organization.toLowerCase().includes(search) ||
          tender.winner.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        if (rank[a.risk] !== rank[b.risk]) return rank[a.risk] - rank[b.risk];
        return b.tender.budget - a.tender.budget;
      });
  }, [enrichedTenders, query, riskFilter]);

  const featuredCompanies = useMemo(
    () =>
      [...companies]
        .sort((a, b) => compareSuspicionLevelDesc(a, b) || b.failedProjects - a.failedProjects)
        .slice(0, 4),
    [companies],
  );

  const monitoredBudget = tenders.reduce((sum, tender) => sum + (tender.finalPrice || tender.budget || 0), 0);
  const publicStats = stats ?? {
    total: companies.length,
    high: companies.filter((company) => company.suspicionLevel === "HIGH").length,
    medium: companies.filter((company) => company.suspicionLevel === "MEDIUM").length,
    low: companies.filter((company) => company.suspicionLevel === "LOW").length,
    distribution: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    topSuspiciousCompanies: [],
    totalAnalyzedCompanies: companies.length,
  };
  const riskCoverage = publicStats.total > 0 ? Math.round(((publicStats.high + publicStats.medium) / publicStats.total) * 100) : 0;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-header text-primary-foreground">
        <div className="container flex min-h-[88px] items-center justify-between gap-6 py-5">
          <Link to="/public" className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary-foreground/10">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/60">
                Ochiq xaridlar
              </span>
              <span className="block text-lg font-bold">Shaffoflik monitori</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/login">Kirish</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="border-b border-border bg-card">
        <div className="container grid gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-risk-medium-border bg-risk-medium-bg px-3 py-1 text-xs font-semibold uppercase tracking-wider text-risk-medium">
              <Eye className="h-3.5 w-3.5" />
              Fuqarolar uchun korrupsiya signallari
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground">
              Tender g'oliblari, shubhali kompaniyalar va xavf ostidagi mablag'lar bo'yicha ochiq ko'rinish.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Bu sahifa xarid ma'lumotlarini ochiq dalillar paneliga aylantiradi: fuqarolar g'oliblar, narx anomaliyalari va kompaniya xavf holatlarini ko'rishi mumkin.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-5 shadow-elevation-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Xavf ko'lami</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{riskCoverage}% tekshiruvga belgilangan</p>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-risk-high-border bg-risk-high-bg text-risk-high">
                <TrendingUp className="h-6 w-6" />
              </span>
            </div>
            <Progress value={riskCoverage} className="h-3 bg-muted" />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border border-risk-high-border bg-risk-high-bg p-3">
                <p className="font-mono text-xl font-bold text-risk-high">{publicStats.high}</p>
                <p className="text-xs text-risk-high">Yuqori</p>
              </div>
              <div className="rounded-md border border-risk-medium-border bg-risk-medium-bg p-3">
                <p className="font-mono text-xl font-bold text-risk-medium">{publicStats.medium}</p>
                <p className="text-xs text-risk-medium">O'rta</p>
              </div>
              <div className="rounded-md border border-risk-low-border bg-risk-low-bg p-3">
                <p className="font-mono text-xl font-bold text-risk-low">{publicStats.low}</p>
                <p className="text-xs text-risk-low">Past</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container space-y-6 py-8">
        {state === "partial" && (
          <div className="rounded-lg border border-risk-medium-border bg-risk-medium-bg px-4 py-3 text-sm text-risk-medium">
            Ba'zi ochiq ma'lumotlarni yuklab bo'lmadi. Agar backend xavf endpointlarini faqat admin uchun saqlasa, bu sahifa uchun read-only endpointlar kerak.
          </div>
        )}

        {state === "error" ? (
          <div className="rounded-lg border border-risk-high-border bg-risk-high-bg p-8 text-center">
            <FileSearch className="mx-auto mb-3 h-8 w-8 text-risk-high" />
            <h2 className="text-lg font-semibold text-risk-high">Ochiq ma'lumot mavjud emas</h2>
            <p className="mt-2 text-sm text-risk-high/80">
              Tizimga kirmagan foydalanuvchilar uchun backendda ochiq tender va xavf endpointlari kerak.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <PublicMetric
                label="Kuzatilayotgan tenderlar"
                value={tenders.length}
                hint="Shaffoflik sahifasida ko'rinadigan e'lon qilingan xarid yozuvlari."
                icon={Landmark}
              />
              <PublicMetric
                label="Kuzatilayotgan mablag'"
                value={formatCompactCurrency(monitoredBudget)}
                hint="Fuqarolarga ko'rinadigan umumiy byudjet yoki g'olib qiymati."
                icon={TrendingUp}
                tone="medium"
              />
              <PublicMetric
                label="Yuqori xavfli kompaniyalar"
                value={publicStats.high}
                hint="Xarid tarixida jiddiy xavf signallari bor kompaniyalar."
                icon={ShieldAlert}
                tone="high"
              />
            </div>

            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="rounded-lg border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Ochiq tender reyestri</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        G'oliblarni qidiring va har bir xavf belgisi sababini ko'ring.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Tender, g'olib yoki tashkilotni qidirish..."
                          className="w-full pl-9 sm:w-[280px]"
                        />
                      </div>
                      <div className="flex rounded-md border border-input bg-background p-1">
                        {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((risk) => (
                          <button
                            key={risk}
                            type="button"
                            onClick={() => setRiskFilter(risk)}
                            className={cn(
                              "rounded px-3 py-1.5 text-sm transition-colors",
                              riskFilter === risk ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {risk === "ALL" ? "BARCHASI" : risk === "HIGH" ? "YUQORI" : risk === "MEDIUM" ? "O'RTA" : "PAST"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {state === "loading" ? (
                  <div className="p-12 text-center text-sm text-muted-foreground">Ochiq reyestr yuklanmoqda...</div>
                ) : filteredTenders.length === 0 ? (
                  <div className="p-12 text-center text-sm text-muted-foreground">Joriy filterlarga mos tender topilmadi.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredTenders.slice(0, 12).map(({ tender, risk, reason }) => (
                      <article key={tender.id} className="p-5 transition-colors hover:bg-muted/30">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <RiskBadge score={risk === "HIGH" ? 80 : risk === "MEDIUM" ? 45 : 12} level={risk} size="sm" />
                              <span className="font-mono text-xs text-muted-foreground">{tender.id}</span>
                            </div>
                            <h3 className="text-base font-semibold text-foreground">{tender.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {tender.organization} · e'lon qilingan sana {formatDate(tender.publishedAt)}
                            </p>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{reason}</p>
                          </div>
                          <div className="grid shrink-0 grid-cols-2 gap-3 text-sm lg:w-[320px]">
                            <div className="rounded-md border border-border bg-background p-3">
                              <p className="text-xs text-muted-foreground">G'olib</p>
                              <p className="mt-1 truncate font-medium text-foreground">{tender.winner}</p>
                            </div>
                            <div className="rounded-md border border-border bg-background p-3">
                              <p className="text-xs text-muted-foreground">G'olib qiymati</p>
                              <p className="mt-1 font-mono font-semibold text-foreground">
                                {formatCurrency(tender.finalPrice || tender.budget)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-foreground" />
                    <h2 className="text-base font-semibold text-foreground">Tekshiruvdagi kompaniyalar</h2>
                  </div>
                  <div className="space-y-3">
                    {state === "loading" ? (
                      <p className="text-sm text-muted-foreground">Kompaniyalar yuklanmoqda...</p>
                    ) : featuredCompanies.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Hozircha kompaniya xavf ma'lumotlari ochiq emas.</p>
                    ) : (
                      featuredCompanies.map((company) => (
                        <div key={company.id} className="rounded-lg border border-border bg-background p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{company.name}</p>
                              <p className="font-mono text-xs text-muted-foreground">{company.id}</p>
                            </div>
                            <RiskBadge score={company.suspicionScore} level={company.suspicionLevel} size="sm" showLabel={false} />
                          </div>
                          <p className="text-sm leading-5 text-muted-foreground">
                            {company.suspicionFlags[0]?.message ??
                              `${company.totalWins} ta g'alaba va ${company.failedProjects} ta muammoli loyiha qayd etilgan.`}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-gradient-header p-5 text-primary-foreground shadow-elevation-sm">
                  <h2 className="text-base font-semibold">Xarid mas'ullari uchun</h2>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/70">
                    Dalillarni tekshirish, xavfli g'oliblarni bloklash va audit hisobotlarini tayyorlash uchun yopiq paneldan foydalaning.
                  </p>
                  <Button asChild className="mt-4 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                    <Link to="/login">
                      Xavfsiz panelni ochish
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </aside>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
