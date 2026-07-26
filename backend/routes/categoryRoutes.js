const express = require("express");
const router = express.Router();

// Simulasi database sementara di memory (atau ganti dengan Model Mongoose jika Anda menggunakan Database)
let categories = ["Makanan", "Minuman", "Snack", "Dessert"];

// GET: Ambil semua kategori
router.get("/", (req, res) => {
  res.json(categories);
});

// POST: Tambah kategori baru
router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res
      .status(400)
      .json({ message: "Nama kategori tidak boleh kosong" });
  }

  if (!categories.includes(name)) {
    categories.push(name);
  }

  res.status(201).json(categories);
});

// DELETE: Hapus kategori berdasarkan nama atau index
router.delete("/:name", (req, res) => {
  const categoryName = req.params.name;
  categories = categories.filter((cat) => cat !== categoryName);
  res.json(categories);
});

module.exports = router;
