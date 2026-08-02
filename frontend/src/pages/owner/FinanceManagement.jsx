import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  Trash2,
  Search,
  Calendar,
  X,
  FileSpreadsheet,
  BarChart3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import API from "../../services/api";
import { gooeyToast } from "goey-toast";

export default function FinanceManagement() {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    estimatedCOGS: 0,
    grossProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTransactions: 0,
    ordersList: [],
  });
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab View State ("pengeluaran" atau "pemasukan")
  const [activeTab, setActiveTab] = useState("pengeluaran");

  // Filter Tanggal, Search & Category State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // Pagination State (15 data per halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Operasional",
    amount: "",
    displayAmount: "",
    note: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const [sumRes, expRes] = await Promise.all([
        API.get("/finance/summary", { params }),
        API.get("/finance/expenses", { params }),
      ]);
      setSummary(sumRes.data);
      setExpenses(expRes.data || []);
    } catch (err) {
      console.error("Gagal memuat data keuangan:", err);
      gooeyToast.error("Gagal memuat data finansial restoran.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  // Reset halaman ke 1 saat tab atau filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedCategory, startDate, endDate]);

  // Handler Format Input Nominal Rupiah Otomatis
  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (!rawValue) {
      setFormData({ ...formData, amount: "", displayAmount: "" });
      return;
    }
    const numericValue = Number(rawValue);
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(numericValue);

    setFormData({
      ...formData,
      amount: numericValue,
      displayAmount: formatted,
    });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await API.post("/finance/expenses", {
        title: formData.title,
        category: formData.category,
        amount: formData.amount,
        note: formData.note,
      });
      gooeyToast.success("Pengeluaran berhasil dicatat!");
      setShowModal(false);
      setFormData({
        title: "",
        category: "Operasional",
        amount: "",
        displayAmount: "",
        note: "",
      });
      fetchData();
    } catch (err) {
      gooeyToast.error(
        err.response?.data?.error || "Gagal mencatat pengeluaran.",
      );
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Hapus catatan pengeluaran ini?")) return;
    try {
      await API.delete(`/finance/expenses/${id}`);
      gooeyToast.success("Catatan pengeluaran dihapus.");
      fetchData();
    } catch (err) {
      gooeyToast.error("Gagal menghapus pengeluaran.");
    }
  };

  // Ekspor Laporan ke Excel
  const exportToExcel = () => {
    if (
      (!expenses || expenses.length === 0) &&
      (!summary.ordersList || summary.ordersList.length === 0)
    ) {
      gooeyToast.error("Tidak ada data untuk diekspor.");
      return;
    }

    const wb = XLSX.utils.book_new();

    const revenueRows = summary.ordersList.map((ord, idx) => ({
      No: idx + 1,
      "ID Pesanan": ord._id ? ord._id.slice(-6).toUpperCase() : "-",
      "No Meja": ord.tableNumber || "Takeaway",
      "Total Omzet (Rp)": ord.totalAmount || ord.grandTotal || 0,
      "Status Pembayaran": ord.paymentStatus || "Paid",
      "Tanggal Transaksi": new Date(ord.createdAt).toLocaleString("id-ID"),
    }));
    const wsRevenue = XLSX.utils.json_to_sheet(revenueRows);
    XLSX.utils.book_append_sheet(wb, wsRevenue, "Data Pemasukan");

    const expenseRows = expenses.map((exp, idx) => ({
      No: idx + 1,
      "Judul Pengeluaran": exp.title,
      Kategori: exp.category,
      "Nominal (Rp)": exp.amount,
      Tanggal: new Date(exp.date).toLocaleDateString("id-ID"),
      Catatan: exp.note || "-",
    }));
    const wsExpense = XLSX.utils.json_to_sheet(expenseRows);
    XLSX.utils.book_append_sheet(wb, wsExpense, "Data Pengeluaran");

    XLSX.writeFile(
      wb,
      `Laporan_Keuangan_SwiftOrder_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    gooeyToast.success("Laporan Excel profesional berhasil diunduh!");
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Data Grafik Tren Area (Revenue)
  const chartData = useMemo(() => {
    const map = {};
    if (summary.ordersList) {
      summary.ordersList.forEach((order) => {
        const dateStr = new Date(order.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });
        if (!map[dateStr])
          map[dateStr] = { date: dateStr, revenue: 0, expense: 0 };
        map[dateStr].revenue += order.totalAmount || order.grandTotal || 0;
      });
    }
    if (expenses) {
      expenses.forEach((exp) => {
        const dateStr = new Date(exp.date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });
        if (!map[dateStr])
          map[dateStr] = { date: dateStr, revenue: 0, expense: 0 };
        map[dateStr].expense += exp.amount || 0;
      });
    }
    return Object.values(map);
  }, [summary.ordersList, expenses]);

  // Data Breakdown Kategori Pengeluaran
  const expenseCategoryBreakdown = useMemo(() => {
    const categories = { Operasional: 0, "Bahan Baku": 0, Gaji: 0, Lainnya: 0 };
    expenses.forEach((exp) => {
      if (categories[exp.category] !== undefined) {
        categories[exp.category] += exp.amount || 0;
      } else {
        categories.Lainnya += exp.amount || 0;
      }
    });
    return Object.keys(categories).map((key) => ({
      name: key,
      total: categories[key],
    }));
  }, [expenses]);

  // Filter Pengeluaran
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.note && exp.note.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        selectedCategory === "Semua" || exp.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, selectedCategory]);

  // Filter Pemasukan (Orders)
  const filteredOrders = useMemo(() => {
    if (!summary.ordersList) return [];
    return summary.ordersList.filter((ord) => {
      const searchStr = searchTerm.toLowerCase();
      const tableMatch = String(ord.tableNumber || "")
        .toLowerCase()
        .includes(searchStr);
      const idMatch = String(ord._id || "")
        .toLowerCase()
        .includes(searchStr);
      return tableMatch || idMatch;
    });
  }, [summary.ordersList, searchTerm]);

  // Data Paginated untuk Tabel Aktif
  const currentTableData =
    activeTab === "pengeluaran" ? filteredExpenses : filteredOrders;
  const totalPages = Math.ceil(currentTableData.length / itemsPerPage) || 1;

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return currentTableData.slice(start, start + itemsPerPage);
  }, [currentTableData, currentPage]);

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto font-sans">
      {/* BANNER HEADER ESTETIK & BRANDING */}
      <div className="relative bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 rounded-3xl p-6 lg:p-8 text-white shadow-2xl overflow-hidden border border-neutral-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-black text-emerald-400 tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SWIFT ORDERING ENTERPRISE FINANCE</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              Pusat Kontrol Finansial & Laba Rugi
            </h1>
            <p className="text-xs text-neutral-400 font-medium max-w-xl">
              Kelola seluruh aliran kas masuk dari transaksi pelanggan dan
              pencatatan biaya operasional restoran secara akurat dan
              transparan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-5 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl text-xs font-black shadow-md border border-neutral-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Unduh Laporan Excel</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-2xl text-xs font-black shadow-lg transition cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Catat Pengeluaran</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Rentang Tanggal Kustom */}
      <div className="bg-white border border-neutral-200/80 p-4 rounded-3xl shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
          <Calendar className="w-4 h-4 text-neutral-500" />
          <span>Filter Periode:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
          />
          <span className="text-xs text-neutral-400 font-bold">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs font-bold text-red-600 hover:underline px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Kartu Metrik Keuangan Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              Total Omzet (Revenue)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-neutral-900">
              {formatRupiah(summary.totalRevenue)}
            </h2>
            <p className="text-[11px] text-neutral-500 font-medium mt-1">
              Dari {summary.totalTransactions} pesanan selesai.
            </p>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              Total Pengeluaran
            </span>
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-red-600">
              {formatRupiah(summary.totalExpenses)}
            </h2>
            <p className="text-[11px] text-neutral-500 font-medium mt-1">
              Biaya operasional & pengeluaran lain.
            </p>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              Perkiraan Laba Kotor
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-neutral-900">
              {formatRupiah(summary.grossProfit)}
            </h2>
            <p className="text-[11px] text-neutral-500 font-medium mt-1">
              Omzet dikurangi estimasi HPP (40%).
            </p>
          </div>
        </div>

        <div className="bg-neutral-950 text-white border border-neutral-800 p-6 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              Laba Bersih (Net Profit)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-emerald-400">
              {formatRupiah(summary.netProfit)}
            </h2>
            <p className="text-[11px] text-neutral-400 font-medium mt-1">
              Pendapatan bersih setelah dikurangi operasional.
            </p>
          </div>
        </div>
      </div>

      {/* GRAFIK VISUALISASI (AREA TREN & KOMPARASI BATANG) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Area Tren Pendapatan */}
        <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-neutral-900" />
              <h3 className="text-base font-black text-neutral-900">
                Grafik Tren Pendapatan Harian
              </h3>
            </div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Visualisasi Omzet
            </span>
          </div>
          <div className="h-64 w-full pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `Rp ${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value) => [formatRupiah(value), "Omzet"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-bold text-neutral-400">
                Belum cukup data untuk menampilkan grafik tren.
              </div>
            )}
          </div>
        </div>

        {/* Grafik Komparasi Bar Chart (Pemasukan vs Pengeluaran) */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neutral-900" />
              <h3 className="text-base font-black text-neutral-900">
                Komparasi Kas
              </h3>
            </div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Masuk vs Keluar
            </span>
          </div>
          <div className="h-64 w-full pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <Tooltip formatter={(value) => [formatRupiah(value)]} />
                  <Legend
                    wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Pemasukan"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Pengeluaran"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-bold text-neutral-400">
                Belum ada data komparasi.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BREAKDOWN KATEGORI PENGELUARAN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {expenseCategoryBreakdown.map((cat, idx) => (
          <div
            key={idx}
            className="bg-white border border-neutral-200/80 p-5 rounded-3xl shadow-sm space-y-1"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
              Kategori: {cat.name}
            </span>
            <h4 className="text-base font-black text-neutral-900">
              {formatRupiah(cat.total)}
            </h4>
            <p className="text-[10px] text-neutral-500 font-medium">
              Total biaya pos {cat.name}
            </p>
          </div>
        ))}
      </div>

      {/* TAB PEMISAH: PENGELUARAN VS PEMASUKAN */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab("pengeluaran")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === "pengeluaran"
                  ? "bg-neutral-900 text-white shadow-md"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Riwayat Pengeluaran ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab("pemasukan")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === "pemasukan"
                  ? "bg-neutral-900 text-white shadow-md"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Riwayat Pemasukan / Omzet ({summary.ordersList?.length || 0})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={
                activeTab === "pengeluaran"
                  ? "Cari pengeluaran..."
                  : "Cari meja / id pesanan..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
            />
          </div>
        </div>

        {/* KONTEN TAB: PENGELUARAN */}
        {activeTab === "pengeluaran" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500 font-medium">
                Daftar biaya operasional, bahan baku, atau pengeluaran lain
                restoran.
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {["Semua", "Operasional", "Bahan Baku", "Gaji", "Lainnya"].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat
                          ? "bg-neutral-900 text-white shadow-sm"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Keterangan / Judul</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-12 text-neutral-400 font-bold"
                      >
                        Memuat data pengeluaran...
                      </td>
                    </tr>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((exp) => (
                      <tr
                        key={exp._id}
                        className="hover:bg-neutral-50/60 transition group"
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-neutral-900">
                            {exp.title}
                          </p>
                          {exp.note && (
                            <p className="text-[11px] text-neutral-400 font-normal mt-0.5">
                              {exp.note}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-red-600 text-sm">
                          {formatRupiah(exp.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-500 font-medium">
                          {new Date(exp.date).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition cursor-pointer shadow-sm"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-12 text-neutral-400 font-bold"
                      >
                        Tidak ada catatan pengeluaran ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KONTEN TAB: PEMASUKAN */}
        {activeTab === "pemasukan" && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500 font-medium">
              Daftar transaksi pesanan masuk yang sukses dibayar oleh pelanggan.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                    <th className="py-3 px-4">ID Pesanan</th>
                    <th className="py-3 px-4">Meja</th>
                    <th className="py-3 px-4">Total Omzet</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Waktu Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-12 text-neutral-400 font-bold"
                      >
                        Memuat data pemasukan...
                      </td>
                    </tr>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((ord) => (
                      <tr
                        key={ord._id}
                        className="hover:bg-neutral-50/60 transition"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                          #{ord._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[10px] font-black uppercase">
                            Meja {ord.tableNumber || "Takeaway"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                          {formatRupiah(ord.totalAmount || ord.grandTotal)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                            {ord.paymentStatus || "Paid"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-500 font-medium">
                          {new Date(ord.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-12 text-neutral-400 font-bold"
                      >
                        Tidak ada data pemasukan ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAGINATION CONTROLS (NEXT / PREV) */}
        {!loading && currentTableData.length > itemsPerPage && (
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 text-xs font-bold text-neutral-600">
            <p>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, currentTableData.length)}{" "}
              dari {currentTableData.length} data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
              <span className="px-3 py-2 bg-neutral-900 text-white rounded-xl">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL TAMBAH PENGELUARAN */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 lg:p-8 w-full max-w-md space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-neutral-900">
                  Catat Pengeluaran Baru
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  Masukkan detail biaya operasional restoran.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Judul Pengeluaran
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Contoh: Beli Gas 12kg & Minyak Goreng"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 transition cursor-pointer"
                >
                  <option value="Operasional">Operasional</option>
                  <option value="Bahan Baku">Bahan Baku</option>
                  <option value="Gaji">Gaji Karyawan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Nominal (Rupiah)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.displayAmount}
                    onChange={handleAmountChange}
                    placeholder="Contoh: Rp 150.000"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
                  />
                </div>
                {formData.amount > 0 && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    Nominal terbaca: {formatRupiah(formData.amount)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows="2"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="Keterangan tambahan..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
