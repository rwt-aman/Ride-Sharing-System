// ===== API CONFIGURATION =====
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://rideshare-backend-lbtr.onrender.com';

let currentUser = null;
const rideStore = new Map(); // In-memory cache for safe modal edits

// ===== UTILITIES =====
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== DARK MODE =====
function toggleDark() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  const toggleBtn = document.querySelector('.dark-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = isDark ? '☀️' : '🌙';
  }
}

// Load saved dark mode on startup
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  const toggleBtn = document.querySelector('.dark-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = '☀️';
  }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  const iconSvg = icons[type] || icons.info;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon-badge">${iconSvg}</div>
    <div class="toast-message">${escapeHtml(message)}</div>
    <button class="toast-close" aria-label="Close">&times;</button>
    <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  const dismissToast = () => {
    if (toast.classList.contains('toast-hiding')) return;
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 280);
  };

  const timer = setTimeout(dismissToast, duration);

  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      clearTimeout(timer);
      dismissToast();
    });
  }
}

// ===== SPINNER HELPER =====
function setLoading(btn, loading) {
  if (!btn) return;
  const text = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  btn.disabled = loading;
  if (text) text.classList.toggle('hidden', loading);
  if (spinner) spinner.classList.toggle('hidden', !loading);
}

// ===== PAGE NAVIGATION =====
function showRegister() {
  document.getElementById('registerPage').classList.remove('hidden');
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('dashboardPage').classList.add('hidden');
}

function showLogin() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('registerPage').classList.add('hidden');
  document.getElementById('dashboardPage').classList.add('hidden');
}

function showDashboard(user) {
  currentUser = user;
  document.getElementById('dashboardPage').classList.remove('hidden');
  document.getElementById('registerPage').classList.add('hidden');
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('welcomeMessage').textContent = `👋 ${user.fullName}`;
  document.getElementById('roleSelection').classList.remove('hidden');
  document.getElementById('riderForm').classList.add('hidden');
  document.getElementById('seaterView').classList.add('hidden');
}

function logout() {
  currentUser = null;
  showLogin();
  showToast('Logged out successfully', 'info');
}

function showRiderForm() {
  document.getElementById('riderForm').classList.remove('hidden');
  document.getElementById('seaterView').classList.add('hidden');
  document.getElementById('roleSelection').classList.add('hidden');

  document.getElementById('riderName').value = currentUser.fullName;
  document.getElementById('riderPhone').value = currentUser.phoneNumber;

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('leaveDate').value = today;

  document.getElementById('riderBookings').classList.add('hidden');
  loadMyRides();
  loadRiderBookings();
}

function showSeaterView() {
  document.getElementById('seaterView').classList.remove('hidden');
  document.getElementById('riderForm').classList.add('hidden');
  document.getElementById('roleSelection').classList.add('hidden');

  document.getElementById('seaterName').value = currentUser.fullName;
  document.getElementById('seaterPhone').value = currentUser.phoneNumber;

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('searchDate').value = today;

  loadSeaterBookings();
  searchRides();
}

function backToDashboard() {
  document.getElementById('riderForm').classList.add('hidden');
  document.getElementById('seaterView').classList.add('hidden');
  document.getElementById('roleSelection').classList.remove('hidden');
}

// ===== REGISTER HANDLER =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('button[type="submit"]');
    const status = document.getElementById('registerStatus');

    const studentId       = document.getElementById('studentId').value.trim();
    const fullName        = document.getElementById('fullName').value.trim();
    const phoneNumber     = document.getElementById('phoneNumber').value.trim();
    const email           = document.getElementById('email').value.trim().toLowerCase();
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!email.endsWith('@gehu.ac.in')) {
      status.textContent = 'Only @gehu.ac.in email addresses are allowed!';
      status.className = 'error';
      return;
    }

    if (password !== confirmPassword) {
      status.textContent = 'Passwords do not match!';
      status.className = 'error';
      return;
    }

    setLoading(btn, true);
    status.textContent = '';

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, fullName, phoneNumber, email, password })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Registration successful! Please login.', 'success');
        registerForm.reset();
        setTimeout(() => showLogin(), 1200);
      } else {
        status.textContent = data.error || 'Registration failed';
        status.className = 'error';
      }
    } catch {
      status.textContent = 'Failed to contact server!';
      status.className = 'error';
    } finally {
      setLoading(btn, false);
    }
  });
}

