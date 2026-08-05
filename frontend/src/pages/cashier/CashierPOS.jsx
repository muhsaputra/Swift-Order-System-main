import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { gooeyToast } from "goey-toast";
import {
  Sparkles,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Radio,
  Search,
  Banknote,
  QrCode,
  X,
  ArrowRight,
  Tag,
  Package,
  Flame,
  ExternalLink,
} from "lucide-react";
import { io } from "socket.io-client";
import { fromString } from "qris-dynamicify";
import QRCode from "qrcode";

// URL untuk REST API (menggunakan /api di akhir)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// URL untuk Socket.io (HANYA domain/root server, tanpa /api)
const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, "")
  : "http://localhost:5001";

// Ganti string di bawah ini dengan string QRIS statis asli milik merchant/toko Anda
const STATIC_QRIS_STRING =
  "00020101021126610014COM.GO-JEK.WWW01189360091434098874370210G4098874370303UMI51440014ID.CO.QRIS.WWW0215ID10265619738210303UMI5204581253033605802ID5925MUHAMAD TRI SAPUTRA, Maka6006SERANG61054212762070703A0163048D7A";

export default function CashierPOS() {
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash"); // Default cash
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  // State untuk Fitur Kupon / Promo Diskon
  const [coupons, setCoupons] = useState([]);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // State untuk Persentase Biaya Layanan Dinamis
  const [serviceFeePercentage, setServiceFeePercentage] = useState(5);

  // State untuk Modal Varian / Add-On saat Menu Diklik
  const [selectedMenuForOptions, setSelectedMenuForOptions] = useState(null);
  const [selectedOptionsState, setSelectedOptionsState] = useState({});

  // State untuk Modal QRIS Dinamis & URL Gambar QR
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [qrisImageUrl, setQrisImageUrl] = useState("");
  const [generatingQris, setGeneratingQris] = useState(false);

  // State Baru untuk Modal QR Waiting Page setelah Pembayaran Sukses
  const [isWaitingQrModalOpen, setIsWaitingQrModalOpen] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState(null);
  const [waitingPageQrUrl, setWaitingPageQrUrl] = useState("");

  useEffect(() => {
    fetchMenus();
    fetchCoupons();
    fetchServiceFeeSettings();

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    return () => socket.disconnect();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await API.get("/menus");
      setMenus(res.data);
    } catch (err) {
      console.error("Gagal memuat katalog menu", err);
      gooeyToast.error("Gagal memuat katalog menu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await API.get("/coupons");
      setCoupons(res.data || []);
    } catch (err) {
      console.log("Gagal memuat data kupon, menggunakan kupon kosong.");
    }
  };

  const fetchServiceFeeSettings = async () => {
    try {
      const res = await API.get("/settings/service-fee");
      if (res.data && res.data.serviceFeePercentage !== undefined) {
        setServiceFeePercentage(Number(res.data.serviceFeePercentage));
      }
    } catch (err) {
      console.log("Menggunakan fee layanan default 5%");
    }
  };

  // Handler saat menu diklik di katalog
  const handleMenuClick = (menu) => {
    if (menu.bundleOptions && menu.bundleOptions.length > 0) {
      setSelectedMenuForOptions(menu);
      const initialSelections = {};
      menu.bundleOptions.forEach((opt, idx) => {
        if (opt.choices && opt.choices.length > 0) {
          initialSelections[idx] = opt.choices[0];
        }
      });
      setSelectedOptionsState(initialSelections);
    } else {
      addToCartDirectly(menu, []);
    }
  };

  const addToCartDirectly = (menu, chosenOptions) => {
    const optionsExtraPrice = chosenOptions.reduce(
      (acc, curr) => acc + (curr.price || 0),
      0,
    );
    const finalItemPrice = menu.price + optionsExtraPrice;
    const optionString = JSON.stringify(chosenOptions);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item._id === menu._id && item.optionString === optionString,
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [
        ...prevCart,
        {
          ...menu,
          price: finalItemPrice,
          basePrice: menu.price,
          chosenOptions,
          optionString,
          quantity: 1,
        },
      ];
    });

    gooeyToast.success(`${menu.name} ditambahkan ke keranjang.`);
    setSelectedMenuForOptions(null);
  };

  const handleConfirmWithOptions = () => {
    if (!selectedMenuForOptions) return;
    const chosenOptionsList = Object.values(selectedOptionsState);
    addToCartDirectly(selectedMenuForOptions, chosenOptionsList);
  };

  const updateQuantity = (index, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item, idx) => {
          if (idx === index) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const calculateDiscount = (subtotal) => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "percentage") {
      const disc = (subtotal * appliedCoupon.discountValue) / 100;
      return appliedCoupon.maxDiscount && disc > appliedCoupon.maxDiscount
        ? appliedCoupon.maxDiscount
        : disc;
    } else if (appliedCoupon.discountType === "fixed") {
      return Math.min(subtotal, appliedCoupon.discountValue);
    }
    return 0;
  };

  const calculateServiceFee = (subtotalAfterDiscount) => {
    return Math.round(subtotalAfterDiscount * (serviceFeePercentage / 100));
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;

    const found = coupons.find(
      (c) => c.code.toUpperCase() === code && c.isActive !== false,
    );
    if (!found) {
      gooeyToast.error("Kode kupon tidak valid atau sudah tidak aktif.");
      return;
    }

    const subtotal = calculateSubtotal();
    if (found.minPurchase && subtotal < found.minPurchase) {
      gooeyToast.error(
        `Minimum belanja untuk kupon ini adalah Rp ${found.minPurchase.toLocaleString("id-ID")}`,
      );
      return;
    }

    setAppliedCoupon(found);
    gooeyToast.success(`Kupon "${found.code}" berhasil diterapkan! 🎉`);
    setCouponCodeInput("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    gooeyToast.info("Kupon promo dibatalkan.");
  };

  const generateDynamicQris = async (amount) => {
    setGeneratingQris(true);
    try {
      if (STATIC_QRIS_STRING.includes("NAMA_TOKO")) {
        gooeyToast.error("Harap gunakan string QRIS statis asli toko Anda!");
        setQrisImageUrl("");
        setGeneratingQris(false);
        return;
      }
      const dynamicQris = await fromString(STATIC_QRIS_STRING);
      dynamicQris.setPrice(amount);
      const dataUrl = await dynamicQris.writeToDataURL();
      setQrisImageUrl(dataUrl);
    } catch (err) {
      console.error("Gagal membuat QRIS dinamis", err);
      gooeyToast.error("Gagal memproses QRIS Dinamis.");
      setQrisImageUrl("");
    } finally {
      setGeneratingQris(false);
    }
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      gooeyToast.error("Keranjang pesanan masih kosong.");
      return;
    }
    if (!customerName.trim() || !tableNumber) {
      gooeyToast.error("Nama pelanggan dan nomor meja wajib diisi.");
      return;
    }

    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    const subtotalAfterDiscount = subtotal - discount;
    const serviceFee = calculateServiceFee(subtotalAfterDiscount);
    const totalAmount = subtotalAfterDiscount + serviceFee;

    const orderPayload = {
      customerName,
      tableNumber: Number(tableNumber),
      items: cart.map((item) => ({
        menu: item._id,
        menuId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        options: item.chosenOptions || [],
      })),
      subtotal,
      discount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      serviceFee,
      totalAmount,
      paymentMethod: paymentMethod.toLowerCase(),
      paymentStatus: "paid",
      orderStatus: "processing",
    };

    if (paymentMethod.toLowerCase() === "qris") {
      setPendingOrderData(orderPayload);
      setIsQrisModalOpen(true);
      generateDynamicQris(totalAmount);
    } else {
      executeOrderCreation(orderPayload);
    }
  };

  const executeOrderCreation = async (payload) => {
    setSubmitting(true);
    try {
      const res = await API.post("/orders", payload);
      gooeyToast.success("Pesanan walk-in berhasil diproses! 🚀");

      const createdOrder = res.data.order || res.data;

      if (createdOrder) {
        handlePrintReceipt(createdOrder);

        // Buat QR Code untuk Waiting Page pelanggan berdasarkan ID pesanan
        const waitingPageUrl = `${window.location.origin}/waiting/${createdOrder._id}`;
        const qrDataUrl = await QRCode.toDataURL(waitingPageUrl, {
          width: 300,
          margin: 2,
        });

        setSuccessOrderData(createdOrder);
        setWaitingPageQrUrl(qrDataUrl);
        setIsWaitingQrModalOpen(true);
      }

      setCart([]);
      setCustomerName("");
      setTableNumber("");
      setPaymentMethod("cash");
      setAppliedCoupon(null);
      setIsQrisModalOpen(false);
      setPendingOrderData(null);
      setQrisImageUrl("");
    } catch (err) {
      console.error("Gagal memproses pesanan", err);
      gooeyToast.error(err.response?.data?.error || "Gagal membuat pesanan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open("", "_blank", "width=300,height=600");
    if (!printWindow) return;

    const subtotalVal = order.subtotal || order.totalAmount;
    const discountVal = order.discount || 0;
    const serviceFeeVal = order.serviceFee || 0;

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Nota - #${order._id ? order._id.slice(-6).toUpperCase() : "POS"}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0; padding: 10px; color: #000; }
            .center { text-align: center; }
            .line { border-bottom: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 3px 0; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center">
            <strong>SWIFT ORDERING POS</strong><br/>
            <span>Cashier System</span>
            <div class="line"></div>
          </div>
          <div>
            Pelanggan: ${order.customerName}<br/>
            Meja: ${order.tableNumber}<br/>
            Metode: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : "CASH"}<br/>
            Waktu: ${new Date().toLocaleString("id-ID")}
          </div>
          <div class="line"></div>
          <table>
            ${order.items
              .map((item) => {
                const name = item.name || "Menu Item";
                const price = item.price || 0;
                const optText =
                  item.options && item.options.length > 0
                    ? `<br/><small style="color:#555;">(${item.options.map((o) => o.name).join(", ")})</small>`
                    : "";
                return `
                <tr>
                  <td colspan="2"><strong>${name}</strong>${optText}</td>
                </tr>
                <tr>
                  <td>${item.quantity}x @ ${price.toLocaleString("id-ID")}</td>
                  <td class="right">${(item.quantity * price).toLocaleString("id-ID")}</td>
                </tr>
              `;
              })
              .join("")}
          </table>
          <div class="line"></div>
          <table>
            <tr>
              <td>Subtotal</td>
              <td class="right">Rp ${subtotalVal.toLocaleString("id-ID")}</td>
            </tr>
            ${discountVal > 0 ? `<tr><td>Diskon (${order.couponCode || "PROMO"})</td><td class="right">-Rp ${discountVal.toLocaleString("id-ID")}</td></tr>` : ""}
            ${serviceFeeVal > 0 ? `<tr><td>Biaya Layanan (${serviceFeePercentage}%)</td><td class="right">Rp ${serviceFeeVal.toLocaleString("id-ID")}</td></tr>` : ""}
          </table>
          <div class="line"></div>
          <table>
            <tr>
              <td><strong>TOTAL</strong></td>
              <td class="right"><strong>Rp ${order.totalAmount.toLocaleString("id-ID")}</strong></td>
            </tr>
          </table>
          <div class="line"></div>
          <div class="center">
            Terima Kasih Atas Kunjungan Anda!<br/>
            <span>Silakan Datang Kembali</span>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredMenus = menus.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const subtotalAfterDiscount = subtotal - discount;
  const serviceFee = calculateServiceFee(subtotalAfterDiscount);
  const totalAmount = subtotalAfterDiscount + serviceFee;

  return (
    <div className="min-h-screen bg-sky-50/40 p-6 lg:p-10 space-y-8 pb-20 relative font-sans antialiased text-slate-900">
      {/* HEADER BANNER - Disesuaikan persis dengan gaya visual biru terang */}
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-900 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-xl overflow-hidden border border-blue-600/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1.5 rounded-full text-[11px] font-black text-sky-100 tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-sky-200" />
            <span>POINT OF SALES (POS MODE)</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
            Panel Kasir & Input Pesanan Walk-In
          </h1>
          <p className="text-xs lg:text-sm text-sky-100 font-medium max-w-2xl leading-relaxed">
            Pilih menu dari katalog untuk langsung dimasukkan ke keranjang
            pesanan pelanggan.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-3 rounded-2xl shadow-xl shrink-0">
          <Radio
            className={`w-4 h-4 ${socketConnected ? "text-emerald-300 animate-pulse" : "text-red-300"}`}
          />
          <span className="text-xs font-bold text-white">
            {socketConnected ? "Live Socket Connected" : "Socket Disconnected"}
          </span>
        </div>
      </div>

      {/* KONTEN UTAMA: KATALOG & KERANJANG */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* KATALOG MENU KASIR (2 Kolom) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900">
              Katalog Menu Tersedia ({filteredMenus.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu makanan..."
                className="bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 transition w-56 font-medium"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredMenus.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-xs text-slate-500 shadow-xs">
              Tidak ada menu yang ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMenus.map((menu) => (
                <div
                  key={menu._id}
                  onClick={() => handleMenuClick(menu)}
                  className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs hover:shadow-md transition cursor-pointer flex gap-4 items-center group relative overflow-hidden"
                >
                  <img
                    src={
                      menu.image ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={menu.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 group-hover:scale-105 transition border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {menu.category || "Makanan"}
                      </span>
                      {menu.sku && (
                        <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {menu.sku}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
                      {menu.name}
                    </h3>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-black text-emerald-600">
                        Rp {menu.price.toLocaleString("id-ID")}
                      </span>
                      {menu.originalPrice > menu.price && (
                        <span className="text-[10px] font-mono text-slate-400 line-through">
                          Rp {menu.originalPrice.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>

                    {menu.bundleOptions && menu.bundleOptions.length > 0 && (
                      <span className="inline-block mt-1.5 text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                        Ada Varian/Add-On
                      </span>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:bg-blue-700 transition shadow-sm shadow-blue-600/20">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KERANJANG PESANAN KASIR (1 Kolom Sticky) */}
        <div className="bg-white border border-slate-200/80 p-6 lg:p-8 rounded-3xl shadow-xl space-y-6 sticky top-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black shadow-md shadow-blue-600/20">
                <ShoppingCart className="w-5 h-5 text-sky-200" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Keranjang Kasir
                </h3>
                <p className="text-xs text-slate-500">
                  Rincian pesanan pelanggan.
                </p>
              </div>
            </div>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-extrabold">
              {cart.reduce((a, c) => a + c.quantity, 0)} Item
            </span>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nomor Meja
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Contoh: 5"
                min={1}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition"
              />
            </div>

            {/* PILIHAN METODE PEMBAYARAN (CASH / QRIS) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                    paymentMethod === "cash"
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("qris")}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                    paymentMethod === "qris"
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS Dinamis</span>
                </button>
              </div>
            </div>

            {/* DAFTAR ITEM DIPILIH */}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                  Belum ada menu dipilih.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl flex justify-between items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </p>
                      {item.chosenOptions && item.chosenOptions.length > 0 && (
                        <p className="text-[10px] text-slate-500 truncate">
                          {item.chosenOptions.map((o) => o.name).join(", ")}
                        </p>
                      )}
                      <p className="text-[11px] text-emerald-600 font-semibold font-mono">
                        Rp{" "}
                        {(item.price * item.quantity).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold font-mono w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(idx)}
                        className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 cursor-pointer ml-1 border border-red-200 shadow-2xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* FITUR KUPON / PROMO */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Kupon / Voucher Promo</span>
              </label>
              {appliedCoupon ? (
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-2xs">
                      %
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-blue-900">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-[10px] text-blue-700">
                        {appliedCoupon.discountType === "percentage"
                          ? `Diskon ${appliedCoupon.discountValue}%`
                          : `Potongan Rp ${appliedCoupon.discountValue.toLocaleString("id-ID")}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-blue-800 hover:text-red-600 p-1 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    placeholder="Masukkan kode kupon..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs uppercase font-medium focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shadow-sm shadow-blue-600/20"
                  >
                    Pakai
                  </button>
                </div>
              )}
            </div>

            {/* RINCIAN BIAYA */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-slate-800">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-purple-700 font-semibold">
                  <span>Diskon Kupon</span>
                  <span className="font-mono">
                    -Rp {discount.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Biaya Layanan ({serviceFeePercentage}%)</span>
                <span className="font-mono font-semibold text-slate-800">
                  Rp {serviceFee.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-dashed border-slate-200">
                <span>Total Tagihan</span>
                <span className="font-mono text-emerald-600 font-black">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <CheckCircle2 className="w-4 h-4 text-sky-200" />
              <span>
                {submitting
                  ? "Memproses..."
                  : `Proses Pesanan (${paymentMethod.toUpperCase()})`}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* MODAL PILIHAN VARIAN / LEVEL KEPEDASAN / ADD-ON */}
      {selectedMenuForOptions && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 w-full max-w-md space-y-6 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pilih Varian: {selectedMenuForOptions.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Sesuaikan level kepedasan atau tambahan add-on.
                </p>
              </div>
              <button
                onClick={() => setSelectedMenuForOptions(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {selectedMenuForOptions.bundleOptions.map((opt, optIdx) => (
                <div
                  key={optIdx}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5"
                >
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
                    {opt.title}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {opt.choices.map((choice, cIdx) => {
                      const isSelected =
                        selectedOptionsState[optIdx]?.name === choice.name;
                      return (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() =>
                            setSelectedOptionsState({
                              ...selectedOptionsState,
                              [optIdx]: choice,
                            })
                          }
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition flex justify-between items-center cursor-pointer shadow-2xs ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span>{choice.name}</span>
                          <span
                            className={`font-mono text-[11px] ${isSelected ? "text-sky-200" : "text-emerald-600"}`}
                          >
                            {choice.price > 0
                              ? `+Rp ${choice.price.toLocaleString("id-ID")}`
                              : "Gratis"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedMenuForOptions(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmWithOptions}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-bold transition shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                Masukkan ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QRIS DINAMIS PEMBAYARAN */}
      {isQrisModalOpen && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-6 pt-5 pb-4 relative flex flex-col items-center text-center shadow-md">
              <button
                onClick={() => setIsQrisModalOpen(false)}
                className="absolute right-4 top-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg font-black tracking-wider uppercase italic bg-white text-blue-900 px-3 py-0.5 rounded-lg shadow-sm">
                  QRIS
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-sky-100 opacity-90">
                QUICK RESPONSE CODE INDONESIA STANDARD
              </p>
            </div>

            <div className="px-6 py-5 space-y-4 text-center bg-gradient-to-b from-slate-50 to-white">
              <div className="space-y-0.5 border-b border-slate-200/60 pb-3">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wide">
                  MUHAMAD TRI SAPUTRA
                </h3>
                <div className="flex justify-center items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span>NMID: ID1026561973821</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold uppercase">
                    UMI
                  </span>
                </div>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl py-2 px-4 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-bold">Total Tagihan:</span>
                <span className="font-black text-blue-700 text-sm font-mono">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="bg-white border-2 border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center relative">
                <div className="absolute -top-3 bg-blue-600 text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Scan Dengan Semua E-Wallet & M-Banking
                </div>

                <div className="w-44 h-44 flex items-center justify-center mt-1">
                  {generatingQris ? (
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                  ) : qrisImageUrl ? (
                    <img
                      src={qrisImageUrl}
                      alt="QRIS Dinamis Resmi"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">
                      Gagal memuat QR
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-0.5">
                <p>
                  Pelanggan:{" "}
                  <strong className="text-slate-800">{customerName}</strong>{" "}
                  (Meja #{tableNumber})
                </p>
                <p className="text-[10px] text-slate-400 italic">
                  Nominal pembayaran telah terkunci otomatis pada sistem QRIS.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQrisModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={submitting || generatingQris}
                  onClick={() => executeOrderCreation(pendingOrderData)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3 rounded-2xl text-xs font-bold transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {submitting ? "Menyimpan..." : "Konfirmasi Lunas"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-sky-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SCAN QR WAITING PAGE (MUNCUL SETELAH PEMBAYARAN KONFIRMASI / SUKSES) */}
      {isWaitingQrModalOpen && successOrderData && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto text-center">
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-6 pt-6 pb-5 relative flex flex-col items-center shadow-md">
              <button
                onClick={() => setIsWaitingQrModalOpen(false)}
                className="absolute right-4 top-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-white/20 text-emerald-300 border border-white/30 flex items-center justify-center mb-2 font-bold shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black tracking-tight text-white">
                Pembayaran Berhasil! 🎉
              </h3>
              <p className="text-xs text-sky-100 mt-0.5">
                Silakan arahkan kamera pelanggan ke QR Code di bawah ini.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4 bg-gradient-to-b from-slate-50 to-white">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs">
                <p className="font-extrabold text-emerald-900">
                  {successOrderData.customerName} (Meja #
                  {successOrderData.tableNumber})
                </p>
                <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                  Total: Rp{" "}
                  {successOrderData.totalAmount.toLocaleString("id-ID")}
                </p>
              </div>

              <div className="bg-white border-2 border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center relative">
                <div className="absolute -top-3 bg-blue-600 text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Scan untuk Halaman Antrean (Waiting Page)
                </div>

                <div className="w-48 h-48 flex items-center justify-center mt-2">
                  {waitingPageQrUrl ? (
                    <img
                      src={waitingPageQrUrl}
                      alt="QR Waiting Page"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Pelanggan dapat memantau status pesanan (Pending → Processing →
                Ready) secara langsung dari HP mereka.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsWaitingQrModalOpen(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-bold transition shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Selesai / Tutup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
