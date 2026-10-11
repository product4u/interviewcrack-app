import { useState, useEffect, useCallback } from 'react';
import { themes, ThemeKey, readTheme, applyTheme } from '../constants/themes';
export const useTheme = (initialTheme: ThemeKey = 'home') => {
  const [currentTheme, setTheme] = useState<ThemeKey>(() => readTheme(initialTheme));
  const [themeStorageError, setThemeStorageError] = useState('');
  const setCurrentTheme = useCallback((key: ThemeKey) => {
    if (!Object.prototype.hasOwnProperty.call(themes, key)) return;
    applyTheme(key); setTheme(key);
    try { localStorage.setItem('currentTheme', key); setThemeStorageError(''); }
    catch { setThemeStorageError('Theme changed for this visit. Browser storage is unavailable, so it may reset after reload.'); }
  }, []);
  useEffect(() => { applyTheme(currentTheme); }, [currentTheme]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === 'currentTheme' || event.key === null) setTheme(readTheme(initialTheme)); };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, [initialTheme]);
  const cycleTheme = () => { const keys = Object.keys(themes) as ThemeKey[]; setCurrentTheme(keys[(keys.indexOf(currentTheme) + 1) % keys.length]); };
  return { currentTheme, setCurrentTheme, cycleTheme, theme: themes[currentTheme], themeStorageError };
};
