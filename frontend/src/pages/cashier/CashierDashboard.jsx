import React, { useState, useEffect, useMemo } from "react";
import API from "../services/api";
import { io } from "socket.io-client";
import { gooeyToast } from "goey-toast";
import {
  Bell,
  X,
  Radio,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  Award,
  Search,
  Flame,
  Wallet,
  QrCode,
  Tag,
  Printer,
  Megaphone,
  Phone,
  Mail,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Coffee,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ==========================================
// SUB-KOMPONEN MODULAR
// ==========================================

function OrderTimer({ createdAt }) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (!createdAt) return;
    const calculateTime = () => {
      const now = new Date();
      const created = new Date(createdAt);
      if (isNaN(created.getTime())) return;
      const diffMs = now - created;
      const diffMins = Math.floor(diffMs / 60000);
      setElapsedMinutes(diffMins >= 0 ? diffMins : 0);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 10000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const isUrgent = elapsedMinutes >= 15;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold border transition ${
        isUrgent
          ? "bg-red-50 text-red-700 border-red-200 animate-pulse shadow-2xs"
          : "bg-neutral-100 text-neutral-700 border-neutral-200/80"
      }`}
    >
      <Clock
        className={`w-3.5 h-3.5 ${isUrgent ? "text-red-600" : "text-neutral-500"}`}
      />
      <span>{elapsedMinutes} mnt lalu</span>
    </div>
  );
}

// ==========================================
// KOMPONEN UTAMA KASIR DASHBOARD
// ==========================================

export default function CashierDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [waiterCalledTables, setWaiterCalledTables] = useState([]);

  // Notifikasi State
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);

  // Profil Kasir State
  const [cashierProfile, setCashierProfile] = useState({
    name: "Kasir",
    role: "Cashier",
    avatar: "",
  });

  useEffect(() => {
    fetchOrders();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          setCashierProfile({
            name: parsedUser.name || parsedUser.username || "Kasir",
            role: parsedUser.role || "Cashier",
            avatar: parsedUser.avatar || "",
          });
        }
      } catch (err) {
        console.error("Gagal memparsing data user dari localStorage", err);
      }
    }

    const SOCKET_URL = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, "")
      : "http://localhost:5001";

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("new-order", (newOrder) => {
      setOrders((prev) => {
        const exists = prev.some((ord) => ord._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });

      if (newOrder.paymentMethod === "cash") {
        gooeyToast.info(
          `💵 Pesanan Tunai Baru! Pelanggan ${newOrder.customerName} (Meja #${newOrder.tableNumber}) menunggu konfirmasi pembayaran.`,
          { displayDuration: 5000 },
        );
      }

      const newNotif = {
        id: Date.now(),
        title: "Pesanan Baru!",
        message: `Pelanggan ${newOrder.customerName} di Meja #${newOrder.tableNumber} membuat pesanan baru.`,
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setNotifications((prev) => [newNotif, ...prev]);
      playNotificationSound();
    });

    socket.on("new-paid-order", (paidOrder) => {
      setOrders((prev) => {
        const exists = prev.some((ord) => ord._id === paidOrder._id);
        if (exists) {
          return prev.map((ord) =>
            ord._id === paidOrder._id ? paidOrder : ord,
          );
        }
        return [paidOrder, ...prev];
      });

      gooeyToast.info(
        `🔔 Pembayaran Sukses! Pelanggan ${paidOrder.customerName} (Meja #${paidOrder.tableNumber})`,
        {
          displayDuration: 5000,
        },
      );

      const newNotif = {
        id: Date.now(),
        title: "Pembayaran Berhasil!",
        message: `Pelanggan ${paidOrder.customerName} di Meja #${paidOrder.tableNumber} telah melunasi pesanan.`,
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setNotifications((prev) => [newNotif, ...prev]);
      playNotificationSound();
    });

    socket.on("call-waiter", (data) => {
      playNotificationSound();
      gooeyToast.warning(`🚨 PANGGILAN PELAYAN: ${data.message}`, {
        displayDuration: 8000,
      });

      if (data.tableNumber) {
        setWaiterCalledTables((prev) => {
          if (!prev.includes(Number(data.tableNumber))) {
            return [...prev, Number(data.tableNumber)];
          }
          return prev;
        });
      }

      const waiterNotif = {
        id: Date.now(),
        title: `Panggilan Meja #${data.tableNumber}`,
        message: data.message,
        time: new Date(data.time || Date.now()).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setNotifications((prev) => [waiterNotif, ...prev]);
    });

    socket.on("order-updated", (updatedOrder) => {
      setOrders((prev) => {
        const exists = prev.some((ord) => ord._id === updatedOrder._id);
        if (!exists) return [updatedOrder, ...prev];
        return prev.map((ord) =>
          ord._id === updatedOrder._id ? updatedOrder : ord,
        );
      });
    });

    socket.on("order-status-updated", (updatedOrder) => {
      setOrders((prev) =>
        prev.map((ord) => (ord._id === updatedOrder._id ? updatedOrder : ord)),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 587.33;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Gagal memutar suara audio context:", e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Gagal memuat pesanan", err);
      gooeyToast.error("Gagal memuat data pesanan.");
    } finally {
      setLoading(false);
    }
  };

  const removeNotification = (id, e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotificationDropdown(false);
  };

  const handleResolveWaiterCall = (tableNum) => {
    setWaiterCalledTables((prev) => prev.filter((t) => t !== Number(tableNum)));
    gooeyToast.success(`Panggilan dari Meja #${tableNum} telah diselesaikan.`);
  };

  const handleConfirmCashPayment = async (orderId) => {
    try {
      const res = await API.patch(`/orders/${orderId}/pay-cash`);
      const updatedOrder = res.data.order || res.data;

      setOrders((prev) =>
        prev.map((ord) => (ord._id === orderId ? updatedOrder : ord)),
      );
      gooeyToast.success(
        "Pembayaran tunai berhasil dikonfirmasi! Pesanan diteruskan ke dapur.",
      );
    } catch (err) {
      console.error("Gagal konfirmasi pembayaran cash", err);
      gooeyToast.error(
        err.response?.data?.error || "Gagal mengonfirmasi pembayaran tunai.",
      );
    }
  };

  const handleNextStatus = async (order) => {
    let nextStatus = "";
    if (order.orderStatus === "processing" || order.orderStatus === "pending") {
      nextStatus = "ready";
    } else if (order.orderStatus === "ready") {
      nextStatus = "completed";
    } else {
      return;
    }

    try {
      const res = await API.patch(`/orders/${order._id}/status`, {
        status: nextStatus,
      });
      setOrders((prev) =>
        prev.map((ord) => (ord._id === order._id ? res.data : ord)),
      );

      if (nextStatus === "ready") {
        gooeyToast.warning(
          `Pesanan Meja #${order.tableNumber} kini siap disajikan / Dalam Pemanggilan (READY)!`,
        );
      } else if (nextStatus === "completed") {
        gooeyToast.success(
          `Pesanan Meja #${order.tableNumber} telah selesai (COMPLETED)! 🎉`,
        );
        setWaiterCalledTables((prev) =>
          prev.filter((t) => t !== Number(order.tableNumber)),
        );
      }
    } catch (err) {
      console.error("Gagal memperbarui status pesanan", err);
      gooeyToast.error("Gagal memperbarui status pesanan.");
    }
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open("", "_blank", "width=300,height=600");
    if (!printWindow) return;

    const subtotalVal = order.subtotal || order.totalAmount;
    const serviceFeeVal = order.serviceFee || 0;

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Nota - #${order._id.slice(-6).toUpperCase()}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0; padding: 10px; color: #000; }
            .center { text-align: center; }
            .line { border-bottom: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 3px 0; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center">
            <strong>SWIFT ORDERING</strong><br/>
            <span>Cashier System</span>
            <div class="line"></div>
          </div>
          <div>
            ID: #${order._id.slice(-6).toUpperCase()}<br/>
            Pelanggan: ${order.customerName}<br/>
            Meja: ${order.tableNumber}<br/>
            Telepon: ${order.customerPhone || "-"}<br/>
            Email: ${order.customerEmail || "-"}<br/>
            Metode: ${order.paymentMethod === "cash" ? "CASH" : "QRIS"}<br/>
            Waktu: ${new Date(order.createdAt).toLocaleString("id-ID")}
          </div>
          <div class="line"></div>
          <table>
            ${order.items
              .map((item) => {
                const name = item.menu?.name || item.name || "Menu Item";
                const price = item.price || item.menu?.price || 0;
                const optText =
                  item.options && item.options.length > 0
                    ? `<br/><small>(${item.options.map((o) => `${o.name}${o.price > 0 ? ` (+Rp ${o.price.toLocaleString("id-ID")})` : ""}`).join(", ")})</small>`
                    : "";
                return `
                <tr>
                  <td colspan="2"><strong>${name}</strong>${optText}</td>
                </tr>
                <tr>
                  <td>${item.quantity}x @ ${price.toLocaleString("id-ID")}</td>
                  <td class="right">${(item.quantity * price).toLocaleString("id-ID")}</td>
                </tr>
              `;
              })
              .join("")}
          </table>
          <div class="line"></div>
          <table>
            <tr>
              <td>Subtotal</td>
              <td class="right">Rp ${subtotalVal.toLocaleString("id-ID")}</td>
            </tr>
            ${order.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">- Rp ${order.discountAmount.toLocaleString("id-ID")}</td></tr>` : ""}
            ${serviceFeeVal > 0 ? `<tr><td>Biaya Layanan (5%)</td><td class="right">Rp ${serviceFeeVal.toLocaleString("id-ID")}</td></tr>` : ""}
          </table>
          <div class="line"></div>
          <table>
            <tr>
              <td><strong>TOTAL</strong></td>
              <td class="right"><strong>Rp ${order.totalAmount.toLocaleString("id-ID")}</strong></td>
            </tr>
          </table>
          <div class="line"></div>
          <div class="center">
            Terima Kasih Atas Kunjungan Anda!<br/>
            <span>Silakan Datang Kembali</span>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (order) => {
    switch (order.orderStatus) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-xl text-[11px] font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            MENUNGGU BAYAR (CASH)
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-xl text-[11px] font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            SEDANG DIKERJAKAN (DAPUR)
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-xl text-[11px] font-bold tracking-wide animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            SIAP SAJI (READY)
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl text-[11px] font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            SELESAI (COMPLETED)
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-700 border border-neutral-200 px-3 py-1 rounded-xl text-[11px] font-bold tracking-wide">
            {order.orderStatus}
          </span>
        );
    }
  };

  const activeOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const isNotCompleted = o.orderStatus !== "completed";
        const isValidPayment =
          o.paymentStatus === "paid" ||
          o.paymentStatus === "success" ||
          o.paymentStatus === "settlement" ||
          o.paymentStatus === "pending" ||
          o.isPaid === true ||
          o.paymentStatus === "cash_pending";
        return isNotCompleted && isValidPayment;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [orders]);

  const filteredActiveOrders = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return activeOrders.filter((order) => {
      const nameMatch = order.customerName?.toLowerCase().includes(query);
      const tableMatch = order.tableNumber?.toString().includes(query);
      return nameMatch || tableMatch;
    });
  }, [activeOrders, searchQuery]);

  const completedOrdersToday = useMemo(() => {
    return orders.filter((o) => {
      if (o.orderStatus !== "completed") return false;
      const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      return orderDate === today;
    });
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return completedOrdersToday.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0,
    );
  }, [completedOrdersToday]);

  const topMenus = useMemo(() => {
    const itemCounts = {};
    orders.forEach((o) => {
      o.items?.forEach((item) => {
        const name = item.menu?.name || item.name || "Menu";
        itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
      });
    });
    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [orders]);

  const chartData = [
    { time: "10:00", sales: 150000 },
    { time: "12:00", sales: 450000 },
    { time: "14:00", sales: 300000 },
    { time: "16:00", sales: 200000 },
    { time: "18:00", sales: totalRevenue > 0 ? totalRevenue : 650000 },
    { time: "20:00", sales: 500000 },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 pb-24">
      {/* HERO BANNER */}
      <div className="relative bg-neutral-900 text-white py-12 px-6 md:px-12 overflow-hidden mb-8 shadow-lg">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 filter brightness-50 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1556742049-0a67d5e236ef?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-bold text-amber-300 border border-white/10 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Swift Control Center & POS Engine</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Halo, {cashierProfile.name} 👋
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-lg leading-relaxed">
              Kelola transaksi secara efisien, pantau status dapur real-time,
              dan pastikan kepuasan pelanggan terjaga.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  Sistem Operasional
                </p>
                <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online & Sinkron
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-10">
        {/* HEADER NOTIFIKASI & KONTROL */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-neutral-200/80 gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
              Panel Manajemen Transaksi
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pantau antrean pesanan aktif dan status operasional dapur secara
              langsung.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() =>
                  setShowNotificationDropdown(!showNotificationDropdown)
                }
                className="relative bg-white hover:bg-neutral-50 border border-neutral-200 p-3 rounded-2xl text-neutral-700 transition cursor-pointer shadow-2xs flex items-center justify-center"
                title="Notifikasi Pesanan"
              >
                <Bell className="w-4 h-4 text-neutral-700" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-neutral-200 rounded-3xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-neutral-900" />
                      <h4 className="text-xs font-bold text-neutral-900">
                        Notifikasi Pesanan & Panggilan
                      </h4>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Bersihkan Semua
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-xs text-neutral-400">
                        Tidak ada notifikasi pesanan baru.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 hover:bg-neutral-50/80 transition flex items-start justify-between gap-3 text-left"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              <h5 className="text-xs font-bold text-neutral-900">
                                {notif.title}
                              </h5>
                            </div>
                            <p className="text-xs text-neutral-600">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-neutral-400 font-mono block pt-0.5">
                              {notif.time}
                            </span>
                          </div>
                          <button
                            onClick={(e) => removeNotification(notif.id, e)}
                            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg transition cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-white border border-neutral-200 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 shadow-2xs">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Live Socket Connected</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-500 font-medium">
              Memuat data dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-10 animate-fadeIn">
            {/* ========================================================= */}
            {/* 1. HIGHLIGHT UTAMA: PESANAN BERLANGSUNG & ANTREAN */}
            {/* ========================================================= */}
            <section className="space-y-6 bg-white border border-neutral-200/80 p-6 md:p-8 rounded-[32px] shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-md">
                      <Layers className="w-4 h-4 text-amber-400" />
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-neutral-950 tracking-tight">
                      Pesanan Berlangsung & Antrean Aktif
                    </h3>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                      <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />{" "}
                      Prioritas FIFO ({activeOrders.length})
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Kelola antrean aktif (QRIS lunas & Cash menunggu konfirmasi
                    pembayaran kasir).
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama pelanggan / meja..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-medium shadow-2xs transition"
                  />
                </div>
              </div>

              {filteredActiveOrders.length === 0 ? (
                <div className="text-center py-20 bg-neutral-50/60 border border-dashed border-neutral-200 rounded-3xl space-y-2">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-2xs flex items-center justify-center mx-auto text-neutral-400">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-neutral-700">
                    Tidak ada antrean pesanan aktif saat ini 🎉
                  </p>
                  <p className="text-xs text-neutral-400">
                    Pesanan baru dari pelanggan akan muncul secara real-time di
                    sini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredActiveOrders.map((order, index) => {
                    const isCashPending =
                      order.paymentStatus === "cash_pending";
                    const isCallingWaiter = waiterCalledTables.includes(
                      Number(order.tableNumber),
                    );

                    return (
                      <div
                        key={order._id}
                        className={`bg-white border p-6 md:p-7 rounded-[28px] flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition relative overflow-hidden ${
                          isCallingWaiter
                            ? "border-red-400 ring-4 ring-red-400/20 bg-red-50/10"
                            : isCashPending
                              ? "border-amber-300 ring-2 ring-amber-300/30 bg-amber-50/10"
                              : "border-neutral-200/80"
                        }`}
                      >
                        {/* Top Badge Priority */}
                        <div className="absolute top-0 right-0 bg-neutral-900 text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black font-mono tracking-wider shadow-2xs">
                          #QUEUE {index + 1}
                        </div>

                        <div className="space-y-4">
                          {/* Header Card: Table & Customer */}
                          <div className="flex justify-between items-start pr-12">
                            <div>
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="bg-neutral-900 text-white text-[11px] font-black uppercase px-3.5 py-1 rounded-xl tracking-wider shadow-2xs">
                                  Meja #{order.tableNumber}
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                                    order.paymentMethod === "cash"
                                      ? "bg-amber-100 text-amber-900 border-amber-300"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {order.paymentMethod === "cash" ? (
                                    <Wallet className="w-3 h-3" />
                                  ) : (
                                    <QrCode className="w-3 h-3" />
                                  )}
                                  {order.paymentMethod === "cash"
                                    ? "CASH TUNAI"
                                    : "QRIS DINAMIS"}
                                </span>
                                {order.couponCode && (
                                  <span className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                                    <Tag className="w-3 h-3" />{" "}
                                    {order.couponCode}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-base font-extrabold text-neutral-900">
                                {order.customerName}
                              </h4>
                            </div>
                          </div>

                          {/* Call Waiter Alert Banner */}
                          {isCallingWaiter && (
                            <div className="bg-red-600 text-white p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-pulse">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                  <Megaphone className="w-4 h-4 text-white animate-bounce" />
                                </div>
                                <div>
                                  <p className="text-xs font-black uppercase tracking-wide">
                                    Panggilan Bantuan Pelanggan!
                                  </p>
                                  <p className="text-[11px] text-red-100 font-medium">
                                    Meja #{order.tableNumber} memanggil pelayan.
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleResolveWaiterCall(order.tableNumber)
                                }
                                className="bg-white text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer whitespace-nowrap shadow-sm"
                              >
                                Selesai
                              </button>
                            </div>
                          )}

                          {/* Status & Timer Bar */}
                          <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                            <OrderTimer
                              createdAt={order.createdAt || order.updatedAt}
                            />
                            <div>{getStatusBadge(order)}</div>
                          </div>

                          {/* Contact Info Pill */}
                          <div className="bg-neutral-50 border border-neutral-200/60 p-3 rounded-2xl flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-2 text-neutral-700 font-medium">
                              <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="font-mono">
                                {order.customerPhone || order.phone || "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-700 font-medium truncate">
                              <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="truncate">
                                {order.customerEmail || order.email || "-"}
                              </span>
                            </div>
                          </div>

                          {/* Menu Items List with Add-Ons / Options */}
                          <div className="space-y-2 bg-neutral-50/70 p-4 rounded-2xl border border-neutral-100">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">
                              Daftar Pesanan Menu:
                            </span>
                            {order.items.map((item, idx) => {
                              const itemName =
                                item.menu?.name || item.name || "Menu Item";
                              const itemPrice =
                                item.price || item.menu?.price || 0;
                              const itemImage =
                                item.menu?.image || item.image || "";

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-neutral-200/60 shadow-2xs"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                                      {itemImage ? (
                                        <img
                                          src={itemImage}
                                          alt={itemName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[9px] text-neutral-400 font-bold">
                                          Foto
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-neutral-900 truncate">
                                        {itemName}
                                      </p>
                                      {/* Informasi Add-on / Level Kepedasan */}
                                      {item.options &&
                                        item.options.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-0.5">
                                            {item.options.map((opt, oIdx) => (
                                              <span
                                                key={oIdx}
                                                className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-extrabold px-2 py-0.5 rounded-md"
                                              >
                                                <span>{opt.name}</span>
                                                {opt.price > 0 && (
                                                  <span className="font-mono text-emerald-600">
                                                    (+Rp{" "}
                                                    {opt.price.toLocaleString(
                                                      "id-ID",
                                                    )}
                                                    )
                                                  </span>
                                                )}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                        {item.quantity}x @ Rp{" "}
                                        {itemPrice.toLocaleString("id-ID")}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-mono text-xs font-extrabold text-neutral-900 shrink-0">
                                    Rp{" "}
                                    {(item.quantity * itemPrice).toLocaleString(
                                      "id-ID",
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Card Footer: Pricing & Action Buttons */}
                        <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-xs">
                          <div className="flex justify-between items-center text-neutral-500">
                            <span>Subtotal Menu</span>
                            <span className="font-mono font-bold text-neutral-900">
                              Rp{" "}
                              {(
                                order.subtotal || order.totalAmount
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>

                          {order.discountAmount > 0 && (
                            <div className="flex justify-between items-center text-purple-700 font-bold">
                              <span>Potongan Kupon ({order.couponCode})</span>
                              <span className="font-mono">
                                - Rp{" "}
                                {order.discountAmount.toLocaleString("id-ID")}
                              </span>
                            </div>
                          )}

                          {order.serviceFee > 0 && (
                            <div className="flex justify-between items-center text-neutral-500">
                              <span>Biaya Layanan (Service 5%)</span>
                              <span className="font-mono font-bold text-neutral-900">
                                Rp {order.serviceFee.toLocaleString("id-ID")}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-base font-black text-neutral-900 pt-2 border-t border-dashed border-neutral-200">
                            <span>Total Pembayaran</span>
                            <span className="font-mono text-emerald-600 font-black">
                              Rp {order.totalAmount.toLocaleString("id-ID")}
                            </span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handlePrintReceipt(order)}
                              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-3 rounded-2xl text-xs font-bold transition border border-neutral-200 shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                              title="Cetak Struk"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {isCashPending ? (
                              <button
                                onClick={() =>
                                  handleConfirmCashPayment(order._id)
                                }
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                              >
                                <Wallet className="w-4 h-4" />
                                <span>Konfirmasi Bayar Cash</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleNextStatus(order)}
                                className={`flex-1 py-3 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                                  order.orderStatus === "processing" ||
                                  order.orderStatus === "pending"
                                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                                    : "bg-neutral-900 hover:bg-neutral-800 text-white"
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>
                                  {order.orderStatus === "processing" ||
                                  order.orderStatus === "pending"
                                    ? "Panggil Pesanan (Ready)"
                                    : "Selesaikan Pesanan (Done)"}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ========================================================= */}
            {/* 2. STATISTIK & METRIK PENDAPATAN HARI INI */}
            {/* ========================================================= */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-neutral-200/80 p-6 rounded-[28px] shadow-sm space-y-2">
                <div className="flex justify-between items-center text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Total Pendapatan Hari Ini
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black font-mono text-neutral-900">
                  Rp {totalRevenue.toLocaleString("id-ID")}
                </h3>
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  Akumulasi dari {completedOrdersToday.length} pesanan selesai
                </p>
              </div>

              <div className="bg-white border border-neutral-200/80 p-6 rounded-[28px] shadow-sm space-y-2">
                <div className="flex justify-between items-center text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Pesanan Aktif
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black font-mono text-neutral-900">
                  {activeOrders.length}{" "}
                  <span className="text-sm font-normal text-neutral-500">
                    Antrean
                  </span>
                </h3>
                <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                  Memerlukan konfirmasi kasir / proses dapur
                </p>
              </div>

              <div className="bg-white border border-neutral-200/80 p-6 rounded-[28px] shadow-sm space-y-2">
                <div className="flex justify-between items-center text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Menu Terfavorit
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-neutral-900 truncate">
                  {topMenus.length > 0 ? topMenus[0][0] : "Belum ada data"}
                </h3>
                <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                  {topMenus.length > 0
                    ? `Terjual ${topMenus[0][1]} porsi`
                    : "-"}
                </p>
              </div>
            </section>

            {/* ========================================================= */}
            {/* 3. GRAFIK TREN PENJUALAN */}
            {/* ========================================================= */}
            <section className="bg-white border border-neutral-200/80 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Grafik Tren Penjualan
                </h3>
                <p className="text-xs text-neutral-500">
                  Visualisasi data omset operasional restoran secara berkala.
                </p>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#737373" fontSize={12} />
                    <YAxis
                      stroke="#737373"
                      fontSize={12}
                      tickFormatter={(value) => `Rp ${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `Rp ${value.toLocaleString("id-ID")}`,
                        "Pendapatan",
                      ]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e5e5e5",
                        borderRadius: "16px",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                      }}
                    />
                    <Bar
                      dataKey="sales"
                      fill="#171717"
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
