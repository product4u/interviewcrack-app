import { useCallback, useEffect, useRef, useState } from 'react';

export type InterviewSpeaker = 'interviewer' | 'buddy';
export interface VoicePreference { voiceURI: string; rate: number; pitch: number; }
type Preferences = Record<InterviewSpeaker, VoicePreference>;
const defaults: Preferences = { interviewer: { voiceURI: '', rate: .94, pitch: .95 }, buddy: { voiceURI: '', rate: 1, pitch: 1.08 } };
const key = 'interview-room-voices-v1';

function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    const result = { ...defaults };
    (['interviewer', 'buddy'] as const).forEach(person => {
      const saved = value[person];
      result[person] = {
        voiceURI: typeof saved?.voiceURI === 'string' ? saved.voiceURI : '',
        rate: typeof saved?.rate === 'number' && Number.isFinite(saved.rate) ? Math.max(.7, Math.min(1.3, saved.rate)) : defaults[person].rate,
        pitch: typeof saved?.pitch === 'number' && Number.isFinite(saved.pitch) ? Math.max(.7, Math.min(1.3, saved.pitch)) : defaults[person].pitch,
      };
    });
    return result;
  } catch { return defaults; }
}

export function useInterviewVoice() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [preferences, setPreferences] = useState(readPreferences);
  const [speaker, setSpeaker] = useState<InterviewSpeaker | null>(null);
  const [error, setError] = useState('');
  const [wordPulse, setWordPulse] = useState(0);
  const generation = useRef(0);
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const stop = useCallback(() => {
    generation.current += 1;
    if (supported) window.speechSynthesis.cancel();
    activeUtterance.current = null;
    setSpeaker(null);
  }, [supported]);
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices().slice().sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name)));
    load(); synth.addEventListener('voiceschanged', load);
    return () => { synth.removeEventListener('voiceschanged', load); generation.current += 1; synth.cancel(); activeUtterance.current = null; };
  }, [supported]);
  const update = (person: InterviewSpeaker, patch: Partial<VoicePreference>) => {
    stop();
    setPreferences(previous => {
      const next = { ...previous, [person]: { ...previous[person], ...patch } };
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Preferences still work in memory. */ }
      return next;
    });
  };
  const speak = useCallback((text: string, person: InterviewSpeaker) => {
    stop(); setError('');
    if (!supported) return;
    const id = generation.current;
    const utterance = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g, 'See the code example on screen.').replace(/[*#`]/g, ''));
    const preference = preferences[person];
    const chosen = voices.find(voice => voice.voiceURI === preference.voiceURI);
    if (chosen) { utterance.voice = chosen; utterance.lang = chosen.lang; }
    utterance.rate = preference.rate; utterance.pitch = preference.pitch;
    utterance.onstart = utterance.onresume = () => { if (id === generation.current) setSpeaker(person); };
    utterance.onpause = () => { if (id === generation.current) setSpeaker(null); };
    utterance.onboundary = () => { if (id === generation.current) setWordPulse(pulse => pulse + 1); };
    utterance.onend = () => { if (id === generation.current) { setSpeaker(null); activeUtterance.current = null; } };
    utterance.onerror = event => {
      if (id !== generation.current) return;
      setSpeaker(null); activeUtterance.current = null;
      if (event.error !== 'canceled' && event.error !== 'interrupted') setError('This voice could not play. Try another voice or continue with the text.');
    };
    activeUtterance.current = utterance;
    try { window.speechSynthesis.speak(utterance); }
    catch { activeUtterance.current = null; setSpeaker(null); setError('Voice playback is unavailable. You can continue with the text.'); }
  }, [preferences, voices, stop, supported]);
  return { supported, voices, preferences, update, speak, stop, speaker, wordPulse, error };
}
