import { useState, useEffect } from 'react';
const KEY = 'geminiApiKey';
export const useApiKey = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    try { const key = sessionStorage.getItem(KEY) || localStorage.getItem(KEY); if (key) { setApiKey(key); setShowApiKeyInput(false); } }
    catch { setStorageError('Browser key storage is unavailable. Your key can still be used for this page visit.'); }
  }, []);
  const clearStored = () => {
    let failed = false;
    for (const name of ['localStorage', 'sessionStorage'] as const) {
      try { window[name].removeItem(KEY); } catch { failed = true; }
    }
    return !failed;
  };
  const handleSaveApiKey = (key: string, sessionOnly = false) => {
    if (!key.trim()) return;
    const removed = clearStored();
    setApiKey(key.trim()); setShowApiKeyInput(false);
    try {
      if (!removed) throw new Error('remove failed');
      (sessionOnly ? sessionStorage : localStorage).setItem(KEY, key.trim()); setStorageError('');
    } catch { setStorageError('Key works for this page visit, but storage could not be updated. An older saved key may remain; check browser site settings before leaving a shared device.'); }
  };
  const clearApiKey = () => {
    setApiKey(''); setShowApiKeyInput(true);
    setStorageError(clearStored() ? '' : 'Key removed from this page, but browser storage could not be cleared. Remove the saved key through browser site settings.');
  };
  return { apiKey, setApiKey, showApiKeyInput, setShowApiKeyInput, handleSaveApiKey, clearApiKey, storageError };
};
