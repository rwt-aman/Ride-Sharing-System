const rateLimit = require("express-rate-limit");

const make = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });

module.exports = {
  generalLimiter: make(15, 200, "Too many requests, please try again later."),
  // login + register: slows down password guessing and mass sign-ups
  authLimiter: make(15, 15, "Too many attempts, please try again later."),
  // verify-otp + resend-otp: a 6-digit code must not be brute-forceable,
  // and resend must not be usable to spam someone's inbox
  otpLimiter: make(15, 10, "Too many verification attempts, please try again later."),
};
