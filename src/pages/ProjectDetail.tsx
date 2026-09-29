import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { api, ApiError, type Category, type CreditCard, type Expense, type ProjectSummary } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { ExpenseFrame } from "@/components/expenses/ExpenseFrame";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectProgress, ProjectStatusBadge, projectDateRange } from "@/components/projects/ProjectProgress";

// The project's dates are only hints, so its expenses are fetched across
// every date rather than the project's own range.
const ALL_TIME = { from: "2000-01-01", to: "2100-12-31" };

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const p = t.projects;
  const locale = language === "es" ? "es-CR" : "en-US";
  const { currency } = useCurrency();
  const [summary, setSummary] = React.useState<ProjectSummary | null>(null);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [creditCards, setCreditCards] = React.useState<CreditCard[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [editTarget, setEditTarget] = React.useState<Expense | null>(null);
  const [editingProject, setEditingProject] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
    api.creditCards.list().then(setCreditCards).catch(() => {});
  }, []);

  const load = React.useCallback(async () => {
    try {
      const [s, list] = await Promise.all([
        api.projects.summary(projectId),
        api.expenses.list({ ...ALL_TIME, projectId, limit: 1000 }),
      ]);
      setSummary(s);
      setExpenses(list.days.flatMap((d) => d.expenses));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : p.failedToLoad);
    }
  }, [projectId, p.failedToLoad]);

  React.useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.projects.delete(projectId);
      navigate("/projects");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : p.failedToDelete);
      setDeleting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  if (error || !summary) return <p className="text-sm text-destructive">{error ?? p.failedToLoad}</p>;

  const dates = projectDateRange(summary, locale);
  const categoryMax = Math.max(0, ...summary.categories.map((c) => (currency === "USD" ? c.spent_dollars : c.spent_colones)));

  return (
    <div className="flex flex-col gap-6">
      <Link to="/projects" className="flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {p.back}
      </Link>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate text-xl">{summary.name}</CardTitle>
              <ProjectStatusBadge status={summary.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {[dates, p.expenseCount(summary.expense_count)].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingProject(true)} aria-label={p.edit}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:bg-destructive-soft hover:text-destructive"
              onClick={() => setConfirmingDelete(true)}
              aria-label={p.delete}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <ProjectProgress project={summary} />
          {summary.counted_as_regular && <p className="text-xs text-muted-foreground">{p.countedAsRegular}</p>}
          {summary.notes && <p className="whitespace-pre-line text-sm text-muted-foreground">{summary.notes}</p>}
        </CardContent>
      </Card>

      {summary.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{p.byCategory}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {summary.categories.map((c) => {
              const spent = currency === "USD" ? c.spent_dollars : c.spent_colones;
              const pct = categoryMax > 0 ? (spent / categoryMax) * 100 : 0;
              return (
                <div key={c.category_id ?? "none"} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {c.category_name ?? t.common.uncategorized}
                      <span className="text-xs text-muted-foreground"> · {p.expenseCount(c.expense_count)}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatMoney(spent, currency)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{p.expensesTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-0">
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{p.noExpenses}</p>
          ) : (
            expenses.map((expense) => (
              <ExpenseFrame
                key={expense.id}
                expense={expense}
                creditCards={creditCards}
                expanded={expandedId === expense.id}
                onToggle={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                onEdit={() => setEditTarget(expense)}
                showDate
                hideProject
                className="border-0 bg-secondary/40"
              />
            ))
          )}
        </CardContent>
      </Card>

      {editTarget && (
        <EditCategoryDialog
          expense={editTarget}
          categories={categories}
          onClose={() => setEditTarget(null)}
          onSave={() => {
            setEditTarget(null);
            load();
          }}
        />
      )}

      {editingProject && (
        <ProjectForm
          existing={summary}
          onClose={() => setEditingProject(false)}
          onSaved={() => {
            setEditingProject(false);
            load();
          }}
        />
      )}

      {confirmingDelete && (
        <ExpenseDialog title={p.deleteTitle(summary.name)} onClose={() => setConfirmingDelete(false)}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {summary.expense_count > 0 ? p.deleteBlocked : p.deleteHelp}
            </p>
            {deleteError && (
              <p className="text-sm text-destructive" role="alert">
                {deleteError}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                {t.common.cancel}
              </Button>
              {summary.expense_count === 0 && (
                <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                  {p.delete}
                </Button>
              )}
            </div>
          </div>
        </ExpenseDialog>
      )}
    </div>
  );
}
