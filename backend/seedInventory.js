const mongoose = require("mongoose");
require("dotenv").config();

// Definisikan Schema sementara atau gunakan model yang sudah ada
const inventorySchema = new mongoose.Schema({
  itemName: String,
  category: String,
  stock: Number,
  unit: String,
  minAlert: Number,
  costPerUnit: Number,
  updatedAt: { type: Date, default: Date.now },
});

const Inventory = mongoose.model("Inventory", inventorySchema);

const dummyItems = [
  {
    itemName: "Susu UHT Full Cream",
    category: "Minuman",
    stock: 24,
    unit: "liter",
    minAlert: 5,
    costPerUnit: 18000,
  },
  {
    itemName: "Biji Kopi Arabica Blend",
    category: "Minuman",
    stock: 5,
    unit: "kg",
    minAlert: 2,
    costPerUnit: 145000,
  },
  {
    itemName: "Sirup Vanila 1L",
    category: "Minuman",
    stock: 4,
    unit: "liter",
    minAlert: 1,
    costPerUnit: 85000,
  },
  {
    itemName: "Daging Ayam Fillet",
    category: "Bahan Baku",
    stock: 10,
    unit: "kg",
    minAlert: 3,
    costPerUnit: 45000,
  },
  {
    itemName: "Beras Premium",
    category: "Bahan Baku",
    stock: 25,
    unit: "kg",
    minAlert: 5,
    costPerUnit: 15000,
  },
  {
    itemName: "Minyak Goreng Filma 2L",
    category: "Bahan Baku",
    stock: 12,
    unit: "liter",
    minAlert: 4,
    costPerUnit: 17000,
  },
  {
    itemName: "Cup Plastik 16 oz + Tutup",
    category: "Kemasan",
    stock: 8,
    unit: "pack",
    minAlert: 2,
    costPerUnit: 22000,
  },
  {
    itemName: "Paper Lunch Box (M)",
    category: "Kemasan",
    stock: 6,
    unit: "pack",
    minAlert: 2,
    costPerUnit: 28000,
  },
];

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Terhubung ke MongoDB...");

    await Inventory.deleteMany(); // (Opsional) Bersihkan data lama jika ingin reset total
    await Inventory.insertMany(dummyItems);

    console.log(
      "Sukses! 8 Data dummy bahan baku kafe berhasil dimasukkan ke database. 🎉",
    );
    process.exit(0);
  } catch (err) {
    console.error("Gagal melakukan seeding:", err);
    process.exit(1);
  }
}

seedData();
