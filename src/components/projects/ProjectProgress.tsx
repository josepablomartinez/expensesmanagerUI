import type { Project } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { localDate } from "@/lib/recurrent";
import { useLanguage } from "@/lib/language";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Same severity convention as the budget reports.
function severityBarClass(pct: number) {
  if (pct >= 100) return "bg-destructive";
  if (pct >= 90) return "bg-warning";
  if (pct >= 75) return "bg-amber-500";
  return "bg-primary";
}

export function ProjectStatusBadge({ status }: { status: Project["status"] }) {
  const { t } = useLanguage();
  return (
    <Badge variant={status === "active" ? "default" : status === "inactive" ? "secondary" : "outline"}>
      {t.projects.status[status]}
    </Badge>
  );
}

// "Feb 14 – Feb 21, 2027", "From Feb 14, 2027", "Until ..." or nothing.
export function projectDateRange(project: Pick<Project, "start_date" | "end_date">, locale: string) {
  const fmt = (v: string) => localDate(v).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  if (project.start_date && project.end_date) return `${fmt(project.start_date)} – ${fmt(project.end_date)}`;
  if (project.start_date) return `${fmt(project.start_date)} –`;
  if (project.end_date) return `– ${fmt(project.end_date)}`;
  return null;
}

// Spend against the soft budget, in the budget's own currency (the stored
// colones/dollars amounts, no conversion). Without a budget it's just the
// spend in the display currency.
export function ProjectProgress({ project, className }: { project: Project; className?: string }) {
  const { t } = useLanguage();
  const { currency } = useCurrency();

  if (project.budget == null) {
    const spent = currency === "USD" ? project.spent_dollars : project.spent_colones;
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>{t.projects.spent(formatMoney(spent, currency))}</p>
    );
  }

  const spent = project.budget_currency === "USD" ? project.spent_dollars : project.spent_colones;
  const pct = project.pct_used ?? 0;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full", severityBarClass(pct))} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className={cn("tabular-nums", pct >= 100 ? "font-medium text-destructive" : "text-muted-foreground")}>
          {t.projects.spentOf(formatMoney(spent, project.budget_currency), formatMoney(project.budget, project.budget_currency))}
        </span>
        <span className={cn("tabular-nums", pct >= 100 ? "font-medium text-destructive" : "text-muted-foreground")}>
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}
