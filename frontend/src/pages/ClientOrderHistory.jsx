import React, { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  ShoppingBag,
  CheckCircle2,
  ArrowLeft,
  Clock,
  ChevronRight,
  Store,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ClientOrderHistory() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableFromUrl = searchParams.get("table");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil data identitas guest dari localStorage
  const customerInfo = JSON.parse(
    localStorage.getItem("swift_customer_info") || "{}",
  );
  const tableNumber =
    tableFromUrl || localStorage.getItem("swift_table_number") || "";

  useEffect(() => {
    fetchClientOrders();
  }, []);

  const fetchClientOrders = async () => {
    try {
      const res = await API.get("/orders");
      const allOrders = res.data;

      // Filter pesanan HANYA milik client yang aktif di browser ini (berdasarkan Nama atau Nomor Meja)
      const filtered = allOrders.filter((order) => {
        const isSameName =
          customerInfo.name &&
          order.customerName?.toLowerCase().trim() ===
            customerInfo.name.toLowerCase().trim();

        const isSameTable =
          tableNumber && Number(order.tableNumber) === Number(tableNumber);

        return isSameName || isSameTable;
      });

      // Urutkan dari yang terbaru
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(filtered);
    } catch (err) {
      console.error("Gagal memuat riwayat pesanan", err);
      toast.error("Gagal memuat riwayat pesanan.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3.5 py-1 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Sedang Diproses
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Siap Disajikan
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Selesai
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-700 border border-neutral-200 px-3.5 py-1 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-500 font-medium">
          Memuat riwayat pesanan Anda...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-20">
      {/* Tombol Kembali & Navigasi Atas */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:bg-neutral-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>

        <button
          onClick={() => navigate(`/order?table=${tableNumber}`)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          <Store className="w-4 h-4" />
          Menu Awal
        </button>
      </div>

      {/* Banner / Header Section */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
        <div className="space-y-1 z-10">
          <span className="bg-white/10 text-neutral-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-1">
            Meja #{tableNumber || "-"}
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Riwayat Pesanan Anda
          </h2>
          <p className="text-xs md:text-sm text-neutral-300">
            Pantau status pesanan dan rincian transaksi atas nama{" "}
            <span className="font-bold text-white">
              {customerInfo.name || "Tamu"}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Daftar Pesanan */}
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-neutral-200/80 rounded-3xl p-8 space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto text-neutral-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-neutral-800">
              Belum ada riwayat pesanan
            </p>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Pesanan yang Anda buat melalui perangkat ini akan muncul secara
              otomatis di sini.
            </p>
          </div>
          <button
            onClick={() => navigate(`/order?table=${tableNumber}`)}
            className="mt-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Mulai Pesan Menu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderIdShort = order._id
              ? order._id.slice(-6).toUpperCase()
              : "ORDER";
            const orderDate = order.createdAt
              ? new Date(order.createdAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div
                key={order._id}
                className="bg-white border border-neutral-200/80 rounded-3xl p-5 md:p-6 shadow-2xs space-y-4 hover:border-neutral-300 transition-all"
              >
                {/* Header Kartu Pesanan */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg">
                      #{orderIdShort}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">
                      {orderDate} WIB
                    </span>
                  </div>
                  <div>{getStatusBadge(order.orderStatus)}</div>
                </div>

                {/* Rincian Item Menu */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                    Rincian Menu
                  </span>
                  <div className="space-y-1.5">
                    {order.items?.map((item, idx) => {
                      const itemName =
                        item.menu?.name || item.name || "Menu Item";
                      const itemPrice = item.price || item.menu?.price || 0;
                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs bg-neutral-50/70 p-3 rounded-2xl border border-neutral-100/80"
                        >
                          <span className="font-medium text-neutral-800">
                            <span className="font-bold text-neutral-900 mr-1.5">
                              {item.quantity}x
                            </span>{" "}
                            {itemName}
                          </span>
                          <span className="font-mono font-bold text-neutral-900">
                            Rp{" "}
                            {(item.quantity * itemPrice).toLocaleString(
                              "id-ID",
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Kartu: Total & Button ke Waiting Page */}
                <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                      Total Pembayaran
                    </span>
                    <span className="font-mono text-emerald-600 text-sm md:text-base font-black">
                      Rp {order.totalAmount?.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/waiting/${order._id}?table=${tableNumber}`)
                    }
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm group"
                  >
                    <span>Cek Status / Waiting Page</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