// ===== LOGIN HANDLER =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type="submit"]');
    const status = document.getElementById('loginStatus');

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    setLoading(btn, true);
    status.textContent = '';

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Welcome back, ${data.user.fullName}! 👋`, 'success');
        showDashboard(data.user);
      } else {
        status.textContent = data.error || 'Invalid credentials';
        status.className = 'error';
      }
    } catch {
      status.textContent = 'Failed to contact server!';
      status.className = 'error';
    } finally {
      setLoading(btn, false);
    }
  });
}

// ===== POST RIDE HANDLER =====
const postRideForm = document.getElementById('postRideForm');
if (postRideForm) {
  postRideForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = postRideForm.querySelector('button[type="submit"]');
    const status = document.getElementById('postRideStatus');

    const riderName      = document.getElementById('riderName').value;
    const phoneNo        = document.getElementById('riderPhone').value;
    const source         = document.getElementById('source').value;
    const destination    = document.getElementById('destination').value.trim();
    const leaveDate      = document.getElementById('leaveDate').value;
    const seatsAvailable = document.getElementById('seatsAvailable').value;
    const note           = document.getElementById('riderNote').value.trim();
    const leaveHour      = document.getElementById('leaveHour').value;
    const leaveMinute    = document.getElementById('leaveMinute').value;
    const leaveAmPm      = document.getElementById('leaveAmPm').value;

    if (!leaveHour || !leaveMinute || !leaveAmPm) {
      status.textContent = 'Please select Hour, Minute and AM/PM!';
      status.className = 'error';
      return;
    }

    const leaveTime = `${leaveHour}:${leaveMinute} ${leaveAmPm}`;
    setLoading(btn, true);
    status.textContent = '';

    try {
      const res = await fetch(`${API_BASE}/post-ride`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderName, phoneNo, source, destination, leaveDate,
          leaveTime, seatsAvailable, note, studentId: currentUser.studentId
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Ride posted successfully! 🚗', 'success');
        document.getElementById('source').value = '';
        document.getElementById('destination').value = '';
        document.getElementById('leaveHour').value = '';
        document.getElementById('leaveMinute').value = '';
        document.getElementById('leaveAmPm').value = '';
        document.getElementById('seatsAvailable').value = '';
        document.getElementById('riderNote').value = '';
        document.getElementById('riderName').value = currentUser.fullName;
        document.getElementById('riderPhone').value = currentUser.phoneNumber;
        document.getElementById('leaveDate').value = new Date().toISOString().split('T')[0];

        loadMyRides();
        loadRiderBookings();
      } else {
        status.textContent = data.error || 'Posting failed!';
        status.className = 'error';
      }
    } catch {
      status.textContent = 'Failed to contact server!';
      status.className = 'error';
    } finally {
      setLoading(btn, false);
    }
  });
}

// ===== LOAD MY POSTED RIDES =====
async function loadMyRides() {
  const list = document.getElementById('myRidesList');
  if (!list || !currentUser) return;
  list.innerHTML = '<p class="muted">Loading your rides...</p>';

  try {
    const res = await fetch(`${API_BASE}/my-rides?studentId=${encodeURIComponent(currentUser.studentId)}`);
    const data = await res.json();

    if (data.rides && data.rides.length > 0) {
      // Store in memory for safe retrieval
      data.rides.forEach(ride => rideStore.set(String(ride.ride_id), ride));

      list.innerHTML = data.rides.map(ride => `
        <div class="my-ride-item">
          <strong>${escapeHtml(ride.source)} → ${escapeHtml(ride.destination)}</strong><br>
          📅 ${escapeHtml(ride.ride_date)} &nbsp; ⏰ ${escapeHtml(ride.time_to_leave)}<br>
          💺 ${Number(ride.seats_available)} seat(s) available<br>
          ${ride.note ? `📝 ${escapeHtml(ride.note)}<br>` : ''}
          <div class="ride-actions">
            <button class="btn-edit" onclick="openEditModalById('${ride.ride_id}')">✏️ Edit</button>
            <button class="btn-danger" onclick="deleteRide('${ride.ride_id}')">🗑️ Delete</button>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<p class="muted">You have not posted any rides yet.</p>';
    }
  } catch {
    list.innerHTML = '<p class="muted">Failed to load rides.</p>';
  }
}

