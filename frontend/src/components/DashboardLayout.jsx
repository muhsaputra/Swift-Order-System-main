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
  FileText,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { io } from "socket.io-client";

// Sesuaikan URL Backend Anda jika berbeda
const SOCKET_URL = "https://api.swiftorder.space";

export default function DashboardLayout() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Pantau perubahan status fullscreen browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Fungsi toggle fullscreen untuk 1 website secara global
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

  // Inisialisasi Socket.io dan Audio secara Global di Layout Dashboard
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("new-order", (orderData) => {
      // Mainkan suara notifikasi
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
      );
      audio.play().catch((err) => console.log("Gagal memutar audio:", err));

      // Tampilkan toast notifikasi secara global di semua tab dashboard
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

      // Tambahkan penghitung badge pesanan baru
      setNewOrdersCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Jika pengguna kembali ke Dashboard Utama, reset counter badge
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
      {/* Sidebar Tetap / Sticky di Kiri */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between p-6 shrink-0 h-screen sticky top-0 shadow-xl overflow-y-auto">
        <div className="space-y-6">
          <div className="px-2 space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-white/10">
              <Sparkles className="w-3 h-3" />
              <span>Admin & Cashier Portal</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-neutral-400" />
                <span>Swift Ordering</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                Cashier Management System
              </p>
            </div>
          </div>

          <nav className="space-y-1.5 pt-2">
            <button
              onClick={() => {
                setNewOrdersCount(0);
                navigate("/dashboard");
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                isActive("/dashboard")
                  ? "bg-white text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Utama</span>
              </div>
              {newOrdersCount > 0 && (
                <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse shadow-sm">
                  {newOrdersCount}
                </span>
              )}
            </button>

            {/* Menu Operasional & Transaksi (Diperbarui mengarah ke Halaman Mandiri / POS) */}
            <div className="space-y-1 pt-1">
              <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                Operasional & Transaksi
              </div>

              <button
                onClick={() => navigate("/dashboard/pos")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                  isActive("/dashboard/pos")
                    ? "bg-white text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Input Pesanan (POS)</span>
              </button>
            </div>

            <div className="pt-2">
              <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                Manajemen Sistem
              </div>

              <button
                onClick={() => navigate("/dashboard/menu")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                  isActive("/dashboard/menu")
                    ? "bg-white text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Manajemen Menu</span>
              </button>

              <button
                onClick={() => navigate("/dashboard/tables")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                  isActive("/dashboard/tables")
                    ? "bg-white text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <TableProperties className="w-4 h-4" />
                <span>Manajemen Meja</span>
              </button>

              <button
                onClick={() => navigate("/dashboard/history")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                  isActive("/dashboard/history")
                    ? "bg-white text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <History className="w-4 h-4" />
                <span>Arsip Transaksi</span>
              </button>

              <button
                onClick={() => navigate("/dashboard/profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                  isActive("/dashboard/profile")
                    ? "bg-white text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Profil Akun</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bagian Bawah Sidebar: Tombol Fullscreen & Logout */}
        <div className="pt-6 border-t border-neutral-800/80 space-y-2">
          <button
            onClick={toggleFullscreen}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-neutral-300 hover:bg-neutral-800 hover:text-white transition cursor-pointer"
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition cursor-pointer"
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
