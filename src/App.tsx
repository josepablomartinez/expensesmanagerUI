import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Activity from "@/pages/Activity";
import Search from "@/pages/Search";
import AddExpense from "@/pages/AddExpense";
import Review from "@/pages/Review";
import SettingsLayout from "@/pages/settings/SettingsLayout";
import SettingsBasic from "@/pages/settings/Basic";
import SettingsCreditCards from "@/pages/settings/CreditCards";
import SettingsCategories from "@/pages/settings/Categories";
import SettingsAdvanced from "@/pages/settings/Advanced";
import ReportsLayout from "@/pages/reports/ReportsLayout";
import BudgetVsActual from "@/pages/reports/BudgetVsActual";
import Burndown from "@/pages/reports/Burndown";
import SubcategoriesByMonth from "@/pages/reports/SubcategoriesByMonth";

// Routes are open for now since the Go API has no /auth/login endpoint yet.
// Once it does, wrap this <Route element={<AppShell />}> in <ProtectedRoute>
// (see src/lib/auth.tsx) to require a token before rendering any of it.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/search" element={<Search />} />
        <Route path="/add" element={<AddExpense />} />
        <Route path="/review" element={<Review />} />
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="basic" replace />} />
          <Route path="basic" element={<SettingsBasic />} />
          <Route path="credit-cards" element={<SettingsCreditCards />} />
          <Route path="categories" element={<SettingsCategories />} />
          <Route path="advanced" element={<SettingsAdvanced />} />
        </Route>
        <Route path="/reports" element={<ReportsLayout />}>
          <Route index element={<Navigate to="budget-vs-actual" replace />} />
          <Route path="budget-vs-actual" element={<BudgetVsActual />} />
          <Route path="burndown" element={<Burndown />} />
          <Route path="subcategories-by-month" element={<SubcategoriesByMonth />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
