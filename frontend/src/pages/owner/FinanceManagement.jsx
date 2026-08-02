import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  Trash2,
  Receipt,
  Calendar,
  X,
  AlertTriangle,
} from "lucide-react";
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
  });
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Operasional",
    amount: "",
    note: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, expRes] = await Promise.all([
        API.get("/finance/summary"),
        API.get("/finance/expenses"),
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
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await API.post("/finance/expenses", formData);
      gooeyToast.success("Pengeluaran berhasil dicatat!");
      setShowModal(false);
      setFormData({ title: "", category: "Operasional", amount: "", note: "" });
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

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Halaman */}
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
            Pantau omzet, total pengeluaran operasional, dan kalkulasi laba
            bersih secara real-time.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-black shadow-md transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Catat Pengeluaran Baru</span>
        </button>
      </div>

      {/* Kartu Metrik Keuangan Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Omzet Kotor */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-sm space-y-3">
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
              Dari {summary.totalTransactions} total pesanan selesai.
            </p>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-sm space-y-3">
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

        {/* Laba Kotor */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-sm space-y-3">
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
              Omzet dikurangi estimasi HPP.
            </p>
          </div>
        </div>

        {/* Laba Bersih (Net Profit) */}
        <div className="bg-neutral-950 text-white border border-neutral-800 p-6 rounded-3xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              Laba Bersih (Net Profit)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-amber-400">
              {formatRupiah(summary.netProfit)}
            </h2>
            <p className="text-[11px] text-neutral-400 font-medium mt-1">
              Pendapatan bersih setelah dikurangi operasional.
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Pengeluaran Operasional */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-black text-neutral-900">
              Riwayat Pengeluaran Operasional
            </h3>
            <p className="text-xs text-neutral-500 font-medium">
              Daftar biaya harian, bahan baku, atau pengeluaran lain restoran.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
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
                    className="text-center py-8 text-neutral-400 font-bold"
                  >
                    Memuat data pengeluaran...
                  </td>
                </tr>
              ) : expenses.length > 0 ? (
                expenses.map((exp) => (
                  <tr
                    key={exp._id}
                    className="hover:bg-neutral-50/60 transition"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-neutral-900">
                        {exp.title}
                      </p>
                      {exp.note && (
                        <p className="text-[11px] text-neutral-400 font-normal">
                          {exp.note}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg text-[10px] font-black uppercase">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-red-600">
                      {formatRupiah(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500">
                      {new Date(exp.date).toLocaleDateString("id-ID", {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp._id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer"
                        title="Hapus"
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
                    className="text-center py-8 text-neutral-400 font-bold"
                  >
                    Belum ada catatan pengeluaran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH PENGELUARAN */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 lg:p-8 w-full max-w-md space-y-6 shadow-2xl animate-fadeIn">
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
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
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
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
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
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="Contoh: 150000"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
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
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
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
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer"
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