// ===== DELETE RIDE =====
async function deleteRide(rideId) {
  if (!confirm('Are you sure you want to delete this ride? All bookings for it will also be removed.')) return;

  try {
    const res = await fetch(`${API_BASE}/delete-ride`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rideId, studentId: currentUser.studentId })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Ride deleted successfully!', 'success');
      loadMyRides();
      loadRiderBookings();
    } else {
      showToast('Failed: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch {
    showToast('Failed to contact server!', 'error');
  }
}

// ===== EDIT RIDE MODAL =====
function openEditModalById(rideId) {
  const ride = rideStore.get(String(rideId));
  if (!ride) return;

  document.getElementById('editRideId').value = ride.ride_id;
  document.getElementById('editSource').value = ride.source;
  document.getElementById('editDestination').value = ride.destination;
  document.getElementById('editDate').value = ride.ride_date;
  document.getElementById('editSeats').value = ride.seats_available;
  document.getElementById('editNote').value = ride.note || '';

  // Parse time e.g. "8:30 AM"
  const parts = (ride.time_to_leave || '').split(' ');
  const timeParts = (parts[0] || '').split(':');
  document.getElementById('editHour').value   = timeParts[0] || '';
  document.getElementById('editMinute').value = timeParts[1] || '';
  document.getElementById('editAmPm').value   = parts[1] || '';

  document.getElementById('editModal').classList.remove('hidden');
}

// Fallback signature for compatibility
function openEditModal(rideId, source, destination, date, time, seats, note) {
  document.getElementById('editRideId').value      = rideId;
  document.getElementById('editSource').value      = source;
  document.getElementById('editDestination').value = destination;
  document.getElementById('editDate').value        = date;
  document.getElementById('editSeats').value       = seats;
  document.getElementById('editNote').value        = note || '';

  const parts = (time || '').split(' ');
  const timeParts = (parts[0] || '').split(':');
  document.getElementById('editHour').value   = timeParts[0] || '';
  document.getElementById('editMinute').value = timeParts[1] || '';
  document.getElementById('editAmPm').value   = parts[1] || '';

  document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('editModal').classList.add('hidden');
}

async function saveEditRide() {
  const rideId      = document.getElementById('editRideId').value;
  const source      = document.getElementById('editSource').value;
  const destination = document.getElementById('editDestination').value.trim();
  const leaveDate   = document.getElementById('editDate').value;
  const editHour    = document.getElementById('editHour').value;
  const editMinute  = document.getElementById('editMinute').value;
  const editAmPm    = document.getElementById('editAmPm').value;
  const seats       = document.getElementById('editSeats').value;
  const note        = document.getElementById('editNote').value.trim();

  if (!source || !destination || !leaveDate || !editHour || !editMinute || !editAmPm || !seats) {
    showToast('Please fill in all required fields!', 'error');
    return;
  }

  const leaveTime = `${editHour}:${editMinute} ${editAmPm}`;

  try {
    const res = await fetch(`${API_BASE}/edit-ride`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rideId, source, destination,
        leaveDate, leaveTime,
        seatsAvailable: seats, note,
        studentId: currentUser.studentId
      })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Ride updated successfully! ✅', 'success');
      closeEditModal();
      loadMyRides();
    } else {
      showToast('Failed: ' + (data.error || 'Could not update ride'), 'error');
    }
  } catch {
    showToast('Failed to contact server!', 'error');
  }
}

// Modal Backdrop Click Handler
const editModalEl = document.getElementById('editModal');
if (editModalEl) {
  editModalEl.addEventListener('click', (e) => {
    if (e.target === editModalEl) closeEditModal();
  });
}

