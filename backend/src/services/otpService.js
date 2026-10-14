const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendOtpEmail } = require("./mailService");
const ApiError = require("../utils/ApiError");

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// crypto.randomInt is cryptographically secure (Math.random is not)
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

// Generates a code, stores only its bcrypt hash, and emails the raw code.
async function issueOtp(user) {
  const otp = generateOtp();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  user.lastOtpSentAt = new Date();
  await user.save();

  try {
    await sendOtpEmail(user.email, otp);
  } catch (err) {
    console.error("OTP email failed:", err.message);
    // Let the user retry immediately instead of waiting out the cooldown
    user.lastOtpSentAt = null;
    await user.save();
    throw new ApiError(502, "Could not send the verification email. Please try again.");
  }
}

async function issueResetOtp(user) {
  const otp = generateOtp();
  user.resetOtp = await bcrypt.hash(otp, 10);
  user.resetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.resetOtpAttempts = 0;
  user.lastResetOtpSentAt = new Date();
  await user.save();
  return otp;
}

module.exports = { issueOtp, issueResetOtp, OTP_RESEND_COOLDOWN_MS, MAX_OTP_ATTEMPTS };

