import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function ClientHistoryPage() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("table") || "1";
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderHistory();
  }, [tableNumber]);

  const fetchOrderHistory = async () => {
    try {
      // Ambil semua ID pesanan yang tersimpan di localStorage untuk meja ini atau riwayat perangkat
      const savedKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("order_"),
      );
      const orderIds = savedKeys
        .map((key) => localStorage.getItem(key))
        .filter(Boolean);

      // Atau alternatif lebih bersih: Fetch berdasarkan nomor meja atau simpan daftar ID pesanan ke array localStorage
      const storedOrderList = JSON.parse(
        localStorage.getItem("swift_order_history") || "[]",
      );

      if (storedOrderList.length > 0) {
        // Fetch detail pesanan secara paralel
        const resPromises = storedOrderList.map((id) =>
          axios.get(`http://localhost:5001/api/orders/${id}`).catch(() => null),
        );
        const results = await Promise.all(resPromises);
        const validOrders = results.filter(Boolean).map((r) => r.data);
        setOrders(validOrders);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat pesanan", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "processing":
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
            Diproses ⏳
          </span>
        );
      case "ready":
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
            Siap Disajikan 🔔
          </span>
        );
      case "completed":
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
            Selesai ✅
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-4 md:p-10 pb-28">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              Riwayat Pesanan Saya
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Daftar transaksi dan status pesanan Anda di meja #{tableNumber}.
            </p>
          </div>
          <button
            onClick={() => navigate(`/order?table=${tableNumber}`)}
            className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-800 transition shadow-sm"
          >
            + Menu Katalog
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-neutral-500 text-xs animate-pulse">
            Memuat riwayat...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl shadow-sm space-y-3">
            <p className="text-xs text-neutral-500">
              Belum ada riwayat pesanan di perangkat ini.
            </p>
            <button
              onClick={() => navigate(`/order?table=${tableNumber}`)}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              Mulai Pesan Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm hover:border-neutral-300 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      ID: {order._id}
                    </span>
                    <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                      Pemesan:{" "}
                      <span className="text-neutral-900">
                        {order.customerName}
                      </span>{" "}
                      (Meja #{order.tableNumber})
                    </p>
                  </div>
                  <div>{getStatusBadge(order.orderStatus)}</div>
                </div>

                {/* Items List */}
                <div className="bg-neutral-50 rounded-xl p-3 space-y-2 border border-neutral-100">
                  {order.items?.map((item, idx) => {
                    const itemName = item.menu?.name || item.name || "Menu";
                    const itemPrice = item.price || item.menu?.price || 0;
                    return (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-neutral-700 font-medium">
                          {item.quantity}x {itemName}
                        </span>
                        <span className="font-mono text-neutral-600">
                          Rp{" "}
                          {(itemPrice * item.quantity).toLocaleString("id-ID")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                  <span className="text-xs font-medium text-neutral-500">
                    Total Pembayaran
                  </span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    Rp {order.totalAmount?.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  {order.orderStatus === "processing" ||
                  order.orderStatus === "ready" ? (
                    <button
                      onClick={() => navigate(`/waiting/${order._id}`)}
                      className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-800 transition"
                    >
                      Cek Status Live 🔔
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/order?table=${tableNumber}`)}
                      className="bg-neutral-100 text-neutral-800 hover:bg-neutral-200 px-4 py-2 rounded-xl text-xs font-semibold transition"
                    >
                      Pesan Lagi 🛒
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
