import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import InterviewRoom3D from './components/InterviewRoom3D';

const samples = [
  { role: 'First interview', question: 'Tell me about yourself.', hint: 'Start with where you are now. Add one experience you’re proud of, then connect it to the role.', answer: 'Present → one relevant experience → why this opportunity.' },
  { role: 'Frontend', question: 'How would you make a slow website feel faster?', hint: 'Start by measuring. Think about what loads first, what can wait, and what the user sees while waiting.', answer: 'Measure → prioritise visible content → reduce work → verify the improvement.' },
  { role: 'Behavioral', question: 'Tell me about a time something didn’t go to plan.', hint: 'Pick one real moment. Describe your responsibility, the action you took, and what you learned.', answer: 'Situation → task → action → result → what you would do differently.' },
];
const chapters = ['Take your seat', 'Meet Alex', 'Ask your buddy', 'Your turn'];

export function LandingRoom() {
  const [chapter, setChapter] = useState(0);
  const [topic, setTopic] = useState(0);
  const [look, setLook] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speaker, setSpeaker] = useState<'interviewer' | 'buddy' | null>(null);
  const [voiceNote, setVoiceNote] = useState('');
  const speechToken = useRef(0);
  const drag = useRef<number | null>(null);
  const sample = samples[topic];
  const buddy = chapter === 2;
  const stop = () => {
    speechToken.current++;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaker(null);
  };
  useEffect(() => () => { speechToken.current++; if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);
  const selectChapter = (value: number) => { stop(); setChapter(value); setLook(0); setVoiceNote(''); };
  const listen = () => {
    if (speaker) { stop(); return; }
    if (!('speechSynthesis' in window)) { setVoiceNote('Voice is unavailable here. The full dialogue is shown below.'); return; }
    const token = ++speechToken.current;
    const utterance = new SpeechSynthesisUtterance(buddy ? sample.hint : sample.question);
    utterance.rate = .92;
    utterance.onstart = () => { if (token === speechToken.current) setSpeaker(buddy ? 'buddy' : 'interviewer'); };
    utterance.onend = () => { if (token === speechToken.current) setSpeaker(null); };
    utterance.onerror = () => { if (token === speechToken.current) { setSpeaker(null); setVoiceNote('Voice could not play. You can still explore using the text.'); } };
    window.speechSynthesis.speak(utterance);
  };
  return <>
    <div className="intro-line"><div><span className="eyebrow">A LITTLE PRACTICE. A DIFFERENT FEELING.</span><h1>Your next chapter<br />starts <em>in this room.</em></h1></div><div className="intro-action"><p>Meet your interviewer.<br />Find your words. Bring your buddy.</p><a className="button primary" href="./app/?practice=1">Start my practice <span aria-hidden="true">↗</span></a><span className="micro">No account. No subscription.</span></div></div>
    <section className={`experience chapter-${chapter}`} aria-label="Interactive 3D interview preview">
      <div className="scene-top"><span><i className="live-dot" /> {buddy ? 'SAM’S CORNER' : 'THE INTERVIEW ROOM'}</span><span>LIVE 3D PREVIEW <span className="desktop-only">/ NO KEY NEEDED</span></span></div>
      <div className="stage" onPointerDown={event => { if ((event.target as HTMLElement).tagName === 'CANVAS') { drag.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); } }} onPointerMove={event => { if (drag.current !== null) { setLook(value => Math.max(-1, Math.min(1, value + (event.clientX - drag.current!) / 180))); drag.current = event.clientX; } }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <InterviewRoom3D entered={chapter > 0} speaker={speaker} buddyOpen={buddy} recording={false} look={look} wordPulse={0} motionPaused={paused} fallbackText="Your device cannot show the 3D room. You can still explore the sample question and buddy guidance with the controls below." />
        <div className="scene-caption"><span>{buddy ? '02 / A MOMENT WITH SAM' : chapter === 0 ? 'YOUR SEAT IS WAITING' : '01 / ACROSS THE TABLE'}</span><strong>{buddy ? 'You don’t have to figure it out alone.' : chapter === 0 ? 'Come on in.' : chapter === 3 ? 'Take a breath. You’ve got this.' : 'A question. A moment. Your answer.'}</strong></div>
        <div className="scene-tools"><button onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? 'Resume motion' : 'Pause motion'}</button><button onClick={() => setLook(value => Math.max(-1, value - .4))} disabled={buddy || chapter === 0} aria-label="Look left">←</button><button onClick={() => setLook(0)} disabled={buddy || chapter === 0}>Center</button><button onClick={() => setLook(value => Math.min(1, value + .4))} disabled={buddy || chapter === 0} aria-label="Look right">→</button></div>
        {chapter === 0 && <button className="enter-button" onClick={() => selectChapter(1)}><span aria-hidden="true">↗</span> Take my seat <small>Explore the room</small></button>}
      </div>
      <div className="experience-bottom">
        <nav className="chapters" aria-label="Preview chapters">{chapters.map((label, index) => <button key={label} aria-current={chapter === index ? 'step' : undefined} onClick={() => selectChapter(index)}><span>0{index + 1}</span>{label}<span className="chapter-dot" /></button>)}</nav>
        <div className="dialogue" aria-live="polite"><div><span className="eyebrow">{buddy ? 'SAM / YOUR BUDDY' : chapter === 3 ? 'YOU / AT YOUR OWN PACE' : chapter === 0 ? 'A QUICK LOOK BEFORE YOU BEGIN' : 'ALEX / YOUR INTERVIEWER'}</span><h2>{chapter === 0 ? 'Try the experience. No setup needed.' : buddy ? 'Let’s find your starting point.' : chapter === 3 ? 'Say it your way.' : sample.question}</h2><p>{chapter === 0 ? 'Take a seat, try a question, then ask Sam for a little help.' : buddy ? sample.hint : chapter === 3 ? sample.answer : 'No perfect answer needed. Think out loud, or ask your buddy for a hint.'}</p>{voiceNote && <p className="micro">{voiceNote}</p>}</div><div className="dialogue-actions">{chapter === 0 ? <button className="button primary" onClick={() => selectChapter(1)}>Let’s try it ↗</button> : chapter === 3 ? <><a className="button primary" href="./app/?practice=1">Practise my own answers ↗</a><span className="micro">This preview doesn’t record you.</span></> : <><button className="button primary" onClick={() => selectChapter(buddy ? 3 : 2)}>{buddy ? 'I’m ready to answer ↗' : 'Ask Sam for a hint ↗'}</button><button className="text-button" onClick={listen}>{speaker ? '■ Stop voice' : '♪ Hear ' + (buddy ? 'Sam’s hint' : 'the question')}</button><span className="micro">Optional voice uses your browser’s speech service.</span></>}</div></div>
        <div className="topic-picker"><span>MAKE IT YOURS</span>{samples.map((item, index) => <button key={item.role} aria-pressed={topic === index} onClick={() => { stop(); setTopic(index); setChapter(1); setLook(0); setVoiceNote(''); }}>{item.role}</button>)}<span className="micro">Sample questions · Drag the room to look around</span></div>
      </div>
    </section>
  </>;
}

const host = document.getElementById('landing-room');
if (host) createRoot(host).render(<LandingRoom />);
