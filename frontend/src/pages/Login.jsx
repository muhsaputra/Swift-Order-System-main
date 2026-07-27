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
  Flame,
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
      {/* Background Gambar Restoran Mewah dengan Efek Parallax & Vignette */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-25 contrast-125 scale-110 pointer-events-none transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />

      {/* Lapisan Gradien Mewah Multi-step dengan Efek Atmosferik Gelap */}
      <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950 via-neutral-950/90 to-neutral-900/60 pointer-events-none backdrop-blur-[2px]" />

      {/* Ornamen Cahaya Ambient Estetik & Glow Mewah di Background */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Konten Kotak Login (Card Ultra-Modern dengan Glassmorphism Premium & Border Glow) */}
      <div className="relative z-10 w-full max-w-md bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 sm:p-10 rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] text-white transition-all">
        {/* Badge Atas Kecil */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-[11px] font-bold text-amber-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Secure POS Access Portal</span>
          </div>
        </div>

        {/* Logo / Badge Ikon Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] mb-4 transform hover:scale-110 transition-transform duration-300 border border-amber-300/40">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Swift Ordering
          </h1>
          <p className="text-xs font-medium text-neutral-400 mt-1.5 max-w-xs leading-relaxed">
            Masuk ke dasbor kasir untuk mengelola pesanan & operasional restoran
            secara real-time.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-2xl font-semibold flex items-center gap-3 shadow-lg backdrop-blur-md animate-shake">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-300 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Username Kasir
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Masukkan username anda"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:bg-white/10 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all text-xs font-semibold shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-extrabold text-neutral-300 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:bg-white/10 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all text-xs font-semibold pr-10 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white transition cursor-pointer"
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
            className="w-full mt-4 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-neutral-950 font-black rounded-2xl hover:from-amber-300 hover:to-amber-500 active:scale-[0.99] transition-all text-xs disabled:opacity-50 cursor-pointer shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 group"
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
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enskripsi Token Aktif</span>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono mt-1">
            Swift Ordering System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
