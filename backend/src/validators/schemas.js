// All request-body validation lives here (zod).
const { z } = require("zod");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // what <input type="date"> sends
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // what <input type="time"> sends

const email = z.string().trim().toLowerCase().email("Invalid email format").max(254);
// bcrypt only uses the first 72 bytes, so longer passwords add nothing
const password = z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long");
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number");
// Adjust this pattern to your college's real ID format
const studentId = z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_-]+$/, "Only letters, numbers, - and _ allowed");
const fullName = z.string().trim().min(2, "Name is too short").max(100);
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format");

const dateStr = z.string().regex(DATE_RE, "Date must be YYYY-MM-DD");
const timeStr = z.string().regex(TIME_RE, "Time must be HH:mm");
const place = z.string().trim().min(1, "Required").max(200);
const note = z.string().trim().max(500);

const register = z.object({ studentId, fullName, phoneNumber: phone, email, password });
const login = z.object({ email, password: z.string().min(1, "Password is required") });
const verifyOtp = z.object({ email, otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits") });
const resendOtp = z.object({ email });

const updateProfile = z
  .object({
    fullName,
    phoneNumber: phone,
    currentPassword: z.string().optional(),
    newPassword: password.optional(),
  })
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: "Current password is required to set a new password",
    path: ["currentPassword"],
  });

const createRide = z.object({
  source: place,
  destination: place,
  leaveDate: dateStr,
  leaveTime: timeStr,
  seatsAvailable: z.coerce.number().int().min(1, "At least 1 seat").max(10, "At most 10 seats"),
  note: note.optional().default(""),
});

const updateRide = z.object({
  source: place.optional(),
  destination: place.optional(),
  leaveDate: dateStr.optional(),
  leaveTime: timeStr.optional(),
  seatsAvailable: z.coerce.number().int().min(0).max(10).optional(),
  note: note.optional(),
});

const createBooking = z.object({ rideId: objectId });

const bookingStatus = z.object({
  status: z.enum(["accepted", "rejected"], {
    errorMap: () => ({ message: "Status must be 'accepted' or 'rejected'" }),
  }),
});

module.exports = {
  DATE_RE,
  register,
  login,
  verifyOtp,
  resendOtp,
  updateProfile,
  createRide,
  updateRide,
  createBooking,
  bookingStatus,
};