// ===== LOAD RIDER BOOKINGS =====
async function loadRiderBookings() {
  const bookingsList    = document.getElementById('bookingsList');
  const bookingsSection = document.getElementById('riderBookings');
  if (!bookingsList || !currentUser) return;

  bookingsList.innerHTML = '<p class="muted">Loading bookings...</p>';

  try {
    const res = await fetch(`${API_BASE}/rider-bookings?studentId=${encodeURIComponent(currentUser.studentId)}`);
    const data = await res.json();

    if (data.bookings && data.bookings.length > 0) {
      if (bookingsSection) bookingsSection.classList.remove('hidden');
      bookingsList.innerHTML = data.bookings.map(b => {
        let badge = '';
        let actions = '';

        if (b.status === 'pending') {
          badge = '<span class="status-badge pending">Pending</span>';
          actions = `<div class="booking-actions">
            <button class="accept-btn" onclick="acceptBooking('${b.bookingId}')">✅ Accept</button>
            <button class="reject-btn" onclick="rejectBooking('${b.bookingId}')">❌ Reject</button>
          </div>`;
        } else if (b.status === 'accepted') {
          badge = '<span class="status-badge accepted">✅ Accepted</span>';
        } else {
          badge = '<span class="status-badge rejected">❌ Rejected</span>';
        }

        return `<div class="booking">
          <strong>Seater:</strong> ${escapeHtml(b.seaterName)} ${badge}<br>
          <strong>Phone:</strong> <a href="tel:${escapeHtml(b.seaterPhone)}">${escapeHtml(b.seaterPhone)}</a><br>
          <strong>Destination:</strong> ${escapeHtml(b.destination)}<br>
          <strong>Date:</strong> ${escapeHtml(b.rideDate)} &nbsp; <strong>Time:</strong> ${escapeHtml(b.rideTime)}<br>
          <strong>Requested:</strong> ${new Date(b.bookingTime).toLocaleString()}<br>
          ${actions}
        </div>`;
      }).join('');
    } else {
      bookingsList.innerHTML = '<p class="muted">No booking requests yet.</p>';
    }
  } catch {
    bookingsList.innerHTML = '<p class="muted">Failed to load bookings.</p>';
  }
}

// ===== ACCEPT BOOKING =====
async function acceptBooking(bookingId) {
  if (!confirm('Accept this booking?')) return;
  try {
    const res = await fetch(`${API_BASE}/accept-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Booking accepted! ✅', 'success');
      loadRiderBookings();
    } else {
      showToast('Failed: ' + (data.error || 'Could not accept'), 'error');
    }
  } catch {
    showToast('Failed to contact server!', 'error');
  }
}

// ===== REJECT BOOKING =====
async function rejectBooking(bookingId) {
  if (!confirm('Reject this booking?')) return;
  try {
    const res = await fetch(`${API_BASE}/reject-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Booking rejected.', 'info');
      loadRiderBookings();
    } else {
      showToast('Failed: ' + (data.error || 'Could not reject'), 'error');
    }
  } catch {
    showToast('Failed to contact server!', 'error');
  }
}

// ===== LOAD SEATER BOOKINGS =====
async function loadSeaterBookings() {
  const list = document.getElementById('seaterBookingsList');
  if (!list || !currentUser) return;
  list.innerHTML = '<p class="muted">Loading your bookings...</p>';

  try {
    const res = await fetch(`${API_BASE}/seater-bookings?studentId=${encodeURIComponent(currentUser.studentId)}`);
    const data = await res.json();

    if (data.bookings && data.bookings.length > 0) {
      list.innerHTML = data.bookings.map(b => {
        let badge  = '';
        let cancel = '';

        if (b.status === 'pending') {
          badge = '<span class="status-badge pending">⏳ Pending Approval</span>';
        } else if (b.status === 'accepted') {
          badge  = '<span class="status-badge accepted">✅ Accepted</span>';
          cancel = `<button class="cancel-btn" onclick="cancelBooking('${b.bookingId}')">Cancel Booking</button>`;
        } else {
          badge = '<span class="status-badge rejected">❌ Rejected</span>';
        }

        return `<div class="booking">
          <strong>Rider:</strong> ${escapeHtml(b.riderName)} ${badge}<br>
          <strong>Phone:</strong> <a href="tel:${escapeHtml(b.riderPhone)}">${escapeHtml(b.riderPhone)}</a><br>
          <strong>Source:</strong> ${escapeHtml(b.source)} &nbsp; <strong>→</strong> &nbsp; <strong>Dest:</strong> ${escapeHtml(b.destination)}<br>
          <strong>Date:</strong> ${escapeHtml(b.rideDate)} &nbsp; <strong>Time:</strong> ${escapeHtml(b.rideTime)}<br>
          <strong>Booked:</strong> ${new Date(b.bookingTime).toLocaleString()}<br>
          ${cancel}
        </div>`;
      }).join('');
    } else {
      list.innerHTML = '<p class="muted">You have not booked any rides yet.</p>';
    }
  } catch {
    list.innerHTML = '<p class="muted">Failed to load bookings.</p>';
  }
}

