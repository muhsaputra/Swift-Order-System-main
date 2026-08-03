import React, { useState, useEffect } from "react";
import { gooeyToast } from "goey-toast";
import API from "../../services/api";
import {
  Plus,
  Edit3,
  Trash2,
  Image as ImageIcon,
  X,
  Folder,
  AlertTriangle,
  Sparkles,
  Layers,
  Package,
  Search,
  Flame,
  Scale,
  ChefHat,
  CheckCircle2,
  Tag,
  Percent,
} from "lucide-react";

export default function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState(["Makanan", "Minuman", "Snack"]);
  const [inventoryItems, setInventoryItems] = useState([]); // Daftar bahan baku gudang untuk BOM
  const [loading, setLoading] = useState(true);

  // State Filter & Pencarian Kategori
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false); // Modal untuk buat/kelola Promo
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // State untuk mode Edit atau Tambah Menu
  const [editingId, setEditingId] = useState(null);

  // Form Menu State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // State untuk Fitur Bundle / Add-On Berharga & Level Kepedasan Dinamis
  const [isBundle, setIsBundle] = useState(false);
  const [bundleItems, setBundleItems] = useState([]);
  const [bundleOptions, setBundleOptions] = useState([]);

  // State untuk Integrasi Inventaris / Resep (BOM)
  const [ingredients, setIngredients] = useState([]);

  // Form Category State
  const [newCategoryName, setNewCategoryName] = useState("");

  // State untuk Fitur Promo (Promo Kemerdekaan, dll)
  const [promoName, setPromoName] = useState("");
  const [promoType, setPromoType] = useState("percentage"); // 'percentage' atau 'fixed'
  const [promoValue, setPromoValue] = useState(""); // Nilai potongan
  const [selectedPromoMenus, setSelectedPromoMenus] = useState([]); // Daftar ID menu yang dipilih untuk promo

  useEffect(() => {
    fetchMenus();
    fetchCategories();
    fetchInventory();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await API.get("/menus");
      setMenus(res.data);
    } catch (err) {
      console.error("Gagal memuat daftar menu", err);
      gooeyToast.error("Gagal memuat daftar menu.");
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

  const fetchInventory = async () => {
    try {
      const res = await API.get("/inventory");
      setInventoryItems(res.data);
    } catch (err) {
      console.error("Gagal memuat data inventaris gudang", err);
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
    setSku("");
    setDescription("");
    setPrice("");
    setOriginalPrice("");
    setCategory(categories[0] || "Makanan");
    setIsAvailable(true);
    setImageFile(null);
    setImagePreview("");
    setIsBundle(false);
    setBundleItems([]);
    setBundleOptions([
      {
        title: "LEVEL KEPEDASAN",
        choices: [
          { name: "Tidak Pedas", price: 0 },
          { name: "Level 1", price: 0 },
          { name: "Level 2", price: 0 },
          { name: "Level 3", price: 0 },
        ],
      },
    ]);
    setIngredients([]);
    setShowModal(true);
  };

  const handleOpenEditModal = (menu) => {
    setEditingId(menu._id);
    setName(menu.name);
    setSku(menu.sku || "");
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

    const normalizedIngredients = (menu.ingredients || []).map((ing) => ({
      inventoryItem: ing.inventoryItem?._id || ing.inventoryItem,
      qtyNeeded: ing.qtyNeeded || 0,
    }));
    setIngredients(normalizedIngredients);

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
      { title: "ADD ON / PILIHAN", choices: [{ name: "", price: 0 }] },
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

  const handleAddIngredientRow = () => {
    if (inventoryItems.length === 0) {
      gooeyToast.error(
        "Data inventaris gudang kosong. Tambahkan dulu di menu Stok.",
      );
      return;
    }
    setIngredients([
      ...ingredients,
      { inventoryItem: inventoryItems[0]._id, qtyNeeded: 1 },
    ]);
  };

  const handleRemoveIngredientRow = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
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
      formData.append("sku", sku);
      formData.append("description", description);
      formData.append("price", rawPrice);
      formData.append("originalPrice", rawOriginalPrice);
      formData.append("category", category);
      formData.append("isAvailable", isAvailable);
      formData.append("isBundle", isBundle);
      formData.append("bundleItems", JSON.stringify(bundleItems));
      formData.append("bundleOptions", JSON.stringify(bundleOptions));
      formData.append("ingredients", JSON.stringify(ingredients));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingId) {
        await API.put(`/menus/${editingId}`, formData);
        gooeyToast.success("Menu & Resep Inventaris berhasil diperbarui!");
      } else {
        await API.post("/menus", formData);
        gooeyToast.success(
          "Menu & Resep Inventaris baru berhasil ditambahkan!",
        );
      }

      setShowModal(false);
      fetchMenus();
    } catch (err) {
      console.error("Gagal menyimpan menu", err);
      gooeyToast.error(err.response?.data?.error || "Gagal menyimpan menu.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler Submit untuk Fitur Promo Massal
  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoName.trim())
      return gooeyToast.error("Masukkan nama promo terlebih dahulu!");
    if (selectedPromoMenus.length === 0)
      return gooeyToast.error("Pilih minimal satu menu untuk promo ini!");
    if (!promoValue || Number(promoValue) <= 0)
      return gooeyToast.error("Masukkan besar potongan harga yang valid!");

    setSubmitting(true);
    try {
      for (const menuId of selectedPromoMenus) {
        const targetMenu = menus.find((m) => m._id === menuId);
        if (!targetMenu) continue;

        const currentOriginalPrice =
          targetMenu.originalPrice &&
          targetMenu.originalPrice > targetMenu.price
            ? targetMenu.originalPrice
            : targetMenu.price;

        let newDiscountedPrice = currentOriginalPrice;

        if (promoType === "percentage") {
          const discount = (currentOriginalPrice * Number(promoValue)) / 100;
          newDiscountedPrice = Math.round(currentOriginalPrice - discount);
        } else {
          newDiscountedPrice = Math.max(
            0,
            currentOriginalPrice - Number(promoValue),
          );
        }

        const formData = new FormData();
        formData.append("name", targetMenu.name);
        formData.append("sku", targetMenu.sku || "");
        formData.append("description", targetMenu.description || "");
        formData.append("price", newDiscountedPrice);
        formData.append("originalPrice", currentOriginalPrice);
        formData.append("category", targetMenu.category);
        formData.append("isAvailable", targetMenu.isAvailable);
        formData.append("isBundle", targetMenu.isBundle || false);
        formData.append(
          "bundleItems",
          JSON.stringify(targetMenu.bundleItems || []),
        );
        formData.append(
          "bundleOptions",
          JSON.stringify(targetMenu.bundleOptions || []),
        );
        formData.append(
          "ingredients",
          JSON.stringify(
            (targetMenu.ingredients || []).map((ing) => ({
              inventoryItem: ing.inventoryItem?._id || ing.inventoryItem,
              qtyNeeded: ing.qtyNeeded,
            })),
          ),
        );

        await API.put(`/menus/${menuId}`, formData);
      }

      gooeyToast.success(
        `Promo "${promoName}" berhasil diterapkan ke ${selectedPromoMenus.length} menu! 🎉`,
      );
      setShowPromoModal(false);
      setPromoName("");
      setPromoValue("");
      setSelectedPromoMenus([]);
      fetchMenus();
    } catch (err) {
      console.error("Gagal menerapkan promo", err);
      gooeyToast.error("Gagal menerapkan promo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (menu) => {
    try {
      const formData = new FormData();
      formData.append("name", menu.name);
      formData.append("sku", menu.sku || "");
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
      formData.append(
        "ingredients",
        JSON.stringify(
          (menu.ingredients || []).map((ing) => ({
            inventoryItem: ing.inventoryItem?._id || ing.inventoryItem,
            qtyNeeded: ing.qtyNeeded,
          })),
        ),
      );

      await API.put(`/menus/${menu._id}`, formData);
      gooeyToast.success(
        `Status ${menu.name} diubah menjadi ${!menu.isAvailable ? "Tersedia" : "Habis"}`,
      );
      fetchMenus();
    } catch (err) {
      gooeyToast.error("Gagal memperbarui status menu.");
    }
  };

  const confirmDeleteMenu = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/menus/${deleteTarget._id}`);
      gooeyToast.info(`Menu "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchMenus();
    } catch (err) {
      gooeyToast.error("Gagal menghapus menu.");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmedCategory = newCategoryName.trim();
    if (!trimmedCategory) return;

    try {
      await API.post("/categories", { name: trimmedCategory });
      gooeyToast.success(`Kategori "${trimmedCategory}" berhasil ditambahkan!`);
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

  const filteredMenus = menus.filter((menu) => {
    const matchesSearch =
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (menu.sku &&
        menu.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (menu.description &&
        menu.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryTab === "Semua" ||
      menu.category?.toLowerCase() === selectedCategoryTab.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const groupedMenus = categories.reduce((acc, cat) => {
    acc[cat] = filteredMenus.filter(
      (menu) => menu.category?.toLowerCase() === cat.toLowerCase(),
    );
    return acc;
  }, {});

  const otherMenus = filteredMenus.filter(
    (menu) =>
      !categories.some(
        (cat) => cat.toLowerCase() === menu.category?.toLowerCase(),
      ),
  );

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-28 selection:bg-amber-500 selection:text-white">
      {/* HIGH-LEVEL HERO BANNER */}
      <div className="relative bg-slate-900 text-white py-12 px-6 md:px-12 overflow-hidden mb-8 shadow-xl border-b border-slate-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 filter brightness-50 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-400 border border-amber-500/20 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Sistem Manajemen Katalog, Resep & Promo Terpadu</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Manajemen Menu & Promo
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl leading-relaxed">
              Pusat kendali produk kuliner, pengaturan SKU, harga promosi
              massal, varian add-on modular, serta sinkronisasi otomatis stok
              bahan baku gudang (BOM).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Total Katalog Menu
              </p>
              <p className="text-base font-black text-white">
                {menus.length}{" "}
                <span className="text-xs font-medium text-slate-400">
                  Produk Aktif
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-8">
        {/* HEADER KONTROL & PENCARIAN */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>Daftar Produk & Varian</span>
              <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                {filteredMenus.length} Ditampilkan
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Filter berdasarkan kategori, cari dengan cepat, atau buat promo
              spesial.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama menu atau SKU..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 shadow-2xs font-medium transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Folder className="w-4 h-4 text-slate-500" />
              <span>Kategori</span>
            </button>

            {/* Tombol Buat Promo Baru */}
            <button
              onClick={() => {
                setPromoName("");
                setPromoValue("");
                setSelectedPromoMenus([]);
                setShowPromoModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Tag className="w-4 h-4" />
              <span>Buat Promo Menu</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
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
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-2xs ${
              selectedCategoryTab === "Semua"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
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
                className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-2 ${
                  selectedCategoryTab === cat
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    selectedCategoryTab === cat
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-3">
            <div className="w-9 h-9 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-semibold">
              Memuat data katalog menu...
            </p>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="text-center py-24 bg-white border border-slate-200/80 rounded-3xl shadow-2xs space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Menu tidak ditemukan.
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Coba gunakan kata kunci pencarian lain atau pilih kategori yang
              berbeda.
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
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md font-bold text-xs">
                        <Flame className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          {cat}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {catMenus.length} produk tersedia dalam kategori ini
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catMenus.map((menu) => (
                      <div
                        key={menu._id}
                        className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-xl transition-all duration-300 group relative"
                      >
                        <div>
                          <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                            {menu.image ? (
                              <img
                                src={menu.image}
                                alt={menu.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 bg-slate-50">
                                <ImageIcon className="w-6 h-6 text-slate-300" />
                                <span className="font-medium text-[11px]">
                                  Tidak ada foto
                                </span>
                              </div>
                            )}

                            <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                              <button
                                onClick={() => handleToggleAvailability(menu)}
                                title="Klik untuk ubah ketersediaan"
                                className={`px-3 py-1.5 text-[10px] rounded-full font-extrabold shadow-md backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 ${
                                  menu.isAvailable
                                    ? "bg-emerald-500/90 text-white border border-emerald-400 hover:bg-emerald-600"
                                    : "bg-slate-800/90 text-slate-300 border border-slate-700 hover:bg-slate-900"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    menu.isAvailable
                                      ? "bg-emerald-300 animate-pulse"
                                      : "bg-slate-400"
                                  }`}
                                ></span>
                                {menu.isAvailable ? "TERSEDIA" : "HABIS"}
                              </button>

                              {menu.originalPrice &&
                                menu.originalPrice > menu.price && (
                                  <span className="px-2.5 py-1 text-[9px] rounded-full font-black bg-purple-600 text-white shadow-md flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> PROMO AKTIF
                                  </span>
                                )}
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-amber-600 transition">
                                {menu.name}
                              </h3>
                              {menu.sku && (
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">
                                  {menu.sku}
                                </span>
                              )}
                            </div>

                            {menu.description ? (
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                                {menu.description}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-300 italic font-normal">
                                Tanpa deskripsi produk
                              </p>
                            )}

                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {menu.bundleOptions &&
                                menu.bundleOptions.map((opt, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-semibold"
                                  >
                                    {opt.title}: {opt.choices?.length || 0} opsi
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-5 pt-0 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-sm font-mono font-black text-emerald-600">
                              Rp {menu.price.toLocaleString("id-ID")}
                            </span>
                            {menu.originalPrice > menu.price && (
                              <span className="text-[10px] font-mono text-slate-400 line-through">
                                Rp {menu.originalPrice.toLocaleString("id-ID")}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditModal(menu)}
                              className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 p-2.5 rounded-xl text-xs font-semibold transition border border-slate-200 shadow-2xs cursor-pointer active:scale-95"
                              title="Edit Menu"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(menu)}
                              className="bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 p-2.5 rounded-xl text-xs font-semibold transition border border-slate-200 shadow-2xs cursor-pointer active:scale-95"
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
          </div>
        )}

        {/* --- MODAL MANAJEMEN PROMO --- */}
        {showPromoModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-lg space-y-6 my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold shadow-inner">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Buat Promo Menu Massal 🚀
                    </h3>
                    <p className="text-xs text-slate-500">
                      Terapkan promo khusus ke beberapa menu sekaligus.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPromoModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-2 cursor-pointer transition rounded-full hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleApplyPromo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Promo *
                  </label>
                  <input
                    type="text"
                    required
                    value={promoName}
                    onChange={(e) => setPromoName(e.target.value)}
                    placeholder="Contoh: PROMO KEMERDEKAAN 17 AGUSTUS"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tipe Potongan
                    </label>
                    <select
                      value={promoType}
                      onChange={(e) => setPromoType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer focus:outline-none focus:border-purple-500"
                    >
                      <option value="percentage">Persentase (%)</option>
                      <option value="fixed">Nominal Rupiah (Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Besar Diskon / Potongan *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={promoValue}
                      onChange={(e) => setPromoValue(e.target.value)}
                      placeholder={
                        promoType === "percentage"
                          ? "Contoh: 15"
                          : "Contoh: 5000"
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Pilih Menu yang Dipromosikan ({selectedPromoMenus.length}{" "}
                      Dipilih)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPromoMenus.length === menus.length) {
                          setSelectedPromoMenus([]);
                        } else {
                          setSelectedPromoMenus(menus.map((m) => m._id));
                        }
                      }}
                      className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer"
                    >
                      {selectedPromoMenus.length === menus.length
                        ? "Batalkan Semua"
                        : "Pilih Semua Menu"}
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                    {menus.map((menu) => {
                      const isSelected = selectedPromoMenus.includes(menu._id);
                      return (
                        <div
                          key={menu._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPromoMenus(
                                selectedPromoMenus.filter(
                                  (id) => id !== menu._id,
                                ),
                              );
                            } else {
                              setSelectedPromoMenus([
                                ...selectedPromoMenus,
                                menu._id,
                              ]);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            isSelected
                              ? "bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="accent-purple-600 w-4 h-4 rounded cursor-pointer"
                            />
                            <span>{menu.name}</span>
                          </div>
                          <span className="font-mono text-emerald-600 font-bold">
                            Rp {menu.price.toLocaleString("id-ID")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPromoModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/20"
                  >
                    {submitting
                      ? "Menerapkan Promo..."
                      : "Terapkan Promo Sekarang"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS MENU */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Menu Ini?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan menghapus{" "}
                  <span className="font-bold text-slate-800">
                    "{deleteTarget.name}"
                  </span>{" "}
                  secara permanen.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteMenu}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer transition shadow-lg shadow-red-600/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KELOLA KATEGORI */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900">
                  Kelola Kategori Menu
                </h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-2 cursor-pointer transition"
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
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-amber-500/20"
                >
                  Tambah
                </button>
              </form>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200/60"
                  >
                    <span className="text-slate-800">{cat}</span>
                    <button
                      type="button"
                      onClick={() => setDeleteCategoryTarget(cat)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL FORM TAMBAH / EDIT MENU */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-2xl space-y-6 my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingId
                      ? "Edit Menu & Resep"
                      : "Tambah Menu & Resep Baru"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lengkapi informasi produk, atur pilihan varian, dan tautkan
                    bahan baku gudang.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-2 cursor-pointer transition rounded-full hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Foto Produk
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner shrink-0">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-slate-300" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Menu *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-amber-500"
                      placeholder="Contoh: Nasi Goreng Spesial"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      SKU (Stock Keeping Unit)
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium uppercase focus:outline-none focus:border-amber-500"
                      placeholder="Contoh: MKN-NSG-SPC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Deskripsi Menu
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs resize-none font-medium focus:outline-none focus:border-amber-500"
                    placeholder="Deskripsi produk kuliner..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Harga Jual (Rp) *
                    </label>
                    <input
                      type="text"
                      value={price}
                      onChange={handlePriceChange}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium focus:outline-none focus:border-amber-500"
                      placeholder="25.000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Harga Coret (Opsional)
                    </label>
                    <input
                      type="text"
                      value={originalPrice}
                      onChange={handleOriginalPriceChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium focus:outline-none focus:border-amber-500"
                      placeholder="35.000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium cursor-pointer focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    {submitting
                      ? "Menyimpan..."
                      : editingId
                        ? "Simpan Perubahan"
                        : "Simpan Menu Baru"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
