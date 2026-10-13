// ===== Centralized API module =====
// All API calls go through apiFetch, which attaches the JWT token
// and handles 401 (expired/invalid token) globally.
// Function names, arguments and the { res, data } return shape are unchanged,
// so existing components keep working. Only the URLs and HTTP methods are new.

const defaultBase = import.meta.env.PROD
  ? 'https://rideshare-backend-lbtr.onrender.com'
  : 'http://localhost:3000';

const rawBase = (import.meta.env.VITE_API_URL || defaultBase).trim().replace(/\/+$/, '');
const API = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;



let onUnauthorized = null;

/** The App component registers a callback here to force logout + redirect on 401. */
export function setOnUnauthorized(callback) {
  onUnauthorized = callback;
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error('Unauthorized');
  }
  return res;
}

// Public calls (no token): register, OTP, login
async function publicPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { res, data: await res.json().catch(() => ({})) };
}

// Protected calls: always return { res, data }; data.error holds the server message
async function call(path, options) {
  const res = await apiFetch(path, options);
  return { res, data: await res.json().catch(() => ({})) };
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

// ===== Auth =====
export const registerUser = (data) => publicPost('/auth/register', data);
export const verifyOtp = (email, otp) => publicPost('/auth/verify-otp', { email, otp });
export const resendOtp = (email) => publicPost('/auth/resend-otp', { email });
export const loginUser = (email, password) => publicPost('/auth/login', { email, password });

// ===== Rides =====
export const postRide = (data) => call('/rides', json('POST', data));

// `data` still contains rideId (as before); it moves into the URL
export const editRide = ({ rideId, ...fields }) =>
  call(`/rides/${rideId}`, json('PUT', fields));

export const deleteRide = (rideId) => call(`/rides/${rideId}`, { method: 'DELETE' });
export const getMyRides = () => call('/rides/mine');

export function searchRides(date, destination) {
  const params = new URLSearchParams({ date });
  if (destination) params.set('destination', destination);
  return call(`/rides?${params}`);
}

// ===== Bookings =====
// Only rideId is needed now: the server reads destination/date/time from the ride
export const confirmBooking = ({ rideId }) => call('/bookings', json('POST', { rideId }));
export const getSeaterBookings = () => call('/bookings/mine');
export const getRiderBookings = () => call('/bookings/received');
export const acceptBooking = (bookingId) =>
  call(`/bookings/${bookingId}`, json('PATCH', { status: 'accepted' }));
export const rejectBooking = (bookingId) =>
  call(`/bookings/${bookingId}`, json('PATCH', { status: 'rejected' }));
export const cancelBooking = (bookingId) => call(`/bookings/${bookingId}`, { method: 'DELETE' });

// ===== Profile =====
export const getProfile = () => call('/users/me');
export const updateProfile = (data) => call('/users/me', json('PUT', data));