// ===== CANCEL BOOKING =====
async function cancelBooking(bookingId) {
  if (!confirm('Cancel this booking?')) return;
  try {
    const res = await fetch(`${API_BASE}/cancel-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Booking cancelled.', 'info');
      loadSeaterBookings();
      searchRides();
    } else {
      showToast('Failed: ' + (data.error || 'Could not cancel'), 'error');
    }
  } catch {
    showToast('Failed to contact server!', 'error');
  }
}

// ===== SEARCH RIDES =====
async function searchRides() {
  const destination = document.getElementById('searchDestination').value;
  const searchDate  = document.getElementById('searchDate').value;
  const resultsDiv  = document.getElementById('rideResults');
  const btn         = document.querySelector('#seaterView .btn-primary');

  if (!searchDate) {
    resultsDiv.innerHTML = '<p class="error">Please select a date!</p>';
    return;
  }

  if (btn) setLoading(btn, true);
  resultsDiv.innerHTML = '<p class="muted">Searching...</p>';

  try {
    const res = await fetch(
      `${API_BASE}/search-rides?destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(searchDate)}`
    );
    const data = await res.json();

    if (Array.isArray(data.rides) && data.rides.length > 0) {
      // Store in memory
      data.rides.forEach(ride => rideStore.set(String(ride.ride_id), ride));

      resultsDiv.innerHTML = data.rides.map((ride, i) =>
        `<div class="ride" id="ride-${i}">
          <strong>🧑 Rider:</strong> ${escapeHtml(ride.rider_name)}<br>
          <strong>📍 Source:</strong> ${escapeHtml(ride.source)} &nbsp; <strong>→</strong> &nbsp; <strong>Dest:</strong> ${escapeHtml(ride.destination)}<br>
          <strong>📅 Date:</strong> ${escapeHtml(ride.ride_date)} &nbsp; <strong>⏰ Time:</strong> ${escapeHtml(ride.time_to_leave)}<br>
          <strong>💺 Seats:</strong> ${Number(ride.seats_available)}<br>
          <strong>📞 Phone:</strong> <a href="tel:${escapeHtml(ride.phone)}">${escapeHtml(ride.phone)}</a><br>
          ${ride.note ? `<strong>📝 Note:</strong> ${escapeHtml(ride.note)}<br>` : ''}
          <button class="confirm-btn" onclick="confirmRideById('${ride.ride_id}')">
            Request Booking
          </button>
        </div>`
      ).join('');
    } else {
      resultsDiv.innerHTML = '<p class="muted">No rides found for this date/destination.</p>';
    }
  } catch {
    resultsDiv.innerHTML = '<p class="error">Failed to search rides!</p>';
  } finally {
    if (btn) setLoading(btn, false);
  }
}

// ===== CONFIRM BOOKING =====
function confirmRideById(rideId) {
  const ride = rideStore.get(String(rideId));
  if (!ride) return;
  confirmRide(ride.ride_id, ride.destination, ride.ride_date, ride.time_to_leave);
}

function confirmRide(rideId, destination, rideDate, rideTime) {
  if (!currentUser?.studentId) {
    showToast('Please logout and login again.', 'error');
    return;
  }

  if (!confirm(`Send booking request for ride to ${destination}?`)) return;

  fetch(`${API_BASE}/confirm-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rideId,
      seaterName:      currentUser.fullName,
      seaterPhone:     currentUser.phoneNumber,
      seaterStudentId: currentUser.studentId,
      destination, rideDate, rideTime
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      showToast('Booking request sent! Waiting for rider approval. 🎉', 'success');
      loadSeaterBookings();
    } else {
      showToast('Failed: ' + (data.error || 'Could not send booking'), 'error');
    }
  })
  .catch(() => showToast('Failed to contact server!', 'error'));
}

