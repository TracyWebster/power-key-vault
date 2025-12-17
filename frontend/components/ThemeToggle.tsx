"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    setIsDark(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="glass rounded-xl p-3 hover:bg-white/20 transition-all duration-300 group"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
      ) : (
        <Moon className="w-6 h-6 text-slate-700 group-hover:scale-110 transition-transform duration-300" />
      )}
    </button>
  );
}

