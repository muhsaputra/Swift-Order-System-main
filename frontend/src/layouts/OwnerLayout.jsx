import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  UtensilsCrossed,
  TableProperties,
  History,
  LogOut,
  Sparkles,
  Store,
  AlertTriangle,
  UserCheck,
  Tag,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Users,
  Wallet,
  Package,
  ChevronDown,
  BarChart3,
  Boxes,
  Settings2,
} from "lucide-react";

export default function OwnerLayout() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ownerName, setOwnerName] = useState("Owner Restoran");

  const location = useLocation();
  const navigate = useNavigate();

  // Inisialisasi state multi-dropdown berdasarkan rute aktif
  const getInitialDropdowns = () => {
    const path = location.pathname;
    return {
      analytics: path.includes("/dashboard"),
      finance: path.includes("/finance") || path.includes("/history"),
      outlet:
        path.includes("/menu") ||
        path.includes("/inventory") ||
        path.includes("/tables") ||
        path.includes("/staff") ||
        path.includes("/coupons"),
      system: path.includes("/profile"),
    };
  };

  const [openDropdowns, setOpenDropdowns] = useState(getInitialDropdowns());

  // Fungsi toggle independen agar menu lain tidak tertutup saat menu baru dibuka
  const toggleDropdown = (groupKey) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.name || parsed?.username) {
          setOwnerName(parsed.name || parsed.username);
        }
      } catch (e) {
        console.error("Gagal membaca user owner:", e);
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Gagal mengaktifkan fullscreen:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLogoutConfirmed = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.info("Anda telah keluar dari sesi Owner.");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-neutral-100 flex overflow-hidden font-sans">
      {/* Sidebar Khusus Owner */}
      <aside className="w-68 bg-neutral-950 border-r border-neutral-800/80 flex flex-col justify-between p-5 shrink-0 h-screen sticky top-0 shadow-2xl overflow-y-auto scrollbar-none">
        <div className="space-y-6">
          {/* Logo & Brand Header */}
          <div className="px-3 pt-2 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full text-[10px] font-extrabold text-amber-300 tracking-wide">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Owner Control Center</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-black shadow-inner">
                <Store className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white">
                  Swift Ordering
                </h1>
                <p className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Owner Mode Active
                </p>
              </div>
            </div>
          </div>

          {/* Navigasi Menu Owner dengan Framer Motion & Multi-Open Dropdown */}
          <nav className="space-y-3 pt-2">
            {/* 1. Kategori: Analitik Bisnis */}
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown("analytics")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  openDropdowns.analytics
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-400 hover:bg-neutral-900/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Analitik Bisnis</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                    openDropdowns.analytics
                      ? "rotate-180 text-amber-400"
                      : "text-neutral-500"
                  }`}
                />
              </button>

              <AnimatePresence>
                {openDropdowns.analytics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3.5 ml-3.5 border-l border-neutral-800 space-y-1 pt-1">
                      <button
                        onClick={() => navigate("/owner/dashboard")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/owner/dashboard")
                            ? "bg-white text-neutral-950 shadow-md scale-[0.98]"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Executive Dashboard</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Kategori: Keuangan & Transaksi */}
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown("finance")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  openDropdowns.finance
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-400 hover:bg-neutral-900/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Keuangan & Transaksi</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                    openDropdowns.finance
                      ? "rotate-180 text-emerald-400"
                      : "text-neutral-500"
                  }`}
                />
              </button>

              <AnimatePresence>
                {openDropdowns.finance && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3.5 ml-3.5 border-l border-neutral-800 space-y-1 pt-1">
                      <button
                        onClick={() => navigate("/owner/finance")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/owner/finance")
                            ? "bg-white text-neutral-950 shadow-md scale-[0.98]"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Laporan Keuangan</span>
                      </button>

                      <button
                        onClick={() => navigate("/owner/history")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/owner/history")
                            ? "bg-white text-neutral-950 shadow-md scale-[0.98]"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Audit Arsip Transaksi</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Kategori: Manajemen Katalog & Outlet */}
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown("outlet")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  openDropdowns.outlet
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-400 hover:bg-neutral-900/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="w-4 h-4 text-sky-400" />
                  <span>Manajemen Outlet</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                    openDropdowns.outlet
                      ? "rotate-180 text-sky-400"
                      : "text-neutral-500"
                  }`}
                />
              </button>

              <AnimatePresence>
                {openDropdowns.outlet && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3.5 ml-3.5 border-l border-neutral-800 space-y-1 pt-1">
                      <button
                        onClick={() => navigate("/owner/menu")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/owner/menu")
                            ? "bg-white text-neutral-950 shadow-md scale-[0.98]"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        <span>Kelola Menu Pusat</span>
                      </button>

                      <button
                        onClick={() => navigate("/owner/inventory")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/owner/inventory")
                            ? "bg-white text-neutral-950 shadow-md scale-[0.98]"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Kelola Stok & Gudang</span>
                      </button>

                      <button
                        onClick={() => navigate("/owner/tables")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/owner/tables")
                            ? "bg-white text-neutral-950 shadow-md scale-[0.98]"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <TableProperties className="w-3.5 h-3.5" />
                        <span>Kelola Meja Resto</span>
                      </button>

                      <button
                        onClick={() => navigate("/owner/staff")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/owner/staff")
                            ? "bg-white text-neutral-950 shadow-md scale-[0.98]"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Kelola Staff & Akun</span>
                      </button>

                      <button
                        onClick={() => navigate("/owner/coupons")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/owner/coupons")
                            ? "bg-white text-neutral-950 shadow-md scale-[0.98]"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Kupon Promo & Fee</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Kategori: Sistem & Akun */}
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown("system")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  openDropdowns.system
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-400 hover:bg-neutral-900/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings2 className="w-4 h-4 text-purple-400" />
                  <span>Sistem & Akun</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                    openDropdowns.system
                      ? "rotate-180 text-purple-400"
                      : "text-neutral-500"
                  }`}
                />
              </button>

              <AnimatePresence>
                {openDropdowns.system && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3.5 ml-3.5 border-l border-neutral-800 space-y-1 pt-1">
                      <button
                        onClick={() => navigate("/owner/profile")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/owner/profile")
                            ? "bg-white text-neutral-950 shadow-md scale-[0.98]"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Profil Owner</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* Bagian Bawah Sidebar */}
        <div className="pt-4 border-t border-neutral-900 space-y-2">
          <div className="px-3 py-2 bg-neutral-900/60 rounded-2xl border border-neutral-800/60 flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-xs shrink-0">
              {ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">
                {ownerName}
              </p>
              <p className="text-[10px] text-amber-400 font-medium truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400 inline" /> Owner
                Access
              </p>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-400 hover:bg-neutral-900 hover:text-white transition cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-amber-400" />
                <span>Keluar Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span>Layar Penuh</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Konten Utama Halaman Owner */}
      <main className="flex-1 h-screen overflow-y-auto bg-neutral-100">
        <Outlet />
      </main>

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                Keluar dari Sesi Owner?
              </h3>
              <p className="text-xs text-neutral-500">
                Anda harus memasukkan kredensial owner kembali untuk mengakses
                panel kontrol bisnis.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirmed}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
