import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Copy, Play, RotateCcw, Trophy, Target, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import useSpeechToText from 'react-hook-speech-to-text';

// Import hooks
import { useTheme, useApiKey, useQuizState, useQuizSessions, useAIGeneration, useVideoInterview } from './hooks';

// Import components
import {
  Header, HomeView, ApiKeySetup, ChangeApiKeyButton, AIGenerationProgress, ProgressBar, QuestionCard,
  VideoInterviewView, VideoInterviewResults
} from './components';

// Import utilities
import {
  generatePrompt, parseAIResponse, formatTime, copyToClipboard, formatCodeBlockToHtml, formatExplanationText,
  generateVideoInterviewPrompt, parseVideoInterviewResponse, validateVideoInterviewResponse
} from './utils';

// Import types and constants
import { themes, PLACEHOLDER_TEXT } from './constants/themes';
import { Question, ViewType, QuizSession, QuizAttempt, VideoQuestion, VideoInterview } from './types';

// Suppress Google Cloud API key warning from react-hook-speech-to-text
const originalError = console.error;
console.error = (...args: any[]) => {
  if (args[0]?.includes?.('No google cloud API key')) return;
  originalError(...args);
};

const QuizApp: React.FC = () => {
  // ============ Custom Hooks ============
  const { currentTheme, setCurrentTheme, themeStorageError } = useTheme('home');
  const { apiKey, setApiKey, showApiKeyInput, setShowApiKeyInput, handleSaveApiKey, clearApiKey, storageError: keyStorageError } = useApiKey();
  const {
    currentQuestionIndex,
    quizAttempts,
    quizStartTime,
    answerQuestion: baseAnswerQuestion,
    startQuiz: baseStartQuiz,
    resetQuiz
  } = useQuizState();
  const { quizSessions, setQuizSessions, addSession } = useQuizSessions();
  const { isGeneratingWithAI, aiGenerationProgress, generateWithAI } = useAIGeneration();  const { startVideoInterview, saveInterview, error: recordingStorageError } = useVideoInterview();
  // ============ Local State ============
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [topic, setTopic] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(6);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [aiResponse, setAIResponse] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isImportSuccessful, setIsImportSuccessful] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(0);
  const [sessionAttempts, setSessionAttempts] = useState<QuizAttempt[]>([]);
  const [videoInterviewMode, setVideoInterviewMode] = useState<'video' | 'audio' | null>(null);
  const [videoQuestions, setVideoQuestions] = useState<VideoQuestion[]>([]);
  const [completedInterview, setCompletedInterview] = useState<VideoInterview | null>(null);
  const [videoSubjectLine, setVideoSubjectLine] = useState<string>('');
  const [videoContext, setVideoContext] = useState<string | undefined>(undefined);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState<number>(0);

  const openPreview = useCallback(() => {
                setTopic('Interview room preview');
                setVideoSubjectLine('Interview room preview');
                setVideoContext('Demo session with sample questions');
                setVideoQuestions([
                  { id: 'room-preview-1', question: 'Tell me about a challenging project you worked on. How did you approach it?', shortAnswer: 'Describe the situation, your responsibility, the actions you took, and the result.', expectedAnswer: 'Use a specific example. Explain the challenge, your own contribution, the trade-offs you considered, and the outcome. Reflect on what you learned.', keyWords: ['challenge', 'actions', 'result'], buddyHint: 'Think of one project you remember well. What made it difficult, and what did you personally do?', buddyExplanation: 'Hey, treat it like telling me a story. Set the scene, explain your part, then describe what you did and how it turned out. A small, honest example is stronger than a big, vague one.' },
                  { id: 'room-preview-2', question: 'When would you choose an array over a linked list?', shortAnswer: 'Arrays offer constant-time indexed access and good memory locality. Linked lists allow constant-time insertion at a known node, but accessing an arbitrary element takes linear time.', expectedAnswer: 'Choose an array for frequent indexed reads and compact storage. A linked list can help when inserting or removing nodes at known positions; finding those positions still takes time. Inserting into the middle of an array generally requires shifting elements.', keyWords: ['indexed', 'access', 'locality', 'insertion'], buddyHint: 'Imagine numbered seats versus a treasure hunt where each clue points to the next one.', buddyExplanation: 'An array is like a row of numbered seats: you can go straight to seat 7. A linked list is a chain of clues: you follow them one at a time. Changing links is cheap when you already have the node, but finding it can take time. Explain which operations your application does most often.' }
                ]);
                setVideoInterviewMode('audio');
    setCurrentView('video-interview');
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('preview') === '1') {
      openPreview();
      url.searchParams.delete('preview');
      window.history.replaceState(window.history.state, '', url.toString());
    }
  }, [openPreview]);

  // ============ Memoized Values ============
  const currentThemeObj = useMemo(() => themes[currentTheme], [currentTheme]);

  // ============ Callbacks ============
  const handleGeneratePrompt = useCallback(() => {
    const prompt = generatePrompt(topic, questionCount);
    setGeneratedPrompt(prompt);
  }, [topic, questionCount]);

  const handleCopyToClipboard = useCallback(async () => {
    const success = await copyToClipboard(generatedPrompt);
    if (success) {
      alert('Prompt copied to clipboard!');
    } else {
      alert('Failed to copy to clipboard');
    }
  }, [generatedPrompt]);

  const handleGenerateWithAI = useCallback(async () => {
    if (!apiKey || !topic.trim()) {
      alert('Please enter a topic and API key');
      return;
    }

    const prompt = generatePrompt(topic, questionCount);

    await generateWithAI(apiKey, prompt, (response) => {
      // Success callback
      setAIResponse(response);
      const parsed = parseAIResponse(response);
      if (parsed.length > 0) {
        setQuestions(parsed);
        setIsImportSuccessful(false);
        setImportedCount(0);
        // Directly start the quiz instead of going to import view
        baseStartQuiz();
        setSessionAttempts([]);
        setCurrentView('quiz');
      } else {
        alert('No valid questions found in AI response. Please check the format.');
      }
    }, (error) => {
      // Error callback
      alert(error);
      setShowApiKeyInput(true);
    });
  }, [apiKey, topic, questionCount, generateWithAI, setShowApiKeyInput, baseStartQuiz]);

  const handleParseAIResponse = useCallback(() => {
    if (!aiResponse.trim()) {
      alert('Please paste the AI response first');
      return;
    }

    const parsed = parseAIResponse(aiResponse);
    if (parsed.length === 0) {
      alert('No valid questions found. Please check the format.');
      return;
    }

    setQuestions(parsed);
    setIsImportSuccessful(true);
    setImportedCount(parsed.length);
  }, [aiResponse]);

  const handleStartQuiz = useCallback(() => {
    baseStartQuiz();
    setSessionAttempts([]);
    setQuizQuestionIndex(0);
    setCurrentView('quiz');
  }, [baseStartQuiz]);

  const finishQuiz = useCallback((attemptsSnapshot?: QuizAttempt[]) => {
    if (!quizStartTime) return;

    const totalTime = Date.now() - quizStartTime.getTime();
    const attemptsToUse = attemptsSnapshot ?? quizAttempts;

    const score = attemptsToUse.filter(attempt => attempt.isCorrect).length;

    const session: QuizSession = {
      id: `session_${Date.now()}`,
      topic,
      questions,
      attempts: attemptsToUse,
      score,
      totalQuestions: questions.length,
      timeSpent: totalTime,
      completedAt: new Date(),
      theme: currentTheme
    };

    addSession(session);
    setCurrentView('results');
  }, [quizStartTime, quizAttempts, topic, questions, currentTheme, addSession]);

  const handleAnswerQuestion = useCallback((selectedAnswer: string) => {
    baseAnswerQuestion(selectedAnswer, questions, (attempts) => {
      finishQuiz(attempts);
    });
  }, [baseAnswerQuestion, questions, finishQuiz]);

  const handleRetryQuiz = useCallback(() => {
    resetQuiz();
    setSessionAttempts([]);
    handleStartQuiz();
  }, [resetQuiz, handleStartQuiz]);

  const handleEditSession = useCallback((idx: number, newTitle: string) => {
    const updated = quizSessions.map((sess, i) => (i === idx ? { ...sess, topic: newTitle } : sess));
    setQuizSessions && setQuizSessions(updated);
  }, [quizSessions, setQuizSessions]);

  const handleDeleteSession = useCallback((idx: number) => {
    if (!window.confirm('Delete this session?')) return;
    setQuizSessions && setQuizSessions(prev => prev.filter((_, i) => i !== idx));
    setQuestions(prev => {
      if (selectedSessionIndex === idx) {
        setSelectedSessionIndex(0);
        return [];
      }
      return prev;
    });
  }, [setQuizSessions, selectedSessionIndex]);

  const handleDownloadSession = useCallback((idx: number) => {
    const sess = quizSessions[idx];
    if (!sess) return;
    const blob = new Blob([JSON.stringify(sess, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sess.topic || 'quiz-session'}-${sess.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [quizSessions]);

  const handleUploadSession = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as QuizSession;
      if (parsed && parsed.questions && Array.isArray(parsed.questions)) {
        addSession(parsed);
        alert('Session uploaded');
      } else {
        alert('Invalid session file');
      }
    } catch (err) {
      alert('Failed to read upload');
    }
  }, [addSession]);

  const handleClearAll = useCallback(() => {
    setQuizSessions && setQuizSessions([]);
    setQuestions([]);
    setSelectedSessionIndex(0);
  }, [setQuizSessions]);

  const handleExportAll = useCallback(() => {
    if (quizSessions.length === 0) {
      alert('No sessions to export');
      return;
    }
    const blob = new Blob([JSON.stringify(quizSessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-sessions-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [quizSessions]);

  const handleNewTopic = useCallback(() => {
    resetQuiz();
    setQuestions([]);
    setTopic('');
    setGeneratedPrompt('');
    setCurrentView('generate');
  }, [resetQuiz]);

  const handleVideoInterviewStart = useCallback(() => {
    setTopic('');
    setQuestionCount(2);
    setVideoInterviewMode(null);
    setVideoQuestions([]);
    setCurrentView('video-interview');
  }, []);

  const handleVideoInterviewGenerate = useCallback(async () => {
    if (!apiKey || !topic.trim()) {
      alert('Please enter a topic and API key');
      return;
    }
    const prompt = generateVideoInterviewPrompt(topic, questionCount);
    await generateWithAI(apiKey, prompt, (response) => {
      // Check for empty response
      if (!response || response.trim().length === 0) {
        alert('❌ API returned an empty response. This might mean:\n1. Content was blocked by safety filters\n2. Your API key is not working properly\n3. API service is having issues\n\nPlease try:\n- Using a different, more specific topic\n- Checking your API key on Google AI Studio\n- Waiting a moment and trying again');
        return;
      }

      // Parse the response - more lenient approach
      const parsed = parseVideoInterviewResponse(response);

      if (parsed.length > 0) {
        setVideoQuestions(parsed);
        // Store subject line and context for retry capability
        setVideoSubjectLine(topic);
        setVideoContext(undefined);
      } else {
        const isValid = validateVideoInterviewResponse(response);

        if (!isValid) {
          alert('Response format not recognized. Please ensure the AI response contains questions with answers. You can try rephrasing your topic or try again.');
        } else {
          alert('Unable to parse questions. Please try a different topic or check your API key.');
        }
      }
    }, (error) => {
      alert(error);
      setShowApiKeyInput(true);
    });
  }, [apiKey, topic, questionCount, generateWithAI, setShowApiKeyInput]);

  const handleVideoInterviewModeSelect = useCallback((mode: 'video' | 'audio') => {
    setVideoInterviewMode(mode);
    startVideoInterview(mode, videoQuestions);
  }, [videoQuestions, startVideoInterview]);

  const handleVideoInterviewComplete = useCallback((interview: VideoInterview) => {
    setCompletedInterview(interview);
    void saveInterview(interview);
    setCurrentView('video-results');
  }, [saveInterview]);

  const handleVideoInterviewRetry = useCallback(() => {
    if (completedInterview) {
      // Retry with same questions and mode
      setVideoQuestions(completedInterview.questions);
      setVideoInterviewMode(completedInterview.interviewMode);

      // Add counter to topic if retrying
      const currentTopic = completedInterview.topic;
      const countMatch = currentTopic.match(/ (\d+)$/);
      const baseTitle = countMatch ? currentTopic.slice(0, countMatch.index) : currentTopic;
      const currentCount = countMatch ? parseInt(countMatch[1]) : 1;
      const newTopic = `${baseTitle} ${currentCount + 1}`;
      setTopic(newTopic);

      setCompletedInterview(null);
      setCurrentView('video-interview');
    } else {
      // Fallback to home
      setCurrentView('home');
    }
  }, [completedInterview]);

  const handleViewVideoInterview = useCallback((interview: VideoInterview) => {
    setCompletedInterview(interview);
    setCurrentView('video-results');
  }, []);

  const handleBackToHome = useCallback(() => {
    setCurrentView('home');
  }, []);

  // ============ VoiceAnswerButton Component ============
  const VoiceAnswerButton: React.FC<{
    disabled?: boolean;
    onVoiceAnswer: (answer: string) => void;
  }> = ({ disabled, onVoiceAnswer }) => {
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const {
      error,
      interimResult,
      isRecording,
      results,
      startSpeechToText,
      stopSpeechToText,
    } = useSpeechToText({
      continuous: false,
      crossBrowser: true,
      useLegacyResults: false,
      speechRecognitionProperties: {
        lang: 'en-US',
        interimResults: false,
      },
    });

    const startListening = useCallback(async () => {
      if (disabled) return;

      setRecordedAudio(null);
      audioChunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setRecordedAudio(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        startSpeechToText();
      } catch (err) {
        alert('Microphone access denied or not available.');
      }
    }, [disabled, startSpeechToText]);

    const stopListening = useCallback(() => {
      stopSpeechToText();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      setTimeout(() => {
        if (results.length > 0) {
          const last = results[results.length - 1];
          const transcript = typeof last === 'string' ? last : (last.transcript ?? '');
          onVoiceAnswer(transcript);
        }
      }, 5000);
    }, [stopSpeechToText, results, onVoiceAnswer]);

    const playRecording = useCallback(() => {
      if (recordedAudio) {
        const audioUrl = URL.createObjectURL(recordedAudio);
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => URL.revokeObjectURL(audioUrl);
      }
    }, [recordedAudio]);

    if (error) {
      alert(`Voice recognition error: ${error}`);
    }

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={isRecording ? stopListening : startListening}
          className={`px-3 py-2 rounded-lg text-white transition-all text-sm font-semibold ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'ic-primary'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isRecording ? 'Stop recording' : 'Answer by voice'}
        >
          {isRecording ? '🎤 Recording...' : '🎤 Voice Answer'}
        </button>

        {recordedAudio && (
          <button
            type="button"
            onClick={playRecording}
            className="px-3 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all text-sm font-semibold"
            title="Play your recording"
          >
            ▶️ Play
          </button>
        )}

        {interimResult && (
          <span className="text-sm text-gray-500 italic">
            {interimResult}
          </span>
        )}
      </div>
    );
  };

  // ============ Render Helpers ============
  const formatTextWithCode = useCallback((text: string): JSX.Element => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return (
      <>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <pre key={index} className="bg-gray-800 text-green-400 p-3 rounded-lg my-2 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                <code>{part.trim()}</code>
              </pre>
            );
          } else {
            const inlineCodeRegex = /`([^`]+)`/g;
            const textParts = part.split(inlineCodeRegex);

            return (
              <span key={index}>
                {textParts.map((textPart, textIndex) => {
                  if (textIndex % 2 === 1) {
                    return (
                      <code key={textIndex} className="bg-gray-200 text-red-600 px-1 py-0.5 rounded text-sm font-mono">
                        {textPart}
                      </code>
                    );
                  } else {
                    const linkParts = textPart.split(urlRegex);
                    return (
                      <span key={textIndex}>
                        {linkParts.map((lp, lpIdx) =>
                          lpIdx % 2 === 1 ? (
                            <a
                              key={lpIdx}
                              href={lp}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              {lp}
                            </a>
                          ) : (
                            <span key={lpIdx}>{lp}</span>
                          )
                        )}
                      </span>
                    );
                  }
                })}
              </span>
            );
          }
        })}
      </>
    );
  }, []);

  const formatExplanationWithLinks = useCallback((text: string): JSX.Element => {
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);

    return (
      <>
        {parts.map((part, index) => {
          if (index % 3 === 2) {
            return (
              <pre
                key={index}
                className="bg-gray-800 text-green-400 p-3 rounded-lg my-2 overflow-x-auto text-sm font-mono whitespace-pre-wrap"
              >
                <code>{part.trim()}</code>
              </pre>
            );
          } else if (index % 3 === 0) {
            const inlineCodeRegex = /`([^`]+)`/g;
            const textParts = part.split(inlineCodeRegex);

            return (
              <span key={index}>
                {textParts.map((textPart, textIndex) => {
                  if (textIndex % 2 === 1) {
                    return (
                      <code
                        key={textIndex}
                        className="bg-gray-200 text-red-600 px-1 py-0.5 rounded text-sm font-mono"
                      >
                        {textPart}
                      </code>
                    );
                  } else {
                    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                    const plainUrlRegex = /(📚|📖|🔗|ℹ️)?\s*(https?:\/\/[^\s)]+)/g;

                    const elements: JSX.Element[] = [];
                    let lastIndex = 0;

                    let markdownMatch;
                    const markdownMatches: Array<{ index: number; length: number; text: string; url: string }> = [];

                    while ((markdownMatch = markdownLinkRegex.exec(textPart)) !== null) {
                      markdownMatches.push({
                        index: markdownMatch.index,
                        length: markdownMatch[0].length,
                        text: markdownMatch[1],
                        url: markdownMatch[2].trim()
                      });
                    }

                    if (markdownMatches.length > 0) {
                      markdownMatches.forEach((match) => {
                        if (match.index > lastIndex) {
                          elements.push(
                            <span key={`text-${lastIndex}`}>
                              {textPart.substring(lastIndex, match.index)}
                            </span>
                          );
                        }
                        elements.push(
                          <a
                            key={`link-${match.index}`}
                            href={match.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {match.text}
                          </a>
                        );
                        lastIndex = match.index + match.length;
                      });

                      if (lastIndex < textPart.length) {
                        elements.push(
                          <span key={`text-${lastIndex}`}>
                            {textPart.substring(lastIndex)}
                          </span>
                        );
                      }

                      return <span key={textIndex}>{elements}</span>;
                    } else {
                      const urlParts = textPart.split(plainUrlRegex);

                      return (
                        <span key={textIndex}>
                          {urlParts.map((part, idx) =>
                            idx % 3 === 2 ? (
                              <a
                                key={idx}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800"
                              >
                                {urlParts[idx - 1] || ''} {part}
                              </a>
                            ) : idx % 3 !== 1 ? (
                              <span key={idx}>{part}</span>
                            ) : null
                          )}
                        </span>
                      );
                    }
                  }
                })}
              </span>
            );
          }
          return null;
        })}
      </>
    );
  }, []);

  // ============ JSX Render ============
  return (
    <div className={`min-h-screen ${currentThemeObj.bg} transition-all duration-500`}>
      {/* Header */}
      <Header
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        theme={currentThemeObj}
        quizSessionsCount={quizSessions.length}
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {themeStorageError && <p role="status">{themeStorageError}</p>}
        {keyStorageError && <p role="alert" className={`${currentThemeObj.card} p-4 mb-4`}>{keyStorageError}</p>}
        {apiKey && <button className={`${currentThemeObj.secondary} px-4 py-2 mb-4`} onClick={clearApiKey}>Remove API key only</button>}
        {recordingStorageError && <div role="alert" className={`${currentThemeObj.card} p-4 mb-4`}>{recordingStorageError}{completedInterview && <button className="underline ml-3" onClick={() => void saveInterview(completedInterview)}>Retry saving</button>}</div>}
        {/* Home View */}
        {currentView === 'home' && (
          <HomeView
            theme={currentThemeObj}
            quizSessionsCount={quizSessions.length}
            quizSessions={quizSessions}
            onGenerateClick={() => setCurrentView('generate')}
            onImportClick={() => setCurrentView('import')}
            onVideoInterviewClick={handleVideoInterviewStart}
            onSessionClick={(idx) => {
              setSelectedSessionIndex(idx);
              const session = quizSessions[idx];
              setQuestions(session?.questions || []);
              setSessionAttempts(session?.attempts || []);
              setCurrentView('results');
            }}
            onEditSession={(idx, newTitle) => handleEditSession(idx, newTitle)}
            onDeleteSession={(idx) => handleDeleteSession(idx)}
            onDownloadSession={(idx) => handleDownloadSession(idx)}
            onUploadSession={(file) => handleUploadSession(file)}
            onClearAll={() => handleClearAll()}
            onExportAll={() => handleExportAll()}
            onVideoInterviewClick_Home={handleViewVideoInterview}
          />
        )}

        {/* Generate Prompt View */}
        {currentView === 'generate' && (
          <div className={`${currentThemeObj.card} rounded-2xl shadow-xl p-8 border max-w-4xl mx-auto`}>
            <h2 className={`text-3xl font-bold ${currentThemeObj.text} mb-6`}>What are you preparing for?</h2>
            <p className="text-sm mb-4">AI-generated questions and reference answers may be incorrect or outdated. Verify current affairs against dated primary sources.</p>

            {/* API Key Setup */}
            {!apiKey || showApiKeyInput ? (
              <ApiKeySetup
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                onSaveApiKey={handleSaveApiKey}
                onChangeKey={() => setShowApiKeyInput(true)}
              />
            ) : (
              <ChangeApiKeyButton
                theme={currentThemeObj}
                onChangeKey={() => setShowApiKeyInput(true)}
              />
            )}

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${currentThemeObj.text} mb-2`}>
                  Topic or Content or Link
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={PLACEHOLDER_TEXT}
                  className="w-full h-32 p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 resize-vertical"
                  disabled={isGeneratingWithAI}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentThemeObj.text} mb-2`}>
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  disabled={isGeneratingWithAI}
                >
                  {[5, 10, 15, 30, 50, 100].map(num => (
                    <option key={num} value={num}>{num} Questions</option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={handleGeneratePrompt}
                  disabled={!topic.trim() || isGeneratingWithAI}
                  className={`${currentThemeObj.primary} text-white py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200`}
                >
                  📋 Generate Prompt (Manual)
                </button>

                <button
                  onClick={handleGenerateWithAI}
                  disabled={!topic.trim() || !apiKey || isGeneratingWithAI}
                  className={`${
                    !apiKey
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : currentThemeObj.secondary
                  } text-white py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2`}
                  title={!apiKey ? 'Please add Gemini API key to enable AI generation' : 'Generate interview questions using AI'}
                >
                  {isGeneratingWithAI ? (
                    <>
                      <Loader className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      ✨ Generate with AI (Gemini)
                    </>
                  )}
                </button>
              </div>

              <AIGenerationProgress
                isGenerating={isGeneratingWithAI}
                progress={aiGenerationProgress}
              />
            </div>

            {generatedPrompt && !isGeneratingWithAI && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-xl font-semibold ${currentThemeObj.text}`}>Generated Prompt</h3>
                  <button
                    onClick={handleCopyToClipboard}
                    className={`${currentThemeObj.secondary} text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-all duration-200`}
                  >
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </button>
                </div>

                <div className="bg-gray-100 p-4 rounded-xl border">
                  <div className={`text-sm ${currentThemeObj.accent} font-medium mb-2`}>
                    Topic: {topic} | Questions: {questionCount}
                  </div>
                  <div className="text-xs text-gray-600">
                    Copy this prompt and paste it into any AI platform (ChatGPT, Claude, Gemini, etc.)
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setCurrentView('import')}
                    className={`${currentThemeObj.primary} text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-200`}
                  >
                    Next: Import Generated Questions
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => setCurrentView('home')}
                disabled={isGeneratingWithAI}
                className={`${currentThemeObj.secondary} text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

        {/* Import Questions View */}
        {currentView === 'import' && (
          <div className={`${currentThemeObj.card} rounded-2xl shadow-xl p-8 border max-w-4xl mx-auto`}>
            <h2 className={`text-3xl font-bold ${currentThemeObj.text} mb-6`}>Import AI Generated Questions</h2>

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${currentThemeObj.text} mb-2`}>
                  Paste the AI response here
                </label>
                <textarea
                  value={aiResponse}
                  onChange={(e) => setAIResponse(e.target.value)}
                  placeholder="Paste the complete AI response with questions and answers here..."
                  className="w-full h-64 p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 resize-vertical font-mono text-sm"
                />
              </div>

              <button
                onClick={handleParseAIResponse}
                disabled={!aiResponse.trim()}
                className={`w-full ${currentThemeObj.primary} text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200`}
              >
                Import Questions
              </button>
            </div>

            {isImportSuccessful && (
              <div className="mt-8">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    ✅ Successfully Imported {importedCount} Questions
                  </h3>
                  <p className="text-green-700 text-sm">
                    Topic: {topic || 'Custom Quiz'}
                  </p>
                </div>

                <button
                  onClick={handleStartQuiz}
                  disabled={!isImportSuccessful || questions.length === 0}
                  className={`w-full ${currentThemeObj.primary} text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Play className="w-6 h-6 inline mr-2" />
                  Start Interview ({questions.length} Questions)
                </button>
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => setCurrentView('home')}
                className={`${currentThemeObj.secondary} text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-200`}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

        {/* Quiz View */}
        {currentView === 'quiz' && questions.length > 0 && (
          <div className={`${currentThemeObj.card} rounded-2xl shadow-xl p-3 sm:p-6 md:p-8 border max-w-4xl mx-auto`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div>
                <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${currentThemeObj.text} break-words`}>Interview in Progress</h2>
                <p className={`text-xs sm:text-sm ${currentThemeObj.text} opacity-70`}>Theme: {currentThemeObj.name}</p>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm sm:text-base md:text-lg font-semibold ${currentThemeObj.accent}`}>
                  Question {quizQuestionIndex + 1} of {questions.length}
                </div>
                <div className={`text-xs sm:text-sm ${currentThemeObj.text} opacity-70`}>
                  Score: {quizAttempts.filter(a => a.isCorrect).length} / {questions.length}
                </div>
              </div>
            </div>

            <ProgressBar
              current={quizQuestionIndex + 1}
              total={questions.length}
              theme={currentThemeObj}
            />

            {questions[quizQuestionIndex] && (
              <div>
                <div className="mb-8">

                  <button
                    className="mb-4 px-4 py-2 ic-primary text-white rounded-lg transition-all"
                    onClick={() => {
                      const utterance = new SpeechSynthesisUtterance(questions[quizQuestionIndex].question);
                      window.speechSynthesis.speak(utterance);
                    }}
                  >
                    🔊 Read
                  </button>

                  <QuestionCard
                    question={questions[quizQuestionIndex]}
                    index={quizQuestionIndex}
                    selectedAnswer={quizAttempts.find(a => a.questionId === questions[quizQuestionIndex].id)?.selectedAnswer}
                    onSelectAnswer={handleAnswerQuestion}
                    showResult={!!quizAttempts.find(a => a.questionId === questions[quizQuestionIndex].id)}
                    theme={currentThemeObj}
                  />

                  <div className="mt-6">
                    <VoiceAnswerButton
                      disabled={!!quizAttempts.find(a => a.questionId === questions[quizQuestionIndex].id)}
                      onVoiceAnswer={(transcript) => {
                        const words = transcript.toLowerCase().split(/\s+/);
                        if (words.includes('a') || words[0].includes('a')) handleAnswerQuestion('A');
                        else if (words.includes('b') || words[0].includes('b')) handleAnswerQuestion('B');
                        else if (words.includes('c') || words[0].includes('c')) handleAnswerQuestion('C');
                        else if (words.includes('d') || words[0].includes('d')) handleAnswerQuestion('D');
                      }}
                    />
                  </div>
                </div>

                {quizAttempts.find(a => a.questionId === questions[quizQuestionIndex].id) && (
                  <div className="mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <h4 className="font-bold text-sm sm:text-base text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                      📚 Explanation
                    </h4>
                    <div
                      className="text-xs sm:text-sm text-blue-800 dark:text-blue-100 prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatExplanationText(questions[quizQuestionIndex].explanation) }}
                    />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
                  <button
                    onClick={() => quizQuestionIndex > 0 && setQuizQuestionIndex(quizQuestionIndex - 1)}
                    disabled={quizQuestionIndex === 0}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                      quizQuestionIndex === 0
                        ? 'opacity-50 cursor-not-allowed bg-gray-400'
                        : `${currentThemeObj.secondary} hover:scale-105 text-white`
                    }`}
                  >
                    <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
                    Previous
                  </button>

                  <div className="text-center">
                    {quizAttempts.find(a => a.questionId === questions[quizQuestionIndex].id) && (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold text-white ${currentThemeObj.primary}`}>
                        ✓ Answered
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => quizQuestionIndex < questions.length - 1 && setQuizQuestionIndex(quizQuestionIndex + 1)}
                    disabled={quizQuestionIndex === questions.length - 1}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                      quizQuestionIndex === questions.length - 1
                        ? 'opacity-50 cursor-not-allowed bg-gray-400'
                        : `${currentThemeObj.primary} hover:scale-105 text-white`
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results View */}
        {currentView === 'results' && quizSessions.length > 0 && (
          <div className={`${currentThemeObj.card} rounded-2xl shadow-xl p-3 sm:p-6 md:p-8 border max-w-4xl mx-auto`}>
            <div className="text-center mb-6 sm:mb-8">
              <Trophy className={`w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-3 sm:mb-4 ${currentThemeObj.accent}`} />
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${currentThemeObj.text} mb-3 sm:mb-4 break-words`}>Your practice session is complete!</h2>

              {(() => {
                const session = quizSessions[selectedSessionIndex] || quizSessions[0];
                const percentage = Math.round((session.score / session.totalQuestions) * 100);
                const performanceColor =
                  percentage >= 80
                    ? 'text-green-600'
                    : percentage >= 60
                    ? 'text-yellow-600'
                    : 'text-red-600';

                return (
                  <div className={`text-4xl sm:text-5xl font-bold ${performanceColor} mb-2`}>
                    {percentage}%
                  </div>
                );
              })()}

              <p className={`${currentThemeObj.text} text-xs sm:text-base md:text-lg break-words`}>
                You got { (quizSessions[selectedSessionIndex] || quizSessions[0]).score } out of { (quizSessions[selectedSessionIndex] || quizSessions[0]).totalQuestions } correct
              </p>
              <p className={`${currentThemeObj.text} opacity-70 text-xs sm:text-sm`}>
                Time spent: {formatTime((quizSessions[selectedSessionIndex] || quizSessions[0]).timeSpent)}
              </p>
            </div>

            {/* Question Review */}
            <div className="mb-6 sm:mb-8">
              <h3 className={`text-base sm:text-lg md:text-xl font-semibold ${currentThemeObj.text} mb-4 sm:mb-6 break-words`}>Question Review</h3>
              <div className="max-h-96 overflow-y-auto space-y-3 sm:space-y-4">
                {questions.map((question, index) => {
                  const attemptsToUse = sessionAttempts.length > 0 ? sessionAttempts : quizAttempts;
                  const attempt = attemptsToUse.find(a => a.questionId === question.id);
                  const isCorrect = attempt?.isCorrect;
                  const options = [
                    { label: 'A', text: question.option1 },
                    { label: 'B', text: question.option2 },
                    { label: 'C', text: question.option3 },
                    { label: 'D', text: question.option4 }
                  ];
                  const questionHasCode = /```[\s\S]*?```/.test(question.question);

                  return (
                    <div
                      key={question.id}
                      className={`border-l-4 rounded-lg p-2 sm:p-3 md:p-4 ${
                        isCorrect ? 'border-green-500' : 'border-red-500'
                      } ${currentThemeObj.card}`}
                    >
                      <div className={`font-semibold mb-2 text-xs sm:text-sm ${currentThemeObj.text} break-words`}>
                        Q{index + 1}: {isCorrect ? '✓' : '✗'}
                      </div>

                      {questionHasCode ? (
                        <div
                          className={`mb-4 text-xs sm:text-sm ${currentThemeObj.text}`}
                          dangerouslySetInnerHTML={{ __html: formatCodeBlockToHtml(question.question) }}
                        />
                      ) : (
                        <div className={`mb-4 ${currentThemeObj.text}`}>{question.question}</div>
                      )}

                      <div className={`text-sm mb-4 space-y-2 ${currentThemeObj.text}`}>
                        {options.map(({ label, text }) => {
                          const correctAnswer = question?.answer || '';
                          const isCorrectOption = label === (correctAnswer || '').toUpperCase();
                          const isSelectedOption = label === (attempt?.selectedAnswer || '').toUpperCase();
                          const highlightClass = isCorrectOption
                            ? 'bg-green-100 border border-green-500 text-gray-800'
                            : isSelectedOption && attempt?.selectedAnswer
                            ? 'bg-red-100 border border-red-500 text-gray-800'
                            : `border border-gray-300 ${currentThemeObj.text}`;
                          const optionHasCode = /```[\s\S]*?```/.test(text);

                          return (
                            <div key={label} className={`p-2 rounded ${highlightClass}`}>
                              <strong>{label})</strong>{' '}
                              {optionHasCode ? (
                                <span dangerouslySetInnerHTML={{ __html: formatCodeBlockToHtml(text) }} />
                              ) : (
                                <span>{text}</span>
                              )}
                              {isCorrectOption && ' ✓'}
                              {isSelectedOption && !isCorrectOption && ' ✗'}
                            </div>
                          );
                        })}
                      </div>

                      <div className={`text-sm mb-2 ${currentThemeObj.text}`}>
                        Your answer: <strong>{attempt?.selectedAnswer}</strong> | Correct:{' '}
                        <strong>{question?.answer || 'N/A'}</strong> | Time:{' '}
                        <strong>{formatTime(attempt?.timeSpent || 0)}</strong>
                      </div>

                      <div className={`mt-4 p-3 sm:p-4 rounded-lg ${currentThemeObj.bg} border border-blue-200 dark:border-blue-800`}>
                        <h4 className={`font-bold text-sm sm:text-base mb-3 ${currentThemeObj.text} flex items-center gap-2`}>
                          📚 Explanation
                        </h4>
                        <div
                          className={`text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none ${currentThemeObj.text}`}
                          dangerouslySetInnerHTML={{ __html: formatExplanationText(question.explanation) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
              <button
                onClick={handleRetryQuiz}
                className={`${currentThemeObj.primary} text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2`}
              >
                <RotateCcw className="w-4 sm:w-5 h-4 sm:h-5" />
                Retry Same Interview
              </button>

              <button
                onClick={handleNewTopic}
                className={`${currentThemeObj.secondary} text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2`}
              >
                <Target className="w-4 sm:w-5 h-4 sm:h-5" />
                New Topic
              </button>

              <button
                onClick={handleBackToHome}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm hover:scale-105 transition-all duration-200"
              >
                Back to Home
              </button>
            </div>

            {/* Statistics */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className={`${currentThemeObj.card} border rounded-xl p-4 text-center`}>
                <div className={`text-2xl font-bold ${currentThemeObj.accent}`}>
                  {quizSessions.length > 0
                    ? Math.round(
                        quizSessions.reduce((sum, session) => sum + (session.score / session.totalQuestions) * 100, 0) /
                          quizSessions.length
                      )
                    : 0}
                  %
                </div>
                <div className={`text-sm ${currentThemeObj.text} opacity-70`}>Average Score</div>
              </div>

              <div className={`${currentThemeObj.card} border rounded-xl p-4 text-center`}>
                <div className={`text-2xl font-bold ${currentThemeObj.accent}`}>
                  {quizSessions.length}
                </div>
                <div className={`text-sm ${currentThemeObj.text} opacity-70`}>Total Quizzes</div>
              </div>

              <div className={`${currentThemeObj.card} border rounded-xl p-4 text-center`}>
                <div className={`text-2xl font-bold ${currentThemeObj.accent}`}>
                  {quizSessions.length > 0
                    ? formatTime(
                        Math.round(
                          quizSessions.reduce((sum, session) => sum + session.timeSpent, 0) / quizSessions.length
                        )
                      )
                    : '0:00'}
                </div>
                <div className={`text-sm ${currentThemeObj.text} opacity-70`}>Avg Time</div>
              </div>
            </div>
          </div>
        )}

        {/* Video Interview Mode Selection View */}
        {currentView === 'video-interview' && videoInterviewMode === null && videoQuestions.length === 0 && (
          <div className={`${currentThemeObj.card} rounded-2xl shadow-xl p-8 border max-w-4xl mx-auto`}>
            <h2 className={`text-3xl font-bold ${currentThemeObj.text} mb-6`}>Prepare your interview room</h2>
            <p className="text-sm mb-4">AI-generated questions and reference answers may be incorrect or outdated. Check facts before using them to study.</p>
            <div className={`mb-6 p-4 rounded-xl border ${currentThemeObj.bg}`}>
              <p className={`text-sm mb-3 ${currentThemeObj.text}`}>Step inside, meet your interviewer, and choose your voices. Preview with two sample questions before generating your own.</p>
              <button className={`${currentThemeObj.primary} text-white px-4 py-2 rounded-lg font-semibold text-sm`} onClick={() => {
                openPreview();
              }}>Preview 3D room · no API key needed</button>
            </div>

            {/* API Key Setup */}
            {!apiKey || showApiKeyInput ? (
              <ApiKeySetup
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                onSaveApiKey={handleSaveApiKey}
                onChangeKey={() => setShowApiKeyInput(true)}
              />
            ) : (
              <ChangeApiKeyButton
                theme={currentThemeObj}
                onChangeKey={() => setShowApiKeyInput(true)}
              />
            )}

            <div className="space-y-6 mt-6">
              <div>
                <label className={`block text-sm font-medium ${currentThemeObj.text} mb-2`}>
                  Topic or Content or Link
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={PLACEHOLDER_TEXT}
                  className="w-full h-32 p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 resize-vertical"
                  disabled={isGeneratingWithAI}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentThemeObj.text} mb-2`}>
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  disabled={isGeneratingWithAI}
                >
                  {[2, 5, 10, 15, 20, 30].map(num => (
                    <option key={num} value={num}>{num} Questions</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleVideoInterviewGenerate}
                disabled={!topic.trim() || isGeneratingWithAI}
                className={`w-full ${currentThemeObj.primary} text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {isGeneratingWithAI ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  'Prepare Interview Room'
                )}
              </button>

              <AIGenerationProgress
                isGenerating={isGeneratingWithAI}
                progress={aiGenerationProgress}
              />

              <button
                onClick={handleBackToHome}
                className={`w-full ${currentThemeObj.secondary} text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-200`}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        )}

        {/* Video Interview Mode Selection */}
        {currentView === 'video-interview' && videoQuestions.length > 0 && videoInterviewMode === null && (
          <div className={`${currentThemeObj.card} rounded-2xl shadow-xl p-8 border max-w-2xl mx-auto text-center`}>
            <h2 className={`text-3xl font-bold ${currentThemeObj.text} mb-8`}>Choose Interview Mode</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => handleVideoInterviewModeSelect('video')}
                className={`p-8 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${currentThemeObj.primary}20`}
              >
                <div className="text-5xl mb-4">🎥</div>
                <h3 className={`text-xl font-bold ${currentThemeObj.text} mb-2`}>Video Interview</h3>
                <p className={`text-sm ${currentThemeObj.text} opacity-70`}>
                  Record video with your face and voice for your answers
                </p>
              </button>

              <button
                onClick={() => handleVideoInterviewModeSelect('audio')}
                className={`p-8 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${currentThemeObj.secondary}20`}
              >
                <div className="text-5xl mb-4">🎤</div>
                <h3 className={`text-xl font-bold ${currentThemeObj.text} mb-2`}>Audio Only Interview</h3>
                <p className={`text-sm ${currentThemeObj.text} opacity-70`}>
                  Record audio only for your answers
                </p>
              </button>
            </div>

            <p className={`text-sm ${currentThemeObj.text} opacity-70 mb-4`}>
              Questions ready: {videoQuestions.length}
            </p>

            <button
              onClick={handleBackToHome}
              className={`w-full ${currentThemeObj.secondary} text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-200`}
            >
              ← Back to Home
            </button>
          </div>
        )}

        {/* Video Interview View */}
        {currentView === 'video-interview' && videoInterviewMode !== null && videoQuestions.length > 0 && (
          <VideoInterviewView
            theme={currentThemeObj}
            topic={topic}
            subjectLine={videoSubjectLine}
            context={videoContext}
            interviewMode={videoInterviewMode}
            questions={videoQuestions}
            onComplete={handleVideoInterviewComplete}
            onBack={() => {
              setVideoInterviewMode(null);
              setCurrentView('video-interview');
            }}
          />
        )}

        {/* Video Interview Results */}
        {currentView === 'video-results' && completedInterview && (
          <VideoInterviewResults
            theme={currentThemeObj}
            interview={completedInterview}
            onRetry={handleVideoInterviewRetry}
            onBackToHome={() => {
              setVideoInterviewMode(null);
              setCompletedInterview(null);
              setVideoQuestions([]);
              setTopic('');
              setCurrentView('home');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default QuizApp;
