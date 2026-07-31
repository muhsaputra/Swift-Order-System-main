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
  PlusCircle,
  Tag,
  Maximize2,
  Minimize2,
  ShieldCheck,
} from "lucide-react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://api.swiftorder.space";

export default function DashboardLayout() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [adminName, setAdminName] = useState("Kasir Utama");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.name || parsed?.username) {
          setAdminName(parsed.name || parsed.username);
        }
      } catch (e) {
        console.error("Gagal membaca user:", e);
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

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("new-order", (orderData) => {
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
      );
      audio.play().catch((err) => console.log("Gagal memutar audio:", err));

      toast.info(
        `Pesanan Baru Masuk dari Meja #${orderData?.tableNumber || "?"}!`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        },
      );

      setNewOrdersCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      setNewOrdersCount(0);
    }
  }, [location.pathname]);

  const handleLogoutConfirmed = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.info("Anda telah keluar dari sesi kasir.");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-neutral-100 flex overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Berpola Kategori Rapi */}
      <aside className="w-68 bg-neutral-950 border-r border-neutral-800/80 flex flex-col justify-between p-5 shrink-0 h-screen sticky top-0 shadow-2xl overflow-y-auto scrollbar-none">
        <div className="space-y-6">
          {/* Logo & Brand Header */}
          <div className="px-3 pt-2 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full text-[10px] font-extrabold text-amber-300 tracking-wide">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Swift Control Center</span>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  POS Engine Active
                </p>
              </div>
            </div>
          </div>

          {/* Navigasi Menu Berdasarkan Kategori */}
          <nav className="space-y-6 pt-2">
            {/* Kategori: Utama */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Menu Utama
              </div>
              <button
                onClick={() => {
                  setNewOrdersCount(0);
                  navigate("/dashboard");
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/dashboard")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard
                    className={`w-4 h-4 ${isActive("/dashboard") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                  />
                  <span>Dashboard Utama</span>
                </div>
                {newOrdersCount > 0 && (
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse shadow-sm">
                    {newOrdersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Kategori: Operasional & Transaksi */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Operasional Kasir
              </div>
              <button
                onClick={() => navigate("/dashboard/pos")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/dashboard/pos")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <PlusCircle
                  className={`w-4 h-4 ${isActive("/dashboard/pos") ? "text-emerald-600" : "text-emerald-400"}`}
                />
                <span>Input Pesanan (POS)</span>
              </button>
            </div>

            {/* Kategori: Manajemen Restoran & Sistem */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Manajemen Restoran
              </div>

              <button
                onClick={() => navigate("/dashboard/menu")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/dashboard/menu")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <UtensilsCrossed
                  className={`w-4 h-4 ${isActive("/dashboard/menu") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                />
                <span>Manajemen Menu</span>
              </button>

              <button
                onClick={() => navigate("/dashboard/tables")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/dashboard/tables")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <TableProperties
                  className={`w-4 h-4 ${isActive("/dashboard/tables") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                />
                <span>Manajemen Meja</span>
              </button>

              <button
                onClick={() => navigate("/dashboard/coupons")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/dashboard/coupons")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <Tag
                  className={`w-4 h-4 ${isActive("/dashboard/coupons") ? "text-amber-600" : "text-amber-400"}`}
                />
                <span>Manajemen Kupon</span>
              </button>

              <button
                onClick={() => navigate("/dashboard/history")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/dashboard/history")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <History
                  className={`w-4 h-4 ${isActive("/dashboard/history") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                />
                <span>Arsip Transaksi</span>
              </button>
            </div>

            {/* Kategori: Akun & Konfigurasi */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Sistem & Akun
              </div>

              <button
                onClick={() => navigate("/dashboard/profile")}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer group ${
                  isActive("/dashboard/profile")
                    ? "bg-white text-neutral-950 shadow-lg shadow-white/5"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <UserCheck
                  className={`w-4 h-4 ${isActive("/dashboard/profile") ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"}`}
                />
                <span>Profil Akun</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bagian Bawah Sidebar: Profil Ringkas, Layar Penuh & Keluar */}
        <div className="pt-4 border-t border-neutral-900 space-y-2">
          <div className="px-3 py-2 bg-neutral-900/60 rounded-2xl border border-neutral-800/60 flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center font-bold text-xs shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">
                {adminName}
              </p>
              <p className="text-[10px] text-neutral-400 font-medium truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 inline" /> Sesi
                Kasir Aktif
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

      {/* Konten Utama */}
      <main className="flex-1 h-screen overflow-y-auto bg-neutral-100">
        <Outlet />
      </main>

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center animate-fadeIn">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                Keluar dari Dashboard?
              </h3>
              <p className="text-xs text-neutral-500">
                Anda harus masuk kembali menggunakan kredensial kasir untuk
                mengakses sistem POS.
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
