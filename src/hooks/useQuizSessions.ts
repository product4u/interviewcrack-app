import { useState, useEffect } from 'react';
import { QuizSession } from '../types';

const DB_NAME = 'QuizAppDB';
const DB_VERSION = 1;
const SESSIONS_STORE = 'quizSessions';
const THEME_STORE = 'theme';

function createRequiredStores(db: IDBDatabase) {
  if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
    db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains(THEME_STORE)) {
    db.createObjectStore(THEME_STORE, { keyPath: 'key' });
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      createRequiredStores(db);
    };

    const resolveOrRecreate = (db: IDBDatabase) => {
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.close();
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
          const retryRequest = indexedDB.open(DB_NAME, DB_VERSION);
          retryRequest.onupgradeneeded = (event) => {
            const newDb = (event.target as IDBOpenDBRequest).result;
            createRequiredStores(newDb);
          };
          retryRequest.onsuccess = () => resolve(retryRequest.result);
          retryRequest.onerror = () => reject(retryRequest.error);
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
      } else {
        resolve(db);
      }
    };

    request.onsuccess = () => {
      resolveOrRecreate(request.result);
    };

    request.onerror = () => reject(request.error);
  });
}

async function getQuizSessionsFromDB(): Promise<QuizSession[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as QuizSession[]);
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    console.warn('Failed to read from IndexedDB, falling back to empty array:', err);
    return [];
  }
}

async function saveQuizSessionsToDB(sessions: QuizSession[]) {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          sessions.forEach(session => store.put(session));
        };
        clearReq.onerror = () => reject(clearReq.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    console.warn('Failed to save to IndexedDB:', err);
    // Silently fail - data is already saved to localStorage
  }
}

export const useQuizSessions = () => {
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load sessions from IndexedDB on mount
  useEffect(() => {
    getQuizSessionsFromDB().then(sessions => {
      if (sessions && sessions.length > 0) {
        setQuizSessions(sessions);
      }
      setLoaded(true);
    });
  }, []);

  // Save to IndexedDB whenever sessions change
  useEffect(() => {
    if (loaded) void saveQuizSessionsToDB(quizSessions).catch(() => {});
  }, [quizSessions, loaded]);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (loaded) { try { localStorage.setItem('quizSessions', JSON.stringify(quizSessions)); } catch { /* IndexedDB is the primary session store. */ } }
  }, [quizSessions, loaded]);

  const addSession = (session: QuizSession) => {
    setQuizSessions(prev => [session, ...prev]);
  };

  const clearSessions = () => {
    setQuizSessions([]);
  };

  return {
    quizSessions,
    setQuizSessions,
    addSession,
    clearSessions
  };
};
