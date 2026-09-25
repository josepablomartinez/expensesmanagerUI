import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

// Resolves the current theme's CSS variable value so chart colors follow
// whichever of .dark / :root is active on <html>.
function cssVar(name: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `hsl(${value})` : "";
}

export const chartColors = {
  primary: () => cssVar("--primary"),
  destructive: () => cssVar("--destructive"),
  mutedForeground: () => cssVar("--muted-foreground"),
  border: () => cssVar("--border"),
  foreground: () => cssVar("--foreground"),
  card: () => cssVar("--card"),
  series: () => [1, 2, 3, 4, 5].map((index) => cssVar(`--chart-${index}`)),
};

// Data-point markers for a line series: a filled dot per value, ringed in
// the card surface so dots stay distinct where lines cross. A function (not
// a constant) so the ring follows the current theme. color is optional --
// without it the dot takes the series' palette color.
export function lineMarkers(color?: string) {
  return {
    showSymbol: true,
    symbol: "circle",
    symbolSize: 7,
    itemStyle: { color, borderColor: cssVar("--card"), borderWidth: 1.5 },
  };
}

interface EChartProps {
  option: EChartsOption;
  height?: number | string;
  className?: string;
}

export function EChart({ option, height = 280, className }: EChartProps) {
  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      className={className}
      opts={{ renderer: "svg" }}
      notMerge
      lazyUpdate
    />
  );
}
