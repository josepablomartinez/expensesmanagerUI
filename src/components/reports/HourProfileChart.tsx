import * as React from "react";
import { Link } from "react-router-dom";
import type { EChartsOption } from "echarts";
import { api, type HourProfileCell } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { localISODate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/language";
import { useTheme } from "@/lib/theme";
import { useScrollToHash } from "@/lib/useScrollToHash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EChart, chartColors } from "@/components/charts/EChart";

// 0 = all time
const RANGES = [3, 6, 12, 0];
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const pad = (h: number) => String(h).padStart(2, "0");
// Below this card width the grid turns sideways (hours down, days across)
// so 24 columns don't get squeezed to a few pixels each on a phone.
const WIDE_MIN_PX = 560;

// Sequential ramp for "amount", one hue light -> dark (flipped in dark mode
// so more money always means more contrast against the card). Checked with
// the dataviz validator: monotone lightness, >= 0.06 steps, low end >= 3:1
// against the card surface in both themes.
const AMOUNT_RAMP = {
  light: ["hsl(166, 55%, 40%)", "hsl(168, 82%, 13%)"],
  dark: ["hsl(153, 40%, 34%)", "hsl(153, 55%, 84%)"],
};

export const HOUR_PROFILE_ID = "hour-profile";

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return localISODate(d);
}

// Hours inside [start, end), wrapping past midnight when start > end --
// same rule as fn_hour_in_window in the API. start = end means off.
function quietHourList(start: number, end: number) {
  if (start === end) return [];
  return HOURS.filter((h) => (start < end ? h >= start && h < end : h >= start || h < end));
}

