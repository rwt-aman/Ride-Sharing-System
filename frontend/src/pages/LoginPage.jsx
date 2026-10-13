import { useState, useRef } from 'react';
import AuthShowcase from '../components/AuthShowcase';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage({ onShowRegister, onShowOtp }) {
  const { login } = useAuth();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const emailRef = useRef(null);
  const passRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function fillDemo() {
    setEmail('demo@example.com');
    setPassword('demo12345');
    showToast('⚡ Demo credentials applied!', 'info');
  }

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
          <AuthShowcase onDemoFill={fillDemo} />
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
                <div className="label-with-hint">
                  <label htmlFor="loginPassword">Password</label>
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
