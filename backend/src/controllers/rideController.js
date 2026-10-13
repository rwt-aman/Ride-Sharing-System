const mongoose = require("mongoose");
const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const escapeRegex = require("../utils/escapeRegex");
const { rideDto } = require("../utils/serializers");
const { DATE_RE } = require("../validators/schemas");

const createRide = asyncHandler(async (req, res) => {
  const { source, destination, leaveDate, leaveTime, seatsAvailable, note } = req.body;

  // Rider identity comes from the token, never from the request body
  const user = await User.findOne({ studentId: req.user.studentId });
  if (!user) throw new ApiError(404, "User not found");

  await Ride.create({
    studentId: user.studentId,
    riderName: user.fullName,
    phone: user.phoneNumber,
    source,
    destination,
    rideDate: leaveDate,
    timeToLeave: leaveTime,
    seatsAvailable,
    note,
  });

  res.status(201).json({ message: "Ride posted successfully" });
});

const getMyRides = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ studentId: req.user.studentId }).sort({ createdAt: -1 });
  res.json({ rides: rides.map(rideDto) });
});

const searchRides = asyncHandler(async (req, res) => {
  const { date, destination = "" } = req.query;

  if (typeof date !== "string" || !DATE_RE.test(date)) {
    throw new ApiError(400, "A valid date (YYYY-MM-DD) is required");
  }
  if (typeof destination !== "string" || destination.length > 100) {
    throw new ApiError(400, "Invalid destination");
  }

  const query = {
    rideDate: date,
    seatsAvailable: { $gt: 0 },
    studentId: { $ne: req.user.studentId }, // you can't book your own ride, so don't list it
  };
  if (destination.trim()) {
    query.destination = { $regex: escapeRegex(destination.trim()), $options: "i" };
  }

  const rides = await Ride.find(query).sort({ timeToLeave: 1 });
  res.json({ rides: rides.map(rideDto) });
});

const updateRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  if (!ride) throw new ApiError(404, "Ride not found");
  if (ride.studentId !== req.user.studentId) throw new ApiError(403, "You can only edit your own rides");

  const { source, destination, leaveDate, leaveTime, seatsAvailable, note } = req.body;
  if (source !== undefined) ride.source = source;
  if (destination !== undefined) ride.destination = destination;
  if (leaveDate !== undefined) ride.rideDate = leaveDate;
  if (leaveTime !== undefined) ride.timeToLeave = leaveTime;
  if (seatsAvailable !== undefined) ride.seatsAvailable = seatsAvailable;
  if (note !== undefined) ride.note = note;
  await ride.save();

  res.json({ message: "Ride updated successfully!" });
});

const deleteRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  if (!ride) throw new ApiError(404, "Ride not found");
  if (ride.studentId !== req.user.studentId) throw new ApiError(403, "You can only delete your own rides");

  // Transaction: the ride and its bookings are removed together or not at all.
  // (Needs a replica set; MongoDB Atlas always is one.)
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Booking.deleteMany({ rideId: ride._id }, { session });
      await Ride.deleteOne({ _id: ride._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  res.json({ message: "Ride deleted successfully!" });
});

module.exports = { createRide, getMyRides, searchRides, updateRide, deleteRide };
