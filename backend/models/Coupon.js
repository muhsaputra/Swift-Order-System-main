const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"], // "percentage" (persen) atau "fixed" (potongan nominal rupiah)
      required: true,
    },
    discountValue: {
      type: Number,
      required: true, // Contoh: 10 untuk 10%, atau 15000 untuk potongan Rp 15.000
    },
    minPurchase: {
      type: Number,
      default: 0, // Minimal total belanja agar kupon bisa dipakai
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Coupon", couponSchema);
