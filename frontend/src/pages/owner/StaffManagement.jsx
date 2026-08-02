import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
  Search,
  User,
  Camera,
  CalendarCheck,
  DollarSign,
  Sparkles,
} from "lucide-react";
import API from "../../services/api";
import { gooeyToast } from "goey-toast";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("direktori"); // "direktori", "absensi", "gaji"

  // State Modal Akun (Tambah / Edit)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State Akun & Profil Pegawai
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "cashier", // cashier, kitchen, owner
    nickname: "",
    phone: "",
    position: "Kasir",
    photo: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    baseSalary: "",
  });

  // State Modal Hapus
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Modal State Penggajian (Payroll)
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [activeStaff, setActiveStaff] = useState(null);
  const [payrollData, setPayrollData] = useState({
    month: new Date().toISOString().slice(0, 7),
    bonus: "",
    deduction: "",
  });

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
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "cashier",
      nickname: "",
      phone: "",
      position: "Kasir",
      photo: "",
      address: "",
      emergencyName: "",
      emergencyPhone: "",
      baseSalary: "",
    });
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
      nickname: staff.nickname || "",
      phone: staff.phone || "",
      position: staff.position || "Kasir",
      photo: staff.photo || "",
      address: staff.address || "",
      emergencyName: staff.emergencyContact?.name || "",
      emergencyPhone: staff.emergencyContact?.phone || "",
      baseSalary: staff.baseSalary || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        username: formData.username,
        role: formData.role,
        nickname: formData.nickname,
        phone: formData.phone,
        position: formData.position,
        photo: formData.photo,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
        },
        baseSalary: Number(formData.baseSalary) || 0,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (isEditing) {
        await API.put(`/auth/users/${currentId}`, payload);
        gooeyToast.success("Data staff & akun berhasil diperbarui!");
      } else {
        await API.post("/auth/users", payload);
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

  const handleAttendance = async (id, status) => {
    try {
      await API.post(`/staff/${id}/attendance`, { status });
      gooeyToast.success(`Absensi "${status}" berhasil dicatat.`);
      fetchStaff();
    } catch (err) {
      gooeyToast.error("Gagal mencatat absensi.");
    }
  };

  const handleProcessPayroll = async (e) => {
    e.preventDefault();
    if (!activeStaff) return;
    try {
      await API.post(`/staff/${activeStaff._id}/payroll`, {
        month: payrollData.month,
        baseSalary: activeStaff.baseSalary || 0,
        bonus: Number(payrollData.bonus) || 0,
        deduction: Number(payrollData.deduction) || 0,
      });
      gooeyToast.success(`Penggajian ${activeStaff.name} berhasil dicatat!`);
      setShowPayrollModal(false);
      setActiveStaff(null);
      setPayrollData({
        month: new Date().toISOString().slice(0, 7),
        bonus: "",
        deduction: "",
      });
      fetchStaff();
    } catch (err) {
      gooeyToast.error("Gagal memproses penggajian.");
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.position?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto font-sans">
      {/* BANNER HEADER */}
      <div className="relative bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 rounded-3xl p-6 lg:p-8 text-white shadow-2xl overflow-hidden border border-neutral-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-[11px] font-black text-amber-400 tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SWIFT ORDERING ENTERPRISE STAFF</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              Manajemen Staff, Akun & Penggajian
            </h1>
            <p className="text-xs text-neutral-400 font-medium max-w-xl">
              Kontrol akses akun login, profil pegawai lengkap dengan foto,
              absensi harian, hingga rekapitulasi penggajian (payroll).
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-2xl text-xs font-black shadow-lg transition cursor-pointer active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Staff Baru</span>
          </button>
        </div>
      </div>

      {/* NAVIGASI TAB & PENCARIAN */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setSelectedTab("direktori")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                selectedTab === "direktori"
                  ? "bg-neutral-900 text-white shadow-md"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Direktori & Akun ({staffList.length})
            </button>
            <button
              onClick={() => setSelectedTab("absensi")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                selectedTab === "absensi"
                  ? "bg-neutral-900 text-white shadow-md"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Absensi Kehadiran
            </button>
            <button
              onClick={() => setSelectedTab("gaji")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                selectedTab === "gaji"
                  ? "bg-neutral-900 text-white shadow-md"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Penggajian (Payroll)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nama, username, atau role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
            />
          </div>
        </div>

        {/* TAB 1: DIREKTORI & AKUN */}
        {selectedTab === "direktori" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Pegawai & Akun</th>
                  <th className="py-3 px-4">Role Akses</th>
                  <th className="py-3 px-4">No. Telepon</th>
                  <th className="py-3 px-4">Gaji Pokok</th>
                  <th className="py-3 px-4">Bergabung</th>
                  <th className="py-3 px-4 text-center">Aksi Kontrol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-12 text-neutral-400 font-bold"
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
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-amber-400 font-black overflow-hidden flex items-center justify-center shrink-0 border border-neutral-200">
                          {staff.photo ? (
                            <img
                              src={staff.photo}
                              alt={staff.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            staff.name?.charAt(0).toUpperCase() || (
                              <User className="w-5 h-5" />
                            )
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-neutral-900">
                            {staff.name}
                          </p>
                          <p className="text-[11px] text-neutral-400 font-mono">
                            @{staff.username}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-neutral-600 font-medium">
                        {staff.phone || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600">
                        {formatRupiah(staff.baseSalary)}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500">
                        {staff.createdAt
                          ? new Date(staff.createdAt).toLocaleDateString(
                              "id-ID",
                              { dateStyle: "medium" },
                            )
                          : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition cursor-pointer shadow-sm"
                            title="Edit / Reset Password"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(staff)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer shadow-sm"
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
                      colSpan="6"
                      className="text-center py-12 text-neutral-400 font-bold"
                    >
                      Tidak ada staff yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: ABSENSI KEHADIRAN */}
        {selectedTab === "absensi" && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500 font-medium">
              Catat kehadiran harian staf untuk kepentingan evaluasi dan rekap
              gaji.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Pegawai</th>
                    <th className="py-3 px-4">Role / Posisi</th>
                    <th className="py-3 px-4">Status Hari Ini</th>
                    <th className="py-3 px-4 text-center">Aksi Presensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
                  {filteredStaff.map((staff) => (
                    <tr
                      key={staff._id}
                      className="hover:bg-neutral-50/60 transition"
                    >
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
                          {staff.photo ? (
                            <img
                              src={staff.photo}
                              alt={staff.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                        <span className="font-extrabold text-neutral-900">
                          {staff.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 uppercase text-[10px] font-black">
                        {staff.role}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                          {staff.attendance?.[staff.attendance.length - 1]
                            ?.status || "Belum Absen"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAttendance(staff._id, "Hadir")}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black transition cursor-pointer"
                        >
                          Hadir
                        </button>
                        <button
                          onClick={() => handleAttendance(staff._id, "Izin")}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black transition cursor-pointer"
                        >
                          Izin
                        </button>
                        <button
                          onClick={() => handleAttendance(staff._id, "Sakit")}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black transition cursor-pointer"
                        >
                          Sakit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PENGGAJIAN (PAYROLL) */}
        {selectedTab === "gaji" && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500 font-medium">
              Proses slip gaji bulanan, bonus kinerja, dan potongan kasbon
              pegawai.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Pegawai</th>
                    <th className="py-3 px-4">Gaji Pokok</th>
                    <th className="py-3 px-4">Riwayat Penggajian Terakhir</th>
                    <th className="py-3 px-4 text-center">Proses Gaji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
                  {filteredStaff.map((staff) => {
                    const lastPayroll =
                      staff.payrollHistory?.[staff.payrollHistory.length - 1];
                    return (
                      <tr
                        key={staff._id}
                        className="hover:bg-neutral-50/60 transition"
                      >
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
                            {staff.photo ? (
                              <img
                                src={staff.photo}
                                alt={staff.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-neutral-400" />
                            )}
                          </div>
                          <span className="font-extrabold text-neutral-900">
                            {staff.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-600">
                          {formatRupiah(staff.baseSalary)}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-500 font-medium">
                          {lastPayroll
                            ? `${lastPayroll.month}: ${formatRupiah(lastPayroll.totalPaid)}`
                            : "Belum ada riwayat"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setActiveStaff(staff);
                              setShowPayrollModal(true);
                            }}
                            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-[11px] font-black transition cursor-pointer shadow-sm"
                          >
                            Bayar Gaji
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT STAFF */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 lg:p-8 w-full max-w-lg space-y-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-neutral-900">
                  {isEditing ? "Edit Data & Akun Staff" : "Tambah Staff Baru"}
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  {isEditing
                    ? "Perbarui informasi profil atau reset sandi akun."
                    : "Daftarkan akun login serta profil lengkap pegawai."}
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
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      isEditing ? "Kosongkan jika tetap" : "••••••••"
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
                    <option value="owner">Owner (Pemilik)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="08123456789"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    Gaji Pokok (Rupiah)
                  </label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) =>
                      setFormData({ ...formData, baseSalary: e.target.value })
                    }
                    placeholder="3000000"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  URL Foto Profil (Opsional)
                </label>
                <div className="relative">
                  <Camera className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="url"
                    value={formData.photo}
                    onChange={(e) =>
                      setFormData({ ...formData, photo: e.target.value })
                    }
                    placeholder="https://example.com/foto.jpg"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
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

      {/* MODAL PROSES GAJI (PAYROLL) */}
      {showPayrollModal && activeStaff && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 lg:p-8 w-full max-w-md space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-neutral-900">
                  Bayar Gaji: {activeStaff.name}
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  Hitung komponen gaji, bonus, dan potongan.
                </p>
              </div>
              <button
                onClick={() => setShowPayrollModal(false)}
                className="w-9 h-9 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessPayroll} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Periode Bulan
                </label>
                <input
                  type="month"
                  required
                  value={payrollData.month}
                  onChange={(e) =>
                    setPayrollData({ ...payrollData, month: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Gaji Pokok
                </label>
                <input
                  type="text"
                  disabled
                  value={formatRupiah(activeStaff.baseSalary)}
                  className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Bonus / Lembur (Opsional)
                </label>
                <input
                  type="number"
                  value={payrollData.bonus}
                  onChange={(e) =>
                    setPayrollData({ ...payrollData, bonus: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Potongan / Kasbon (Opsional)
                </label>
                <input
                  type="number"
                  value={payrollData.deduction}
                  onChange={(e) =>
                    setPayrollData({
                      ...payrollData,
                      deduction: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-neutral-900 transition"
                />
              </div>

              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Total Bersih yang Dibayarkan
                </span>
                <h4 className="text-lg font-black text-emerald-600">
                  {formatRupiah(
                    (activeStaff.baseSalary || 0) +
                      (Number(payrollData.bonus) || 0) -
                      (Number(payrollData.deduction) || 0),
                  )}
                </h4>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  Selesaikan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
