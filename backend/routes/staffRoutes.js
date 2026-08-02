const express = require("express");
const router = express.Router();
const Staff = require("../models/Staff");
const authMiddleware = require("../middleware/auth");
const verifyToken = authMiddleware.verifyToken || authMiddleware;
const multer = require("multer");
const path = require("path");

// Konfigurasi Penyimpanan File Upload Lokal (Multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Pastikan folder 'uploads' sudah ada di root backend Anda
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// 1. Ambil Semua Data Pegawai
router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak." });
    }
    const staffList = await Staff.find().sort({ createdAt: -1 });
    return res.status(200).json(staffList);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Tambah Pegawai Baru (Mendukung Upload File Foto)
router.post("/", verifyToken, upload.single("photo"), async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak." });
    }
    const {
      name,
      username,
      password,
      role,
      nickname,
      phone,
      position,
      address,
      emergencyContact,
      baseSalary,
      bankAccount,
    } = req.body;

    if (!name || !phone || !position) {
      return res
        .status(400)
        .json({ error: "Nama, nomor telepon, dan posisi wajib diisi." });
    }

    // Tangani path file foto jika diunggah
    let photoPath = "";
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
    }

    const newStaff = new Staff({
      name,
      username,
      password, // Pastikan model Anda menangani hashing password jika ini akun login
      role: role || "cashier",
      nickname,
      phone,
      position,
      photo: photoPath,
      address,
      emergencyContact,
      baseSalary: Number(baseSalary) || 0,
      bankAccount,
    });

    await newStaff.save();
    return res
      .status(201)
      .json({ message: "Pegawai berhasil ditambahkan", data: newStaff });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2b. Update / Edit Data Pegawai (Mendukung Upload File Foto Baru)
router.put("/:id", verifyToken, upload.single("photo"), async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: "Pegawai tidak ditemukan." });
    }

    const {
      name,
      username,
      role,
      nickname,
      phone,
      position,
      address,
      emergencyContact,
      baseSalary,
      bankAccount,
    } = req.body;

    // Update field data
    if (name) staff.name = name;
    if (username) staff.username = username;
    if (role) staff.role = role;
    if (nickname !== undefined) staff.nickname = nickname;
    if (phone) staff.phone = phone;
    if (position) staff.position = position;
    if (address !== undefined) staff.address = address;
    if (emergencyContact) staff.emergencyContact = emergencyContact;
    if (baseSalary !== undefined) staff.baseSalary = Number(baseSalary) || 0;
    if (bankAccount) staff.bankAccount = bankAccount;

    // Jika ada file foto baru yang diunggah
    if (req.file) {
      staff.photo = `/uploads/${req.file.filename}`;
    }

    await staff.save();
    return res
      .status(200)
      .json({ message: "Data pegawai berhasil diperbarui", data: staff });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Catat / Update Absensi Pegawai
router.post("/:id/attendance", verifyToken, async (req, res) => {
  try {
    const { status, checkIn, checkOut } = req.body;
    const staff = await Staff.findById(req.params.id);
    if (!staff)
      return res.status(404).json({ error: "Pegawai tidak ditemukan." });

    staff.attendance.push({
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

    await staff.save();
    return res
      .status(200)
      .json({ message: "Absensi berhasil dicatat", data: staff });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Proses Pembayaran Gaji (Payroll)
router.post("/:id/payroll", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak." });
    }
    const { month, baseSalary, bonus, deduction } = req.body;
    const staff = await Staff.findById(req.params.id);
    if (!staff)
      return res.status(404).json({ error: "Pegawai tidak ditemukan." });

    const totalPaid =
      (Number(baseSalary) || staff.baseSalary) +
      (Number(bonus) || 0) -
      (Number(deduction) || 0);

    staff.payrollHistory.push({
      month: month || new Date().toISOString().slice(0, 7),
      baseSalary: Number(baseSalary) || staff.baseSalary,
      bonus: Number(bonus) || 0,
      deduction: Number(deduction) || 0,
      totalPaid,
      status: "Lunas",
    });

    await staff.save();
    return res
      .status(200)
      .json({ message: "Penggajian berhasil dicatat", data: staff });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Hapus Pegawai
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak." });
    }
    await Staff.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Data pegawai berhasil dihapus." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
