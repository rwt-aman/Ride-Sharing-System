import { useState, useEffect } from 'react';

export default function DarkToggle() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDark);
  }, [isDark]);

  return (
    <button
      className="dark-toggle"
      onClick={() => setIsDark((d) => !d)}
      title="Toggle Theme"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
