const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  serviceFeePercentage: { type: Number, default: 5 },
});

module.exports = mongoose.model("Setting", settingSchema);
