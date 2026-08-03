import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import {
  ShoppingBag,
  CheckCircle2,
  ArrowLeft,
  Store,
  ChevronRight,
  Tag,
  Receipt,
  Clock3,
  UtensilsCrossed,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ClientOrderHistory() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableFromUrl = searchParams.get("table");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // Ambil daftar ID pesanan yang pernah dibuat oleh perangkat ini dari localStorage
      const localOrderIds = JSON.parse(
        localStorage.getItem("swift_client_order_ids") || "[]",
      );

      const filtered = allOrders.filter((order) => {
        // 1. Prioritaskan kecocokan berdasarkan ID pesanan yang tersimpan di perangkat lokal
        const isLocalDeviceOrder = localOrderIds.includes(order._id);

        // 2. Jika belum ada di local ID, cocokkan secara ketat berdasarkan Nama (harus ada & sama) DAN Nomor Meja
        const hasValidName =
          customerInfo.name && customerInfo.name.trim() !== "";
        const isSameName =
          hasValidName &&
          order.customerName?.toLowerCase().trim() ===
            customerInfo.name.toLowerCase().trim();

        const isSameTable =
          tableNumber && Number(order.tableNumber) === Number(tableNumber);

        // Hanya tampilkan jika pesanan berasal dari perangkat ini ATAU (nama valid dan meja sama persis)
        return isLocalDeviceOrder || (isSameName && isSameTable);
      });

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
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Sedang Diproses
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Siap Disajikan
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Selesai
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-700 border border-neutral-200 px-3.5 py-1.5 rounded-full text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 bg-neutral-50/50">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-500 font-medium">
          Memuat riwayat pesanan Anda...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Navigasi Atas */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/menu/${tableNumber}`)}
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200/80 px-4 py-2.5 rounded-2xl transition-all shadow-2xs hover:bg-neutral-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>

        {/* Banner Section */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-neutral-800">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-neutral-200 text-xs font-bold px-3.5 py-1 rounded-full tracking-wider border border-white/10">
              <UtensilsCrossed className="w-3.5 h-3.5 text-neutral-300" />
              Meja #{tableNumber || "-"}
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Riwayat Pesanan
            </h2>
            <p className="text-xs md:text-sm text-neutral-300 font-medium">
              Pantau status langsung dan rincian transaksi atas nama{" "}
              <span className="text-white font-bold underline decoration-neutral-500 underline-offset-2">
                {customerInfo.name || "Tamu"}
              </span>
              .
            </p>
          </div>
        </div>

        {/* Daftar Pesanan */}
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white border border-neutral-200/80 rounded-3xl p-8 space-y-4 shadow-2xs">
            <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto text-neutral-400">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-neutral-800">
                Belum ada riwayat pesanan
              </p>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Pesanan yang Anda buat melalui perangkat ini akan tercatat
                otomatis di sini.
              </p>
            </div>
            <button
              onClick={() => navigate(`/menu/${tableNumber}`)}
              className="mt-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-6 py-3 rounded-2xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
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

              const itemsSubtotal =
                order.items?.reduce((acc, item) => {
                  const p = item.price || item.menu?.price || 0;
                  return acc + p * item.quantity;
                }, 0) || 0;

              const discountAmount =
                order.discountAmount || order.discount || 0;
              const serviceFee = order.serviceFee || order.taxOrService || 0;

              return (
                <div
                  key={order._id}
                  className="bg-white border border-neutral-200/80 rounded-3xl p-5 md:p-6 shadow-2xs space-y-5 hover:border-neutral-300 transition-all"
                >
                  {/* Header Kartu Pesanan */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-neutral-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold bg-neutral-100 text-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200/60">
                        #{orderIdShort}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-400 font-semibold">
                        <Clock3 className="w-3.5 h-3.5" />
                        {orderDate} WIB
                      </span>
                    </div>
                    <div>{getStatusBadge(order.orderStatus)}</div>
                  </div>

                  {/* Rincian Item Menu */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                      Daftar Menu Pesanan
                    </span>
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => {
                        const itemName =
                          item.menu?.name || item.name || "Menu Item";
                        const itemPrice = item.price || item.menu?.price || 0;
                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-xs bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-100/80"
                          >
                            <span className="font-medium text-neutral-800">
                              <span className="font-bold text-neutral-900 bg-white border border-neutral-200/60 px-2 py-0.5 rounded-lg mr-2 shadow-2xs">
                                {item.quantity}x
                              </span>
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

                  {/* Rincian Pembayaran */}
                  <div className="bg-neutral-50/60 rounded-2xl p-4 border border-neutral-100 space-y-2 text-xs">
                    <div className="flex justify-between text-neutral-500 font-medium">
                      <span>Subtotal Produk</span>
                      <span className="font-mono font-semibold text-neutral-700">
                        Rp {itemsSubtotal.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium items-center">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          Diskon Kupon{" "}
                          {order.couponCode ? `(${order.couponCode})` : ""}
                        </span>
                        <span className="font-mono font-bold">
                          - Rp {discountAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}

                    {serviceFee > 0 && (
                      <div className="flex justify-between text-neutral-500 font-medium">
                        <span>Biaya Layanan</span>
                        <span className="font-mono font-semibold text-neutral-700">
                          Rp {serviceFee.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-neutral-200/60 flex justify-between items-center">
                      <span className="text-neutral-900 font-extrabold uppercase tracking-wider text-[10px]">
                        Total Pembayaran
                      </span>
                      <span className="font-mono text-emerald-600 text-sm md:text-base font-black">
                        Rp {order.totalAmount?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Tombol ke Waiting Page */}
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() =>
                        navigate(`/waiting/${order._id}?table=${tableNumber}`)
                      }
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-5 py-3 rounded-2xl transition-all cursor-pointer shadow-sm group"
                    >
                      <Receipt className="w-4 h-4 text-neutral-300" />
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
    </div>
  );
}
