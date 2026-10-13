// Shapes sent to the client. Ride fields stay snake_case so the existing
// frontend keeps working; normalising to camelCase is a good later cleanup.
const userDto = (u) => ({
  studentId: u.studentId,
  fullName: u.fullName,
  phoneNumber: u.phoneNumber,
  email: u.email,
  createdAt: u.createdAt,
});

const rideDto = (r) => ({
  ride_id: r._id,
  rider_name: r.riderName,
  phone: r.phone,
  source: r.source,
  destination: r.destination,
  ride_date: r.rideDate,
  time_to_leave: r.timeToLeave,
  seats_available: r.seatsAvailable,
  note: r.note,
});

module.exports = { userDto, rideDto };
