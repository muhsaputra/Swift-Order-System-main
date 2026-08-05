import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { gooeyToast } from "goey-toast";
import API from "../../services/api";
import {
  UtensilsCrossed,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await API.post("/auth/login", { username, password });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      gooeyToast.success("Berhasil masuk ke Dashboard! Selamat bekerja 👋");

      // Redirect dinamis berdasarkan role akun pengguna
      const userRole = response.data.user?.role;
      if (userRole === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        "Login gagal, periksa kembali username dan password.";
      setError(errorMsg);
      gooeyToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-sky-50/40 text-slate-900 px-4 py-12 font-sans antialiased">
      {/* Konten Kotak Login - Disesuaikan persis dengan gaya visual biru terang */}
      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200/80 p-8 sm:p-10 rounded-[2.5rem] shadow-xl transition-all">
        {/* Badge Atas Kecil */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-blue-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Secure POS Access Portal</span>
          </div>
        </div>

        {/* Logo / Badge Ikon Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-4">
            <UtensilsCrossed className="w-7 h-7 text-sky-200" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Swift Ordering
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1.5 max-w-xs leading-relaxed">
            Masuk ke dasbor sistem untuk mengelola pesanan & operasional
            restoran secara real-time.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Username Pengguna
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Masukkan username anda"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-xs font-semibold shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all text-xs font-semibold pr-10 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-900 transition cursor-pointer"
                title={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all text-xs disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
          >
            <span>
              {loading ? "Memproses Verifikasi..." : "Masuk ke Dasbor"}
            </span>
            {!loading && (
              <ArrowRight className="w-4 h-4 text-sky-200 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </form>

        {/* Footer Informasi Sistem & Keamanan */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enskripsi Token Aktif</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Swift Ordering System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
