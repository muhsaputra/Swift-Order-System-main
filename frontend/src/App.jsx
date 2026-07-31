import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GooeyToaster } from "goey-toast";
import "goey-toast/styles.css";

import Login from "./pages/Login";
import CashierDashboard from "./pages/CashierDashboard";
import MenuManagement from "./pages/MenuManagement";
import TableManagement from "./pages/TableManagement";
import CashierPOS from "./pages/CashierPOS";
import TransactionHistory from "./pages/TransactionHistory";
import AdminProfile from "./pages/AdminProfile";
import CouponManagementPage from "./pages/CouponManagementPage"; // <-- Import halaman kupon baru
import ClientOrderPage from "./pages/ClientOrderPage";
import ClientPaymentPage from "./pages/ClientPaymentPage";
import ClientWaitingPage from "./pages/ClientWaitingPage";
import ClientHistoryPage from "./pages/ClientHistoryPage";
import DashboardLayout from "./components/DashboardLayout";
import ClientOrderHistory from "./pages/ClientOrderHistory";

export default function App() {
  return (
    <Router>
      <GooeyToaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rute Pemesanan Pelanggan (Scan QR Meja) */}
        <Route path="/order/:tableNumber" element={<ClientOrderPage />} />
        <Route path="/menu/:tableNumber" element={<ClientOrderPage />} />

        {/* Rute Riwayat Pesanan Pelanggan */}
        <Route path="/history" element={<ClientHistoryPage />} />

        {/* Rute Pembayaran QRIS */}
        <Route path="/payment/:id" element={<ClientPaymentPage />} />

        {/* Rute Halaman Menunggu */}
        <Route path="/waiting/:id" element={<ClientWaitingPage />} />

        {/* Rute Bersarang Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<CashierDashboard />} />
          <Route path="pos" element={<CashierPOS />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="tables" element={<TableManagement />} />
          <Route path="coupons" element={<CouponManagementPage />} />{" "}
          {/* <-- Tambahkan rute kupon di sini */}
          <Route path="history" element={<TransactionHistory />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        <Route path="/order-history" element={<ClientOrderHistory />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
