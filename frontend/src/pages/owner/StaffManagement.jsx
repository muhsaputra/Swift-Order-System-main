import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  AlertTriangle,
  Search,
  Lock,
  User,
} from "lucide-react";
import API from "../../services/api";
import { gooeyToast } from "goey-toast";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State Modal (Tambah / Edit)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "cashier", // default cashier
  });

  // State Modal Hapus
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await API.get("/auth/users");
      setStaffList(response.data || []);
    } catch (err) {
      console.error("Gagal mengambil data staff:", err);
      gooeyToast.error("Gagal memuat daftar staff restoran.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormData({ name: "", username: "", password: "", role: "cashier" });
    setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setIsEditing(true);
    setCurrentId(staff._id);
    setFormData({
      name: staff.name || "",
      username: staff.username || "",
      password: "", // Kosongkan password saat edit, isi jika ingin mereset
      role: staff.role || "cashier",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await API.put(`/auth/users/${currentId}`, formData);
        gooeyToast.success("Data staff berhasil diperbarui!");
      } else {
        await API.post("/auth/users", formData);
        gooeyToast.success("Staff baru berhasil ditambahkan!");
      }
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Terjadi kesalahan sistem.";
      gooeyToast.error(errorMsg);
    }
  };

  const confirmDelete = (staff) => {
    setDeleteTarget(staff);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/auth/users/${deleteTarget._id}`);
      gooeyToast.success("Staff berhasil dihapus.");
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStaff();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Gagal menghapus staff.";
      gooeyToast.error(errorMsg);
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[11px] font-black text-amber-600 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Kontrol Akses Karyawan</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900">
            Manajemen Staff & Akun
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            Tambah, atur peran (role), reset kata sandi, atau hapus akun kasir
            dan dapur.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-black shadow-md transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Staff Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-neutral-200/80 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
        <Search className="w-4 h-4 text-neutral-400 ml-2" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama, username, atau role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none font-semibold"
        />
      </div>

      {/* Tabel Daftar Staff */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                <th className="py-4 px-6">Nama & Username</th>
                <th className="py-4 px-6">Peran (Role)</th>
                <th className="py-4 px-6">Tanggal Bergabung</th>
                <th className="py-4 px-6 text-center">Aksi Kontrol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-10 text-neutral-400 font-bold"
                  >
                    Memuat data staff restoran...
                  </td>
                </tr>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <tr
                    key={staff._id}
                    className="hover:bg-neutral-50/60 transition"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-amber-400 font-black flex items-center justify-center shrink-0">
                          {staff.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-neutral-900">
                            {staff.name}
                          </p>
                          <p className="text-[11px] text-neutral-400 font-mono">
                            @{staff.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          staff.role === "owner"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : staff.role === "kitchen"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-neutral-500">
                      {staff.createdAt
                        ? new Date(staff.createdAt).toLocaleDateString(
                            "id-ID",
                            { dateStyle: "medium" },
                          )
                        : "-"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(staff)}
                          className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition cursor-pointer"
                          title="Edit / Reset Password"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(staff)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-10 text-neutral-400 font-bold"
                  >
                    Tidak ada staff yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT STAFF */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 lg:p-8 w-full max-w-md space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-neutral-900">
                  {isEditing ? "Edit Data Staff" : "Tambah Staff Baru"}
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  {isEditing
                    ? "Perbarui informasi atau reset sandi akun."
                    : "Daftarkan akun baru untuk kasir atau dapur."}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Username Masuk
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Contoh: kasir_budi"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  {isEditing ? "Kata Sandi Baru (Opsional)" : "Kata Sandi"}
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={
                    isEditing ? "Kosongkan jika tidak diubah" : "••••••••"
                  }
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Peran Akses (Role)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
                >
                  <option value="cashier">Cashier (Kasir)</option>
                  <option value="kitchen">Kitchen (Dapur / KDS)</option>
                  <option value="owner">Owner (Pemilik Restoran)</option>
                </select>
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
                  {isEditing ? "Simpan Perubahan" : "Tambah Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center animate-fadeIn">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                Hapus Akun Staff Ini?
              </h3>
              <p className="text-xs text-neutral-500">
                Pengguna{" "}
                <span className="font-bold text-neutral-800">
                  @{deleteTarget?.username}
                </span>{" "}
                tidak akan dapat lagi masuk ke dalam sistem.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
