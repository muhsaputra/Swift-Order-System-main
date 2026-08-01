const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting"); // Sesuaikan path model Anda

// GET: Mengambil pengaturan service fee
router.get("/service-fee", async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: "app_settings" });
    if (!setting) {
      setting = await Setting.create({
        key: "app_settings",
        serviceFeePercentage: 5,
      });
    }
    res.json({ serviceFeePercentage: setting.serviceFeePercentage });
  } catch (err) {
    res.status(500).json({ error: "Gagal memuat pengaturan fee layanan." });
  }
});

// PUT: Memperbarui pengaturan service fee
router.put("/service-fee", async (req, res) => {
  try {
    const { serviceFeePercentage } = req.body;
    let setting = await Setting.findOneAndUpdate(
      { key: "app_settings" },
      { serviceFeePercentage },
      { new: true, upsert: true },
    );
    res.json({ message: "Fee layanan berhasil diperbarui", setting });
  } catch (err) {
    res.status(500).json({ error: "Gagal menyimpan fee layanan." });
  }
});

module.exports = router;
