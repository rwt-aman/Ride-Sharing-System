const express = require("express");
const router = express.Router();

router.use("/auth", require("./authRoutes"));
router.use("/users", require("./userRoutes"));
router.use("/rides", require("./rideRoutes"));
router.use("/bookings", require("./bookingRoutes"));

module.exports = router;
