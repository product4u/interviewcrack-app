import { openDB } from 'idb';
import { VideoInterview } from '../types';

const STORE = 'video-interviews';
const database = () => openDB('interview-crack-db', 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
  }
});
export const storageMessage = (error: unknown) => error instanceof DOMException && error.name === 'QuotaExceededError'
  ? 'Browser storage is full. Download your recordings now, then delete older sessions and retry saving.'
  : 'Browser storage is unavailable. Keep this page open and download your recordings before leaving. You can retry saving.';

export function restoreInterview(value: VideoInterview): VideoInterview {
  return { ...value, startedAt: new Date(value.startedAt), completedAt: value.completedAt ? new Date(value.completedAt) : undefined,
    recordings: (value.recordings || []).map(rec => ({ ...rec, timestamp: new Date(rec.timestamp),
      videoBlob: rec.videoBlob instanceof Blob ? rec.videoBlob : undefined,
      audioBlob: rec.audioBlob instanceof Blob ? rec.audioBlob : undefined,
      downloadUrl: undefined })) };
}
export async function listInterviews(): Promise<VideoInterview[]> {
  const db = await database();
  try {
    // Migrate metadata from the old JSON store. Expired blob URLs cannot be recovered.
    let legacy: VideoInterview[] = [];
    try { if (!(await db.get('settings', 'legacyMigrated'))) { const data = JSON.parse(localStorage.getItem(STORE) || '[]'); if (Array.isArray(data)) legacy = data; } } catch { /* Storage can be disabled. */ }
    const tx = db.transaction([STORE, 'settings'], 'readwrite');
    const store = tx.objectStore(STORE);
    for (const item of legacy) {
      if (item.id && Array.isArray(item.questions) && !(await store.get(item.id))) await store.put(restoreInterview(item));
    }
    await tx.objectStore('settings').put(true, 'legacyMigrated');
    await tx.done;
    try { localStorage.removeItem(STORE); } catch { /* IndexedDB remains authoritative. */ }
    return (await db.getAll(STORE)).map(restoreInterview).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  } finally { db.close(); }
}
export async function persistInterview(interview: VideoInterview): Promise<void> {
  const db = await database();
  try { const tx = db.transaction(STORE, 'readwrite'); await tx.store.put(restoreInterview(interview)); await tx.done; }
  finally { db.close(); }
}
export async function removeInterview(id?: string): Promise<void> {
  // Finish migration before deleting so legacy metadata cannot resurrect a deleted session.
  await listInterviews();
  const db = await database();
  try { const tx = db.transaction(STORE, 'readwrite'); if (id) await tx.store.delete(id); else await tx.store.clear(); await tx.done; }
  finally { db.close(); }
}
export function interviewExport(interview: VideoInterview) {
  return { ...interview, exportNote: 'Results only. Download recordings separately.', recordings: interview.recordings.map(({ videoBlob, audioBlob, downloadUrl, ...rec }) => rec) };
}
export function recordingExtension(blob: Blob): string {
  if (blob.type.includes('mp4')) return 'mp4';
  if (blob.type.includes('ogg')) return 'ogg';
  if (blob.type.includes('wav')) return 'wav';
  return 'webm';
}
