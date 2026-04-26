import { AlertTriangle, CheckCircle2, ClipboardList, FileText, Printer, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Application, Tender } from "@/types/tender";

type AwardRecommendation = "safe" | "review" | "audit";

interface ParticipantAuditReview {
  recommendation: AwardRecommendation;
  priceDelta: number | null;
  reasons: string[];
  suspicionScore?: number;
  suspicionLevel?: string;
  failedProjects?: number;
  totalWins?: number;
}

interface AuditReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender;
  participants: Application[];
  selectedWinner: Application | null;
  reviewsByApplicationId: Record<string, ParticipantAuditReview>;
}

const recommendationLabels: Record<AwardRecommendation, string> = {
  safe: "Xavfsiz",
  review: "Tekshiruv kerak",
  audit: "Audit kerak",
};

const recommendationStyles: Record<AwardRecommendation, string> = {
  safe: "border-risk-low-border bg-risk-low-bg text-risk-low",
  review: "border-risk-medium-border bg-risk-medium-bg text-risk-medium",
  audit: "border-risk-high-border bg-risk-high-bg text-risk-high",
};

function getHighestRiskParticipant(
  participants: Application[],
  reviewsByApplicationId: Record<string, ParticipantAuditReview>,
): Application | null {
  if (participants.length === 0) return null;
  const rank: Record<AwardRecommendation, number> = { safe: 0, review: 1, audit: 2 };

  return [...participants].sort((a, b) => {
    const aReview = reviewsByApplicationId[a.id];
    const bReview = reviewsByApplicationId[b.id];
    const aRank = aReview ? rank[aReview.recommendation] : 1;
    const bRank = bReview ? rank[bReview.recommendation] : 1;
    if (aRank !== bRank) return bRank - aRank;

    const aScore = aReview?.suspicionScore ?? 0;
    const bScore = bReview?.suspicionScore ?? 0;
    if (aScore !== bScore) return bScore - aScore;

    return b.proposedPrice - a.proposedPrice;
  })[0];
}

function getCheapestParticipant(participants: Application[]): Application | null {
  if (participants.length === 0) return null;
  return [...participants].sort((a, b) => a.proposedPrice - b.proposedPrice)[0];
}

