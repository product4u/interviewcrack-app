import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-hook-speech-to-text', () => ({ __esModule: true, default: () => ({ results: [] }) }));
jest.mock('./components/VideoInterviewView', () => ({ VideoInterviewView: ({ questions, onBack }: any) => <div><p>Preview questions: {questions.length}</p><button onClick={onBack}>Leave preview</button></div> }));

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  window.history.replaceState({}, '', '/interviewcrack-app/app/?practice=1');
  HTMLDialogElement.prototype.showModal = jest.fn();
  HTMLDialogElement.prototype.close = jest.fn();
});

test('practice entry shows preparation and disclaimer; preview preserves topic and returns to preparation', () => {
  render(<App />);
  expect(screen.getByText('Prepare your interview room')).toBeTruthy();
  expect(screen.getByText('Before you practise')).toBeTruthy();
  fireEvent.click(screen.getByText('Got it — let’s practise'));
  const topic = screen.getByRole('textbox', { name: 'Interview topic or study notes' }) as HTMLTextAreaElement;
  expect(topic.value).toBe('');
  expect(topic.placeholder).toContain('RAG');
  fireEvent.change(topic, { target: { value: 'Python for AI' } });
  fireEvent.click(screen.getByText('Preview 3D room · no API key needed'));
  expect(screen.getByText('Preview questions: 1')).toBeTruthy();
  fireEvent.click(screen.getByText('Got it — let’s practise'));
  fireEvent.click(screen.getByText('Leave preview'));
  expect(screen.getByText('Prepare your interview room')).toBeTruthy();
  expect((screen.getByRole('textbox', { name: 'Interview topic or study notes' }) as HTMLTextAreaElement).value).toBe('Python for AI');
  const home = screen.getByRole('link', { name: 'InterviewCrack home' });
  expect(new URL(home.getAttribute('href')!, window.location.href).pathname).toBe('/interviewcrack-app/');
});
