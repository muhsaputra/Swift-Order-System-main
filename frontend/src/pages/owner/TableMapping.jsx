import React, { useState, useEffect } from "react";
import axios from "axios";

export default function TableMapping() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [newTableNum, setNewTableNum] = useState("");
  const [newCapacity, setNewCapacity] = useState("");

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/tables");
      setTables(res.data);
    } catch (err) {
      console.error("Gagal memuat data meja:", err);
    }
  };

  // Fungsi untuk menambah meja baru dengan posisi awal default
  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5001/api/tables", {
        tableNumber: newTableNum,
        capacity: Number(newCapacity),
        position: { x: 50, y: 50 }, // Posisi awal default di area canvas
      });
      setTables([...tables, res.data]);
      setNewTableNum("");
      setNewCapacity("");
    } catch (err) {
      console.error("Gagal menambah meja:", err);
    }
  };

  // Fungsi untuk mengupdate posisi meja saat digeser (Drag / Klik tombol arah)
  const handleUpdatePosition = async (id, currentX, currentY, direction) => {
    let newX = currentX;
    let newY = currentY;
    const step = 40; // Besar pergeseran dalam piksel

    if (direction === "left") newX -= step;
    if (direction === "right") newX += step;
    if (direction === "up") newY -= step;
    if (direction === "down") newY += step;

    // Batasi agar tidak keluar area canvas
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;

    try {
      const res = await axios.patch(`http://localhost:5001/api/tables/${id}`, {
        position: { x: newX, y: newY },
      });
      setTables(tables.map((t) => (t._id === id ? res.data : t)));
    } catch (err) {
      console.error("Gagal memperbarui posisi meja:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        Denah & Manajemen Meja Interaktif
      </h2>

      {/* Form Tambah Meja */}
      <form
        onSubmit={handleAddTable}
        className="mb-6 flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm"
      >
        <input
          type="text"
          placeholder="Nomor Meja (Cth: 01)"
          value={newTableNum}
          onChange={(e) => setNewTableNum(e.target.value)}
          className="border px-3 py-2 rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="Kapasitas Orang"
          value={newCapacity}
          onChange={(e) => setNewCapacity(e.target.value)}
          className="border px-3 py-2 rounded-lg"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          Tambah Meja
        </button>
      </form>

      {/* Area Canvas Denah Meja (Layout Mapping) */}
      <div className="relative w-full h-[600px] border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden p-4 shadow-inner">
        <p className="text-sm text-gray-400 absolute top-3 left-4">
          * Klik meja untuk mengatur posisi atau melihat statusnya.
        </p>

        {tables.map((table) => {
          const posX = table.position?.x || 0;
          const posY = table.position?.y || 0;

          return (
            <div
              key={table._id}
              onClick={() => setSelectedTable(table)}
              style={{
                transform: `translate(${posX}px, ${posY}px)`,
              }}
              className={`absolute w-32 p-3 rounded-xl shadow-md cursor-pointer transition-transform flex flex-col items-center justify-center ${
                table.status === "occupied"
                  ? "bg-red-100 border-red-500 text-red-700"
                  : table.status === "reserved"
                    ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                    : "bg-green-100 border-green-500 text-green-700"
              } border-2`}
            >
              <span className="font-bold text-base">
                Meja {table.tableNumber}
              </span>
              <span className="text-xs">Kapasitas: {table.capacity}</span>
              <span className="mt-1 px-2 py-0.5 text-[10px] rounded uppercase font-semibold bg-white/90">
                {table.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Panel Kontrol Posisi Meja yang Dipilih */}
      {selectedTable && (
        <div className="mt-6 bg-white p-4 rounded-xl shadow-md border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">
              Pengaturan Meja {selectedTable.tableNumber}
            </h3>
            <p className="text-sm text-gray-500">
              Gunakan tombol arah untuk memindahkan posisi meja di denah:
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleUpdatePosition(
                  selectedTable._id,
                  selectedTable.position.x,
                  selectedTable.position.y,
                  "left",
                )
              }
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold"
            >
              ← Kiri
            </button>
            <div className="flex flex-col gap-1">
              <button
                onClick={() =>
                  handleUpdatePosition(
                    selectedTable._id,
                    selectedTable.position.x,
                    selectedTable.position.y,
                    "up",
                  )
                }
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 font-bold text-xs"
              >
                ▲ Atas
              </button>
              <button
                onClick={() =>
                  handleUpdatePosition(
                    selectedTable._id,
                    selectedTable.position.x,
                    selectedTable.position.y,
                    "down",
                  )
                }
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 font-bold text-xs"
              >
                ▼ Bawah
              </button>
            </div>
            <button
              onClick={() =>
                handleUpdatePosition(
                  selectedTable._id,
                  selectedTable.position.x,
                  selectedTable.position.y,
                  "right",
                )
              }
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold"
            >
              Kanan →
            </button>
            <button
              onClick={() => setSelectedTable(null)}
              className="ml-4 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
