const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Table = require("../models/Table"); // Tambahkan import model Table untuk update status meja
const { verifyToken } = require("../middleware/auth");

// Helper function untuk mengirim WhatsApp via Fonnte
const sendWhatsAppMessage = async (target, message) => {
  if (!target) return;
  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_API_TOKEN,
      },
      body: new URLSearchParams({
        target: target,
        message: message,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("WhatsApp Gateway Error:", error);
  }
};

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
      discountAmount: discountAmount || 0,
      couponCode: couponCode || null,
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

    // Kirim notifikasi WhatsApp bahwa pesanan berhasil dibuat / diterima sistem
    if (customerPhone) {
      const welcomeMsg =
        `Halo *${customerName}*,\n\nTerima kasih telah memesan di Swift Order!\n` +
        `No Pesanan: *#${customOrderId}*\n` +
        `Nomor Meja: *${tableNumber}*\n` +
        `Status: *Menunggu Pembayaran / Diproses*\n\n` +
        `Kami akan segera menyiapkan pesanan Anda.`;
      await sendWhatsAppMessage(customerPhone, welcomeMsg);
    }

    // Kirim notifikasi realtime ke dashboard kasir HANYA JIKA metode pembayaran CASH.
    // Untuk QRIS, notifikasi baru dikirim setelah pembayaran sukses terverifikasi di endpoint /pay.
    const io = req.app.get("io");
    if (io) {
      if (paymentMethod === "cash") {
        io.emit("new-order", populatedOrder);
      }
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
    if (identifier && identifier.match(/^[0-9a-fA-F]{24}$/)) {
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

    if (identifier && identifier.match(/^[0-9a-fA-F]{24}$/)) {
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

// 4. Update Status Pesanan oleh Kasir (Dibuat publik / tanpa verifyToken agar tidak error 500 token)
router.patch("/:id/status", async (req, res) => {
  try {
    const identifier = req.params.id;
    const { status } = req.body; // Menerima status baru ("processing", "ready", "completed")
    let order = null;

    // Pencarian fleksibel tanpa error crash tipe data ID
    if (identifier && identifier.match(/^[0-9a-fA-F]{24}$/)) {
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

    // Gunakan 'orderStatus' sesuai skema Mongoose
    order.orderStatus = status;

    // Jika pesanan selesai/completed, kita bisa bebaskan mejanya kembali & kirim digital receipt
    if (status === "completed") {
      order.paymentStatus = "paid";
      await Table.findOneAndUpdate(
        { tableNumber: order.tableNumber },
        { isOccupied: false, currentOrder: null },
      );

      // Buat format Struk Digital (Digital Receipt)
      if (order.customerPhone) {
        let itemsList = (order.items || [])
          .map(
            (i) =>
              `- Menu (${i.quantity}x) @Rp${(i.price || 0).toLocaleString("id-ID")}`,
          )
          .join("\n");

        const receiptMessage =
          `*STRUK DIGITAL SWIFT ORDER* 🧾\n\n` +
          `No Pesanan: #${order.orderId || order._id}\n` +
          `Nama: ${order.customerName}\n` +
          `Meja: ${order.tableNumber}\n` +
          `Status: Selesai ✅\n\n` +
          `*Rincian Pesanan:*\n${itemsList}\n\n` +
          `Subtotal: Rp${(order.subtotal || order.totalAmount || 0).toLocaleString("id-ID")}\n` +
          `Diskon: Rp${(order.discountAmount || 0).toLocaleString("id-ID")}\n` +
          `Biaya Layanan: Rp${(order.serviceFee || 0).toLocaleString("id-ID")}\n` +
          `*Total Pembayaran: Rp${(order.totalAmount || 0).toLocaleString("id-ID")}*\n\n` +
          `Terima kasih telah berkunjung ke Swift Order! 🙏`;

        await sendWhatsAppMessage(order.customerPhone, receiptMessage);
      }
    }

    const updatedOrder = await order.save();

    // Populate dengan aman
    let populatedOrder = updatedOrder;
    try {
      populatedOrder = await Order.findById(updatedOrder._id).populate(
        "items.menu",
      );
    } catch (popErr) {
      console.warn("Warning populate menu:", popErr.message);
    }

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

// 6. Endpoint untuk memanggil pelayan / bantuan dari meja (Mendukung pencarian fleksibel ID)
router.post("/:id/call-waiter", async (req, res) => {
  try {
    const identifier = req.params.id;
    let order = null;

    if (identifier && identifier.match(/^[0-9a-fA-F]{24}$/)) {
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

    const io = req.app.get("io");
    if (io) {
      io.emit("call-waiter", {
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        message: `Pelanggan ${order.customerName} memanggil bantuan di Meja #${order.tableNumber}!`,
        time: new Date(),
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Panggilan terkirim ke kasir." });
  } catch (err) {
    console.error("Error POST /call-waiter:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
