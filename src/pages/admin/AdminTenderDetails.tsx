import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Tag,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Loader } from "@/components/common/Loader";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { RiskFlagItem } from "@/components/dashboard/RiskFlagItem";
import { RecommendedWinnerCard } from "@/components/dashboard/RecommendedWinnerCard";
import { CountdownTimer } from "@/components/common/CountdownTimer";
import { getApplications, getTenderById, updateApplicationStatus } from "@/lib/api";
import { formatCurrency, formatDate, priceDeltaPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Application, Tender } from "@/types/tender";

interface MetaRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

function MetaRow({ icon: Icon, label, value, valueClassName }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className={cn("text-sm font-medium text-foreground", valueClassName)}>{value}</p>
      </div>
    </div>
  );
}

export default function AdminTenderDetails() {
  const { id } = useParams<{ id: string }>();
  const [tender, setTender] = useState<Tender | null>(null);
  const [participants, setParticipants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async (tenderId: string) => {
    const [t, p] = await Promise.all([getTenderById(tenderId), getApplications({ tenderId })]);
    setTender(t ?? null);
    setParticipants(p);
  };

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    setLoading(true);
    loadData(id)
      .catch(() => {
        if (!cancelled) {
          setTender(null);
          setParticipants([]);
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
  }, [id]);

  const selectedWinner = useMemo(
    () => participants.find((participant) => participant.status === "Won") ?? null,
    [participants],
  );

  const handleStatusUpdate = async (appId: string, status: "Won" | "Lost") => {
    const app = participants.find((p) => p.id === appId);
    if (!app) return;

    setUpdatingId(appId);
    try {
      await updateApplicationStatus(appId, status);
      if (id) {
        await loadData(id);
      }

      if (status === "Won") {
        toast.success(`Marked ${app.companyName} as winner`, {
          description: "Backend status updated successfully.",
        });
      } else {
        toast(`Marked ${app.companyName} as not selected`, {
          description: "Backend status updated successfully.",
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update application status");
    } finally {
      setUpdatingId(null);
    }
  };

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
        <Link to="/admin" className="text-sm text-primary underline mt-2 inline-block">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const delta = priceDeltaPct(tender.budget, tender.finalPrice);
  const isAllPositive = tender.riskLevel === "LOW";

  return (
    <main className="container py-8 space-y-6 animate-fade-in">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="bg-gradient-header text-primary-foreground p-6 rounded-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-primary-foreground/60 mb-1">{tender.id}</p>
            <h1 className="text-2xl font-bold leading-tight">{tender.title}</h1>
            <p className="text-primary-foreground/70 text-sm mt-2 leading-relaxed">
              {tender.description}
            </p>
            <div className="mt-3">
              <CountdownTimer deadline={tender.deadline} />
            </div>
          </div>
          <RiskBadge score={tender.riskScore} level={tender.riskLevel} size="lg" />
        </div>
      </div>

      {/* Selected winner */}
      <RecommendedWinnerCard winner={selectedWinner} />


      {/* Meta */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 border border-border rounded-lg p-5 bg-card">
        <MetaRow icon={Building2} label="Organization" value={tender.organization} />
        <MetaRow icon={Trophy} label="Winner" value={tender.winner} />
        <MetaRow icon={Tag} label="Category" value={tender.category} />
        <MetaRow icon={Calendar} label="Published" value={formatDate(tender.publishedAt)} />
        <MetaRow icon={Calendar} label="Deadline" value={formatDate(tender.deadline)} />
        <MetaRow
          icon={DollarSign}
          label="Budget"
          value={formatCurrency(tender.budget)}
          valueClassName="font-mono"
        />
        <MetaRow
          icon={TrendingUp}
          label="Final price"
          value={
            <span className="flex items-baseline gap-2">
              <span className="font-mono">{formatCurrency(tender.finalPrice)}</span>
              <span
                className={cn(
                  "text-xs font-mono",
                  delta > 15 ? "text-risk-high" : delta > 5 ? "text-risk-medium" : "text-risk-low",
                )}
              >
                {delta > 0 ? "+" : ""}
                {delta}%
              </span>
            </span>
          }
        />
        <MetaRow
          icon={Users}
          label="Participants"
          value={`${tender.participantsCount} bidder${tender.participantsCount === 1 ? "" : "s"}`}
          valueClassName={tender.participantsCount === 1 ? "text-risk-high" : ""}
        />
      </section>

      {/* Participants */}
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Participants</h2>
          <span className="text-xs text-muted-foreground font-mono">{participants.length}</span>
        </div>
        {participants.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No applications submitted for this tender yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Company
                  </th>
                  <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Proposed price
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Product
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => {
                  const isSelectedWinner = selectedWinner?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors hover:bg-muted/40",
                        isSelectedWinner && "bg-risk-low-bg/30",
                      )}
                    >
                      <td className="py-4 pl-6 pr-3 text-sm">
                        <Link
                          to={`/companies/${p.companyId}`}
                          className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                        >
                          {p.companyName}
                        </Link>
                        {isSelectedWinner && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-risk-low-bg text-risk-low px-2 py-0.5 text-[10px] font-medium">
                            ★ Winner
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-right font-mono tabular-nums text-sm">
                        {formatCurrency(p.proposedPrice)}
                      </td>
                      <td className="py-4 px-3 text-sm text-foreground/80">{p.productName}</td>
                      <td className="py-4 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            p.status === "Won"
                              ? "bg-risk-low-bg text-risk-low border-risk-low-border"
                              : p.status === "Lost"
                                ? "bg-risk-high-bg text-risk-high border-risk-high-border"
                                : "bg-risk-medium-bg text-risk-medium border-risk-medium-border",
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => void handleStatusUpdate(p.id, "Won")}
                            disabled={p.status === "Won" || updatingId === p.id}
                            className="rounded-md border border-risk-low-border bg-risk-low-bg px-2.5 py-1 text-xs font-medium text-risk-low transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                          >
                            Win
                          </button>
                          <button
                            onClick={() => void handleStatusUpdate(p.id, "Lost")}
                            disabled={p.status === "Lost" || updatingId === p.id}
                            className="rounded-md border border-risk-high-border bg-risk-high-bg px-2.5 py-1 text-xs font-medium text-risk-high transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                          >
                            Lose
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


      {/* Risk Analysis */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Risk Analysis
          </h2>
          <span className="text-xs text-muted-foreground">
            {tender.riskFlags.filter((f) => (f.points ?? 0) > 0).length} triggered rule
            {tender.riskFlags.filter((f) => (f.points ?? 0) > 0).length === 1 ? "" : "s"} · total{" "}
            <span className="font-mono font-semibold text-foreground">{tender.riskScore}</span>/100
          </span>
        </div>
        <div
          className={cn(
            "rounded-lg border p-5",
            tender.riskLevel === "HIGH" && "bg-risk-high-bg/40 border-risk-high-border",
            tender.riskLevel === "MEDIUM" && "bg-risk-medium-bg/40 border-risk-medium-border",
            tender.riskLevel === "LOW" && "bg-risk-low-bg/40 border-risk-low-border",
          )}
        >
          <ul className="space-y-2.5">
            {tender.riskFlags.map((flag, i) => (
              <RiskFlagItem key={i} flag={flag} positive={isAllPositive} />
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
