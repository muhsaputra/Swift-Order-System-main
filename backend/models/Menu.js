const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    image: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },

    isBundle: { type: Boolean, default: false },
    bundleItems: [
      {
        menu: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
        quantity: { type: Number, default: 1 },
      },
    ],
    // Add-On dengan harga masing-masing
    bundleOptions: [
      {
        title: { type: String }, // Contoh: "ADD ON"
        choices: [
          {
            name: { type: String }, // Contoh: "Extra Keju"
            price: { type: Number, default: 0 }, // Contoh: 5000
          },
        ],
      },
    ],

    // --- INTEGRASI INVENTARIS: Resep / Takaran Bahan Baku (BOM) ---
    ingredients: [
      {
        inventoryItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
          required: true,
        },
        qtyNeeded: {
          type: Number,
          required: true,
          default: 0,
        }, // Jumlah takaran bahan yang dihabiskan untuk 1 porsi menu ini (misal: 0.2 kg beras)
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Menu", menuSchema);
