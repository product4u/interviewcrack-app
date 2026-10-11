import experience from '../constants/experience.json';
import { listInterviews, persistInterview, removeInterview, storageMessage, interviewExport, restoreInterview } from '../utils/interviewStorage';
import React, { useState, useEffect } from 'react';
import { Upload, Edit2, Trash2, DownloadCloud, Trash, Eye, Plus, Camera } from 'lucide-react';
import { Theme } from '../constants/themes';
import { QuizSession, VideoInterview } from '../types';
import { formatTime } from '../utils';
import { TypingText } from './TypingText';

interface HomeViewProps {
  theme: Theme;
  quizSessionsCount: number;
  quizSessions?: QuizSession[];
  onGenerateClick: () => void;
  onImportClick: () => void;
  onVideoInterviewClick: () => void;
  onSessionClick: (sessionIndex: number) => void;
  onEditSession?: (sessionIndex: number, newTitle: string) => void;
  onDeleteSession?: (sessionIndex: number) => void;
  onDownloadSession?: (sessionIndex: number) => void;
  onUploadSession?: (file: File) => void;
  onClearAll?: () => void;
  onExportAll?: () => void;
  onVideoInterviewClick_Home?: (interview: VideoInterview) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  theme,
  quizSessionsCount,
  quizSessions = [],
  onGenerateClick,
  onImportClick,
  onVideoInterviewClick,
  onSessionClick,
  onEditSession,
  onDeleteSession,
  onDownloadSession,
  onUploadSession,
  onClearAll,
  onExportAll,
  onVideoInterviewClick_Home
}) => {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [videoInterviews, setVideoInterviews] = useState<VideoInterview[]>([]);

  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    let active = true;
    listInterviews().then(items => { if (active) setVideoInterviews(items); }).catch(err => { if (active) setStorageError(storageMessage(err)); });
    return () => { active = false; };
  }, []);
  const saveVideo = async (interview: VideoInterview) => {
    try { await persistInterview(interview); setVideoInterviews(await listInterviews()); setStorageError(''); }
    catch (err) { setStorageError(storageMessage(err)); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file && onUploadSession) onUploadSession(file);
    e.currentTarget.value = '';
  };

  const startEdit = (idx: number, currentTitle: string) => {
    setEditingIdx(idx);
    setEditTitle(currentTitle);
  };

  const saveEdit = (idx: number) => {
    if (onEditSession) {
      onEditSession(idx, editTitle);
    }
    setEditingIdx(null);
  };

  return (
    <div className="text-center">
      {storageError && <p role="alert">{storageError}</p>}
      <div className={`${theme.card} rounded-2xl shadow-xl p-8 border max-w-5xl mx-auto`}>
        <h2 className={`text-4xl font-bold ${theme.text} mb-4`}>Your room is ready.</h2>
        <p className={`text-lg ${theme.text} opacity-80 mb-8`}>
          Your next interview shouldn’t be your first practice. Meet Alex, ask Sam for help, and find the words to answer with confidence.
        </p>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <button
            onClick={onGenerateClick}
            className={`${theme.primary} text-white p-6 rounded-xl hover:scale-105 transition-all duration-200 shadow-lg flex flex-col items-center gap-3`}
          >
            <Plus className="w-6 h-6" />
            <div>
              <h3 className="text-xl font-semibold">Practise with a quiz</h3>
              <TypingText />
            </div>
          </button>
          <button
            onClick={onVideoInterviewClick}
            className={`${theme.primary} text-white p-6 rounded-xl hover:scale-105 transition-all duration-200 shadow-lg flex flex-col items-center gap-3`}
          >
            <Camera className="w-6 h-6" />
            <div>
              <h3 className="text-xl font-semibold">Enter your interview room</h3>
              <p className="text-xs opacity-80 mt-1">Audio or video · editable transcripts</p>
              <TypingText texts={["Step into the interview room", "Ask your buddy when you need help", "Practise your answer out loud"]} />
            </div>
          </button>
        </div>

        <p className={`${theme.text} text-sm opacity-80 mb-6`}>No account required · Free practice app · Bring your own AI key</p>
        <section className="practice-story" aria-labelledby="practice-benefits">
          <h3 id="practice-benefits" className={`text-2xl font-bold ${theme.text}`}>A real interview feeling. Room to practise.</h3>
          <p className={`${theme.text} opacity-80 mt-2 mb-5`}>You walk in. Alex asks. Sam helps you think it through.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
            {experience.benefits.map(item => <article key={item.title} className={`${theme.card} ${theme.text} border rounded-xl p-4`}><h4 className="font-semibold">{item.title}</h4><p className="text-sm opacity-80 mt-2">{item.body}</p></article>)}
          </div>
          <div className={`${theme.text} text-sm text-left mt-5 space-y-2`}>
            <p>Just exploring? Choose “Enter your interview room”, then the room preview. No API key needed.</p>
            <button onClick={onImportClick} className={`${theme.accent} underline font-semibold`}>Have prepared questions? Import them without an API key</button>
            <details className="border rounded-xl p-4"><summary className="cursor-pointer font-semibold">Your key, saved sessions, and privacy</summary><p className="mt-3">{experience.keyTrust}</p><p className="mt-2">Saved sessions stay on this browser and device. Export results and download recordings separately to keep a backup. Clearing site data removes local history. Browser speech services may process audio online.</p></details>
          </div>
        </section>
        {/* Previous Interviews Section */}
        {quizSessionsCount > 0 && (
          <div className="mt-8 sm:mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${theme.text} break-words`}>Your Previous Interviews</h3>
                <p className={`text-xs sm:text-sm ${theme.text} opacity-70 mt-1`}>
                  {quizSessionsCount} quiz{quizSessionsCount > 1 ? 'zes' : ''} completed
                </p>
              </div>

              {/* Bulk Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end w-full sm:w-auto">
                <label className={`inline-flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md text-xs sm:text-sm ${theme.text}`}>
                  <Upload className="w-4 h-4" />
                  <span className="font-semibold hidden sm:inline">Upload</span>
                  <input type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
                </label>

                {onExportAll && (
                  <button
                    onClick={onExportAll}
                    className={`inline-flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg border-2 transition-all hover:shadow-md text-xs sm:text-sm ${theme.text}`}
                    title="Export all sessions"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span className="font-semibold hidden sm:inline">Export All</span>
                  </button>
                )}

                {onClearAll && (
                  <button
                    onClick={() => {
                      if (window.confirm('Delete all sessions? This cannot be undone.')) {
                        onClearAll();
                      }
                    }}
                    className="inline-flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg border-2 border-red-500 text-red-600 hover:bg-red-50 transition-all hover:shadow-md text-xs sm:text-sm"
                    title="Clear all sessions"
                  >
                    <Trash className="w-4 h-4" />
                    <span className="font-semibold hidden sm:inline">Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
              {quizSessions.slice(0, 20).map((s, idx) => (
                <div
                  key={s.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-start justify-between p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all hover:shadow-md gap-3 sm:gap-0 ${theme.card}`}
                >
                  {/* Session Info */}
                  {editingIdx === idx ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 text-xs sm:text-sm ${theme.text}`}
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(idx)}
                        className={`px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all w-full sm:w-auto ${theme.primary} text-white hover:scale-105`}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingIdx(null)}
                        className="px-2 sm:px-3 py-2 rounded-lg border-2 font-semibold text-xs sm:text-sm transition-all hover:bg-gray-100 w-full sm:w-auto"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="flex-1 cursor-pointer text-left w-full sm:w-auto"
                        onClick={() => onSessionClick(idx)}
                      >
                        <div className={`font-semibold text-sm sm:text-base md:text-lg ${theme.text} hover:opacity-80 break-words`}>
                          {s.topic || 'Untitled Interview'}
                        </div>
                        <div className={`text-xs sm:text-sm ${theme.text} opacity-70 flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1`}>
                          <span>{new Date(s.completedAt).toLocaleDateString()}</span>
                          <span>Score: <strong className={theme.accent}>{s.score}/{s.totalQuestions}</strong></span>
                          <span>Time: <strong>{formatTime(s.timeSpent)}</strong></span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 sm:ml-4 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
                        <button
                          onClick={() => onSessionClick(idx)}
                          className={`p-2 rounded-lg transition-all ${theme.primary} text-white hover:scale-110 flex-1 sm:flex-none`}
                          title="View results"
                        >
                          <Eye className="w-4 h-4 mx-auto sm:mx-0" />
                        </button>

                        <button
                          onClick={() => startEdit(idx, s.topic || '')}
                          className={`p-2 rounded-lg transition-all border-2 text-blue-600 hover:bg-blue-50 hover:scale-110 flex-1 sm:flex-none`}
                          title="Edit title"
                        >
                          <Edit2 className="w-4 h-4 mx-auto sm:mx-0" />
                        </button>

                        <button
                          onClick={() => onDownloadSession && onDownloadSession(idx)}
                          className={`p-2 rounded-lg transition-all border-2 text-green-600 hover:bg-green-50 hover:scale-110 flex-1 sm:flex-none`}
                          title="Download session"
                        >
                          <DownloadCloud className="w-4 h-4 mx-auto sm:mx-0" />
                        </button>

                        <button
                          onClick={() => onDeleteSession && onDeleteSession(idx)}
                          className="p-2 rounded-lg transition-all border-2 border-red-500 text-red-600 hover:bg-red-50 hover:scale-110 flex-1 sm:flex-none"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Interviews Section */}
        {videoInterviews.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${theme.text} break-words`}>🎥 Your Video Interviews</h3>
                <p className={`text-xs sm:text-sm ${theme.text} opacity-70 mt-1`}>
                  {videoInterviews.length} video interview{videoInterviews.length > 1 ? 's' : ''} completed
                </p>
              </div>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event: any) => {
                        try {
                          const importedInterview = JSON.parse(event.target.result);
                          // Ensure topic is preserved from JSON
                          if (!importedInterview.topic) {
                            importedInterview.topic = 'Imported Interview';
                          }
                          if (!importedInterview.id || !Array.isArray(importedInterview.questions) || !Array.isArray(importedInterview.recordings) || !Array.isArray(importedInterview.scores)) throw new Error('Invalid interview');
                          void saveVideo(restoreInterview(importedInterview));
                        } catch (error) {
                          alert('Error importing interview. Please ensure it\'s a valid JSON file.');
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${theme.secondary} text-white hover:scale-105 shrink-0`}
                title="Upload/Import interview"
              >
                <Upload className="w-4 sm:w-5 h-4 sm:h-5" />
                Upload
              </button>
            </div>

            {/* Video Interviews List */}
            <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
              {videoInterviews.slice(0, 20).map((interview, idx) => (
                <div
                  key={interview.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-start justify-between p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all hover:shadow-md gap-3 sm:gap-0 ${theme.card}`}
                >
                  {/* Interview Info */}
                  <div className="flex-1 w-full sm:w-auto">
                    <div className={`font-semibold text-sm sm:text-base md:text-lg ${theme.text} flex items-center gap-2 break-words`}>
                      {interview.interviewMode === 'video' ? '🎥' : '🎤'} {interview.topic || 'Untitled'}
                    </div>
                    <div className={`text-xs sm:text-sm ${theme.text} opacity-70 flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1 flex-wrap`}>
                      <span>{new Date(interview.startedAt).toLocaleDateString()}</span>
                      <span>Score: <strong className={theme.accent}>{interview.scores.some(s => !s.status || s.status === 'scored') ? Math.round(interview.averageScore) + '%' : 'Not scored'}</strong></span>
                      <span>Questions: <strong>{interview.questions.length}</strong></span>
                    </div>

                    {/* Questions and Answers Preview */}
                    <div className="mt-3 space-y-2">
                      {interview.questions.slice(0, 3).map((q, qIdx) => (
                        <div key={q.id} className={`text-xs ${theme.text} opacity-80 pl-2 border-l-2 ic-border-accent`}>
                          <div className="font-semibold mb-1">Q{qIdx + 1}: {(q.question || 'N/A').substring(0, 60)}...</div>
                          <div className="mb-1"><strong>Expected:</strong> {(q.shortAnswer || q.expectedAnswer || 'N/A').substring(0, 80)}...</div>
                          {interview.recordings[qIdx] && interview.recordings[qIdx].transcript && (
                            <div className="mb-1"><strong>Your Answer:</strong> {interview.recordings[qIdx].transcript.substring(0, 80)}</div>
                          )}
                          {interview.scores[qIdx] && (
                            <div className={`font-semibold ${interview.scores[qIdx].score >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                              Score: {interview.scores[qIdx].status && interview.scores[qIdx].status !== 'scored' ? 'Not scored' : interview.scores[qIdx].score + '%'}
                            </div>
                          )}
                        </div>
                      ))}
                      {interview.questions.length > 3 && (
                        <div className={`text-xs ${theme.text} opacity-60 italic`}>
                          +{interview.questions.length - 3} more questions...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 sm:ml-4 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
                    <button
                      onClick={() => onVideoInterviewClick_Home?.(interview)}
                      className={`p-2 rounded-lg transition-all border-2 text-blue-600 hover:bg-blue-50 hover:scale-110 flex-1 sm:flex-none`}
                      title="View results and retry"
                    >
                      <Eye className="w-4 h-4 mx-auto sm:mx-0" />
                    </button>
                    <button
                      onClick={() => {
                        const newTitle = prompt('Enter new title for this interview:', interview.topic);
                        if (newTitle && newTitle.trim()) {
                          const updated = { ...interview, topic: newTitle.trim() };
                          void saveVideo(updated);
                        }
                      }}
                      className={`p-2 rounded-lg transition-all border-2 text-purple-600 hover:bg-purple-50 hover:scale-110 flex-1 sm:flex-none`}
                      title="Edit interview title"
                    >
                      <Edit2 className="w-4 h-4 mx-auto sm:mx-0" />
                    </button>



                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(interviewExport(interview), null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `video-interview-${interview.topic}-${interview.id}.json`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                      }}
                      className={`p-2 rounded-lg transition-all border-2 text-green-600 hover:bg-green-50 hover:scale-110 flex-1 sm:flex-none`}
                      title="Download interview"
                    >
                      <DownloadCloud className="w-4 h-4 mx-auto sm:mx-0" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm('Delete this video interview?')) {
                          removeInterview(interview.id).then(() => { setVideoInterviews(prev => prev.filter(v => v.id !== interview.id)); setStorageError(''); }).catch(err => setStorageError(storageMessage(err)));
                        }
                      }}
                      className="p-2 rounded-lg transition-all border-2 border-red-500 text-red-600 hover:bg-red-50 hover:scale-110 flex-1 sm:flex-none"
                      title="Delete interview"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
