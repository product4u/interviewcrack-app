import { useState, useCallback } from 'react';
import { VideoInterview, VideoQuestion } from '../types';
import { listInterviews, persistInterview, removeInterview, storageMessage } from '../utils/interviewStorage';
export const useVideoInterview = () => {
  const [currentInterviewMode, setCurrentInterviewMode] = useState<'video' | 'audio' | null>(null);
  const [videoQuestions, setVideoQuestions] = useState<VideoQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const startVideoInterview = useCallback((mode: 'video' | 'audio', questions: VideoQuestion[]) => {
    setCurrentInterviewMode(mode); setVideoQuestions(questions); setError(null);
  }, []);
  const saveInterview = useCallback(async (interview: VideoInterview) => {
    try { await persistInterview(interview); setError(null); return true; }
    catch (err) { setError(storageMessage(err)); return false; }
  }, []);
  return { currentInterviewMode, videoQuestions, isLoadingQuestions: false, error, startVideoInterview,
    saveInterview, getInterviews: listInterviews, deleteInterview: removeInterview, clearAll: () => removeInterview() };
};
