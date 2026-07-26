const express = require("express");
const router = express.Router();
const Table = require("../models/Table");

// GET: Ambil semua data meja
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.status(200).json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Tambah meja baru
router.post("/", async (req, res) => {
  try {
    const { tableNumber, capacity, position } = req.body;
    const newTable = new Table({ tableNumber, capacity, position });
    const savedTable = await newTable.save();
    res.status(201).json(savedTable);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH: Update posisi atau status meja
router.patch("/:id", async (req, res) => {
  try {
    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.status(200).json(updatedTable);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Tambahkan rute DELETE ini di file backend Anda (misal: tableRoutes.js)

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Hapus meja berdasarkan ID menggunakan Mongoose
    const deletedTable = await Table.findByIdAndDelete(id);

    if (!deletedTable) {
      return res.status(404).json({ error: "Meja tidak ditemukan" });
    }

    res.status(200).json({ message: "Meja berhasil dihapus", deletedTable });
  } catch (error) {
    console.error("Error deleting table:", error);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan pada server saat menghapus meja" });
  }
});

module.exports = router;
