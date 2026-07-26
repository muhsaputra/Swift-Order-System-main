const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "swift_super_secret_key_2026";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("AUTH HEADER RECEIVED:", authHeader); // <- TAMBAHKAN LOG INI

  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    console.log("GAGAL: Token tidak ditemukan di header!");
    return res
      .status(401)
      .json({ error: "Akses ditolak, token tidak ditemukan" });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    console.log(
      "BERHASIL: Token valid untuk user ID:",
      verified.id || verified._id,
    );
    next();
  } catch (err) {
    console.log("GAGAL: Token tidak valid atau kedaluwarsa:", err.message);
    res.status(403).json({ error: "Token tidak valid atau kedaluwarsa" });
  }
};

module.exports = { verifyToken, JWT_SECRET };
