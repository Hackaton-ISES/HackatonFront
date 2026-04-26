import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { Loader } from "@/components/common/Loader";
import { getApplications, getTenderById, updateTender } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Application, Tender } from "@/types/tender";

export default function AdminEditTender() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tender, setTender] = useState<Tender | null>(null);
  const [participants, setParticipants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    Promise.all([getTenderById(id), getApplications({ tenderId: id })])
      .then(([loadedTender, loadedParticipants]) => {
        if (cancelled) return;
        setTender(loadedTender ?? null);
        setParticipants(loadedParticipants);
        if (loadedTender) {
          setTitle(loadedTender.title);
          setOrganization(loadedTender.organization);
          setCategory(loadedTender.category);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="container py-20">
        <Loader label="Tender yuklanmoqda..." />
      </main>
    );
  }

  if (!tender) {
    return (
      <main className="container py-20 text-center">
        <p className="text-sm text-muted-foreground">Tender topilmadi.</p>
        <Link to="/admin/tenders" className="text-sm text-primary underline mt-2 inline-block">
          Tenderlarga qaytish
        </Link>
      </main>
    );
  }

  const winnerLocked =
    Boolean(tender.winnerCompanyId) || participants.some((participant) => participant.status === "Won");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tender) return;
    if (!title.trim() || !organization.trim() || !category.trim()) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateTender(tender.id, {
        title: title.trim(),
        organization: organization.trim(),
        category: category.trim(),
        budget: tender.budget,
        averageMarketPrice: tender.averageMarketPrice ?? 0,
        deadline: tender.deadline,
        createdAt: tender.publishedAt,
        finalPrice: tender.finalPrice,
        status: tender.status ?? "active",
      });
      toast.success("Tender yangilandi");
      navigate(`/admin/tenders/${updated.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tenderni yangilab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container py-8 max-w-2xl space-y-6">
      <Link
        to={`/admin/tenders/${tender.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Tenderga qaytish
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tenderni tahrirlash</h1>
        <p className="text-sm text-muted-foreground mt-1">
          G'olib tasdiqlanishidan oldin tender ma'lumotlarini yangilang.
        </p>
      </div>

      {winnerLocked ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Lock className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Tender qulflangan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Bu tender bo'yicha g'olib allaqachon tasdiqlangan, shuning uchun e'lon ma'lumotlarini o'zgartirib bo'lmaydi.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm animate-fade-in"
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Nomi *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="organization">Tashkilot *</Label>
            <Input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Kategoriya *</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={60}
              required
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Byudjet, o'rtacha bozor narxi va muddat yaratilgandan keyin o'zgarmaydi.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(`/admin/tenders/${tender.id}`)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving} className="min-w-[140px]">
              {saving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
