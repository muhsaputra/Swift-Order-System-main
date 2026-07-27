const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 }, // Field untuk menyimpan harga coret / promo
    image: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },

    // --- FITUR BUNDLE / PAKET PROMO ---
    isBundle: { type: Boolean, default: false },
    bundleItems: [
      {
        menu: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
        quantity: { type: Number, default: 1 },
      },
    ],
    bundleOptions: [
      {
        title: { type: String }, // Contoh: "Pilih Minuman"
        choices: [{ type: String }], // Contoh: ["Es Teh Manis", "Lemon Tea"]
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Menu", menuSchema);