// Punch card of weekday x hour: dot size = number of expenses, color =
// amount in the display currency. Shades the user's quiet hours and links
// to where they're set (Settings -> Advanced), which links back here.
export function HourProfileChart() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const [months, setMonths] = React.useState(12);
  const [cells, setCells] = React.useState<HourProfileCell[]>([]);
  const [quiet, setQuiet] = React.useState<{ start: number; end: number } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [width, setWidth] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hp = t.charts.hourProfile;

  useScrollToHash(HOUR_PROFILE_ID, !loading);

  React.useEffect(() => {
    api.settings
      .get()
      .then((s) => setQuiet({ start: s.quiet_hours_start, end: s.quiet_hours_end }))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    api.reports
      .hourProfile(months > 0 ? monthsAgo(months) : undefined)
      .then(setCells)
      .catch((err) => setError(err instanceof Error ? err.message : t.charts.failedToLoad))
      .finally(() => setLoading(false));
  }, [months, t.charts.failedToLoad]);

  // Measure once up front as well: a page opened in a background tab gets
  // no ResizeObserver callbacks until it's shown.
  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const locale = language === "es" ? "es-CR" : "en-US";
  const weekdays = React.useMemo(
    // 2024-01-01 was a Monday, so day i lands on ISO weekday i + 1.
    () => Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "short" })),
    [locale],
  );
  const weekdaysLong = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "long" })),
    [locale],
  );

  const amountOf = React.useCallback((c: HourProfileCell) => (currency === "USD" ? c.total_usd : c.total_crc), [currency]);
  const money = React.useCallback((v: number) => formatMoney(v, currency), [currency]);
  const when = React.useCallback((c: HourProfileCell) => `${weekdaysLong[c.weekday - 1]} ${pad(c.hour)}:00`, [weekdaysLong]);

  const filled = React.useMemo(() => cells.filter((c) => c.expense_count > 0), [cells]);
  const summary = React.useMemo(() => {
    if (filled.length === 0) return null;
    const busiest = filled.reduce((a, b) => (b.expense_count > a.expense_count ? b : a));
    const priciest = filled.reduce((a, b) => (amountOf(b) > amountOf(a) ? b : a));
    const total = filled.reduce((sum, c) => sum + c.expense_count, 0);
    return { busiest, priciest, total };
  }, [filled, amountOf]);

  const wide = width >= WIDE_MIN_PX;
  const height = wide ? 360 : 24 * 24 + 110;

  const option = React.useMemo<EChartsOption | null>(() => {
    if (filled.length === 0 || width === 0) return null;
    const muted = chartColors.mutedForeground();
    const border = chartColors.border();
    const card = chartColors.card();
    const maxCount = Math.max(...filled.map((c) => c.expense_count));
    // Color tops out at the 90th percentile: one hotel booking would
    // otherwise stretch the scale and leave every other dot the same shade.
    // Anything above it just gets the strongest color.
    const amounts = filled.map(amountOf).sort((a, b) => a - b);
    const colorMax = amounts[Math.floor((amounts.length - 1) * 0.9)] || amounts[amounts.length - 1];
    const capped = colorMax < amounts[amounts.length - 1];

    // Largest dot fits its grid cell with a little air around it.
    const plotW = width - 60;
    const plotH = height - 110;
    const cellSize = wide ? Math.min(plotW / 24, plotH / 7) : Math.min(plotW / 7, plotH / 24);
    const maxDot = Math.max(10, cellSize * 0.9);
    const minDot = 6;
    // Area, not diameter, tracks the count.
    const size = (count: number) => minDot + (maxDot - minDot) * Math.sqrt(count / maxCount);

    const hourLabels = HOURS.map(pad);
    const data = filled.map((c) => {
      const x = wide ? c.hour : c.weekday - 1;
      const y = wide ? c.weekday - 1 : c.hour;
      return { value: [x, y, c.expense_count, amountOf(c)], cell: c };
    });

    // Contiguous runs of quiet hours (a window across midnight is two).
    const quietRuns: [number, number][] = [];
    for (const h of quiet ? quietHourList(quiet.start, quiet.end) : []) {
      const last = quietRuns[quietRuns.length - 1];
      if (last && last[1] === h - 1) last[1] = h;
      else quietRuns.push([h, h]);
    }
    // Area marks on a category axis run centre-to-centre, which would shade
    // only half of the first and last quiet hour. So the shading lives on a
    // hidden value axis spanning -0.5..23.5, where hour h's column is exactly
    // [h - 0.5, h + 0.5].
    const hourAxis = wide ? "xAxis" : "yAxis";
    const markArea = {
      silent: true,
      itemStyle: { color: muted, opacity: 0.1 },
      data: quietRuns.map(
        ([a, b]) => [{ [hourAxis]: a - 0.5 }, { [hourAxis]: b + 0.5 }] as [{ xAxis?: number; yAxis?: number }, { xAxis?: number; yAxis?: number }],
      ),
    };
    const shadeAxis = { type: "value" as const, min: -0.5, max: 23.5, show: false, inverse: !wide };

    const hourAxisDef = {
      type: "category" as const,
      data: hourLabels,
      axisLabel: { color: muted, interval: wide ? 1 : 0 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: border } },
      splitLine: { show: false },
    };
    const dayAxisDef = {
      type: "category" as const,
      data: weekdays,
      axisLabel: { color: muted },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: border } },
      splitLine: { show: true, lineStyle: { color: border, opacity: 0.25 } },
    };

    return {
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const c = (p as unknown as { data: { cell: HourProfileCell } }).data.cell;
          return `<strong>${when(c)}</strong><br/>${hp.expenses(c.expense_count)} · ${money(amountOf(c))}`;
        },
      },
      grid: { left: 8, right: 16, top: 12, bottom: 64, containLabel: true },
      xAxis: wide ? [hourAxisDef, shadeAxis] : [{ ...dayAxisDef, position: "top" as const }],
      // Monday on top when days run down the side; midnight on top when hours do.
      yAxis: wide ? [{ ...dayAxisDef, inverse: true }] : [{ ...hourAxisDef, inverse: true }, shadeAxis],
      visualMap: {
        type: "continuous",
        seriesIndex: 0,
        dimension: 3,
        min: 0,
        max: colorMax,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 4,
        itemWidth: 10,
        itemHeight: Math.min(160, width - 140),
        text: [`${money(colorMax)}${capped ? "+" : ""}`, money(0)],
        textStyle: { color: muted },
        inRange: { color: AMOUNT_RAMP[theme] },
      },
      series: [
        {
          type: "scatter",
          data,
          symbolSize: (value: number[]) => size(value[2]),
          itemStyle: { borderColor: card, borderWidth: 1.5 },
          emphasis: { scale: 1.15 },
        },
        {
          type: "scatter",
          data: [],
          silent: true,
          [wide ? "xAxisIndex" : "yAxisIndex"]: 1,
          markArea,
        },
      ],
    };
  }, [filled, width, height, wide, quiet, weekdays, amountOf, money, when, hp, theme]);

  const quietLabel =
    quiet && quiet.start !== quiet.end ? hp.quietHours(`${pad(quiet.start)}:00`, `${pad(quiet.end)}:00`) : hp.quietHoursOff;

  return (
    <Card id={HOUR_PROFILE_ID} className="scroll-mt-20">
      <CardHeader className="gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base text-foreground">{hp.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{hp.description}</p>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          {hp.range}
          <Select className="w-full sm:w-44" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {RANGES.map((n) => (
              <option key={n} value={n}>
                {n > 0 ? hp.months(n) : hp.allTime}
              </option>
            ))}
          </Select>
        </label>
      </CardHeader>
      <CardContent>
        <div ref={containerRef}>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : filled.length === 0 ? (
            <p className="text-sm text-muted-foreground">{hp.noData}</p>
          ) : option ? (
            <EChart option={option} height={height} />
          ) : null}
        </div>

        {!loading && !error && summary && (
          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground/60" aria-hidden="true" />
                <span className="inline-block h-3 w-3 rounded-full bg-foreground/60" aria-hidden="true" />
                {hp.sizeLegend}
              </span>
              <span>{hp.colorLegend}</span>
            </p>
            <p className="text-foreground">
              {hp.busiest(when(summary.busiest), summary.busiest.expense_count)} ·{" "}
              {hp.mostSpent(when(summary.priciest), money(amountOf(summary.priciest)))}
            </p>
            <p>{hp.counted(summary.total)}</p>
            <p className="flex flex-wrap items-center gap-x-2">
              <span className="inline-block h-3 w-5 rounded-sm bg-muted-foreground/15" aria-hidden="true" />
              <span>{quietLabel}</span>
              <Link to="/settings/advanced#quiet-hours" className="font-medium text-primary hover:underline">
                {hp.editQuietHours}
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
