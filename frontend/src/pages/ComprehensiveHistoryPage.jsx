import React, { useState, useEffect, useMemo } from "react";
import API from "../services/api";
import { gooeyToast } from "goey-toast";
import {
  History,
  Calendar,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function ComprehensiveHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyFilterDate, setHistoryFilterDate] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Gagal memuat riwayat pesanan", err);
      gooeyToast.error("Gagal memuat data arsip transaksi.");
    } finally {
      setLoading(false);
    }
  };

  const comprehensiveHistory = useMemo(() => {
    return orders.filter((o) => {
      if (o.orderStatus !== "completed") return false;
      if (!historyFilterDate) return true;
      const orderDateStr = new Date(o.createdAt).toISOString().split("T")[0];
      return orderDateStr === historyFilterDate;
    });
  }, [orders, historyFilterDate]);

  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * itemsPerPage;
    return comprehensiveHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [comprehensiveHistory, historyPage]);

  const totalHistoryPages = Math.ceil(
    comprehensiveHistory.length / itemsPerPage,
  );

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open("", "_blank", "width=300,height=600");
    if (!printWindow) return;

    const subtotalVal = order.subtotal || order.totalAmount;
    const serviceFeeVal = order.serviceFee || 0;

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Nota - #${order._id.slice(-6).toUpperCase()}</title>
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
            <strong>SWIFT ORDERING</strong><br/>
            <span>Cashier System</span>
            <div class="line"></div>
          </div>
          <div>
            ID: #${order._id.slice(-6).toUpperCase()}<br/>
            Pelanggan: ${order.customerName}<br/>
            Meja: ${order.tableNumber}<br/>
            Telepon: ${order.customerPhone || "-"}<br/>
            Email: ${order.customerEmail || "-"}<br/>
            Metode: ${order.paymentMethod === "cash" ? "CASH" : "QRIS"}<br/>
            Waktu: ${new Date(order.createdAt).toLocaleString("id-ID")}
          </div>
          <div class="line"></div>
          <table>
            ${order.items
              .map((item) => {
                const name = item.menu?.name || item.name || "Menu Item";
                const price = item.price || item.menu?.price || 0;
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
            ${order.discountAmount > 0 ? `<tr><td>Diskon</td><td class="right">- Rp ${order.discountAmount.toLocaleString("id-ID")}</td></tr>` : ""}
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

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-20">
      {/* HERO BANNER */}
      <div className="relative bg-neutral-900 text-white py-10 px-6 md:px-12 overflow-hidden mb-8 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Audit & Transaksi Selesai</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Riwayat Komprehensif & Arsip 📊
          </h1>
          <p className="text-xs md:text-sm text-neutral-300 max-w-lg leading-relaxed">
            Pemeriksaan ulang transaksi lama, verifikasi arsip, dan audit harian
            operasional restoran.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-500 font-medium">
              Memuat data arsip transaksi...
            </p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Daftar Arsip Transaksi Selesai
                </h3>
                <p className="text-xs text-neutral-500">
                  Total {comprehensiveHistory.length} transaksi tercatat dalam
                  sistem.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-2 rounded-2xl">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-xs text-neutral-500 font-semibold">
                    Filter Tanggal:
                  </span>
                  <input
                    type="date"
                    value={historyFilterDate}
                    onChange={(e) => {
                      setHistoryFilterDate(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="bg-transparent text-xs text-neutral-900 font-medium focus:outline-none cursor-pointer"
                  />
                  {historyFilterDate && (
                    <button
                      onClick={() => {
                        setHistoryFilterDate("");
                        setHistoryPage(1);
                      }}
                      className="text-neutral-400 hover:text-neutral-700 text-xs font-bold ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {comprehensiveHistory.length === 0 ? (
              <div className="text-center py-20 text-neutral-400 text-xs space-y-2">
                <History className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="font-bold text-neutral-600">
                  Tidak ada riwayat transaksi selesai
                </p>
                <p className="text-[11px]">
                  Silakan ubah filter tanggal atau selesaikan pesanan aktif
                  terlebih dahulu.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 text-[11px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50">
                        <th className="py-3 px-4">ID Pesanan</th>
                        <th className="py-3 px-4">Waktu Transaksi</th>
                        <th className="py-3 px-4">Meja</th>
                        <th className="py-3 px-4">Pelanggan</th>
                        <th className="py-3 px-4">Metode</th>
                        <th className="py-3 px-4">Kupon</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs text-neutral-700 font-medium">
                      {paginatedHistory.map((order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-neutral-50/60 transition"
                        >
                          <td className="py-3.5 px-4 font-mono text-neutral-400 font-semibold">
                            #{order._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-neutral-500 text-[11px]">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-neutral-100 text-neutral-900 font-extrabold px-2.5 py-1 rounded-lg">
                              Meja #{order.tableNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-neutral-900">
                            {order.customerName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="uppercase text-[10px] font-extrabold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                              {order.paymentMethod || "qris"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {order.couponCode ? (
                              <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                {order.couponCode}
                              </span>
                            ) : (
                              <span className="text-neutral-400">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-emerald-600">
                            Rp {order.totalAmount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                              SELESAI
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handlePrintReceipt(order)}
                              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition border border-neutral-200/80 shadow-2xs cursor-pointer inline-flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" /> Cetak Ulang
                              Struk
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINASI KONTROL */}
                <div className="flex justify-between items-center pt-4 border-t border-neutral-100 text-xs">
                  <p className="text-neutral-500 font-medium">
                    Menampilkan{" "}
                    <span className="font-bold text-neutral-900">
                      {(historyPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    sampai{" "}
                    <span className="font-bold text-neutral-900">
                      {Math.min(
                        historyPage * itemsPerPage,
                        comprehensiveHistory.length,
                      )}
                    </span>{" "}
                    dari{" "}
                    <span className="font-bold text-neutral-900">
                      {comprehensiveHistory.length}
                    </span>{" "}
                    total riwayat
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setHistoryPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={historyPage === 1}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1 border ${
                        historyPage === 1
                          ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                          : "bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200 cursor-pointer shadow-2xs"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" /> Sebelumnya
                    </button>
                    <span className="px-3 py-2 bg-neutral-900 text-white font-mono font-bold rounded-xl">
                      {historyPage} / {totalHistoryPages || 1}
                    </span>
                    <button
                      onClick={() =>
                        setHistoryPage((prev) =>
                          Math.min(prev + 1, totalHistoryPages),
                        )
                      }
                      disabled={historyPage >= totalHistoryPages}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1 border ${
                        historyPage >= totalHistoryPages
                          ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                          : "bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200 cursor-pointer shadow-2xs"
                      }`}
                    >
                      Berikutnya <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
