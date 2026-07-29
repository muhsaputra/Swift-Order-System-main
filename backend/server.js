const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const tableRoutes = require("./routes/tableRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const couponRoutes = require("./routes/couponRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "https://swiftorderingsystemfrontend.vercel.app",
  "https://www.swiftorder.space",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

// 1. SIMPAN INSTANCE IO LEBIH AWAL AGAR SIAP DIGUNAKAN DI MANA SAJA
app.set("io", io);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());

// Koneksi MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database MongoDB Terhubung!🚀"))
  .catch((err) => console.log("Gagal Koneksi DB:", err));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Swift Ordering Backend Running 🚀",
  });
});

// 2. REGISTRASI ROUTES (Routes sekarang sudah bisa dengan aman memanggil req.app.get("io"))
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/categories", categoryRoutes);

// Socket.io Connection Listener
io.on("connection", (socket) => {
  console.log("Client terhubung via Socket:", socket.id);

  // Jika Anda ingin client join room berdasarkan order tertentu
  socket.on("join-order", (orderId) => {
    socket.join(orderId);
  });

  socket.on("disconnect", () => {
    console.log("Client terputus:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Backend Swift Server running on port ${PORT}`);
});
