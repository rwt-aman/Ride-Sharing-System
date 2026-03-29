const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rideshare";

mongoose.connect(MONGO_URI)
  .then(() => console.log(" MongoDB Connected to:", MONGO_URI))
  .catch(err => console.error(" MongoDB Connection Error:", err));

// ===== SCHEMAS =====
const userSchema = new mongoose.Schema({
  studentId:   { type: String, required: true, unique: true },
  fullName:    { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
}, { timestamps: true });

const rideSchema = new mongoose.Schema({
  studentId:      { type: String, required: true },
  riderName:      { type: String, required: true },
  phone:          { type: String, required: true },
  source:         { type: String, required: true },
  destination:    { type: String, required: true },
  rideDate:       { type: String, required: true },
  timeToLeave:    { type: String, required: true },
  seatsAvailable: { type: Number, required: true },
  note:           { type: String, default: "" },
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  rideId:          { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
  seaterStudentId: { type: String, required: true },
  seaterName:      { type: String, required: true },
  seaterPhone:     { type: String, required: true },
  destination:     { type: String, required: true },
  rideDate:        { type: String, required: true },
  rideTime:        { type: String, required: true },
  status:          { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  bookingTime:     { type: Date, default: Date.now },
});

const User    = mongoose.model("User",    userSchema);
const Ride    = mongoose.model("Ride",    rideSchema);
const Booking = mongoose.model("Booking", bookingSchema);

// ===== TEST ROUTE =====
app.get("/test-db", async (req, res) => {
  const states = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
  res.json({ status: states[mongoose.connection.readyState], time: new Date() });
});

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  try {
    const { studentId, fullName, phoneNumber, email, password } = req.body;
    if (!studentId || !fullName || !phoneNumber || !email || !password)
      return res.json({ success: false, error: "All fields are required" });

    const existing = await User.findOne({ $or: [{ studentId }, { email }] });
    if (existing)
      return res.json({ success: false, error: "Student ID or Email already exists" });

    if (!email.endsWith('@gehu.ac.in'))
      return res.json({ success: false, error: "Only @gehu.ac.in email addresses are allowed!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ studentId, fullName, phoneNumber, email, password: hashedPassword });
    res.json({ success: true, message: "Registration successful!" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.json({ success: false, error: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, error: "Invalid email or password" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.json({ success: false, error: "Invalid email or password" });

    res.json({
      success: true,
      message: "Login successful!",
      user: {
        studentId:   user.studentId,
        fullName:    user.fullName,
        phoneNumber: user.phoneNumber,
        email:       user.email
      }
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===== POST RIDE =====
app.post("/post-ride", async (req, res) => {
  try {
    const { riderName, phoneNo, source, destination, leaveDate,
            leaveTime, seatsAvailable, note, studentId } = req.body;

    if (!riderName || !phoneNo || !source || !destination ||
        !leaveDate || !leaveTime || !seatsAvailable || !studentId)
      return res.json({ success: false, error: "Missing required ride fields" });

    await Ride.create({
      studentId, riderName, phone: phoneNo, source, destination,
      rideDate: leaveDate, timeToLeave: leaveTime,
      seatsAvailable: Number(seatsAvailable), note: note || ""
    });
    res.json({ success: true, message: "Ride posted successfully" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===== EDIT RIDE =====
app.post("/edit-ride", async (req, res) => {
  try {
    const { rideId, source, destination, leaveDate, leaveTime, seatsAvailable, note, studentId } = req.body;

    if (!rideId || !studentId)
      return res.json({ success: false, error: "Ride ID and Student ID required" });

    const ride = await Ride.findOne({ _id: rideId, studentId });
    if (!ride)
      return res.json({ success: false, error: "Ride not found or unauthorized" });

    await Ride.findByIdAndUpdate(rideId, {
      source,
      destination,
      rideDate: leaveDate,
      timeToLeave: leaveTime,
      seatsAvailable: Number(seatsAvailable),
      note: note || ""
    });

    res.json({ success: true, message: "Ride updated successfully!" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===== DELETE RIDE =====
app.post("/delete-ride", async (req, res) => {
  try {
    const { rideId, studentId } = req.body;

    if (!rideId || !studentId)
      return res.json({ success: false, error: "Ride ID and Student ID required" });

    const ride = await Ride.findOne({ _id: rideId, studentId });
    if (!ride)
      return res.json({ success: false, error: "Ride not found or unauthorized" });

    await Ride.findByIdAndDelete(rideId);
    await Booking.deleteMany({ rideId });

    res.json({ success: true, message: "Ride deleted successfully!" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===== GET MY RIDES =====
app.get("/my-rides", async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId)
      return res.json({ rides: [], error: "Student ID required" });

    const rides = await Ride.find({ studentId }).sort({ createdAt: -1 });
    res.json({
      rides: rides.map(r => ({
        ride_id:         r._id,
        rider_name:      r.riderName,
        phone:           r.phone,
        source:          r.source,
        destination:     r.destination,
        ride_date:       r.rideDate,
        time_to_leave:   r.timeToLeave,
        seats_available: r.seatsAvailable,
        note:            r.note
      }))
    });
  } catch (err) {
    res.json({ rides: [], error: err.message });
  }
});

// ===== SEARCH RIDES =====
app.get("/search-rides", async (req, res) => {
  try {
    const destination = req.query.destination || "";
    const searchDate  = req.query.date;

    if (!searchDate)
      return res.json({ rides: [], error: "Date is required" });

    const query = { rideDate: searchDate, seatsAvailable: { $gt: 0 } };
    if (destination.trim())
      query.destination = { $regex: destination, $options: "i" };

    const rides = await Ride.find(query).sort({ timeToLeave: 1 });
    res.json({
      rides: rides.map(r => ({
        ride_id:         r._id,
        rider_name:      r.riderName,
        phone:           r.phone,
        source:          r.source,
        destination:     r.destination,
        ride_date:       r.rideDate,
        time_to_leave:   r.timeToLeave,
        seats_available: r.seatsAvailable,
        note:            r.note
      }))
    });
  } catch (err) {
    res.json({ rides: [], error: err.message });
  }
});

// ===== CONFIRM BOOKING =====
app.post("/confirm-booking", async (req, res) => {
  try {
    const { rideId, seaterName, seaterPhone, seaterStudentId, destination, rideDate, rideTime } = req.body;

    if (!rideId || !seaterName || !seaterPhone || !seaterStudentId)
      return res.json({ success: false, error: "Missing booking information" });

    const existing = await Booking.findOne({ rideId, seaterStudentId, status: { $ne: "rejected" } });
    if (existing)
      return res.json({ success: false, error: "You already have a booking for this ride" });

    await Booking.create({ rideId, seaterStudentId, seaterName, seaterPhone, destination, rideDate, rideTime });
    res.json({ success: true, message: "Booking request sent! Waiting for rider approval." });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===== RIDER BOOKINGS =====
app.get("/rider-bookings", async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.json({ bookings: [], error: "Student ID required" });

    const rides = await Ride.find({ studentId });
    const rideIds = rides.map(r => r._id);
    const bookings = await Booking.find({ rideId: { $in: rideIds } }).sort({ bookingTime: -1 });

    res.json({
      bookings: bookings.map(b => ({
        bookingId:   b._id,
        seaterName:  b.seaterName,
        seaterPhone: b.seaterPhone,
        destination: b.destination,
        rideDate:    b.rideDate,
        rideTime:    b.rideTime,
        bookingTime: b.bookingTime,
        status:      b.status
      }))
    });
  } catch (err) {
    res.json({ bookings: [], error: err.message });
  }
});

// ===== ACCEPT BOOKING =====
app.post("/accept-booking", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.json({ success: false, error: "Booking ID required" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.json({ success: false, error: "Booking not found" });

    await Booking.findByIdAndUpdate(bookingId, { status: "accepted" });
    await Ride.findByIdAndUpdate(booking.rideId, { $inc: { seatsAvailable: -1 } });

    res.json({ success: true, message: "Booking accepted!" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===== REJECT BOOKING =====
app.post("/reject-booking", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.json({ success: false, error: "Booking ID required" });
    await Booking.findByIdAndUpdate(bookingId, { status: "rejected" });
    res.json({ success: true, message: "Booking rejected!" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===== CANCEL BOOKING =====
app.post("/cancel-booking", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.json({ success: false, error: "Booking ID required" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.json({ success: false, error: "Booking not found" });

    const wasAccepted = booking.status === "accepted";
    await Booking.findByIdAndDelete(bookingId);

    if (wasAccepted)
      await Ride.findByIdAndUpdate(booking.rideId, { $inc: { seatsAvailable: 1 } });

    res.json({ success: true, message: "Booking cancelled successfully!" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===== SEATER BOOKINGS =====
app.get("/seater-bookings", async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.json({ bookings: [], error: "Student ID required" });

    const bookings = await Booking.find({ seaterStudentId: studentId })
      .populate("rideId").sort({ bookingTime: -1 });

    res.json({
      bookings: bookings.map(b => ({
        bookingId:   b._id,
        riderName:   b.rideId?.riderName || "",
        riderPhone:  b.rideId?.phone     || "",
        source:      b.rideId?.source    || "",
        destination: b.destination,
        rideDate:    b.rideDate,
        rideTime:    b.rideTime,
        bookingTime: b.bookingTime,
        status:      b.status
      }))
    });
  } catch (err) {
    res.json({ bookings: [], error: err.message });
  }
});

// ===== GET PROFILE =====
app.get("/profile", async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.json({ success: false, error: "Student ID required" });

    const user = await User.findOne({ studentId });
    if (!user) return res.json({ success: false, error: "User not found" });

    res.json({
      success: true,
      user: {
        studentId:   user.studentId,
        fullName:    user.fullName,
        phoneNumber: user.phoneNumber,
        email:       user.email,
        createdAt:   user.createdAt
      }
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ===== UPDATE PROFILE =====
app.post("/update-profile", async (req, res) => {
  try {
    const { studentId, fullName, phoneNumber, currentPassword, newPassword } = req.body;

    if (!studentId) return res.json({ success: false, error: "Student ID required" });
    if (!fullName || !phoneNumber) return res.json({ success: false, error: "Name and phone are required" });

    const user = await User.findOne({ studentId });
    if (!user) return res.json({ success: false, error: "User not found" });

    // If user wants to change password
    if (newPassword) {
      if (!currentPassword) return res.json({ success: false, error: "Current password is required to set a new password" });

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) return res.json({ success: false, error: "Current password is incorrect" });

      user.password = await bcrypt.hash(newPassword, 10);
    }

    user.fullName    = fullName;
    user.phoneNumber = phoneNumber;
    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        studentId:   user.studentId,
        fullName:    user.fullName,
        phoneNumber: user.phoneNumber,
        email:       user.email
      }
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
