import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
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
} from "lucide-react";

export default function OwnerLayout() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ownerName, setOwnerName] = useState("Owner Restoran");
  const navigate = useNavigate();
  const location = useLocation();

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

          {/* Navigasi Menu Owner dengan Pemisah Kategori yang Jelas */}
          <nav className="space-y-6 pt-2">
            {/* 1. Kategori: Analitik Bisnis */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Analitik Bisnis
              </div>
              <button
                onClick={() => navigate("/owner/dashboard")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/owner/dashboard")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <LayoutDashboard
                  className={`w-4 h-4 ${isActive("/owner/dashboard") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                />
                <span>Executive Dashboard</span>
              </button>
            </div>

            {/* 2. Kategori: Keuangan & Transaksi */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Keuangan & Transaksi
              </div>

              <button
                onClick={() => navigate("/owner/finance")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/owner/finance")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <Wallet
                  className={`w-4 h-4 ${isActive("/owner/finance") ? "text-emerald-500" : "text-neutral-400 group-hover:text-emerald-400"}`}
                />
                <span>Laporan Keuangan</span>
              </button>

              <button
                onClick={() => navigate("/owner/history")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/owner/history")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <History
                  className={`w-4 h-4 ${isActive("/owner/history") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                />
                <span>Audit Arsip Transaksi</span>
              </button>
            </div>

            {/* 3. Kategori: Manajemen Katalog & Outlet */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Manajemen Outlet
              </div>

              <button
                onClick={() => navigate("/owner/menu")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/owner/menu")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <UtensilsCrossed
                  className={`w-4 h-4 ${isActive("/owner/menu") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                />
                <span>Kelola Menu Pusat</span>
              </button>

              <button
                onClick={() => navigate("/owner/tables")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/owner/tables")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <TableProperties
                  className={`w-4 h-4 ${isActive("/owner/tables") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                />
                <span>Kelola Meja Resto</span>
              </button>

              <button
                onClick={() => navigate("/owner/staff")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/owner/staff")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <Users
                  className={`w-4 h-4 ${isActive("/owner/staff") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                />
                <span>Kelola Staff & Akun</span>
              </button>

              <button
                onClick={() => navigate("/owner/coupons")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/owner/coupons")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <Tag
                  className={`w-4 h-4 ${isActive("/owner/coupons") ? "text-amber-600" : "text-amber-400"}`}
                />
                <span>Kelola Kupon Promo & Fee</span>
              </button>
            </div>

            {/* 4. Kategori: Sistem & Akun */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Sistem & Akun
              </div>

              <button
                onClick={() => navigate("/owner/profile")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/owner/profile")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <UserCheck
                  className={`w-4 h-4 ${isActive("/owner/profile") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                />
                <span>Profil Owner</span>
              </button>
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
