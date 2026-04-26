import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Lock,
  Pencil,
  ShieldAlert,
  Tag,
  Trophy,
  Users,
} from "lucide-react";
import { Loader } from "@/components/common/Loader";
import { AuditReportDialog } from "@/components/dashboard/AuditReportDialog";
import { RecommendedWinnerCard } from "@/components/dashboard/RecommendedWinnerCard";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { CountdownTimer } from "@/components/common/CountdownTimer";
import { getApplications, getCompanyById, getTenderById, updateApplicationStatus } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Application, CompanyDetail, Tender } from "@/types/tender";

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

type AwardRecommendation = "safe" | "review" | "audit";

interface ParticipantRiskReview {
  company: CompanyDetail | null;
  priceDelta: number | null;
  recommendation: AwardRecommendation;
  reasons: string[];
}

const recommendationStyles: Record<AwardRecommendation, string> = {
  safe: "border-risk-low-border bg-risk-low-bg text-risk-low",
  review: "border-risk-medium-border bg-risk-medium-bg text-risk-medium",
  audit: "border-risk-high-border bg-risk-high-bg text-risk-high",
};

const recommendationLabels: Record<AwardRecommendation, string> = {
  safe: "Xavfsiz",
  review: "Tekshiruv",
  audit: "Auditsiz g'olib qilmang",
};

const statusLabels: Record<Application["status"], string> = {
  Pending: "Kutilmoqda",
  Won: "Yutdi",
  Lost: "Yutqazdi",
};

function getPriceDelta(application: Application, tender: Tender): number | null {
  const baseline = tender.averageMarketPrice || tender.budget;
  if (!baseline) return null;
  return Math.round(((application.proposedPrice - baseline) / baseline) * 100);
}

function buildParticipantRiskReview(
  application: Application,
  tender: Tender,
  company: CompanyDetail | null,
): ParticipantRiskReview {
  const priceDelta = getPriceDelta(application, tender);
  const reasons: string[] = [];
  let riskPoints = 0;
  let requiresAudit = false;

  if (!company) {
    reasons.push("Kompaniya profili mavjud emas");
    riskPoints += 1;
  } else {
    if (company.suspicionLevel === "HIGH") {
      reasons.push("Kompaniya shubha darajasi yuqori");
      riskPoints += 4;
      requiresAudit = true;
    } else if (company.suspicionLevel === "MEDIUM") {
      reasons.push("Kompaniya shubha darajasi o'rta");
      riskPoints += 2;
    }

    if (company.failedProjects > 0) {
      reasons.push(`${company.failedProjects} ta avvalgi muammoli loyiha`);
      riskPoints += company.failedProjects >= 2 ? 3 : 2;
    }

    if (company.totalWins >= 5) {
      reasons.push(`${company.totalWins} ta avvalgi g'alaba takroriy g'oliblik xavfini ko'rsatadi`);
      riskPoints += 3;
    } else if (company.totalWins >= 3) {
      reasons.push(`${company.totalWins} ta avvalgi g'alaba qo'shimcha tekshiruv talab qiladi`);
      riskPoints += 2;
    }
  }

  if (priceDelta !== null) {
    if (priceDelta >= 25) {
      reasons.push(`Taklif bazadan ${priceDelta}% yuqori`);
      riskPoints += 4;
    } else if (priceDelta >= 10) {
      reasons.push(`Taklif bazadan ${priceDelta}% yuqori`);
      riskPoints += 2;
    } else if (priceDelta <= -30) {
      reasons.push(`Taklif bazadan ${Math.abs(priceDelta)}% past`);
      riskPoints += 2;
    }
  }

  if (reasons.length === 0) {
    reasons.push("G'oliblikni bloklaydigan jiddiy signal aniqlanmadi");
  }

  return {
    company,
    priceDelta,
    recommendation: requiresAudit ? "audit" : riskPoints >= 2 ? "review" : "safe",
    reasons,
  };
}

