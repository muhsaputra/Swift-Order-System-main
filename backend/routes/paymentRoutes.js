const express = require("express");
const router = express.Router();
const snap = require("../config/midtrans");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");

// 1. Endpoint untuk Membuat Transaksi Midtrans
router.post("/create-transaction", async (routerReq, routerRes) => {
  try {
    const {
      orderId,
      couponCode: bodyCouponCode,
      discountAmount: bodyDiscountAmount,
    } = routerReq.body;

    // Ambil data pesanan secara lengkap dari database
    const order = await Order.findById(orderId).populate("items.menu");
    if (!order) {
      return routerRes
        .status(404)
        .json({ error: "Pesanan tidak ditemukan di database." });
    }

    let midtransItems = [];
    let calculatedSum = 0;

    // A. Masukkan item menu utama ke dalam array dan akumulasikan nilainya
    (order.items || []).forEach((item) => {
      const itemName = item.menu?.name || item.name || "Menu Item";
      const itemId = item.menu?._id || item.menuId || item._id || "ITEM";
      const itemPrice = Number(item.price || item.menu?.price || 0);
      const itemQty = Number(item.quantity || 1);

      midtransItems.push({
        id: String(itemId),
        price: itemPrice,
        quantity: itemQty,
        name: String(itemName).substring(0, 50),
      });

      calculatedSum += itemPrice * itemQty;
    });

    // B. Cek dan Hitung Diskon Kupon terlebih dahulu dari Request Body atau Database
    let activeCouponCode = bodyCouponCode || order.couponCode;
    let discountAmount = Number(
      bodyDiscountAmount || order.discountAmount || 0,
    );

    if (activeCouponCode && discountAmount === 0) {
      const foundCoupon = await Coupon.findOne({
        code: activeCouponCode.toUpperCase(),
        isActive: true,
      });
      if (foundCoupon) {
        if (foundCoupon.discountType === "percentage") {
          discountAmount = (calculatedSum * foundCoupon.discountValue) / 100;
        } else {
          discountAmount = foundCoupon.discountValue;
        }
      }
    }

    // Pastikan diskon tidak melebihi subtotal
    if (discountAmount > calculatedSum) {
      discountAmount = calculatedSum;
    }

    // Hitung harga setelah diskon
    let priceAfterDiscount = Math.max(0, calculatedSum - discountAmount);

    // C. Masukkan Biaya Layanan (Service Fee 5% dihitung dari harga SETELAH DISKON)
    const serviceFee = Number(
      order.serviceFee || Math.round(priceAfterDiscount * 0.05),
    );

    if (serviceFee > 0) {
      midtransItems.push({
        id: "SERVICE-FEE",
        price: serviceFee,
        quantity: 1,
        name: "Biaya Layanan (Service 5%)",
      });
    }

    // D. Masukkan item diskon ke array midtrans jika ada
    if (discountAmount > 0) {
      midtransItems.push({
        id: `DISCOUNT-${activeCouponCode || "PROMO"}`,
        price: -Math.round(discountAmount),
        quantity: 1,
        name: `Potongan Kupon (${activeCouponCode || "Promo"})`,
      });
    }

    // Total akhir = Harga setelah diskon + Biaya layanan
    let finalGrossAmount = priceAfterDiscount + serviceFee;

    // Definisikan URL Frontend secara dinamis untuk callback redirect Midtrans
    const frontendUrl =
      process.env.FRONTEND_URL ||
      "https://swiftorderingsystemfrontend.vercel.app";

    let parameter = {
      transaction_details: {
        order_id: `ORDER-${order._id}-${Date.now()}`,
        gross_amount: Math.round(finalGrossAmount),
      },
      customer_details: {
        first_name: String(order.customerName || "Pelanggan"),
        email: String(order.customerEmail || "customer@swift.com"),
        phone: String(order.customerPhone || "08123456789"),
      },
      item_details: midtransItems,
      callbacks: {
        finish: `${frontendUrl}/waiting/${order._id}`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    routerRes.status(200).json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (err) {
    console.error("Gagal membuat transaksi Midtrans:", err);
    routerRes.status(500).json({
      error: "Gagal memproses pembayaran dengan Midtrans: " + err.message,
    });
  }
});

// 2. Endpoint Webhook / Notification dari Midtrans (Agar masuk ke Dashboard Kasir)
router.post("/notification", async (req, res) => {
  try {
    const notification = req.body;
    const midtransOrderId = notification.order_id;

    if (!midtransOrderId || midtransOrderId.startsWith("payment_notif_test_")) {
      return res
        .status(200)
        .json({ status: "OK", message: "Test notification received" });
    }

    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    const cleanOrderId = midtransOrderId.replace(/^ORDER-/, "").split("-")[0];
    const isValidObjectId = cleanOrderId.match(/^[0-9a-fA-F]{24}$/);

    let queryConditions = [];
    if (isValidObjectId) {
      queryConditions.push({ _id: cleanOrderId });
    }
    queryConditions.push({ orderId: cleanOrderId });
    queryConditions.push({ orderId: midtransOrderId });

    let order = await Order.findOne({ $or: queryConditions });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Pesanan tidak ditemukan dari webhook" });
    }

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      if (fraudStatus === "accept" || !fraudStatus) {
        order.paymentStatus = "paid";
        order.orderStatus = "processing";
        await order.save();

        const io = req.app.get("io");
        if (io) {
          const populatedOrder = await Order.findById(order._id).populate(
            "items.menu",
          );
          io.emit("new-paid-order", populatedOrder);
          io.emit("order-updated", populatedOrder);
        }
      }
    } else if (["cancel", "deny", "expire"].includes(transactionStatus)) {
      order.paymentStatus = "failed";
      await order.save();
    }

    res.status(200).json({ status: "OK" });
  } catch (err) {
    console.error("Gagal memproses notification Midtrans:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
