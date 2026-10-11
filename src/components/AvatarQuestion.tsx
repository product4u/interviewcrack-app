import React, { useEffect, useState } from 'react';
import { Theme } from '../constants/themes';

interface AvatarQuestionProps {
  theme: Theme;
  isActive: boolean;
}

export const AvatarQuestion: React.FC<AvatarQuestionProps> = ({ theme, isActive }) => {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isActive) {
      setPulseAnimation(true);
    }
  }, [isActive]);

  return (
    <div
      className={`fixed top-6 right-6 w-24 h-24 rounded-full overflow-hidden border-4 ${theme.primary} bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg z-50 flex items-center justify-center transition-all duration-300 ${
        isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-50'
      } ${pulseAnimation ? 'animate-pulse' : ''}`}
    >
      {/* Avatar SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head */}
        <circle cx="50" cy="35" r="20" fill="white" opacity="0.95" />

        {/* Eyes */}
        <circle cx="44" cy="32" r="2.5" fill="#333" />
        <circle cx="56" cy="32" r="2.5" fill="#333" />

        {/* Mouth - Smile */}
        <path
          d="M 44 38 Q 50 41 56 38"
          stroke="#333"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Nose */}
        <line x1="50" y1="34" x2="50" y2="37" stroke="#333" strokeWidth="1" />

        {/* Body/Shoulders */}
        <ellipse cx="50" cy="60" rx="15" ry="20" fill="white" opacity="0.95" />

        {/* Shirt/Tie accent */}
        <rect x="48" y="52" width="4" height="12" fill="#FF6B6B" opacity="0.8" />

        {/* Microphone indicator */}
        <circle cx="72" cy="18" r="6" fill="#FF6B6B" opacity="0.9" />
        <text
          x="72"
          y="22"
          textAnchor="middle"
          fill="white"
          fontSize="8"
          fontWeight="bold"
        >
          🎤
        </text>
      </svg>

      {/* Recording indicator */}
      {isActive && (
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};
