import { useState } from 'react';
import AuthShowcase from '../components/AuthShowcase';
import { registerUser } from '../api';
import { useToast } from '../context/ToastContext';

export default function RegisterPage({ onShowLogin, onShowOtp }) {
  const showToast = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const [form, setForm] = useState({
    studentId: '', fullName: '', phoneNumber: '', email: '', password: '', confirmPassword: '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');

    if (form.password.length < 8) {
      const msg = 'Password must be at least 8 characters!';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }
    if (form.password !== form.confirmPassword) {
      const msg = 'Passwords do not match!';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phoneNumber.trim())) {
      const msg = 'Enter a valid 10-digit mobile number!';
      setStatus(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await registerUser({
        studentId: form.studentId.trim(),
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      if (res.ok && data.requiresVerification) {
        showToast('Registration successful! Please verify your email.', 'success');
        onShowOtp(data.email);
      } else {
        const msg = data.error || 'Registration failed';
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
              <h2>Create your account</h2>
              <p>Use your email address to get started</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group-custom">
                <label htmlFor="studentId">Student ID</label>
                <div className="input-wrapper">
                  <span className="input-icon">🆔</span>
                  <input type="text" id="studentId" placeholder="e.g. 210101050" required autoComplete="off" value={form.studentId} onChange={set('studentId')} />
                </div>
              </div>

              <div className="form-group-custom">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input type="text" id="fullName" placeholder="Your full name" required autoComplete="name" value={form.fullName} onChange={set('fullName')} />
                </div>
              </div>

              <div className="form-group-custom">
                <label htmlFor="phoneNumber">Phone Number</label>
                <div className="input-wrapper">
                  <span className="input-icon">📱</span>
                  <input type="text" id="phoneNumber" placeholder="10-digit mobile number" required autoComplete="tel" value={form.phoneNumber} onChange={set('phoneNumber')} />
                </div>
              </div>

              <div className="form-group-custom">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input type="email" id="email" placeholder="your.email@example.com" required autoComplete="email" value={form.email} onChange={set('email')} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-custom">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input type="password" id="password" placeholder="Min 8 characters" required autoComplete="new-password" value={form.password} onChange={set('password')} />
                  </div>
                </div>
                <div className="form-group-custom">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🛡️</span>
                    <input type="password" id="confirmPassword" placeholder="Confirm password" required autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary-action" disabled={loading}>
                <span className={`btn-text ${loading ? 'hidden' : ''}`}>Create Account →</span>
                {loading && <span className="spinner"></span>}
              </button>
            </form>

            {status && <p className="status-message error">{status}</p>}

            <div className="switch-link-card">
              <span>Already have an account?</span>
              <a href="#" onClick={(e) => { e.preventDefault(); onShowLogin(); }} className="link-highlight">Log in here</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
