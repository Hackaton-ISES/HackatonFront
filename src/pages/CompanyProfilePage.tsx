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
        <Loader label="Loading company profile…" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="container py-20 text-center">
        <p className="text-sm text-muted-foreground">Company not found or has no activity yet.</p>
        <Link to={backTo} className="text-sm text-primary underline mt-2 inline-block">
          Back
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
        Back
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
          label="Total participations"
          value={profile.totalParticipations}
          icon={Activity}
        />
        <AnalyticsCard
          label="Total wins"
          value={profile.totalWins}
          icon={Trophy}
          accent="low"
        />
        <AnalyticsCard
          label="Win rate"
          value={`${profile.winRate}%`}
          icon={Target}
          accent={profile.winRate >= 50 ? "low" : profile.winRate >= 25 ? "medium" : "high"}
        />
        <AnalyticsCard
          label="Failed projects"
          value={profile.failedProjects}
          icon={AlertTriangle}
          accent={profile.failedProjects > 0 ? "high" : "low"}
        />
      </section>

      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Suspicion Flags</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {profile.suspicionFlags.length} flag{profile.suspicionFlags.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="p-5 space-y-3">
          {profile.suspicionFlags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suspicion flags found.</p>
          ) : (
            profile.suspicionFlags.map((flag, index) => (
              <div
                key={`${flag.message}-${index}`}
                className="rounded-lg border border-border bg-muted/20 p-4"
              >
                <p className="text-sm font-medium text-foreground">{flag.message}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {profile.suspicionAnalysis && (
        <section className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-5 border-b border-border flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-foreground">Suspicion Breakdown</h2>
            <span className="text-xs text-muted-foreground font-mono">
              analyzed {profile.suspicionAnalysis.analyzedAt ? formatDate(profile.suspicionAnalysis.analyzedAt) : "—"}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5">
            <AnalyticsCard label="Price" value={profile.suspicionAnalysis.priceScore} />
            <AnalyticsCard label="Failed delivery" value={profile.suspicionAnalysis.failedDeliveryScore} />
            <AnalyticsCard label="Consecutive wins" value={profile.suspicionAnalysis.consecutiveWinsScore} />
            <AnalyticsCard label="Fake competition" value={profile.suspicionAnalysis.fakeCompetitionScore} />
          </div>
        </section>
      )}

      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Suspicion Reasons</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {profile.reasons.length} reason{profile.reasons.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="p-5 space-y-3">
          {profile.reasons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suspicion reasons found.</p>
          ) : (
            profile.reasons.map((reason) => (
              <div key={reason.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{reason.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{reason.description}</p>
                  </div>
                  <RiskBadge score={reason.score} level={reason.score >= 15 ? "HIGH" : "MEDIUM"} size="sm" showLabel={false} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Won Tenders</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {profile.wonTenders.length} tender{profile.wonTenders.length === 1 ? "" : "s"}
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
                  Bid
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Submitted
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Organization
                </th>
                <th className="py-3 pl-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Final price
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
          <h2 className="text-base font-semibold text-foreground">Application History</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {profile.history.length} application{profile.history.length === 1 ? "" : "s"}
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
                  Bid
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
                      {application.status}
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
