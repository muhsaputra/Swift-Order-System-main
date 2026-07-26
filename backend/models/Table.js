const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true, unique: true },
    capacity: { type: Number, required: true, default: 4 },

    // Status meja untuk indikator real-time
    isOccupied: { type: Boolean, default: false },

    // Menyimpan ID pesanan aktif yang sedang menduduki meja ini
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    // Posisi untuk layout mapping visual di frontend (opsional/tetap dipertahankan)
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Table", tableSchema);
