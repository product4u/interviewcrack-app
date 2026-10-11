import React, { useEffect, useRef } from 'react';

export function PracticeDisclaimer({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog ref={dialog} aria-labelledby="practice-disclaimer-title" onCancel={onClose}
      className="ic-card ic-text rounded-2xl p-6 shadow-xl w-full max-w-lg border"
      style={{ maxWidth: 'min(32rem, calc(100vw - 2rem))' }}>
      <h2 id="practice-disclaimer-title" className="text-2xl font-bold mb-4">Before you practise</h2>
      <p className="mb-3">This is a practice tool, not a real interview or hiring assessment. AI-generated questions, answers, and feedback may be inaccurate. Check important facts.</p>
      <p className="mb-3">The one-question room preview needs no API key. Custom AI practice uses your own Gemini key; Google receives submitted content and may apply charges or limits.</p>
      <p className="mb-5">Recording starts only when you choose it. Browser speech services may process audio online. Avoid sharing confidential information.</p>
      <button autoFocus onClick={onClose} className="ic-primary text-white rounded-lg px-5 py-3 font-semibold">Got it — let’s practise</button>
    </dialog>
  );
}
