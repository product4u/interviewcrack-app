export interface Question {
  id: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  answer: string;
  explanation: string;
}

export interface QuizSession {
  id: string;
  topic: string;
  questions: Question[];
  attempts: QuizAttempt[];
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: Date;
  theme: string;
}

export interface QuizAttempt {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export type ViewType = 'home' | 'generate' | 'import' | 'quiz' | 'results' | 'video-interview' | 'video-results';

// Video Interview Types
export interface VideoQuestion {
  id: string;
  question: string;
  expectedAnswer: string; // Full detailed answer
  shortAnswer: string; // 1-2 sentence concise answer for scoring
  keyWords: string[];
  buddyHint?: string;
  buddyExplanation?: string;
}

export interface VideoInterview {
  id: string;
  topic: string;
  subjectLine: string; // For retrying same subject
  interviewMode: 'video' | 'audio';
  questions: VideoQuestion[];
  recordings: VideoRecording[];
  scores: QuestionScore[];
  totalScore: number;
  averageScore: number;
  startedAt: Date;
  completedAt?: Date;
  theme: string;
  context?: string; // Additional context for the interview
}

export interface VideoRecording {
  questionId: string;
  videoBlob?: Blob;
  audioBlob?: Blob;
  transcript: string;
  recordingDuration: number;
  timestamp: Date;
  downloadUrl?: string;
}

export interface QuestionScore {
  status?: 'scored' | 'transcript-unavailable' | 'reference-unavailable';
  questionId: string;
  matchedKeyWords: string[];
  score: number;
  maxScore: number;
  wordMatchPercentage: number;
  feedback: string;
}
