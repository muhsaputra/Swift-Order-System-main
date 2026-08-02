const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true }, // Contoh: Beras, Minyak Goreng, Daging Ayam
  category: { type: String, default: "Bahan Baku" }, // Bahan Baku, Minuman, Kemasan, dll.
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true }, // kg, liter, pcs, gram, porsi
  minAlert: { type: Number, default: 5 }, // Batas minimum stok untuk notifikasi peringatan
  costPerUnit: { type: Number, required: true, default: 0 }, // Harga beli per satuan untuk perhitungan HPP
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Inventory", inventorySchema);
