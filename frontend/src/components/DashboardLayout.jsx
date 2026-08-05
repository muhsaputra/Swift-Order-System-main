import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { gooeyToast } from "goey-toast";
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
  PlusCircle,
  Tag,
  Maximize2,
  Minimize2,
  ShieldCheck,
  ChevronDown,
  BarChart3,
  Boxes,
  Settings2,
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

  // Inisialisasi state multi-dropdown berdasarkan rute aktif kasir
  const getInitialDropdowns = () => {
    const path = location.pathname;
    return {
      main: path === "/dashboard",
      operational: path.includes("/dashboard/pos"),
      management:
        path.includes("/dashboard/menu") ||
        path.includes("/dashboard/tables") ||
        path.includes("/dashboard/coupons") ||
        path.includes("/dashboard/history"),
      system: path.includes("/dashboard/profile"),
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

      gooeyToast.info(
        `Pesanan Baru Masuk dari Meja #${orderData?.tableNumber || "?"}!`,
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
    gooeyToast.info("Anda telah keluar dari sesi kasir.");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-sky-50/40 flex overflow-hidden font-sans antialiased text-slate-900">
      {/* Sidebar Berpola Dropdown & Framer Motion - Diperbarui dengan palet biru terang */}
      <aside className="w-68 bg-gradient-to-b from-blue-900 to-blue-950 border-r border-blue-800/60 flex flex-col justify-between p-5 shrink-0 h-screen sticky top-0 shadow-xl overflow-y-auto scrollbar-none text-white">
        <div className="space-y-6">
          {/* Logo & Brand Header */}
          <div className="px-3 pt-2 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1.5 rounded-full text-[10px] font-black text-sky-100 tracking-wider shadow-2xs">
              <Sparkles className="w-3 h-3 text-sky-200" />
              <span>Swift Control Center</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-blue-900 border border-white/30 flex items-center justify-center font-black shadow-sm">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white">
                  Swift Ordering
                </h1>
                <p className="text-[11px] text-sky-100 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  POS Engine Active
                </p>
              </div>
            </div>
          </div>

          {/* Navigasi Menu Berdasarkan Kategori dengan Dropdown */}
          <nav className="space-y-3 pt-2">
            {/* 1. Kategori: Utama */}
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown("main")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  openDropdowns.main
                    ? "bg-white/15 text-white shadow-sm border border-white/20"
                    : "text-sky-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-sky-200" />
                  <span>Menu Utama</span>
                </div>
                <div className="flex items-center gap-2">
                  {newOrdersCount > 0 && (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse shadow-sm">
                      {newOrdersCount}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                      openDropdowns.main
                        ? "rotate-180 text-sky-200"
                        : "text-sky-200/70"
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {openDropdowns.main && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3.5 ml-3.5 border-l border-white/20 space-y-1 pt-1">
                      <button
                        onClick={() => {
                          setNewOrdersCount(0);
                          navigate("/dashboard");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/dashboard")
                            ? "bg-white text-blue-950 shadow-md scale-[0.98]"
                            : "text-sky-100 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Dashboard Utama</span>
                        </div>
                        {newOrdersCount > 0 && (
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black">
                            {newOrdersCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Kategori: Operasional & Transaksi */}
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown("operational")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  openDropdowns.operational
                    ? "bg-white/15 text-white shadow-sm border border-white/20"
                    : "text-sky-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4 text-emerald-300" />
                  <span>Operasional Kasir</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                    openDropdowns.operational
                      ? "rotate-180 text-emerald-300"
                      : "text-sky-200/70"
                  }`}
                />
              </button>

              <AnimatePresence>
                {openDropdowns.operational && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3.5 ml-3.5 border-l border-white/20 space-y-1 pt-1">
                      <button
                        onClick={() => navigate("/dashboard/pos")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/dashboard/pos")
                            ? "bg-white text-blue-950 shadow-md scale-[0.98]"
                            : "text-sky-100 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Input Pesanan (POS)</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Kategori: Manajemen Restoran & Sistem */}
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown("management")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  openDropdowns.management
                    ? "bg-white/15 text-white shadow-sm border border-white/20"
                    : "text-sky-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="w-4 h-4 text-sky-200" />
                  <span>Manajemen Restoran</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                    openDropdowns.management
                      ? "rotate-180 text-sky-200"
                      : "text-sky-200/70"
                  }`}
                />
              </button>

              <AnimatePresence>
                {openDropdowns.management && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3.5 ml-3.5 border-l border-white/20 space-y-1 pt-1">
                      <button
                        onClick={() => navigate("/dashboard/menu")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/dashboard/menu")
                            ? "bg-white text-blue-950 shadow-md scale-[0.98]"
                            : "text-sky-100 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        <span>Manajemen Menu</span>
                      </button>

                      <button
                        onClick={() => navigate("/dashboard/tables")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/dashboard/tables")
                            ? "bg-white text-blue-950 shadow-md scale-[0.98]"
                            : "text-sky-100 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <TableProperties className="w-3.5 h-3.5" />
                        <span>Manajemen Meja</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Kategori: Akun & Konfigurasi */}
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown("system")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  openDropdowns.system
                    ? "bg-white/15 text-white shadow-sm border border-white/20"
                    : "text-sky-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings2 className="w-4 h-4 text-sky-200" />
                  <span>Sistem & Akun</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                    openDropdowns.system
                      ? "rotate-180 text-sky-200"
                      : "text-sky-200/70"
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
                    <div className="pl-3.5 ml-3.5 border-l border-white/20 space-y-1 pt-1">
                      <button
                        onClick={() => navigate("/dashboard/profile")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          isActive("/dashboard/profile")
                            ? "bg-white text-blue-950 shadow-md scale-[0.98]"
                            : "text-sky-100 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Profil Akun</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* Bagian Bawah Sidebar: Profil Ringkas, Layar Penuh & Keluar */}
        <div className="pt-4 border-t border-blue-800/60 space-y-2">
          <div className="px-3 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center gap-3 mb-2 shadow-inner">
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">
                {adminName}
              </p>
              <p className="text-[10px] text-sky-200 font-medium truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300 inline" /> Sesi
                Kasir Aktif
              </p>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-sky-100 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-sky-200" />
                <span>Keluar Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-sky-200" />
                <span>Layar Penuh</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 h-screen overflow-y-auto bg-sky-50/40">
        <Outlet />
      </main>

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center animate-fadeIn">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Keluar dari Dashboard?
              </h3>
              <p className="text-xs text-slate-500">
                Anda harus masuk kembali menggunakan kredensial kasir untuk
                mengakses sistem POS.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
