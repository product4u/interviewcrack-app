import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VirtualInterviewScene } from './VirtualInterviewScene';
import { VideoQuestion } from '../types';

jest.mock('./InterviewRoom3D', () => ({ __esModule: true, default: ({ speaker, buddyOpen }: any) => <div data-testid="room" data-speaker={speaker || ''} data-buddy={String(buddyOpen)} /> }));
const question: VideoQuestion = { id: 'one', question: 'Explain arrays.', shortAnswer: 'Contiguous storage.', expectedAnswer: 'Example: ```js\nconst a = [1];\n```', keyWords: ['storage'], buddyHint: 'Think about layout.', buddyExplanation: 'Like numbered seats.' };
const props = { question, index: 0, total: 2, answered: false, recording: false };
let utterance: any;
let voiceListener: () => void;
const voices = [{ voiceURI: 'alex-local', name: 'Alex Voice', lang: 'en-US', localService: true }, { voiceURI: 'sam-local', name: 'Sam Voice', lang: 'en-GB', localService: true }];
const originalSpeech = Object.getOwnPropertyDescriptor(window, 'speechSynthesis');
const originalUtterance = Object.getOwnPropertyDescriptor(window, 'SpeechSynthesisUtterance');
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel: jest.fn(), getVoices: () => voices, addEventListener: (_: string, callback: () => void) => { voiceListener = callback; }, removeEventListener: jest.fn(), speak: jest.fn((value: any) => { utterance = value; }) } });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class { constructor(public text: string) {} } });
});
afterEach(() => {
  if (originalSpeech) Object.defineProperty(window, 'speechSynthesis', originalSpeech); else delete (window as any).speechSynthesis;
  if (originalUtterance) Object.defineProperty(window, 'SpeechSynthesisUtterance', originalUtterance); else delete (window as any).SpeechSynthesisUtterance;
});

test('avatar follows actual speech lifecycle and ignores stale callbacks', async () => {
  const { rerender } = render(<VirtualInterviewScene {...props} />);
  const room = await screen.findByTestId('room');
  fireEvent.click(screen.getByText('Enter the room'));
  expect(utterance.text).toContain('Welcome.');
  expect(room.getAttribute('data-speaker')).toBe('');
  act(() => utterance.onstart());
  expect(room.getAttribute('data-speaker')).toBe('interviewer');
  act(() => utterance.onpause());
  expect(room.getAttribute('data-speaker')).toBe('');
  act(() => utterance.onresume());
  expect(room.getAttribute('data-speaker')).toBe('interviewer');
  act(() => utterance.onend());
  expect(room.getAttribute('data-speaker')).toBe('');
  fireEvent.click(screen.getByText('Hear question'));
  act(() => utterance.onstart());
  fireEvent.click(screen.getByText('Stop voice'));
  act(() => utterance.onresume());
  expect(room.getAttribute('data-speaker')).toBe('');
  fireEvent.click(screen.getByText('Hear question'));
  act(() => utterance.onstart());
  rerender(<VirtualInterviewScene {...props} recording />);
  expect(room.getAttribute('data-speaker')).toBe('');
});

test('buddy activates only by button and returns camera focus on close', async () => {
  render(<VirtualInterviewScene {...props} />);
  const room = await screen.findByTestId('room');
  expect(screen.queryByLabelText('Private buddy help')).toBeNull();
  fireEvent.click(screen.getByText('Enter the room'));
  expect(screen.queryByLabelText('Private buddy help')).toBeNull();
  fireEvent.click(screen.getByText('Ask my buddy'));
  expect(room.getAttribute('data-buddy')).toBe('true');
  expect(screen.getByText('Think about layout.')).toBeTruthy();
  fireEvent.click(screen.getByText('Explain it'));
  expect(screen.getByText('Like numbered seats.')).toBeTruthy();
  fireEvent.click(screen.getByText('I’m ready to answer'));
  expect(screen.queryByLabelText('Private buddy help')).toBeNull();
  expect(room.getAttribute('data-buddy')).toBe('false');
});

test('next question resets help and reads the new question', async () => {
  const { rerender } = render(<VirtualInterviewScene {...props} />);
  await screen.findByTestId('room');
  fireEvent.click(screen.getByText('Enter the room'));
  fireEvent.click(screen.getByText('Ask my buddy'));
  rerender(<VirtualInterviewScene {...props} question={{ ...question, id: 'two', question: 'Explain a linked list.' }} index={1} />);
  expect(screen.queryByLabelText('Private buddy help')).toBeNull();
  await waitFor(() => expect(utterance.text).toContain('Explain a linked list.'));
  fireEvent.click(screen.getByText('Ask my buddy'));
  rerender(<VirtualInterviewScene {...props} question={{ ...question, id: 'two' }} recording />);
  expect(screen.queryByLabelText('Private buddy help')).toBeNull();
  expect((screen.getByText('Ask my buddy').closest('button') as HTMLButtonElement).disabled).toBe(true);
});

test('selected voices and delivery are used, persisted, and refreshed', async () => {
  const { unmount } = render(<VirtualInterviewScene {...props} />);
  await screen.findByTestId('room');
  fireEvent.click(screen.getByLabelText('Voice settings'));
  fireEvent.change(document.getElementById('interviewer-voice')!, { target: { value: 'alex-local' } });
  fireEvent.change(document.getElementById('buddy-voice')!, { target: { value: 'sam-local' } });
  fireEvent.change(screen.getByLabelText('buddy speed'), { target: { value: '1.2' } });
  fireEvent.click(screen.getByText('Preview Sam'));
  expect(utterance.voice.voiceURI).toBe('sam-local');
  expect(utterance.rate).toBe(1.2);
  act(() => voiceListener());
  expect((document.getElementById('buddy-voice') as HTMLSelectElement).value).toBe('sam-local');
  unmount();
  render(<VirtualInterviewScene {...props} />);
  await screen.findByTestId('room');
  fireEvent.click(screen.getByLabelText('Voice settings'));
  expect((document.getElementById('interviewer-voice') as HTMLSelectElement).value).toBe('alex-local');
  expect((screen.getByLabelText('buddy speed') as HTMLInputElement).value).toBe('1.2');
});

test('speech errors leave the scene usable and stop avatar speech', async () => {
  render(<VirtualInterviewScene {...props} />);
  const room = await screen.findByTestId('room');
  fireEvent.click(screen.getByText('Enter the room'));
  act(() => { utterance.onstart(); utterance.onerror({ error: 'voice-unavailable' }); });
  expect(room.getAttribute('data-speaker')).toBe('');
  expect(screen.getByRole('status').textContent).toContain('Try another voice');
  fireEvent.click(screen.getByText('Ask my buddy'));
  expect(screen.getByText('Think about layout.')).toBeTruthy();
});

test('text and buddy help remain usable without speech synthesis', async () => {
  delete (window as any).speechSynthesis;
  render(<VirtualInterviewScene {...props} />);
  await screen.findByTestId('room');
  fireEvent.click(screen.getByText('Enter the room'));
  expect((screen.getByText('Hear question').closest('button') as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByText('Ask my buddy'));
  expect(screen.getByText('Think about layout.')).toBeTruthy();
});
