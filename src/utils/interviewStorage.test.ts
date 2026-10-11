/** @jest-environment node */
const native = require('vm').runInThisContext('({ DOMException, Blob, structuredClone })');
Object.assign(globalThis, native);
require('fake-indexeddb/auto');
import { openDB, deleteDB } from 'idb';
import { listInterviews, persistInterview, removeInterview, interviewExport, recordingExtension, storageMessage } from './interviewStorage';
import { VideoInterview } from '../types';
const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) }, configurable: true });
const sample = (): VideoInterview => ({ id: 'test', topic: 'Arrays', subjectLine: 'Arrays', interviewMode: 'audio', questions: [], scores: [], totalScore: 0, averageScore: 0, startedAt: new Date(), theme: 'home', recordings: [{ questionId: 'q1', audioBlob: new Blob(['recorded bytes'], { type: 'audio/mp4' }), transcript: 'indexed access', recordingDuration: 4, timestamp: new Date(), downloadUrl: 'blob:expired' }] });
beforeEach(async () => { values.clear(); await deleteDB('interview-crack-db'); });
test('recording bytes and dates survive closing and reopening the database', async () => {
  await persistInterview(sample());
  const [loaded] = await listInterviews();
  expect(loaded.recordings[0].audioBlob).toBeInstanceOf(Blob);
  expect(await loaded.recordings[0].audioBlob!.text()).toBe('recorded bytes');
  expect(loaded.startedAt).toBeInstanceOf(Date);
  expect(loaded.recordings[0].timestamp).toBeInstanceOf(Date);
  expect(loaded.recordings[0].downloadUrl).toBeUndefined();
  expect(recordingExtension(loaded.recordings[0].audioBlob!)).toBe('mp4');
  const exported = JSON.parse(JSON.stringify(interviewExport(loaded)));
  expect(exported.recordings[0].audioBlob).toBeUndefined();
  expect(exported.recordings[0].transcript).toBe('indexed access');
});
test('metadata migration discards expired URLs, does not overwrite blobs, and deletes durably', async () => {
  const interview = sample();
  values.set('video-interviews', JSON.stringify([interview]));
  await persistInterview(interview);
  expect((await listInterviews())[0].recordings[0].audioBlob).toBeInstanceOf(Blob);
  expect(values.has('video-interviews')).toBe(false);
  await removeInterview(interview.id);
  expect(await listInterviews()).toEqual([]);
});
test('older metadata remains readable but does not pretend to contain a recording', async () => {
  values.set('video-interviews', JSON.stringify([sample()]));
  const [legacy] = await listInterviews();
  expect(legacy.recordings[0].audioBlob).toBeUndefined();
  expect(legacy.recordings[0].downloadUrl).toBeUndefined();
});
test('upserts preserve media and clear removes all records', async () => {
  const interview = sample();
  await persistInterview(interview); await persistInterview({ ...interview, topic: 'Renamed' });
  expect((await listInterviews()).map(item => item.topic)).toEqual(['Renamed']);
  await removeInterview(); expect(await listInterviews()).toEqual([]);
});
test('failed writes reject instead of claiming success', async () => {
  const db = await openDB('interview-crack-db', 1, { upgrade(db) { db.createObjectStore('video-interviews', { keyPath: 'id' }); } }); db.close();
  const spy = jest.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
  await expect(persistInterview(sample())).rejects.toMatchObject({ name: 'QuotaExceededError' });
  expect(storageMessage(new DOMException('full', 'QuotaExceededError'))).toContain('Download your recordings');
  spy.mockRestore(); expect(await listInterviews()).toEqual([]);
});

test('transaction abort rejects and rolls back the saved recording', async () => {
  await persistInterview(sample());
  const original = IDBObjectStore.prototype.put;
  const spy = jest.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function(this: IDBObjectStore, ...args: any[]) {
    const request = original.apply(this, args as [any]);
    request.addEventListener('success', () => this.transaction.abort());
    return request;
  });
  await expect(persistInterview({ ...sample(), id: 'aborted' })).rejects.toMatchObject({ name: 'AbortError' });
  spy.mockRestore();
  expect((await listInterviews()).map(item => item.id)).toEqual(['test']);
});

test('a stale legacy entry cannot resurrect deleted data when localStorage cleanup fails', async () => {
  values.set('video-interviews', JSON.stringify([sample()]));
  const spy = jest.spyOn(localStorage, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
  await listInterviews(); await removeInterview('test');
  expect(await listInterviews()).toEqual([]);
  spy.mockRestore();
});
