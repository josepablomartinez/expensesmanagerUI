import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Review from "@/pages/Review";
import Expenses from "@/pages/Expenses";
import Categories from "@/pages/Categories";
import Reports from "@/pages/Reports";

// Routes are open for now since the Go API has no /auth/login endpoint yet.
// Once it does, wrap this <Route element={<AppShell />}> in <ProtectedRoute>
// (see src/lib/auth.tsx) to require a token before rendering any of it.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/review" replace />} />
        <Route path="/review" element={<Review />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/review" replace />} />
    </Routes>
  );
}
