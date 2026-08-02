import React, { useState, useEffect } from "react";
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
  Sparkles,
  DollarSign,
  Calendar,
  CheckCircle2,
  FileText,
  Award,
  Clock,
  Eye,
  Download,
  CalendarCheck,
} from "lucide-react";
import API from "../../services/api";
import { gooeyToast } from "goey-toast";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("direktori"); // "direktori", "absensi", "gaji", "shift"

  // State Modal Akun (Tambah / Edit)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State Akun & Profil Pegawai
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "cashier",
    phone: "",
    position: "Kasir",
    baseSalary: "",
    shift: "Pagi (08:00 - 16:00)",
    photoFile: null,
    photoPreview: "",
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
    overtimeHours: 0,
    overtimePayRate: 25000, // Tarif lembur per jam default
  });

  // Modal State Riwayat Slip Gaji Staff
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStaff, setHistoryStaff] = useState(null);

  // Modal State Riwayat Absensi Bulanan
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceStaff, setAttendanceStaff] = useState(null);
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

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
      phone: "",
      position: "Kasir",
      baseSalary: "",
      shift: "Pagi (08:00 - 16:00)",
      photoFile: null,
      photoPreview: "",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setIsEditing(true);
    setCurrentId(staff._id);

    let formattedSalary = "";
    if (staff.baseSalary) {
      formattedSalary = `Rp ${new Intl.NumberFormat("id-ID").format(
        staff.baseSalary,
      )}`;
    }

    setFormData({
      name: staff.name || "",
      username: staff.username || "",
      password: "",
      role: staff.role || "cashier",
      phone: staff.phone || "",
      position: staff.position || "Kasir",
      baseSalary: formattedSalary,
      shift: staff.shift || "Pagi (08:00 - 16:00)",
      photoFile: null,
      photoPreview: staff.photo || "",
    });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        photoFile: file,
        photoPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("username", formData.username);
      data.append("role", formData.role);
      data.append("phone", formData.phone);
      data.append("position", formData.position);
      data.append("shift", formData.shift);

      const rawSalary = formData.baseSalary
        ? formData.baseSalary.replace(/[^0-9]/g, "")
        : "0";
      data.append("baseSalary", Number(rawSalary) || 0);

      if (formData.password) {
        data.append("password", formData.password);
      }
      if (formData.photoFile) {
        data.append("photo", formData.photoFile);
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (isEditing) {
        await API.put(`/auth/users/${currentId}`, data, config);
        gooeyToast.success("Data staff & foto berhasil diperbarui!");
      } else {
        await API.post("/auth/users", data, config);
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
      const now = new Date();
      const timeStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      // Simulasi jam check-out otomatis 9 jam kemudian untuk uji coba lembur
      const checkoutTime = "17:00";

      await API.post(`/auth/users/${id}/attendance`, {
        status,
        checkIn: timeStr,
        checkOut: checkoutTime,
      });
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
      const calculatedOvertimeBonus =
        (Number(payrollData.overtimeHours) || 0) *
        (Number(payrollData.overtimePayRate) || 0);
      const totalBonusFinal =
        (Number(payrollData.bonus) || 0) + calculatedOvertimeBonus;

      await API.post(`/auth/users/${activeStaff._id}/payroll`, {
        month: payrollData.month,
        baseSalary: activeStaff.baseSalary || 0,
        bonus: totalBonusFinal,
        deduction: Number(payrollData.deduction) || 0,
      });
      gooeyToast.success(`Penggajian ${activeStaff.name} berhasil dicatat!`);
      setShowPayrollModal(false);
      setActiveStaff(null);
      setPayrollData({
        month: new Date().toISOString().slice(0, 7),
        bonus: "",
        deduction: "",
        overtimeHours: 0,
        overtimePayRate: 25000,
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

  const handleSalaryInput = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (rawValue === "") {
      setFormData({ ...formData, baseSalary: "" });
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(Number(rawValue));
    setFormData({ ...formData, baseSalary: `Rp ${formatted}` });
  };

  const exportAttendanceReport = (staff) => {
    const rows = [
      ["Laporan Absensi Karyawan"],
      ["Nama", staff.name],
      ["Username", staff.username],
      ["Posisi", staff.position || "-"],
      [],
      ["Tanggal", "Jam Masuk", "Jam Keluar", "Status"],
    ];

    (staff.attendance || []).forEach((att) => {
      rows.push([
        att.date?.slice(0, 10) || "-",
        att.checkIn || "-",
        att.checkOut || "-",
        att.status || "-",
      ]);
    });

    let csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Absensi_${staff.name}_${selectedAttendanceMonth}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    gooeyToast.success("Laporan absensi berhasil diunduh.");
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.position?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalStaffCount = staffList.length;
  const totalMonthlyPayroll = staffList.reduce(
    (acc, curr) => acc + (curr.baseSalary || 0),
    0,
  );
  const totalHadirToday = staffList.filter(
    (s) => s.attendance?.[s.attendance.length - 1]?.status === "Hadir",
  ).length;

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto font-sans antialiased text-neutral-900">
      {/* HERO BANNER HIGH-LEVEL */}
      <div className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-neutral-950 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-2xl overflow-hidden border border-indigo-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-amber-500/20 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-[11px] font-black text-amber-400 tracking-wider shadow-inner">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>SWIFT ORDERING ENTERPRISE CORE</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
              Manajemen Tim & Penggajian
            </h1>
            <p className="text-xs lg:text-sm text-indigo-200/80 font-medium max-w-2xl leading-relaxed">
              Pusat kendali operasional SDM restoran. Kelola hak akses akun,
              kustomisasi posisi kerja, penjadwalan shift, pencatatan absensi,
              hingga audit rekapitulasi gaji bulanan.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-2xl text-xs font-black shadow-xl shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Staff Baru</span>
          </button>
        </div>

        {/* STATISTIK OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-200/60">
                Total Pegawai Aktif
              </p>
              <p className="text-xl font-black text-white">
                {totalStaffCount} Orang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-200/60">
                Estimasi Gaji Pokok/Bulan
              </p>
              <p className="text-lg font-black text-emerald-400">
                {formatRupiah(totalMonthlyPayroll)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-200/60">
                Hadir Hari Ini
              </p>
              <p className="text-xl font-black text-white">
                {totalHadirToday} Terkonfirmasi
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGASI TAB & PENCARIAN */}
      <div className="bg-white border border-neutral-200/80 rounded-[2rem] shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setSelectedTab("direktori")}
              className={`px-4 py-3 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                selectedTab === "direktori"
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Direktori & Akun ({staffList.length})
            </button>
            <button
              onClick={() => setSelectedTab("absensi")}
              className={`px-4 py-3 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                selectedTab === "absensi"
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Absensi Kehadiran
            </button>
            <button
              onClick={() => setSelectedTab("shift")}
              className={`px-4 py-3 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                selectedTab === "shift"
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Jadwal Shift Kerja
            </button>
            <button
              onClick={() => setSelectedTab("gaji")}
              className={`px-4 py-3 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${
                selectedTab === "gaji"
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Penggajian (Payroll)
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nama, posisi, atau role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950 focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        {/* TAB 1: DIREKTORI & AKUN */}
        {selectedTab === "direktori" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                  <th className="py-4 px-4">Pegawai & Akun</th>
                  <th className="py-4 px-4">Posisi & Hak Akses</th>
                  <th className="py-4 px-4">Shift Aktif</th>
                  <th className="py-4 px-4">Gaji Pokok</th>
                  <th className="py-4 px-4 text-center">Aksi Kontrol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-16 text-neutral-400 font-bold animate-pulse"
                    >
                      Memuat direktori staff restoran...
                    </td>
                  </tr>
                ) : filteredStaff.length > 0 ? (
                  filteredStaff.map((staff) => (
                    <tr
                      key={staff._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-4 px-4 flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-amber-400 font-black overflow-hidden flex items-center justify-center shrink-0 border border-neutral-200 shadow-md group-hover:scale-105 transition-transform">
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
                          <p className="font-extrabold text-neutral-900 text-sm">
                            {staff.name}
                          </p>
                          <p className="text-[11px] text-neutral-400 font-mono font-medium">
                            @{staff.username} • {staff.phone || "No telp -"}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 space-y-1.5">
                        <div className="font-bold text-neutral-700 text-xs inline-flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1 rounded-lg">
                          <Award className="w-3.5 h-3.5 text-indigo-600" />
                          {staff.position || "Kasir"}
                        </div>
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              staff.role === "owner"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : staff.role === "kitchen"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            <Shield className="w-2.5 h-2.5" />
                            {staff.role}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 font-bold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {staff.shift || "Pagi (08:00 - 16:00)"}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-emerald-600 text-sm">
                        {formatRupiah(staff.baseSalary)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setHistoryStaff(staff);
                              setShowHistoryModal(true);
                            }}
                            className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all shadow-sm cursor-pointer"
                            title="Lihat Riwayat & Slip Gaji"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all shadow-sm cursor-pointer"
                            title="Edit / Reset Password"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(staff)}
                            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all shadow-sm cursor-pointer"
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
                      colSpan="5"
                      className="text-center py-16 text-neutral-400 font-bold"
                    >
                      Tidak ada staff yang ditemukan dalam pencarian.
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
              Catat kehadiran harian staf atau lihat rekapitulasi absensi
              bulanan secara lengkap.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                    <th className="py-4 px-4">Pegawai</th>
                    <th className="py-4 px-4">Role / Posisi</th>
                    <th className="py-4 px-4">Status Kehadiran Hari Ini</th>
                    <th className="py-4 px-4 text-center">Aksi Presensi</th>
                    <th className="py-4 px-4 text-center">Rekap Bulanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
                  {filteredStaff.map((staff) => {
                    const lastAtt =
                      staff.attendance?.[staff.attendance.length - 1];
                    return (
                      <tr
                        key={staff._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-4 px-4 flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
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
                          <div>
                            <span className="font-extrabold text-neutral-900 text-sm">
                              {staff.name}
                            </span>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              @{staff.username}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-neutral-600 uppercase text-[10px] font-black">
                          {staff.role} ({staff.position || "Kasir"})
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              lastAtt?.status === "Hadir"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : lastAtt?.status === "Izin"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : lastAtt?.status === "Sakit"
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {lastAtt?.status || "Belum Absen"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() =>
                                handleAttendance(staff._id, "Hadir")
                              }
                              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black transition-all shadow-sm cursor-pointer active:scale-95"
                            >
                              Hadir
                            </button>
                            <button
                              onClick={() =>
                                handleAttendance(staff._id, "Izin")
                              }
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black transition-all shadow-sm cursor-pointer active:scale-95"
                            >
                              Izin
                            </button>
                            <button
                              onClick={() =>
                                handleAttendance(staff._id, "Sakit")
                              }
                              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black transition-all shadow-sm cursor-pointer active:scale-95"
                            >
                              Sakit
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => {
                              setAttendanceStaff(staff);
                              setShowAttendanceModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-black transition shadow-sm cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Lihat Bulan Ini
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

        {/* TAB 3: JADWAL SHIFT KERJA */}
        {selectedTab === "shift" && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500 font-medium">
              Pengaturan shift kerja dan pembagian waktu operasional staf
              restoran.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-50 border border-neutral-200/80 p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                    Shift Pagi
                  </span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="text-sm font-extrabold text-neutral-900">
                  08:00 - 16:00 WIB
                </h4>
                <p className="text-xs text-neutral-500">
                  Shift operasional pembukaan restoran dan pelayanan awal.
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200/80 p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                    Shift Siang
                  </span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 className="text-sm font-extrabold text-neutral-900">
                  14:00 - 22:00 WIB
                </h4>
                <p className="text-xs text-neutral-500">
                  Shift pelayanan jam puncak makan siang hingga malam.
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200/80 p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                    Shift Malam
                  </span>
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="text-sm font-extrabold text-neutral-900">
                  16:00 - 00:00 WIB
                </h4>
                <p className="text-xs text-neutral-500">
                  Shift penutupan restoran, audit kasir, dan kebersihan akhir.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto pt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                    <th className="py-4 px-4">Pegawai</th>
                    <th className="py-4 px-4">Posisi</th>
                    <th className="py-4 px-4">Shift Terkini</th>
                    <th className="py-4 px-4 text-center">
                      Aksi Cepat Atur Shift
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
                  {filteredStaff.map((staff) => (
                    <tr
                      key={staff._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-100 border overflow-hidden flex items-center justify-center font-bold">
                          {staff.photo ? (
                            <img
                              src={staff.photo}
                              alt={staff.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            staff.name?.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900">
                            {staff.name}
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            @{staff.username}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-neutral-600">
                        {staff.position || "Kasir"}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                          {staff.shift || "Pagi (08:00 - 16:00)"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditModal(staff)}
                          className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black transition cursor-pointer"
                        >
                          Ubah Shift
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PENGGAJIAN (PAYROLL) */}
        {selectedTab === "gaji" && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500 font-medium">
              Proses slip gaji bulanan, perhitungan bonus lembur otomatis, dan
              potongan kasbon pegawai secara akurat.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                    <th className="py-4 px-4">Pegawai</th>
                    <th className="py-4 px-4">Gaji Pokok</th>
                    <th className="py-4 px-4">Riwayat Penggajian Terakhir</th>
                    <th className="py-4 px-4 text-center">
                      Proses Gaji & Lembur
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-800">
                  {filteredStaff.map((staff) => {
                    const lastPayroll =
                      staff.payrollHistory?.[staff.payrollHistory.length - 1];
                    return (
                      <tr
                        key={staff._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-4 px-4 flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
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
                          <div>
                            <span className="font-extrabold text-neutral-900 text-sm">
                              {staff.name}
                            </span>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              @{staff.username}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-black text-emerald-600 text-sm">
                          {formatRupiah(staff.baseSalary)}
                        </td>
                        <td className="py-4 px-4 text-neutral-500 font-medium">
                          {lastPayroll ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200/60 font-bold">
                              {lastPayroll.month}:{" "}
                              {formatRupiah(lastPayroll.totalPaid)}
                            </span>
                          ) : (
                            <span className="text-neutral-400 italic">
                              Belum ada riwayat gaji
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => {
                              setActiveStaff(staff);
                              setShowPayrollModal(true);
                            }}
                            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black transition-all shadow-md cursor-pointer active:scale-95"
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

      {/* MODAL TAMBAH / EDIT STAFF DENGAN UPLOAD FOTO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-neutral-200 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-lg space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
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
              {/* UPLOAD & PREVIEW FOTO */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-24 h-24 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 overflow-hidden flex items-center justify-center relative shadow-inner">
                  {formData.photoPreview ? (
                    <img
                      src={formData.photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-neutral-400" />
                  )}
                </div>
                <label className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm inline-flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5" /> Pilih Foto Perangkat
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

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
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950"
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
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950"
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
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950"
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
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950 cursor-pointer"
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
                    Posisi Kerja
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    placeholder="Contoh: Kepala Kasir / Chef"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950"
                  />
                </div>
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
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    Gaji Pokok (Rupiah)
                  </label>
                  <input
                    type="text"
                    value={formData.baseSalary}
                    onChange={handleSalaryInput}
                    placeholder="Rp 3.000.000"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    Jadwal Shift Kerja
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) =>
                      setFormData({ ...formData, shift: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950 cursor-pointer"
                  >
                    <option value="Pagi (08:00 - 16:00)">
                      Pagi (08:00 - 16:00)
                    </option>
                    <option value="Siang (14:00 - 22:00)">
                      Siang (14:00 - 22:00)
                    </option>
                    <option value="Malam (16:00 - 00:00)">
                      Malam (16:00 - 00:00)
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  {isEditing ? "Simpan Perubahan" : "Tambah Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REKAP ABSENSI BULANAN DENGAN EKSPOR */}
      {showAttendanceModal && attendanceStaff && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-neutral-200 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-lg space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 overflow-hidden flex items-center justify-center">
                  {attendanceStaff.photo ? (
                    <img
                      src={attendanceStaff.photo}
                      alt={attendanceStaff.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-indigo-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">
                    {attendanceStaff.name}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    Rekapitulasi Absensi Bulanan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="w-9 h-9 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    Pilih Bulan Rekap
                  </label>
                  <input
                    type="month"
                    value={selectedAttendanceMonth}
                    onChange={(e) => setSelectedAttendanceMonth(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950 transition"
                  />
                </div>
                <div className="pt-5">
                  <button
                    type="button"
                    onClick={() => exportAttendanceReport(attendanceStaff)}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition inline-flex items-center gap-2 shadow-sm cursor-pointer"
                    title="Ekspor ke CSV / Excel"
                  >
                    <Download className="w-4 h-4" /> Ekspor
                  </button>
                </div>
              </div>

              {(() => {
                const filteredAttendance = (
                  attendanceStaff.attendance || []
                ).filter((item) => {
                  if (!item.date) return false;
                  return item.date.startsWith(selectedAttendanceMonth);
                });

                const totalHadir = filteredAttendance.filter(
                  (i) => i.status === "Hadir",
                ).length;
                const totalIzin = filteredAttendance.filter(
                  (i) => i.status === "Izin",
                ).length;
                const totalSakit = filteredAttendance.filter(
                  (i) => i.status === "Sakit",
                ).length;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-2xl text-center">
                        <p className="text-[10px] font-black uppercase text-emerald-600">
                          Hadir
                        </p>
                        <p className="text-lg font-black text-emerald-700">
                          {totalHadir} Hari
                        </p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl text-center">
                        <p className="text-[10px] font-black uppercase text-amber-600">
                          Izin
                        </p>
                        <p className="text-lg font-black text-amber-700">
                          {totalIzin} Hari
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200/80 p-3.5 rounded-2xl text-center">
                        <p className="text-[10px] font-black uppercase text-blue-600">
                          Sakit
                        </p>
                        <p className="text-lg font-black text-blue-700">
                          {totalSakit} Hari
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {filteredAttendance.length > 0 ? (
                        filteredAttendance.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-neutral-50 px-4 py-3 rounded-2xl border border-neutral-200/60 text-xs font-semibold"
                          >
                            <span className="text-neutral-700">
                              {new Date(att.date).toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-neutral-400 font-mono">
                                In: {att.checkIn || "-"} | Out:{" "}
                                {att.checkOut || "-"}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  att.status === "Hadir"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : att.status === "Izin"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {att.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-neutral-400 font-medium text-xs">
                          Tidak ada catatan absensi pada bulan{" "}
                          {selectedAttendanceMonth}.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <button
              onClick={() => setShowAttendanceModal(false)}
              className="w-full bg-slate-950 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT SLIP GAJI */}
      {showHistoryModal && historyStaff && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-neutral-200 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-lg space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 overflow-hidden flex items-center justify-center">
                  {historyStaff.photo ? (
                    <img
                      src={historyStaff.photo}
                      alt={historyStaff.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-indigo-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">
                    {historyStaff.name}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    Riwayat Slip Gaji Bulanan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-9 h-9 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {historyStaff.payrollHistory &&
              historyStaff.payrollHistory.length > 0 ? (
                historyStaff.payrollHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        Periode: {item.month}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
                        {item.status || "Lunas"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold pt-1">
                      <div>
                        <p className="text-[10px] text-neutral-400">
                          Gaji Pokok
                        </p>
                        <p className="text-neutral-700">
                          {formatRupiah(item.baseSalary)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400">Bonus</p>
                        <p className="text-emerald-600">
                          +{formatRupiah(item.bonus)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400">Potongan</p>
                        <p className="text-red-500">
                          -{formatRupiah(item.deduction)}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500">
                        Total Diterima:
                      </span>
                      <span className="text-sm font-black text-emerald-600">
                        {formatRupiah(item.totalPaid)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-neutral-400 font-medium text-xs">
                  Belum ada riwayat penggajian untuk pegawai ini.
                </div>
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full bg-slate-950 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-[2.5rem] p-6 w-full max-w-sm space-y-5 shadow-2xl text-center animate-fadeIn">
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

      {/* MODAL PROSES GAJI (PAYROLL) DENGAN LEMBUR OTOMATIS */}
      {showPayrollModal && activeStaff && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-neutral-200 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-md space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-neutral-900">
                  Bayar Gaji: {activeStaff.name}
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  Kalkulasi gaji pokok, lembur otomatis, dan potongan kasbon.
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
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-slate-950 transition"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    Jam Lembur
                  </label>
                  <input
                    type="number"
                    value={payrollData.overtimeHours}
                    onChange={(e) =>
                      setPayrollData({
                        ...payrollData,
                        overtimeHours: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                    Tarif / Jam (Rp)
                  </label>
                  <input
                    type="number"
                    value={payrollData.overtimePayRate}
                    onChange={(e) =>
                      setPayrollData({
                        ...payrollData,
                        overtimePayRate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-1.5">
                  Bonus Tambahan Lainnya (Opsional)
                </label>
                <input
                  type="number"
                  value={payrollData.bonus}
                  onChange={(e) =>
                    setPayrollData({ ...payrollData, bonus: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-slate-950 transition"
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
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-black text-neutral-900 focus:outline-none focus:border-slate-950 transition"
                />
              </div>

              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Total Bersih yang Dibayarkan (Termasuk Lembur)
                </span>
                <h4 className="text-lg font-black text-emerald-600">
                  {formatRupiah(
                    (activeStaff.baseSalary || 0) +
                      Number(payrollData.overtimeHours || 0) *
                        Number(payrollData.overtimePayRate || 0) +
                      (Number(payrollData.bonus) || 0) -
                      (Number(payrollData.deduction) || 0),
                  )}
                </h4>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer"
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
