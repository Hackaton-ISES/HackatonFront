import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Trophy, Target, Activity } from "lucide-react";
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
          <p className="text-xs font-mono text-primary-foreground/60 mb-1">{profile.companyId}</p>
          <h1 className="text-2xl font-bold leading-tight">{profile.companyName}</h1>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
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
      </section>

      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Risk history</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {profile.history.length} tender{profile.history.length === 1 ? "" : "s"}
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
                  Risk
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
                  <td className="py-4 px-3">
                    {tender ? (
                      <RiskBadge score={tender.riskScore} level={tender.riskLevel} size="sm" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
