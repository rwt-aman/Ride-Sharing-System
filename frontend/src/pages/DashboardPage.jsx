import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CarIcon, ProfileIcon, LogoutIcon } from '../components/Icons';
import RiderView from './RiderView';
import SeaterView from './SeaterView';
import ProfileModal from './ProfileModal';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const showToast = useToast();
  const [view, setView] = useState('role'); // 'role' | 'rider' | 'seater'
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    showToast('Logged out successfully', 'info');
  }, [logout, showToast]);

  return (
    <div className="page dashboard-page">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="nav-brand-wrap">
          <span className="nav-brand-icon"><CarIcon /></span>
          <span className="nav-brand">Ride<strong>Share</strong></span>
        </div>
        <div className="nav-right">
          <div className="nav-user-pill">
            <span className="user-avatar-small">👤</span>
            <span className="nav-user">👋 {user?.fullName}</span>
          </div>
          <button onClick={() => setShowProfile(true)} className="btn-profile" title="View Profile">
            <ProfileIcon />
            <span>Profile</span>
          </button>
          <button onClick={handleLogout} className="btn-logout" title="Log Out">
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="dashboard-body">
        {/* Role Selection */}
        {view === 'role' && (
          <div className="role-section">
            <div className="section-title-wrap text-center">
              <span className="section-badge">SELECT MODE</span>
              <h2>How would you like to travel today?</h2>
              <p className="section-desc">Choose your role to coordinate campus rides with fellow students</p>
            </div>

            <div className="role-cards">
              <div className="role-card" onClick={() => setView('rider')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setView('rider')}>
                <div className="role-glow"></div>
                <div className="role-icon-box">🚘</div>
                <div className="role-info">
                  <h3>Offer a Ride (Rider)</h3>
                  <p>Post your vehicle&apos;s departure time, route, seats available, and accept requests from peers.</p>
                </div>
                <span className="role-action-btn">Post a Ride →</span>
              </div>

              <div className="role-card" onClick={() => setView('seater')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setView('seater')}>
                <div className="role-glow"></div>
                <div className="role-icon-box">🙋</div>
                <div className="role-info">
                  <h3>Find a Ride (Seater)</h3>
                  <p>Search upcoming rides by destination and date, book empty seats, and track request status.</p>
                </div>
                <span className="role-action-btn">Search Rides →</span>
              </div>
            </div>
          </div>
        )}

        {/* Rider Section */}
        {view === 'rider' && <RiderView onBack={() => setView('role')} />}

        {/* Seater Section */}
        {view === 'seater' && <SeaterView onBack={() => setView('role')} />}
      </main>

      {/* Profile Modal */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
