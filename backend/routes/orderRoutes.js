const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Table = require("../models/Table"); // Tambahkan import model Table untuk update status meja
const { verifyToken } = require("../middleware/auth");

// 1. Buat Pesanan Baru (Client Checkout - Publik)
router.post("/", async (req, res) => {
  try {
    const {
      tableNumber,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      discountAmount,
      couponCode,
      serviceFee,
      totalAmount,
      paymentMethod,
    } = req.body;

    // Tentukan paymentStatus awal berdasarkan metode pembayaran yang dipilih
    // Jika 'cash', statusnya 'cash_pending'. Jika 'qris', statusnya 'pending'.
    const initialPaymentStatus =
      paymentMethod === "cash" ? "cash_pending" : "pending";

    const customOrderId = `SWIFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = new Order({
      orderId: customOrderId, // Simpan orderId kustom agar cocok dengan Midtrans / pencarian fleksibel
      tableNumber,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      discountAmount: discountAmount || 0, // <-- Diperbarui agar tersimpan dengan benar
      couponCode: couponCode || null, // <-- Diperbarui agar tersimpan dengan benar
      serviceFee,
      totalAmount,
      paymentMethod: paymentMethod || "qris",
      paymentStatus: initialPaymentStatus,
      orderStatus: "pending",
    });

    const savedOrder = await newOrder.save();

    // Jika metode pembayaran QRIS, buat simulasi QRIS / data QR
    if (savedOrder.paymentMethod === "qris") {
      savedOrder.qrisData = {
        qrString: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SWIFT-PAY-${savedOrder._id}`,
        expiredAt: new Date(Date.now() + 15 * 60 * 1000), // 15 menit
      };
      await savedOrder.save();
    }

    // Populate data menu dengan aman
    const populatedOrder = await Order.findById(savedOrder._id).populate(
      "items.menu",
    );

    // Kirim notifikasi realtime ke dashboard kasir
    const io = req.app.get("io");
    if (io) {
      io.emit("new-order", populatedOrder);
    }

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error("Error POST /orders:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// 2. Ambil Detail Pesanan berdasarkan ID (Mendukung _id MongoDB & String ID kustom/Midtrans)
router.get("/:id", async (req, res) => {
  try {
    const identifier = req.params.id;
    let order = null;

    // Cek apakah parameter berupa ObjectId MongoDB yang valid
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(identifier).populate("items.menu");
    }

    // Jika tidak ditemukan atau bukan ObjectId, cari berdasarkan string custom atau _id alternatif
    if (!order) {
      order = await Order.findOne({
        $or: [{ orderId: identifier }, { _id: identifier }],
      }).populate("items.menu");
    }

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan" });
    }

    res.status(200).json(order);
  } catch (err) {
    console.error("Error GET /orders/:id:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Pembayaran / Webhook (Mendukung pencarian fleksibel ID MongoDB & Kustom)
router.patch("/:id/pay", async (req, res) => {
  try {
    const identifier = req.params.id;
    let order = null;

    // Coba cari berdasarkan _id MongoDB terlebih dahulu jika formatnya valid
    if (identifier && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(identifier);
    }

    // Jika tidak ketemu, cari berdasarkan orderId kustom atau string _id alternatif
    if (!order) {
      order = await Order.findOne({
        $or: [{ orderId: identifier }, { _id: identifier }],
      });
    }

    if (!order) {
      return res
        .status(404)
        .json({ error: "Pesanan tidak ditemukan di database" });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "processing"; // Masuk ke antrean proses kasir
    const updatedOrder = await order.save();

    // Update status meja menjadi terisi secara otomatis saat lunas
    await Table.findOneAndUpdate(
      { tableNumber: updatedOrder.tableNumber },
      { isOccupied: true, currentOrder: updatedOrder._id },
    );

    const populatedOrder = await Order.findById(updatedOrder._id).populate(
      "items.menu",
    );

    const io = req.app.get("io");
    if (io) {
      // Pastikan memancarkan event 'order-updated' agar Dashboard Kasir langsung menangkapnya
      io.emit("order-updated", populatedOrder);
      io.emit("new-paid-order", populatedOrder);
    }

    res.status(200).json(populatedOrder);
  } catch (err) {
    console.error("Error PATCH /pay:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3.5. Konfirmasi Pembayaran Tunai (Cash) oleh Kasir
router.patch("/:id/pay-cash", async (req, res) => {
  try {
    const identifier = req.params.id;
    let order = null;

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(identifier);
    }

    if (!order) {
      order = await Order.findOne({
        $or: [{ orderId: identifier }, { _id: identifier }],
      });
    }

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan" });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "processing"; // Lanjut diproses ke dapur
    const updatedOrder = await order.save();

    // Ubah status meja menjadi terisi
    await Table.findOneAndUpdate(
      { tableNumber: updatedOrder.tableNumber },
      { isOccupied: true, currentOrder: updatedOrder._id },
    );

    const populatedOrder = await Order.findById(updatedOrder._id).populate(
      "items.menu",
    );

    const io = req.app.get("io");
    if (io) {
      io.emit("order-updated", populatedOrder);
    }

    res.json({
      message: "Pembayaran tunai berhasil dikonfirmasi",
      order: populatedOrder,
    });
  } catch (err) {
    console.error("Error PATCH /pay-cash:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Update Status Pesanan oleh Kasir (Diproteksi Auth)
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body; // Menerima status baru ("processing", "ready", "completed")
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ error: "Pesanan tidak ditemukan" });

    // Gunakan 'orderStatus' sesuai skema Mongoose
    order.orderStatus = status;

    // Jika pesanan selesai/completed, kita bisa bebaskan mejanya kembali (opsional tapi praktik restoran yang baik)
    if (status === "completed") {
      order.paymentStatus = "paid";
      await Table.findOneAndUpdate(
        { tableNumber: order.tableNumber },
        { isOccupied: false, currentOrder: null },
      );
    }

    const updatedOrder = await order.save();

    const populatedOrder = await Order.findById(updatedOrder._id).populate(
      "items.menu",
    );

    // Broadcast ke client (HP Pelanggan & Dashboard)
    const io = req.app.get("io");
    if (io) {
      io.emit("order-status-updated", populatedOrder);
      io.emit("order-updated", populatedOrder);
    }

    res.json(populatedOrder);
  } catch (err) {
    console.error("Error PATCH /status:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. Ambil semua pesanan untuk Dashboard Kasir (Dilengkapi Safe Populate)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.menu")
      .sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (err) {
    console.warn("Populate gagal, mencoba ambil data mentah:", err.message);
    try {
      const fallbackOrders = await Order.find({}).sort({ createdAt: -1 });
      return res.status(200).json(fallbackOrders);
    } catch (fallbackErr) {
      console.error("CRITICAL ERROR GET /orders:", fallbackErr.message);
      return res.status(500).json({ error: fallbackErr.message });
    }
  }
});

module.exports = router;
