import React, { useState, useEffect } from "react";
import API from "../services/api";
import { gooeyToast } from "goey-toast";
import {
  Sparkles,
  Store,
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
  ShieldCheck,
  Printer,
} from "lucide-react";
import { io } from "socket.io-client";
import { fromString } from "qris-dynamicify";

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

  // State untuk Modal QRIS Dinamis & URL Gambar QR
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [qrisImageUrl, setQrisImageUrl] = useState("");
  const [generatingQris, setGeneratingQris] = useState(false);

  useEffect(() => {
    fetchMenus();

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

  const addToCart = (menu) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === menu._id);
      if (existingItem) {
        return prevCart.map((item) =>
          item._id === menu._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prevCart, { ...menu, quantity: 1 }];
    });
    gooeyToast.success(`${menu.name} ditambahkan ke keranjang.`);
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item._id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const calculateServiceFee = (subtotal) => {
    return Math.round(subtotal * 0.05); // Pajak/Layanan 5%
  };

  // Fungsi untuk men-generate QRIS Dinamis menggunakan qris-dynamicify
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
    const serviceFee = calculateServiceFee(subtotal);
    const totalAmount = subtotal + serviceFee;

    const orderPayload = {
      customerName,
      tableNumber: Number(tableNumber),
      items: cart.map((item) => ({
        menu: item._id,
        menuId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      serviceFee,
      totalAmount,
      paymentMethod: paymentMethod.toLowerCase(),
      paymentStatus: paymentMethod.toLowerCase() === "qris" ? "paid" : "paid",
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

      // Cetak struk otomatis setelah berhasil
      if (res.data) {
        handlePrintReceipt(res.data);
      }

      setCart([]);
      setCustomerName("");
      setTableNumber("");
      setPaymentMethod("cash");
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
                return `
                <tr>
                  <td colspan="2"><strong>${name}</strong></td>
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
            ${serviceFeeVal > 0 ? `<tr><td>Biaya Layanan (5%)</td><td class="right">Rp ${serviceFeeVal.toLocaleString("id-ID")}</td></tr>` : ""}
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
  const serviceFee = calculateServiceFee(subtotal);
  const totalAmount = subtotal + serviceFee;

  return (
    <div className="min-h-screen bg-neutral-100 p-6 md:p-10 space-y-8 pb-20 relative">
      {/* HEADER BANNER */}
      <div className="bg-neutral-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Point of Sales (POS Mode)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Panel Kasir & Input Pesanan Walk-In
          </h1>
          <p className="text-xs md:text-sm text-neutral-300">
            Pilih menu dari katalog untuk langsung dimasukkan ke keranjang
            pesanan pelanggan.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
          <Radio
            className={`w-4 h-4 ${socketConnected ? "text-emerald-400 animate-pulse" : "text-red-400"}`}
          />
          <span className="text-xs font-bold text-white">
            {socketConnected ? "Live Socket Connected" : "Socket Disconnected"}
          </span>
        </div>
      </div>

      {/* KONTEN UTAMA: KATALOG & KERANJANG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* KATALOG MENU KASIR (2 Kolom) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <h2 className="text-sm font-extrabold text-neutral-900">
              Katalog Menu Tersedia ({filteredMenus.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu makanan..."
                className="bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 transition w-52 font-medium"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
            </div>
          ) : filteredMenus.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center text-xs text-neutral-500">
              Tidak ada menu yang ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMenus.map((menu) => (
                <div
                  key={menu._id}
                  onClick={() => addToCart(menu)}
                  className="bg-white border border-neutral-200/80 p-4 rounded-3xl shadow-2xs hover:shadow-md transition cursor-pointer flex gap-4 items-center group"
                >
                  <img
                    src={
                      menu.image ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={menu.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 group-hover:scale-105 transition"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      {menu.category || "Makanan"}
                    </span>
                    <h3 className="text-sm font-extrabold text-neutral-900 truncate">
                      {menu.name}
                    </h3>
                    <p className="text-xs font-bold text-emerald-600 mt-1">
                      Rp {menu.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:text-neutral-950 transition">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KERANJANG PESANAN KASIR (1 Kolom Sticky) */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-xl space-y-6 sticky top-6">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-neutral-900 text-white rounded-2xl flex items-center justify-center font-black">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Keranjang Kasir
                </h3>
                <p className="text-xs text-neutral-500">
                  Rincian pesanan pelanggan.
                </p>
              </div>
            </div>
            <span className="bg-neutral-100 px-3 py-1 rounded-full text-xs font-extrabold text-neutral-800">
              {cart.reduce((a, c) => a + c.quantity, 0)} Item
            </span>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 font-medium transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">
                Nomor Meja
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Contoh: 5"
                min={1}
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 font-medium transition"
              />
            </div>

            {/* PILIHAN METODE PEMBAYARAN (CASH / QRIS) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === "cash"
                      ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                      : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("qris")}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === "qris"
                      ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                      : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS Dinamis</span>
                </button>
              </div>
            </div>

            {/* DAFTAR ITEM DIPILIH */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-neutral-200 rounded-2xl text-xs text-neutral-400">
                  Belum ada menu dipilih.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item._id}
                    className="bg-neutral-50 border border-neutral-200/60 p-3 rounded-2xl flex justify-between items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-semibold">
                        Rp{" "}
                        {(item.price * item.quantity).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item._id, -1)}
                        className="w-7 h-7 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item._id, 1)}
                        className="w-7 h-7 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item._id)}
                        className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 cursor-pointer ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* RINCIAN BIAYA */}
            <div className="space-y-1.5 pt-3 border-t border-neutral-100 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="font-semibold">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Biaya Layanan (5%)</span>
                <span className="font-semibold">
                  Rp {serviceFee.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Total Tagihan</span>
                <span className="text-emerald-600">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {submitting
                  ? "Memproses..."
                  : `Proses Pesanan (${paymentMethod.toUpperCase()})`}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* MODAL QRIS DINAMIS (FULL-SCREEN VIEWPORT FIX AGAR BLUR TIDAK TERPOTONG) */}
      {isQrisModalOpen && (
        <div className="fixed inset-0 w-screen h-screen bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Header Resmi QRIS (Merah & Putih khas BI/QRIS) */}
            <div className="bg-red-700 text-white px-6 pt-5 pb-4 relative flex flex-col items-center text-center shadow-md">
              <button
                onClick={() => setIsQrisModalOpen(false)}
                className="absolute right-4 top-4 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg font-black tracking-wider uppercase italic bg-white text-red-700 px-3 py-0.5 rounded-lg shadow-sm">
                  QRIS
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-red-100 opacity-90">
                QUICK RESPONSE CODE INDONESIA STANDARD
              </p>
            </div>

            {/* Body Kartu QRIS */}
            <div className="px-6 py-5 space-y-4 text-center bg-gradient-to-b from-neutral-50 to-white">
              {/* Info Merchant */}
              <div className="space-y-0.5 border-b border-neutral-200/60 pb-3">
                <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wide">
                  MUHAMAD TRI SAPUTRA
                </h3>
                <div className="flex justify-center items-center gap-2 text-[10px] text-neutral-500 font-mono">
                  <span>NMID: ID1026561973821</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold uppercase">
                    UMI
                  </span>
                </div>
              </div>

              {/* Tagihan Pelanggan */}
              <div className="bg-red-50/60 border border-red-100 rounded-2xl py-2 px-4 flex justify-between items-center text-xs">
                <span className="text-neutral-600 font-bold">
                  Total Tagihan:
                </span>
                <span className="font-black text-red-700 text-sm font-mono">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Kotak QR Code */}
              <div className="bg-white border-2 border-neutral-200 p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center relative">
                <div className="absolute -top-3 bg-neutral-900 text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Scan Dengan Semua E-Wallet & M-Banking
                </div>

                <div className="w-44 h-44 flex items-center justify-center mt-1">
                  {generatingQris ? (
                    <div className="w-8 h-8 border-4 border-neutral-200 border-t-red-600 rounded-full animate-spin"></div>
                  ) : qrisImageUrl ? (
                    <img
                      src={qrisImageUrl}
                      alt="QRIS Dinamis Resmi"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-neutral-400">
                      Gagal memuat QR
                    </span>
                  )}
                </div>
              </div>

              {/* Info Pelanggan */}
              <div className="text-[11px] text-neutral-500 space-y-0.5">
                <p>
                  Pelanggan:{" "}
                  <strong className="text-neutral-800">{customerName}</strong>{" "}
                  (Meja #{tableNumber})
                </p>
                <p className="text-[10px] text-neutral-400 italic">
                  Nominal pembayaran telah terkunci otomatis pada sistem QRIS.
                </p>
              </div>

              {/* Footer Logo Pendukung */}
              <div className="pt-2 flex items-center justify-center gap-3 opacity-60 grayscale hover:grayscale-0 transition">
                <span className="text-[9px] font-extrabold tracking-tighter text-neutral-500 border border-neutral-300 px-2 py-0.5 rounded">
                  GOPAY
                </span>
                <span className="text-[9px] font-extrabold tracking-tighter text-neutral-300">
                  •
                </span>
                <span className="text-[9px] font-extrabold tracking-tighter text-neutral-500 border border-neutral-300 px-2 py-0.5 rounded">
                  OVO
                </span>
                <span className="text-[9px] font-extrabold tracking-tighter text-neutral-300">
                  •
                </span>
                <span className="text-[9px] font-extrabold tracking-tighter text-neutral-500 border border-neutral-300 px-2 py-0.5 rounded">
                  DANA
                </span>
                <span className="text-[9px] font-extrabold tracking-tighter text-neutral-300">
                  •
                </span>
                <span className="text-[9px] font-extrabold tracking-tighter text-neutral-500 border border-neutral-300 px-2 py-0.5 rounded">
                  BCA/M-BSI
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQrisModalOpen(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={submitting || generatingQris}
                  onClick={() => executeOrderCreation(pendingOrderData)}
                  className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-neutral-300 text-white py-3 rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {submitting ? "Menyimpan..." : "Konfirmasi Lunas"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
