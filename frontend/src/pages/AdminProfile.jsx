import React, { useState, useEffect } from "react";
import API from "../services/api";
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
      <div className="flex justify-center items-center py-24 min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* BANNER HEADER */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-white/10">
            <Sparkles className="w-3 h-3" />
            <span>Pengaturan Akun Personal</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Profil & Keamanan
          </h1>
          <p className="text-xs text-neutral-300 max-w-md font-medium leading-relaxed">
            Kelola informasi identitas akun kasir/admin Anda serta perbarui kata
            sandi untuk menjaga keamanan sistem POS.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black shadow-inner">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
              Hak Akses
            </p>
            <p className="text-xs font-black text-white capitalize">
              {profile.role || "Cashier"}
            </p>
          </div>
        </div>
      </div>

      {/* FORM KONTEN UTAMA */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-sm">
        <form onSubmit={handleUpdateProfile} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-bold text-neutral-700 mb-2">
                Nama Lengkap / Nama Kasir
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={profile.name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  required
                  className="w-full bg-neutral-50/70 border border-neutral-200 rounded-2xl pl-11 pr-4 py-3 font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-2">
                Username Akses
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={profile.username || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, username: e.target.value })
                  }
                  required
                  className="w-full bg-neutral-50/70 border border-neutral-200 rounded-2xl pl-11 pr-4 py-3 font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                  placeholder="Masukkan username"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-neutral-900" />
              <h3 className="font-extrabold text-neutral-900 text-sm">
                Pembaruan Kata Sandi
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-neutral-700 mb-2">
                  Kata Sandi Baru (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak diubah"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-neutral-50/70 border border-neutral-200 rounded-2xl pl-11 pr-4 py-3 font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-2">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!newPassword}
                    className="w-full bg-neutral-50/70 border border-neutral-200 rounded-2xl pl-11 pr-4 py-3 font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3.5 rounded-2xl font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2 text-xs"
            >
              {updating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
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
