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
const categoryRoutes = require("./routes/categoryRoutes"); // 1. Import router kategori baru

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "https://swiftorderingsystemfrontend.vercel.app",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

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

// Registrasi Routes
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/categories", categoryRoutes); // 2. Daftarkan endpoint API kategori agar error 404 hilang

// Simpan instance io dengan key "io" agar sinkron dengan rute/controller
app.set("io", io);

// Socket.io Connection
io.on("connection", (socket) => {
  console.log("Client terhubung via Socket:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client terputus:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Backend Swift Server running on port ${PORT}`);
});
