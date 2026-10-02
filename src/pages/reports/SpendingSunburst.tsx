import { SpendingSunburstChart } from "@/components/reports/SpendingSunburstChart";
import { useIncludeProjects } from "@/pages/reports/ReportsLayout";

export default function SpendingSunburst() {
  return <SpendingSunburstChart includeProjects={useIncludeProjects()} />;
}
