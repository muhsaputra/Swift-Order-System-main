import React, { useState, useEffect } from "react";
import API from "../services/api";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import {
  Plus,
  Trash2,
  Printer,
  Download,
  Sparkles,
  LayoutGrid,
  AlertTriangle,
  Copy,
} from "lucide-react";
import jsPDF from "jspdf";

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchTables();

    // Memastikan koneksi Socket.io selalu mengarah ke backend online Render
    const backendUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : "https://swiftorder.space";

    const socket = io(backendUrl, {
      transports: ["websocket", "polling"],
    });

    socket.on("table-updated", (updatedTable) => {
      setTables((prevTables) =>
        prevTables.map((t) => (t._id === updatedTable._id ? updatedTable : t)),
      );
    });

    return () => socket.disconnect();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await API.get("/tables");
      setTables(res.data);
    } catch (err) {
      console.error("Gagal memuat data meja", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      await API.post("/tables", {
        tableNumber: Number(tableNumber),
        capacity: 4,
      });
      setTableNumber("");
      fetchTables();
      toast.success("Meja baru berhasil ditambahkan!");
    } catch (err) {
      console.error("Gagal menambah meja", err);
      toast.error(err.response?.data?.error || "Gagal menambah meja");
    }
  };

  const confirmDeleteTable = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/tables/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchTables();
      toast.success("Meja berhasil dihapus.");
    } catch (err) {
      console.error("Gagal menghapus meja", err);
      toast.error("Gagal menghapus meja.");
    }
  };

  // FUNGSI SALIN URL MEJA KE CLIPBOARD
  const handleCopyTableUrl = (tableNumber) => {
    const tableUrl = `https://swiftorderingsystemfrontend.vercel.app/order/${tableNumber}`;

    navigator.clipboard
      .writeText(tableUrl)
      .then(() => {
        toast.success(`URL Meja #${tableNumber} berhasil disalin! 📋`);
      })
      .catch((err) => {
        console.error("Gagal menyalin URL:", err);
        toast.error("Gagal menyalin URL ke clipboard.");
      });
  };

  // FUNGSI DOWNLOAD QR CODE KE PDF RESOLUSI TINGGI (TIDAK BURAM)
  const handleDownloadQRPDF = (table) => {
    const svgElement = document.getElementById(`qr-svg-${table._id}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const scale = 4;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      const pngData = canvas.toDataURL("image/png", 1.0);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [100, 140],
      });

      const pageWidth = 100;
      let y = 20;

      doc.setFont("courier", "bold");
      doc.setFontSize(16);
      doc.text("SWIFT ORDERING", pageWidth / 2, y, { align: "center" });

      y += 6;
      doc.setFontSize(10);
      doc.setFont("courier", "normal");
      doc.text("Scan untuk Memesan Menu", pageWidth / 2, y, {
        align: "center",
      });

      y += 6;
      doc.setLineDash([1, 1], 0);
      doc.line(15, y, pageWidth - 15, y);

      y += 18;
      doc.setFont("courier", "bold");
      doc.setFontSize(24);
      doc.text(`MEJA #${table.tableNumber}`, pageWidth / 2, y, {
        align: "center",
      });

      y += 10;
      const qrSize = 60;
      const xPos = (pageWidth - qrSize) / 2;
      doc.addImage(pngData, "PNG", xPos, y, qrSize, qrSize);

      y += 68;
      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      doc.text(
        "Arahkan kamera ponsel Anda ke QR Code di atas",
        pageWidth / 2,
        y,
        {
          align: "center",
        },
      );
      y += 4;
      doc.text("untuk melihat katalog menu dan memesan.", pageWidth / 2, y, {
        align: "center",
      });

      doc.save(`QRCode-Meja-${table.tableNumber}.pdf`);
      toast.success(`PDF QR Code Meja #${table.tableNumber} berhasil diunduh!`);
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQR = (table) => {
    const printWindow = window.open("", "_blank", "width=400,height=500");
    if (!printWindow) return;

    // URL dinamis untuk cetak menggunakan domain Vercel yang benar
    const targetUrl = `https://swiftorderingsystemfrontend.vercel.app/order/${table.tableNumber}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code Meja #${table.tableNumber}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            .card { border: 2px dashed #000; padding: 30px; border-radius: 16px; display: inline-block; }
            h1 { font-size: 28px; margin-bottom: 10px; }
            p { font-size: 14px; color: #555; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>MEJA #${table.tableNumber}</h1>
            <p>Scan QR Code di bawah untuk memesan menu</p>
            <div id="qrcode"></div>
          </div>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <script>
            window.onload = function() {
              new QRCode(document.getElementById("qrcode"), {
                text: "${targetUrl}",
                width: 200,
                height: 200
              });
              setTimeout(() => { window.print(); window.close(); }, 500);
            }
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
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 filter brightness-50 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manajemen Meja Pelanggan</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Manajemen Meja & Status Real-Time
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-lg leading-relaxed">
              Pantau ketersediaan meja restoran secara langsung (Terisi/Kosong)
              dan kelola QR Code meja.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  Total Meja
                </p>
                <p className="text-sm font-extrabold text-white">
                  {tables.length} Meja Terdaftar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-8">
        {/* Header & Form Tambah Meja */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200/80 gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">
              Daftar Meja Restoran
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Status meja akan otomatis berubah saat pelanggan memesan atau
              pesanan selesai.
            </p>
          </div>

          <form
            onSubmit={handleAddTable}
            className="flex gap-2 self-start sm:self-auto"
          >
            <input
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="No. Meja..."
              required
              className="bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 transition font-medium w-36 shadow-2xs"
            />
            <button
              type="submit"
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Meja</span>
            </button>
          </form>
        </header>

        {/* Grid Daftar Meja */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-500 font-medium">
              Memuat daftar meja...
            </p>
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-16 bg-white border border-neutral-200/80 rounded-3xl shadow-2xs space-y-3">
            <p className="text-sm font-bold text-neutral-700">
              Belum ada meja yang terdaftar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tables.map((table) => {
              const isOccupied = table.isOccupied;

              return (
                <div
                  key={table._id}
                  className={`bg-white border p-6 rounded-3xl flex flex-col items-center justify-between space-y-4 shadow-2xs hover:shadow-md transition relative overflow-hidden ${
                    isOccupied
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-neutral-200/80"
                  }`}
                >
                  {/* Status Badge */}
                  <div className="w-full flex justify-between items-center">
                    <span className="text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider">
                      Meja Restoran
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                        isOccupied
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {isOccupied ? "Terisi" : "Kosong"}
                    </span>
                  </div>

                  <div className="text-center">
                    <h3 className="text-2xl font-black text-neutral-900">
                      #{table.tableNumber}
                    </h3>
                  </div>

                  {/* QR Code diarahkan ke domain Vercel yang benar */}
                  <div className="bg-neutral-50 p-4 rounded-3xl border border-neutral-100 shadow-2xs">
                    <QRCodeSVG
                      id={`qr-svg-${table._id}`}
                      value={`https://swiftorderingsystemfrontend.vercel.app/order/${table.tableNumber}`}
                      size={110}
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-full pt-3 border-t border-neutral-100">
                    <button
                      onClick={() => handleDownloadQRPDF(table)}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 rounded-2xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR PDF</span>
                    </button>

                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleCopyTableUrl(table.tableNumber)}
                        className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-2 rounded-xl text-xs font-semibold transition border border-neutral-200/80 shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                        title="Salin URL Meja"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Salin URL
                      </button>
                      <button
                        onClick={() => handlePrintQR(table)}
                        className="flex-1 bg-white hover:bg-neutral-50 text-neutral-700 py-2 rounded-xl text-xs font-semibold transition border border-neutral-200/80 shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak
                      </button>
                      <button
                        onClick={() => setDeleteTarget(table)}
                        className="bg-white hover:bg-red-50 text-neutral-700 hover:text-red-600 px-3 py-2 rounded-xl text-xs font-bold transition border border-neutral-200/80 hover:border-red-200 shadow-2xs cursor-pointer flex items-center justify-center"
                        title="Hapus Meja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* POPUP KONFIRMASI HAPUS */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900">
                  Hapus Meja Ini?
                </h3>
                <p className="text-xs text-neutral-500">
                  Tindakan ini akan menghapus{" "}
                  <span className="font-bold text-neutral-800">
                    Meja #{deleteTarget.tableNumber}
                  </span>{" "}
                  secara permanen.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTable}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
