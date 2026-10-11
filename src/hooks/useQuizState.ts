import { useState, useCallback } from 'react';
import { Question, QuizAttempt } from '../types';

export const useQuizState = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);

  const answerQuestion = useCallback(
    (selectedAnswer: string, questions: Question[], onQuizFinish: (attempts: QuizAttempt[]) => void) => {
      if (!questionStartTime) return;

      const currentQuestion = questions[currentQuestionIndex];
      const timeSpent = Date.now() - questionStartTime.getTime();
      const isCorrect = selectedAnswer === currentQuestion.answer;

      const attempt: QuizAttempt = {
        questionId: currentQuestion.id,
        selectedAnswer,
        isCorrect,
        timeSpent
      };

      const newAttempts = [...quizAttempts, attempt];
      setQuizAttempts(newAttempts);

      // Move to next question after 2 seconds
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setQuestionStartTime(new Date());
        } else {
          onQuizFinish(newAttempts);
        }
      }, 2000);
    },
    [currentQuestionIndex, questionStartTime, quizAttempts]
  );

  const startQuiz = useCallback(() => {
    setQuestionStartTime(new Date());
    setQuizAttempts([]);
    setCurrentQuestionIndex(0);
    setQuizStartTime(new Date());
  }, []);

  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setQuizAttempts([]);
    setQuizStartTime(null);
    setQuestionStartTime(null);
  }, []);

  return {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    quizAttempts,
    setQuizAttempts,
    quizStartTime,
    setQuizStartTime,
    questionStartTime,
    setQuestionStartTime,
    answerQuestion,
    startQuiz,
    resetQuiz
  };
};
