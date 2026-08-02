const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Hadir", "Izin", "Sakit", "Alpha"],
    default: "Hadir",
  },
  checkIn: { type: String },
  checkOut: { type: String },
});

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nickname: { type: String },
    phone: { type: String, required: true },
    position: { type: String, required: true },
    photo: { type: String }, // <-- URL atau path foto profil pegawai
    address: { type: String },
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String },
    },
    baseSalary: { type: Number, default: 0 },
    bankAccount: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountHolder: { type: String },
    },
    status: {
      type: String,
      enum: ["Aktif", "Cuti", "Nonaktif"],
      default: "Aktif",
    },
    attendance: [attendanceSchema],
    payrollHistory: [
      {
        month: { type: String },
        baseSalary: { type: Number },
        bonus: { type: Number, default: 0 },
        deduction: { type: Number, default: 0 },
        totalPaid: { type: Number },
        paidAt: { type: Date, default: Date.now },
        status: { type: String, default: "Lunas" },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Staff", staffSchema);
