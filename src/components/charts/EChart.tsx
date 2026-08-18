import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

// App is dark-theme-only for v1 (index.html hardcodes class="dark"), so these
// just need to resolve the current --var values -- no light/dark branching.
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
};

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
