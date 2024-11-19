const { Schema, model } = require("mongoose");

const emailVerificationSchema = Schema({
  userId: String,
  token: String,
  createdAt: Date,
  expiresAt: Date,
});

module.exports = model("Verification", emailVerificationSchema);
