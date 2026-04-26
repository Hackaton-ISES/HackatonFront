import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Building2 } from "lucide-react";
import { AppPagination } from "@/components/common/AppPagination";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { getCompanyPage } from "@/lib/api";
import type { CompanySummary, RiskLevel } from "@/types/tender";

type SuspicionFilter = "ALL" | RiskLevel;

const COMPANIES_PER_PAGE = 10;

export default function AdminCompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<SuspicionFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCompanyPage({ page: currentPage, pageSize: COMPANIES_PER_PAGE })
      .then((companyPage) => {
        if (cancelled) return;
        setCompanies(companyPage.items);
        setTotalCompanies(companyPage.total);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Failed to load companies");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return companies
      .filter((company) => {
        if (levelFilter !== "ALL" && company.suspicionLevel !== levelFilter) return false;
        if (!query) return true;
        return (
          company.name.toLowerCase().includes(query) ||
          company.id.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (b.suspicionScore !== a.suspicionScore) return b.suspicionScore - a.suspicionScore;
        if (b.failedProjects !== a.failedProjects) return b.failedProjects - a.failedProjects;
        return a.name.localeCompare(b.name);
      });
  }, [companies, levelFilter, search]);

  const totalPages = Math.max(1, Math.ceil(totalCompanies / COMPANIES_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, levelFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="container py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">
          <Building2 className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Review participating companies, sort by suspicion, and open company profiles for details.
          </p>
        </div>
      </div>

      <section className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">Company Management</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {filtered.length} of {totalCompanies}
            </span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company name or ID..."
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
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Company
                    </th>
                    <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Suspicion
                    </th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Participations
                    </th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Wins
                    </th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Failed projects
                    </th>
                    <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Top reasons
                    </th>
                    <th className="py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
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
                      <td className="py-4 px-3 text-right font-mono text-sm text-foreground">
                        {company.totalParticipations}
                      </td>
                      <td className="py-4 px-3 text-right font-mono text-sm text-foreground">
                        {company.totalWins}
                      </td>
                      <td className="py-4 px-3 text-right font-mono text-sm text-foreground">
                        {company.failedProjects}
                      </td>
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
            <div className="space-y-2 px-6 pb-6">
              <p className="text-center text-xs text-muted-foreground">
                Page {currentPage} of {totalPages} · {totalCompanies} compan{totalCompanies === 1 ? "y" : "ies"}
              </p>
              <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
