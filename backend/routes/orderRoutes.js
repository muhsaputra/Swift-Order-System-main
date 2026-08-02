const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Table = require("../models/Table"); // Tambahkan import model Table untuk update status meja
const Menu = require("../models/Menu"); // <-- Import model Menu untuk mengambil data resep (ingredients)
const Inventory = require("../models/Inventory"); // <-- Import model Inventory untuk update stok gudang
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

    const initialPaymentStatus =
      paymentMethod === "cash" ? "cash_pending" : "pending";

    const customOrderId = `SWIFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = new Order({
      orderId: customOrderId,
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

    if (savedOrder.paymentMethod === "qris") {
      savedOrder.qrisData = {
        qrString: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SWIFT-PAY-${savedOrder._id}`,
        expiredAt: new Date(Date.now() + 15 * 60 * 1000),
      };
      await savedOrder.save();
    }

    const populatedOrder = await Order.findById(savedOrder._id).populate(
      "items.menu",
    );

    if (customerPhone) {
      const welcomeMsg =
        `Halo *${customerName}*,\n\nTerima kasih telah memesan di Swift Order!\n` +
        `No Pesanan: *#${customOrderId}*\n` +
        `Nomor Meja: *${tableNumber}*\n` +
        `Status: *Menunggu Pembayaran / Diproses*\n\n` +
        `Kami akan segera menyiapkan pesanan Anda.`;
      await sendWhatsAppMessage(customerPhone, welcomeMsg);
    }

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

// 2. Ambil Detail Pesanan berdasarkan ID
router.get("/:id", async (req, res) => {
  try {
    const identifier = req.params.id;
    let order = null;

    if (identifier && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(identifier).populate("items.menu");
    }

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

// 3. Update Pembayaran / Webhook
router.patch("/:id/pay", async (req, res) => {
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
      return res
        .status(404)
        .json({ error: "Pesanan tidak ditemukan di database" });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "processing";
    const updatedOrder = await order.save();

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
    order.orderStatus = "processing";
    const updatedOrder = await order.save();

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

// 4. Update Status Pesanan oleh Kasir (Dilengkapi Otomatisasi Pemotongan Stok Inventaris via BOM)
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const identifier = req.params.id;
    const { status } = req.body;
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

    // Cegah pemotongan stok ganda jika status sebelumnya sudah completed lalu di-update lagi
    const wasAlreadyCompleted = order.orderStatus === "completed";
    order.orderStatus = status;

    if (status === "completed") {
      order.paymentStatus = "paid";
      await Table.findOneAndUpdate(
        { tableNumber: order.tableNumber },
        { isOccupied: false, currentOrder: null },
      );

      // --- LOGIKA PEMOTONGAN STOK INVENTARIS (BOM) ---
      if (!wasAlreadyCompleted && order.items && order.items.length > 0) {
        for (let item of order.items) {
          // Ambil dokumen Menu berdasarkan ID untuk membaca resep (ingredients)
          const menuDoc = await Menu.findById(item.menu).populate(
            "ingredients.inventoryItem",
          );

          if (
            menuDoc &&
            menuDoc.ingredients &&
            menuDoc.ingredients.length > 0
          ) {
            for (let ing of menuDoc.ingredients) {
              if (ing.inventoryItem) {
                const totalDeduction = ing.qtyNeeded * (item.quantity || 1);

                // Kurangi stok di koleksi Inventory secara atomik ($inc dengan nilai minus)
                await Inventory.findByIdAndUpdate(ing.inventoryItem._id, {
                  $inc: { stock: -totalDeduction },
                  updatedAt: new Date(),
                });
              }
            }
          }
        }
      }
      // ----------------------------------------------

      if (order.customerPhone) {
        let itemsList = (order.items || [])
          .map((i) => {
            const itemName = i.menu?.name || i.name || "Menu";
            const itemPrice = Number(i.price || 0);
            return `- ${itemName} (${i.quantity || 1}x) @Rp${itemPrice.toLocaleString("id-ID")}`;
          })
          .join("\n");

        const subtotalVal = Number(order.subtotal || order.totalAmount || 0);
        const discountVal = Number(order.discountAmount || 0);
        const serviceFeeVal = Number(order.serviceFee || 0);
        const totalVal = Number(order.totalAmount || 0);

        const receiptMessage =
          `*STRUK DIGITAL SWIFT ORDER* 🧾\n\n` +
          `No Pesanan: #${order.orderId || order._id}\n` +
          `Nama: ${order.customerName || "Pelanggan"}\n` +
          `Meja: ${order.tableNumber || "-"}\n` +
          `Status: Selesai ✅\n\n` +
          `*Rincian Pesanan:*\n${itemsList}\n\n` +
          `Subtotal: Rp${subtotalVal.toLocaleString("id-ID")}\n` +
          `Diskon: Rp${discountVal.toLocaleString("id-ID")}\n` +
          `Biaya Layanan: Rp${serviceFeeVal.toLocaleString("id-ID")}\n` +
          `*Total Pembayaran: Rp${totalVal.toLocaleString("id-ID")}*\n\n` +
          `Terima kasih telah berkunjung ke Swift Order! 🙏`;

        await sendWhatsAppMessage(order.customerPhone, receiptMessage);
      }
    }

    const updatedOrder = await order.save();

    let populatedOrder = updatedOrder;
    try {
      populatedOrder = await Order.findById(updatedOrder._id).populate(
        "items.menu",
      );
    } catch (popErr) {
      console.warn("Warning populate menu:", popErr.message);
    }

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

// 5. Ambil semua pesanan untuk Dashboard Kasir
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

// 6. Endpoint untuk memanggil pelayan / bantuan dari meja
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
