import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Layers, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AnalyticsCard } from "@/components/common/AnalyticsCard";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { getCompanies, getSuspicionStats } from "@/lib/api";
import type { CompanySummary, RiskLevel, SuspicionStats } from "@/types/tender";

type SuspicionFilter = "ALL" | RiskLevel;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [stats, setStats] = useState<SuspicionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<SuspicionFilter>("ALL");

  const highAlerted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getCompanies(), getSuspicionStats()])
      .then(([companyList, dashboardStats]) => {
        if (cancelled) return;
        setCompanies(companyList);
        setStats(dashboardStats);

        if (!highAlerted.current && dashboardStats.high > 0) {
          toast.error(`${dashboardStats.high} high suspicion compan${dashboardStats.high === 1 ? "y" : "ies"} detected`, {
            description: "Review company suspicion details in the dashboard below.",
            duration: 6000,
          });
          highAlerted.current = true;
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Failed to load dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return companies.filter((company) => {
      if (levelFilter !== "ALL" && company.suspicionLevel !== levelFilter) return false;
      if (!query) return true;
      return company.name.toLowerCase().includes(query);
    });
  }, [companies, levelFilter, search]);

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
            Company Suspicion Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor suspicious companies, review backend analysis, and investigate repeated abuse patterns.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        <AnalyticsCard label="Total companies" value={effectiveStats.total} icon={Layers} hint="Tracked by backend" />
        <AnalyticsCard label="High suspicion" value={effectiveStats.high} emoji="🔴" accent="high" />
        <AnalyticsCard label="Medium suspicion" value={effectiveStats.medium} emoji="🟡" accent="medium" />
        <AnalyticsCard label="Low suspicion" value={effectiveStats.low} emoji="🟢" accent="low" />
      </section>

      {!loading && stats && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up">
          <RiskDistributionChart stats={stats} />

          <div className="bg-card border border-border rounded-lg p-5 shadow-elevation-sm">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Top Suspicious Companies
              </h3>
              <span className="text-xs text-muted-foreground">Highest scores</span>
            </div>
            <div className="space-y-3">
              {stats.topSuspiciousCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No suspicious companies found.</p>
              ) : (
                stats.topSuspiciousCompanies.map((company) => (
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
            <h2 className="text-base font-semibold text-foreground">Companies Suspicion List</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {filtered.length} of {companies.length}
            </span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company name..."
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
                  {level}
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
            No companies match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suspicion</th>
                  <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wins</th>
                  <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Failed projects</th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top reasons</th>
                  <th className="py-3 pl-3 pr-6 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((company) => (
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
                      {company.suspicionFlags.length > 0 ? company.suspicionFlags[0].message : "No suspicion flags"}
                    </td>
                    <td className="py-4 pl-3 pr-6 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/companies/${company.id}`)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
