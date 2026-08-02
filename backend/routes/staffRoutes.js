const express = require("express");
const router = express.Router();
const Staff = require("../models/Staff");
const authMiddleware = require("../middleware/auth");
const verifyToken = authMiddleware.verifyToken || authMiddleware;

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

// 2. Tambah Pegawai Baru (Termasuk Foto)
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak." });
    }
    const {
      name,
      nickname,
      phone,
      position,
      photo,
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

    const newStaff = new Staff({
      name,
      nickname,
      phone,
      position,
      photo: photo || "",
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
