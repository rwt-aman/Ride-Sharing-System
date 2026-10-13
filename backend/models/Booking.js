const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
  seaterStudentId: { type: String, required: true },
  // Snapshot of the seater's contact details, refreshed when they edit their profile.
  // Route/date/time are NOT stored here: they are always read from the Ride.
  seaterName: { type: String, required: true },
  seaterPhone: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  bookingTime: { type: Date, default: Date.now },
});

// One booking document per (ride, seater). The database enforces this, so two
// simultaneous requests can't create duplicates. A rejected booking is reopened
// (set back to "pending") instead of inserting a second document.
bookingSchema.index({ rideId: 1, seaterStudentId: 1 }, { unique: true });
bookingSchema.index({ seaterStudentId: 1, bookingTime: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
