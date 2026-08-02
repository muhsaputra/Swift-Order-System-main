const express = require("express");
const router = express.Router();
const Order = require("../models/Order"); // Model transaksi pesanan Anda
const Expense = require("../models/Expense");
const authMiddleware = require("../middleware/auth");
const verifyToken = authMiddleware.verifyToken || authMiddleware;

// 1. Ambil Ringkasan Laporan Keuangan (Omzet, Pengeluaran, Laba Bersih) dengan Filter Tanggal
router.get("/summary", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak. Khusus Owner." });
    }

    const { startDate, endDate } = req.query;
    let queryFilter = { status: { $ne: "cancelled" } };
    let expenseFilter = {};

    // Jika filter tanggal diaktifkan
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      queryFilter.createdAt = { $gte: start, $lte: end };
      expenseFilter.date = { $gte: start, $lte: end };
    }

    // Ambil pesanan sesuai filter
    const orders = await Order.find(queryFilter);

    let totalRevenue = 0; // Omzet Kotor
    orders.forEach((order) => {
      totalRevenue += order.totalAmount || order.grandTotal || 0;
    });

    // Ambil data pengeluaran sesuai filter
    const expenses = await Expense.find(expenseFilter);
    let totalExpenses = 0;
    expenses.forEach((exp) => {
      totalExpenses += exp.amount || 0;
    });

    // Estimasi HPP / Cost of Goods Sold (diasumsikan 40% dari omzet)
    const estimatedCOGS = totalRevenue * 0.4;

    // Laba Kotor = Omzet - HPP
    const grossProfit = totalRevenue - estimatedCOGS;

    // Laba Bersih = Laba Kotor - Total Pengeluaran Operasional
    const netProfit = grossProfit - totalExpenses;

    return res.status(200).json({
      totalRevenue,
      estimatedCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      totalTransactions: orders.length,
      ordersList: orders, // Dikirim untuk grafik tren di frontend
    });
  } catch (err) {
    console.error("Error GET /finance/summary:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Ambil Daftar Pengeluaran dengan Filter Tanggal
router.get("/expenses", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    return res.status(200).json(expenses);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Tambah Catatan Pengeluaran Baru (Diperbarui dengan menyertakan field 'date')
router.post("/expenses", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    const { title, category, amount, note, date } = req.body;
    if (!title || !amount) {
      return res
        .status(400)
        .json({ error: "Judul dan nominal pengeluaran wajib diisi" });
    }

    const newExpense = new Expense({
      title,
      category: category || "Operasional",
      amount: Number(amount),
      note,
      recordedBy: req.user.username,
      date: date ? new Date(date) : new Date(), // Memastikan field tanggal selalu terisi dengan benar
    });

    await newExpense.save();
    return res
      .status(201)
      .json({ message: "Pengeluaran berhasil dicatat", data: newExpense });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Hapus Catatan Pengeluaran
router.delete("/expenses/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Akses ditolak." });
    }
    await Expense.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Pengeluaran berhasil dihapus" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
