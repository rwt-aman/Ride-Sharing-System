const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/bookings  { rideId }
const createBooking = asyncHandler(async (req, res) => {
  const { rideId } = req.body;
  const { studentId } = req.user;

  const ride = await Ride.findById(rideId);
  if (!ride) throw new ApiError(404, "Ride not found");
  if (ride.studentId === studentId) throw new ApiError(403, "You cannot book your own ride");
  // Early, friendly check only. The authoritative seat check happens atomically on accept.
  if (ride.seatsAvailable <= 0) throw new ApiError(409, "No seats available on this ride");

  const user = await User.findOne({ studentId });
  if (!user) throw new ApiError(404, "User not found");

  const existing = await Booking.findOne({ rideId, seaterStudentId: studentId });
  if (existing) {
    if (existing.status !== "rejected") {
      throw new ApiError(409, "You already have an active booking for this ride");
    }
    // Re-request after a rejection: reopen the same document (the unique index allows only one)
    const reopened = await Booking.findOneAndUpdate(
      { _id: existing._id, status: "rejected" },
      { status: "pending", bookingTime: new Date(), seaterName: user.fullName, seaterPhone: user.phoneNumber }
    );
    if (!reopened) throw new ApiError(409, "You already have an active booking for this ride");
  } else {
    try {
      await Booking.create({
        rideId,
        seaterStudentId: studentId,
        seaterName: user.fullName,
        seaterPhone: user.phoneNumber,
      });
    } catch (err) {
      // Two simultaneous requests: the unique index rejected the second one
      if (err.code === 11000) throw new ApiError(409, "You already have an active booking for this ride");
      throw err;
    }
  }

  res.status(201).json({ message: "Booking request sent! Waiting for rider approval." });
});

// GET /api/bookings/mine  (bookings I made as a passenger)
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ seaterStudentId: req.user.studentId })
    .populate("rideId")
    .sort({ bookingTime: -1 });

  res.json({
    bookings: bookings
      .filter((b) => b.rideId) // skip bookings whose ride no longer exists
      .map((b) => ({
        bookingId: b._id,
        rideId: b.rideId._id,
        riderName: b.rideId.riderName,
        riderPhone: b.rideId.phone,
        source: b.rideId.source,
        destination: b.rideId.destination,
        rideDate: b.rideId.rideDate,
        rideTime: b.rideId.timeToLeave,
        bookingTime: b.bookingTime,
        status: b.status,
      })),
  });
});

// GET /api/bookings/received  (requests on rides I posted)
const getReceivedBookings = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ studentId: req.user.studentId });
  const rideById = new Map(rides.map((r) => [r._id.toString(), r]));

  const bookings = await Booking.find({ rideId: { $in: rides.map((r) => r._id) } }).sort({ bookingTime: -1 });

  res.json({
    bookings: bookings.map((b) => {
      const ride = rideById.get(b.rideId.toString());
      return {
        bookingId: b._id,
        rideId: b.rideId,
        seaterName: b.seaterName,
        seaterPhone: b.seaterPhone,
        destination: ride.destination,
        rideDate: ride.rideDate,
        rideTime: ride.timeToLeave,
        bookingTime: b.bookingTime,
        status: b.status,
      };
    }),
  });
});

// PATCH /api/bookings/:id  { status: "accepted" | "rejected" }
// Each status change is one atomic findOneAndUpdate that only matches the
// expected current status, so double-clicks and concurrent requests can't
// change a seat count twice.
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found");

  const ride = await Ride.findById(booking.rideId);
  if (!ride) throw new ApiError(404, "Ride not found");
  if (ride.studentId !== req.user.studentId) {
    throw new ApiError(403, "Only the ride owner can respond to bookings");
  }

  if (status === "accepted") {
    // Step 1: claim the booking (pending -> accepted). Only one request can win.
    const claimed = await Booking.findOneAndUpdate(
      { _id: booking._id, status: "pending" },
      { status: "accepted" }
    );
    if (!claimed) throw new ApiError(409, `This booking is already ${booking.status}`);

    // Step 2: take a seat only if one is left. The check and the decrement are one operation.
    const seat = await Ride.findOneAndUpdate(
      { _id: ride._id, seatsAvailable: { $gt: 0 } },
      { $inc: { seatsAvailable: -1 } }
    );
    if (!seat) {
      // No seat: undo step 1 so the booking isn't left "accepted" without a seat
      await Booking.updateOne({ _id: booking._id, status: "accepted" }, { status: "pending" });
      throw new ApiError(409, "No seats left");
    }

    return res.json({ message: "Booking accepted!", status: "accepted" });
  }

  // status === "rejected": allowed from "pending" or "accepted"
  const previous = await Booking.findOneAndUpdate(
    { _id: booking._id, status: { $in: ["pending", "accepted"] } },
    { status: "rejected" } // returns the document as it was BEFORE the update
  );
  if (!previous) throw new ApiError(409, "This booking is already rejected");

  if (previous.status === "accepted") {
    await Ride.updateOne({ _id: ride._id }, { $inc: { seatsAvailable: 1 } });
  }

  res.json({ message: "Booking rejected!", status: "rejected" });
});

// DELETE /api/bookings/:id  (the passenger cancels their own booking)
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.seaterStudentId !== req.user.studentId) {
    throw new ApiError(403, "You can only cancel your own bookings");
  }

  // Only one concurrent request gets the deleted document back,
  // so the seat can be returned at most once.
  const deleted = await Booking.findOneAndDelete({ _id: booking._id });
  if (!deleted) throw new ApiError(404, "Booking not found");

  if (deleted.status === "accepted") {
    await Ride.updateOne({ _id: deleted.rideId }, { $inc: { seatsAvailable: 1 } });
  }

  res.json({ message: "Booking cancelled successfully!" });
});

module.exports = { createBooking, getMyBookings, getReceivedBookings, updateBookingStatus, cancelBooking };
