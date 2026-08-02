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
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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

  // Filter Tanggal, Search & Category State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

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
      expenses.length === 0 &&
      (!summary.ordersList || summary.ordersList.length === 0)
    ) {
      gooeyToast.error("Tidak ada data untuk diekspor.");
      return;
    }

    const expenseData = expenses.map((exp, idx) => ({
      No: idx + 1,
      Judul: exp.title,
      Kategori: exp.category,
      Nominal: exp.amount,
      Tanggal: new Date(exp.date).toLocaleDateString("id-ID"),
      Catatan: exp.note || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(expenseData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran Operasional");
    XLSX.writeFile(
      wb,
      `Laporan_Keuangan_SwiftOrder_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    gooeyToast.success("Laporan berhasil diunduh ke Excel!");
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Data untuk Grafik Tren (Recharts)
  const chartData = useMemo(() => {
    const map = {};
    if (summary.ordersList) {
      summary.ordersList.forEach((order) => {
        const dateStr = new Date(order.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });
        if (!map[dateStr]) map[dateStr] = { date: dateStr, revenue: 0 };
        map[dateStr].revenue += order.totalAmount || order.grandTotal || 0;
      });
    }
    return Object.values(map);
  }, [summary.ordersList]);

  // Filter & Search Pengeluaran
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

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Halaman & Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[11px] font-black text-emerald-600 mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>Manajemen Finansial Restoran</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900">
            Laporan Keuangan & Laba Rugi
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            Pantau omzet, pengeluaran operasional, grafik tren, dan kalkulasi
            laba bersih secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-2xl text-xs font-black shadow-sm transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-black shadow-lg shadow-neutral-900/10 transition cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Catat Pengeluaran Baru</span>
          </button>
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

      {/* Grafik Visualisasi Tren Pendapatan (Recharts) */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl shadow-sm p-6 space-y-4">
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
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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

      {/* Tabel & Filter Riwayat Pengeluaran */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-black text-neutral-900">
              Riwayat Pengeluaran Operasional
            </h3>
            <p className="text-xs text-neutral-500 font-medium">
              Daftar biaya harian, bahan baku, atau pengeluaran lain restoran.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari pengeluaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {["Semua", "Operasional", "Bahan Baku", "Gaji", "Lainnya"].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black transition cursor-pointer whitespace-nowrap ${
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
              ) : filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => (
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
                    Tidak ada catatan pengeluaran yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
