import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FilePlus2, FileSearch, Lock, Pencil } from "lucide-react";
import { AppPagination } from "@/components/common/AppPagination";
import { Loader } from "@/components/common/Loader";
import { Input } from "@/components/ui/input";
import { getApplications, getTenderPage } from "@/lib/api";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import type { Application, Tender } from "@/types/tender";

const TENDERS_PER_PAGE = 6;

export default function AdminTendersPage() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTenders, setTotalTenders] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getTenderPage({ page: currentPage, pageSize: TENDERS_PER_PAGE }),
      getApplications(),
    ])
      .then(([tenderPage, loadedApplications]) => {
        if (cancelled) return;
        setTenders(tenderPage.items);
        setTotalTenders(tenderPage.total);
        setApplications(loadedApplications);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

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

  const totalPages = Math.max(1, Math.ceil(totalTenders / TENDERS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tenderlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            E'lon qilingan tenderlarni boshqaring, ochiq tenderlarni yangilang va arizalar yakunlanganda g'olibni tasdiqlang.
          </p>
        </div>
        <Link
          to="/admin/tenders/create"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FilePlus2 className="h-4 w-4" />
          Tender yaratish
        </Link>
      </div>

      <section className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">Tenderlarni boshqarish</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {filtered.length} / {totalTenders}
            </span>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nomi, tashkilot yoki tender ID bo'yicha qidirish..."
            className="max-w-xl"
          />
        </div>

        {loading ? (
          <div className="py-20">
            <Loader label="Tenderlar yuklanmoqda..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileSearch className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Tender topilmadi</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Qidiruvni o'zgartiring yoki yangi tender yarating.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tender
                    </th>
                    <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tashkilot
                    </th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Byudjet
                    </th>
                    <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Muddat
                    </th>
                    <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      G'olib
                    </th>
                    <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Holat
                    </th>
                    <th className="py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Amallar
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
                              Qulflangan
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-risk-medium-bg px-2.5 py-1 text-xs font-medium text-risk-medium">
                              Ochiq
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
                                Tahrirlash
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/tenders/${tender.id}`)}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              Ko'rish
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 px-6 pb-6">
              <p className="text-center text-xs text-muted-foreground">
                {currentPage}/{totalPages}-sahifa · {totalTenders} ta tender
              </p>
              <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
