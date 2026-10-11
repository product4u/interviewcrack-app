import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Users, ArrowRight, X, Settings, ChevronLeft, ChevronRight, Maximize, Minimize, RotateCcw } from 'lucide-react';
import { VideoQuestion } from '../types';
import { useInterviewVoice, InterviewSpeaker } from '../hooks/useInterviewVoice';
import './VirtualInterviewScene.css';

const InterviewRoom3D = lazy(() => import('./InterviewRoom3D'));

export const InterviewText: React.FC<{ text: string }> = ({ text }) => <>
  {text.split(/```/).map((part, index) => index % 2
    ? <pre key={index}><code>{part.replace(/^\w+\n/, '').trim()}</code></pre>
    : <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>)}
</>;

interface Props {
  question: VideoQuestion;
  index: number;
  total: number;
  answered: boolean;
  recording: boolean;
  onEnter?: () => void;
}

export const VirtualInterviewScene: React.FC<Props> = ({ question, index, total, answered, recording, onEnter }) => {
  const [entered, setEntered] = useState(false);
  const [buddyOpen, setBuddyOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [look, setLook] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const voice = useInterviewVoice();
  const { speak, stop, speaker, supported } = voice;
  const speakRef = useRef(speak); speakRef.current = speak;
  const previousQuestion = useRef(question.id);
  const recordingRef = useRef(recording); recordingRef.current = recording;
  const buddyButton = useRef<HTMLButtonElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (previousQuestion.current === question.id) return;
    setBuddyOpen(false); setStep(0); setLook(0); stop();
    previousQuestion.current = question.id;
    if (!entered) return;
    const timer = window.setTimeout(() => { if (!recordingRef.current) speakRef.current(`Let's move on. ${question.question}`, 'interviewer'); }, 650);
    return () => window.clearTimeout(timer);
  }, [question.id, question.question, entered, stop]);
  useEffect(() => {
    if (recording) { stop(); setBuddyOpen(false); setSettingsOpen(false); setLook(0); }
  }, [recording, stop]);
  // Keep camera/dialogue focus coherent when voice preview switches characters.
  const help = [
    question.buddyHint || 'Hey, take a breath. Start with what the concept means, then think of one practical example and a trade-off.',
    question.buddyExplanation || `Let’s break it down together.\n\n${question.expectedAnswer}\n\nTry explaining the idea back in your own words.`,
    `You could start like this:\n\n${question.shortAnswer || question.expectedAnswer}\n\nNow make it yours. Add an example from your experience, then return to the interviewer.`
  ][step];
  const closeBuddy = () => { stop(); setBuddyOpen(false); setLook(0); buddyButton.current?.focus(); };
  const closeSettings = () => { stop(); setSettingsOpen(false); settingsButton.current?.focus(); };
  const enterRoom = () => {
    setEntered(true); onEnter?.();
    // Start from the click gesture so browsers allow speech playback.
    speak(`Welcome. I'm Alex. Make yourself comfortable. Take your time and talk me through your thinking. ${question.question}`, 'interviewer');
  };

  return <section className={`virtual-world ${expanded ? 'world-expanded' : ''}`} aria-label="Virtual interview room" onKeyDown={event => {
    if (event.key === 'Escape') { if (settingsOpen) closeSettings(); else if (buddyOpen) closeBuddy(); else setExpanded(false); }
  }}>
    <div className="world-topbar"><span className="world-brand">◈ <strong>{buddyOpen || speaker === 'buddy' ? 'SAM’S CORNER' : 'YOUR DREAM COMPANY'}</strong><span className="world-divider" /> INTERVIEW EXPERIENCE</span><span className="world-session"><i /> {entered ? 'Session in progress' : 'Your room is ready'} <span className="world-count">{index + 1} / {total}</span></span></div>
    <div className={`world-stage ${entered ? 'world-entered' : ''}`}>
      <Suspense fallback={<div className="room-loading"><span>◈</span>Preparing your interview room…</div>}>
        <InterviewRoom3D entered={entered} speaker={speaker} buddyOpen={buddyOpen || speaker === 'buddy'} recording={recording} look={look} wordPulse={voice.wordPulse} />
      </Suspense>
      <div className="world-location"><span>{buddyOpen || speaker === 'buddy' ? 'SAM’S HOME' : 'ROOM 04'}</span><small>{buddyOpen || speaker === 'buddy' ? 'A space to recharge' : 'Engineering & growth'}</small></div>
      <div className="world-scene-tools">
        <button ref={settingsButton} aria-label="Voice settings" aria-expanded={settingsOpen} aria-controls="room-voice-settings" disabled={recording} onClick={() => settingsOpen ? closeSettings() : (() => { stop(); setBuddyOpen(false); setSettingsOpen(true); })()}><Settings size={17} /><span>Voices</span></button>
        <button aria-label={expanded ? 'Compact room view' : 'Expand room view'} aria-pressed={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? <Minimize size={17} /> : <Maximize size={17} />}</button>
      </div>
      {!entered ? <div className="world-arrival">
        <span className="world-eyebrow">A NEW CHAPTER STARTS HERE</span>
        <h2>Your seat.<br />Your moment.</h2>
        <p>Meet Alex, your interviewer.<br />Sam’s a click away if you need a hand.<br />Breathe. You’re here to practise.</p>
        <button className="world-primary" onClick={enterRoom}>Enter the room <ArrowRight size={18} /></button>
        <span className="world-arrival-note">Headphones on. Distractions off. Be yourself.</span>
      </div> : <>
        <div className="world-person"><span className={speaker ? 'world-speaking-dot' : ''} /><div><strong>{buddyOpen || speaker === 'buddy' ? 'Sam' : 'Alex Morgan'}</strong><small>{buddyOpen || speaker === 'buddy' ? 'Your buddy · at home' : recording ? 'Listening to you' : 'Engineering interviewer'}</small></div></div>
        <div className="world-camera" aria-label="Look around the room"><button aria-label="Look left" disabled={buddyOpen} onClick={() => setLook(value => Math.max(-1, value - .5))}><ChevronLeft size={16} /></button><button onClick={() => setLook(0)} aria-label="Face interviewer"><RotateCcw size={13} />Look around</button><button aria-label="Look right" disabled={buddyOpen} onClick={() => setLook(value => Math.min(1, value + .5))}><ChevronRight size={16} /></button></div>
      </>}
      {settingsOpen && <aside id="room-voice-settings" className="world-voice-settings" aria-label="Voice settings panel">
        <div className="world-buddy-heading"><div><span className="world-eyebrow">MAKE IT YOURS</span><h3>Voices & delivery</h3></div><button aria-label="Close voice settings" onClick={closeSettings}><X size={18} /></button></div>
        <p>Choose from the voices available on this device. Your preferences are saved.</p>
        {(['interviewer', 'buddy'] as InterviewSpeaker[]).map(person => <fieldset key={person} disabled={!supported || recording}>
          <legend>{person === 'interviewer' ? 'Alex · Interviewer' : 'Sam · Buddy'}</legend>
          <label htmlFor={`${person}-voice`}>Voice</label>
          <select id={`${person}-voice`} value={voice.voices.some(item => item.voiceURI === voice.preferences[person].voiceURI) ? voice.preferences[person].voiceURI : ''} onChange={event => voice.update(person, { voiceURI: event.target.value })}>
            <option value="">Device default</option>
            {voice.voices.map(item => <option key={item.voiceURI} value={item.voiceURI}>{item.name} · {item.lang}{item.localService ? ' · local' : ''}</option>)}
          </select>
          <div className="world-sliders"><label>Speed <output>{voice.preferences[person].rate.toFixed(2)}×</output><input aria-label={`${person} speed`} type="range" min="0.7" max="1.3" step="0.01" value={voice.preferences[person].rate} onChange={event => voice.update(person, { rate: Number(event.target.value) })} /></label><label>Pitch <output>{voice.preferences[person].pitch.toFixed(2)}</output><input aria-label={`${person} pitch`} type="range" min="0.7" max="1.3" step="0.01" value={voice.preferences[person].pitch} onChange={event => voice.update(person, { pitch: Number(event.target.value) })} /></label></div>
          <button onClick={() => speak(person === 'interviewer' ? "Hi, I'm Alex. Take your time. I'd love to hear how you think." : "Hey, I'm Sam. You've got this. We can figure it out together.", person)}><Volume2 size={14} />Preview {person === 'interviewer' ? 'Alex' : 'Sam'}</button>
        </fieldset>)}
        <button className="world-settings-stop" disabled={!speaker} onClick={stop}><VolumeX size={14} />Stop preview</button>
        {!supported && <p>Speech playback is unavailable in this browser. The interview works with text.</p>}
      </aside>}
    {buddyOpen && <aside id="interview-buddy" className="world-buddy" aria-label="Private buddy help">
      <div className="world-buddy-intro"><span className="world-buddy-icon">S</span><h3>Hey, you’ve got this.</h3><p>No rush. Let’s work through it together.</p><small>Only here when you ask.</small></div>
      <div className="world-buddy-content"><div className="world-buddy-heading"><span className="world-eyebrow">A LITTLE HELP, BETWEEN FRIENDS</span><button aria-label="Close buddy" onClick={closeBuddy}><X size={18} /></button></div><div className="world-tabs" aria-label="Help level">{['Give me a hint', 'Explain it', 'Help me phrase it'].map((label, value) => <button key={label} aria-pressed={step === value} onClick={() => { stop(); setStep(value); }}>{label}</button>)}</div><div className="world-help" aria-live="polite"><InterviewText text={help} /></div><div className="world-buddy-actions"><button disabled={!supported} onClick={() => speaker === 'buddy' ? stop() : speak(help, 'buddy')}>{speaker === 'buddy' ? <VolumeX size={16} /> : <Volume2 size={16} />}{speaker === 'buddy' ? 'Stop' : 'Listen'}</button><button className="world-primary" onClick={closeBuddy}>I’m ready to answer <ArrowRight size={16} /></button></div></div>
    </aside>}
    </div>
    {entered && <div className="world-dialogue" aria-live="polite"><div className="world-dialogue-label"><span className="world-eyebrow">{buddyOpen ? 'PRIVATE ASIDE · INTERVIEW ON HOLD' : recording ? 'YOUR TURN' : answered ? 'RESPONSE SAVED' : 'ALEX ASKS'}</span><span>QUESTION {String(index + 1).padStart(2, '0')}</span></div><h3><InterviewText text={question.question} /></h3><p className="world-narrative">{buddyOpen ? 'Take a moment with Sam. Return whenever you feel ready.' : recording ? 'I’m listening. Walk me through your thinking.' : answered ? 'Thank you. Review your response, then we’ll move on.' : 'Take your time. A clear thought process matters more than a perfect answer.'}</p></div>}
    <div className="world-controls">
      <span className="world-presence"><i className={speaker || recording ? 'world-speaking-dot' : ''} />{recording ? 'Listening to your answer' : speaker ? `${speaker === 'buddy' ? 'Sam' : 'Alex'} is speaking` : 'A little practice. A little more confidence.'}</span>
      <div><button disabled={!supported || recording || !entered} onClick={() => { if (speaker) stop(); else { setBuddyOpen(false); setLook(0); speak(question.question, 'interviewer'); } }}>{speaker ? <VolumeX size={17} /> : <Volume2 size={17} />}{speaker ? 'Stop voice' : 'Hear question'}</button><button ref={buddyButton} className="world-buddy-button" disabled={recording || !entered} aria-expanded={buddyOpen} aria-controls="interview-buddy" onClick={() => { if (buddyOpen) closeBuddy(); else { stop(); setBuddyOpen(true); setSettingsOpen(false); setLook(0); } }}><Users size={17} />Ask my buddy</button></div>
    </div>
    {(!supported || voice.error) && <p className="world-support" role="status">{voice.error || 'Voice playback is unavailable in this browser. All dialogue is available as text.'}</p>}

  </section>;
};
