'use client';

import { useEffect, useState } from 'react';

import { IconMoon, IconSun } from './Icons';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('aura-theme', 'dark');
    } else {
      delete document.documentElement.dataset.theme;
      localStorage.setItem('aura-theme', 'light');
    }
  }

  return (
    <button className="icon-btn" type="button" onClick={toggle} aria-label="Toggle theme">
      {dark ? <IconSun size={14} /> : <IconMoon size={14} />}
    </button>
  );
}
