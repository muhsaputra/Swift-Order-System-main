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
} from "lucide-react";

export default function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState(["Makanan", "Minuman", "Snack"]);
  const [loading, setLoading] = useState(true);

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
  const [category, setCategory] = useState("Makanan");
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

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
    const rawValue = e.target.value;
    const formatted = formatRupiah(rawValue);
    setPrice(formatted);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategory(categories[0] || "Makanan");
    setIsAvailable(true);
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const handleOpenEditModal = (menu) => {
    setEditingId(menu._id);
    setName(menu.name);
    setDescription(menu.description || "");
    setPrice(formatRupiah(menu.price));
    setCategory(menu.category);
    setIsAvailable(menu.isAvailable);
    setImageFile(null);
    setImagePreview(menu.image || "");
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const rawPrice = Number(price.replace(/\./g, ""));

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", rawPrice);
      formData.append("category", category);
      formData.append("isAvailable", isAvailable);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingId) {
        await API.put(`/menus/${editingId}`, formData);
        toast.success("Menu berhasil diperbarui!");
      } else {
        await API.post("/menus", formData);
        toast.success("Menu baru berhasil ditambahkan!");
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
      formData.append("category", menu.category);
      formData.append("isAvailable", !menu.isAvailable);

      await API.put(`/menus/${menu._id}`, formData);
      toast.success(
        `Status ${menu.name} diubah menjadi ${!menu.isAvailable ? "Tersedia" : "Habis"}`,
      );
      fetchMenus();
    } catch (err) {
      console.error("Gagal memperbarui ketersediaan menu", err);
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
      console.error("Gagal menghapus menu", err);
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
        toast.success(
          `Kategori "${trimmedCategory}" ditambahkan secara lokal!`,
        );
      } else {
        toast.warning("Kategori sudah ada.");
      }
      setNewCategoryName("");
    }
  };

  const promptDeleteCategory = (catToDelete) => {
    if (categories.length <= 1) {
      toast.warning("Minimal harus ada 1 kategori aktif.");
      return;
    }
    setDeleteCategoryTarget(catToDelete);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;

    try {
      await API.delete(`/categories/${deleteCategoryTarget}`);
      toast.info(`Kategori "${deleteCategoryTarget}" dihapus.`);
      fetchCategories();
    } catch (err) {
      setCategories(categories.filter((c) => c !== deleteCategoryTarget));
      toast.info(`Kategori "${deleteCategoryTarget}" dihapus secara lokal.`);
    } finally {
      setDeleteCategoryTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-20">
      <div className="relative bg-neutral-900 text-white py-10 px-6 md:px-12 overflow-hidden mb-8 shadow-md">
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
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Manajemen Menu & Kategori
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-lg leading-relaxed">
              Atur seluruh ketersediaan produk, harga, foto, dan kelompok
              kategori menu restoran secara instan.
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
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200/80 gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
              Daftar Katalog Produk
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola produk, harga, ketersediaan, dan kategori menu dengan
              mudah.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Folder className="w-4 h-4 text-neutral-500" />
              <span>Kelola Kategori</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Baru</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-500 font-medium">
              Memuat daftar menu...
            </p>
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-16 bg-white border border-neutral-200/80 rounded-3xl shadow-2xs space-y-3">
            <p className="text-sm font-bold text-neutral-700">
              Belum ada menu tersedia.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="text-xs bg-neutral-900 text-white px-4 py-2 rounded-xl hover:bg-neutral-800 transition cursor-pointer font-semibold"
            >
              Buat Menu Pertama Anda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {menus.map((menu) => (
              <div
                key={menu._id}
                className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition group"
              >
                <div>
                  <div className="relative h-36 w-full bg-neutral-100 overflow-hidden">
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

                    <div className="absolute top-2.5 right-2.5">
                      <button
                        onClick={() => handleToggleAvailability(menu)}
                        title="Klik untuk ubah ketersediaan"
                        className={`px-3 py-1 text-[10px] rounded-full font-extrabold shadow-2xs backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 ${
                          menu.isAvailable
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-neutral-100 text-neutral-500 border border-neutral-200 hover:bg-neutral-200"
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
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      {menu.category}
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 line-clamp-1">
                      {menu.name}
                    </h3>
                    {menu.description ? (
                      <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                        {menu.description}
                      </p>
                    ) : (
                      <p className="text-[11px] text-neutral-400 italic">
                        Tidak ada deskripsi
                      </p>
                    )}
                    <p className="text-emerald-600 font-mono font-black text-sm pt-1">
                      Rp {menu.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-neutral-100 flex justify-end gap-2 bg-neutral-50/50">
                  <button
                    onClick={() => handleOpenEditModal(menu)}
                    className="bg-white hover:bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition border border-neutral-200/80 shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(menu)}
                    className="bg-white hover:bg-red-50 text-neutral-700 hover:text-red-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition border border-neutral-200/80 hover:border-red-200 shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
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
                  secara permanen dari katalog.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteMenu}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Kelola Kategori Menu
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Tambah atau hapus kelompok kategori produk makanan/minuman.
                  </p>
                </div>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-2 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nama kategori baru..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  Tambah
                </button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Daftar Kategori Aktif ({categories.length})
                </label>
                {categories.map((cat, idx) => {
                  const categoryName =
                    typeof cat === "object" && cat !== null
                      ? cat.name || cat.categoryName
                      : cat;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl text-xs font-bold text-neutral-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                        <span>{categoryName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => promptDeleteCategory(categoryName)}
                        className="text-neutral-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-lg space-y-6 my-8 shadow-xl">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {editingId ? "Edit Menu" : "Tambah Menu Baru"}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Lengkapi informasi detail produk di bawah ini.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-2 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
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
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                    <div className="flex-1">
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full text-xs text-neutral-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 file:cursor-pointer cursor-pointer"
                      />
                      <p className="text-[10px] text-neutral-400 mt-1">
                        Format: JPG, PNG, atau WEBP (Maks. 2MB).
                      </p>
                    </div>
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
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 transition font-medium"
                    placeholder="Contoh: Ayam Goreng Madura"
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
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 transition resize-none font-medium"
                    placeholder="Contoh: Ayam goreng dengan bumbu Madura yang gurih..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Harga (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-neutral-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={price}
                        onChange={handlePriceChange}
                        required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 transition font-medium font-mono"
                        placeholder="25.000"
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
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 transition font-medium cursor-pointer"
                    >
                      {categories.map((cat, idx) => (
                        <option key={idx} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200/80">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded bg-white border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="isAvailable"
                    className="text-xs text-neutral-700 font-semibold cursor-pointer select-none"
                  >
                    Menu Tersedia (Ready to Order)
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
                  </span>{" "}
                  dari daftar pilihan menu.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteCategoryTarget(null)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCategory}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
