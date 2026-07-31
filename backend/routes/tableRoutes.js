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

// POST: Tambah meja baru (Mendukung area, kapasitas, dan posisi)
router.post("/", async (req, res) => {
  try {
    const { tableNumber, capacity, area, position } = req.body;
    const newTable = new Table({
      tableNumber,
      capacity: capacity || 4,
      area: area || "Indoor",
      position: position || { x: 0, y: 0 },
    });
    const savedTable = await newTable.save();
    res.status(201).json(savedTable);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH: Khusus untuk update posisi meja (Visual Layout Editor)
router.patch("/:id/position", async (req, res) => {
  try {
    const { position } = req.body;
    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      { position },
      { new: true },
    );
    if (!updatedTable) {
      return res.status(404).json({ error: "Meja tidak ditemukan" });
    }
    res.status(200).json(updatedTable);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH: Update umum data meja (status, area, dll)
router.patch("/:id", async (req, res) => {
  try {
    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedTable) {
      return res.status(404).json({ error: "Meja tidak ditemukan" });
    }
    res.status(200).json(updatedTable);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Hapus meja berdasarkan ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
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
