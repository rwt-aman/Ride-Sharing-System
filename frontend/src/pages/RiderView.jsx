import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft } from '../components/Icons';
import { postRide, getMyRides, deleteRide as deleteRideApi, editRide, getRiderBookings, acceptBooking as acceptBookingApi, rejectBooking as rejectBookingApi } from '../api';

import { to24Hour, from24Hour, formatTime12 } from '../utils/time';

export default function RiderView({ onBack }) {
  const { user } = useAuth();
  const showToast = useToast();

  // Post Ride form state
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveHour, setLeaveHour] = useState('');
  const [leaveMinute, setLeaveMinute] = useState('');
  const [leaveAmPm, setLeaveAmPm] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState('');
  const [note, setNote] = useState('');
  const [postStatus, setPostStatus] = useState('');
  const [postLoading, setPostLoading] = useState(false);

  // My Rides
  const [rides, setRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(true);

  // Bookings on my rides
  const [bookings, setBookings] = useState([]);

  // Edit modal
  const [editModal, setEditModal] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const loadRides = useCallback(async () => {
    setRidesLoading(true);
    try {
      const { data } = await getMyRides();
      setRides(data.rides || []);
    } catch { /* handled by apiFetch */ }
    finally { setRidesLoading(false); }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const { data } = await getRiderBookings();
      setBookings(data.bookings || []);
    } catch { /* handled by apiFetch */ }
  }, []);

  useEffect(() => {
    loadRides();
    loadBookings();
  }, [loadRides, loadBookings]);

  // Post ride
  async function handlePostRide(e) {
    e.preventDefault();
    setPostStatus('');
    if (!leaveHour || !leaveMinute || !leaveAmPm) {
      const msg = 'Please select Hour, Minute and AM/PM!';
      setPostStatus(msg);
      showToast(msg, 'error');
      return;
    }
    setPostLoading(true);
    try {
      const leaveTime = to24Hour(leaveHour, leaveMinute, leaveAmPm);
      const { res, data } = await postRide({
        source,
        destination,
        leaveDate,
        leaveTime,
        seatsAvailable: Number(seatsAvailable),
        note,
      });
      if (res.ok) {
        showToast('Ride posted successfully! 🚗', 'success');
        setSource(''); setDestination(''); setLeaveHour(''); setLeaveMinute(''); setLeaveAmPm('');
        setSeatsAvailable(''); setNote('');
        setLeaveDate(new Date().toISOString().split('T')[0]);
        loadRides(); loadBookings();
      } else {
        const msg = data.error || 'Posting failed!';
        setPostStatus(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        const msg = 'Failed to contact server!';
        setPostStatus(msg);
        showToast(msg, 'error');
      }
    } finally { setPostLoading(false); }
  }

  // Delete ride
  async function handleDeleteRide(rideId) {
    if (!confirm('Are you sure? All bookings for it will also be removed.')) return;
    try {
      const { res, data } = await deleteRideApi(rideId);
      if (res.ok) { showToast('Ride deleted!', 'success'); loadRides(); loadBookings(); }
      else showToast(data.error || 'Failed to delete ride', 'error');
    } catch (err) { if (err.message !== 'Unauthorized') showToast('Server error', 'error'); }
  }

  // Accept / Reject booking
  async function handleAccept(bookingId) {
    if (!confirm('Accept this booking?')) return;
    try {
      const { res, data } = await acceptBookingApi(bookingId);
      if (res.ok) { showToast('Booking accepted! ✅', 'success'); loadBookings(); loadRides(); }
      else showToast(data.error || 'Failed to accept booking', 'error');
    } catch (err) { if (err.message !== 'Unauthorized') showToast('Server error', 'error'); }
  }

  async function handleReject(bookingId) {
    if (!confirm('Reject this booking?')) return;
    try {
      const { res, data } = await rejectBookingApi(bookingId);
      if (res.ok) { showToast('Booking rejected.', 'info'); loadBookings(); loadRides(); }
      else showToast(data.error || 'Failed to reject booking', 'error');
    } catch (err) { if (err.message !== 'Unauthorized') showToast('Server error', 'error'); }
  }

  // Edit modal
  function openEdit(ride) {
    const { hour, minute, ampm } = from24Hour(ride.time_to_leave);
    setEditModal({
      rideId: ride.ride_id,
      source: ride.source,
      destination: ride.destination,
      date: ride.ride_date,
      hour,
      minute,
      ampm,
      seats: ride.seats_available,
      note: ride.note || '',
    });
  }

  async function saveEdit() {
    if (!editModal) return;
    const { rideId, source, destination, date, hour, minute, ampm, seats, note } = editModal;
    if (!source || !destination || !date || !hour || !minute || !ampm || seats === '' || seats === undefined) {
      showToast('Fill all required fields!', 'error');
      return;
    }
    setEditLoading(true);
    try {
      const leaveTime = to24Hour(hour, minute, ampm);
      const { res, data } = await editRide({
        rideId,
        source,
        destination,
        leaveDate: date,
        leaveTime,
        seatsAvailable: Number(seats),
        note,
      });
      if (res.ok) {
        showToast('Ride updated! ✅', 'success');
        setEditModal(null);
        loadRides();
        loadBookings();
      } else {
        showToast(data.error || 'Failed to update ride', 'error');
      }
    } catch (err) {
      if (err.message !== 'Unauthorized') showToast('Server error', 'error');
    } finally {
      setEditLoading(false);
    }
  }

  const editSet = (key) => (e) => setEditModal((m) => ({ ...m, [key]: e.target.value }));

  return (
    <div className="section">
      <div className="section-header">
        <button onClick={onBack} className="btn-back"><ChevronLeft /><span>Back to Dashboard</span></button>
        <div className="section-heading-text">
          <h2>Post a Campus Ride</h2>
          <p>Publish your ride so fellow students can reserve seats</p>
        </div>
      </div>

      {/* Post Ride Form */}
      <div className="card app-card">
        <form className="custom-form" onSubmit={handlePostRide}>
          <div className="form-row">
            <div className="form-group-custom">
              <label>Your Name</label>
              <input type="text" value={user?.fullName || ''} readOnly />
            </div>
            <div className="form-group-custom">
              <label>Contact Phone</label>
              <input type="text" value={user?.phoneNumber || ''} readOnly />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group-custom">
              <label>Select Source Gate:</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} required>
                <option value="">-- Select Gate --</option>
                <option value="Gate 1">Gate 1</option>
                <option value="Gate 2">Gate 2</option>
                <option value="Gate 3">Gate 3</option>
              </select>
            </div>
            <div className="form-group-custom">
              <label>Destination:</label>
              <input type="text" placeholder="e.g. ISBT, Clock Tower" required value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group-custom">
              <label>Departure Date:</label>
              <input type="date" required value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} />
            </div>
            <div className="form-group-custom">
              <label>Departure Time:</label>
              <div className="time-picker">
                <select value={leaveHour} onChange={(e) => setLeaveHour(e.target.value)} required>
                  <option value="">HH</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((h) => <option key={h}>{h}</option>)}
                </select>
                <select value={leaveMinute} onChange={(e) => setLeaveMinute(e.target.value)} required>
                  <option value="">MM</option>
                  {['00','05','10','15','20','25','30','35','40','45','50','55'].map((m) => <option key={m}>{m}</option>)}
                </select>
                <select value={leaveAmPm} onChange={(e) => setLeaveAmPm(e.target.value)} required>
                  <option value="">AM/PM</option>
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group-custom">
            <label>Number of Seats Available:</label>
            <input type="number" placeholder="e.g. 3" min="1" max="10" required value={seatsAvailable} onChange={(e) => setSeatsAvailable(e.target.value)} />
          </div>

          <div className="form-group-custom">
            <label>Additional Notes / Fare Split (Optional):</label>
            <textarea placeholder="e.g. Leaving right after 4th period, fuel split ₹30..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary-action" disabled={postLoading}>
            <span className={`btn-text ${postLoading ? 'hidden' : ''}`}>Publish Ride Offer →</span>
            {postLoading && <span className="spinner"></span>}
          </button>
        </form>
        {postStatus && <p className="status-message error">{postStatus}</p>}
      </div>

      {/* My Posted Rides */}
      <div className="card app-card">
        <div className="card-header-bar"><h3>📋 My Posted Rides</h3></div>
        {ridesLoading ? (
          <p className="muted">Loading your rides...</p>
        ) : rides.length > 0 ? (
          rides.map((ride) => (
            <div key={ride.ride_id} className="my-ride-item">
              <strong>{ride.source} → {ride.destination}</strong><br />
              📅 {ride.ride_date} &nbsp; ⏰ {formatTime12(ride.time_to_leave)}<br />
              💺 {ride.seats_available} seat(s) available<br />
              {ride.note && <>📝 {ride.note}<br /></>}
              <div className="ride-actions">
                <button className="btn-edit" onClick={() => openEdit(ride)}>✏️ Edit</button>
                <button className="btn-danger" onClick={() => handleDeleteRide(ride.ride_id)}>🗑️ Delete</button>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">You have not posted any rides yet.</p>
        )}
      </div>

      {/* Booking Requests */}
      {bookings.length > 0 && (
        <div className="card app-card">
          <div className="card-header-bar"><h3>📬 Booking Requests for My Rides</h3></div>
          {bookings.map((b) => (
            <div key={b.bookingId} className="booking">
              <strong>Seater:</strong> {b.seaterName}{' '}
              {b.status === 'pending' && <span className="status-badge pending">Pending</span>}
              {b.status === 'accepted' && <span className="status-badge accepted">✅ Accepted</span>}
              {b.status === 'rejected' && <span className="status-badge rejected">❌ Rejected</span>}
              <br />
              <strong>Phone:</strong> <a href={`tel:${b.seaterPhone}`}>{b.seaterPhone}</a><br />
              <strong>Destination:</strong> {b.destination}<br />
              <strong>Date:</strong> {b.rideDate} &nbsp; <strong>Time:</strong> {formatTime12(b.rideTime)}<br />
              <strong>Requested:</strong> {new Date(b.bookingTime).toLocaleString()}<br />
              {b.status === 'pending' && (
                <div className="booking-actions">
                  <button className="accept-btn" onClick={() => handleAccept(b.bookingId)}>✅ Accept</button>
                  <button className="reject-btn" onClick={() => handleReject(b.bookingId)}>❌ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditModal(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>✏️ Edit Ride Offer</h3>
              <button type="button" className="btn-close-modal" onClick={() => setEditModal(null)}>✕</button>
            </div>

            <div className="form-group-custom">
              <label>Source Gate:</label>
              <select value={editModal.source} onChange={editSet('source')} required>
                <option value="">-- Select Gate --</option>
                <option value="Gate 1">Gate 1</option>
                <option value="Gate 2">Gate 2</option>
                <option value="Gate 3">Gate 3</option>
              </select>
            </div>

            <div className="form-group-custom">
              <label>Destination:</label>
              <input type="text" value={editModal.destination} onChange={editSet('destination')} required />
            </div>

            <div className="form-row">
              <div className="form-group-custom">
                <label>Date:</label>
                <input type="date" value={editModal.date} onChange={editSet('date')} required />
              </div>
              <div className="form-group-custom">
                <label>Time to Leave:</label>
                <div className="time-picker">
                  <select value={editModal.hour} onChange={editSet('hour')}>
                    <option value="">HH</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((h) => <option key={h}>{h}</option>)}
                  </select>
                  <select value={editModal.minute} onChange={editSet('minute')}>
                    <option value="">MM</option>
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <select value={editModal.ampm} onChange={editSet('ampm')}>
                    <option value="">AM/PM</option>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group-custom">
              <label>Seats Available:</label>
              <input type="number" min="1" value={editModal.seats} onChange={editSet('seats')} required />
            </div>

            <div className="form-group-custom">
              <label>Note:</label>
              <textarea value={editModal.note} onChange={editSet('note')} placeholder="Note (optional)" />
            </div>

            <div className="modal-actions">
              <button onClick={() => setEditModal(null)} className="btn-secondary" disabled={editLoading}>Cancel</button>
              <button onClick={saveEdit} className="btn-primary-action" disabled={editLoading}>
                <span className={`btn-text ${editLoading ? 'hidden' : ''}`}>Save Changes</span>
                {editLoading && <span className="spinner"></span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
