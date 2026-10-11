import { interviewExport, recordingExtension } from '../utils/interviewStorage';
import React, { useCallback, useEffect, useState } from 'react';
import { Download, RotateCcw, Home } from 'lucide-react';
import { Theme } from '../constants/themes';
import { VideoInterview, VideoRecording } from '../types';
import { formatExplanationText } from '../utils';

interface VideoInterviewResultsProps {
  theme: Theme;
  interview: VideoInterview;
  onRetry: () => void;
  onBackToHome: () => void;
}

export const VideoInterviewResults: React.FC<VideoInterviewResultsProps> = ({
  theme,
  interview,
  onRetry,
  onBackToHome,
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  const downloadInterviewData = useCallback(() => {
    const data = interviewExport(interview);

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-interview-${interview.id}-results.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [interview]);

  const downloadAllRecordings = useCallback(() => {
    interview.recordings.forEach((recording, idx) => {
      const blob = recording.videoBlob || recording.audioBlob;
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${interview.topic}-q${idx + 1}-${interview.id}.${recordingExtension(blob)}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    });
  }, [interview]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const scoredCount = interview.scores.filter(s => !s.status || s.status === 'scored').length;
  const totalTime = interview.recordings.reduce((sum, rec) => sum + rec.recordingDuration, 0);

  return (
    <div className={`min-h-screen ${theme.bg} p-2 sm:p-4 md:p-6`}>
      <div className="max-w-5xl mx-auto px-1 sm:px-0">
        {/* Header */}
        <div className={`${theme.card} rounded-2xl shadow-xl p-3 sm:p-6 md:p-8 border mb-6 sm:mb-8 text-center`}>
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${theme.text} mb-3 sm:mb-4`}>
            Your practice session is complete!
          </h1>
          <p className={`text-xs sm:text-sm md:text-lg ${theme.text} opacity-80 mb-4 sm:mb-6 break-words`}>
            {interview.topic} - {interview.interviewMode === 'video' ? 'Video' : 'Audio'} Interview
          </p>

          <p className={`${theme.text} text-sm opacity-80 mb-5`}>Choose one answer to improve next. Scores estimate word and keyword overlap with reference answers; they do not measure confidence or predict interview success.</p>
          {/* Overall Score */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 md:gap-8 mb-4 sm:mb-6">
            <div className={`text-center p-3 sm:p-4 md:p-6 rounded-xl ${getScoreBgColor(interview.averageScore)} w-full sm:w-auto`}>
              <p className={`text-xs sm:text-sm font-semibold ${theme.text} opacity-70 mb-1 sm:mb-2`}>Answer match estimate ({scoredCount} scored)</p>
              <p className={`text-3xl sm:text-4xl md:text-5xl font-bold ${getScoreColor(interview.averageScore)}`}>
                {scoredCount ? Math.round(interview.averageScore) + '%' : 'Not scored'}
              </p>
            </div>

            <div className={`text-center p-3 sm:p-4 md:p-6 rounded-xl ic-soft w-full sm:w-auto`}>
              <p className={`text-xs sm:text-sm font-semibold ${theme.text} opacity-70 mb-1 sm:mb-2`}>Total Questions</p>
              <p className={`text-3xl sm:text-4xl md:text-5xl font-bold ${theme.accent}`}>
                {interview.questions.length}
              </p>
            </div>

            <div className={`text-center p-3 sm:p-4 md:p-6 rounded-xl ic-soft w-full sm:w-auto`}>
              <p className={`text-xs sm:text-sm font-semibold ${theme.text} opacity-70 mb-1 sm:mb-2`}>Total Time</p>
              <p className={`text-2xl sm:text-3xl md:text-3xl font-bold ${theme.text}`}>
                {formatTime(totalTime)}
              </p>
            </div>
          </div>

          {/* Performance Message */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900">
            <p className={`text-sm font-semibold ${theme.text}`}>
              {!scoredCount ? 'No answers could be scored. Review the recordings; missing transcripts are not weak answers.' : interview.averageScore >= 80
                ? 'Your answer covered many reference points. Listen back and choose one thing to refine.'
                : interview.averageScore >= 60
                ? '👍 Good job! Keep practicing to improve your key points coverage.'
                : interview.averageScore >= 40
                ? '📚 Fair attempt. Review the expected answers and practice more.'
                : '💪 Keep practicing! Focus on the key points and expected answers.'}
            </p>
          </div>
        </div>

        {/* Detailed Scores */}
        <div className={`${theme.card} rounded-2xl shadow-xl p-3 sm:p-6 md:p-8 border mb-6 sm:mb-8`}>
          <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${theme.text} mb-4 sm:mb-6 break-words`}>Question-by-Question Feedback</h2>

          <div className="space-y-6">
            {interview.questions.map((question, idx) => {
              const score = interview.scores.find(s => s.questionId === question.id) || { score: 0, status: 'transcript-unavailable', feedback: 'No score is available for this answer.' };
              const recording = interview.recordings.find(r => r.questionId === question.id);

              return (
                <div
                  key={question.id}
                  className={`p-3 sm:p-4 md:p-6 rounded-lg border-l-4 ${
                    score.score >= 80
                      ? `border-green-500 ${theme.bg}`
                      : score.score >= 60
                      ? `border-yellow-500 ${theme.bg}`
                      : score.score >= 40
                      ? `border-orange-500 ${theme.bg}`
                      : `border-red-500 ${theme.bg}`
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className={`text-xs sm:text-sm md:text-lg font-bold ${theme.text} mb-2 break-words`}>
                        Q{idx + 1}: {question.question}
                      </h3>
                      <div className={`text-xs sm:text-sm ${theme.text} opacity-80 mb-3 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-200 dark:border-yellow-700 break-words`}>
                        <strong>Expected Short Answer:</strong> {question.shortAnswer || question.expectedAnswer}
                      </div>
                    </div>
                    <div className={`text-right sm:ml-4 shrink-0`}>
                      <div className={`text-2xl sm:text-3xl font-bold ${getScoreColor(score.score)}`}>
                        {score.status && score.status !== 'scored' ? 'Not scored' : score.score + '%'}
                      </div>
                      <p className={`text-xs ${theme.text} opacity-70`}>Word Match</p>
                    </div>
                  </div>

                  {recording && <RecordingPlayback recording={recording} mode={interview.interviewMode} />}
                  {/* Your Transcript */}
                  <div className="mb-4 p-2 sm:p-3 md:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
                    <p className={`text-xs font-semibold ${theme.text} opacity-70 mb-2`}>📋 Your Transcript:</p>
                    {recording && recording.transcript ? (
                      <p className={`text-xs sm:text-sm ${theme.text} leading-relaxed break-words`}>{recording.transcript}</p>
                    ) : (
                      <p className={`text-xs sm:text-sm ${theme.text} opacity-50 italic break-words`}>No transcript captured. This may be due to speech recognition not being available or no speech detected.</p>
                    )}
                  </div>

                  {/* Full Expected Answer */}
                  <div className="mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className={`text-xs sm:text-sm font-semibold ${theme.text} opacity-70 mb-3 flex items-center gap-2`}>📚 Full Expected Answer</p>
                    <div
                      className={`text-xs sm:text-sm ${theme.text} leading-relaxed prose prose-sm dark:prose-invert max-w-none`}
                      dangerouslySetInnerHTML={{ __html: formatExplanationText(question.expectedAnswer) }}
                    />
                  </div>

                  {/* Feedback */}
                  <div className="p-2 sm:p-3 md:p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                    <p className={`text-xs sm:text-sm font-semibold ${theme.text} mb-2`}>💡 Feedback:</p>
                    <p className={`text-xs sm:text-sm ${theme.text} opacity-85 break-words`}>{score.feedback}</p>
                  </div>

                  {/* Recording Time */}
                  {recording && (
                    <div className="mt-4 text-xs opacity-70 flex items-center gap-2">
                      <span className="font-semibold">Recording Duration:</span>
                      <span>{formatTime(recording.recordingDuration)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`${theme.card} rounded-2xl shadow-xl p-8 border mb-8`}>
          <h2 className={`text-xl font-bold ${theme.text} mb-6`}>Download your session</h2>
          <p className="text-sm mb-4">JSON contains results and transcripts. Download media separately using the links above, or allow multiple downloads to save all recordings.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={downloadInterviewData}
              className={`flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all ${theme.primary} hover:scale-105`}
            >
              <Download className="w-5 h-5" />
              Download Results (JSON)
            </button>

            <button
              onClick={downloadAllRecordings}
              className={`flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all ${theme.secondary} hover:scale-105`}
            >
              <Download className="w-5 h-5" />
              Download All Recordings
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={onRetry}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all ${theme.primary} hover:scale-105`}
          >
            <RotateCcw className="w-5 h-5" />
            Retake Interview
          </button>

          <button
            onClick={onBackToHome}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all ${theme.secondary} hover:scale-105`}
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

function RecordingPlayback({ recording, mode }: { recording: VideoRecording; mode: 'video' | 'audio' }) {
  const [url, setUrl] = useState('');
  const blob = recording.videoBlob || recording.audioBlob;
  useEffect(() => { if (!blob) return; const next = URL.createObjectURL(blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [blob]);
  if (!blob) return <p className="text-sm mb-3">Recording media is unavailable for this older or imported session. Its transcript is still available.</p>;
  return <div className="mb-4">{mode === 'video' ? <video src={url} controls className="w-full max-h-80" /> : <audio src={url} controls className="w-full" />}<a className="underline" href={url} download={`answer-${recording.questionId}.${recordingExtension(blob)}`}>Download this recording</a></div>;
}
