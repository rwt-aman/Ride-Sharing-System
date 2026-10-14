import { useState, useEffect, useCallback } from 'react';
import { forgotPassword, resetPassword } from '../api';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage({ onShowLogin }) {
  const showToast = useToast();

  const [step, setStep] = useState('request'); // 'request' (Step A) | 'reset' (Step B)
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for resend button in Step B
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const startCooldown = useCallback(() => setCooldown(60), []);

  // Step A: Request reset code
  async function handleRequestCode(e) {
    e.preventDefault();
    setStatus('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await forgotPassword(cleanEmail);
      if (res.ok) {
        showToast(data.message || 'If that email has an account, we sent a code.', 'info');
      } else {
        // Never reveal existence; if error from server show it or generic info
        showToast(data.error || 'If that email has an account, we sent a code.', 'info');
      }
      setStep('reset');
      startCooldown();
    } catch {
      setStatus('Failed to contact server!');
      showToast('Failed to contact server!', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Step B: Resend code with 60s cooldown
  async function handleResendCode() {
    if (cooldown > 0) return;

    try {
      const { res, data } = await forgotPassword(email.trim());
      if (res.ok) {
        showToast(data.message || 'If that email has an account, a code was sent.', 'info');
      } else {
        showToast(data.error || 'If that email has an account, a code was sent.', 'info');
      }
      startCooldown();
    } catch {
      showToast('Failed to contact server!', 'error');
    }
  }

  // Step B: Submit reset password
  async function handleResetPassword(e) {
    e.preventDefault();
    setStatus('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      const msg = 'Please enter a valid 6-digit reset code';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }

    if (newPassword.length < 8) {
      const msg = 'Password must be at least 8 characters';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }

    if (newPassword.length > 72) {
      const msg = 'Password must be 72 characters or fewer';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'New passwords do not match';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await resetPassword({
        email: email.trim(),
        otp: cleanOtp,
        newPassword,
      });

      if (res.ok) {
        showToast('Password reset successful! You can now log in.', 'success');
        onShowLogin(email.trim());
      } else {
        const msg = data.error || 'Password reset failed';
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

  return (
    <div className="page auth-page">
      <div className="auth-wrapper">
        <div className="auth-card-split" style={{ maxWidth: 520 }}>
          <div className="auth-form-card" style={{ flex: 1 }}>
            {step === 'request' ? (
              // Step A: Enter email
              <>
                <div className="form-header">
                  <h2>🔑 Reset Password</h2>
                  <p>Enter your email and we&apos;ll send you a 6-digit recovery code</p>
                </div>

                <form className="auth-form" onSubmit={handleRequestCode}>
                  <div className="form-group-custom">
                    <label htmlFor="resetEmail">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">✉️</span>
                      <input
                        type="email"
                        id="resetEmail"
                        placeholder="your.email@example.com"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-action" disabled={loading}>
                    <span className={`btn-text ${loading ? 'hidden' : ''}`}>Send Code →</span>
                    {loading && <span className="spinner"></span>}
                  </button>
                </form>

                {status && <p className="status-message error">{status}</p>}

                <div className="switch-link-card">
                  <span>Remember your password?</span>
                  <a
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      onShowLogin();
                    }}
                    className="link-highlight"
                  >
                    Back to Sign In
                  </a>
                </div>
              </>
            ) : (
              // Step B: Enter code & new password
              <>
                <div className="form-header">
                  <h2>🔒 Set New Password</h2>
                  <p>
                    Enter the code sent to <strong>{email}</strong>
                  </p>
                  <p className="muted" style={{ fontSize: '0.85em', marginTop: 4 }}>
                    Check your inbox (and spam folder)
                  </p>
                </div>

                <form className="auth-form" onSubmit={handleResetPassword}>
                  <div className="form-group-custom">
                    <label htmlFor="resetOtpInput">6-Digit Code</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔢</span>
                      <input
                        type="text"
                        id="resetOtpInput"
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

                  <div className="form-group-custom">
                    <div className="label-with-hint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label htmlFor="newPassword">New Password</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontSize: '0.82em',
                          fontWeight: 500,
                          padding: 0,
                        }}
                      >
                        {showPassword ? 'Hide password' : 'Show password'}
                      </button>
                    </div>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        placeholder="At least 8 characters"
                        required
                        minLength={8}
                        maxLength={72}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group-custom">
                    <label htmlFor="confirmNewPassword">Confirm New Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmNewPassword"
                        placeholder="Re-enter your new password"
                        required
                        minLength={8}
                        maxLength={72}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-action" disabled={loading}>
                    <span className={`btn-text ${loading ? 'hidden' : ''}`}>Reset Password →</span>
                    {loading && <span className="spinner"></span>}
                  </button>
                </form>

                {status && <p className="status-message error">{status}</p>}

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleResendCode}
                    disabled={cooldown > 0}
                  >
                    {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
                  </button>
                </div>

                <div className="switch-link-card">
                  <span>Need to use a different email?</span>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setStep('request');
                      setStatus('');
                      setOtp('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="link-highlight"
                  >
                    Use a different email
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
