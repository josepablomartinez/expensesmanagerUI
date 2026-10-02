import type { LucideIcon } from "lucide-react";
import { PieChart, TrendingDown, LineChart, CalendarClock, ChartSpline, FileText, Scale, CreditCard, Clock, Sun } from "lucide-react";
import type { useT } from "@/lib/language";

type T = ReturnType<typeof useT>;
type Descriptions = T["reportsLayout"]["descriptions"];

export type ReportId = keyof Descriptions;

interface ReportDef {
  id: ReportId;
  to: string;
  icon: LucideIcon;
  // Essentials are the ones worth checking regularly; the rest live under
  // "More reports" so they don't compete for attention.
  tier: "essential" | "more";
  // Where to go next from this report, most useful first. Shown as the
  // "Keep exploring" links under it.
  related: ReportId[];
}

// Order here is the order in the menu and on the reports home.
const DEFS: ReportDef[] = [
  { id: "budgetVsActual", to: "/reports/budget-vs-actual", icon: PieChart, tier: "essential", related: ["paymentWindow", "incomeVsExpenses", "burndown"] },
  { id: "incomeVsExpenses", to: "/reports/income-vs-expenses", icon: Scale, tier: "essential", related: ["sunburst", "paymentWindow", "creditCard"] },
  { id: "paymentWindow", to: "/reports/payment-window", icon: CalendarClock, tier: "essential", related: ["creditCard", "budgetVsActual"] },
  { id: "creditCard", to: "/reports/charts?view=credit-card", icon: CreditCard, tier: "essential", related: ["paymentWindow", "sunburst"] },
  { id: "sunburst", to: "/reports/spending-sunburst", icon: Sun, tier: "essential", related: ["subcategoriesByMonth", "incomeVsExpenses", "categoryReport"] },
  { id: "subcategoriesByMonth", to: "/reports/subcategories-by-month", icon: LineChart, tier: "essential", related: ["burndown", "incomeVsExpenses"] },
  { id: "burndown", to: "/reports/burndown", icon: TrendingDown, tier: "more", related: ["budgetVsActual", "subcategoriesByMonth"] },
  { id: "hourProfile", to: "/reports/charts?view=hour-profile", icon: Clock, tier: "more", related: ["sunburst", "categoryReport"] },
  { id: "categoryReport", to: "/reports/category-report", icon: FileText, tier: "more", related: ["sunburst", "subcategoriesByMonth"] },
  { id: "exchangeRate", to: "/reports/charts?view=exchange-rate", icon: ChartSpline, tier: "more", related: ["creditCard", "incomeVsExpenses"] },
];

export interface Report extends ReportDef {
  label: string;
  description: string;
}

export function getReports(t: T): Report[] {
  const labels: Record<ReportId, string> = {
    budgetVsActual: t.reportsLayout.tabs.budgetVsActual,
    burndown: t.reportsLayout.tabs.burndown,
    incomeVsExpenses: t.reportsLayout.tabs.incomeVsExpenses,
    paymentWindow: t.reportsLayout.tabs.paymentWindow,
    creditCard: t.charts.creditCard.title,
    sunburst: t.charts.sunburst.title,
    subcategoriesByMonth: t.reportsLayout.tabs.subcategoriesByMonth,
    hourProfile: t.charts.hourProfile.title,
    categoryReport: t.categoryReport.link,
    exchangeRate: t.charts.exchangeRate.title,
  };
  return DEFS.map((d) => ({ ...d, label: labels[d.id], description: t.reportsLayout.descriptions[d.id] }));
}
