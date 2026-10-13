import { CarIcon, CheckIcon, ChevronRight, CopyIcon } from './Icons';
import { useToast } from '../context/ToastContext';

function copyCred(text, showToast) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast(`Copied: ${text}`, 'success')).catch(() => showToast(`Credential: ${text}`, 'info'));
  } else {
    showToast(`Credential: ${text}`, 'info');
  }
}

export default function AuthShowcase({ onDemoFill }) {
  const showToast = useToast();

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

        {/* Demo Box */}
        <div className="demo-box">
          <div className="demo-box-header">
            <div className="demo-box-title">
              <span className="demo-chip">DEMO ACCESS</span>
              <strong>Test Account</strong>
            </div>
            {onDemoFill && (
              <button type="button" className="btn-demo-quick" onClick={onDemoFill} title="Autofill credentials">
                <span>Click to Fill</span>
                <ChevronRight />
              </button>
            )}
          </div>
          <div className="demo-credentials-grid">
            <div className="cred-item">
              <span className="cred-label">Demo Email</span>
              <div className="cred-val-wrap">
                <code>demo@example.com</code>
                <button type="button" className="btn-copy-mini" onClick={() => copyCred('demo@example.com', showToast)} title="Copy email">
                  <CopyIcon />
                </button>
              </div>
            </div>
            <div className="cred-item">
              <span className="cred-label">Demo Password</span>
              <div className="cred-val-wrap">
                <code>demo12345</code>
                <button type="button" className="btn-copy-mini" onClick={() => copyCred('demo12345', showToast)} title="Copy password">
                  <CopyIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="showcase-footer">
        <span className="footer-dot"></span>
        <span>Student Transit Network • Peer-to-Peer</span>
      </div>
    </div>
  );
}
