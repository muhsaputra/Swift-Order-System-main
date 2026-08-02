const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Expense = require("../models/Expense");
const { verifyToken } = require("../middleware/auth");

// A. Ambil Semua Daftar Inventaris
router.get("/", verifyToken, async (req, res) => {
  try {
    const items = await Inventory.find().sort({ itemName: 1 });
    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// B. Tambah Barang Inventaris Baru (Khusus Owner)
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak. Khusus Owner." });
    }
    const { itemName, category, stock, unit, minAlert, costPerUnit } = req.body;
    const newItem = new Inventory({
      itemName,
      category,
      stock: Number(stock) || 0,
      unit,
      minAlert: Number(minAlert) || 5,
      costPerUnit: Number(costPerUnit) || 0,
    });
    await newItem.save();
    return res
      .status(201)
      .json({ message: "Bahan baku berhasil ditambahkan ke inventaris" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// C. Restock / Pembelian Bahan & Otomatis Masuk ke Laporan Keuangan (Expense)
router.post("/:id/restock", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak. Khusus Owner." });
    }
    const { addedStock, totalCost } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Bahan tidak ditemukan" });

    item.stock += Number(addedStock) || 0;
    item.updatedAt = new Date();
    await item.save();

    // Catat otomatis sebagai pengeluaran pembelian bahan baku ke Laporan Keuangan
    await Expense.create({
      title: `Pembelian Stok - ${item.itemName} (${addedStock} ${item.unit})`,
      category: "Bahan Baku",
      amount: Number(totalCost) || 0,
      note: `Restock inventaris bahan baku ${item.itemName}`,
      recordedBy: req.user.username,
      date: new Date(),
    });

    return res
      .status(200)
      .json({
        message: "Stok berhasil diperbarui dan tercatat di Laporan Keuangan",
      });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
