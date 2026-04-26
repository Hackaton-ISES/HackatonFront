import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Trophy, Target, Activity, AlertTriangle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Loader } from "@/components/common/Loader";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { AnalyticsCard } from "@/components/common/AnalyticsCard";
import { getCompanyProfile, type CompanyProfile } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/tender";
import { useAuth } from "@/context/AuthContext";

const statusStyles: Record<ApplicationStatus, string> = {
  Pending: "bg-risk-medium-bg text-risk-medium border-risk-medium-border",
  Won: "bg-risk-low-bg text-risk-low border-risk-low-border",
  Lost: "bg-risk-high-bg text-risk-high border-risk-high-border",
};

const statusLabels: Record<ApplicationStatus, string> = {
  Pending: "Kutilmoqda",
  Won: "Yutdi",
  Lost: "Yutqazdi",
};

export default function CompanyProfilePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    getCompanyProfile(companyId)
      .then((p) => setProfile(p))
      .finally(() => setLoading(false));
  }, [companyId]);

  const backTo = user?.role === "admin" ? "/admin" : "/company";

  if (loading) {
    return (
      <main className="container py-20">
        <Loader label="Kompaniya profili yuklanmoqda..." />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="container py-20 text-center">
        <p className="text-sm text-muted-foreground">Kompaniya topilmadi yoki hali faolligi yo'q.</p>
        <Link to={backTo} className="text-sm text-primary underline mt-2 inline-block">
          Qaytish
        </Link>
      </main>
    );
  }

  return (
    <main className="container py-8 space-y-6 animate-fade-in">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Qaytish
      </Link>

      <div className="bg-gradient-header text-primary-foreground p-6 rounded-lg flex items-center gap-4">
        <div className="rounded-lg bg-primary-foreground/10 p-3 backdrop-blur">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-mono text-primary-foreground/60 mb-1">{profile.id}</p>
          <h1 className="text-2xl font-bold leading-tight">{profile.name}</h1>
        </div>
        <div className="ml-auto">
          <RiskBadge score={profile.suspicionScore} level={profile.suspicionLevel} size="lg" />
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        <AnalyticsCard
          label="Jami ishtiroklar"
          value={profile.totalParticipations}
          icon={Activity}
        />
        <AnalyticsCard
          label="Jami g'alabalar"
          value={profile.totalWins}
          icon={Trophy}
          accent="low"
        />
        <AnalyticsCard
          label="G'alaba foizi"
          value={`${profile.winRate}%`}
          icon={Target}
          accent={profile.winRate >= 50 ? "low" : profile.winRate >= 25 ? "medium" : "high"}
        />
        <AnalyticsCard
          label="Muammoli loyihalar"
          value={profile.failedProjects}
          icon={AlertTriangle}
          accent={profile.failedProjects > 0 ? "high" : "low"}
        />
      </section>

      {profile.suspicionAnalysis && (
        <section className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-5 border-b border-border flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">Shubha taqsimoti</h2>
            <span className="text-xs text-muted-foreground font-mono">
              tahlil qilingan sana {profile.suspicionAnalysis.analyzedAt ? formatDate(profile.suspicionAnalysis.analyzedAt) : "—"}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5">
            <AnalyticsCard label="Narx" value={profile.suspicionAnalysis.priceScore} />
            <AnalyticsCard label="Yetkazishdagi muammo" value={profile.suspicionAnalysis.failedDeliveryScore} />
            <AnalyticsCard label="Ketma-ket g'alabalar" value={profile.suspicionAnalysis.consecutiveWinsScore} />
            <AnalyticsCard label="Soxta raqobat" value={profile.suspicionAnalysis.fakeCompetitionScore} />
          </div>
          {profile.suspicionAnalysis.aiSummary && (
            <div className="border-t border-border p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                AI xulosasi
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {profile.suspicionAnalysis.aiSummary}
              </p>
            </div>
          )}
        </section>
      )}
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Yutilgan tenderlar</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {profile.wonTenders.length} ta tender
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tender
                </th>
                <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Taklif
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Yuborilgan sana
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tashkilot
                </th>
                <th className="py-3 pl-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Yakuniy narx
                </th>
              </tr>
            </thead>
            <tbody>
              {profile.wonTenders.map((tender) => (
                <tr key={tender.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="py-4 pl-6 pr-3">
                    <p className="font-medium text-foreground line-clamp-1">
                      {tender.title}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{tender.id}</p>
                  </td>
                  <td className="py-4 px-3 text-right font-mono tabular-nums text-sm">
                    {formatCurrency(tender.budget)}
                  </td>
                  <td className="py-4 px-3 text-sm text-muted-foreground">
                    {formatDate(tender.publishedAt)}
                  </td>
                  <td className="py-4 px-3">
                    <span className="text-sm text-foreground">{tender.organization}</span>
                  </td>
                  <td className="py-4 pl-3 pr-6 text-sm font-mono text-foreground">
                    {formatCurrency(tender.finalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Arizalar tarixi</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {profile.history.length} ta ariza
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tender
                </th>
                <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Taklif
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Yuborilgan sana
                </th>
                <th className="py-3 pl-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Holat
                </th>
              </tr>
            </thead>
            <tbody>
              {profile.history.map(({ application, tender }) => (
                <tr key={application.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="py-4 pl-6 pr-3">
                    <p className="font-medium text-foreground line-clamp-1">
                      {tender?.title ?? application.tenderId}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{application.tenderId}</p>
                  </td>
                  <td className="py-4 px-3 text-right font-mono tabular-nums text-sm">
                    {formatCurrency(application.proposedPrice)}
                  </td>
                  <td className="py-4 px-3 text-sm text-muted-foreground">
                    {formatDate(application.submittedAt)}
                  </td>
                  <td className="py-4 pl-3 pr-6">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        statusStyles[application.status],
                      )}
                    >
                      {statusLabels[application.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
