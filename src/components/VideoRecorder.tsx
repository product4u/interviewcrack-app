import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../constants/themes';
import { recordingExtension } from '../utils/interviewStorage';
interface VideoRecorderProps {
  theme: Theme; mode: 'video' | 'audio'; isProcessing?: boolean; disabled?: boolean;
  onRecordingComplete: (blob: Blob, transcript: string, duration: number, type: 'video' | 'audio') => void;
  onDownload?: (filename: string) => void; onRecordingStateChange?: (recording: boolean) => void;
}
export function supportedMimeType(mode: 'video' | 'audio'): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return (mode === 'video' ? ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']).find(type => MediaRecorder.isTypeSupported(type));
}
export function mediaErrorMessage(error: { name?: string }): string {
  switch (error.name) {
    case 'NotAllowedError': return 'Microphone or camera access was denied. Allow access in your browser site settings, then retry.';
    case 'NotFoundError': return 'No microphone or camera was found. Connect a device and retry, or choose audio practice.';
    case 'NotReadableError': return 'Your device is busy or unavailable. Close other apps using it and retry.';
    case 'OverconstrainedError': return 'This device cannot use the requested settings. Try audio practice or another device.';
    default: return 'Recording could not start. Use HTTPS and a browser with recording support, then check device permissions.';
  }
}
export const VideoRecorder: React.FC<VideoRecorderProps> = ({ theme, mode, disabled, isProcessing, onRecordingComplete, onDownload, onRecordingStateChange }) => {
  const [status, setStatus] = useState<'idle' | 'acquiring' | 'recording' | 'stopping'>('idle');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const [speechNote, setSpeechNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recognition = useRef<any>(null);
  const alive = useRef(true);
  const started = useRef(0);
  const take = useRef(0);
  const edited = useRef(false);
  useEffect(() => { alive.current = true; return () => {
    alive.current = false; recognition.current?.abort();
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
  }; }, []);
  useEffect(() => { onRecordingStateChange?.(status !== 'idle'); return () => onRecordingStateChange?.(false); }, [status, onRecordingStateChange]);
  useEffect(() => {
    if (!blob) { setUrl(''); return; }
    const next = URL.createObjectURL(blob); setUrl(next); return () => URL.revokeObjectURL(next);
  }, [blob]);
  useEffect(() => {
    if (status !== 'recording') return;
    const timer = setInterval(() => setDuration(Math.round((Date.now() - started.current) / 1000)), 500);
    return () => clearInterval(timer);
  }, [status]);
  const start = async () => {
    setError(''); setSpeechNote(''); setStatus('acquiring'); setBlob(null); setTranscript(''); setSubmitted(false); setDuration(0); edited.current = false;
    const token = ++take.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('unsupported');
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' });
      if (!alive.current || token !== take.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const mimeType = supportedMimeType(mode);
      const recording = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      recorder.current = recording;
      const chunks: Blob[] = [];
      recording.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recording.onerror = () => { if (alive.current) setError('Recording was interrupted. Review any recovered media and retry if needed.'); recognition.current?.stop(); media.getTracks().forEach(track => track.stop()); if (alive.current) setStatus('idle'); };
      recording.onstop = () => {
        media.getTracks().forEach(track => track.stop());
        if (!alive.current || token !== take.current) return;
        const result = new Blob(chunks, { type: recording.mimeType || chunks[0]?.type || '' });
        if (result.size) setBlob(result); else setError('No recording was captured. Check your device and retry.');
        setDuration(Math.round((Date.now() - started.current) / 1000)); setStatus('idle');
      };
      recording.start(); started.current = Date.now(); setStatus('recording');
      // Browser recognition is optional. Audio recording works without it.
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const speech = new SpeechRecognition(); recognition.current = speech;
          speech.continuous = true; speech.interimResults = true; speech.lang = 'en-US';
          speech.onresult = (event: any) => {
            if (!alive.current || token !== take.current || edited.current) return;
            setTranscript(Array.from(event.results as any[]).map((result: any) => result[0].transcript).join(' '));
          };
          speech.onerror = () => { if (alive.current && token === take.current) setSpeechNote('Automatic transcription is unavailable. Type or correct your transcript after recording.'); };
          speech.start();
        } catch { setSpeechNote('Automatic transcription could not start. Enter your transcript below after recording.'); }
      } else setSpeechNote('This browser does not support automatic transcription. Enter your transcript after recording.');
    } catch (err) {
      stream.current?.getTracks().forEach(track => track.stop());
      if (alive.current) { setError(mediaErrorMessage(err as Error)); setStatus('idle'); }
    }
  };
  const stop = () => { setStatus('stopping'); recognition.current?.stop(); if (recorder.current?.state === 'recording') recorder.current.stop(); };
  const download = () => {
    if (!blob) return;
    const a = document.createElement('a'); a.href = url; a.download = `interview-${mode}-${Date.now()}.${recordingExtension(blob)}`; a.click(); onDownload?.(a.download);
  };
  return <div className={`${theme.card} ${theme.text} rounded-xl p-6 border`}>
    <h3 className="font-semibold mb-3">{mode === 'video' ? 'Video' : 'Audio'} answer · {duration}s</h3>
    <p className="text-sm mb-4">Your browser may send audio to its speech service for transcription. Review the text before submitting.</p>
    {error && <p role="alert" className="mb-3">{error}</p>}
    {speechNote && <p role="status" className="mb-3">{speechNote}</p>}
    {url && (mode === 'video' ? <video src={url} controls className="w-full rounded-lg mb-4" /> : <audio src={url} controls className="w-full mb-4" />)}
    {blob && <label className="block mb-4">Review or correct transcript
      <textarea aria-label="Review or correct transcript" value={transcript} disabled={submitted} onChange={event => { edited.current = true; setTranscript(event.target.value); }} className="block w-full border rounded-lg p-3 mt-2" rows={5} />
      <span className="text-sm">An empty transcript is marked unavailable and excluded from the score average.</span>
    </label>}
    <div className="flex gap-3 flex-wrap">
      {status === 'recording' ? <button onClick={stop} className={`${theme.primary} px-4 py-2`}>Stop recording</button> : status !== 'idle' ? <p role="status">{status === 'acquiring' ? 'Waiting for device permission…' : 'Finishing recording…'}</p> : <>
        <button onClick={start} disabled={disabled || isProcessing} className={`${theme.primary} px-4 py-2`}>{blob ? 'Retake' : 'Start recording'}</button>
        {blob && <><button onClick={download} className={`${theme.secondary} px-4 py-2`}>Download</button><button disabled={submitted || isProcessing} onClick={() => { edited.current = true; recognition.current?.abort(); setSubmitted(true); onRecordingComplete(blob, transcript.trim(), duration, mode); }} className={`${theme.primary} px-4 py-2`}>{submitted ? 'Submitted' : 'Submit answer'}</button></>}
      </>}
    </div>
  </div>;
};
