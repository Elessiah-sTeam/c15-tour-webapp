import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import HomePage from "./pages/HomePage.tsx";
import PlannerPage from "./pages/PlannerPage.tsx";
import HistoryPage from "./pages/HistoryPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
