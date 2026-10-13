import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getProfile, updateProfile } from '../api';

export default function ProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const showToast = useToast();

  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Edit fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { res, data } = await getProfile();
        if (res.ok && data.user) {
          setProfile(data.user);
          setFullName(data.user.fullName);
          setPhoneNumber(data.user.phoneNumber);
        } else {
          showToast(data.error || 'Failed to load profile', 'error');
        }
      } catch (err) {
        if (err.message !== 'Unauthorized') showToast('Failed to contact server!', 'error');
      }
    })();
  }, [showToast]);

  function switchToEdit() {
    setEditMode(true);
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setStatus('');
  }

  async function handleSave() {
    setStatus('');
    if (!fullName || !phoneNumber) {
      const msg = 'Name and phone cannot be empty!';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phoneNumber.trim())) {
      const msg = 'Enter a valid 10-digit mobile number!';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      const msg = 'New passwords do not match!';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      const msg = 'New password must be at least 8 characters!';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      if (res.ok && data.user) {
        updateUser({ ...user, fullName: data.user.fullName, phoneNumber: data.user.phoneNumber });
        showToast('Profile updated! ✅', 'success');
        onClose();
      } else {
        const msg = data.error || 'Update failed';
        setStatus(msg);
        showToast(msg, 'error');
      }
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        const msg = 'Failed to contact server!';
        setStatus(msg);
        showToast(msg, 'error');
      }
    } finally { setLoading(false); }
  }

  const initials = profile ? profile.fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '👤';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <h3>{profile?.fullName || 'Loading...'}</h3>
          <p className="muted">{profile?.email || ''}</p>
          {profile && <span className="profile-badge">🎓 {profile.studentId}</span>}
        </div>

        {profile && (
          <div className="profile-joined">
            🗓️ Member since: <strong>{new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
          </div>
        )}

        <hr className="profile-divider" />

        {!editMode ? (
          /* View Mode */
          <div>
            <div className="profile-info-row">
              <span className="profile-label">Full Name</span>
              <span className="profile-value">{profile?.fullName}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-label">Phone</span>
              <span className="profile-value">{profile?.phoneNumber}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-label">Email</span>
              <span className="profile-value">{profile?.email}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-label">Student ID</span>
              <span className="profile-value">{profile?.studentId}</span>
            </div>
            <div className="modal-actions">
              <button onClick={onClose} className="btn-secondary">Close</button>
              <button onClick={switchToEdit} className="btn-primary-action">✏️ Edit Profile</button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div>
            <div className="form-group-custom">
              <label>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="form-group-custom">
              <label>Phone Number</label>
              <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>

            <hr className="profile-divider" />
            <p className="muted" style={{ marginBottom: 12, fontSize: 12 }}>Leave password fields empty to keep current password</p>

            <div className="form-group-custom">
              <label>Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
            </div>
            <div className="form-group-custom">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
            </div>
            <div className="form-group-custom">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            </div>

            {status && <p className="status-message error">{status}</p>}

            <div className="modal-actions">
              <button onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary-action" disabled={loading}>
                <span className={`btn-text ${loading ? 'hidden' : ''}`}>Save Changes</span>
                {loading && <span className="spinner"></span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
