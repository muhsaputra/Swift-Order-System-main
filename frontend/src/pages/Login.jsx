import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
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

      toast.success("Berhasil masuk ke Dashboard! Selamat bekerja 👋");
      navigate("/dashboard");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        "Login gagal, periksa kembali username dan password.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-900 px-4 py-12 overflow-hidden font-sans">
      {/* Background Gambar Restoran dengan Efek Parallax & Vignette Halus */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-30 contrast-125 scale-105 pointer-events-none transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />

      {/* Lapisan Gradien Gelap Multi-step dengan Efek Atmosferik */}
      <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950 via-neutral-950/90 to-neutral-900/70 pointer-events-none" />

      {/* Ornamen Cahaya Ambient Estetik di Background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Konten Kotak Login (Card Putih Premium dengan Glassmorphism & Shadow Halus) */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-2xl border border-white/30 p-8 sm:p-10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] transition-all">
        {/* Badge Atas Kecil */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full text-[11px] font-bold text-neutral-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Secure POS Access</span>
          </div>
        </div>

        {/* Logo / Badge Ikon Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center shadow-xl mb-4 transform hover:scale-105 transition-transform duration-300 border border-neutral-800">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">
            Swift Ordering
          </h1>
          <p className="text-xs font-medium text-neutral-500 mt-1 max-w-xs leading-relaxed">
            Masuk ke dasbor kasir untuk mengelola pesanan & operasional
            restoran.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold flex items-center gap-3 shadow-2xs animate-shake">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0"></span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              Username Kasir
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Masukkan username anda"
                className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200/80 rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 transition-all text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-700 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200/80 rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 transition-all text-xs font-semibold pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
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
            className="w-full mt-4 py-4 bg-neutral-900 text-white font-bold rounded-2xl hover:bg-neutral-800 active:scale-[0.99] transition-all text-xs disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            <span>
              {loading ? "Memproses Verifikasi..." : "Masuk ke Dasbor"}
            </span>
            {!loading && (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </form>

        {/* Footer Informasi Sistem & Keamanan */}
        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enskripsi Token Aktif</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono mt-1">
            Swift Ordering System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
