const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, verifyToken } = require("../middleware/auth");

// 1. Register Kasir Pertama (Opsional/Helper untuk setup akun)
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: "Username sudah terdaftar" });

    const newUser = new User({ username, password, role: "cashier" });
    await newUser.save();
    res.status(201).json({ message: "Akun kasir berhasil dibuat" });
  } catch (err) {
    console.error("DEBUG ERROR REGISTER:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// 2. Login Kasir
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "Akun tidak ditemukan" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Password salah" });

    // Buat JWT Token berlaku selama 1 hari
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Login berhasil",
      token,
      user: { username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Verifikasi Token (Digunakan Frontend untuk Cek Sesi Login Kasir)
router.get("/verify", verifyToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

module.exports = router;
