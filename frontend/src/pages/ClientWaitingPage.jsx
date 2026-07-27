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
  Zap,
  Phone,
  Mail,
  User,
} from "lucide-react";
import jsPDF from "jspdf";

export default function ClientWaitingPage() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const currentStatusRef = useRef(order?.orderStatus || "processing");
  const isDataLoadedRef = useRef(false);

  // Fungsi untuk memutar suara dan memicu getar HP
  const playNotificationSound = () => {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch (e) {
        console.warn("Vibration API diblokir browser:", e);
      }
    }

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
          try {
            const patchRes = await API.patch(`/orders/${id}/pay`);
            console.log(
              "Status pembayaran berhasil diperbarui ke server:",
              patchRes.data,
            );
          } catch (patchErr) {
            console.error(
              "DETAIL ERROR PATCH BAYAR:",
              patchErr.response?.data || patchErr.message,
            );
          }

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
        currentStatusRef.current = serverStatus;
        localStorage.setItem(`order_${id}`, JSON.stringify(res.data));
      } catch (err) {
        console.error("Gagal memuat detail pesanan", err);
      } finally {
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
        if (!isDataLoadedRef.current) return;

        const newStatus = updatedOrder.orderStatus;
        const oldStatus = currentStatusRef.current;

        if (oldStatus !== "ready" && newStatus === "ready") {
          playNotificationSound();
        }

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

  const customerPhone =
    order?.customerPhone || order?.phone || order?.whatsapp || "-";
  const customerEmail = order?.customerEmail || order?.email || "-";

  const handleDownloadPDF = () => {
    if (!order) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200],
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
    if (customerPhone !== "-") {
      y += 4;
      doc.text(`Telepon: ${customerPhone}`, margin, y);
    }
    if (customerEmail !== "-") {
      y += 4;
      doc.text(`Email: ${customerEmail}`, margin, y);
    }
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
      let itemAddonTotal = 0;

      if (
        item.selectedBundleChoices &&
        typeof item.selectedBundleChoices === "object"
      ) {
        Object.entries(item.selectedBundleChoices).forEach(
          ([title, addons]) => {
            if (Array.isArray(addons)) {
              addons.forEach((addon) => {
                itemAddonTotal += Number(addon.price || 0);
              });
            }
          },
        );
      }

      const totalItemPrice = (itemPrice + itemAddonTotal) * item.quantity;
      calculatedSubtotal += totalItemPrice;

      y += 4;
      doc.text(doc.splitTextToSize(itemName, 45), margin, y);

      const priceText = `Rp ${totalItemPrice.toLocaleString("id-ID")}`;
      doc.text(priceText, pageWidth - margin, y, { align: "right" });

      if (
        item.selectedBundleChoices &&
        typeof item.selectedBundleChoices === "object"
      ) {
        Object.entries(item.selectedBundleChoices).forEach(
          ([title, addons]) => {
            if (Array.isArray(addons)) {
              addons.forEach((addon) => {
                y += 3;
                doc.setFontSize(7);
                doc.setTextColor(80);
                doc.text(
                  `  + ${addon.name} ${addon.price > 0 ? `(Rp ${addon.price.toLocaleString("id-ID")})` : ""}`,
                  margin,
                  y,
                );
                doc.setFontSize(8);
                doc.setTextColor(0);
              });
            }
          },
        );
      }

      y += 4;
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.text(
        `${item.quantity}x @ Rp ${(itemPrice + itemAddonTotal).toLocaleString("id-ID")}`,
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
      let addonSum = 0;
      if (
        item.selectedBundleChoices &&
        typeof item.selectedBundleChoices === "object"
      ) {
        Object.entries(item.selectedBundleChoices).forEach(
          ([title, addons]) => {
            if (Array.isArray(addons)) {
              addons.forEach((addon) => {
                addonSum += Number(addon.price || 0);
              });
            }
          },
        );
      }
      return acc + (p + addonSum) * item.quantity;
    }, 0) || 0;

  const subtotalOriginalAmount =
    order?.items?.reduce((acc, item) => {
      const origPrice =
        item.menu?.originalPrice ||
        item.originalPrice ||
        item.price ||
        item.menu?.price ||
        0;
      let addonSum = 0;
      if (
        item.selectedBundleChoices &&
        typeof item.selectedBundleChoices === "object"
      ) {
        Object.entries(item.selectedBundleChoices).forEach(
          ([title, addons]) => {
            if (Array.isArray(addons)) {
              addons.forEach((addon) => {
                addonSum += Number(addon.price || 0);
              });
            }
          },
        );
      }
      return acc + (origPrice + addonSum) * item.quantity;
    }, 0) || 0;

  const totalMenuSavings =
    order?.items?.reduce((sum, item) => {
      const orig = item.menu?.originalPrice || item.originalPrice || 0;
      const base = item.menu?.price || item.price || 0;
      if (orig > base) {
        return sum + (orig - base) * item.quantity;
      }
      return sum;
    }, 0) || 0;

  const calculatedServiceFee =
    Number(order?.serviceFee) ||
    Math.round((subtotalAmount - discountAmountVal) * 0.05);

  const originalServiceFee = Math.round(
    (subtotalOriginalAmount - totalMenuSavings - discountAmountVal) * 0.05,
  );
  const originalTotalBeforeDiscount =
    subtotalOriginalAmount + originalServiceFee;

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
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 text-left space-y-4 shadow-2xs">
            {/* Header Rincian */}
            <div className="flex items-center gap-2 text-neutral-900 border-b border-neutral-200/80 pb-3">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Rincian Pembayaran
                </h3>
                <p className="text-[10px] text-neutral-400 font-medium">
                  Detail transaksi pesanan Anda
                </p>
              </div>
            </div>

            {/* Informasi Pelanggan & Meja (Terstruktur) */}
            <div className="bg-white p-3.5 rounded-xl border border-neutral-200/60 space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                <span className="text-neutral-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                  <User className="w-3 h-3 text-neutral-400" /> Nama Pemesan
                </span>
                <span className="font-extrabold text-neutral-900">
                  {order.customerName}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                <span className="text-neutral-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" /> No. Telepon
                </span>
                <span className="font-mono font-bold text-neutral-800">
                  {customerPhone}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                <span className="text-neutral-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                  <Mail className="w-3 h-3 text-neutral-400" /> Email
                </span>
                <span className="font-mono font-medium text-neutral-800 truncate max-w-[200px]">
                  {customerEmail}
                </span>
              </div>

              <div className="flex justify-between items-center pt-0.5">
                <span className="text-neutral-400 font-semibold uppercase text-[10px]">
                  Nomor Meja
                </span>
                <span className="font-extrabold text-neutral-900 bg-neutral-100 px-2.5 py-0.5 rounded-lg border border-neutral-200/80">
                  #{order.tableNumber}
                </span>
              </div>
            </div>

            {/* Daftar Item & Add-on */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block px-0.5">
                Daftar Menu & Add-On:
              </span>
              <div className="bg-white rounded-xl border border-neutral-200/60 divide-y divide-neutral-100 overflow-hidden">
                {order.items?.map((item, idx) => {
                  const itemPrice = item.price || item.menu?.price || 0;
                  const origItemPrice =
                    item.menu?.originalPrice || item.originalPrice || itemPrice;
                  const itemName = item.menu?.name || item.name || "Menu";
                  const hasPromo = origItemPrice > itemPrice;

                  let itemAddonSubtotal = 0;
                  let origItemAddonSubtotal = 0;
                  if (
                    item.selectedBundleChoices &&
                    typeof item.selectedBundleChoices === "object"
                  ) {
                    Object.entries(item.selectedBundleChoices).forEach(
                      ([title, addons]) => {
                        if (Array.isArray(addons)) {
                          addons.forEach((addon) => {
                            const addonP = Number(addon.price || 0);
                            itemAddonSubtotal += addonP;
                            origItemAddonSubtotal += addonP;
                          });
                        }
                      },
                    );
                  }

                  const totalItemPriceWithAddon =
                    (itemPrice + itemAddonSubtotal) * item.quantity;
                  const origTotalItemPriceWithAddon =
                    (origItemPrice + origItemAddonSubtotal) * item.quantity;

                  return (
                    <div key={idx} className="p-3 text-xs space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-neutral-900">
                            {item.quantity}x {itemName}
                          </span>
                          {hasPromo && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 fill-current" /> Promo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          {hasPromo && (
                            <span className="font-mono text-neutral-400 line-through text-[11px]">
                              Rp{" "}
                              {origTotalItemPriceWithAddon.toLocaleString(
                                "id-ID",
                              )}
                            </span>
                          )}
                          <span className="font-mono font-bold text-neutral-900">
                            Rp {totalItemPriceWithAddon.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>

                      {/* Rincian Add-On */}
                      {item.selectedBundleChoices &&
                        Object.entries(item.selectedBundleChoices).map(
                          ([title, addons], aIdx) => (
                            <div
                              key={aIdx}
                              className="text-[11px] text-neutral-500 pl-2 space-y-1 border-l-2 border-neutral-100 my-1"
                            >
                              {Array.isArray(addons) &&
                                addons.map((addon, adIdx) => (
                                  <div
                                    key={adIdx}
                                    className="flex justify-between items-center"
                                  >
                                    <span>• {addon.name}</span>
                                    {addon.price > 0 && (
                                      <span className="font-mono text-emerald-600 font-medium">
                                        +Rp{" "}
                                        {addon.price.toLocaleString("id-ID")}
                                      </span>
                                    )}
                                  </div>
                                ))}
                            </div>
                          ),
                        )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kalkulasi Ringkasan Biaya */}
            <div className="bg-white p-3.5 rounded-xl border border-neutral-200/60 space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal Menu</span>
                <span className="font-mono font-semibold text-neutral-900">
                  Rp {subtotalAmount.toLocaleString("id-ID")}
                </span>
              </div>

              {/* TAMPILKAN TOTAL HEMAT PROMO JIKA ADA */}
              {totalMenuSavings > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500 fill-current" />{" "}
                    Diskon Menu
                  </span>
                  <span className="font-mono">
                    - Rp {totalMenuSavings.toLocaleString("id-ID")}
                  </span>
                </div>
              )}

              {/* TAMPILKAN POTONGAN KUPON JIKA ADA */}
              {discountAmountVal > 0 && (
                <div className="flex justify-between text-purple-700 font-bold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-purple-600" /> Potongan Kupon (
                    {couponCodeVal})
                  </span>
                  <span className="font-mono">
                    - Rp {discountAmountVal.toLocaleString("id-ID")}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-neutral-700 pt-1 border-t border-dashed border-neutral-200">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-emerald-600" /> Biaya Layanan
                  (Service 5%)
                </span>
                <span className="font-mono font-semibold text-neutral-900">
                  Rp {calculatedServiceFee.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Total Pembayaran Final */}
            <div className="pt-3 border-t border-neutral-200 flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-extrabold uppercase tracking-wider">
                Total Pembayaran
              </span>
              <div className="flex items-center gap-2.5">
                {/* Harga Coret sebelum promo/diskon di sebelah kiri */}
                {(totalMenuSavings > 0 || discountAmountVal > 0) &&
                  originalTotalBeforeDiscount > order.totalAmount && (
                    <span className="font-mono text-neutral-400 line-through text-xs font-normal">
                      Rp {originalTotalBeforeDiscount.toLocaleString("id-ID")}
                    </span>
                  )}
                <span className="font-mono text-emerald-600 font-black text-base">
                  Rp {order.totalAmount?.toLocaleString("id-ID")}
                </span>
              </div>
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
            onClick={() => navigate(`/menu/${order?.tableNumber || 1}`)}
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
