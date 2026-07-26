import React, { useState, useEffect, useRef } from "react";
import API from "../services/api";
import {
  useParams,
  useLocation,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { io } from "socket.io-client";
import {
  Download,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  BellRing,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  CreditCard,
  ChefHat,
  Check,
  Tag,
  Receipt,
  Percent,
} from "lucide-react";
import jsPDF from "jspdf";

export default function ClientWaitingPage() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Inisialisasi awal hanya membaca state sementara untuk rendering pertama (fallback ke processing)
  const [order, setOrder] = useState(() => {
    if (location.state?.order) {
      return location.state.order;
    }
    const saved = localStorage.getItem(`order_${id}`);
    return saved ? JSON.parse(saved) : null;
  });

  const [status, setStatus] = useState(order?.orderStatus || "processing");
  const [isMuted, setIsMuted] = useState(false);
  const [recommendedMenus, setRecommendedMenus] = useState([]);

  const audioRef = useRef(null);

  // Gunakan ref untuk melacak status aktif secara akurat tanpa memicu re-render
  const currentStatusRef = useRef(order?.orderStatus || "processing");

  // Penjagaan agar socket event tidak memicu suara saat proses fetch awal berjalan
  const isDataLoadedRef = useRef(false);

  const playNotificationSound = () => {
    if (audioRef.current && !isMuted) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn("Autoplay dicegah oleh browser:", err);
      });
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (status !== "completed") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [status]);

  // Unlock audio untuk mobile/browser policy
  useEffect(() => {
    const unlockAudio = async () => {
      if (!audioRef.current) return;
      try {
        audioRef.current.volume = 0;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 1;
      } catch (err) {
        console.log("Audio unlock pending");
      }
    };

    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("click", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

  useEffect(() => {
    const verifyAndFetchOrder = async () => {
      try {
        const statusCode = searchParams.get("status_code");

        if (statusCode === "200" || statusCode === "201") {
          await API.patch(`/orders/${id}/pay`).catch(() => {});

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }

        const res = await API.get(`/orders/${id}`);
        const serverStatus = res.data.orderStatus;

        setOrder(res.data);
        setStatus(serverStatus);

        // Sinkronkan ref status dengan data valid dari server database
        currentStatusRef.current = serverStatus;

        localStorage.setItem(`order_${id}`, JSON.stringify(res.data));
      } catch (err) {
        console.error("Gagal memuat detail pesanan", err);
      } finally {
        // Tandai bahwa data dari server sudah sukses ditarik
        isDataLoadedRef.current = true;
      }
    };

    const fetchRecommendations = async () => {
      try {
        const res = await API.get("/menus");
        const available = res.data.filter((m) => m.isAvailable);
        setRecommendedMenus(available.slice(0, 3));
      } catch (err) {
        console.error("Gagal memuat rekomendasi menu", err);
      }
    };

    if (id) {
      verifyAndFetchOrder();
    }
    fetchRecommendations();

    const backendUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : "https://swift-ordering-backend.onrender.com";

    const socket = io(backendUrl);
    socket.emit("join-order", id);

    socket.on("order-updated", (updatedOrder) => {
      if (updatedOrder._id === id || updatedOrder.orderId === id) {
        // Jika data awal belum selesai dimuat, abaikan event socket untuk menghindari false trigger
        if (!isDataLoadedRef.current) return;

        const newStatus = updatedOrder.orderStatus;
        const oldStatus = currentStatusRef.current;

        // Bunyikan bell HANYA jika status sebelumnya BUKAN ready, dan status baru BERUBAH menjadi ready
        if (oldStatus !== "ready" && newStatus === "ready") {
          playNotificationSound();
        }

        // Perbarui ref status terkini
        currentStatusRef.current = newStatus;

        setOrder(updatedOrder);
        setStatus(newStatus);
        localStorage.setItem(`order_${id}`, JSON.stringify(updatedOrder));
      }
    });

    return () => socket.disconnect();
  }, [id, searchParams]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextState = !prev;
      if (nextState && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return nextState;
    });
  };

  const discountAmountVal = Number(
    order?.discountAmount || order?.discount || order?.couponDiscount || 0,
  );
  const couponCodeVal =
    order?.couponCode || order?.coupon || order?.promoCode || "PROMO";

  const handleDownloadPDF = () => {
    if (!order) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 180],
    });

    let y = 10;
    const pageWidth = 80;
    const margin = 6;

    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.text("SWIFT ORDERING", pageWidth / 2, y, { align: "center" });

    y += 5;
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text("Bukti Struk Pembayaran", pageWidth / 2, y, { align: "center" });

    y += 4;
    doc.setLineDash([1, 1], 0);
    doc.line(margin, y, pageWidth - margin, y);

    y += 6;
    doc.setFontSize(8);
    doc.text(`ID: #${order._id.slice(-6).toUpperCase()}`, margin, y);
    y += 4;
    doc.text(`Pelanggan: ${order.customerName}`, margin, y);
    y += 4;
    doc.text(`Meja: #${order.tableNumber}`, margin, y);
    y += 4;
    doc.text(
      `Waktu: ${new Date(order.createdAt).toLocaleString("id-ID")}`,
      margin,
      y,
    );

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    y += 5;
    doc.setFont("courier", "bold");
    doc.text("ITEM", margin, y);
    doc.text("TOTAL", pageWidth - margin, y, { align: "right" });

    y += 3;
    doc.setFont("courier", "normal");

    let calculatedSubtotal = 0;

    order.items?.forEach((item) => {
      const itemName = item.menu?.name || item.name || "Menu Item";
      const itemPrice = item.price || item.menu?.price || 0;
      const totalItemPrice = itemPrice * item.quantity;
      calculatedSubtotal += totalItemPrice;

      y += 4;
      doc.text(doc.splitTextToSize(itemName, 45), margin, y);

      const priceText = `Rp ${totalItemPrice.toLocaleString("id-ID")}`;
      doc.text(priceText, pageWidth - margin, y, { align: "right" });

      y += 4;
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.text(
        `${item.quantity}x @ Rp ${itemPrice.toLocaleString("id-ID")}`,
        margin,
        y,
      );
      doc.setFontSize(8);
      doc.setTextColor(0);
    });

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    y += 5;
    doc.text("Subtotal", margin, y);
    doc.text(
      `Rp ${calculatedSubtotal.toLocaleString("id-ID")}`,
      pageWidth - margin,
      y,
      { align: "right" },
    );

    if (discountAmountVal > 0) {
      y += 4;
      doc.setTextColor(200, 0, 0);
      doc.text(`Kupon (${couponCodeVal})`, margin, y);
      doc.text(
        `- Rp ${discountAmountVal.toLocaleString("id-ID")}`,
        pageWidth - margin,
        y,
        { align: "right" },
      );
      doc.setTextColor(0);
    }

    const serviceFeeAmount =
      Number(order.serviceFee) ||
      Math.round((calculatedSubtotal - discountAmountVal) * 0.05);

    y += 4;
    doc.text("Biaya Layanan (Service 5%)", margin, y);
    doc.text(
      `Rp ${serviceFeeAmount.toLocaleString("id-ID")}`,
      pageWidth - margin,
      y,
      { align: "right" },
    );

    y += 3;
    doc.line(margin, y, pageWidth - margin, y);

    y += 6;
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL PEMBAYARAN", margin, y);
    doc.text(
      `Rp ${order.totalAmount?.toLocaleString("id-ID")}`,
      pageWidth - margin,
      y,
      { align: "right" },
    );

    y += 4;
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("Terima Kasih Atas Kunjungan Anda!", pageWidth / 2, y, {
      align: "center",
    });
    y += 4;
    doc.text("Simpan dokumen ini sebagai bukti pesanan.", pageWidth / 2, y, {
      align: "center",
    });

    doc.save(`Struk-${order._id.slice(-6).toUpperCase()}.pdf`);
  };

  const getStatusContent = () => {
    switch (status) {
      case "processing":
        return {
          icon: <Clock className="w-7 h-7 text-amber-600 animate-spin" />,
          title: "Pesanan Sedang Diproses",
          description:
            "Pembayaran berhasil! Dapur kami sedang menyiapkan pesanan Anda.",
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "ready":
        return {
          icon: <BellRing className="w-7 h-7 text-blue-600 animate-bounce" />,
          title: "Pesanan Siap Disajikan!",
          description:
            "Makanan Anda sudah siap. Silakan ambil di konter atau tunggu diantar ke meja.",
          badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
        };
      case "completed":
        return {
          icon: <CheckCircle2 className="w-7 h-7 text-emerald-600" />,
          title: "Pesanan Selesai",
          description:
            "Terima kasih telah memesan! Selamat menikmati hidangan Anda.",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      default:
        return {
          icon: <Clock className="w-7 h-7 text-neutral-600" />,
          title: "Status Pesanan",
          description: "Memperbarui informasi status pesanan Anda.",
          badgeColor: "bg-neutral-100 text-neutral-800 border-neutral-200",
        };
    }
  };

  const getStepState = (stepIndex) => {
    const statusOrder = { processing: 1, ready: 2, completed: 3 };
    const currentLevel = statusOrder[status] || 1;

    if (stepIndex < currentLevel) return "completed";
    if (stepIndex === currentLevel) return "active";
    return "pending";
  };

  const currentStatusInfo = getStatusContent();

  const subtotalAmount =
    order?.items?.reduce((acc, item) => {
      const p = item.price || item.menu?.price || 0;
      return acc + p * item.quantity;
    }, 0) || 0;

  const calculatedServiceFee =
    Number(order?.serviceFee) ||
    Math.round((subtotalAmount - discountAmountVal) * 0.05);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center p-4 sm:p-6 relative">
      <audio ref={audioRef} preload="auto">
        <source src="/bell.mp3" type="audio/mpeg" />
      </audio>

      {/* Tombol Mute / Unmute Audio Notifikasi */}
      <button
        onClick={toggleMute}
        className="absolute top-6 right-6 px-4 py-2.5 bg-white border border-neutral-200/80 text-xs font-bold text-neutral-700 rounded-2xl hover:bg-neutral-100 transition shadow-2xs flex items-center gap-2 cursor-pointer"
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-red-500" />
        ) : (
          <Volume2 className="w-4 h-4 text-emerald-600" />
        )}
        <span>{isMuted ? "Suara Mati" : "Suara Hidup"}</span>
      </button>

      <div className="bg-white border border-neutral-200/80 p-6 sm:p-8 rounded-3xl max-w-lg w-full text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 bg-neutral-50 text-neutral-900 rounded-2xl flex items-center justify-center mx-auto border border-neutral-200/80 shadow-2xs">
          {currentStatusInfo.icon}
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-neutral-900">
            {currentStatusInfo.title}
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            {currentStatusInfo.description}
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200/80 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-3 text-left">
            Alur Status Pesanan:
          </span>
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-200 z-0"></div>

            <div className="relative z-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs font-bold transition-all ${
                  getStepState(1) === "completed"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : getStepState(1) === "active"
                      ? "bg-amber-500 text-white border-amber-500 shadow-md animate-pulse"
                      : "bg-white text-neutral-400 border-neutral-200"
                }`}
              >
                {getStepState(1) === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
              </div>
              <span className="text-[10px] font-bold text-neutral-700">
                Diproses
              </span>
            </div>

            <div className="relative z-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs font-bold transition-all ${
                  getStepState(2) === "completed"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : getStepState(2) === "active"
                      ? "bg-blue-600 text-white border-blue-600 shadow-md animate-bounce"
                      : "bg-white text-neutral-400 border-neutral-200"
                }`}
              >
                {getStepState(2) === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ChefHat className="w-4 h-4" />
                )}
              </div>
              <span className="text-[10px] font-bold text-neutral-700">
                Siap Saji
              </span>
            </div>

            <div className="relative z-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs font-bold transition-all ${
                  status === "completed"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                    : "bg-white text-neutral-400 border-neutral-200"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-neutral-700">
                Selesai
              </span>
            </div>
          </div>
        </div>

        {order && (
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 text-left space-y-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-neutral-900 border-b border-neutral-200/80 pb-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider">
                Rincian Pembayaran
              </h3>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-neutral-400 font-semibold">Nomor Meja</span>
              <span className="font-extrabold text-neutral-900 bg-white px-2 py-0.5 rounded-lg border border-neutral-200">
                #{order.tableNumber}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400 font-semibold">Pemesan</span>
              <span className="font-bold text-neutral-900">
                {order.customerName}
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-200/80 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Daftar Menu:
              </span>
              {order.items?.map((item, idx) => {
                const itemPrice = item.price || item.menu?.price || 0;
                const itemName = item.menu?.name || item.name || "Menu";

                return (
                  <div
                    key={idx}
                    className="flex justify-between text-xs text-neutral-800 font-medium"
                  >
                    <span>
                      {item.quantity}x {itemName}
                    </span>
                    <span className="font-mono font-semibold">
                      Rp {(itemPrice * item.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2.5 border-t border-neutral-200/80 space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal Menu</span>
                <span className="font-mono font-semibold">
                  Rp {subtotalAmount.toLocaleString("id-ID")}
                </span>
              </div>

              {discountAmountVal > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Potongan Kupon ({couponCodeVal})
                  </span>
                  <span className="font-mono">
                    - Rp {discountAmountVal.toLocaleString("id-ID")}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-neutral-800 font-medium">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-emerald-600" /> Biaya Layanan
                  (Service 5%)
                </span>
                <span className="font-mono font-semibold">
                  Rp {calculatedServiceFee.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200/80 flex justify-between text-xs font-bold text-neutral-900">
              <span className="text-neutral-500 font-bold">
                Total Pembayaran
              </span>
              <span className="font-mono text-emerald-600 font-black text-sm">
                Rp {order.totalAmount?.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        )}

        <div
          className={`border py-3 px-4 rounded-2xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 ${currentStatusInfo.badgeColor}`}
        >
          <span>STATUS:</span>
          <span className="uppercase">{status}</span>
        </div>

        {recommendedMenus.length > 0 && (
          <div className="bg-neutral-50 border border-neutral-200/80 p-4 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Rekomendasi Menu Lainnya
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {recommendedMenus.map((menu) => (
                <div
                  key={menu._id}
                  className="bg-white p-2.5 rounded-xl border border-neutral-200/60 flex flex-col justify-between text-left shadow-2xs"
                >
                  <div className="w-full h-16 rounded-lg bg-neutral-100 overflow-hidden mb-2">
                    {menu.image ? (
                      <img
                        src={menu.image}
                        alt={menu.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-neutral-400">
                        No Foto
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-neutral-900 truncate">
                    {menu.name}
                  </p>
                  <p className="text-[10px] font-mono font-bold text-emerald-600">
                    Rp {menu.price.toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {order && (
            <button
              onClick={handleDownloadPDF}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Struk PDF</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/order?table=${order?.tableNumber || 1}`)}
            className="w-full bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 py-3.5 rounded-2xl text-xs font-bold transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Menu (Tambah Pesanan)</span>
          </button>
        </div>

        {status !== "completed" && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              Jangan tutup halaman ini agar notifikasi suara dan pembaruan
              status real-time tetap berjalan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