export default function AdminTenderDetails() {
  const { id } = useParams<{ id: string }>();
  const [tender, setTender] = useState<Tender | null>(null);
  const [participants, setParticipants] = useState<Application[]>([]);
  const [companyRiskById, setCompanyRiskById] = useState<Record<string, CompanyDetail | null>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [auditTargetId, setAuditTargetId] = useState<string | null>(null);
  const [approvedAuditIds, setApprovedAuditIds] = useState<Set<string>>(new Set());

  const loadData = async (tenderId: string) => {
    const [t, p] = await Promise.all([getTenderById(tenderId), getApplications({ tenderId })]);
    setTender(t ?? null);
    setParticipants(p);

    const uniqueCompanyIds = [...new Set(p.map((participant) => participant.companyId).filter(Boolean))];
    const companyEntries = await Promise.all(
      uniqueCompanyIds.map(async (companyId) => {
        try {
          return [companyId, await getCompanyById(companyId)] as const;
        } catch {
          return [companyId, null] as const;
        }
      }),
    );
    setCompanyRiskById(Object.fromEntries(companyEntries));
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
          setCompanyRiskById({});
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
  const winnerLocked = Boolean(selectedWinner) || Boolean(tender?.winnerCompanyId);

  const participantRiskReviews = useMemo(() => {
    if (!tender) return {};
    return Object.fromEntries(
      participants.map((participant) => [
        participant.id,
        buildParticipantRiskReview(participant, tender, companyRiskById[participant.companyId] ?? null),
      ]),
    ) as Record<string, ParticipantRiskReview>;
  }, [companyRiskById, participants, tender]);

  const winnerReviewData = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(participantRiskReviews).map(([applicationId, review]) => [
          applicationId,
          {
            recommendation: review.recommendation,
            priceDelta: review.priceDelta,
            reasons: review.reasons,
            suspicionScore: review.company?.suspicionScore,
            suspicionLevel: review.company?.suspicionLevel,
            failedProjects: review.company?.failedProjects,
            totalWins: review.company?.totalWins,
          },
        ]),
      ),
    [participantRiskReviews],
  );

  const handleFinalizeWinner = async (appId: string) => {
    const app = participants.find((p) => p.id === appId);
    if (!app) return;
    if (winnerLocked) {
      toast.error("Bu tender bo'yicha g'olib allaqachon tasdiqlangan");
      return;
    }

    const review = participantRiskReviews[appId];
    if (review?.recommendation === "audit" && !approvedAuditIds.has(appId)) {
      toast.error("Bu kompaniyani g'olib qilishdan oldin audit kerak", {
        description: review.reasons.slice(0, 2).join(" · "),
      });
      return;
    }

    setUpdatingId(appId);
    try {
      await updateApplicationStatus(appId, "Won");
      await Promise.all(
        participants
          .filter((participant) => participant.id !== appId && participant.status !== "Lost")
          .map((participant) => updateApplicationStatus(participant.id, "Lost")),
      );
      if (id) {
        await loadData(id);
      }
      toast.success(`${app.companyName} g'olib sifatida tasdiqlandi`, {
        description: "Boshqa barcha arizalar yutqazgan deb belgilandi.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "G'olibni tasdiqlab bo'lmadi");
    } finally {
      setUpdatingId(null);
    }
  };

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

  return (
    <main className="container py-8 space-y-6 animate-fade-in">
      <Link
        to="/admin/tenders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Tenderlarga qaytish
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
          <div className="flex items-center gap-2">
            {participants.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAuditTargetId(null);
                  setReportOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-primary-foreground/10 px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/15"
              >
                <FileText className="h-4 w-4" />
                Hisobot yaratish
              </button>
            )}
            {winnerLocked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/10 px-3 py-1.5 text-sm text-primary-foreground/80">
                <Lock className="h-4 w-4" />
                G'olib qulflangan
              </span>
            ) : (
              <Link
                to={`/admin/tenders/${tender.id}/edit`}
                className="inline-flex items-center gap-2 rounded-md bg-primary-foreground/10 px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/15"
              >
                <Pencil className="h-4 w-4" />
                Tenderni tahrirlash
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Selected winner */}
      <RecommendedWinnerCard
        winner={selectedWinner}
        participants={participants}
        reviewsByApplicationId={winnerReviewData}
      />

      {!winnerLocked && participants.length > 0 && (
        <section className="rounded-lg border border-risk-medium-border bg-risk-medium-bg/60 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-card p-2">
              <ShieldAlert className="h-4 w-4 text-risk-medium" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">G'olibni tanlashdan oldin</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                G'olibni tasdiqlashdan oldin kompaniya xavfi, yetkazib berish tarixi, takroriy g'alabalar va narx anomaliyalarini tekshiring.
              </p>
            </div>
          </div>
        </section>
      )}


      {/* Meta */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 border border-border rounded-lg p-5 bg-card">
        <MetaRow icon={Building2} label="Tashkilot" value={tender.organization} />
        <MetaRow icon={Trophy} label="G'olib" value={tender.winner} />
        <MetaRow icon={Tag} label="Kategoriya" value={tender.category} />
        <MetaRow icon={Calendar} label="E'lon qilingan sana" value={formatDate(tender.publishedAt)} />
        <MetaRow icon={Calendar} label="Muddat" value={formatDate(tender.deadline)} />
        <MetaRow
          icon={DollarSign}
          label="Byudjet"
          value={formatCurrency(tender.budget)}
          valueClassName="font-mono"
        />
        <MetaRow
          label="Yakuniy narx"
          icon={DollarSign}
          value={formatCurrency(tender.finalPrice)}
          valueClassName="font-mono"
        />
        <MetaRow
          icon={Users}
          label="Ishtirokchilar"
          value={`${tender.participantsCount} ta ishtirokchi`}
        />
      </section>

      {/* Participants */}
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Ishtirokchilar</h2>
          <span className="text-xs text-muted-foreground font-mono">{participants.length}</span>
        </div>
        {winnerLocked && (
          <div className="border-b border-border bg-muted/20 px-5 py-3 text-sm text-muted-foreground">
            G'olib tanlovi tasdiqlangan. Ushbu tenderdagi ariza holatlari qulflangan.
          </div>
        )}
        {participants.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Bu tenderga hali ariza yuborilmagan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Kompaniya
                  </th>
                  <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Taklif narxi
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mahsulot
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    G'oliblik xavfi
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Holat
                  </th>
                  <th className="py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => {
                  const isSelectedWinner = selectedWinner?.id === p.id;
                  const review = participantRiskReviews[p.id];
                  const companyRisk = review?.company;
                  const blocked = review?.recommendation === "audit" && !approvedAuditIds.has(p.id);
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
                            ★ G'olib
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-right font-mono tabular-nums text-sm">
                        {formatCurrency(p.proposedPrice)}
                        {review?.priceDelta !== null && review?.priceDelta !== undefined && (
                          <p
                            className={cn(
                              "mt-1 text-xs",
                              review.priceDelta >= 10
                                ? "text-risk-high"
                                : review.priceDelta <= -30
                                  ? "text-risk-medium"
                                  : "text-muted-foreground",
                            )}
                          >
                            {review.priceDelta > 0 ? "+" : ""}
                            {review.priceDelta}% bazaga nisbatan
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-3 text-sm text-foreground/80">{p.productName}</td>
                      <td className="py-4 px-3 min-w-[280px]">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {companyRisk ? (
                              <RiskBadge
                                score={companyRisk.suspicionScore}
                                level={companyRisk.suspicionLevel}
                                size="sm"
                              />
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                Xavf ma'lumoti yo'q
                              </span>
                            )}
                            {review && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                                  recommendationStyles[review.recommendation],
                                )}
                              >
                                {review.recommendation === "safe" ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3" />
                                )}
                                {recommendationLabels[review.recommendation]}
                              </span>
                            )}
                          </div>
                          <div className="text-xs leading-5 text-muted-foreground">
                            {review?.reasons.slice(0, 2).map((reason) => (
                              <p key={reason}>{reason}</p>
                            ))}
                          </div>
                        </div>
                      </td>
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
                          {statusLabels[p.status]}
                        </span>
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        {winnerLocked ? (
                          <span className="text-xs text-muted-foreground">Qulflangan</span>
                        ) : blocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAuditTargetId(p.id);
                              setReportOpen(true);
                              toast.error("Yuqori xavfli kompaniya uchun audit kerak", {
                                description: review.reasons.slice(0, 2).join(" · "),
                              });
                            }}
                            className="rounded-md border border-risk-high-border bg-risk-high-bg px-3 py-1.5 text-xs font-medium text-risk-high"
                          >
                            Audit hisobotini ochish
                          </button>
                        ) : (
                          <button
                            onClick={() => void handleFinalizeWinner(p.id)}
                            disabled={updatingId !== null}
                            className="rounded-md border border-risk-low-border bg-risk-low-bg px-3 py-1.5 text-xs font-medium text-risk-low transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                          >
                            G'olib sifatida tasdiqlash
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AuditReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        tender={tender}
        participants={participants}
        selectedWinner={selectedWinner}
        reviewsByApplicationId={winnerReviewData}
        auditTargetId={auditTargetId}
        approvedAuditIds={approvedAuditIds}
        onApproveAudit={(applicationId) => {
          setApprovedAuditIds((current) => new Set(current).add(applicationId));
          toast.success("Audit tasdiqlandi", {
            description: "Endi ushbu kompaniyani g'olib sifatida tasdiqlash mumkin.",
          });
        }}
      />
    </main>
  );
}
