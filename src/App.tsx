import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import PlannerPage from "./pages/PlannerPage.tsx";
import HistoryPage from "./pages/HistoryPage.tsx";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
