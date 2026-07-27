import React, { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Calendar,
  QrCode,
  Wallet,
} from "lucide-react";

export default function ClientOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientOrders();
  }, []);

  const fetchClientOrders = async () => {
    try {
      // Sesuaikan endpoint API jika diperlukan untuk spesifik client/meja
      const res = await API.get("/orders");
      setOrders(res.data);
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
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Sedang Diproses di Dapur
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Siap Disajikan / Dipanggil
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Selesai
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-700 border border-neutral-200 px-3 py-1 rounded-full text-xs font-semibold">
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
          Memuat riwayat pesanan...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Riwayat Pesanan Anda
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Pantau status pesanan dan rincian transaksi Anda secara real-time.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-3xl p-8 space-y-2">
          <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
          <p className="text-sm font-bold text-neutral-700">
            Belum ada riwayat pesanan
          </p>
          <p className="text-xs text-neutral-400">
            Pesanan yang Anda buat akan muncul di halaman ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-neutral-400">
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="bg-neutral-100 text-neutral-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg">
                      Meja #{order.tableNumber}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900">
                    {order.customerName}
                  </h4>
                </div>
                <div>{getStatusBadge(order.orderStatus)}</div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                  Rincian Menu:
                </span>
                {order.items?.map((item, idx) => {
                  const itemName = item.menu?.name || item.name || "Menu Item";
                  const itemPrice = item.price || item.menu?.price || 0;
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs bg-neutral-50 p-2.5 rounded-xl border border-neutral-100"
                    >
                      <span className="font-medium text-neutral-800">
                        {item.quantity}x {itemName}
                      </span>
                      <span className="font-mono font-bold text-neutral-900">
                        Rp {(item.quantity * itemPrice).toLocaleString("id-ID")}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-neutral-100 text-xs font-bold">
                <span className="text-neutral-500">Total Pembayaran</span>
                <span className="font-mono text-emerald-600 text-sm font-black">
                  Rp {order.totalAmount?.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
