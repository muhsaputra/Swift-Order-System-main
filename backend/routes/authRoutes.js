const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Konfigurasi Cloudinary (Konsisten dengan modul Menu Management)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "swift-ordering/staff", // Folder penyimpanan di Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});
const upload = multer({ storage });

// Pastikan file middleware/auth.js mengekspor objek yang sesuai
const authMiddleware = require("../middleware/auth");
const JWT_SECRET =
  authMiddleware.JWT_SECRET || process.env.JWT_SECRET || "fallback_secret_key";
const verifyToken = authMiddleware.verifyToken || authMiddleware;

// 1. Register User (Mendukung role dinamis: 'cashier', 'owner', 'kitchen', dll.)
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
      role: role || "cashier",
    });

    await newUser.save();
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

// 3. Verifikasi Token
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

// 5. Update Profil Pengguna (Mendukung Upload Foto Cloudinary)
router.put(
  "/profile",
  verifyToken,
  upload.single("photo"),
  async (req, res) => {
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
        user.password = password;
      }
      if (req.file) {
        user.photo = req.file.path; // URL Cloudinary
      }

      const updatedUser = await user.save();
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
  },
);

// ==========================================
// 6. RUTE MANAJEMEN STAFF & AKUN (KHUSUS OWNER)
// ==========================================

// A. Ambil Semua Daftar Pengguna Restoran
router.get("/users", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak. Khusus Owner." });
    }

    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (err) {
    console.error("Error GET /users:", err);
    return res.status(500).json({ error: err.message });
  }
});

// B. Tambah Staff Baru oleh Owner (Mendukung Upload Foto Cloudinary)
router.post("/users", verifyToken, upload.single("photo"), async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak. Khusus Owner." });
    }

    if (!req.body) {
      return res.status(400).json({ error: "Data form kosong." });
    }

    const { username, password, name, role, phone, position, baseSalary } =
      req.body;
    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ error: "Username, password, dan role wajib diisi" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username sudah terdaftar" });
    }

    let photoUrl = "";
    if (req.file) {
      photoUrl = req.file.path;
    }

    const cleanSalary =
      typeof baseSalary === "string"
        ? baseSalary.replace(/[^0-9]/g, "")
        : baseSalary;

    const newStaff = new User({
      username,
      password,
      name: name || username,
      role,
      phone,
      position,
      baseSalary: Number(cleanSalary) || 0,
      photo: photoUrl,
    });

    await newStaff.save();
    return res.status(201).json({ message: "Staff baru berhasil ditambahkan" });
  } catch (err) {
    console.error("Error POST /users:", err);
    return res.status(500).json({ error: err.message });
  }
});

// C. Update Data atau Reset Sandi Staff Berdasarkan ID (Mendukung Upload Foto Cloudinary)
router.put(
  "/users/:id",
  verifyToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (req.user.role !== "owner") {
        return res.status(403).json({ error: "Akses ditolak. Khusus Owner." });
      }

      if (!req.body) {
        return res.status(400).json({ error: "Data form kosong." });
      }

      const { name, username, password, role, phone, position, baseSalary } =
        req.body;
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ error: "Pengguna tidak ditemukan" });
      }

      if (name) user.name = name;
      if (username) user.username = username;
      if (role) user.role = role;
      if (phone !== undefined) user.phone = phone;
      if (position !== undefined) user.position = position;

      if (baseSalary !== undefined) {
        const cleanSalary =
          typeof baseSalary === "string"
            ? baseSalary.replace(/[^0-9]/g, "")
            : baseSalary;
        user.baseSalary = Number(cleanSalary) || 0;
      }

      if (password && password.trim() !== "") {
        user.password = password;
      }

      // Jika ada file foto baru yang diunggah ke Cloudinary
      if (req.file) {
        user.photo = req.file.path;
      }

      await user.save();
      return res
        .status(200)
        .json({ message: "Data staff berhasil diperbarui" });
    } catch (err) {
      console.error("Error PUT /users/:id:", err);
      return res.status(500).json({ error: err.message });
    }
  },
);

// D. Hapus Akun Staff Berdasarkan ID
router.delete("/users/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak. Khusus Owner." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    const currentUserId = req.user.id || req.user._id;
    if (user._id.toString() === currentUserId.toString()) {
      return res.status(400).json({
        error: "Anda tidak dapat menghapus akun owner yang sedang aktif",
      });
    }

    await User.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ message: "Staff berhasil dihapus dari sistem" });
  } catch (err) {
    console.error("Error DELETE /users/:id:", err);
    return res.status(500).json({ error: err.message });
  }
});

// E. Catat / Update Absensi Pegawai
router.post("/users/:id/attendance", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak. Khusus Owner." });
    }
    const { status, checkIn, checkOut } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Pegawai tidak ditemukan." });
    }

    user.attendance.push({
      date: new Date(),
      status: status || "Hadir",
      checkIn:
        checkIn ||
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      checkOut: checkOut || "-",
    });

    await user.save();
    return res
      .status(200)
      .json({ message: "Absensi berhasil dicatat", data: user });
  } catch (err) {
    console.error("Error POST /users/:id/attendance:", err);
    return res.status(500).json({ error: err.message });
  }
});

// F. Proses Pembayaran Gaji (Payroll)
router.post("/users/:id/payroll", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak. Khusus Owner." });
    }
    const { month, baseSalary, bonus, deduction } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Pegawai tidak ditemukan." });
    }

    const totalPaid =
      (Number(baseSalary) || user.baseSalary || 0) +
      (Number(bonus) || 0) -
      (Number(deduction) || 0);

    user.payrollHistory.push({
      month: month || new Date().toISOString().slice(0, 7),
      baseSalary: Number(baseSalary) || user.baseSalary || 0,
      bonus: Number(bonus) || 0,
      deduction: Number(deduction) || 0,
      totalPaid,
      status: "Lunas",
    });

    await user.save();
    return res
      .status(200)
      .json({ message: "Penggajian berhasil dicatat", data: user });
  } catch (err) {
    console.error("Error POST /users/:id/payroll:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
