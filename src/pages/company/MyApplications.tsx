import { useEffect, useMemo, useState } from "react";
import { Loader } from "@/components/common/Loader";
import { AppPagination } from "@/components/common/AppPagination";
import { useAuth } from "@/context/AuthContext";
import { getApplicationPage, getTenders } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus, Tender } from "@/types/tender";

const APPLICATIONS_PER_PAGE = 8;

const statusStyles: Record<ApplicationStatus, string> = {
  Pending: "bg-risk-medium-bg text-risk-medium border-risk-medium-border",
  Won: "bg-risk-low-bg text-risk-low border-risk-low-border",
  Lost: "bg-risk-high-bg text-risk-high border-risk-high-border",
};

export default function MyApplications() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    setLoading(true);
    Promise.all([
      getApplicationPage({ companyId: user.id, page: currentPage, pageSize: APPLICATIONS_PER_PAGE }),
      getTenders(),
    ])
      .then(([applicationPage, t]) => {
        if (!cancelled) {
          setApps(applicationPage.items);
          setTotalApplications(applicationPage.total);
          setTenders(t);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentPage, user]);

  const tenderById = useMemo(() => {
    const map = new Map<string, Tender>();
    tenders.forEach((t) => map.set(t.id, t));
    return map;
  }, [tenders]);

  const totalPages = Math.max(1, Math.ceil(totalApplications / APPLICATIONS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track the status of every tender you have applied to.
        </p>
      </div>

      <section className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20">
            <Loader label="Loading applications…" />
          </div>
        ) : apps.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-muted-foreground">You haven't applied to any tenders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto animate-fade-in">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tender
                    </th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Submitted price
                    </th>
                    <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Submitted
                    </th>
                    <th className="py-3 pl-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => {
                    const t = tenderById.get(a.tenderId);
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                      >
                        <td className="py-4 pl-6 pr-3">
                          <p className="font-medium text-foreground line-clamp-1">
                            {t?.title ?? a.tenderId}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{a.tenderId}</p>
                        </td>
                        <td className="py-4 px-3 text-right font-mono tabular-nums text-sm text-foreground">
                          {formatCurrency(a.proposedPrice)}
                        </td>
                        <td className="py-4 px-3 text-sm text-muted-foreground">
                          {formatDate(a.submittedAt)}
                        </td>
                        <td className="py-4 pl-3 pr-6">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              statusStyles[a.status],
                            )}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 px-6 pb-6">
              <p className="text-center text-xs text-muted-foreground">
                Page {currentPage} of {totalPages} · {totalApplications} application{totalApplications === 1 ? "" : "s"}
              </p>
              <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
