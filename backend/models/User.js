const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["cashier", "owner", "kitchen"],
      default: "cashier",
    },
    phone: { type: String, default: "" },
    position: { type: String, default: "Kasir" },
    baseSalary: { type: Number, default: 0 },
    photo: { type: String, default: "" },
    attendance: [
      {
        date: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["Hadir", "Izin", "Sakit"],
          default: "Hadir",
        },
        checkIn: String,
        checkOut: String,
      },
    ],
    payrollHistory: [
      {
        month: String,
        baseSalary: Number,
        bonus: Number,
        deduction: Number,
        totalPaid: Number,
        status: { type: String, default: "Lunas" },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// Middleware pre-save untuk otomatis meng-hash password
userSchema.pre("save", async function () {
  // Jika password tidak diubah, lewati proses hashing
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method untuk verifikasi password saat login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
