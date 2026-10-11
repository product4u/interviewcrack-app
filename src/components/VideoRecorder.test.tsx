import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { VideoRecorder, supportedMimeType, mediaErrorMessage } from './VideoRecorder';
import { themes } from '../constants/themes';
const stopTrack = jest.fn();
class Recorder {
  static isTypeSupported = (type: string) => type === 'audio/mp4';
  state = 'inactive'; mimeType = 'audio/mp4'; ondataavailable: any; onstop: any;
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.ondataavailable({ data: new Blob(['audio'], { type: this.mimeType }) }); this.onstop(); }
}
beforeEach(() => {
  Object.defineProperty(window, 'MediaRecorder', { configurable: true, value: Recorder });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) } });
  URL.createObjectURL = jest.fn(() => 'blob:preview'); URL.revokeObjectURL = jest.fn();
});
afterEach(() => jest.clearAllMocks());
test('chooses supported MP4 and submits the manually corrected transcript', async () => {
  const complete = jest.fn();
  const { unmount } = render(<VideoRecorder theme={themes.home} mode="audio" onRecordingComplete={complete} />);
  expect(supportedMimeType('audio')).toBe('audio/mp4');
  fireEvent.click(screen.getByText('Start recording'));
  await screen.findByText('Stop recording');
  fireEvent.click(screen.getByText('Stop recording'));
  fireEvent.change(await screen.findByLabelText('Review or correct transcript'), { target: { value: 'Corrected answer' } });
  fireEvent.click(screen.getByText('Submit answer'));
  expect(complete).toHaveBeenCalledWith(expect.any(Blob), 'Corrected answer', expect.any(Number), 'audio');
  unmount(); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview'); expect(stopTrack).toHaveBeenCalled();
});
test('permission rejection gives recovery guidance and allows retry', async () => {
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
  render(<VideoRecorder theme={themes.home} mode="video" onRecordingComplete={jest.fn()} />);
  fireEvent.click(screen.getByText('Start recording'));
  expect((await screen.findByRole('alert')).textContent).toContain('site settings');
  expect((screen.getByText('Start recording') as HTMLButtonElement).disabled).toBe(false);
  expect(mediaErrorMessage({ name: 'NotReadableError' })).toContain('busy');
});
test('late permission grant after unmount stops every track', async () => {
  let grant: (value: any) => void = () => {};
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockReturnValue(new Promise(resolve => { grant = resolve; }));
  const { unmount } = render(<VideoRecorder theme={themes.home} mode="audio" onRecordingComplete={jest.fn()} />);
  fireEvent.click(screen.getByText('Start recording')); unmount();
  await act(async () => grant({ getTracks: () => [{ stop: stopTrack }] }));
  expect(stopTrack).toHaveBeenCalled();
});
