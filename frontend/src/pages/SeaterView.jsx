import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft } from '../components/Icons';
import { searchRides as searchRidesApi, confirmBooking, getSeaterBookings, cancelBooking as cancelBookingApi } from '../api';

function from24Hour(timeStr) {
  if (!timeStr) return { hour: '12', minute: '00', ampm: 'PM' };
  if (timeStr.includes(' ')) {
    const [t, ampm] = timeStr.split(' ');
    const [h, m] = t.split(':');
    return { hour: String(parseInt(h, 10) || 12), minute: m || '00', ampm: ampm || 'AM' };
  }
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { hour: String(h), minute: mStr || '00', ampm };
}

function formatTime12(timeStr) {
  if (!timeStr) return '';
  const { hour, minute, ampm } = from24Hour(timeStr);
  return `${hour}:${minute} ${ampm}`;
}

export default function SeaterView({ onBack }) {
  const { user } = useAuth();
  const showToast = useToast();

  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchDestination, setSearchDestination] = useState('');
  const [rides, setRides] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bookingRideId, setBookingRideId] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  // My bookings as a seater
  const [bookings, setBookings] = useState([]);

  const loadBookings = useCallback(async () => {
    try {
      const { data } = await getSeaterBookings();
      setBookings(data.bookings || []);
    } catch { /* handled by apiFetch */ }
  }, []);

  const doSearch = useCallback(async () => {
    if (!searchDate) return;
    setSearchLoading(true);
    try {
      const { data } = await searchRidesApi(searchDate, searchDestination);
      setRides(data.rides || []);
      setSearched(true);
    } catch (err) {
      if (err.message !== 'Unauthorized') showToast('Failed to search rides', 'error');
    } finally { setSearchLoading(false); }
  }, [searchDate, searchDestination, showToast]);

  useEffect(() => {
    loadBookings();
    doSearch();
  }, [loadBookings, doSearch]);

  async function handleBooking(ride) {
    if (!confirm(`Send booking request for ride to ${ride.destination}?`)) return;
    setBookingRideId(ride.ride_id);
    try {
      const { res, data } = await confirmBooking({ rideId: ride.ride_id });
      if (res.ok) {
        showToast(data.message || 'Booking request sent! 🎉', 'success');
        loadBookings();
        doSearch();
      } else {
        showToast(data.error || 'Booking failed', 'error');
      }
    } catch (err) {
      if (err.message !== 'Unauthorized') showToast('Server error', 'error');
    } finally {
      setBookingRideId(null);
    }
  }

  async function handleCancel(bookingId) {
    if (!confirm('Cancel this booking?')) return;
    setCancellingBookingId(bookingId);
    try {
      const { res, data } = await cancelBookingApi(bookingId);
      if (res.ok) {
        showToast(data.message || 'Booking cancelled.', 'info');
        loadBookings();
        doSearch();
      } else {
        showToast(data.error || 'Failed', 'error');
      }
    } catch (err) {
      if (err.message !== 'Unauthorized') showToast('Server error', 'error');
    } finally {
      setCancellingBookingId(null);
    }
  }

  return (
    <div className="section">
      <div className="section-header">
        <button onClick={onBack} className="btn-back"><ChevronLeft /><span>Back to Dashboard</span></button>
        <div className="section-heading-text">
          <h2>Find &amp; Book Campus Rides</h2>
          <p>Connect with peers traveling along your destination</p>
        </div>
      </div>

      {/* User Summary */}
      <div className="card app-card user-summary-card">
        <div className="form-row">
          <div className="form-group-custom">
            <label>Passenger Name</label>
            <input type="text" value={user?.fullName || ''} readOnly />
          </div>
          <div className="form-group-custom">
            <label>Passenger Contact</label>
            <input type="text" value={user?.phoneNumber || ''} readOnly />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card app-card">
        <div className="card-header-bar"><h3>🔍 Search Available Rides</h3></div>
        <div className="form-row">
          <div className="form-group-custom">
            <label>Date of Journey:</label>
            <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} required />
          </div>
          <div className="form-group-custom">
            <label>Destination (Optional):</label>
            <input type="text" placeholder="e.g. ISBT, Rajpur Road..." value={searchDestination} onChange={(e) => setSearchDestination(e.target.value)} />
          </div>
        </div>
        <button onClick={doSearch} className="btn-primary-action" disabled={searchLoading}>
          <span className={`btn-text ${searchLoading ? 'hidden' : ''}`}>Search Available Rides 🚗</span>
          {searchLoading && <span className="spinner"></span>}
        </button>

        <div className="results-container">
          {searchLoading ? (
            <p className="muted">Searching...</p>
          ) : rides.length > 0 ? (
            rides.map((ride, i) => (
              <div key={ride.ride_id} className="ride" id={`ride-${i}`}>
                <strong>🧑 Rider:</strong> {ride.rider_name}<br />
                <strong>📍 Source:</strong> {ride.source} &nbsp; <strong>→</strong> &nbsp; <strong>Dest:</strong> {ride.destination}<br />
                <strong>📅 Date:</strong> {ride.ride_date} &nbsp; <strong>⏰ Time:</strong> {formatTime12(ride.time_to_leave)}<br />
                <strong>💺 Seats:</strong> {ride.seats_available}<br />
                <strong>📞 Phone:</strong> <a href={`tel:${ride.phone}`}>{ride.phone}</a><br />
                {ride.note && <><strong>📝 Note:</strong> {ride.note}<br /></>}
                <button
                  className="confirm-btn"
                  disabled={bookingRideId === ride.ride_id}
                  onClick={() => handleBooking(ride)}
                >
                  {bookingRideId === ride.ride_id ? 'Requesting...' : 'Request Booking'}
                </button>
              </div>
            ))
          ) : searched ? (
            <p className="muted">No rides found for this date/destination.</p>
          ) : null}
        </div>
      </div>

      {/* My Seat Reservations */}
      <div className="card app-card">
        <div className="card-header-bar"><h3>🎟️ My Seat Reservations</h3></div>
        {bookings.length > 0 ? (
          bookings.map((b) => (
            <div key={b.bookingId} className="booking">
              <strong>Rider:</strong> {b.riderName}{' '}
              {b.status === 'pending' && <span className="status-badge pending">⏳ Pending Approval</span>}
              {b.status === 'accepted' && <span className="status-badge accepted">✅ Accepted</span>}
              {b.status === 'rejected' && <span className="status-badge rejected">❌ Rejected</span>}
              <br />
              <strong>Phone:</strong> <a href={`tel:${b.riderPhone}`}>{b.riderPhone}</a><br />
              <strong>Source:</strong> {b.source} &nbsp; <strong>→</strong> &nbsp; <strong>Dest:</strong> {b.destination}<br />
              <strong>Date:</strong> {b.rideDate} &nbsp; <strong>Time:</strong> {formatTime12(b.rideTime)}<br />
              <strong>Booked:</strong> {new Date(b.bookingTime).toLocaleString()}<br />
              {(b.status === 'pending' || b.status === 'accepted') && (
                <button
                  className="cancel-btn"
                  disabled={cancellingBookingId === b.bookingId}
                  onClick={() => handleCancel(b.bookingId)}
                >
                  {cancellingBookingId === b.bookingId ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="muted">You have not booked any rides yet.</p>
        )}
      </div>
    </div>
  );
}
