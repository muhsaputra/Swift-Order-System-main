import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import { QrCode, Clock, ShieldCheck, ArrowRight, Wallet } from "lucide-react";
import { gooeyToast } from "goey-toast";

export default function ClientPaymentPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [timeLeft, setTimeLeft] = useState(900); // 15 menit dalam detik
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!order) {
      API.get(`/orders/${id}`)
        .then((res) => {
          setOrder(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Gagal memuat pesanan:", err);
          setLoading(false);
        });
    }
  }, [id, order]);

  // Timer mundur untuk batas pembayaran (15 Menit)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await API.patch(`/orders/${id}/status`, {
        status: "processing",
        isPaid: true,
      });

      const existingHistory = JSON.parse(
        localStorage.getItem("swift_order_history") || "[]",
      );
      if (!existingHistory.includes(id)) {
        existingHistory.push(id);
        localStorage.setItem(
          "swift_order_history",
          JSON.stringify(existingHistory),
        );
      }

      gooeyToast.success("Pembayaran Berhasil!");
      navigate(`/waiting/${id}`, { state: { order: res.data } });
    } catch (err) {
      console.error("Gagal memproses pembayaran:", err);
      gooeyToast.error("Gagal memproses pembayaran.");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-500 font-semibold">
          Memuat data pembayaran...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
        {/* Header Title */}
        <div className="space-y-1">
          <div className="w-12 h-12 bg-neutral-900 text-white rounded-2xl mx-auto flex items-center justify-center shadow-md mb-4">
            <QrCode className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-neutral-900">
            Selesaikan Pembayaran QRIS
          </h1>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Scan QR Code di bawah menggunakan aplikasi e-wallet atau m-banking
            apa saja.
          </p>
        </div>

        {/* Kotak Timer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex justify-between items-center px-5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Sisa Waktu Bayar</span>
          </div>
          <span className="text-amber-700 font-mono font-black text-base">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Tampilan QR Code Container */}
        <div className="bg-neutral-50 p-6 rounded-3xl inline-block border border-neutral-200/80 shadow-2xs relative group">
          <img
            src={
              order?.qrisData?.qrString ||
              `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SWIFT-PAY-${order?._id}`
            }
            alt="QRIS Code"
            className="w-48 h-48 mx-auto rounded-xl shadow-2xs object-contain bg-white p-2"
          />
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Standardized QRIS Verified</span>
          </div>
        </div>

        {/* Rincian Transaksi */}
        <div className="text-left bg-neutral-50 p-4.5 rounded-2xl border border-neutral-200/80 text-xs space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 font-semibold">Nomor Meja</span>
            <span className="font-extrabold text-neutral-900 bg-white px-2.5 py-1 rounded-xl border border-neutral-200">
              #{order?.tableNumber}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 font-semibold">Atas Nama</span>
            <span className="font-bold text-neutral-900">
              {order?.customerName}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-neutral-200 pt-3 mt-1">
            <span className="text-neutral-500 font-bold">Total Pembayaran</span>
            <span className="font-mono text-emerald-600 font-black text-sm">
              Rp {order?.totalAmount?.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Tombol Simulasi Pembayaran Berhasil */}
        <button
          onClick={handleSimulatePayment}
          disabled={isProcessing}
          className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          <span>
            {isProcessing
              ? "Memproses Verifikasi..."
              : "Simulasikan Bayar Berhasil"}
          </span>
          {!isProcessing && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
