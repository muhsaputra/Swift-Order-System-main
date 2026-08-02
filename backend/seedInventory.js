const mongoose = require("mongoose");
require("dotenv").config();

// Skema Inventory
const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  minAlert: { type: Number, required: true, default: 5 },
  costPerUnit: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

const Inventory = mongoose.model("Inventory", inventorySchema);

// Data Dummy Lengkap Bahan Baku Kafe & Resto
const dummyInventoryItems = [
  // Bahan Baku Utama & Sembako
  {
    itemName: "Beras Premium",
    category: "Bahan Baku",
    stock: 25,
    unit: "Kilogram (kg)",
    minAlert: 5,
    costPerUnit: 15000,
  },
  {
    itemName: "Daging Ayam Fillet",
    category: "Bahan Baku",
    stock: 10,
    unit: "Kilogram (kg)",
    minAlert: 3,
    costPerUnit: 45000,
  },
  {
    itemName: "Bihun Jagung",
    category: "Bahan Baku",
    stock: 15,
    unit: "Kilogram (kg)",
    minAlert: 3,
    costPerUnit: 12000,
  },
  {
    itemName: "Tepung Terigu Protein Sedang",
    category: "Bahan Baku",
    stock: 20,
    unit: "Kilogram (kg)",
    minAlert: 5,
    costPerUnit: 11000,
  },
  {
    itemName: "Telur Ayam Negeri",
    category: "Bahan Baku",
    stock: 30,
    unit: "Kilogram (kg)",
    minAlert: 8,
    costPerUnit: 28000,
  },
  {
    itemName: "Daging Sapi Slice (Shortplate)",
    category: "Bahan Baku",
    stock: 8,
    unit: "Kilogram (kg)",
    minAlert: 2,
    costPerUnit: 95000,
  },
  {
    itemName: "Bakso Sapi Instant",
    category: "Bahan Baku",
    stock: 10,
    unit: "Kilogram (kg)",
    minAlert: 3,
    costPerUnit: 40000,
  },
  {
    itemName: "Sosis Sapi Cocktail",
    category: "Bahan Baku",
    stock: 10,
    unit: "Kilogram (kg)",
    minAlert: 3,
    costPerUnit: 45000,
  },
  {
    itemName: "Bawang Merah & Putih Kupas",
    category: "Bahan Baku",
    stock: 5,
    unit: "Kilogram (kg)",
    minAlert: 2,
    costPerUnit: 35000,
  },
  {
    itemName: "Cabai Rawit Merah",
    category: "Bahan Baku",
    stock: 6,
    unit: "Kilogram (kg)",
    minAlert: 2,
    costPerUnit: 40000,
  },
  {
    itemName: "Gula Pasir Putih",
    category: "Bahan Baku",
    stock: 25,
    unit: "Kilogram (kg)",
    minAlert: 5,
    costPerUnit: 16000,
  },
  {
    itemName: "Minyak Goreng",
    category: "Bahan Baku",
    stock: 12,
    unit: "Liter",
    minAlert: 4,
    costPerUnit: 17000,
  },
  {
    itemName: "Kecap Manis",
    category: "Bahan Baku",
    stock: 4,
    unit: "Liter",
    minAlert: 1,
    costPerUnit: 120000,
  },
  {
    itemName: "Saus Sambal Botol",
    category: "Bahan Baku",
    stock: 6,
    unit: "Liter",
    minAlert: 2,
    costPerUnit: 25000,
  },
  {
    itemName: "Keju Slice Melt",
    category: "Bahan Baku",
    stock: 10,
    unit: "Pack",
    minAlert: 3,
    costPerUnit: 24000,
  },

  // Minuman & Bahan Minuman
  {
    itemName: "Biji Kopi Arabica Blend",
    category: "Minuman",
    stock: 5,
    unit: "Kilogram (kg)",
    minAlert: 2,
    costPerUnit: 145000,
  },
  {
    itemName: "Bubuk Matcha Premium",
    category: "Minuman",
    stock: 4,
    unit: "Kilogram (kg)",
    minAlert: 1,
    costPerUnit: 180000,
  },
  {
    itemName: "Susu UHT Full Cream",
    category: "Minuman",
    stock: 24,
    unit: "Liter",
    minAlert: 5,
    costPerUnit: 18000,
  },
  {
    itemName: "Sirup Red Velvet 1L",
    category: "Minuman",
    stock: 5,
    unit: "Liter",
    minAlert: 1,
    costPerUnit: 90000,
  },
  {
    itemName: "Sirup Hazelnut 1L",
    category: "Minuman",
    stock: 5,
    unit: "Liter",
    minAlert: 1,
    costPerUnit: 85000,
  },
  {
    itemName: "Teh Celup Hitam",
    category: "Minuman",
    stock: 10,
    unit: "Pack",
    minAlert: 3,
    costPerUnit: 15000,
  },

  // Snack / Makanan Ringan
  {
    itemName: "French Fries (Kentang Beku)",
    category: "Snack",
    stock: 15,
    unit: "Kilogram (kg)",
    minAlert: 4,
    costPerUnit: 32000,
  },
  {
    itemName: "Roti Burger / Bun",
    category: "Snack",
    stock: 12,
    unit: "Pack",
    minAlert: 3,
    costPerUnit: 14000,
  },

  // Kemasan & Operasional
  {
    itemName: "Cup Plastik 16 oz + Tutup",
    category: "Kemasan",
    stock: 8,
    unit: "Pack",
    minAlert: 2,
    costPerUnit: 22000,
  },
  {
    itemName: "Paper Lunch Box (M)",
    category: "Kemasan",
    stock: 6,
    unit: "Pack",
    minAlert: 2,
    costPerUnit: 28000,
  },
  {
    itemName: "Paper Takeaway Bag (Sedang)",
    category: "Kemasan",
    stock: 10,
    unit: "Pack",
    minAlert: 3,
    costPerUnit: 30000,
  },
  {
    itemName: "Sedotan Plastik Steril",
    category: "Kemasan",
    stock: 15,
    unit: "Pack",
    minAlert: 4,
    costPerUnit: 10000,
  },
];

async function seedInventory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Terhubung ke database MongoDB...");

    // (Opsional) Hapus data lama jika ingin reset bersih total
    await Inventory.deleteMany({});
    console.log("Data inventaris lama dibersihkan.");

    // Masukkan data baru
    await Inventory.insertMany(dummyInventoryItems);
    console.log(
      `Sukses! ${dummyInventoryItems.length} data bahan baku berhasil dimasukkan ke database. 🎉`,
    );

    process.exit(0);
  } catch (err) {
    console.error("Gagal melakukan seeding inventaris:", err);
    process.exit(1);
  }
}

seedInventory();
