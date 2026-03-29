// ===== API BASE URL =====
const API_BASE = 'http://localhost:3000';
// For PRODUCTION: const API_BASE = 'https://college-ride-share.onrender.com';

let currentUser = null;

// ===== DARK MODE =====
function toggleDark() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
  document.querySelector('.dark-toggle').textContent = isDark ? '☀️' : '🌙';
}

// Load saved dark mode on startup
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  document.querySelector('.dark-toggle').textContent = '☀️';
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 3000);
  toast.classList.remove('hidden');
}

// ===== SPINNER HELPERS =====
function setLoading(btn, loading) {
  const text    = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  if (!text || !spinner) return;
  btn.disabled = loading;
  if (loading) {
    text.classList.add('hidden');
    spinner.classList.remove('hidden');
  } else {
    text.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
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

  document.getElementById('riderName').value  = currentUser.fullName;
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

  document.getElementById('seaterName').value  = currentUser.fullName;
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

// ===== REGISTER =====
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn    = e.target.querySelector('button[type="submit"]');
  const status = document.getElementById('registerStatus');

  const studentId       = document.getElementById('studentId').value.trim();
  const fullName        = document.getElementById('fullName').value.trim();
  const phoneNumber     = document.getElementById('phoneNumber').value.trim();
  const email           = document.getElementById('email').value.trim();
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
    const res  = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, fullName, phoneNumber, email, password })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Registration successful! Please login.', 'success');
      document.getElementById('registerForm').reset();
      setTimeout(() => showLogin(), 1500);
    } else {
      status.textContent = data.error;
      status.className = 'error';
    }
  } catch {
    status.textContent = 'Failed to contact server!';
    status.className = 'error';
  } finally {
    setLoading(btn, false);
  }
});

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn    = e.target.querySelector('button[type="submit"]');
  const status = document.getElementById('loginStatus');

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  setLoading(btn, true);
  status.textContent = '';

  try {
    const res  = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      showToast(`Welcome back, ${data.user.fullName}! 👋`, 'success');
      showDashboard(data.user);
    } else {
      status.textContent = data.error;
      status.className = 'error';
    }
  } catch {
    status.textContent = 'Failed to contact server!';
    status.className = 'error';
  } finally {
    setLoading(btn, false);
  }
});

