import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FilePlus2, FileSearch, Lock, Pencil } from "lucide-react";
import { Loader } from "@/components/common/Loader";
import { Input } from "@/components/ui/input";
import { getApplications, getTenders } from "@/lib/api";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import type { Application, Tender } from "@/types/tender";

export default function AdminTendersPage() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTenders(), getApplications()])
      .then(([loadedTenders, loadedApplications]) => {
        if (cancelled) return;
        setTenders(loadedTenders);
        setApplications(loadedApplications);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const winnerByTenderId = useMemo(() => {
    const winners = new Map<string, Application>();
    applications.forEach((application) => {
      if (application.status === "Won") {
        winners.set(application.tenderId, application);
      }
    });
    return winners;
  }, [applications]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tenders.filter((tender) => {
      if (!query) return true;
      return (
        tender.title.toLowerCase().includes(query) ||
        tender.organization.toLowerCase().includes(query) ||
        tender.id.toLowerCase().includes(query)
      );
    });
  }, [tenders, search]);

  return (
    <main className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tenders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage published tenders, update open tenders, and finalize a winner when bidding is complete.
          </p>
        </div>
        <Link
          to="/admin/tenders/create"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FilePlus2 className="h-4 w-4" />
          Create tender
        </Link>
      </div>

      <section className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">Tender Management</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {filtered.length} of {tenders.length}
            </span>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, organization, or tender ID..."
            className="max-w-xl"
          />
        </div>

        {loading ? (
          <div className="py-20">
            <Loader label="Loading tenders…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileSearch className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No tenders found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Try adjusting the search query or create a new tender.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tender
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Organization
                  </th>
                  <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Budget
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Deadline
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Winner
                  </th>
                  <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    State
                  </th>
                  <th className="py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tender) => {
                  const winner = winnerByTenderId.get(tender.id);
                  const locked = Boolean(winner) || Boolean(tender.winnerCompanyId);
                  return (
                    <tr key={tender.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="py-4 pl-6 pr-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/tenders/${tender.id}`)}
                          className="text-left"
                        >
                          <p className="font-medium text-foreground hover:text-primary">{tender.title}</p>
                          <p className="text-xs text-muted-foreground font-mono">{tender.id}</p>
                        </button>
                      </td>
                      <td className="py-4 px-3 text-sm text-foreground">{tender.organization}</td>
                      <td className="py-4 px-3 text-right font-mono text-sm text-foreground">
                        {formatCompactCurrency(tender.budget)}
                      </td>
                      <td className="py-4 px-3 text-sm text-muted-foreground">
                        {formatDate(tender.deadline)}
                      </td>
                      <td className="py-4 px-3 text-sm text-foreground">
                        {winner?.companyName ?? tender.winner ?? "—"}
                      </td>
                      <td className="py-4 px-3 text-center">
                        {locked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-risk-medium-bg px-2.5 py-1 text-xs font-medium text-risk-medium">
                            Open
                          </span>
                        )}
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {!locked && (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/tenders/${tender.id}/edit`)}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/tenders/${tender.id}`)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
