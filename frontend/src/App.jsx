import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import CashierDashboard from "./pages/CashierDashboard";
import MenuManagement from "./pages/MenuManagement";
import TableManagement from "./pages/TableManagement";
import TransactionHistory from "./pages/TransactionHistory";
import ClientOrderPage from "./pages/ClientOrderPage";
import ClientPaymentPage from "./pages/ClientPaymentPage";
import ClientWaitingPage from "./pages/ClientWaitingPage";
import ClientHistoryPage from "./pages/ClientHistoryPage";
import DashboardLayout from "./components/DashboardLayout";

export default function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          borderRadius: "16px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "12px",
          fontWeight: "600",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          border: "1px solid #e5e5e5",
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rute Pemesanan Pelanggan (Scan QR Meja) */}
        <Route path="/order" element={<ClientOrderPage />} />

        {/* Rute Riwayat Pesanan Pelanggan */}
        <Route path="/history" element={<ClientHistoryPage />} />

        {/* Rute Pembayaran QRIS */}
        <Route path="/payment/:id" element={<ClientPaymentPage />} />

        {/* Rute Halaman Menunggu */}
        <Route path="/waiting/:id" element={<ClientWaitingPage />} />

        {/* Rute Bersarang Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<CashierDashboard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="tables" element={<TableManagement />} />
          <Route path="history" element={<TransactionHistory />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
