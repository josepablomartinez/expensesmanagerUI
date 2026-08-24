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