// ===== POST RIDE =====
document.getElementById('postRideForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn    = e.target.querySelector('button[type="submit"]');
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
    const res  = await fetch(`${API_BASE}/post-ride`, {
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
      document.getElementById('source').value      = '';
      document.getElementById('destination').value = '';
      document.getElementById('leaveHour').value   = '';
      document.getElementById('leaveMinute').value = '';
      document.getElementById('leaveAmPm').value   = '';
      document.getElementById('seatsAvailable').value = '';
      document.getElementById('riderNote').value   = '';
      document.getElementById('riderName').value   = currentUser.fullName;
      document.getElementById('riderPhone').value  = currentUser.phoneNumber;
      document.getElementById('leaveDate').value   = new Date().toISOString().split('T')[0];

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

// ===== LOAD MY POSTED RIDES =====
async function loadMyRides() {
  const list = document.getElementById('myRidesList');
  list.innerHTML = '<p class="muted">Loading your rides...</p>';

  try {
    const res  = await fetch(`${API_BASE}/my-rides?studentId=${currentUser.studentId}`);
    const data = await res.json();

    if (data.rides && data.rides.length > 0) {
      list.innerHTML = data.rides.map(ride => `
        <div class="my-ride-item">
          <strong>${ride.source} → ${ride.destination}</strong><br>
          📅 ${ride.ride_date} &nbsp; ⏰ ${ride.time_to_leave}<br>
          💺 ${ride.seats_available} seat(s) available<br>
          ${ride.note ? `📝 ${ride.note}<br>` : ''}
          <div class="ride-actions">
            <button class="btn-edit" onclick="openEditModal('${ride.ride_id}', '${ride.source}', '${ride.destination}', '${ride.ride_date}', '${ride.time_to_leave}', ${ride.seats_available}, \`${ride.note}\`)">✏️ Edit</button>
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
    const res  = await fetch(`${API_BASE}/delete-ride`, {
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
      showToast('Failed: ' + data.error, 'error');
    }
  } catch {
    showToast('Failed to contact server!', 'error');
  }
}

// ===== EDIT RIDE MODAL =====
function openEditModal(rideId, source, destination, date, time, seats, note) {
  document.getElementById('editRideId').value      = rideId;
  document.getElementById('editSource').value      = source;
  document.getElementById('editDestination').value = destination;
  document.getElementById('editDate').value        = date;
  document.getElementById('editSeats').value       = seats;
  document.getElementById('editNote').value        = note || '';

  // Parse time e.g. "8:30 AM"
  const parts = time.split(' ');
  const timeParts = parts[0].split(':');
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
    const res  = await fetch(`${API_BASE}/edit-ride`, {
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
      showToast('Failed: ' + data.error, 'error');
    }
  } catch {
    showToast('Failed to contact server!', 'error');
  }
}

// Close modal when clicking outside
document.getElementById('editModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('editModal')) closeEditModal();
});

// ===== LOAD RIDER BOOKINGS =====
async function loadRiderBookings() {
  const bookingsList    = document.getElementById('bookingsList');
  const bookingsSection = document.getElementById('riderBookings');

  bookingsList.innerHTML = '<p class="muted">Loading bookings...</p>';

  try {
    const res  = await fetch(`${API_BASE}/rider-bookings?studentId=${currentUser.studentId}`);
    const data = await res.json();

    if (data.bookings && data.bookings.length > 0) {
      bookingsSection.classList.remove('hidden');
      bookingsList.innerHTML = data.bookings.map(b => {
        let badge = '';
        let actions = '';

        if (b.status === 'pending') {
          badge   = '<span class="status-badge pending">Pending</span>';
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
          <strong>Seater:</strong> ${b.seaterName} ${badge}<br>
          <strong>Phone:</strong> <a href="tel:${b.seaterPhone}">${b.seaterPhone}</a><br>
          <strong>Destination:</strong> ${b.destination}<br>
          <strong>Date:</strong> ${b.rideDate} &nbsp; <strong>Time:</strong> ${b.rideTime}<br>
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
    const res  = await fetch(`${API_BASE}/accept-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId })
    });
    const data = await res.json();
    if (data.success) { showToast('Booking accepted! ✅', 'success'); loadRiderBookings(); }
    else showToast('Failed: ' + data.error, 'error');
  } catch { showToast('Failed to contact server!', 'error'); }
}

// ===== REJECT BOOKING =====
async function rejectBooking(bookingId) {
  if (!confirm('Reject this booking?')) return;
  try {
    const res  = await fetch(`${API_BASE}/reject-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId })
    });
    const data = await res.json();
    if (data.success) { showToast('Booking rejected.', 'info'); loadRiderBookings(); }
    else showToast('Failed: ' + data.error, 'error');
  } catch { showToast('Failed to contact server!', 'error'); }
}

// ===== LOAD SEATER BOOKINGS =====
async function loadSeaterBookings() {
  const list = document.getElementById('seaterBookingsList');
  list.innerHTML = '<p class="muted">Loading your bookings...</p>';

  try {
    const res  = await fetch(`${API_BASE}/seater-bookings?studentId=${currentUser.studentId}`);
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
          <strong>Rider:</strong> ${b.riderName} ${badge}<br>
          <strong>Phone:</strong> <a href="tel:${b.riderPhone}">${b.riderPhone}</a><br>
          <strong>Source:</strong> ${b.source} &nbsp; <strong>→</strong> &nbsp; <strong>Dest:</strong> ${b.destination}<br>
          <strong>Date:</strong> ${b.rideDate} &nbsp; <strong>Time:</strong> ${b.rideTime}<br>
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
    const res  = await fetch(`${API_BASE}/cancel-booking`, {
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
      showToast('Failed: ' + data.error, 'error');
    }
  } catch { showToast('Failed to contact server!', 'error'); }
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
    const res  = await fetch(
      `${API_BASE}/search-rides?destination=${encodeURIComponent(destination)}&date=${searchDate}`
    );
    const data = await res.json();

    if (Array.isArray(data.rides) && data.rides.length > 0) {
      resultsDiv.innerHTML = data.rides.map((ride, i) =>
        `<div class="ride" id="ride-${i}">
          <strong>🧑 Rider:</strong> ${ride.rider_name}<br>
          <strong>📍 Source:</strong> ${ride.source} &nbsp; <strong>→</strong> &nbsp; <strong>Dest:</strong> ${ride.destination}<br>
          <strong>📅 Date:</strong> ${ride.ride_date} &nbsp; <strong>⏰ Time:</strong> ${ride.time_to_leave}<br>
          <strong>💺 Seats:</strong> ${ride.seats_available}<br>
          <strong>📞 Phone:</strong> <a href="tel:${ride.phone}">${ride.phone}</a><br>
          ${ride.note ? `<strong>📝 Note:</strong> ${ride.note}<br>` : ''}
          <button class="confirm-btn" onclick="confirmRide('${ride.ride_id}', '${ride.destination}', '${ride.ride_date}', '${ride.time_to_leave}')">
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

// ===== PROFILE =====
async function openProfile() {
  document.getElementById('profileModal').classList.remove('hidden');
  switchToViewMode();

  try {
    const res  = await fetch(`${API_BASE}/profile?studentId=${currentUser.studentId}`);
    const data = await res.json();

    if (data.success) {
      const u = data.user;
      // Avatar initials
      const initials = u.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      document.getElementById('profileAvatar').textContent  = initials;
      document.getElementById('profileName').textContent    = u.fullName;
      document.getElementById('profileEmail').textContent   = u.email;
      document.getElementById('profileStudentId').textContent = '🎓 ' + u.studentId;
      document.getElementById('profileJoined').textContent  =
        new Date(u.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

      // View mode values
      document.getElementById('viewFullName').textContent  = u.fullName;
      document.getElementById('viewPhone').textContent     = u.phoneNumber;
      document.getElementById('viewEmail').textContent     = u.email;
      document.getElementById('viewStudentId').textContent = u.studentId;

      // Pre-fill edit fields
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
    const res  = await fetch(`${API_BASE}/update-profile`, {
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
      // Update currentUser in memory
      currentUser.fullName    = data.user.fullName;
      currentUser.phoneNumber = data.user.phoneNumber;

      // Update navbar welcome text
      document.getElementById('welcomeMessage').textContent = `👋 ${currentUser.fullName}`;

      showToast('Profile updated successfully! ✅', 'success');
      closeProfile();
    } else {
      status.textContent = data.error;
      status.className = 'error';
    }
  } catch {
    status.textContent = 'Failed to contact server!';
    status.className = 'error';
  } finally {
    setLoading(btn, false);
  }
}

// Close profile modal when clicking outside
document.getElementById('profileModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('profileModal')) closeProfile();
});

// ===== CONFIRM BOOKING =====
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
      showToast('Failed: ' + data.error, 'error');
    }
  })
  .catch(() => showToast('Failed to contact server!', 'error'));
}
