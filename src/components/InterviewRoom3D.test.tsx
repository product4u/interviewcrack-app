import React from 'react';
import { render, screen } from '@testing-library/react';
import InterviewRoom3D from './InterviewRoom3D';

jest.mock('three', () => ({
  ...jest.requireActual('three'),
  WebGLRenderer: class { constructor() { throw new Error('WebGL unavailable'); } },
}));

test('unsupported graphics gracefully retain an accessible interview fallback', () => {
  render(<InterviewRoom3D entered speaker={null} buddyOpen={false} recording={false} look={0} wordPulse={0} />);
  expect(screen.getByText(/3D is unavailable on this device/)).toBeTruthy();
  expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Alex is seated');
});
