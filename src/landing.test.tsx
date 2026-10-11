import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LandingRoom } from './landing';

jest.mock('./components/InterviewRoom3D', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="preview-room" data-entered={String(props.entered)} data-buddy={String(props.buddyOpen)} data-paused={String(props.motionPaused)} />,
}));

test('preview takes a visitor into the room, to the buddy, and back to their answer', () => {
  render(<LandingRoom />);
  fireEvent.click(screen.getByRole('button', { name: /Take my seat/ }));
  expect(screen.getByTestId('preview-room').getAttribute('data-entered')).toBe('true');
  expect(screen.getByRole('heading', { name: 'Tell me about yourself.' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Ask Sam for a hint/ }));
  expect(screen.getByTestId('preview-room').getAttribute('data-buddy')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: /I’m ready to answer/ }));
  expect(screen.getByTestId('preview-room').getAttribute('data-buddy')).toBe('false');
  expect(screen.getByText('This preview doesn’t record you.')).toBeTruthy();
});

test('topic selection resets the scene to Alex and motion can be paused', () => {
  render(<LandingRoom />);
  fireEvent.click(screen.getByRole('button', { name: /Ask your buddy/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Frontend', exact: true }));
  expect(screen.getByRole('heading', { name: 'How would you make a slow website feel faster?' })).toBeTruthy();
  expect(screen.getByTestId('preview-room').getAttribute('data-buddy')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }));
  expect(screen.getByTestId('preview-room').getAttribute('data-paused')).toBe('true');
});
