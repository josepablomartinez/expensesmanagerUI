import * as React from "react";
import type { EChartsOption } from "echarts";
import { api, type SpendingHierarchyRow } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { monthRangeFor } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/language";
import { useTheme } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EChart, chartColors } from "@/components/charts/EChart";

// A slice only gets a label when it spans more than 10% of the circle (36°).
// Zoomed in, the clicked slice becomes the full circle, so the rule applies to
// what's on screen.
const LABEL_MIN_ANGLE = 36;

interface Node {
  name: string;
  value?: number;
  count?: number;
  children?: Node[];
  itemStyle?: { color: string };
}

// Spend as concentric rings -- main category, subcategory, merchant -- in the
// display currency. Each main category gets a palette color its descendants
// inherit; the outer rings are lighter so the inner ones read first.
export function SpendingSunburstChart({ includeProjects = false }: { includeProjects?: boolean }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const [{ year, month }, setPeriod] = React.useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [rows, setRows] = React.useState<SpendingHierarchyRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const sb = t.charts.sunburst;

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    const { from, to } = monthRangeFor(year, month);
    api.reports
      .spendingHierarchy(from, to, includeProjects)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : t.charts.failedToLoad))
      .finally(() => setLoading(false));
  }, [year, month, includeProjects, t.charts.failedToLoad]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setPeriod({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const money = React.useCallback((v: number) => formatMoney(v, currency), [currency]);

  const { tree, total, count } = React.useMemo(() => {
    const amountOf = (r: SpendingHierarchyRow) => (currency === "USD" ? r.total_usd : r.total_crc);
    const mains = new Map<string, { node: Node; subs: Map<string, Node> }>();
    let total = 0;
    let count = 0;
    for (const r of rows) {
      const value = amountOf(r);
      if (value <= 0) continue;
      total += value;
      count += r.expense_count;
      const mainName = r.main_category_name ?? sb.uncategorized;
      let main = mains.get(mainName);
      if (!main) {
        main = { node: { name: mainName, children: [] }, subs: new Map() };
        mains.set(mainName, main);
      }
      const leaf: Node = { name: r.merchant ?? sb.noMerchant, value, count: r.expense_count };
      // Uncategorized spend has no subcategory ring: merchants hang off it directly.
      if (r.subcategory_name === null) {
        main.node.children!.push(leaf);
        continue;
      }
      let sub = main.subs.get(r.subcategory_name);
      if (!sub) {
        sub = { name: r.subcategory_name, children: [] };
        main.subs.set(r.subcategory_name, sub);
        main.node.children!.push(sub);
      }
      sub.children!.push(leaf);
    }
    const palette = chartColors.series();
    const tree = [...mains.values()].map((m, i) => ({ ...m.node, itemStyle: { color: palette[i % palette.length] } }));
    return { tree, total, count };
    // theme: the palette is read from CSS variables, which change with it.
  }, [rows, currency, sb, theme]);

  const option = React.useMemo<EChartsOption | null>(() => {
    if (tree.length === 0) return null;
    const card = chartColors.card();
    const foreground = chartColors.foreground();
    return {
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (p) => {
          const { name, value, treePathInfo, data } = p as unknown as {
            name: string;
            value: number;
            treePathInfo: { name: string }[];
            data: Node;
          };
          const path = treePathInfo
            .slice(1)
            .map((n) => n.name)
            .join(" › ");
          const n = data.count !== undefined ? ` · ${sb.expenses(data.count)}` : "";
          return `<strong>${path || name}</strong><br/>${money(value)}${n}<br/>${sb.share(`${((value / total) * 100).toFixed(1)}%`)}`;
        },
      },
      series: [
        {
          type: "sunburst",
          data: tree,
          radius: ["10%", "96%"],
          sort: "desc",
          nodeClick: "rootToNode",
          itemStyle: { borderColor: card, borderWidth: 1.5 },
          label: { color: foreground, textBorderColor: card, textBorderWidth: 2, minAngle: LABEL_MIN_ANGLE },
          emphasis: { focus: "ancestor" },
          levels: [
            {},
            { r0: "10%", r: "36%", label: { rotate: "tangential", fontWeight: 600 } },
            { r0: "36%", r: "66%", label: { rotate: "tangential" }, itemStyle: { opacity: 0.8 } },
            { r0: "66%", r: "96%", label: { show: false }, itemStyle: { opacity: 0.55 } },
          ],
        },
      ],
    };
  }, [tree, total, money, sb, theme]);

  return (
    <Card>
      <CardHeader className="gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base text-foreground">{sb.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{sb.description}</p>
        </div>
        <div className="flex items-center gap-1 self-start">
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={sb.previousMonth} onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h2 className="min-w-36 text-center text-sm font-semibold">
            {t.months.full[month - 1]} {year}
          </h2>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={sb.nextMonth} onClick={() => shiftMonth(1)}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : option ? (
          <>
            <EChart option={option} height={520} />
            <p className="text-xs text-muted-foreground">{sb.total(money(total), count)}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{sb.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}
