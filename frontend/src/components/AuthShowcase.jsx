import { CarIcon, CheckIcon } from './Icons';

export default function AuthShowcase() {
  return (
    <div className="auth-showcase">
      <div className="showcase-brand">
        <div className="brand-badge">
          <span className="brand-icon"><CarIcon /></span>
          <span className="brand-title">Ride<strong>Share</strong></span>
        </div>
        <span className="campus-tag">Campus Mobility</span>
      </div>

      <div className="showcase-content">
        <h1 className="showcase-heading">
          Smart Campus Commuting with <span className="gradient-text">Absolute Ease.</span>
        </h1>
        <p className="showcase-subtitle">
          Join students organizing campus commutes, sharing travel costs, and traveling safely in a verified peer-to-peer network.
        </p>

        <ul className="feature-checklist">
          <li className="feature-item">
            <span className="feature-icon"><CheckIcon /></span>
            <span>Email OTP Verification</span>
          </li>
          <li className="feature-item">
            <span className="feature-icon"><CheckIcon /></span>
            <span>Instant Ride Posting &amp; Live Seat Booking</span>
          </li>
          <li className="feature-item">
            <span className="feature-icon"><CheckIcon /></span>
            <span>Dual Roles: Rider (Driver) &amp; Seater (Passenger)</span>
          </li>
          <li className="feature-item">
            <span className="feature-icon"><CheckIcon /></span>
            <span>Bcrypt Password Security &amp; Live Booking Status</span>
          </li>
        </ul>
      </div>

      <div className="showcase-footer">
        <span className="footer-dot"></span>
        <span>Student Transit Network • Peer-to-Peer</span>
      </div>
    </div>
  );
}
