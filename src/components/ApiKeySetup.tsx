import experience from '../constants/experience.json';
import React, { useState } from 'react';
import { Theme } from '../constants/themes';

interface ApiKeySetupProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onSaveApiKey: (key: string, sessionOnly?: boolean) => void;
  onChangeKey: () => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({
  apiKey,
  onApiKeyChange,
  onSaveApiKey,
  onChangeKey
}) => {
  const [sessionOnly, setSessionOnly] = useState(true);
  return (
    <div className="ic-card border rounded-xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 ic-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-lg font-semibold ic-text">Your key. Your choice.</h3>
      </div>
      <p className="text-sm ic-text mb-4">
        {experience.keyTrust}
      </p>
      <label className="block mb-3"><input type="checkbox" checked={sessionOnly} onChange={e => setSessionOnly(e.target.checked)} /> Keep key only for this tab session</label>
      <input
        type="password"
        aria-label="Gemini API key"
        autoComplete="off"
        placeholder="Paste your API Key here (starts with AIza...)"
        value={apiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        className="w-full p-3 border border-blue-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSaveApiKey(apiKey, sessionOnly)}
          disabled={!apiKey.trim()}
          className="flex-1 ic-primary text-white py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          Save API Key
        </button>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 ic-card border ic-text py-2 rounded-lg font-semibold text-center"
        >
          Get Gemini Key
        </a>
      </div>
    </div>
  );
};

interface ChangeApiKeyButtonProps {
  theme: Theme;
  onChangeKey: () => void;
}

export const ChangeApiKeyButton: React.FC<ChangeApiKeyButtonProps> = ({
  theme,
  onChangeKey
}) => {
  return (
    <div className="flex justify-end mb-4">
      <button
        onClick={onChangeKey}
        className="text-sm px-4 py-2 rounded-lg font-medium ic-primary text-white shadow-lg hover:scale-105 transition-all"
      >
        Change API Key
      </button>
    </div>
  );
};
