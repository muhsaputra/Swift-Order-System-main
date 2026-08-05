import React, { useState, useEffect } from "react";
import API from "../../services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Sparkles,
  Receipt,
  Tag,
  Percent,
  BarChart3,
  Activity,
  Wallet,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
  Store,
  DollarSign,
} from "lucide-react";

export default function ExecutiveDashboard() {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceFeePercentage, setServiceFeePercentage] = useState(5);
  const [chartTimeRange, setChartTimeRange] = useState("week");

  useEffect(() => {
    fetchCompletedOrders();
    fetchServiceFeeSettings();
  }, []);

  const fetchCompletedOrders = async () => {
    try {
      const res = await API.get("/orders");
      const filtered = (res.data || []).filter(
        (order) => order.orderStatus === "completed",
      );
      setCompletedOrders(filtered);
    } catch (err) {
      console.error("Gagal memuat data transaksi owner", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceFeeSettings = async () => {
    try {
      const res = await API.get("/settings/service-fee");
      if (res.data && res.data.serviceFeePercentage !== undefined) {
        setServiceFeePercentage(Number(res.data.serviceFeePercentage));
      }
    } catch (err) {
      console.log("Menggunakan fee layanan default 5%");
    }
  };

  // --- KALKULASI METRIK KEUANGAN EKSEKUTIF ---
  const totalRevenue = completedOrders.reduce(
    (acc, order) => acc + (order.totalAmount || 0),
    0,
  );

  const totalDiscount = completedOrders.reduce(
    (acc, order) => acc + (order.discountAmount || 0),
    0,
  );

  const totalServiceFee = completedOrders.reduce((acc, order) => {
    const sub = order.items.reduce(
      (s, i) => s + (i.price || i.menu?.price || 0) * i.quantity,
      0,
    );
    const fee =
      order.serviceFee && order.serviceFee > 0
        ? order.serviceFee
        : Math.round(
            (sub - (order.discountAmount || 0)) * (serviceFeePercentage / 100),
          );
    return acc + fee;
  }, 0);

  const averageOrderValue =
    completedOrders.length > 0
      ? Math.round(totalRevenue / completedOrders.length)
      : 0;

  // --- LOGIKA GRAFIK TREN PENJUALAN ---
  const getFilteredChartData = () => {
    const now = new Date();
    let limitDate = null;

    if (chartTimeRange === "week") {
      limitDate = new Date();
      limitDate.setDate(now.getDate() - 7);
    } else if (chartTimeRange === "month") {
      limitDate = new Date();
      limitDate.setMonth(now.getMonth() - 1);
    }

    const sourceData = completedOrders.filter((order) => {
      if (!order.createdAt) return false;
      if (limitDate) {
        return new Date(order.createdAt) >= limitDate;
      }
      return true;
    });

    const grouped = {};
    sourceData.forEach((order) => {
      const d = new Date(order.createdAt);
      let key = "";
      if (chartTimeRange === "month") {
        key = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      } else if (chartTimeRange === "week") {
        key = d.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
        });
      } else {
        key = d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
      grouped[key] = (grouped[key] || 0) + (order.totalAmount || 0);
    });

    const result = Object.keys(grouped).map((date) => ({
      date,
      sales: grouped[date],
    }));

    return result.length > 0 ? result : [{ date: "Hari Ini", sales: 0 }];
  };

  const chartData = getFilteredChartData();

  // --- ANALITIK KATEGORI MENU & METODE PEMBAYARAN ---
  const categorySalesStats = {};
  let qrisTotalRevenue = 0;
  let cashTotalRevenue = 0;

  completedOrders.forEach((order) => {
    const method = (order.paymentMethod || "qris").toLowerCase();
    const amount = order.totalAmount || 0;
    if (method === "cash") {
      cashTotalRevenue += amount;
    } else {
      qrisTotalRevenue += amount;
    }

    order.items?.forEach((item) => {
      const cat = item.menu?.category || item.category || "Lainnya";
      const itemRev = (item.price || item.menu?.price || 0) * item.quantity;
      categorySalesStats[cat] = (categorySalesStats[cat] || 0) + itemRev;
    });
  });

  const categoryBarData = Object.keys(categorySalesStats).map((category) => ({
    category,
    revenue: categorySalesStats[category],
  }));

  const paymentComparisonBarData = [
    { name: "QRIS Digital", revenue: qrisTotalRevenue, fill: "#2563eb" },
    { name: "Tunai / Cash", revenue: cashTotalRevenue, fill: "#16a34a" },
  ];

  return (
    <div className="min-h-screen bg-sky-50/40 text-slate-900 pb-20 p-6 md:p-10 space-y-8">
      {/* HERO BANNER EXECUTIVE - Nuansa Biru Terang */}
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-900 text-white py-10 px-6 md:px-12 overflow-hidden rounded-[2.5rem] shadow-xl">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 filter brightness-50 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-blue-900/40 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 px-3 py-1 rounded-full text-[11px] font-bold text-sky-100 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>Executive Business Intelligence</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Dashboard Utama Pemilik
            </h1>
            <p className="text-xs md:text-sm text-sky-100 max-w-lg leading-relaxed">
              Pantau laporan keuangan, pergerakan omset, kategori menu terlaris,
              dan metrik performa restoran secara menyeluruh.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white text-blue-900 flex items-center justify-center font-black shadow-sm">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-sky-200 font-bold">
                Total Akumulasi Omset
              </p>
              <p className="text-base md:text-lg font-black font-mono text-white">
                Rp {totalRevenue.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">
            Memuat data analitik eksekutif...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* GRID METRIK UTAMA (KPI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Verified
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Total Pesanan Selesai
                </p>
                <p className="text-lg font-black font-mono text-slate-900">
                  {completedOrders.length} Transaksi
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                  <Percent className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Fee {serviceFeePercentage}%
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Akumulasi Service Fee
                </p>
                <p className="text-lg font-black font-mono text-slate-900">
                  Rp {totalServiceFee.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold border border-red-100">
                  <Tag className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                  Diskon
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Total Diskon Kupon
                </p>
                <p className="text-lg font-black font-mono text-red-600">
                  - Rp {totalDiscount.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-100">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  Rata-rata
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Nilai Rata-rata Per Meja (AOV)
                </p>
                <p className="text-lg font-black font-mono text-slate-900">
                  Rp {averageOrderValue.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION GRAFIK ANALITIK KOMPREHENSIF */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Grafik Performa & Tren Penjualan Restoran
                </h3>
                <p className="text-xs text-slate-500">
                  Analisis visual pergerakan pendapatan berdasarkan rentang
                  waktu pilihan Anda.
                </p>
              </div>

              {/* Filter Rentang Waktu Grafik */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setChartTimeRange("week")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    chartTimeRange === "week"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  Seminggu
                </button>
                <button
                  onClick={() => setChartTimeRange("month")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    chartTimeRange === "month"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  Sebulan
                </button>
                <button
                  onClick={() => setChartTimeRange("all")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    chartTimeRange === "all"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  Semua
                </button>
              </div>
            </div>

            {/* Grid 3 Grafik */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Tren Omset Area Chart */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Kurva Tren Penjualan
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Akumulasi omset bersih harian.
                  </p>
                </div>
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="colorSalesOwner"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2563eb"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#2563eb"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(value) => `Rp ${value / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `Rp ${value.toLocaleString("id-ID")}`,
                          "Pendapatan",
                        ]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "16px",
                          fontSize: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorSalesOwner)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Omset Kategori Menu */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Omset Kategori Menu
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Kontribusi penjualan tiap kategori produk.
                  </p>
                </div>
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBarData} barSize={42}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="category"
                        stroke="#94a3b8"
                        fontSize={11}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(value) => `Rp ${value / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `Rp ${value.toLocaleString("id-ID")}`,
                          "Omset",
                        ]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "16px",
                          fontSize: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#3b82f6"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Komparasi Metode Pembayaran */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    QRIS Digital vs Tunai (Cash)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Komparasi kanal pembayaran pelanggan.
                  </p>
                </div>
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentComparisonBarData} barSize={50}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(value) => `Rp ${value / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value, name, item) => [
                          `Rp ${value.toLocaleString("id-ID")}`,
                          item.payload.name,
                        ]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "16px",
                          fontSize: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                        }}
                      />
                      <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                        {paymentComparisonBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
