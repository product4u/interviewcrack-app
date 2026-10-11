import { scoreAnswer } from '../utils/videoAnswerScorer';
import { recordingExtension } from '../utils/interviewStorage';
import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Download } from 'lucide-react';
import { Theme } from '../constants/themes';
import { VideoQuestion, VideoInterview, QuestionScore } from '../types';
import { VideoRecorder } from './VideoRecorder';
import { VirtualInterviewScene, InterviewText } from './VirtualInterviewScene';


interface VideoInterviewViewProps {
  theme: Theme;
  topic: string;
  subjectLine?: string; // For tracking/retry
  context?: string; // Additional context
  interviewMode: 'video' | 'audio';
  questions: VideoQuestion[];
  onComplete: (interview: VideoInterview) => void;
  onBack: () => void;
}

export const VideoInterviewView: React.FC<VideoInterviewViewProps> = ({
  theme,
  topic,
  subjectLine = topic,
  context,
  interviewMode,
  questions,
  onComplete,
  onBack,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordings, setRecordings] = useState<Map<string, { blob: Blob; transcript: string; duration: number }>>(
    new Map()
  );


  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isAnswered = recordings.has(currentQuestion.id);

  const [isRecording, setIsRecording] = useState(false);
  const [entered, setEntered] = useState(false);
  const [startedAt] = useState(() => new Date());
  const [previewUrl, setPreviewUrl] = useState('');
  const currentBlob = recordings.get(currentQuestion.id)?.blob;
  useEffect(() => {
    if (!currentBlob) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(currentBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [currentBlob]);

  const handleRecordingComplete = useCallback(
    (blob: Blob, transcript: string, duration: number) => {
      setRecordings(prev => {
        const newMap = new Map(prev);
        newMap.set(currentQuestion.id, { blob, transcript, duration });
        return newMap;
      });
    },
    [currentQuestion.id]
  );

  const downloadCurrentRecording = useCallback(() => {
    if (!isAnswered) return;

    const recording = recordings.get(currentQuestion.id);
    if (!recording) return;

    const url = URL.createObjectURL(recording.blob);
    const a = document.createElement('a');
    a.href = url;
    const questionNum = currentQuestionIndex + 1;
    a.download = `interview-${topic}-q${questionNum}-${Date.now()}.${recordingExtension(recording.blob)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [recordings, currentQuestion.id, currentQuestionIndex, topic, isAnswered]);

  const moveToNext = useCallback(() => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion]);

  const moveToPrevious = useCallback(() => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [isFirstQuestion]);

  const calculateScores = useCallback((recordingsMap: Map<string, any>): QuestionScore[] => {
    const calculatedScores: QuestionScore[] = [];

    recordingsMap.forEach((recording, questionId) => {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      calculatedScores.push({ ...scoreAnswer(recording.transcript, question.shortAnswer || question.expectedAnswer, question.keyWords), questionId });
    });

    return calculatedScores;
  }, [questions]);

  const finishInterview = useCallback(async () => {
    setIsProcessing(true);

    const calculatedScores = calculateScores(recordings);


    const totalScore = calculatedScores.reduce((sum, s) => sum + s.score, 0);
    const averageScore = calculatedScores.length > 0 ? totalScore / (calculatedScores.filter(s => s.status === 'scored').length || 1) : 0;

    const interview: VideoInterview = {
      id: `video-interview-${Date.now()}`,
      topic,
      subjectLine: subjectLine || topic,
      context,
      interviewMode,
      questions,
      recordings: Array.from(recordings.entries()).map(([questionId, data]) => ({
        questionId,
        videoBlob: interviewMode === 'video' ? data.blob : undefined,
        audioBlob: interviewMode === 'audio' ? data.blob : undefined,
        transcript: data.transcript,
        recordingDuration: data.duration,
        timestamp: new Date(),
      })),
      scores: calculatedScores,
      totalScore,
      averageScore,
      startedAt,
      completedAt: new Date(),
      theme: 'default',
    };

    setIsProcessing(false);
    onComplete(interview);
  }, [recordings, calculateScores, questions, topic, subjectLine, context, interviewMode, onComplete, startedAt]);

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className={`min-h-screen ${theme.bg} p-2 sm:p-4 md:p-6`}>


      <div className="max-w-6xl mx-auto px-1 sm:px-0">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-2">
            <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${theme.text} break-words`}>
              Virtual Interview · {topic}
            </h2>
            <span className={`text-xs sm:text-sm font-semibold ${theme.text} opacity-70 shrink-0`}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          <div className={`w-full h-2 rounded-full ${theme.card} overflow-hidden border`}>
            <div
              className={`h-full ${theme.primary} transition-all duration-500`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <VirtualInterviewScene question={currentQuestion} index={currentQuestionIndex} total={questions.length} answered={isAnswered} recording={isRecording} onEnter={() => setEntered(true)} />

        {/* Question Card */}
        {entered && <div className={`${theme.card} rounded-2xl shadow-xl p-3 sm:p-6 md:p-8 border mb-6 sm:mb-8`}>
          {/* Question */}
          <div className="mb-6 sm:mb-8">
            {/* Expected Answer (revealed after recording) */}
            {isAnswered ? (
              <div className={`${theme.bg} rounded-lg p-2 sm:p-4 md:p-6 mb-4 sm:mb-6 border`}>
                <h4 className={`text-xs sm:text-base md:text-lg font-semibold ${theme.text} mb-2 sm:mb-3 flex items-center gap-2 break-words`}>
                  💡 Expected Answer
                </h4>
                <div className={`text-xs sm:text-sm ${theme.text} opacity-80 mb-3 italic border-l-2 ic-border-accent pl-3 break-words`}>
                  <strong>Short Answer:</strong> {currentQuestion.shortAnswer}
                </div>
                <div
                  className={`text-xs sm:text-sm ${theme.text} opacity-85 mb-4 prose prose-sm dark:prose-invert max-w-none`}
                  ><InterviewText text={currentQuestion.expectedAnswer} /></div>
              </div>
            ) : null}

            {/* Previous Recording Preview (if exists) */}
            {isAnswered && (
              <div className={`${theme.bg} rounded-lg p-2 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-green-500`}>
                <h4 className={`text-xs sm:text-base md:text-lg font-semibold ${theme.text} mb-3 sm:mb-4 flex items-center gap-2 break-words`}>
                  ✓ Your Answer Recorded
                </h4>

                {/* Recording Preview */}
                {interviewMode === 'video' ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full rounded-lg mb-4 max-h-40 sm:max-h-60 bg-black"
                  />
                ) : (
                  <audio
                    src={previewUrl}
                    controls
                    className="w-full rounded-lg mb-4"
                  />
                )}

                {/* Transcript Display */}
                {recordings.has(currentQuestion.id) && recordings.get(currentQuestion.id)?.transcript && (
                  <div className="mb-4 p-2 sm:p-3 md:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
                    <p className={`text-xs font-semibold ${theme.text} opacity-70 mb-2`}>📋 Transcript:</p>
                    <p className={`text-xs sm:text-sm ${theme.text} leading-relaxed break-words`}>{recordings.get(currentQuestion.id)?.transcript}</p>
                  </div>
                )}

                {/* Recording Actions */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      // Reset for retake
                      const newMap = new Map(recordings);
                      newMap.delete(currentQuestion.id);
                      setRecordings(newMap);
                    }}
                    className={`flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm ${theme.secondary} text-white hover:scale-105 transition-all`}
                  >
                    🔄 Retake
                  </button>

                  <button
                    onClick={downloadCurrentRecording}
                    className={`flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm ${theme.primary} text-white hover:scale-105 transition-all`}
                  >
                    <Download className="w-4 sm:w-5 h-4 sm:h-5" />
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video/Audio Recorder - Show only if not answered */}
          {!isAnswered && (
            <div className="mb-6 sm:mb-8">
              <VideoRecorder
                key={currentQuestion.id}
                onRecordingStateChange={setIsRecording}
                theme={theme}
                mode={interviewMode}
                isProcessing={isProcessing}
                onRecordingComplete={handleRecordingComplete}
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            <button
              onClick={moveToPrevious}
              disabled={isFirstQuestion || isRecording}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                isFirstQuestion
                  ? 'opacity-50 cursor-not-allowed'
                  : `${theme.secondary} hover:scale-105 text-white`
              }`}
            >
              <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
              Previous
            </button>

            <div className="text-center">
              {isAnswered && (
                <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold text-white ${theme.primary}`}>
                  ✓ Answered
                </span>
              )}
            </div>

            <button
              onClick={() => isLastQuestion ? finishInterview() : moveToNext()}
              disabled={!isAnswered || isProcessing || isRecording}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-white transition-all text-xs sm:text-sm ${
                !isAnswered ? 'opacity-50 cursor-not-allowed' : `${theme.primary} hover:scale-105`
              }`}
            >
              {isLastQuestion ? 'Complete' : 'Next'}
              <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
        </div>}
      </div>

      {/* Back Button */}
      <div className="mt-6 sm:mt-8 max-w-6xl mx-auto px-2 sm:px-0">
        <button
          onClick={onBack}
          className={`w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm sm:text-base ${theme.secondary} text-white hover:scale-105 transition-all`}
        >
          ← Leave room
        </button>
      </div>
    </div>
  );
};
