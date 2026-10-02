import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/lib/auth";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Activity from "@/pages/Activity";
import Search from "@/pages/Search";
import AddExpense from "@/pages/AddExpense";
import Review from "@/pages/Review";
import Alerts from "@/pages/Alerts";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Income from "@/pages/Income";
import SettingsLayout, { SettingsIndex } from "@/pages/settings/SettingsLayout";
import SettingsBasic from "@/pages/settings/Basic";
import SettingsCreditCards from "@/pages/settings/CreditCards";
import SettingsCategories from "@/pages/settings/Categories";
import SettingsRecurring from "@/pages/settings/Recurring";
import SettingsIncomeCategories from "@/pages/settings/IncomeCategories";
import SettingsAdvanced from "@/pages/settings/Advanced";
import ReportsLayout from "@/pages/reports/ReportsLayout";
import BudgetVsActual from "@/pages/reports/BudgetVsActual";
import Burndown from "@/pages/reports/Burndown";
import PaymentWindow from "@/pages/reports/PaymentWindow";
import SubcategoriesByMonth from "@/pages/reports/SubcategoriesByMonth";
import IncomeVsExpenses from "@/pages/reports/IncomeVsExpenses";
import Charts from "@/pages/reports/Charts";
import CategoryReport from "@/pages/reports/CategoryReport";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/search" element={<Search />} />
        <Route path="/add" element={<AddExpense />} />
        <Route path="/review" element={<Review />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/income" element={<Income />} />
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<SettingsIndex />} />
          <Route path="basic" element={<SettingsBasic />} />
          <Route path="credit-cards" element={<SettingsCreditCards />} />
          <Route path="categories" element={<SettingsCategories />} />
          <Route path="income-categories" element={<SettingsIncomeCategories />} />
          <Route path="recurring" element={<SettingsRecurring />} />
          <Route path="advanced" element={<SettingsAdvanced />} />
        </Route>
        <Route path="/reports" element={<ReportsLayout />}>
          <Route index element={<Navigate to="budget-vs-actual" replace />} />
          <Route path="budget-vs-actual" element={<BudgetVsActual />} />
          <Route path="payment-window" element={<PaymentWindow />} />
          <Route path="burndown" element={<Burndown />} />
          <Route path="subcategories-by-month" element={<SubcategoriesByMonth />} />
          <Route path="income-vs-expenses" element={<IncomeVsExpenses />} />
          <Route path="charts" element={<Charts />} />
          <Route path="category-report" element={<CategoryReport />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
