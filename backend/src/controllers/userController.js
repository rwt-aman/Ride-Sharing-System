const bcrypt = require("bcrypt");
const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { userDto } = require("../utils/serializers");

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findOne({ studentId: req.user.studentId });
  if (!user) throw new ApiError(404, "User not found");
  res.json({ user: userDto(user) });
});

const updateMe = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, currentPassword, newPassword } = req.body;
  const { studentId } = req.user;

  const user = await User.findOne({ studentId }).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  if (newPassword) {
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      // 400, not 401: the frontend logs the user out on 401, and a typo shouldn't do that
      throw new ApiError(400, "Current password is incorrect");
    }
    user.password = await bcrypt.hash(newPassword, 10);
  }

  user.fullName = fullName;
  user.phoneNumber = phoneNumber;
  await user.save();

  // Keep the copies of name/phone on this user's rides and bookings current
  await Promise.all([
    Ride.updateMany({ studentId }, { riderName: fullName, phone: phoneNumber }),
    Booking.updateMany({ seaterStudentId: studentId }, { seaterName: fullName, seaterPhone: phoneNumber }),
  ]);

  res.json({ message: "Profile updated successfully!", user: userDto(user) });
});

module.exports = { getMe, updateMe };
