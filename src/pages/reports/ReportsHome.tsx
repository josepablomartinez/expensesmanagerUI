import { Link } from "react-router-dom";
import { useT } from "@/lib/language";
import { getReports, type Report } from "@/pages/reports/reportRegistry";

function ReportCard({ report, featured }: { report: Report; featured: boolean }) {
  return (
    <Link to={report.to}
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <report.icon className={featured ? "mt-0.5 h-5 w-5 shrink-0 text-primary" : "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"} aria-hidden="true" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={featured ? "text-base font-semibold" : "text-sm font-medium"}>{report.label}</span>
        <span className="text-sm text-muted-foreground">{report.description}</span>
      </span>
    </Link>
  );
}

// Landing page for Reports: the essentials as big cards, the rest quieter.
export default function ReportsHome() {
  const t = useT();
  const reports = getReports(t);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">{t.reportsLayout.homeIntro}</p>
      <section aria-labelledby="reports-essentials" className="flex flex-col gap-3">
        <h2 id="reports-essentials" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.reportsLayout.groups.essentials}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {reports.filter((r) => r.tier === "essential").map((r) => <ReportCard key={r.id} report={r} featured />)}
        </div>
      </section>
      <section aria-labelledby="reports-more" className="flex flex-col gap-3">
        <h2 id="reports-more" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.reportsLayout.groups.more}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {reports.filter((r) => r.tier === "more").map((r) => <ReportCard key={r.id} report={r} featured={false} />)}
        </div>
      </section>
    </div>
  );
}
