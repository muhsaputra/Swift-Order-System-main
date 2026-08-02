import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GooeyToaster } from "goey-toast";
import "goey-toast/styles.css";

// --- Import Pages (Umum & Kasir) ---
import Login from "./pages/Login";
import CashierDashboard from "./pages/CashierDashboard";
import MenuManagement from "./pages/MenuManagement";
import TableManagement from "./pages/TableManagement";
import CashierPOS from "./pages/CashierPOS";
import TransactionHistory from "./pages/TransactionHistory";
import AdminProfile from "./pages/AdminProfile";
import CouponManagementPage from "./pages/CouponManagementPage";
import ComprehensiveHistoryPage from "./pages/ComprehensiveHistoryPage";

// --- Import Pages (Pelanggan / Client) ---
import ClientOrderPage from "./pages/ClientOrderPage";
import ClientPaymentPage from "./pages/ClientPaymentPage";
import ClientWaitingPage from "./pages/ClientWaitingPage";
import ClientHistoryPage from "./pages/ClientHistoryPage";
import ClientOrderHistory from "./pages/ClientOrderHistory";

// --- Import Layouts ---
import DashboardLayout from "./components/DashboardLayout"; // Layout Kasir
import OwnerLayout from "./layouts/OwnerLayout"; // Layout Khusus Owner

// --- Import Pages Khusus Owner ---
import StaffManagement from "./pages/owner/StaffManagement";
import FinanceManagement from "./pages/owner/FinanceManagement";
import InventoryManagement from "./pages/owner/InventoryManagement"; // <-- Import Halaman Inventaris Gudang

export default function App() {
  return (
    <Router>
      <GooeyToaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* ==========================================
            RUTE PELANGGAN (CLIENT / SCAN QR)
        ========================================== */}
        <Route path="/order/:tableNumber" element={<ClientOrderPage />} />
        <Route path="/menu/:tableNumber" element={<ClientOrderPage />} />
        <Route path="/payment/:id" element={<ClientPaymentPage />} />
        <Route path="/waiting/:id" element={<ClientWaitingPage />} />
        <Route path="/history" element={<ClientHistoryPage />} />
        <Route path="/order-history" element={<ClientOrderHistory />} />

        {/* ==========================================
            RUTE KASIR / STAFF (Dashboard Layout)
        ========================================== */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<CashierDashboard />} />
          <Route path="pos" element={<CashierPOS />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="tables" element={<TableManagement />} />
          <Route path="coupons" element={<CouponManagementPage />} />
          <Route path="history" element={<TransactionHistory />} />
          <Route
            path="comprehensive-history"
            element={<ComprehensiveHistoryPage />}
          />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* ==========================================
            RUTE OWNER (Owner Layout)
        ========================================== */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<CashierDashboard />} />
          <Route path="dashboard" element={<CashierDashboard />} />
          {/* Menu Keuangan & Transaksi */}
          <Route path="finance" element={<FinanceManagement />} />
          <Route path="history" element={<TransactionHistory />} />
          <Route
            path="comprehensive-history"
            element={<ComprehensiveHistoryPage />}
          />
          {/* Menu Manajemen Outlet */}
          <Route path="staff" element={<StaffManagement />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="inventory" element={<InventoryManagement />} />{" "}
          {/* <-- Rute Stok & Gudang */}
          <Route path="tables" element={<TableManagement />} />
          <Route path="coupons" element={<CouponManagementPage />} />
          {/* Menu Sistem & Akun */}
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* Fallback Route: Arahkan ke Login jika rute tidak ditemukan */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
