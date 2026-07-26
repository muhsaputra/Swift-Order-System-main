const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");

// 1. Ambil Semua Kupon (Untuk Panel Admin/Kasir)
router.get("/", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Buat Kupon Baru (Admin/Kasir)
router.post("/", async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, expiredAt } =
      req.body;

    const newCoupon = new Coupon({
      code,
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      expiredAt,
    });

    const savedCoupon = await newCoupon.save();
    res.status(201).json(savedCoupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Hapus Kupon
router.delete("/:id", async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: "Kupon berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Validasi & Terapkan Kupon (Dipakai saat Checkout Pelanggan)
router.post("/validate", async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res
        .status(404)
        .json({ error: "Kode kupon tidak valid atau sudah tidak aktif." });
    }

    // Cek masa kedaluwarsa
    if (new Date() > new Date(coupon.expiredAt)) {
      return res.status(400).json({ error: "Kode kupon sudah kedaluwarsa." });
    }

    // Cek minimal belanja
    if (subtotal < coupon.minPurchase) {
      return res.status(400).json({
        error: `Minimal belanja untuk kupon ini adalah Rp ${coupon.minPurchase.toLocaleString("id-ID")}`,
      });
    }

    // Hitung nominal diskon
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    // Pastikan diskon tidak melebihi subtotal
    if (discountAmount > subtotal) discountAmount = subtotal;

    res.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalTotal: subtotal - discountAmount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
