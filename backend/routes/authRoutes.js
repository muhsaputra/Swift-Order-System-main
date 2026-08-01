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

// 1. Register User (Mendukung role dinamis: 'cashier', 'owner', dll.)
router.post("/register", async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    console.log(`\n--- [DEBUG POST /register] ---`);
    console.log(
      `Mencoba register - Username: "${username}", Role: "${role || "cashier"}"`,
    );

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username dan password wajib diisi" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username sudah terdaftar" });
    }

    const newUser = new User({
      username,
      password,
      name: name || username,
      role: role || "cashier", // Mengambil role dari body jika ada, default ke "cashier"
    });

    await newUser.save();
    console.log(
      `[DEBUG REGISTER] Berhasil menyimpan user baru ke DB dengan role: ${newUser.role}`,
    );
    return res
      .status(201)
      .json({ message: `Akun ${newUser.role} berhasil dibuat` });
  } catch (err) {
    console.error("DEBUG ERROR REGISTER:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Login (Kasir / Owner / Kitchen)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`\n--- [DEBUG POST /login] ---`);
    console.log(
      `Mencoba masuk - Username: "${username}", Password input mentah: "${password}"`,
    );

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username dan password wajib diisi" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log(`[DEBUG LOGIN] User "${username}" tidak ditemukan.`);
      return res.status(404).json({ error: "Akun tidak ditemukan" });
    }

    console.log(
      `[DEBUG LOGIN] User ditemukan. Hash password di DB: ${user.password}`,
    );

    const isMatch = await user.comparePassword(password);
    console.log(
      `[DEBUG LOGIN] Hasil perbandingan password (isMatch): ${isMatch}`,
    );

    if (!isMatch) {
      return res.status(400).json({ error: "Password salah" });
    }

    // Buat JWT Token berlaku selama 1 hari (menyertakan role user)
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

// 3. Verifikasi Token (Digunakan Frontend untuk Cek Sesi Login)
router.get("/verify", verifyToken, (req, res) => {
  return res.status(200).json({
    valid: true,
    user: req.user,
  });
});

// 4. Ambil Profil Pengguna yang sedang login
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

// 5. Update Profil Pengguna (Nama, Username, atau Password opsional)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.id || req.user?.id;
    const { username, name, password } = req.body;

    console.log(`\n--- [DEBUG PUT /profile] ---`);
    console.log(`User ID: ${userId}`);
    console.log(
      `Payload diterima - username: "${username}", name: "${name}", password field exists: ${Boolean(password)}, password length: ${password ? password.length : 0}`,
    );

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    if (username) user.username = username;
    if (name) user.name = name;

    // Set password mentah, biarkan pre("save") di model User.js yang meng-hash-nya
    if (password && password.trim() !== "") {
      user.password = password;
      console.log(
        `[DEBUG PUT /profile] Password baru di-set ke instance user, siap di-save.`,
      );
    }

    const updatedUser = await user.save();
    console.log(
      `[DEBUG PUT /profile] Berhasil save. Hash password baru di DB: ${updatedUser.password}`,
    );

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      admin: userResponse,
    });
  } catch (err) {
    console.error("Error PUT /profile:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
