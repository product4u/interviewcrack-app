import React from 'react';
import { Theme } from '../constants/themes';

interface ProgressBarProps {
  current: number;
  total: number;
  theme: Theme;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  theme
}) => {
  const percentage = ((current) / total) * 100;

  return (
    <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
      <div
        className="ic-primary h-3 rounded-full transition-all duration-500"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};
