import { act, renderHook, waitFor } from '@testing-library/react';
import { useApiKey } from './useApiKey';
import { useTheme } from './useTheme';
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => jest.restoreAllMocks());
test('key can move to session-only storage and be removed without history loss', async () => {
  localStorage.setItem('quizSessions', 'history');
  const { result, unmount } = renderHook(() => useApiKey());
  act(() => result.current.handleSaveApiKey('test-key'));
  expect(localStorage.getItem('geminiApiKey')).toBe('test-key');
  act(() => result.current.handleSaveApiKey('session-key', true));
  expect(localStorage.getItem('geminiApiKey')).toBeNull();
  unmount();
  const next = renderHook(() => useApiKey());
  await waitFor(() => expect(next.result.current.apiKey).toBe('session-key'));
  act(() => next.result.current.clearApiKey());
  expect(sessionStorage.getItem('geminiApiKey')).toBeNull();
  expect(localStorage.getItem('quizSessions')).toBe('history');
});
test('storage failure leaves key usable in memory and reports the problem', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
  const { result } = renderHook(() => useApiKey());
  act(() => result.current.handleSaveApiKey('temporary'));
  expect(result.current.apiKey).toBe('temporary');
  expect(result.current.storageError).toContain('storage could not be updated');
});
test('saved theme is loaded before any write and updates immediately without refresh', () => {
  localStorage.setItem('currentTheme', 'ocean');
  const { result, unmount } = renderHook(() => useTheme());
  expect(result.current.currentTheme).toBe('ocean');
  act(() => result.current.setCurrentTheme('nature'));
  expect(document.documentElement.dataset.theme).toBe('nature');
  unmount();
  expect(renderHook(() => useTheme()).result.current.currentTheme).toBe('nature');
});
test('unavailable theme storage does not prevent selecting a theme', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('disabled'); });
  const { result } = renderHook(() => useTheme());
  act(() => result.current.setCurrentTheme('sunset'));
  expect(result.current.currentTheme).toBe('sunset');
  expect(result.current.themeStorageError).toContain('may reset');
});
