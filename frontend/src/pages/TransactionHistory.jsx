import React, { useState, useEffect, useRef } from "react";
import API from "../services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Eye,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar as CalendarIcon,
  Filter,
  Sparkles,
  Receipt,
  Search,
  Tag,
  Percent,
  BarChart3,
  Activity,
} from "lucide-react";

// Import react-day-picker dan stylenya
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function TransactionHistory() {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Modal Detail Item & Struk
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // State untuk Pencarian & Filter Metode Pembayaran
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");

  // State untuk Filter Rentang Waktu Grafik (Seminggu, Sebulan, Semua)
  const [chartTimeRange, setChartTimeRange] = useState("week");

  // State untuk Filter Kalender Interaktif
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const calendarRef = useRef(null);

  // State untuk Pagination (10 data per halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCompletedOrders();

    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCompletedOrders = async () => {
    try {
      const res = await API.get("/orders");
      const filtered = res.data.filter(
        (order) => order.orderStatus === "completed",
      );
      setCompletedOrders(filtered);
    } catch (err) {
      console.error("Gagal memuat riwayat transaksi", err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open("", "_blank", "width=300,height=650");
    if (!printWindow) return;

    let calculatedSubtotal = order.items.reduce((acc, item) => {
      const p = item.price || item.menu?.price || 0;
      return acc + p * item.quantity;
    }, 0);

    const serviceFeeAmount =
      order.serviceFee && order.serviceFee > 0
        ? order.serviceFee
        : Math.round((calculatedSubtotal - (order.discountAmount || 0)) * 0.05);

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
            Meja: #${order.tableNumber}<br/>
            Metode: ${(order.paymentMethod || "qris").toUpperCase()}<br/>
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
                  <td colspan="2">${name}</td>
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
              <td class="right">Rp ${calculatedSubtotal.toLocaleString("id-ID")}</td>
            </tr>
            ${
              order.discountAmount > 0
                ? `
            <tr>
              <td>Kupon (${order.couponCode || "PROMO"})</td>
              <td class="right">- Rp ${order.discountAmount.toLocaleString("id-ID")}</td>
            </tr>`
                : ""
            }
            <tr>
              <td>Biaya Layanan (5%)</td>
              <td class="right">Rp ${serviceFeeAmount.toLocaleString("id-ID")}</td>
            </tr>
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

  // Filter Data Utama Tabel (Tanggal, Metode Pembayaran, Search Nama/Meja)
  const filteredOrders = completedOrders.filter((order) => {
    if (!order.createdAt) return false;

    if (selectedDate) {
      const orderDateObj = new Date(order.createdAt);
      const isSameDate =
        orderDateObj.getDate() === selectedDate.getDate() &&
        orderDateObj.getMonth() === selectedDate.getMonth() &&
        orderDateObj.getFullYear() === selectedDate.getFullYear();
      if (!isSameDate) return false;
    }

    if (selectedPaymentMethod !== "all") {
      const method = (order.paymentMethod || "qris").toLowerCase();
      if (method !== selectedPaymentMethod) return false;
    }

    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase();
      const matchName = order.customerName?.toLowerCase().includes(query);
      const matchTable = String(order.tableNumber)
        .toLowerCase()
        .includes(query);
      const matchId = order._id.slice(-6).toLowerCase().includes(query);
      if (!matchName && !matchTable && !matchId) return false;
    }

    return true;
  });

  // Kalkulasi Metrik Keuangan
  const totalRevenue = filteredOrders.reduce(
    (acc, order) => acc + (order.totalAmount || 0),
    0,
  );
  const totalServiceFee = filteredOrders.reduce((acc, order) => {
    const sub = order.items.reduce(
      (s, i) => s + (i.price || i.menu?.price || 0) * i.quantity,
      0,
    );
    const fee =
      order.serviceFee && order.serviceFee > 0
        ? order.serviceFee
        : Math.round((sub - (order.discountAmount || 0)) * 0.05);
    return acc + fee;
  }, 0);
  const totalDiscount = filteredOrders.reduce(
    (acc, order) => acc + (order.discountAmount || 0),
    0,
  );

  const handleDownloadReport = () => {
    const dataToExport =
      completedOrders.length > 0 ? completedOrders : filteredOrders;

    if (dataToExport.length === 0) {
      alert("Tidak ada data transaksi yang tersedia untuk diunduh.");
      return;
    }

    const dateLabel = selectedDate
      ? selectedDate.toISOString().split("T")[0]
      : "Semua_Periode";

    const totalRevAll = dataToExport.reduce(
      (acc, order) => acc + (order.totalAmount || 0),
      0,
    );
    const totalDiscAll = dataToExport.reduce(
      (acc, order) => acc + (order.discountAmount || 0),
      0,
    );
    const totalFeeAll = dataToExport.reduce((acc, order) => {
      const sub = order.items.reduce(
        (s, i) => s + (i.price || i.menu?.price || 0) * i.quantity,
        0,
      );
      const fee =
        order.serviceFee && order.serviceFee > 0
          ? order.serviceFee
          : Math.round((sub - (order.discountAmount || 0)) * 0.05);
      return acc + fee;
    }, 0);

    // Gunakan BOM UTF-8 agar Excel mengenali format teks dengan benar
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";

    // 1. Header Kolom Tabel Utama (Pemisah menggunakan titik koma ;)
    csvContent += `ID Pesanan;Waktu Transaksi;Nomor Meja;Nama Pelanggan;Metode Pembayaran;Daftar Item Menu;Subtotal (Rp);Diskon Kupon (Rp);Service Fee 5% (Rp);Total Pembayaran (Rp);Status\r\n`;

    // 2. Baris Data Transaksi Selesai
    dataToExport.forEach((order) => {
      const id = `#${order._id.slice(-6).toUpperCase()}`;
      const time = `${new Date(order.createdAt).toLocaleString("id-ID")}`;
      const table = `Meja #${order.tableNumber}`;
      const customer = `${order.customerName.replace(/;/g, ",").replace(/"/g, '""')}`;
      const method = `${(order.paymentMethod || "QRIS").toUpperCase()}`;

      const itemsSummary = order.items
        .map((item) => {
          const name = item.menu?.name || item.name || "Menu";
          return `${item.quantity}x ${name}`;
        })
        .join(" | ");
      const itemsFormatted = `"${itemsSummary}"`;

      const sub = order.items.reduce(
        (s, i) => s + (i.price || i.menu?.price || 0) * i.quantity,
        0,
      );
      const disc = order.discountAmount || 0;
      const fee =
        order.serviceFee && order.serviceFee > 0
          ? order.serviceFee
          : Math.round((sub - disc) * 0.05);
      const total = order.totalAmount;
      const status = `SELESAI`;

      csvContent += `${id};${time};${table};"${customer}";${method};${itemsFormatted};${sub};${disc};${fee};${total};${status}\r\n`;
    });

    // 3. Baris Rekapitulasi Total di Bagian Bawah
    csvContent += `\r\n`;
    csvContent += `REKAPITULASI KESELURUHAN;;;;;;;;;;\r\n`;
    csvContent += `Total Transaksi Berhasil;${dataToExport.length} Pesanan;;;;;;;;;;\r\n`;
    csvContent += `Total Akumulasi Diskon;- Rp ${totalDiscAll.toLocaleString("id-ID")};;;;;;;;;;\r\n`;
    csvContent += `Total Akumulasi Service Fee;Rp ${totalFeeAll.toLocaleString("id-ID")};;;;;;;;;;\r\n`;
    csvContent += `TOTAL PENDAPATAN BERSIH;Rp ${totalRevAll.toLocaleString("id-ID")};;;;;;;;;;\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_${dateLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // --- LOGIKA ANALITIK GRAFIK (SEMINGGU, SEBULAN, SEMUA) ---
  const getFilteredChartData = () => {
    const now = new Date();
    let limitDate = null;

    if (chartTimeRange === "week") {
      limitDate = new Date();
      limitDate.setDate(now.getDate() - 7);
    } else if (chartTimeRange === "month") {
      limitDate = new Date();
      limitDate.setMonth(now.getMonth() - 1);
    }

    const sourceData = completedOrders.filter((order) => {
      if (!order.createdAt) return false;
      if (limitDate) {
        return new Date(order.createdAt) >= limitDate;
      }
      return true;
    });

    const grouped = {};
    sourceData.forEach((order) => {
      const d = new Date(order.createdAt);
      let key = "";
      if (chartTimeRange === "month") {
        key = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      } else if (chartTimeRange === "week") {
        key = d.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
        });
      } else {
        key = d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }

      grouped[key] = (grouped[key] || 0) + (order.totalAmount || 0);
    });

    const result = Object.keys(grouped).map((date) => ({
      date,
      sales: grouped[date],
    }));

    return result.length > 0 ? result : [{ date: "Hari Ini", sales: 0 }];
  };

  const chartData = getFilteredChartData();

  // --- LOGIKA ANALITIK TAMBAHAN (METODE PEMBAYARAN & KATEGORI TERLARIS) ---
  const paymentMethodStats = {};
  const categorySalesStats = {};

  filteredOrders.forEach((order) => {
    const method = (order.paymentMethod || "QRIS").toUpperCase();
    paymentMethodStats[method] =
      (paymentMethodStats[method] || 0) + (order.totalAmount || 0);

    order.items?.forEach((item) => {
      const cat = item.menu?.category || item.category || "Lainnya";
      const itemRev = (item.price || item.menu?.price || 0) * item.quantity;
      categorySalesStats[cat] = (categorySalesStats[cat] || 0) + itemRev;
    });
  });

  const categoryBarData = Object.keys(categorySalesStats).map((category) => ({
    category,
    revenue: categorySalesStats[category],
  }));

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-20">
      {/* HERO BANNER ATTRACTION */}
      <div className="relative bg-neutral-900 text-white py-10 px-6 md:px-12 overflow-hidden mb-8 shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 filter brightness-50 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Arsip & Riwayat Keuangan</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Riwayat Transaksi & Analitik
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-lg leading-relaxed">
              Pantau seluruh daftar pesanan selesai, rekapitulasi biaya layanan,
              diskon, dan analitik omset restoran secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/15 backdrop-blur-xl border border-white/20 p-4 rounded-3xl flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-300 font-bold">
                  Total Omset Bersih
                </p>
                <p className="text-sm font-black font-mono text-emerald-400">
                  Rp {totalRevenue.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-8">
        {/* Metrik Finansial Tambahan (Service Fee & Diskon Kupon) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-50 border border-neutral-200/80 p-5 rounded-3xl shadow-2xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                Akumulasi Service Fee (5%)
              </p>
              <p className="text-sm font-black font-mono text-neutral-900">
                Rp {totalServiceFee.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200/80 p-5 rounded-3xl shadow-2xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                Total Diskon Kupon
              </p>
              <p className="text-sm font-black font-mono text-red-600">
                - Rp {totalDiscount.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200/80 p-5 rounded-3xl shadow-2xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                Total Transaksi Selesai
              </p>
              <p className="text-sm font-black font-mono text-neutral-900">
                {filteredOrders.length} Pesanan
              </p>
            </div>
          </div>
        </div>

        {/* --- SECTION ANALITIK GRAFIK KOMPREHENSIF --- */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50 border border-neutral-200/80 p-5 rounded-3xl">
            <div>
              <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-neutral-900" />
                Dashboard Analitik & Performa Penjualan
              </h3>
              <p className="text-xs text-neutral-500">
                Grafik interaktif tren omset, distribusi metode bayar, dan omset
                kategori menu.
              </p>
            </div>

            {/* Tombol Filter Rentang Waktu Grafik */}
            <div className="flex items-center gap-1.5 bg-white border border-neutral-200 p-1.5 rounded-2xl shadow-2xs">
              <button
                onClick={() => setChartTimeRange("week")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  chartTimeRange === "week"
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Seminggu
              </button>
              <button
                onClick={() => setChartTimeRange("month")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  chartTimeRange === "month"
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Sebulan
              </button>
              <button
                onClick={() => setChartTimeRange("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  chartTimeRange === "all"
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Grafik Utama Tren Omset (Area Chart & Bar Chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tren Omset Area Chart */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Kurva Pertumbuhan Omset
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Akumulasi pendapatan bersih berdasarkan periode.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl border border-emerald-200">
                  {chartTimeRange === "week"
                    ? "7 Hari Terakhir"
                    : chartTimeRange === "month"
                      ? "30 Hari Terakhir"
                      : "Semua Periode"}
                </span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorSales"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#171717"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#171717"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                    <YAxis
                      stroke="#737373"
                      fontSize={11}
                      tickFormatter={(value) => `Rp ${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `Rp ${value.toLocaleString("id-ID")}`,
                        "Pendapatan",
                      ]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e5e5e5",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#171717"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performa Omset Berdasarkan Kategori Menu (Bar Chart) */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-neutral-900" />
                    Omset Berdasarkan Kategori Menu
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Kontribusi penjualan tiap kelompok produk.
                  </p>
                </div>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="category" stroke="#737373" fontSize={11} />
                    <YAxis
                      stroke="#737373"
                      fontSize={11}
                      tickFormatter={(value) => `Rp ${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `Rp ${value.toLocaleString("id-ID")}`,
                        "Omset",
                      ]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e5e5e5",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#262626"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Header & Tombol Download */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200/80 gap-4 pt-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
              Daftar Transaksi Selesai
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola dan telusuri arsip pesanan berdasarkan filter pencarian dan
              tanggal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadReport}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-3 rounded-2xl text-xs font-bold transition shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Laporan CSV</span>
            </button>
          </div>
        </header>

        {/* Bar Filter Terpadu (Search, Kalender, Metode Pembayaran) */}
        <div className="bg-white border border-neutral-200/80 p-5 rounded-3xl shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nama pelanggan atau nomor meja..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-neutral-50 border border-neutral-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-2 rounded-2xl">
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <select
                value={selectedPaymentMethod}
                onChange={(e) => {
                  setSelectedPaymentMethod(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Metode</option>
                <option value="qris">QRIS Midtrans</option>
                <option value="cash">Tunai (Cash)</option>
              </select>
            </div>

            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                className="flex items-center gap-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-800 transition cursor-pointer shadow-2xs"
              >
                <CalendarIcon className="w-4 h-4 text-neutral-500" />
                <span>
                  {selectedDate
                    ? selectedDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Semua Tanggal"}
                </span>
              </button>

              {showCalendarDropdown && (
                <div className="absolute right-0 mt-2 bg-white border border-neutral-200 rounded-3xl p-4 shadow-xl z-50">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setCurrentPage(1);
                      setShowCalendarDropdown(false);
                    }}
                    modifiersStyles={{
                      selected: {
                        backgroundColor: "#171717",
                        color: "white",
                        fontWeight: "bold",
                      },
                    }}
                    className="text-xs"
                  />
                  {selectedDate && (
                    <div className="pt-3 mt-3 border-t border-neutral-100 text-center">
                      <button
                        onClick={() => {
                          setSelectedDate(undefined);
                          setCurrentPage(1);
                          setShowCalendarDropdown(false);
                        }}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Tampilkan Semua Tanggal
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Transaksi */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-500 font-medium">
              Memuat riwayat transaksi...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-neutral-200/80 rounded-3xl shadow-2xs space-y-2">
            <p className="text-sm font-bold text-neutral-700">
              Tidak ada riwayat transaksi yang cocok dengan kriteria filter.
            </p>
            <p className="text-xs text-neutral-400">
              Coba ubah kata kunci pencarian atau reset filter tanggal.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-[11px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50">
                    <th className="py-4 px-6">ID Pesanan</th>
                    <th className="py-4 px-6">Waktu</th>
                    <th className="py-4 px-6">Meja</th>
                    <th className="py-4 px-6">Pelanggan</th>
                    <th className="py-4 px-6">Metode</th>
                    <th className="py-4 px-6">Total</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs text-neutral-700 font-medium">
                  {currentOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-neutral-50/60 transition"
                    >
                      <td className="py-4 px-6 font-mono text-neutral-400 font-semibold">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-4 px-6 font-mono text-neutral-500 text-[11px]">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-neutral-100 text-neutral-900 font-extrabold px-2.5 py-1 rounded-lg">
                          Meja #{order.tableNumber}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-neutral-900 truncate max-w-[150px]">
                        {order.customerName}
                      </td>
                      <td className="py-4 px-6">
                        <span className="uppercase text-[10px] font-bold bg-neutral-100 px-2 py-1 rounded-md text-neutral-600">
                          {order.paymentMethod || "QRIS"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-black text-emerald-600">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          SELESAI
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenModal(order)}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition border border-neutral-200/80 shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(order)}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 p-2 rounded-xl text-xs font-semibold transition border border-neutral-200/80 shadow-2xs cursor-pointer flex items-center justify-center"
                            title="Cetak Struk"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/30">
              <p className="text-xs text-neutral-500">
                Menampilkan{" "}
                <span className="font-bold text-neutral-800">
                  {filteredOrders.length > 0 ? indexOfFirstItem + 1 : 0}
                </span>{" "}
                hingga{" "}
                <span className="font-bold text-neutral-800">
                  {Math.min(indexOfLastItem, filteredOrders.length)}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-neutral-800">
                  {filteredOrders.length}
                </span>{" "}
                transaksi
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="bg-white hover:bg-neutral-100 text-neutral-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition border border-neutral-200/80 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>
                <span className="text-xs font-bold font-mono px-3 py-2 text-neutral-700 bg-white border border-neutral-200/80 rounded-xl shadow-2xs">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="bg-white hover:bg-neutral-100 text-neutral-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition border border-neutral-200/80 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail Item & Rincian Finansial Pesanan */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-md space-y-6 my-8 shadow-xl">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Detail Pesanan #{selectedOrder._id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Meja #{selectedOrder.tableNumber} •{" "}
                    {selectedOrder.customerName}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-2 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Daftar Item Menu Dibeli
                </span>
                <div className="space-y-2 bg-neutral-50/80 p-4 rounded-2xl border border-neutral-100 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item, idx) => {
                    const itemName =
                      item.menu?.name || item.name || "Menu Item";
                    const itemPrice = item.price || item.menu?.price || 0;
                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs py-1.5 border-b border-neutral-200/50 last:border-0"
                      >
                        <span className="text-neutral-800 font-medium flex items-center gap-2">
                          <span className="bg-neutral-200/80 text-neutral-900 font-mono font-bold px-2 py-0.5 rounded-md">
                            {item.quantity}x
                          </span>
                          {itemName}
                        </span>
                        <span className="font-mono text-neutral-600 font-semibold">
                          Rp{" "}
                          {(item.quantity * itemPrice).toLocaleString("id-ID")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rincian Subtotal, Kupon, & Service Fee dengan Fallback Otomatis */}
              <div className="space-y-2 bg-neutral-50/80 p-4 rounded-2xl border border-neutral-100 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal Menu</span>
                  <span className="font-mono font-semibold">
                    Rp{" "}
                    {selectedOrder.items
                      .reduce(
                        (acc, item) =>
                          acc +
                          (item.price || item.menu?.price || 0) * item.quantity,
                        0,
                      )
                      .toLocaleString("id-ID")}
                  </span>
                </div>

                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Kupon (
                      {selectedOrder.couponCode || "PROMO"})
                    </span>
                    <span className="font-mono">
                      - Rp{" "}
                      {selectedOrder.discountAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-800 font-medium">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-600" /> Biaya
                    Layanan (Service 5%)
                  </span>
                  <span className="font-mono font-semibold">
                    Rp{" "}
                    {(selectedOrder.serviceFee && selectedOrder.serviceFee > 0
                      ? selectedOrder.serviceFee
                      : Math.round(
                          (selectedOrder.items.reduce(
                            (acc, item) =>
                              acc +
                              (item.price || item.menu?.price || 0) *
                                item.quantity,
                            0,
                          ) -
                            (selectedOrder.discountAmount || 0)) *
                            0.05,
                        )
                    ).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-medium">
                    Waktu Transaksi
                  </span>
                  <span className="text-xs font-mono text-neutral-700">
                    {formatDateTime(selectedOrder.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-medium">
                    Total Pembayaran
                  </span>
                  <span className="text-base font-black font-mono text-emerald-600">
                    Rp {selectedOrder.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handlePrintReceipt(selectedOrder)}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border border-neutral-200 shadow-2xs"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Struk
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded-2xl text-xs font-bold transition cursor-pointer shadow-md"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
