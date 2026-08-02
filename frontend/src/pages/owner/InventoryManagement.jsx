import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  RefreshCw,
  Layers,
  DollarSign,
  X,
  ArrowUpRight,
  CheckCircle2,
  Tag,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import API from "../../services/api";
import { gooeyToast } from "goey-toast";

export default function InventoryManagement() {
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Anda bisa mengubah jumlah item per halaman di sini

  // State Modal Tambah Barang
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    category: "Bahan Baku",
    stock: "",
    unit: "kg",
    minAlert: "5",
    costPerUnit: "",
  });

  // State Modal Restock
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [restockData, setRestockData] = useState({
    addedStock: "",
    totalCost: "",
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await API.get("/inventory");
      setInventoryList(response.data || []);
    } catch (err) {
      console.error("Gagal memuat inventaris:", err);
      gooeyToast.error("Gagal memuat data inventaris gudang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Reset ke halaman 1 saat pencarian atau kategori berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/inventory", {
        itemName: formData.itemName,
        category: formData.category,
        stock: Number(formData.stock) || 0,
        unit: formData.unit,
        minAlert: Number(formData.minAlert) || 5,
        costPerUnit: Number(formData.costPerUnit) || 0,
      });
      gooeyToast.success("Bahan baku baru berhasil ditambahkan!");
      setShowAddModal(false);
      setFormData({
        itemName: "",
        category: "Bahan Baku",
        stock: "",
        unit: "kg",
        minAlert: "5",
        costPerUnit: "",
      });
      fetchInventory();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Gagal menambahkan barang.";
      gooeyToast.error(errorMsg);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!activeItem) return;
    try {
      await API.post(`/inventory/${activeItem._id}/restock`, {
        addedStock: Number(restockData.addedStock) || 0,
        totalCost: Number(restockData.totalCost) || 0,
      });
      gooeyToast.success(
        `Restock ${activeItem.itemName} berhasil & tercatat di Laporan Keuangan!`,
      );
      setShowRestockModal(false);
      setActiveItem(null);
      setRestockData({ addedStock: "", totalCost: "" });
      fetchInventory();
    } catch (err) {
      gooeyToast.error("Gagal melakukan restock barang.");
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredItems = inventoryList.filter((item) => {
    const matchesSearch =
      item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Logika Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const totalItemsCount = inventoryList.length;
  const lowStockCount = inventoryList.filter(
    (item) => item.stock <= (item.minAlert || 5),
  ).length;
  const totalAssetValue = inventoryList.reduce(
    (acc, curr) => acc + curr.stock * curr.costPerUnit,
    0,
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto font-sans antialiased text-neutral-900">
      {/* HERO BANNER HIGH-LEVEL */}
      <div className="relative bg-gradient-to-br from-slate-950 via-neutral-900 to-indigo-950 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-2xl overflow-hidden border border-neutral-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-[11px] font-black text-emerald-400 tracking-wider shadow-inner">
              <Boxes className="w-3.5 h-3.5 animate-pulse" />
              <span>WAREHOUSE & INVENTORY CONTROL</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
              Manajemen Stok & Bahan Baku
            </h1>
            <p className="text-xs lg:text-sm text-neutral-300 font-medium max-w-2xl leading-relaxed">
              Pusat kendali inventaris restoran. Pantau ketersediaan stok secara
              real-time, kelola batas minimum peringatan, dan sinkronkan
              pembelian restock otomatis ke Laporan Keuangan.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 rounded-2xl text-xs font-black shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan Baku</span>
          </button>
        </div>

        {/* STATISTIK OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Total Jenis Barang
              </p>
              <p className="text-xl font-black text-white">
                {totalItemsCount} Item
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Stok Menipis / Habis
              </p>
              <p className="text-xl font-black text-red-400">
                {lowStockCount} Item
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Estimasi Valuasi Aset Stok
              </p>
              <p className="text-lg font-black text-emerald-400">
                {formatRupiah(totalAssetValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KONTROL TAB & PENCARIAN */}
      <div className="bg-white border border-neutral-200/80 rounded-[2rem] shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-2xl overflow-x-auto">
            {["Semua", "Bahan Baku", "Minuman", "Kemasan", "Lainnya"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-slate-950 text-white shadow-md"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nama bahan atau kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* TABEL INVENTARIS */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                <th className="py-4 px-4">Nama Barang / Bahan</th>
                <th className="py-4 px-4">Kategori</th>
                <th className="py-4 px-4">Stok Saat Ini</th>
                <th className="py-4 px-4">Harga Beli / Satuan</th>
                <th className="py-4 px-4">Status Stok</th>
                <th className="py-4 px-4 text-center">Aksi Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-16 text-neutral-400 font-bold animate-pulse"
                  >
                    Memuat data inventaris gudang...
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((item) => {
                  const isLow = item.stock <= (item.minAlert || 5);
                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-4 px-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-700 font-black flex items-center justify-center shrink-0 shadow-inner">
                          <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-extrabold text-neutral-900 text-sm">
                            {item.itemName}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            Min. Alert: {item.minAlert} {item.unit}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                          <Tag className="w-3 h-3 text-indigo-500" />
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-sm font-black ${isLow ? "text-red-600" : "text-neutral-900"}`}
                        >
                          {item.stock}{" "}
                          <span className="text-xs font-normal text-neutral-500">
                            {item.unit}
                          </span>
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-emerald-600 text-sm">
                        {formatRupiah(item.costPerUnit)}{" "}
                        <span className="text-[10px] font-normal text-neutral-400">
                          / {item.unit}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Stok Menipis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Aman
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => {
                            setActiveItem(item);
                            setShowRestockModal(true);
                          }}
                          className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black transition-all shadow-md cursor-pointer active:scale-95 inline-flex items-center gap-1.5"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />{" "}
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-16 text-neutral-400 font-bold"
                  >
                    Tidak ada bahan baku yang ditemukan dalam inventaris.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100">
            <p className="text-xs font-semibold text-neutral-500">
              Menampilkan{"	"}
              <span className="font-bold text-neutral-900">
                {Math.min(startIndex + 1, filteredItems.length)}
              </span>{" "}
              sampai{" "}
              <span className="font-bold text-neutral-900">
                {Math.min(startIndex + itemsPerPage, filteredItems.length)}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-neutral-900">
                {filteredItems.length}
              </span>{" "}
              total item
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-xs font-black text-neutral-900">
                  {currentPage}
                </span>
                <span className="text-xs font-semibold text-neutral-400">
                  /
                </span>
                <span className="text-xs font-semibold text-neutral-500">
                  {totalPages}
                </span>
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL TAMBAH BARANG INVENTARIS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-neutral-200 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-md space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-neutral-900">
                  Tambah Bahan Baku Baru
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  Daftarkan item stok baru ke dalam gudang.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Nama Barang / Bahan
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value })
                  }
                  placeholder="Contoh: Beras Premium"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950 cursor-pointer"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Kemasan">Kemasan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    Satuan Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950 cursor-pointer"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gram">Gram (g)</option>
                    <option value="liter">Liter (l)</option>
                    <option value="ml">Mililiter (ml)</option>
                    <option value="pcs">Pcs / Buah</option>
                    <option value="pack">Pack / Bungkus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    placeholder="0"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    Batas Minimum Alert
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.minAlert}
                    onChange={(e) =>
                      setFormData({ ...formData, minAlert: e.target.value })
                    }
                    placeholder="5"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Harga Beli per Satuan (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={formData.costPerUnit}
                  onChange={(e) =>
                    setFormData({ ...formData, costPerUnit: e.target.value })
                  }
                  placeholder="15000"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESTOCK STOK & OTOMATIS MASUK LAPORAN KEUANGAN */}
      {showRestockModal && activeItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-neutral-200 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-md space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-neutral-900">
                  Restock: {activeItem.itemName}
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  Pembelian stok akan otomatis tercatat di Laporan Keuangan.
                </p>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                className="w-9 h-9 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Jumlah Stok Masuk ({activeItem.unit})
                </label>
                <input
                  type="number"
                  required
                  value={restockData.addedStock}
                  onChange={(e) =>
                    setRestockData({
                      ...restockData,
                      addedStock: e.target.value,
                    })
                  }
                  placeholder="Contoh: 50"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Total Biaya Pengeluaran Pembelian (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={restockData.totalCost}
                  onChange={(e) =>
                    setRestockData({
                      ...restockData,
                      totalCost: e.target.value,
                    })
                  }
                  placeholder="Contoh: 750000"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Stok Akhir Setelah Restock
                </span>
                <h4 className="text-lg font-black text-emerald-600">
                  {Number(activeItem.stock || 0) +
                    (Number(restockData.addedStock) || 0)}{" "}
                  {activeItem.unit}
                </h4>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  Konfirmasi & Catat Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
