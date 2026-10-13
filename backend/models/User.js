const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Phone number must be a valid 10-digit Indian mobile number"],
    },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // select: false -> these fields are never returned unless a query asks for
    // them with .select("+password"), so they can't leak by accident.
    password: { type: String, required: true, select: false },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null, select: false }, // bcrypt hash, never the raw code
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    lastOtpSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// MongoDB deletes accounts that are still unverified 24 hours after creation.
userSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60, partialFilterExpression: { isVerified: false } }
);

module.exports = mongoose.model("User", userSchema);
