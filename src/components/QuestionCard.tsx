import React, { useMemo } from 'react';
import { Theme } from '../constants/themes';
import { Question } from '../types';
import { hasCodeBlocks, formatCodeBlockToHtml } from '../utils';

interface QuestionCardProps {
  question: Question;
  index: number;
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
  showResult?: boolean;
  theme: Theme;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  selectedAnswer,
  onSelectAnswer,
  showResult = false,
  theme
}) => {
  const options = [
    { label: 'A', text: question.option1 },
    { label: 'B', text: question.option2 },
    { label: 'C', text: question.option3 },
    { label: 'D', text: question.option4 }
  ];

  const isCorrect = selectedAnswer === question.answer;
  const questionHasCode = useMemo(() => hasCodeBlocks(question.question), [question.question]);

  const renderQuestionText = () => {
    if (questionHasCode) {
      return (
        <div
          className={`text-xl font-semibold ${theme.text} mb-6 leading-relaxed`}
          dangerouslySetInnerHTML={{ __html: formatCodeBlockToHtml(question.question) }}
        />
      );
    }
    return (
      <h3 className={`text-xl font-semibold ${theme.text} mb-6 leading-relaxed`}>
        {question.question}
      </h3>
    );
  };

  return (
    <div className="space-y-4">
      {renderQuestionText()}

      <div className="space-y-3">
        {options.map(({ label, text }) => {
          const optionHasCode = hasCodeBlocks(text);
          return (
            <button
              key={label}
              onClick={() => onSelectAnswer(label)}
              disabled={showResult && selectedAnswer !== label}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedAnswer === label
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : showResult && label === question.answer
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-blue-400'
              } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className={`font-semibold ${theme.text} mb-2`}>
                {label})
              </div>
              {optionHasCode ? (
                <div
                  className={`text-sm ${theme.text}`}
                  dangerouslySetInnerHTML={{ __html: formatCodeBlockToHtml(text) }}
                />
              ) : (
                <div className={`text-sm ${theme.text}`}>{text}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
