import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import DarkToggle from './components/DarkToggle';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import DashboardPage from './pages/DashboardPage';

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  const [page, setPage] = useState('login'); // 'login' | 'register' | 'otp'
  const [otpEmail, setOtpEmail] = useState('');

  function showOtp(email) {
    setOtpEmail(email);
    setPage('otp');
  }

  // If logged in, show dashboard
  if (isLoggedIn) {
    return <DashboardPage />;
  }

  // Auth pages
  switch (page) {
    case 'register':
      return <RegisterPage onShowLogin={() => setPage('login')} onShowOtp={showOtp} />;
    case 'otp':
      return <OtpPage email={otpEmail} onShowLogin={() => setPage('login')} onShowRegister={() => setPage('register')} />;
    case 'login':
    default:
      return <LoginPage onShowRegister={() => setPage('register')} onShowOtp={showOtp} />;
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
