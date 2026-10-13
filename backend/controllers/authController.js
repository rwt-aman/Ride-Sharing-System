const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { userDto } = require("../utils/serializers");
const { JWT_SECRET } = require("../config/env");
const { issueOtp, OTP_RESEND_COOLDOWN_MS, MAX_OTP_ATTEMPTS } = require("../services/otpService");

// Compared against when the email doesn't exist, so "unknown email" and
// "wrong password" take the same time and can't be told apart by timing.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const register = asyncHandler(async (req, res) => {
  const { studentId, fullName, phoneNumber, email, password } = req.body;

  const verified = await User.findOne({ isVerified: true, $or: [{ studentId }, { email }] });
  if (verified) throw new ApiError(409, "Student ID or email already registered");

  // Unverified sign-ups never proved they own the email, so a new attempt replaces them.
  await User.deleteMany({ isVerified: false, $or: [{ studentId }, { email }] });

  const user = await User.create({
    studentId,
    fullName,
    phoneNumber,
    email,
    password: await bcrypt.hash(password, 10),
  });
  await issueOtp(user);

  res.status(201).json({
    message: "Registration successful! Enter the code we emailed you to verify your account.",
    requiresVerification: true,
    email,
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Count the attempt atomically BEFORE checking the code. Concurrent guesses
  // each consume one attempt, so the 5-attempt limit can't be raced.
  const user = await User.findOneAndUpdate(
    { email, isVerified: false, otp: { $ne: null } },
    { $inc: { otpAttempts: 1 } },
    { new: true }
  ).select("+otp");

  if (!user) throw new ApiError(400, "Invalid or expired code. Please request a new one.");

  if (user.otpAttempts > MAX_OTP_ATTEMPTS || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    const tooMany = user.otpAttempts > MAX_OTP_ATTEMPTS;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    throw new ApiError(
      tooMany ? 429 : 400,
      tooMany ? "Too many failed attempts. Please request a new code." : "Code expired. Please request a new one."
    );
  }

  if (!(await bcrypt.compare(otp, user.otp))) {
    const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts;
    throw new ApiError(400, `Incorrect code. ${remaining} attempt(s) remaining.`);
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  await user.save();

  res.json({ message: "Email verified! You can now log in." });
});

const resendOtp = asyncHandler(async (req, res) => {
  // Same response whether or not the account exists, to avoid revealing which emails are registered
  const generic = { message: "If that email has a pending registration, a new code has been sent." };

  const user = await User.findOne({ email: req.body.email, isVerified: false });
  if (!user) return res.json(generic);

  const elapsed = Date.now() - (user.lastOtpSentAt ? user.lastOtpSentAt.getTime() : 0);
  if (elapsed < OTP_RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
    throw new ApiError(429, `Please wait ${wait} seconds before requesting a new code.`);
  }

  await issueOtp(user);
  res.json(generic);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  const passwordOk = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !passwordOk) throw new ApiError(401, "Invalid email or password");

  // Checked only after the password is correct, so this can't be used to probe for accounts
  if (!user.isVerified) {
    return res.status(403).json({
      error: "Email not verified. Please verify your email before logging in.",
      requiresVerification: true,
      email: user.email,
    });
  }

  const token = jwt.sign({ studentId: user.studentId }, JWT_SECRET, { expiresIn: "1d", algorithm: "HS256" });
  res.json({ message: "Login successful!", token, user: userDto(user) });
});

module.exports = { register, verifyOtp, resendOtp, login };
