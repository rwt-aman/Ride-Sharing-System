import { useState, useEffect, useCallback } from 'react';
import { verifyOtp, resendOtp as resendOtpApi } from '../api';
import { useToast } from '../context/ToastContext';

export default function OtpPage({ email, onShowLogin, onShowRegister }) {
  const showToast = useToast();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [cooldown, setCooldown] = useState(60);

  // Countdown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const startCooldown = useCallback(() => setCooldown(60), []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');

    if (!otp || otp.length !== 6) {
      const msg = 'Please enter a 6-digit OTP';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await verifyOtp(email, otp.trim());
      if (res.ok) {
        showToast('Email verified! Please login.', 'success');
        setTimeout(() => onShowLogin(), 1500);
      } else {
        const msg = data.error || 'Verification failed';
        setStatus(msg);
        showToast(msg, 'error');
      }
    } catch {
      setStatus('Failed to contact server!');
      showToast('Failed to contact server!', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      const { res, data } = await resendOtpApi(email);
      if (res.status === 429) {
        showToast(data.error || 'Too many attempts, please wait.', 'error');
      } else if (!res.ok) {
        showToast(data.error || 'Failed to resend code', 'error');
      } else {
        showToast('If that email is registered, a new OTP has been sent.', 'info');
      }
      startCooldown();
    } catch {
      showToast('Failed to contact server!', 'error');
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-wrapper">
        <div className="auth-card-split" style={{ maxWidth: 520 }}>
          <div className="auth-form-card" style={{ flex: 1 }}>
            <div className="form-header">
              <h2>✉️ Verify Your Email</h2>
              <p>We sent a 6-digit OTP to <strong>{email}</strong></p>
              <p className="muted" style={{ fontSize: '0.85em', marginTop: 4 }}>Check your inbox (and spam folder)</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group-custom">
                <label htmlFor="otpInput">Enter OTP</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔢</span>
                  <input
                    type="text"
                    id="otpInput"
                    placeholder="6-digit code"
                    maxLength={6}
                    required
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    style={{ letterSpacing: '0.4em', fontSize: '1.2em', textAlign: 'center' }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary-action" disabled={loading}>
                <span className={`btn-text ${loading ? 'hidden' : ''}`}>Verify Email →</span>
                {loading && <span className="spinner"></span>}
              </button>
            </form>

            {status && <p className="status-message error">{status}</p>}

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleResend}
                disabled={cooldown > 0}
              >
                {cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}
              </button>
            </div>

            <div className="switch-link-card">
              <span>Wrong email?</span>
              <a href="#" onClick={(e) => { e.preventDefault(); onShowRegister(); }} className="link-highlight">Go back to register</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
