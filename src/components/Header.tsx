import React from 'react';
import { Palette } from 'lucide-react';
import { Theme, themes, ThemeKey } from '../constants/themes';
import logo from '../assets/Logo.png';

interface HeaderProps {
  currentTheme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
  theme: Theme;
  quizSessionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  onThemeChange,
  theme,
  quizSessionsCount
}) => {
  return (
    <header className={`${theme.card} shadow-lg border-b`}>
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme.text} flex items-center gap-2 break-words`}>
           <img src={logo} alt="InterviewCrack Logo" className="logo"></img>
            {/* <svg className="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
              <rect x="42" y="65" width="16" height="15" fill="#667eea" rx="2" />
              <rect x="35" y="78" width="30" height="4" fill="#667eea" rx="2" />
              <rect x="40" y="25" width="20" height="35" fill="#764ba2" rx="10" />
              <ellipse cx="50" cy="25" rx="10" ry="8" fill="#764ba2" />
              <path d="M 25 35 Q 20 45 25 55" stroke="#667eea" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 75 35 Q 80 45 75 55" stroke="#667eea" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 15 30 Q 8 45 15 60" stroke="#764ba2" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
              <path d="M 85 30 Q 92 45 85 60" stroke="#764ba2" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
              <circle cx="70" cy="25" r="12" fill="#4ade80" opacity="0.9" />
              <path d="M 65 25 L 68 28 L 75 21" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg> */}

            InterviewCrack
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Palette className="w-4 sm:w-5 h-4 sm:h-5 shrink-0" />
              <select
                aria-label="Page theme"
                value={currentTheme}
                onChange={(e) => onThemeChange(e.target.value as ThemeKey)}
                className="px-2 sm:px-3 py-1 rounded border text-xs sm:text-sm flex-1 sm:flex-none"
              >
                {Object.entries(themes).map(([key, themeConfig]) => (
                  <option key={key} value={key}>
                    {themeConfig.name}
                  </option>
                ))}
              </select>
            </div>
            {quizSessionsCount > 0 && (
              <div className={`text-xs sm:text-sm ${theme.accent} font-medium whitespace-nowrap`}>
                {quizSessionsCount} Quiz{quizSessionsCount > 1 ? 'es' : ''} Completed
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
