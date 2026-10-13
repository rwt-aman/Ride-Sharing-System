const router = require("express").Router();
const { validate } = require("../middleware/validate");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiters");
const schemas = require("../validators/schemas");
const c = require("../controllers/authController");

router.post("/register", authLimiter, validate(schemas.register), c.register);
router.post("/verify-otp", otpLimiter, validate(schemas.verifyOtp), c.verifyOtp);
router.post("/resend-otp", otpLimiter, validate(schemas.resendOtp), c.resendOtp);
router.post("/login", authLimiter, validate(schemas.login), c.login);

module.exports = router;
