import React, { useState, useEffect, useRef } from "react";
import API from "../../services/api";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";
import { gooeyToast } from "goey-toast";
import {
  Plus,
  Trash2,
  Printer,
  Download,
  Sparkles,
  LayoutGrid,
  AlertTriangle,
  Copy,
  Move,
  Grid,
  Search,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import jsPDF from "jspdf";

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [selectedArea, setSelectedArea] = useState("Indoor");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeAreaTab, setActiveAreaTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // State untuk Modal & Zoom Kanvas
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.6); // 1 = 100%, range 0.5 - 1.5

  // State untuk melacak pergerakan drag menggunakan Mouse Interaktif
  const [draggingTableId, setDraggingTableId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchTables();

    const socket = io("https://api.swiftorder.space", {
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
      const randomX = 40 + (tables.length % 5) * 280;
      const randomY = 40 + Math.floor(tables.length / 5) * 190;

      await API.post("/tables", {
        tableNumber: Number(tableNumber),
        capacity: Number(capacity),
        area: selectedArea,
        position: { x: randomX, y: randomY },
      });
      setTableNumber("");
      setCapacity(4);
      setIsAddModalOpen(false);
      fetchTables();
      gooeyToast.success("Meja baru berhasil ditambahkan ke kanvas!");
    } catch (err) {
      console.error("Gagal menambah meja", err);
      gooeyToast.error(err.response?.data?.error || "Gagal menambah meja");
    }
  };

  const confirmDeleteTable = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/tables/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchTables();
      gooeyToast.success("Meja berhasil dihapus.");
    } catch (err) {
      console.error("Gagal menghapus meja", err);
      gooeyToast.error("Gagal menghapus meja.");
    }
  };

  // Handler Drag & Drop dengan Memperhitungkan Zoom Level
  const handleMouseDown = (e, table) => {
    if (e.target.closest("button")) return;

    setDraggingTableId(table._id);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentX = table.position?.x || 40;
    const currentY = table.position?.y || 80;

    setDragOffset({
      x:
        (e.clientX - canvasRect.left + canvasRef.current.scrollLeft) /
          zoomLevel -
        currentX,
      y:
        (e.clientY - canvasRect.top + canvasRef.current.scrollTop) / zoomLevel -
        currentY,
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingTableId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(
      15,
      (e.clientX - canvasRect.left + canvasRef.current.scrollLeft) / zoomLevel -
        dragOffset.x,
    );
    const newY = Math.max(
      15,
      (e.clientY - canvasRect.top + canvasRef.current.scrollTop) / zoomLevel -
        dragOffset.y,
    );

    setTables((prev) =>
      prev.map((t) =>
        t._id === draggingTableId
          ? { ...t, position: { x: newX, y: newY } }
          : t,
      ),
    );
  };

  const handleMouseUp = async () => {
    if (!draggingTableId) return;

    const targetTable = tables.find((t) => t._id === draggingTableId);
    if (targetTable) {
      try {
        await API.patch(`/tables/${draggingTableId}/position`, {
          position: targetTable.position,
        });
      } catch (err) {
        console.error("Gagal menyimpan posisi meja", err);
        gooeyToast.error("Gagal menyimpan posisi baru meja.");
      }
    }
    setDraggingTableId(null);
  };

  const handleAutoArrange = async () => {
    try {
      const updatedTables = [...tables];
      for (let i = 0; i < updatedTables.length; i++) {
        const x = 40 + (i % 4) * 300;
        const y = 40 + Math.floor(i / 4) * 200;
        updatedTables[i].position = { x, y };

        await API.patch(`/tables/${updatedTables[i]._id}/position`, {
          position: { x, y },
        });
      }
      setTables(updatedTables);
      gooeyToast.success("Tata letak meja berhasil dirapikan otomatis! ✨");
    } catch (err) {
      console.error("Gagal merapikan tata letak", err);
      gooeyToast.error("Gagal merapikan posisi meja.");
    }
  };

  const handleCopyTableUrl = (tableNumber) => {
    const tableUrl = `https://www.swiftorder.space/order/${tableNumber}`;
    navigator.clipboard
      .writeText(tableUrl)
      .then(() => {
        gooeyToast.success(`URL Meja #${tableNumber} berhasil disalin! 📋`);
      })
      .catch((err) => {
        console.error("Gagal menyalin URL:", err);
        gooeyToast.error("Gagal menyalin URL ke clipboard.");
      });
  };

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

      y += 6;
      doc.setFontSize(10);
      doc.text(`Area: ${table.area || "Indoor"}`, pageWidth / 2, y, {
        align: "center",
      });

      y += 10;
      const qrSize = 56;
      const xPos = (pageWidth - qrSize) / 2;
      doc.addImage(pngData, "PNG", xPos, y, qrSize, qrSize);

      y += 64;
      doc.setFontSize(8);
      doc.setFont("courier", "normal");
      doc.text(
        "Arahkan kamera ponsel Anda ke QR Code di atas",
        pageWidth / 2,
        y,
        { align: "center" },
      );
      y += 4;
      doc.text("untuk melihat katalog menu dan memesan.", pageWidth / 2, y, {
        align: "center",
      });

      doc.save(`QRCode-Meja-${table.tableNumber}.pdf`);
      gooeyToast.success(
        `PDF QR Code Meja #${table.tableNumber} berhasil diunduh!`,
      );
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQR = (table) => {
    const printWindow = window.open("", "_blank", "width=400,height=500");
    if (!printWindow) return;

    const targetUrl = `https://www.swiftorder.space/order/${table.tableNumber}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code Meja #${table.tableNumber}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            .card { border: 2px dashed #000; padding: 30px; border-radius: 16px; display: inline-block; }
            h1 { font-size: 28px; margin-bottom: 5px; }
            h3 { font-size: 14px; color: #666; margin-bottom: 15px; }
            p { font-size: 14px; color: #555; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>MEJA #${table.tableNumber}</h1>
            <h3>Area: ${table.area || "Indoor"}</h3>
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

  // Filter berdasarkan Area Tab & Search Query
  const filteredTables = tables.filter((t) => {
    const matchesArea =
      activeAreaTab === "All" || (t.area || "Indoor") === activeAreaTab;
    const matchesSearch =
      searchQuery === "" ||
      t.tableNumber.toString().includes(searchQuery) ||
      (t.area && t.area.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesArea && matchesSearch;
  });

  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 4), 0);

  return (
    <div className="min-h-screen bg-sky-50/40 text-slate-900 pb-20">
      {/* HERO BANNER - Nuansa Biru Terang */}
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-900 text-white py-10 px-6 md:px-12 overflow-hidden mb-8 shadow-xl rounded-[2.5rem]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 filter brightness-50 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-blue-900/40 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-sky-100 border border-white/25 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>Manajemen Meja & Denah Cafe</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Kanvas Tata Letak Meja Interaktif
            </h1>
            <p className="text-xs md:text-sm text-sky-100 max-w-lg leading-relaxed">
              Seret dan letakkan kartu meja di atas area kanvas grid luas untuk
              mengatur denah kafe secara bebas dan profesional.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-white text-blue-900 flex items-center justify-center font-black shadow-sm">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-sky-200 font-bold">
                  Total Kapasitas
                </p>
                <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-200" /> {totalCapacity}{" "}
                  Kursi ({tables.length} Meja)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-8">
        {/* Tombol Pemicu Modal Tambah Meja */}
        <div className="flex justify-between items-center bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Pengaturan Denah Ruangan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola penambahan meja baru serta atur tata letak area restoran
              Anda.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs font-bold transition shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-sky-200" />
            <span>Tambah Meja Baru</span>
          </button>
        </div>

        {/* TOOLBAR KANVAS & FILTER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {["All", "Indoor", "Outdoor", "VIP", "Lantai 2"].map((area) => (
              <button
                key={area}
                onClick={() => setActiveAreaTab(area)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-2xs ${
                  activeAreaTab === area
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                }`}
              >
                {area === "All" ? "Semua Area" : area}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No. Meja..."
                className="bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 transition w-44 shadow-2xs font-medium"
              />
            </div>

            <button
              onClick={handleAutoArrange}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs shrink-0"
              title="Susun ulang semua meja secara otomatis"
            >
              <Grid className="w-4 h-4 text-blue-600" />
              <span>Atur Posisi Otomatis</span>
            </button>
          </div>
        </div>

        {/* KANVAS GRID INTERAKTIF DENGAN FITUR ZOOM IN / OUT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">
              Memuat kanvas tata letak...
            </p>
          </div>
        ) : (
          <div
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative w-full h-[750px] bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-auto shadow-2xl p-6 select-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.08) 1.5px, transparent 1.5px)",
              backgroundSize: `${32 * zoomLevel}px ${32 * zoomLevel}px`,
            }}
          >
            {/* Header Sticky: Petunjuk & Kontrol Zoom */}
            <div className="sticky top-0 left-0 right-0 z-30 flex justify-between items-center pointer-events-none">
              <div className="inline-flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs font-semibold text-sky-200 shadow-lg pointer-events-auto">
                <Move className="w-4 h-4 animate-pulse text-sky-400" />
                <span>
                  Area Kanvas Luas: Klik & seret kartu meja secara bebas
                </span>
              </div>

              {/* Tombol Kontrol Zoom */}
              <div className="inline-flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg pointer-events-auto">
                <button
                  onClick={() =>
                    setZoomLevel((prev) => Math.max(0.5, prev - 0.1))
                  }
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold transition cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  onClick={() =>
                    setZoomLevel((prev) => Math.min(1.5, prev + 0.1))
                  }
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filteredTables.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                Tidak ada meja yang ditemukan pada area atau pencarian ini.
              </div>
            ) : (
              <div
                className="relative transition-transform duration-75 origin-top-left"
                style={{
                  width: `${1800 * zoomLevel}px`,
                  height: `${1400 * zoomLevel}px`,
                }}
              >
                {filteredTables.map((table) => {
                  const isOccupied = table.isOccupied;
                  const posX = (table.position?.x || 40) * zoomLevel;
                  const posY = (table.position?.y || 80) * zoomLevel;
                  const isDragging = draggingTableId === table._id;

                  return (
                    <div
                      key={table._id}
                      onMouseDown={(e) => handleMouseDown(e, table)}
                      style={{
                        position: "absolute",
                        left: `${posX}px`,
                        top: `${posY}px`,
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: "top left",
                      }}
                      className={`w-72 bg-white border rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 cursor-grab active:cursor-grabbing hover:shadow-2xl transition-all duration-200 ${
                        isOccupied
                          ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10"
                          : "border-slate-200/80"
                      } ${isDragging ? "opacity-95 shadow-2xl ring-4 ring-blue-500/30 z-30" : ""}`}
                    >
                      {/* Header Kartu Meja */}
                      <div className="flex justify-between items-center pointer-events-none">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Move className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">
                            {table.area || "Indoor"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 font-mono">
                            {Math.round(table.position?.x || 40)},{" "}
                            {Math.round(table.position?.y || 80)}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              isOccupied
                                ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isOccupied ? "Terisi" : "Kosong"}
                          </span>
                        </div>
                      </div>

                      {/* Detail Meja & QR */}
                      <div className="flex items-center justify-between gap-3 pointer-events-none">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">
                            Meja #{table.tableNumber}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Kapasitas: {table.capacity || 4} Kursi
                          </p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 shadow-2xs shrink-0">
                          <QRCodeSVG
                            id={`qr-svg-${table._id}`}
                            value={`https://www.swiftorder.space/order/${table.tableNumber}`}
                            size={56}
                          />
                        </div>
                      </div>

                      {/* Tombol Aksi Cepat */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs">
                        <button
                          onClick={() => handleDownloadQRPDF(table)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-blue-600/20"
                          title="Download PDF QR"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-200" /> PDF
                        </button>
                        <button
                          onClick={() => handleCopyTableUrl(table.tableNumber)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-semibold transition cursor-pointer shadow-2xs border border-slate-200"
                          title="Salin URL Meja"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintQR(table)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-semibold transition cursor-pointer shadow-2xs border border-slate-200"
                          title="Cetak QR"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(table)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl font-bold transition cursor-pointer shadow-2xs border border-red-200"
                          title="Hapus Meja"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL TAMBAH MEJA BARU */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-md space-y-6 shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black shadow-md shadow-blue-600/20">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Tambah Meja Baru
                    </h3>
                    <p className="text-xs text-slate-500">
                      Masukkan nomor meja, kapasitas, dan area ruangan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTable} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor Meja
                  </label>
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Contoh: 5"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 transition font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Kapasitas Kursi
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Contoh: 4"
                    min={1}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 transition font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Zona Area Ruangan
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 transition font-medium cursor-pointer"
                  >
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="VIP">VIP</option>
                    <option value="Lantai 2">Lantai 2</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-xs font-bold transition shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    Simpan Meja
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* POPUP KONFIRMASI HAPUS */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Meja Ini?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan menghapus{" "}
                  <span className="font-bold text-slate-800">
                    Meja #{deleteTarget.tableNumber}
                  </span>{" "}
                  secara permanen.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
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
