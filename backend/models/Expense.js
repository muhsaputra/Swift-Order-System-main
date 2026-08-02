const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Contoh: "Beli Gas & Minyak", "Gaji Kasir"
    category: {
      type: String,
      enum: ["Bahan Baku", "Operasional", "Gaji", "Lainnya"],
      default: "Operasional",
    },
    amount: { type: Number, required: true }, // Jumlah nominal pengeluaran
    note: { type: String },
    date: { type: Date, default: Date.now },
    recordedBy: { type: String }, // Username owner yang mencatat
  },
  { timestamps: true },
);

module.exports = mongoose.model("Expense", expenseSchema);
