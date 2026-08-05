import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { gooeyToast } from "goey-toast";
import {
  User,
  Lock,
  Save,
  ShieldCheck,
  Sparkles,
  KeyRound,
} from "lucide-react";

export default function AdminProfile() {
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    role: "cashier",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/auth/profile");
      setProfile(res.data);
    } catch (err) {
      console.error("Gagal memuat profil", err);
      gooeyToast.error("Gagal memuat data profil akun.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Validasi jika password baru diisi, pastikan konfirmasinya cocok
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        gooeyToast.error("Konfirmasi kata sandi baru tidak cocok.");
        return;
      }
    }

    setUpdating(true);
    try {
      const payload = {
        name: profile.name,
        username: profile.username,
      };

      // Hanya masukkan key password jika user benar-benar mengisinya
      if (newPassword && newPassword.trim() !== "") {
        payload.password = newPassword;
      }

      const res = await API.put("/auth/profile", payload);
      gooeyToast.success(res.data.message || "Profil berhasil diperbarui!");

      // Kosongkan input password setelah sukses
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Gagal memperbarui profil", err);
      gooeyToast.error(
        err.response?.data?.error || "Gagal memperbarui profil.",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[60vh] bg-sky-50/40">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 animate-fadeIn font-sans antialiased text-slate-900 bg-sky-50/40 min-h-screen">
      {/* BANNER HEADER - Disesuaikan persis dengan gaya visual biru terang */}
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-900 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-xl overflow-hidden border border-blue-600/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1.5 rounded-full text-[11px] font-black text-sky-100 tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-sky-200" />
            <span>Pengaturan Akun Personal</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
            Profil & Keamanan
          </h1>
          <p className="text-xs lg:text-sm text-sky-100 font-medium max-w-md leading-relaxed">
            Kelola informasi identitas akun kasir/admin Anda serta perbarui kata
            sandi untuk menjaga keamanan sistem POS.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-xl shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-white text-blue-900 border border-white/30 flex items-center justify-center font-black shadow-sm">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] text-sky-200 uppercase tracking-wider font-bold">
              Hak Akses
            </p>
            <p className="text-xs font-black text-white capitalize">
              {profile.role || "Cashier"}
            </p>
          </div>
        </div>
      </div>

      {/* FORM KONTEN UTAMA */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs">
        <form onSubmit={handleUpdateProfile} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-bold text-slate-700 mb-2">
                Nama Lengkap / Nama Kasir
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <User className="w-4 h-4 text-blue-600" />
                </span>
                <input
                  type="text"
                  value={profile.name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">
                Username Akses
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </span>
                <input
                  type="text"
                  value={profile.username || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, username: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  placeholder="Masukkan username"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Pembaruan Kata Sandi
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Kata Sandi Baru (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock className="w-4 h-4 text-blue-600" />
                  </span>
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak diubah"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock className="w-4 h-4 text-blue-600" />
                  </span>
                  <input
                    type="password"
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!newPassword}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition cursor-pointer shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-xs"
            >
              {updating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4 text-sky-200" />
              )}
              <span>
                {updating
                  ? "Menyimpan Perubahan..."
                  : "Simpan Perubahan Profil"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
