import * as React from "react";
import { ChevronLeft, ChevronRight, HandCoins, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError, type Income as IncomeRow } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { monthRangeFor } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/language";
import { localDate } from "@/lib/recurrent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteIncomeDialog } from "@/components/income/DeleteIncomeDialog";
import { IncomeForm } from "@/components/income/IncomeForm";

export default function Income() {
  const { t, language } = useLanguage();
  const i = t.income;
  const locale = language === "es" ? "es-CR" : "en-US";
  const { currency } = useCurrency();
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [rows, setRows] = React.useState<IncomeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<IncomeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<IncomeRow | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    const { from, to } = monthRangeFor(year, month);
    return api.income
      .list({ from, to })
      .then((list) => {
        setRows(list);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : i.failedToLoad))
      .finally(() => setLoading(false));
  }, [year, month, i.failedToLoad]);

  React.useEffect(() => {
    load();
  }, [load]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  const total = rows.reduce((sum, r) => sum + (currency === "USD" ? r.dollars_amount : r.colones_amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="flex flex-col gap-1.5">
            <CardTitle>{i.title}</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">{i.intro}</p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{i.add}</span>
          </Button>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={i.previousMonth} onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h2 className="min-w-36 text-center text-sm font-semibold">
            {t.months.full[month - 1]} {year}
          </h2>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={i.nextMonth} onClick={() => shiftMonth(1)}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        {rows.length > 0 && (
          <span className="text-sm font-medium">
            {i.total}: {formatMoney(total, currency)}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      ) : !error && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{i.none}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const reimbursed = row.linked_expense_id != null;
            const own = row.currency === currency;
            const converted = currency === "USD" ? row.dollars_amount : row.colones_amount;
            return (
              <article key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-card-foreground">
                <div className="flex min-w-0 items-center gap-3">
                  {reimbursed && <HandCoins className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />}
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {reimbursed ? i.paidBack(row.linked_expense_merchant ?? "") : row.description || row.category_name}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{localDate(row.date).toLocaleDateString(locale, { day: "numeric", month: "short" })}</span>
                      {reimbursed ? <Badge variant="outline">{i.reimbursed}</Badge> : <span>{row.category_name}</span>}
                      {reimbursed && row.description && <span className="truncate">{row.description}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <div className="text-right">
                    <strong className="block whitespace-nowrap text-sm font-medium">{formatMoney(converted, currency)}</strong>
                    {!own && <span className="block text-xs text-muted-foreground">{formatMoney(row.amount, row.currency)}</span>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={i.edit} onClick={() => setEditTarget(row)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-destructive-soft hover:text-destructive"
                    aria-label={i.delete}
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {adding && (
        <IncomeForm
          existing={null}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
      {editTarget && (
        <IncomeForm
          existing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            load();
          }}
        />
      )}
      {deleteTarget && (
        <DeleteIncomeDialog
          income={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
