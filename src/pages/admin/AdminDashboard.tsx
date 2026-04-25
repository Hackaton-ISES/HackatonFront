import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Layers } from "lucide-react";
import { toast } from "sonner";
import { FiltersBar, type RiskFilter } from "@/components/dashboard/FiltersBar";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { AnalyticsCard } from "@/components/common/AnalyticsCard";
import { TenderTable } from "@/components/dashboard/TenderTable";
import { TopRiskyOrgsChart } from "@/components/dashboard/TopRiskyOrgsChart";
import { getTenders } from "@/lib/api";
import type { Tender } from "@/types/tender";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [organization, setOrganization] = useState("ALL");

  const highRiskAlerted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTenders()
      .then((data) => {
        if (cancelled) return;
        setTenders(data);
        // 🚨 High risk tender alert (admin notification) — fire once per session.
        if (!highRiskAlerted.current) {
          const highCount = data.filter((t) => t.riskLevel === "HIGH").length;
          if (highCount > 0) {
            toast.error(`🚨 ${highCount} high risk tender${highCount === 1 ? "" : "s"} detected`, {
              description: "Review flagged procurement activity in the dashboard below.",
              duration: 6000,
            });
          }
          highRiskAlerted.current = true;
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Failed to load tenders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const organizations = useMemo(
    () => Array.from(new Set(tenders.map((t) => t.organization))).sort(),
    [tenders],
  );

  const filtered = useMemo(() => {
    return tenders.filter((t) => {
      if (riskFilter !== "ALL" && t.riskLevel !== riskFilter) return false;
      if (organization !== "ALL" && t.organization !== organization) return false;
      if (search.trim() && !t.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [tenders, riskFilter, organization, search]);

  const stats = useMemo(() => {
    const total = tenders.length;
    const high = tenders.filter((t) => t.riskLevel === "HIGH").length;
    const medium = tenders.filter((t) => t.riskLevel === "MEDIUM").length;
    const low = tenders.filter((t) => t.riskLevel === "LOW").length;
    return { total, high, medium, low };
  }, [tenders]);

  const hasFilters = search !== "" || riskFilter !== "ALL" || organization !== "ALL";
  const clearFilters = () => {
    setSearch("");
    setRiskFilter("ALL");
    setOrganization("ALL");
  };

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="rounded-lg bg-muted p-2">
          <ShieldAlert className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Procurement Risk Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor public tenders, surface anomalies, and investigate high-risk activity.
          </p>
        </div>
      </div>

      {/* Analytics summary */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        <AnalyticsCard
          label="Total tenders"
          value={stats.total}
          icon={Layers}
          hint="Currently monitored"
        />
        <AnalyticsCard
          label="High risk"
          value={stats.high}
          emoji="🔴"
          hint={`${stats.total ? Math.round((stats.high / stats.total) * 100) : 0}% of total`}
          accent="high"
        />
        <AnalyticsCard
          label="Medium risk"
          value={stats.medium}
          emoji="🟡"
          hint={`${stats.total ? Math.round((stats.medium / stats.total) * 100) : 0}% of total`}
          accent="medium"
        />
        <AnalyticsCard
          label="Low risk"
          value={stats.low}
          emoji="🟢"
          hint={`${stats.total ? Math.round((stats.low / stats.total) * 100) : 0}% of total`}
          accent="low"
        />
      </section>

      {/* Charts */}
      {!loading && tenders.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up">
          <RiskDistributionChart tenders={tenders} />
          <TopRiskyOrgsChart tenders={tenders} />
        </section>
      )}

      {/* Table card */}
      <section className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Tenders</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {filtered.length} of {tenders.length}
            </span>
          </div>
          <FiltersBar
            search={search}
            onSearchChange={setSearch}
            riskFilter={riskFilter}
            onRiskFilterChange={setRiskFilter}
            organization={organization}
            onOrganizationChange={setOrganization}
            organizations={organizations}
            onClear={clearFilters}
            hasFilters={hasFilters}
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <div className="p-12 text-center text-sm text-risk-high">{error}</div>
        ) : (
          <TenderTable tenders={filtered} onSelect={(t) => navigate(`/admin/tenders/${t.id}`)} />
        )}
      </section>
    </main>
  );
}
