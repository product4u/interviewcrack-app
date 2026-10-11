import React from 'react';
import { Loader } from 'lucide-react';

interface AIGenerationProgressProps {
  isGenerating: boolean;
  progress: string;
}

export const AIGenerationProgress: React.FC<AIGenerationProgressProps> = ({
  isGenerating,
  progress
}) => {
  if (!isGenerating) return null;

  const progressSteps = [
    { text: 'Initializing AI model', key: 'Initializing' },
    { text: 'Connecting to Gemini API', key: 'Connecting' },
    { text: 'Generating questions', key: 'Generating questions' },
    { text: 'Processing response', key: 'Processing response' }
  ];

  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <Loader className="w-5 h-5 animate-spin text-blue-600" />
        <h4 className="font-semibold text-blue-900">Generating Questions...</h4>
      </div>

      {/* Progress Steps */}
      <div className="space-y-2">
        {progressSteps.map((step, idx) => {
          const isActive = progress.includes(step.key);
          const isDone = !isActive && idx < progressSteps.findIndex(s => progress.includes(s.key));

          return (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isActive ? 'bg-blue-600 animate-pulse' : isDone ? 'bg-green-500' : 'bg-gray-300'
                }`}
              ></div>
              <span
                className={`text-sm ${
                  isActive ? 'text-blue-700 font-medium' : 'text-gray-600'
                }`}
              >
                {step.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Status */}
      <div className="mt-4 p-3 bg-white rounded border border-blue-300">
        <p className="text-sm text-blue-900 font-medium">
          {progress || 'Finalizing...'}
        </p>
      </div>

      {/* Loading Animation */}
      <div className="mt-4 flex gap-1 justify-center">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>

      <p className="text-xs text-gray-600 mt-3 text-center">
        This may take a few seconds. Please don't close this page.
      </p>
    </div>
  );
};
