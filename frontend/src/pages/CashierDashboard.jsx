import React, { useState, useEffect } from "react";
import API from "../services/api";
import { io } from "socket.io-client";
import { gooeyToast } from "goey-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Clock,
  Award,
  Printer,
  Radio,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Bell,
  X,
  Search,
  Plus,
  Calendar,
  Sparkles,
  Zap,
  Volume2,
  Flame,
  Wallet,
  QrCode,
  Tag,
  Trash2,
  Phone,
  Mail,
  User,
} from "lucide-react";

// Komponen Kecil untuk Handle Live Aging Timer per Card Pesanan
function OrderTimer({ createdAt }) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const created = new Date(createdAt);
      const diffMs = now - created;
      const diffMins = Math.floor(diffMs / 60000);
      setElapsedMinutes(diffMins >= 0 ? diffMins : 0);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 10000); // Update tiap 10 detik
    return () => clearInterval(interval);
  }, [createdAt]);

  const isUrgent = elapsedMinutes >= 15;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition ${
        isUrgent
          ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
          : "bg-neutral-100 text-neutral-700 border-neutral-200"
      }`}
    >
      <Clock
        className={`w-3.5 h-3.5 ${isUrgent ? "text-red-600" : "text-neutral-500"}`}
      />
      <span>{elapsedMinutes} mnt yang lalu</span>
    </div>
  );
}

export default function CashierDashboard() {
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab Navigasi Dashboard ("active-orders", "pos-order", "history", "coupons")
  const [activeTab, setActiveTab] = useState("active-orders");

  // State untuk Search & Filter Pesanan Aktif
  const [searchQuery, setSearchQuery] = useState("");

  // State untuk Riwayat Komprehensif (Seminggu Terakhir / Filter Tanggal)
  const [historyFilterDate, setHistoryFilterDate] = useState("");

  // State untuk POS Input Order Manual (Walk-in / Telepon)
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [cart, setCart] = useState([]);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // State untuk Manajemen Kupon Diskon
  const [coupons, setCoupons] = useState([]);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [expiredAt, setExpiredAt] = useState("");

  // State untuk Notifikasi Popup (Toast) & Riwayat Notifikasi
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);

  // State untuk Data Profil Kasir
  const [cashierProfile, setCashierProfile] = useState({
    name: "Putra Cashier",
    role: "Senior Cashier & Ops",
    avatar: "",
  });

  useEffect(() => {
    fetchOrders();
    fetchMenus();
    fetchCoupons();

    const socket = io("https://api.swiftorder.space", {
      transports: ["websocket", "polling"],
    });

    // Tangkap pesanan baru (baik QRIS paid maupun Cash pending)
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
      } else {
        gooeyToast.info(
          `🔔 Pesanan Masuk! Pelanggan ${newOrder.customerName} (Meja #${newOrder.tableNumber})`,
          { displayDuration: 5000 },
        );
      }

      const newNotif = {
        id: Date.now(),
        title:
          newOrder.paymentMethod === "cash"
            ? "Pesanan Tunai Baru!"
            : "Pesanan Masuk!",
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
        { displayDuration: 5000 },
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

    socket.on("order-updated", (updatedOrder) => {
      setOrders((prev) => {
        const exists = prev.some((ord) => ord._id === updatedOrder._id);
        if (!exists) return [updatedOrder, ...prev];
        return prev.map((ord) =>
          ord._id === updatedOrder._id ? updatedOrder : ord,
        );
      });
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
      osc.frequency.value = 587.33; // Nada D5
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

  const fetchMenus = async () => {
    try {
      const res = await API.get("/menus");
      const availableMenus = res.data.filter((m) => m.isAvailable);
      setMenus(availableMenus);
    } catch (err) {
      console.error("Gagal memuat menu katalog", err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await API.get("/coupons");
      setCoupons(res.data);
    } catch (err) {
      console.error("Gagal memuat data kupon", err);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: newCouponCode,
        discountType,
        discountValue: Number(discountValue),
        minPurchase: Number(minPurchase) || 0,
        expiredAt,
      };
      await API.post("/coupons", payload);
      gooeyToast.success("Kupon diskon berhasil dibuat!");
      setNewCouponCode("");
      setDiscountValue("");
      setMinPurchase("");
      setExpiredAt("");
      fetchCoupons();
    } catch (err) {
      gooeyToast.error(err.response?.data?.error || "Gagal membuat kupon.");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Yakin ingin menghapus kupon ini?")) return;
    try {
      await API.delete(`/coupons/${id}`);
      gooeyToast.success("Kupon berhasil dihapus.");
      fetchCoupons();
    } catch (err) {
      gooeyToast.error("Gagal menghapus kupon.");
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

  // FUNGSI KONFIRMASI PEMBAYARAN TUNAI (CASH) OLEH KASIR
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
    if (order.orderStatus === "processing") {
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
      }
    } catch (err) {
      console.error("Gagal memperbarui status pesanan", err);
      gooeyToast.error("Gagal memperbarui status pesanan.");
    }
  };

  const handleAddToCart = (menu) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuId === menu._id);
      if (existing) {
        return prev.map((item) =>
          item.menuId === menu._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          menuId: menu._id,
          name: menu.name,
          price: menu.price,
          quantity: 1,
        },
      ];
    });
    gooeyToast.info(`${menu.name} ditambahkan ke POS Cart`, {
      displayDuration: 1500,
    });
  };

  const handleUpdateCartQty = (menuId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.menuId === menuId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const calculateCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateCartTotal = () => {
    const subtotal = calculateCartSubtotal();
    const serviceFee = subtotal * 0.05;
    return subtotal + serviceFee;
  };

  const handleSubmitManualOrder = async (e) => {
    e.preventDefault();

    if (submittingOrder) return;

    if (cart.length === 0) {
      gooeyToast.warning("Keranjang pesanan masih kosong.");
      return;
    }
    if (!customerName || !tableNumber) {
      gooeyToast.warning("Nama pelanggan dan nomor meja wajib diisi.");
      return;
    }

    setSubmittingOrder(true);
    try {
      const subtotal = calculateCartSubtotal();
      const serviceFee = subtotal * 0.05;
      const totalAmount = subtotal + serviceFee;

      const payload = {
        customerName,
        tableNumber: Number(tableNumber),
        items: cart.map((item) => ({
          menu: item.menuId,
          quantity: item.quantity,
          selectedBundleChoices: item.selectedBundleChoices || {},
        })),
        subtotal: subtotal,
        serviceFee: serviceFee,
        totalAmount: totalAmount,
        orderStatus: "processing",
        paymentMethod: "cash",
        paymentStatus: "paid",
      };

      const res = await API.post("/orders", payload);

      setOrders((prev) => {
        const exists = prev.some((ord) => ord._id === res.data._id);
        if (exists) return prev;
        return [res.data, ...prev];
      });

      setCustomerName("");
      setTableNumber("");
      setCart([]);
      setActiveTab("active-orders");
      gooeyToast.success("Pesanan manual POS berhasil dibuat!");
    } catch (err) {
      console.error("Gagal membuat pesanan manual", err);
      gooeyToast.error("Gagal membuat pesanan.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            .choices { font-size: 10px; color: #333; padding-left: 10px; margin: 2px 0; }
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

                const choices = item.selectedBundleChoices
                  ? item.selectedBundleChoices instanceof Map
                    ? Object.fromEntries(item.selectedBundleChoices)
                    : item.selectedBundleChoices
                  : {};

                let choicesHtml = "";
                if (Object.keys(choices).length > 0) {
                  choicesHtml = Object.entries(choices)
                    .map(([k, v]) => {
                      if (Array.isArray(v)) {
                        return v
                          .map(
                            (addon) =>
                              `<div class="choices">• + ${addon.name} ${addon.price > 0 ? `(Rp ${addon.price.toLocaleString("id-ID")})` : ""}</div>`,
                          )
                          .join("");
                      }
                      return `<div class="choices">• ${k}: ${v}</div>`;
                    })
                    .join("");
                }

                return `
                <tr>
                  <td colspan="2"><strong>${name}</strong></td>
                </tr>
                ${choicesHtml}
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
            ${
              order.discountAmount > 0
                ? `
            <tr>
              <td>Diskon (${order.couponCode || "Promo"})</td>
              <td class="right">- Rp ${order.discountAmount.toLocaleString("id-ID")}</td>
            </tr>`
                : ""
            }
            ${
              serviceFeeVal > 0
                ? `
            <tr>
              <td>Biaya Layanan (5%)</td>
              <td class="right">Rp ${serviceFeeVal.toLocaleString("id-ID")}</td>
            </tr>`
                : ""
            }
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
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/80 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            PROCESSING (DI DAPUR)
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200/80 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide shadow-2xs animate-pulse">
            <Volume2 className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
            DALAM PEMANGGILAN (READY)
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-700 border border-neutral-200 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide">
            {order.orderStatus}
          </span>
        );
    }
  };

  const activeOrders = orders
    .filter((o) => {
      const isNotCompleted = o.orderStatus !== "completed";
      const isValidPayment =
        o.paymentStatus === "paid" ||
        o.paymentStatus === "success" ||
        o.paymentStatus === "settlement" ||
        o.isPaid === true ||
        o.paymentStatus === "cash_pending";

      return isNotCompleted && isValidPayment;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const filteredActiveOrders = activeOrders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = order.customerName?.toLowerCase().includes(query);
    const tableMatch = order.tableNumber?.toString().includes(query);
    return nameMatch || tableMatch;
  });

  const completedOrdersToday = orders.filter((o) => {
    if (o.orderStatus !== "completed") return false;
    const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return orderDate === today;
  });

  const totalRevenue = completedOrdersToday.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0,
  );

  const comprehensiveHistory = orders.filter((o) => {
    if (o.orderStatus !== "completed") return false;
    if (!historyFilterDate) return true;
    const orderDateStr = new Date(o.createdAt).toISOString().split("T")[0];
    return orderDateStr === historyFilterDate;
  });

  const itemCounts = {};
  orders.forEach((o) => {
    o.items?.forEach((item) => {
      const name = item.menu?.name || item.name || "Menu";
      itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
    });
  });
  const topMenus = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const chartData = [
    { time: "10:00", sales: 150000 },
    { time: "12:00", sales: 450000 },
    { time: "14:00", sales: 300000 },
    { time: "16:00", sales: 200000 },
    { time: "18:00", sales: totalRevenue > 0 ? totalRevenue : 650000 },
    { time: "20:00", sales: 500000 },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-20">
      {/* HERO BANNER ATTRACTION */}
      <div className="relative bg-neutral-900 text-white py-10 px-6 md:px-12 overflow-hidden mb-8 shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 filter brightness-50 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1556742049-0a67d5e236ef?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Swift Control Center & POS Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Halo, {cashierProfile.name} 👋
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-lg leading-relaxed">
              Kelola seluruh transaksi masuk, pantau status dapur secara
              real-time, dan kelola kupon diskon dengan mudah.
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

      <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-8">
        {/* Header Kontrol & Notifikasi */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-neutral-200/80 gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
              Panel Manajemen Transaksi
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pantau antrean, input pesanan manual walk-in, dan kupon promo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() =>
                  setShowNotificationDropdown(!showNotificationDropdown)
                }
                className="relative bg-white hover:bg-neutral-50 border border-neutral-200 p-2.5 rounded-2xl text-neutral-700 transition cursor-pointer shadow-2xs flex items-center justify-center"
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
                <div className="absolute right-0 mt-3 w-80 bg-white border border-neutral-200 rounded-3xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-neutral-900" />
                      <h4 className="text-xs font-bold text-neutral-900">
                        Notifikasi Pesanan
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

            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-700 shadow-2xs">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Live Socket Connected</span>
            </div>
          </div>
        </header>

        {/* Tab Navigasi Menu Dashboard */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("active-orders")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-2xs ${
              activeTab === "active-orders"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            }`}
          >
            Antrean Pesanan Aktif ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("pos-order")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-2xs ${
              activeTab === "pos-order"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            }`}
          >
            + Input Pesanan Walk-in / Telepon
          </button>
          <button
            onClick={() => {
              setActiveTab("coupons");
              fetchCoupons();
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-2xs ${
              activeTab === "coupons"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            }`}
          >
            Manajemen Kupon Diskon ({coupons.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-2xs ${
              activeTab === "history"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            }`}
          >
            Riwayat Komprehensif & Arsip
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-500 font-medium">
              Memuat data dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* KONTEN TAB 1: ANTREAN PESANAN AKTIF */}
            {activeTab === "active-orders" && (
              <div className="space-y-8 animate-fadeIn">
                <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-2xs hover:shadow-md transition space-y-2">
                    <div className="flex justify-between items-center text-neutral-400">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Total Pendapatan Hari Ini
                      </span>
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-black font-mono text-neutral-900">
                      Rp {totalRevenue.toLocaleString("id-ID")}
                    </h3>
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Akumulasi dari {completedOrdersToday.length} pesanan
                      selesai hari ini
                    </p>
                  </div>

                  <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-2xs hover:shadow-md transition space-y-2">
                    <div className="flex justify-between items-center text-neutral-400">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Pesanan Aktif
                      </span>
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-black font-mono text-neutral-900">
                      {activeOrders.length}{" "}
                      <span className="text-sm font-normal text-neutral-500">
                        Antrean
                      </span>
                    </h3>
                    <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Memerlukan konfirmasi kasir / proses dapur
                    </p>
                  </div>

                  <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-2xs hover:shadow-md transition space-y-2">
                    <div className="flex justify-between items-center text-neutral-400">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Menu Terfavorit
                      </span>
                      <Award className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-black text-neutral-900 truncate">
                      {topMenus.length > 0 ? topMenus[0][0] : "Belum ada data"}
                    </h3>
                    <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {topMenus.length > 0
                        ? `Terjual ${topMenus[0][1]} porsi`
                        : "-"}
                    </p>
                  </div>
                </section>

                <section className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      Grafik Tren Penjualan
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Visualisasi data omset operasional restoran secara
                      berkala.
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
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          dataKey="sales"
                          fill="#171717"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                          Pesanan Berlangsung & Antrean
                        </h3>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-600" />
                          Urutan Prioritas (FIFO)
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Kelola antrean aktif (QRIS lunas & Cash menunggu
                        konfirmasi kasir).
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
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 transition font-medium"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredActiveOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-neutral-200/80 rounded-3xl shadow-2xs space-y-2">
                      <p className="text-sm font-bold text-neutral-700">
                        Tidak ada antrean pesanan aktif saat ini
                      </p>
                      <p className="text-xs text-neutral-400">
                        Pesanan baru akan muncul secara real-time di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredActiveOrders.map((order, index) => {
                        const isCashPending =
                          order.paymentStatus === "cash_pending";

                        return (
                          <div
                            key={order._id}
                            className={`bg-white border p-6 rounded-3xl flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-md transition relative overflow-hidden ${
                              isCashPending
                                ? "border-amber-300 bg-amber-50/10"
                                : "border-neutral-200/80"
                            }`}
                          >
                            <div className="absolute top-0 right-0 bg-neutral-900 text-white px-3 py-1 rounded-bl-2xl text-[10px] font-black font-mono">
                              #PRIORITY {index + 1}
                            </div>

                            <div>
                              <div className="flex justify-between items-start pb-4 mb-4 border-b border-neutral-100">
                                <div>
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className="inline-block bg-neutral-900 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-xl tracking-wider shadow-2xs">
                                      Meja #{order.tableNumber}
                                    </span>
                                    {/* BADGE METODE PEMBAYARAN */}
                                    <span
                                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                                        order.paymentMethod === "cash"
                                          ? "bg-amber-100 text-amber-800 border-amber-300"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                      }`}
                                    >
                                      {order.paymentMethod === "cash" ? (
                                        <>
                                          <Wallet className="w-3 h-3" /> CASH
                                        </>
                                      ) : (
                                        <>
                                          <QrCode className="w-3 h-3" /> QRIS
                                        </>
                                      )}
                                    </span>

                                    {/* BADGE KUPON JIKA ADA */}
                                    {order.couponCode && (
                                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                                        <Tag className="w-3 h-3" />{" "}
                                        {order.couponCode}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-base font-extrabold text-neutral-900">
                                    {order.customerName}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                  <button
                                    onClick={() => handlePrintReceipt(order)}
                                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition border border-neutral-200/80 shadow-2xs cursor-pointer flex items-center gap-1.5"
                                    title="Cetak Struk"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    Cetak Struk
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                                <OrderTimer
                                  createdAt={order.createdAt || order.updatedAt}
                                />
                                <div>{getStatusBadge(order)}</div>
                              </div>

                              {/* INFORMASI KONTAK PELANGGAN (EMAIL & NO HP) */}
                              <div className="bg-neutral-100/70 border border-neutral-200/60 p-3.5 rounded-2xl space-y-1.5 mb-4 text-xs">
                                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">
                                  Informasi Kontak Pelanggan:
                                </span>
                                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                                  <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                  <span className="font-mono">
                                    {order.customerPhone || order.phone || "-"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-neutral-700 font-medium truncate">
                                  <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                  <span className="truncate">
                                    {order.customerEmail || order.email || "-"}
                                  </span>
                                </div>
                              </div>

                              {/* Rincian Menu Pesanan */}
                              <div className="space-y-2.5 bg-neutral-50/80 p-4 rounded-2xl border border-neutral-100">
                                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">
                                  Rincian Menu Pesanan:
                                </span>
                                {order.items.map((item, idx) => {
                                  const itemName =
                                    item.menu?.name || item.name || "Menu Item";
                                  const itemPrice =
                                    item.price || item.menu?.price || 0;
                                  const itemImage =
                                    item.menu?.image || item.image || "";

                                  const choices = item.selectedBundleChoices
                                    ? item.selectedBundleChoices instanceof Map
                                      ? Object.fromEntries(
                                          item.selectedBundleChoices,
                                        )
                                      : item.selectedBundleChoices
                                    : {};

                                  return (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-neutral-200/60 shadow-2xs"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
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
                                          <p className="text-[10px] text-neutral-500 font-mono">
                                            {item.quantity}x @ Rp{" "}
                                            {itemPrice.toLocaleString("id-ID")}
                                          </p>

                                          {/* Tampilkan pilihan kustomisasi / add-on dengan aman */}
                                          {Object.keys(choices).length > 0 && (
                                            <div className="text-[10px] text-neutral-500 space-y-0.5 pt-1">
                                              {Object.entries(choices).map(
                                                ([title, val], cIdx) => {
                                                  if (Array.isArray(val)) {
                                                    return val.map(
                                                      (addon, aIdx) => (
                                                        <p
                                                          key={`${cIdx}-${aIdx}`}
                                                        >
                                                          • +{" "}
                                                          <span className="font-bold text-neutral-700">
                                                            {addon.name}
                                                          </span>
                                                          {addon.price > 0 &&
                                                            ` (+Rp ${addon.price.toLocaleString("id-ID")})`}
                                                        </p>
                                                      ),
                                                    );
                                                  }
                                                  return (
                                                    <p key={cIdx}>
                                                      • {title}:{" "}
                                                      <span className="font-bold text-neutral-700">
                                                        {val}
                                                      </span>
                                                    </p>
                                                  );
                                                },
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <span className="font-mono text-xs font-extrabold text-neutral-900 shrink-0">
                                        Rp{" "}
                                        {(
                                          item.quantity * itemPrice
                                        ).toLocaleString("id-ID")}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs">
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
                                  <span>
                                    Potongan Kupon ({order.couponCode})
                                  </span>
                                  <span className="font-mono">
                                    - Rp{" "}
                                    {order.discountAmount.toLocaleString(
                                      "id-ID",
                                    )}
                                  </span>
                                </div>
                              )}

                              {order.serviceFee > 0 && (
                                <div className="flex justify-between items-center text-neutral-500">
                                  <span>Biaya Layanan (Service 5%)</span>
                                  <span className="font-mono font-bold text-neutral-900">
                                    Rp{" "}
                                    {order.serviceFee.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              )}

                              <div className="flex justify-between items-center text-base font-extrabold text-neutral-900 pt-2 border-t border-dashed border-neutral-200">
                                <span>Total Pembayaran</span>
                                <span className="font-mono text-emerald-600 font-black">
                                  Rp {order.totalAmount.toLocaleString("id-ID")}
                                </span>
                              </div>

                              {/* KONDISI TOMBOL AKSI BERDASARKAN STATUS PEMBAYARAN */}
                              {isCashPending ? (
                                <button
                                  onClick={() =>
                                    handleConfirmCashPayment(order._id)
                                  }
                                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-2 animate-pulse mt-3"
                                >
                                  <Wallet className="w-4 h-4" />
                                  <span>Konfirmasi Bayar Di Kasir (Cash)</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleNextStatus(order)}
                                  className={`w-full py-3 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-3 ${
                                    order.orderStatus === "processing"
                                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                                      : "bg-neutral-900 hover:bg-neutral-800 text-white shadow-neutral-900/20"
                                  }`}
                                >
                                  {order.orderStatus === "processing"
                                    ? "Panggil Pesanan (Ready)"
                                    : "Selesaikan Pesanan (Done)"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* KONTEN TAB 2: POS MODE INPUT ORDER */}
            {activeTab === "pos-order" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-neutral-900">
                      Katalog Menu Kasir (POS Mode)
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Klik produk untuk memasukkannya ke keranjang pesanan
                      pelanggan walk-in / telepon.
                    </p>
                  </div>

                  {menus.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-neutral-200 rounded-3xl p-8">
                      <p className="text-sm font-bold text-neutral-700">
                        Tidak ada menu yang tersedia saat ini.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {menus.map((menu) => (
                        <div
                          key={menu._id}
                          onClick={() => handleAddToCart(menu)}
                          className="bg-white border border-neutral-200/80 hover:border-neutral-900 p-4 rounded-3xl shadow-2xs hover:shadow-md transition cursor-pointer flex items-center gap-4 group"
                        >
                          <div className="w-16 h-16 rounded-2xl bg-neutral-100 overflow-hidden shrink-0">
                            {menu.image ? (
                              <img
                                src={menu.image}
                                alt={menu.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                              {menu.category}
                            </span>
                            <h4 className="text-xs font-bold text-neutral-900 truncate">
                              {menu.name}
                            </h4>
                            <p className="text-xs font-mono font-black text-emerald-600 mt-1">
                              Rp {menu.price.toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-2xs group-hover:bg-emerald-600 transition">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-6 self-start">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      Keranjang Pesanan Kasir
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Rincian pesanan pelanggan langsung.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmitManualOrder}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Nama Pelanggan
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        placeholder="Contoh: Budi Santoso"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Nomor Meja
                      </label>
                      <input
                        type="number"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        required
                        placeholder="Contoh: 5"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 font-medium"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                        Item Terpilih ({cart.length})
                      </span>

                      {cart.length === 0 ? (
                        <div className="text-center py-8 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-xs text-neutral-400">
                          Belum ada menu dipilih.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {cart.map((item) => (
                            <div
                              key={item.menuId}
                              className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-neutral-900 truncate">
                                  {item.name}
                                </p>
                                <p className="text-[10px] font-mono text-neutral-500">
                                  Rp {item.price.toLocaleString("id-ID")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCartQty(item.menuId, -1)
                                  }
                                  className="w-6 h-6 rounded-lg bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-xs w-4 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCartQty(item.menuId, 1)
                                  }
                                  className="w-6 h-6 rounded-lg bg-neutral-900 text-white font-bold flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-neutral-500">
                        <span>Subtotal</span>
                        <span className="font-mono font-bold text-neutral-900">
                          Rp {calculateCartSubtotal().toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-500">
                        <span>Biaya Layanan (Service 5%)</span>
                        <span className="font-mono font-bold text-neutral-900">
                          Rp{" "}
                          {(calculateCartSubtotal() * 0.05).toLocaleString(
                            "id-ID",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-base font-extrabold text-neutral-900 pt-2 border-t border-dashed border-neutral-200">
                        <span>Total Tagihan</span>
                        <span className="font-mono text-emerald-600 font-black">
                          Rp {calculateCartTotal().toLocaleString("id-ID")}
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingOrder || cart.length === 0}
                        className={`w-full py-3 rounded-2xl text-xs font-bold transition shadow-2xs mt-3 flex items-center justify-center gap-2 ${
                          submittingOrder || cart.length === 0
                            ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                            : "bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer shadow-md"
                        }`}
                      >
                        {submittingOrder && (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span>
                          {submittingOrder
                            ? "Memproses Pesanan..."
                            : "Buat Pesanan & Proses"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* KONTEN TAB 3: MANAJEMEN KUPON DISKON */}
            {activeTab === "coupons" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-4 self-start">
                  <h3 className="text-base font-bold text-neutral-900">
                    Buat Kupon Diskon Baru
                  </h3>
                  <form
                    onSubmit={handleCreateCoupon}
                    className="space-y-4 text-xs"
                  >
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        Kode Kupon
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: HEMAT50"
                        value={newCouponCode}
                        onChange={(e) =>
                          setNewCouponCode(e.target.value.toUpperCase())
                        }
                        required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        Tipe Diskon
                      </label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium"
                      >
                        <option value="percentage">Persentase (%)</option>
                        <option value="fixed">Nominal Tetap (Rp)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        {discountType === "percentage"
                          ? "Besaran Persen (Contoh: 15 untuk 15%)"
                          : "Nominal Potongan (Rp)"}
                      </label>
                      <input
                        type="number"
                        placeholder={
                          discountType === "percentage" ? "15" : "10000"
                        }
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        Minimal Belanja (Opsional)
                      </label>
                      <input
                        type="number"
                        placeholder="Contoh: 50000"
                        value={minPurchase}
                        onChange={(e) => setMinPurchase(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        Berlaku Sampai (Kedaluwarsa)
                      </label>
                      <input
                        type="date"
                        value={expiredAt}
                        onChange={(e) => setExpiredAt(e.target.value)}
                        required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium cursor-pointer"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded-xl font-bold transition cursor-pointer shadow-sm"
                    >
                      Simpan & Terbitkan Kupon
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-neutral-900">
                    Daftar Kupon Tersedia
                  </h3>
                  {coupons.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-12">
                      Belum ada kupon diskon aktif.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {coupons.map((coupon) => (
                        <div
                          key={coupon._id}
                          className="bg-neutral-50 border border-neutral-200/80 p-4 rounded-2xl flex justify-between items-center text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-neutral-900 text-white px-3 py-1 rounded-lg font-mono font-black tracking-wider">
                                {coupon.code}
                              </span>
                              <span className="text-emerald-600 font-extrabold">
                                {coupon.discountType === "percentage"
                                  ? `${coupon.discountValue}% OFF`
                                  : `Rp ${coupon.discountValue.toLocaleString("id-ID")} OFF`}
                              </span>
                            </div>
                            <p className="text-neutral-500 font-medium">
                              Min. Belanja: Rp{" "}
                              {coupon.minPurchase.toLocaleString("id-ID")} |
                              Exp:{" "}
                              {new Date(coupon.expiredAt).toLocaleDateString(
                                "id-ID",
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCoupon(coupon._id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl font-bold transition cursor-pointer border border-red-200 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* KONTEN TAB 4: RIWAYAT PESANAN KOMPREHENSIF */}
            {activeTab === "history" && (
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-100">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      Riwayat Pesanan Komprehensif (Seminggu Terakhir / Arsip)
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Gunakan tab ini untuk pengecekan ulang transaksi lama,
                      verifikasi refund, atau audit harian.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-2 rounded-2xl">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-xs text-neutral-500 font-semibold">
                        Filter Tanggal:
                      </span>
                      <input
                        type="date"
                        value={historyFilterDate}
                        onChange={(e) => setHistoryFilterDate(e.target.value)}
                        className="bg-transparent text-xs text-neutral-900 font-medium focus:outline-none cursor-pointer"
                      />
                      {historyFilterDate && (
                        <button
                          onClick={() => setHistoryFilterDate("")}
                          className="text-neutral-400 hover:text-neutral-700 text-xs font-bold ml-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {comprehensiveHistory.length === 0 ? (
                  <div className="text-center py-16 text-neutral-400 text-xs">
                    Tidak ada riwayat transaksi selesai untuk tanggal atau
                    kriteria tersebut.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-100 text-[11px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50">
                          <th className="py-3 px-4">ID Pesanan</th>
                          <th className="py-3 px-4">Waktu Transaksi</th>
                          <th className="py-3 px-4">Meja</th>
                          <th className="py-3 px-4">Pelanggan</th>
                          <th className="py-3 px-4">Metode</th>
                          <th className="py-3 px-4">Kupon</th>
                          <th className="py-3 px-4">Total</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-center">
                            Aksi (Cetak/Cek)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-xs text-neutral-700 font-medium">
                        {comprehensiveHistory.map((order) => (
                          <tr
                            key={order._id}
                            className="hover:bg-neutral-50/60 transition"
                          >
                            <td className="py-3.5 px-4 font-mono text-neutral-400 font-semibold">
                              #{order._id.slice(-6).toUpperCase()}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-neutral-500 text-[11px]">
                              {formatDateTime(order.createdAt)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="bg-neutral-100 text-neutral-900 font-extrabold px-2.5 py-1 rounded-lg">
                                Meja #{order.tableNumber}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-neutral-900">
                              {order.customerName}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="uppercase text-[10px] font-extrabold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                                {order.paymentMethod || "qris"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {order.couponCode ? (
                                <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {order.couponCode}
                                </span>
                              ) : (
                                <span className="text-neutral-400">-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-emerald-600">
                              Rp {order.totalAmount.toLocaleString("id-ID")}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                                SELESAI
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handlePrintReceipt(order)}
                                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition border border-neutral-200/80 shadow-2xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Cetak Ulang Struk
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