function RecommendationBadge({ recommendation }: { recommendation: AwardRecommendation }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        recommendationStyles[recommendation],
      )}
    >
      {recommendation === "safe" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {recommendationLabels[recommendation]}
    </span>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function AuditReportDialog({
  open,
  onOpenChange,
  tender,
  participants,
  selectedWinner,
  reviewsByApplicationId,
}: AuditReportDialogProps) {
  const generatedAt = new Date();
  const cheapestParticipant = getCheapestParticipant(participants);
  const highestRiskParticipant = getHighestRiskParticipant(participants, reviewsByApplicationId);
  const reportSubject = selectedWinner ?? highestRiskParticipant ?? cheapestParticipant;
  const subjectReview = reportSubject ? reviewsByApplicationId[reportSubject.id] : undefined;
  const auditRequiredCount = participants.filter(
    (participant) => reviewsByApplicationId[participant.id]?.recommendation === "audit",
  ).length;
  const reviewRequiredCount = participants.filter(
    (participant) => reviewsByApplicationId[participant.id]?.recommendation === "review",
  ).length;
  const baseline = tender.averageMarketPrice || tender.budget;
  const selectedIsNotCheapest = Boolean(selectedWinner && cheapestParticipant && selectedWinner.id !== cheapestParticipant.id);

  const recommendedAction =
    subjectReview?.recommendation === "audit"
      ? "G'olibni tasdiqlashni to'xtating va qo'lda audit tasdig'ini so'rang."
      : subjectReview?.recommendation === "review"
        ? "Yakuniy g'oliblikdan oldin xarid mas'uli tekshiruvi kerak."
        : selectedWinner
          ? "Tasdiqlovchi hujjatlar to'liq bo'lsa, g'oliblik davom etishi mumkin."
          : "G'olibni faqat xavf va narx signallarini solishtirgandan keyin tanlang.";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted">
              <FileText className="h-4 w-4 text-foreground" />
            </span>
            <div>
              <DialogTitle>Audit hisoboti</DialogTitle>
              <DialogDescription>
                Xarid tekshiruvi uchun shakllantirilgan dalillar xulosasi.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Holat xulosasi
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">{tender.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {tender.organization} xarid holati audit tekshiruvi uchun{" "}
                  {generatedAt.toLocaleString("uz-UZ", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })} sanasida yaratildi.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={handlePrint} className="shrink-0">
                <Printer className="mr-2 h-4 w-4" />
                Hisobotni chop etish
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ReportMetric label="Tender ID" value={tender.id} />
              <ReportMetric label="Byudjet" value={formatCurrency(tender.budget)} />
              <ReportMetric label="Baza" value={formatCurrency(baseline)} />
              <ReportMetric label="Muddat" value={formatDate(tender.deadline)} />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Scale className="h-4 w-4 text-foreground" />
                <h3 className="font-semibold text-foreground">G'olib qarori tahlili</h3>
              </div>

              {!reportSubject ? (
                <p className="text-sm text-muted-foreground">Ushbu hisobot uchun ishtirokchi ma'lumoti mavjud emas.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {selectedWinner ? "Tanlangan g'olib" : "Eng xavfli ishtirokchi"}
                    </p>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link
                          to={`/companies/${reportSubject.companyId}`}
                          className="text-lg font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {reportSubject.companyName}
                        </Link>
                        <p className="mt-1 font-mono text-sm text-muted-foreground">
                          Taklif: {formatCurrency(reportSubject.proposedPrice)}
                          {subjectReview?.priceDelta !== null && subjectReview?.priceDelta !== undefined && (
                            <span className={cn("ml-2", subjectReview.priceDelta >= 10 ? "text-risk-high" : "text-muted-foreground")}>
                              {subjectReview.priceDelta > 0 ? "+" : ""}
                              {subjectReview.priceDelta}% bazaga nisbatan
                            </span>
                          )}
                        </p>
                      </div>
                      {subjectReview && <RecommendationBadge recommendation={subjectReview.recommendation} />}
                    </div>
                  </div>

                  {selectedIsNotCheapest && (
                    <div className="rounded-lg border border-risk-medium-border bg-risk-medium-bg p-4 text-sm text-risk-medium">
                      Tanlangan g'olib eng arzon taklif emas. Bu xarid yozuvida asoslanishi kerak.
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tavsiya etilgan amal
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{recommendedAction}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-foreground" />
                <h3 className="font-semibold text-foreground">Hisobot natijalari</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border border-border bg-background p-3 text-center">
                  <p className="font-mono text-xl font-bold text-foreground">{participants.length}</p>
                  <p className="text-xs text-muted-foreground">Ishtirokchilar</p>
                </div>
                <div className="rounded-md border border-risk-high-border bg-risk-high-bg p-3 text-center">
                  <p className="font-mono text-xl font-bold text-risk-high">{auditRequiredCount}</p>
                  <p className="text-xs text-risk-high">Audit</p>
                </div>
                <div className="rounded-md border border-risk-medium-border bg-risk-medium-bg p-3 text-center">
                  <p className="font-mono text-xl font-bold text-risk-medium">{reviewRequiredCount}</p>
                  <p className="text-xs text-risk-medium">Tekshiruv</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Eng arzon taklif</span>
                  <span className="font-medium text-foreground">
                    {cheapestParticipant ? cheapestParticipant.companyName : "Mavjud emas"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Eng yuqori xavf</span>
                  <span className="font-medium text-foreground">
                    {highestRiskParticipant ? highestRiskParticipant.companyName : "Mavjud emas"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Yakuniy narx</span>
                  <span className="font-mono font-medium text-foreground">{formatCurrency(tender.finalPrice || 0)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border p-5">
              <h3 className="font-semibold text-foreground">Dalillar zanjiri</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                G'oliblik tahlilida ishlatilgan ishtirokchi darajasidagi xavf signallari.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Kompaniya
                    </th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Taklif
                    </th>
                    <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Xulosa
                    </th>
                    <th className="py-3 pl-3 pr-5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Dalil
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => {
                    const review = reviewsByApplicationId[participant.id];
                    return (
                      <tr key={participant.id} className="border-b border-border last:border-0">
                        <td className="py-4 pl-5 pr-3">
                          <p className="font-medium text-foreground">{participant.companyName}</p>
                          <p className="font-mono text-xs text-muted-foreground">{participant.companyId}</p>
                        </td>
                        <td className="py-4 px-3 text-right font-mono text-sm text-foreground">
                          {formatCurrency(participant.proposedPrice)}
                        </td>
                        <td className="py-4 px-3">
                          {review ? (
                            <RecommendationBadge recommendation={review.recommendation} />
                          ) : (
                            <span className="text-xs text-muted-foreground">Mavjud emas</span>
                          )}
                        </td>
                        <td className="py-4 pl-3 pr-5 text-sm text-muted-foreground">
                          {review?.reasons.length ? review.reasons.slice(0, 3).join("; ") : "Xavf tafsilotlari mavjud emas."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
