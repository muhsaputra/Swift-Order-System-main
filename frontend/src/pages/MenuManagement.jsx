import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import {
  Plus,
  Edit3,
  Trash2,
  Image as ImageIcon,
  X,
  Folder,
  Tag,
  AlertTriangle,
  Sparkles,
  Layers,
  Package,
  Percent,
  Search,
  Check,
  ChevronRight,
  Flame,
} from "lucide-react";

export default function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState(["Makanan", "Minuman", "Snack"]);
  const [loading, setLoading] = useState(true);

  // State Filter & Pencarian Kategori
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // State untuk mode Edit atau Tambah Menu
  const [editingId, setEditingId] = useState(null);

  // Form Menu State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // State untuk Fitur Bundle / Add-On Berharga
  const [isBundle, setIsBundle] = useState(false);
  const [bundleItems, setBundleItems] = useState([]);
  const [bundleOptions, setBundleOptions] = useState([]);

  // Form Category State
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    fetchMenus();
    fetchCategories();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await API.get("/menus");
      setMenus(res.data);
    } catch (err) {
      console.error("Gagal memuat daftar menu", err);
      toast.error("Gagal memuat daftar menu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      if (res.data && res.data.length > 0) {
        const normalized = res.data.map((c) =>
          typeof c === "object" && c !== null ? c.name || c.categoryName : c,
        );
        setCategories(normalized);
      }
    } catch (err) {
      console.log("Menggunakan kategori default lokal");
    }
  };

  const formatRupiah = (value) => {
    if (!value) return "";
    const numberString = value.toString().replace(/[^,\d]/g, "");
    const split = numberString.split(",");
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? "." : "";
      rupiah += separator + ribuan.join(".");
    }

    return split[1] !== undefined ? rupiah + "," + split[1] : rupiah;
  };

  const handlePriceChange = (e) => {
    setPrice(formatRupiah(e.target.value));
  };

  const handleOriginalPriceChange = (e) => {
    setOriginalPrice(formatRupiah(e.target.value));
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setOriginalPrice("");
    setCategory(categories[0] || "Makanan");
    setIsAvailable(true);
    setImageFile(null);
    setImagePreview("");
    setIsBundle(false);
    setBundleItems([]);
    setBundleOptions([]);
    setShowModal(true);
  };

  const handleOpenEditModal = (menu) => {
    setEditingId(menu._id);
    setName(menu.name);
    setDescription(menu.description || "");
    setPrice(formatRupiah(menu.price));
    setOriginalPrice(
      menu.originalPrice ? formatRupiah(menu.originalPrice) : "",
    );
    setCategory(menu.category);
    setIsAvailable(menu.isAvailable);
    setImageFile(null);
    setImagePreview(menu.image || "");
    setIsBundle(menu.isBundle || false);
    setBundleItems(menu.bundleItems || []);

    const normalizedOptions = (menu.bundleOptions || []).map((opt) => ({
      title: opt.title || "ADD ON",
      choices: (opt.choices || []).map((c) =>
        typeof c === "string" ? { name: c, price: 0 } : c,
      ),
    }));
    setBundleOptions(normalizedOptions);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddBundleOption = () => {
    setBundleOptions([
      ...bundleOptions,
      { title: "ADD ON", choices: [{ name: "", price: 0 }] },
    ]);
  };

  const handleRemoveBundleOption = (index) => {
    setBundleOptions(bundleOptions.filter((_, i) => i !== index));
  };

  const handleBundleOptionTitleChange = (index, title) => {
    const updated = [...bundleOptions];
    updated[index].title = title;
    setBundleOptions(updated);
  };

  const handleAddChoice = (optIndex) => {
    const updated = [...bundleOptions];
    updated[optIndex].choices.push({ name: "", price: 0 });
    setBundleOptions(updated);
  };

  const handleRemoveChoice = (optIndex, choiceIndex) => {
    const updated = [...bundleOptions];
    updated[optIndex].choices = updated[optIndex].choices.filter(
      (_, i) => i !== choiceIndex,
    );
    setBundleOptions(updated);
  };

  const handleChoiceFieldChange = (optIndex, choiceIndex, field, value) => {
    const updated = [...bundleOptions];
    updated[optIndex].choices[choiceIndex][field] = value;
    setBundleOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const rawPrice = Number(price.replace(/\./g, ""));
      const rawOriginalPrice = originalPrice
        ? Number(originalPrice.replace(/\./g, ""))
        : 0;

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", rawPrice);
      formData.append("originalPrice", rawOriginalPrice);
      formData.append("category", category);
      formData.append("isAvailable", isAvailable);
      formData.append("isBundle", isBundle);
      formData.append("bundleItems", JSON.stringify(bundleItems));
      formData.append("bundleOptions", JSON.stringify(bundleOptions));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingId) {
        await API.put(`/menus/${editingId}`, formData);
        toast.success("Menu & Add-On berhasil diperbarui!");
      } else {
        await API.post("/menus", formData);
        toast.success("Menu & Add-On baru berhasil ditambahkan!");
      }

      setShowModal(false);
      fetchMenus();
    } catch (err) {
      console.error("Gagal menyimpan menu", err);
      toast.error(err.response?.data?.error || "Gagal menyimpan menu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (menu) => {
    try {
      const formData = new FormData();
      formData.append("name", menu.name);
      formData.append("description", menu.description || "");
      formData.append("price", menu.price);
      formData.append("originalPrice", menu.originalPrice || 0);
      formData.append("category", menu.category);
      formData.append("isAvailable", !menu.isAvailable);
      formData.append("isBundle", menu.isBundle || false);
      formData.append("bundleItems", JSON.stringify(menu.bundleItems || []));
      formData.append(
        "bundleOptions",
        JSON.stringify(menu.bundleOptions || []),
      );

      await API.put(`/menus/${menu._id}`, formData);
      toast.success(
        `Status ${menu.name} diubah menjadi ${!menu.isAvailable ? "Tersedia" : "Habis"}`,
      );
      fetchMenus();
    } catch (err) {
      toast.error("Gagal memperbarui status menu.");
    }
  };

  const confirmDeleteMenu = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/menus/${deleteTarget._id}`);
      toast.info(`Menu "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchMenus();
    } catch (err) {
      toast.error("Gagal menghapus menu.");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmedCategory = newCategoryName.trim();
    if (!trimmedCategory) return;

    try {
      await API.post("/categories", { name: trimmedCategory });
      toast.success(`Kategori "${trimmedCategory}" berhasil ditambahkan!`);
      setNewCategoryName("");
      fetchCategories();
    } catch (err) {
      if (!categories.includes(trimmedCategory)) {
        setCategories([...categories, trimmedCategory]);
      }
      setNewCategoryName("");
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    try {
      await API.delete(`/categories/${deleteCategoryTarget}`);
      fetchCategories();
    } catch (err) {
      setCategories(categories.filter((c) => c !== deleteCategoryTarget));
    } finally {
      setDeleteCategoryTarget(null);
    }
  };

  // Filter menu berdasarkan pencarian dan kategori yang dipilih
  const filteredMenus = menus.filter((menu) => {
    const matchesSearch =
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (menu.description &&
        menu.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryTab === "Semua" ||
      menu.category?.toLowerCase() === selectedCategoryTab.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Kelompokkan menu berdasarkan kategori untuk tampilan bersekat
  const groupedMenus = categories.reduce((acc, cat) => {
    acc[cat] = filteredMenus.filter(
      (menu) => menu.category?.toLowerCase() === cat.toLowerCase(),
    );
    return acc;
  }, {});

  // Kategori lain di luar daftar standar
  const otherMenus = filteredMenus.filter(
    (menu) =>
      !categories.some(
        (cat) => cat.toLowerCase() === menu.category?.toLowerCase(),
      ),
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-24">
      {/* HERO BANNER ATTRACTION */}
      <div className="relative bg-neutral-900 text-white py-12 px-6 md:px-12 overflow-hidden mb-8 shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 filter brightness-50 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Katalog & Manajemen Produk</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Manajemen Menu & Add-On
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-lg leading-relaxed">
              Atur produk, harga diskon, foto, serta pilihan add-on berharga
              dengan mudah dan terstruktur.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  Total Menu
                </p>
                <p className="text-sm font-extrabold text-white">
                  {menus.length} Produk Aktif
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-8">
        {/* HEADER KONTROL & PENCARIAN */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-neutral-200/80 gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
              Daftar Katalog Produk
            </h2>
            <p className="text-xs text-neutral-500">
              Kelola produk, harga, add-on, ketersediaan, dan kategori menu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu..."
                className="w-full bg-white border border-neutral-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 shadow-2xs font-medium"
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

            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Folder className="w-4 h-4 text-neutral-500" />
              <span>Kelola Kategori</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Baru</span>
            </button>
          </div>
        </header>

        {/* TAB FILTER KATEGORI */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryTab("Semua")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-2xs ${
              selectedCategoryTab === "Semua"
                ? "bg-neutral-900 text-white shadow-sm"
                : "bg-white text-neutral-600 border border-neutral-200/80 hover:text-neutral-900"
            }`}
          >
            Semua Kategori ({menus.length})
          </button>
          {categories.map((cat, idx) => {
            const count = menus.filter(
              (m) => m.category?.toLowerCase() === cat.toLowerCase(),
            ).length;
            return (
              <button
                key={idx}
                onClick={() => setSelectedCategoryTab(cat)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-1.5 ${
                  selectedCategoryTab === cat
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-neutral-600 border border-neutral-200/80 hover:text-neutral-900"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    selectedCategoryTab === cat
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-500 font-medium">
              Memuat daftar menu...
            </p>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="text-center py-20 bg-white border border-neutral-200/80 rounded-3xl shadow-2xs space-y-3">
            <p className="text-sm font-bold text-neutral-700">
              Menu tidak ditemukan.
            </p>
            <p className="text-xs text-neutral-400">
              Coba kata kunci lain atau pilih kategori yang berbeda.
            </p>
          </div>
        ) : (
          /* TAMPILAN BERSEKAT SESUAI KATEGORI */
          <div className="space-y-12">
            {categories.map((cat) => {
              const catMenus = groupedMenus[cat] || [];
              if (
                selectedCategoryTab !== "Semua" &&
                selectedCategoryTab !== cat
              )
                return null;
              if (catMenus.length === 0) return null;

              return (
                <div key={cat} className="space-y-4">
                  {/* Sekat Kategori Header */}
                  <div className="flex items-center gap-3 pb-2 border-b border-neutral-200">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-2xs font-bold text-xs">
                      <Flame className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-900 uppercase tracking-wider">
                        {cat}
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        {catMenus.length} produk tersedia dalam kategori ini
                      </p>
                    </div>
                  </div>

                  {/* Grid Produk dalam Sekat */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {catMenus.map((menu) => (
                      <div
                        key={menu._id}
                        className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition group relative"
                      >
                        <div>
                          <div className="relative h-40 w-full bg-neutral-100 overflow-hidden">
                            {menu.image ? (
                              <img
                                src={menu.image}
                                alt={menu.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 text-xs gap-1">
                                <ImageIcon className="w-5 h-5 text-neutral-300" />
                                <span>Tidak ada foto</span>
                              </div>
                            )}

                            <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                              <button
                                onClick={() => handleToggleAvailability(menu)}
                                title="Klik untuk ubah ketersediaan"
                                className={`px-3 py-1 text-[10px] rounded-full font-extrabold shadow-sm backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 ${
                                  menu.isAvailable
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                    : "bg-neutral-200 text-neutral-600 border border-neutral-300 hover:bg-neutral-300"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    menu.isAvailable
                                      ? "bg-emerald-500"
                                      : "bg-neutral-400"
                                  }`}
                                ></span>
                                {menu.isAvailable ? "TERSEDIA" : "HABIS"}
                              </button>

                              {menu.isBundle && (
                                <span className="px-2.5 py-0.5 text-[9px] rounded-full font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-xs flex items-center gap-1">
                                  <Package className="w-3 h-3" /> Add-On
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 space-y-1.5">
                            <h3 className="text-sm font-bold text-neutral-900 line-clamp-1">
                              {menu.name}
                            </h3>
                            {menu.description ? (
                              <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                                {menu.description}
                              </p>
                            ) : (
                              <p className="text-xs text-neutral-300 italic">
                                Tanpa deskripsi
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-0 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-black text-emerald-600">
                              Rp {menu.price.toLocaleString("id-ID")}
                            </span>
                            {menu.originalPrice > menu.price && (
                              <span className="text-[10px] font-mono text-neutral-400 line-through">
                                Rp {menu.originalPrice.toLocaleString("id-ID")}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(menu)}
                              className="bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-700 p-2 rounded-xl text-xs font-semibold transition border border-neutral-200 shadow-2xs cursor-pointer"
                              title="Edit Menu"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(menu)}
                              className="bg-neutral-100 hover:bg-red-600 hover:text-white text-neutral-700 p-2 rounded-xl text-xs font-semibold transition border border-neutral-200 shadow-2xs cursor-pointer"
                              title="Hapus Menu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Sekat untuk Kategori Lain (jika ada) */}
            {otherMenus.length > 0 &&
              (selectedCategoryTab === "Semua" ||
                otherMenus.some(
                  (m) =>
                    m.category?.toLowerCase() ===
                    selectedCategoryTab.toLowerCase(),
                )) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-neutral-200">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-2xs font-bold text-xs">
                      <Flame className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-900 uppercase tracking-wider">
                        Lainnya
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        {otherMenus.length} produk dalam kategori tambahan
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {otherMenus.map((menu) => (
                      <div
                        key={menu._id}
                        className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition group relative"
                      >
                        <div>
                          <div className="relative h-40 w-full bg-neutral-100 overflow-hidden">
                            {menu.image ? (
                              <img
                                src={menu.image}
                                alt={menu.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 text-xs gap-1">
                                <ImageIcon className="w-5 h-5 text-neutral-300" />
                                <span>Tidak ada foto</span>
                              </div>
                            )}

                            <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                              <button
                                onClick={() => handleToggleAvailability(menu)}
                                title="Klik untuk ubah ketersediaan"
                                className={`px-3 py-1 text-[10px] rounded-full font-extrabold shadow-sm backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 ${
                                  menu.isAvailable
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                    : "bg-neutral-200 text-neutral-600 border border-neutral-300 hover:bg-neutral-300"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    menu.isAvailable
                                      ? "bg-emerald-500"
                                      : "bg-neutral-400"
                                  }`}
                                ></span>
                                {menu.isAvailable ? "TERSEDIA" : "HABIS"}
                              </button>

                              {menu.isBundle && (
                                <span className="px-2.5 py-0.5 text-[9px] rounded-full font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-xs flex items-center gap-1">
                                  <Package className="w-3 h-3" /> Add-On
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                              {menu.category}
                            </span>
                            <h3 className="text-sm font-bold text-neutral-900 line-clamp-1">
                              {menu.name}
                            </h3>
                            {menu.description ? (
                              <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                                {menu.description}
                              </p>
                            ) : (
                              <p className="text-xs text-neutral-300 italic">
                                Tanpa deskripsi
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-0 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-black text-emerald-600">
                              Rp {menu.price.toLocaleString("id-ID")}
                            </span>
                            {menu.originalPrice > menu.price && (
                              <span className="text-[10px] font-mono text-neutral-400 line-through">
                                Rp {menu.originalPrice.toLocaleString("id-ID")}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(menu)}
                              className="bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-700 p-2 rounded-xl text-xs font-semibold transition border border-neutral-200 shadow-2xs cursor-pointer"
                              title="Edit Menu"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(menu)}
                              className="bg-neutral-100 hover:bg-red-600 hover:text-white text-neutral-700 p-2 rounded-xl text-xs font-semibold transition border border-neutral-200 shadow-2xs cursor-pointer"
                              title="Hapus Menu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900">
                  Hapus Menu Ini?
                </h3>
                <p className="text-xs text-neutral-500">
                  Tindakan ini akan menghapus{" "}
                  <span className="font-bold text-neutral-800">
                    "{deleteTarget.name}"
                  </span>{" "}
                  secara permanen.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-neutral-100 text-neutral-700 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteMenu}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {showCategoryModal && (
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-xl">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                <h3 className="text-base font-bold text-neutral-900">
                  Kelola Kategori Menu
                </h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-neutral-400 p-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nama kategori baru..."
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-medium"
                />
                <button
                  type="submit"
                  className="bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tambah
                </button>
              </form>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-neutral-50 rounded-xl text-xs font-bold"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => setDeleteCategoryTarget(cat)}
                      className="text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-xl space-y-6 my-8 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {editingId
                      ? "Edit Menu & Add-On"
                      : "Tambah Menu & Add-On Baru"}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Lengkapi informasi produk dan atur daftar add-on.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 p-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Foto Produk
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-neutral-300" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-xs text-neutral-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Nama Menu
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-medium"
                    placeholder="Contoh: Spaghetti"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Deskripsi Menu
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="2"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none font-medium"
                    placeholder="Deskripsi produk..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Harga Jual (Rp) *
                    </label>
                    <input
                      type="text"
                      value={price}
                      onChange={handlePriceChange}
                      required
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium"
                      placeholder="25.000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Harga Coret (Opsional)
                    </label>
                    <input
                      type="text"
                      value={originalPrice}
                      onChange={handleOriginalPriceChange}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium"
                      placeholder="35.000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-medium cursor-pointer"
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TOGGLE & BUILDER FITUR ADD-ON */}
                <div className="space-y-4 pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80">
                    <div>
                      <p className="text-xs font-bold text-neutral-900">
                        Aktifkan Fitur Pilihan Add-On
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Memungkinkan pelanggan memilih tambahan item berharga.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isBundle}
                      onChange={(e) => setIsBundle(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                  </div>

                  {isBundle && (
                    <div className="space-y-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-700">
                          Daftar Kategori Add-On
                        </label>
                        <button
                          type="button"
                          onClick={handleAddBundleOption}
                          className="bg-neutral-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer"
                        >
                          + Tambah Kategori Add-On
                        </button>
                      </div>

                      {bundleOptions.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className="bg-white p-3.5 rounded-xl border border-neutral-200 space-y-2.5"
                        >
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={opt.title}
                              onChange={(e) =>
                                handleBundleOptionTitleChange(
                                  optIdx,
                                  e.target.value,
                                )
                              }
                              placeholder="Judul Add-On (Misal: ADD ON)"
                              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBundleOption(optIdx)}
                              className="text-red-500 text-xs font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>

                          <div className="space-y-2 pl-2">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                              Pilihan Add-On & Harga Tambahan:
                            </span>
                            {opt.choices.map((choice, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex gap-2 items-center"
                              >
                                <input
                                  type="text"
                                  value={choice.name}
                                  onChange={(e) =>
                                    handleChoiceFieldChange(
                                      optIdx,
                                      cIdx,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Nama Add-On (Misal: Extra Keju)"
                                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                                />
                                <input
                                  type="number"
                                  value={choice.price}
                                  onChange={(e) =>
                                    handleChoiceFieldChange(
                                      optIdx,
                                      cIdx,
                                      "price",
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="Harga (Rp)"
                                  className="w-28 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveChoice(optIdx, cIdx)
                                  }
                                  className="text-neutral-400 hover:text-red-600 text-xs font-bold px-1 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddChoice(optIdx)}
                              className="text-[10px] font-bold text-neutral-700 hover:underline pt-1 block cursor-pointer"
                            >
                              + Tambah Pilihan Add-On Lain
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200/80">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="isAvailable"
                    className="text-xs text-neutral-700 font-semibold cursor-pointer"
                  >
                    Menu Tersedia (Ready to Order)
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-neutral-100 text-neutral-700 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-neutral-900 text-white py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting
                      ? "Menyimpan..."
                      : editingId
                        ? "Simpan Perubahan"
                        : "Simpan Menu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteCategoryTarget && (
          <div className="fixed inset-0 bg-neutral-950/75 backdrop-blur-md z-[99] flex items-center justify-center p-4">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900">
                  Hapus Kategori Ini?
                </h3>
                <p className="text-xs text-neutral-500">
                  Tindakan ini akan menghapus kategori{" "}
                  <span className="font-bold text-neutral-800">
                    "{deleteCategoryTarget}"
                  </span>
                  .
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteCategoryTarget(null)}
                  className="flex-1 bg-neutral-100 text-neutral-700 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCategory}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
