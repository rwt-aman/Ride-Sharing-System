import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import DarkToggle from './components/DarkToggle';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';

function getInitialPage() {
  if (typeof window !== 'undefined' && window.location.pathname === '/forgot-password') {
    return 'forgot-password';
  }
  return 'login';
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  const [page, setPage] = useState(getInitialPage); // 'login' | 'register' | 'otp' | 'forgot-password'
  const [otpEmail, setOtpEmail] = useState('');
  const [loginPrefillEmail, setLoginPrefillEmail] = useState('');

  useEffect(() => {
    function handlePopState() {
      if (window.location.pathname === '/forgot-password') {
        setPage('forgot-password');
      } else {
        setPage('login');
      }
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function showOtp(email) {
    setOtpEmail(email);
    setPage('otp');
  }

  function showLogin(prefillEmail = '') {
    if (prefillEmail) setLoginPrefillEmail(prefillEmail);
    setPage('login');
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  }

  function showForgotPassword() {
    setPage('forgot-password');
    if (typeof window !== 'undefined' && window.location.pathname !== '/forgot-password') {
      window.history.pushState({}, '', '/forgot-password');
    }
  }

  // If logged in, show dashboard
  if (isLoggedIn) {
    return <DashboardPage />;
  }

  // Auth pages
  switch (page) {
    case 'register':
      return <RegisterPage onShowLogin={() => showLogin()} onShowOtp={showOtp} />;
    case 'otp':
      return <OtpPage email={otpEmail} onShowLogin={() => showLogin()} onShowRegister={() => setPage('register')} />;
    case 'forgot-password':
      return <ForgotPasswordPage onShowLogin={(email) => showLogin(email)} />;
    case 'login':
    default:
      return (
        <LoginPage
          onShowRegister={() => setPage('register')}
          onShowOtp={showOtp}
          onShowForgotPassword={showForgotPassword}
          initialEmail={loginPrefillEmail}
        />
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DarkToggle />
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
