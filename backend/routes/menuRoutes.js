const express = require("express");
const router = express.Router();
const Menu = require("../models/Menu");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function untuk upload ke Cloudinary via Buffer Stream dengan pengaman
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error("Buffer file tidak ditemukan untuk di-upload"));
    }
    let stream = cloudinary.uploader.upload_stream(
      { folder: "swift-ordering/menus" },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      },
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// 1. Ambil semua menu
router.get("/", async (req, res) => {
  try {
    const menus = await Menu.find().sort({ createdAt: -1 });
    res.json(menus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Tambah menu baru dengan gambar & dukungan promo/bundle
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      isBundle,
      bundleOptions,
    } = req.body;

    let imageUrl = "";
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    }

    const newMenu = new Menu({
      name,
      description: description || "",
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      category,
      image: imageUrl,
      isAvailable: true,
      isBundle: isBundle === "true" || isBundle === true,
      bundleOptions: bundleOptions ? JSON.parse(bundleOptions) : [],
    });

    const savedMenu = await newMenu.save();
    console.log("Menu berhasil disimpan dengan URL gambar:", savedMenu.image);

    const io = req.app.get("io") || req.app.get("socketio");
    if (io) {
      io.emit("menu-updated", savedMenu);
    }

    res.status(201).json(savedMenu);
  } catch (err) {
    console.error("Gagal menambah menu:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// 3. Update Menu (Mendukung pembaruan harga, originalPrice, dan bundle)
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      isAvailable,
      isBundle,
      bundleOptions,
    } = req.body;

    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ error: "Menu tidak ditemukan" });

    let imageUrl = menu.image;
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    }

    menu.name = name !== undefined ? name : menu.name;
    menu.description =
      description !== undefined ? description : menu.description;
    menu.price = price !== undefined ? Number(price) : menu.price;
    menu.originalPrice =
      originalPrice !== undefined ? Number(originalPrice) : menu.originalPrice;
    menu.category = category !== undefined ? category : menu.category;
    menu.isAvailable =
      isAvailable !== undefined
        ? isAvailable === "true" || isAvailable === true
        : menu.isAvailable;
    menu.isBundle =
      isBundle !== undefined
        ? isBundle === "true" || isBundle === true
        : menu.isBundle;
    menu.bundleOptions =
      bundleOptions !== undefined
        ? typeof bundleOptions === "string"
          ? JSON.parse(bundleOptions)
          : bundleOptions
        : menu.bundleOptions;
    menu.image = imageUrl;

    const updatedMenu = await menu.save();

    const io = req.app.get("io") || req.app.get("socketio");
    if (io) {
      io.emit("menu-status-updated", updatedMenu);
      io.emit("menu-updated", updatedMenu);
    }

    res.json(updatedMenu);
  } catch (err) {
    console.error("Gagal update menu:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Toggle Status Ketersediaan Menu
router.patch("/:id/toggle", verifyToken, async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ error: "Menu tidak ditemukan" });

    menu.isAvailable = !menu.isAvailable;
    const updatedMenu = await menu.save();

    const io = req.app.get("io") || req.app.get("socketio");
    if (io) {
      io.emit("menu-status-updated", updatedMenu);
      io.emit("menu-updated", updatedMenu);
    }

    res.json(updatedMenu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Hapus Menu
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deletedMenu = await Menu.findByIdAndDelete(req.params.id);
    if (!deletedMenu)
      return res.status(404).json({ error: "Menu tidak ditemukan" });

    const io = req.app.get("io") || req.app.get("socketio");
    if (io) {
      io.emit("menu-deleted", req.params.id);
    }

    res.json({ message: "Menu berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
