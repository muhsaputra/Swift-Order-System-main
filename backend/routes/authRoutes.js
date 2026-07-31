const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Pastikan file middleware/auth.js mengekspor objek yang sesuai
const authMiddleware = require("../middleware/auth");
const JWT_SECRET =
  authMiddleware.JWT_SECRET || process.env.JWT_SECRET || "fallback_secret_key";
const verifyToken = authMiddleware.verifyToken || authMiddleware;

// 1. Register Kasir Pertama (Opsional/Helper untuk setup akun)
router.post("/register", async (req, res) => {
  try {
    const { username, password, name } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username dan password wajib diisi" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: "Username sudah terdaftar" });

    const newUser = new User({
      username,
      password,
      name: name || username,
      role: "cashier",
    });

    await newUser.save();
    return res.status(201).json({ message: "Akun kasir berhasil dibuat" });
  } catch (err) {
    console.error("DEBUG ERROR REGISTER:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Login Kasir
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username dan password wajib diisi" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "Akun tidak ditemukan" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Password salah" });
    }

    // Buat JWT Token berlaku selama 1 hari
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      message: "Login berhasil",
      token,
      user: { username: user.username, role: user.role, name: user.name },
    });
  } catch (err) {
    console.error("DEBUG ERROR LOGIN:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. Verifikasi Token (Digunakan Frontend untuk Cek Sesi Login Kasir)
router.get("/verify", verifyToken, (req, res) => {
  return res.status(200).json({
    valid: true,
    user: req.user,
  });
});

// 4. Ambil Profil Admin/Kasir yang sedang login
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.id || req.user?.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error("Error GET /profile:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// 5. Update Profil Admin/Kasir (Nama, Username, atau Password opsional)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.id || req.user?.id;
    const { username, name, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    if (username) user.username = username;
    if (name) user.name = name;

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      admin: userResponse,
    });
  } catch (err) {
    console.error("Error PUT /profile:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
