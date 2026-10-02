import { IncomeVsExpensesChart } from "@/components/reports/IncomeVsExpensesChart";
import { useIncludeProjects } from "@/pages/reports/ReportsLayout";

export default function IncomeVsExpenses() {
  return <IncomeVsExpensesChart includeProjects={useIncludeProjects()} />;
}
