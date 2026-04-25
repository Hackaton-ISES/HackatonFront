import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/common/Loader";
import { TenderCard } from "@/components/company/TenderCard";
import { ApplicationForm } from "@/components/company/ApplicationForm";
import { useAuth } from "@/context/AuthContext";
import { getApplications, getTenders } from "@/lib/api";
import type { Application, Tender } from "@/types/tender";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Tender | null>(null);
  const [open, setOpen] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [t, a] = await Promise.all([getTenders(), getApplications({ companyId: user.id })]);
      setTenders(t);
      setApplications(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const appliedIds = useMemo(() => new Set(applications.map((a) => a.tenderId)), [applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenders.filter((t) => (q ? t.title.toLowerCase().includes(q) : true));
  }, [tenders, search]);

  const handleApply = (tender: Tender) => {
    setSelected(tender);
    setOpen(true);
  };

  return (
    <main className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Available tenders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse public tenders and submit your bid.
        </p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tenders…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {loading ? (
        <div className="py-20">
          <Loader label="Loading tenders…" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          No tenders match your search.
        </div>
      ) : (
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
