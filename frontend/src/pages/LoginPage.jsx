import { useState, useRef } from 'react';
import AuthShowcase from '../components/AuthShowcase';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage({ onShowRegister, onShowOtp, onShowForgotPassword, initialEmail = '' }) {
  const { login } = useAuth();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const emailRef = useRef(null);
  const passRef = useRef(null);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      const { res, data } = await loginUser(email.trim(), password);

      if (res.ok && data.token) {
        login(data.token, data.user);
        showToast(`Welcome back, ${data.user.fullName}! 👋`, 'success');
      } else if (res.status === 403 && data.requiresVerification) {
        showToast('Please verify your email first.', 'info');
        onShowOtp(data.email);
      } else {
        const msg = data.error || 'Login failed';
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
        <div className="auth-card-split">
          <AuthShowcase />
          <div className="auth-form-card">
            <div className="form-header">
              <h2>Welcome back</h2>
              <p>Enter your email and password to continue</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group-custom">
                <label htmlFor="loginEmail">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input ref={emailRef} type="email" id="loginEmail" placeholder="your.email@example.com" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="form-group-custom">
                <div className="label-with-hint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="loginPassword">Password</label>
                  <a href="/forgot-password" onClick={(e) => { e.preventDefault(); if (onShowForgotPassword) onShowForgotPassword(); }} className="link-highlight" style={{ fontSize: '0.82em', fontWeight: 500 }}>Forgot password?</a>
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input ref={passRef} type="password" id="loginPassword" placeholder="Enter your password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn-primary-action" disabled={loading}>
                <span className={`btn-text ${loading ? 'hidden' : ''}`}>Sign In →</span>
                {loading && <span className="spinner"></span>}
              </button>
            </form>

            {status && <p className="status-message error">{status}</p>}

            <div className="switch-link-card">
              <span>Don&apos;t have an account?</span>
              <a href="#" onClick={(e) => { e.preventDefault(); onShowRegister(); }} className="link-highlight">Create one here</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
