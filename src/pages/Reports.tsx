import * as React from "react";
import { api, type BudgetVsActual } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Reports() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [rows, setRows] = React.useState<BudgetVsActual[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    api.reports
      .budgetVsActual(year, month)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [year, month]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Budget vs actual</h1>
        <div className="flex items-center gap-2">
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const pct = row.pct_used ?? 0;
            const over = pct > 1;
            return (
              <Card key={row.category_id}>
                <CardContent className="flex flex-col gap-2 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{row.category_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatMoney(row.actual_crc, "CRC")} / {row.budget != null ? formatMoney(row.budget, "CRC") : "—"}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full ${over ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${Math.min(pct * 100, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
