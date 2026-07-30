import React, { useState, useEffect } from "react";
import API from "../services/api";
import { gooeyToast } from "goey-toast";
import { User, Lock, Save, ShieldCheck } from "lucide-react";

export default function AdminProfile() {
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    role: "cashier",
  });
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // Sesuaikan endpoint dengan routing backend Anda (misal: /auth/profile atau /admin/profile)
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
    setUpdating(true);
    try {
      const payload = {
        name: profile.name,
        username: profile.username,
      };
      if (newPassword) {
        payload.password = newPassword;
      }

      const res = await API.put("/auth/profile", payload);
      gooeyToast.success(res.data.message || "Profil berhasil diperbarui!");
      setNewPassword("");
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
      <div className="flex justify-center items-center py-20">
        <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-2xs space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 pb-6 border-b border-neutral-100">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-neutral-900">
            Pengaturan Profil Akun
          </h3>
          <p className="text-xs text-neutral-500">
            Kelola informasi identitas dan keamanan kata sandi akun Anda.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-neutral-700 mb-1">
            Nama Lengkap / Nama Kasir
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 font-medium text-neutral-900 focus:outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-neutral-700 mb-1">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={profile.username || ""}
              onChange={(e) =>
                setProfile({ ...profile, username: e.target.value })
              }
              required
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 font-medium text-neutral-900 focus:outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-neutral-700 mb-1">
            Kata Sandi Baru (Opsional)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              placeholder="Kosongkan jika tidak ingin mengubah sandi"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 font-medium text-neutral-900 focus:outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={updating}
          className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded-2xl font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2 mt-4"
        >
          {updating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>
            {updating ? "Menyimpan Perubahan..." : "Simpan Perubahan Profil"}
          </span>
        </button>
      </form>
    </div>
  );
}
