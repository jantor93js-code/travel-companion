import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminPage from "./pages/AdminPage";
import AdminForm from "./pages/AdminForm";
import TripAccessPage from "./pages/TripAccessPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="page-shell">
        <div className="page-frame">
          <Routes>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/new" element={<AdminForm />} />
            <Route path="/trip/:tripId/access/:token" element={<TripAccessPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
