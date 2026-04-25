import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { Loader } from "@/components/common/Loader";
import { TenderForm } from "@/components/admin/TenderForm";
import { getApplications, getTenderById, updateTender } from "@/lib/api";
import { toast } from "sonner";
import type { Application, Tender } from "@/types/tender";

function toDateTimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AdminEditTender() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tender, setTender] = useState<Tender | null>(null);
  const [participants, setParticipants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    Promise.all([getTenderById(id), getApplications({ tenderId: id })])
      .then(([loadedTender, loadedParticipants]) => {
        if (cancelled) return;
        setTender(loadedTender ?? null);
        setParticipants(loadedParticipants);
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
        <Loader label="Loading tender…" />
      </main>
    );
  }

  if (!tender) {
    return (
      <main className="container py-20 text-center">
        <p className="text-sm text-muted-foreground">Tender not found.</p>
        <Link to="/admin/tenders" className="text-sm text-primary underline mt-2 inline-block">
          Back to tenders
        </Link>
      </main>
    );
  }

  const winnerLocked =
    Boolean(tender.winnerCompanyId) || participants.some((participant) => participant.status === "Won");

  return (
    <main className="container py-8 max-w-2xl space-y-6">
      <Link
        to={`/admin/tenders/${tender.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tender
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit tender</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update tender details before a winner is finalized.
        </p>
      </div>

      {winnerLocked ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Lock className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Tender is locked</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A winner has already been finalized for this tender, so publish-time fields can no longer be changed.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <TenderForm
          initialValues={{
            title: tender.title,
            organization: tender.organization,
            category: tender.category,
            budget: tender.budget ? String(tender.budget) : "",
            averageMarketPrice: tender.averageMarketPrice ? String(tender.averageMarketPrice) : "",
            deadline: toDateTimeLocal(tender.deadline),
          }}
          submitLabel="Save changes"
          submittingLabel="Saving changes..."
          onSubmit={async (values) => {
            try {
              const updated = await updateTender(tender.id, {
                ...values,
                createdAt: tender.publishedAt,
                finalPrice: tender.finalPrice,
                status: tender.status ?? "active",
              });
              toast.success("Tender updated");
              navigate(`/admin/tenders/${updated.id}`, { replace: true });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to update tender");
            }
          }}
          onCancel={() => navigate(`/admin/tenders/${tender.id}`)}
        />
      )}
    </main>
  );
}
