const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true }, // Disesuaikan menjadi Number agar konsisten dengan model Table
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    items: [
      {
        menu: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
        quantity: { type: Number, required: true },
        // --- TAMBAHAN UNTUK MENYIMPAN PILIHAN KUSTOMISASI PAKET PROMO ---
        selectedBundleChoices: { type: Map, of: String, default: {} },
      },
    ],
    subtotal: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // Tambahan untuk metode pembayaran: 'qris' atau 'cash'
    paymentMethod: {
      type: String,
      enum: ["qris", "cash"],
      default: "qris",
    },

    // Status pembayaran (ditambah 'cash_pending' untuk menandai pesanan cash yang menunggu konfirmasi kasir)
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cash_pending", "success", "settlement"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: ["pending", "processing", "ready", "completed"],
      default: "pending",
    },
    // Tambahan untuk diskon dan biaya layanan:
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    serviceFee: { type: Number, default: 0 }, // Biaya Layanan (misal: 5%)
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
