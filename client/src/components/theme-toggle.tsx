import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('edufin_theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('edufin_theme', 'light');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('edufin_theme', 'dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="rounded-xl bg-slate-100 dark:bg-slate-900/60 p-2.5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-600" />
      )}
    </button>
  );
};
