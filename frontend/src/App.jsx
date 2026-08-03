import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GooeyToaster } from "goey-toast";
import "goey-toast/styles.css";

// --- Import Pages (Autentikasi & Kasir) ---
import Login from "./pages/auth/Login";
import CashierDashboard from "./pages/cashier/CashierDashboard";
import CashierPOS from "./pages/cashier/CashierPOS";

// --- Import Pages (Owner) ---
import MenuManagement from "./pages/owner/MenuManagement";
import TableManagement from "./pages/owner/TableManagement";
import TableMapping from "./pages/owner/TableMapping";
import TransactionHistory from "./pages/owner/TransactionHistory";
import AdminProfile from "./pages/owner/AdminProfile";
import CouponManagementPage from "./pages/owner/CouponManagementPage";
import ComprehensiveHistoryPage from "./pages/owner/ComprehensiveHistoryPage";
import ExecutiveDashboard from "./pages/owner/ExecutiveDashboard";
import StaffManagement from "./pages/owner/StaffManagement";
import FinanceManagement from "./pages/owner/FinanceManagement";
import InventoryManagement from "./pages/owner/InventoryManagement";

// --- Import Pages (Pelanggan / Client) ---
import ClientOrderPage from "./pages/client/ClientOrderPage";
import ClientPaymentPage from "./pages/client/ClientPaymentPage";
import ClientWaitingPage from "./pages/client/ClientWaitingPage";
import ClientHistoryPage from "./pages/client/ClientHistoryPage";
import ClientOrderHistory from "./pages/client/ClientOrderHistory";

// --- Import Layouts ---
import DashboardLayout from "./components/DashboardLayout"; // Layout Kasir
import OwnerLayout from "./layouts/OwnerLayout"; // Layout Khusus Owner

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
          <Route index element={<ExecutiveDashboard />} />
          <Route path="dashboard" element={<ExecutiveDashboard />} />
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
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="tables" element={<TableManagement />} />
          <Route path="table-mapping" element={<TableMapping />} />
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
