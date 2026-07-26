// middleware/authMiddleware.js
const verifyOwner = (req, res, next) => {
  // Asumsi req.user sudah di-decode dari token JWT sebelumnya
  if (req.user && req.user.role === "owner") {
    next();
  } else {
    return res.status(403).json({ error: "Akses ditolak. Khusus Owner." });
  }
};

module.exports = { verifyOwner };