// ===== PROFILE =====
async function openProfile() {
  document.getElementById('profileModal').classList.remove('hidden');
  switchToViewMode();

  try {
    const res  = await fetch(`${API_BASE}/profile?studentId=${encodeURIComponent(currentUser.studentId)}`);
    const data = await res.json();

    if (data.success) {
      const u = data.user;
      const initials = (u.fullName || 'U')
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      document.getElementById('profileAvatar').textContent = initials;
      document.getElementById('profileName').textContent = u.fullName;
      document.getElementById('profileEmail').textContent = u.email;
      document.getElementById('profileStudentId').textContent = '🎓 ' + u.studentId;
      document.getElementById('profileJoined').textContent =
        new Date(u.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

      document.getElementById('viewFullName').textContent  = u.fullName;
      document.getElementById('viewPhone').textContent     = u.phoneNumber;
      document.getElementById('viewEmail').textContent     = u.email;
      document.getElementById('viewStudentId').textContent = u.studentId;

      document.getElementById('editFullName').value    = u.fullName;
      document.getElementById('editPhoneNumber').value = u.phoneNumber;
    } else {
      showToast('Failed to load profile', 'error');
    }
  } catch {
    showToast('Failed to contact server!', 'error');
  }
}

function closeProfile() {
  document.getElementById('profileModal').classList.add('hidden');
}

function switchToEditMode() {
  document.getElementById('profileViewMode').classList.add('hidden');
  document.getElementById('profileEditMode').classList.remove('hidden');
  document.getElementById('editCurrentPassword').value = '';
  document.getElementById('editNewPassword').value     = '';
  document.getElementById('editConfirmPassword').value = '';
  document.getElementById('profileStatus').textContent = '';
}

function switchToViewMode() {
  document.getElementById('profileViewMode').classList.remove('hidden');
  document.getElementById('profileEditMode').classList.add('hidden');
}

async function saveProfile() {
  const btn            = document.querySelector('#profileEditMode .btn-primary');
  const status         = document.getElementById('profileStatus');
  const fullName       = document.getElementById('editFullName').value.trim();
  const phoneNumber    = document.getElementById('editPhoneNumber').value.trim();
  const currentPassword= document.getElementById('editCurrentPassword').value;
  const newPassword    = document.getElementById('editNewPassword').value;
  const confirmPassword= document.getElementById('editConfirmPassword').value;

  if (!fullName || !phoneNumber) {
    status.textContent = 'Name and phone cannot be empty!';
    status.className = 'error';
    return;
  }

  if (newPassword && newPassword !== confirmPassword) {
    status.textContent = 'New passwords do not match!';
    status.className = 'error';
    return;
  }

  if (newPassword && newPassword.length < 6) {
    status.textContent = 'New password must be at least 6 characters!';
    status.className = 'error';
    return;
  }

  setLoading(btn, true);
  status.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: currentUser.studentId,
        fullName, phoneNumber,
        currentPassword: currentPassword || undefined,
        newPassword:     newPassword     || undefined
      })
    });
    const data = await res.json();

    if (data.success) {
      currentUser.fullName    = data.user.fullName;
      currentUser.phoneNumber = data.user.phoneNumber;

      document.getElementById('welcomeMessage').textContent = `👋 ${currentUser.fullName}`;
      showToast('Profile updated successfully! ✅', 'success');
      closeProfile();
    } else {
      status.textContent = data.error || 'Failed to update profile';
      status.className = 'error';
    }
  } catch {
    status.textContent = 'Failed to contact server!';
    status.className = 'error';
  } finally {
    setLoading(btn, false);
  }
}

// Profile Modal Backdrop Click Handler
const profileModalEl = document.getElementById('profileModal');
if (profileModalEl) {
  profileModalEl.addEventListener('click', (e) => {
    if (e.target === profileModalEl) closeProfile();
  });
}

// Export functions to window for inline HTML onclick handlers
window.toggleDark = toggleDark;
window.showRegister = showRegister;
window.showLogin = showLogin;
window.showDashboard = showDashboard;
window.logout = logout;
window.showRiderForm = showRiderForm;
window.showSeaterView = showSeaterView;
window.backToDashboard = backToDashboard;
window.loadMyRides = loadMyRides;
window.deleteRide = deleteRide;
window.openEditModal = openEditModal;
window.openEditModalById = openEditModalById;
window.closeEditModal = closeEditModal;
window.saveEditRide = saveEditRide;
window.loadRiderBookings = loadRiderBookings;
window.acceptBooking = acceptBooking;
window.rejectBooking = rejectBooking;
window.loadSeaterBookings = loadSeaterBookings;
window.cancelBooking = cancelBooking;
window.searchRides = searchRides;
window.confirmRide = confirmRide;
window.confirmRideById = confirmRideById;
window.openProfile = openProfile;
window.closeProfile = closeProfile;
window.switchToEditMode = switchToEditMode;
window.switchToViewMode = switchToViewMode;
window.saveProfile = saveProfile;
