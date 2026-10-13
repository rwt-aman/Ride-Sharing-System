const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    riderName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true, maxlength: 200 },
    destination: { type: String, required: true, trim: true, maxlength: 200 },
    // Kept as strings on purpose: the API validates "YYYY-MM-DD" and "HH:mm",
    // and in that format string order equals chronological order, so exact-date
    // lookups and time sorting work. Switch to Date if you add range queries.
    rideDate: { type: String, required: true },
    timeToLeave: { type: String, required: true },
    seatsAvailable: { type: Number, required: true, min: 0 },
    note: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true }
);

rideSchema.index({ studentId: 1, createdAt: -1 }); // "my rides"
rideSchema.index({ rideDate: 1, seatsAvailable: 1 }); // search

module.exports = mongoose.model("Ride", rideSchema);
