import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/common/Loader";
import { AppPagination } from "@/components/common/AppPagination";
import { TenderCard } from "@/components/company/TenderCard";
import { ApplicationForm } from "@/components/company/ApplicationForm";
import { useAuth } from "@/context/AuthContext";
import { getApplications, getTenderPage } from "@/lib/api";
import type { Application, Tender } from "@/types/tender";

const TENDERS_PER_PAGE = 6;

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTenders, setTotalTenders] = useState(0);
  const [selected, setSelected] = useState<Tender | null>(null);
  const [open, setOpen] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [tenderPage, a] = await Promise.all([
        getTenderPage({ page: currentPage, pageSize: TENDERS_PER_PAGE }),
        getApplications({ companyId: user.id }),
      ]);
      setTenders(tenderPage.items);
      setTotalTenders(tenderPage.total);
      setApplications(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentPage]);

  const appliedIds = useMemo(() => new Set(applications.map((a) => a.tenderId)), [applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenders.filter((t) => (q ? t.title.toLowerCase().includes(q) : true));
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

  const handleApply = (tender: Tender) => {
    setSelected(tender);
    setOpen(true);
  };

  return (
    <main className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mavjud tenderlar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ochiq tenderlarni ko'ring va taklifingizni yuboring.
        </p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tenderlarni qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {loading ? (
        <div className="py-20">
          <Loader label="Tenderlar yuklanmoqda..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Qidiruvingizga mos tender topilmadi.
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filtered.map((t) => (
              <TenderCard
                key={t.id}
                tender={t}
                applied={appliedIds.has(t.id)}
                onApply={handleApply}
              />
            ))}
          </section>
          <div className="space-y-2">
            <p className="text-center text-xs text-muted-foreground">
              {currentPage}/{totalPages}-sahifa · {totalTenders} ta tender
            </p>
            <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      <ApplicationForm
        tender={selected}
        open={open}
        onOpenChange={setOpen}
        onSuccess={loadData}
      />
    </main>
  );
}
