/**
 * IndexedDB wrapper for persistent generation history.
 * Survives page refresh and browser restart.
 */

const DB_NAME = "AgnesStudioDB";
const DB_VERSION = 1;
const STORE_NAME = "generations";

export interface GenerationRecord {
  id: string;
  type: "image" | "video";
  prompt: string;
  resultUrl: string;
  thumbnailUrl?: string;
  timestamp: number;
  model?: string;
  aspectRatio?: string;
  duration?: string;
  negativePrompt?: string;
}

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (_event) => {
      const database = (request.result as IDBDatabase);
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

export async function addRecord(record: {
  type: "image" | "video";
  prompt: string;
  resultUrl: string;
  thumbnailUrl?: string;
  model?: string;
  aspectRatio?: string;
  duration?: string;
  negativePrompt?: string;
  id?: string;
  timestamp?: number;
}): Promise<GenerationRecord> {
  const dbConn = await openDB();
  const tx = dbConn.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const fullRecord: GenerationRecord = {
    ...record,
    id: record.id || crypto.randomUUID(),
    timestamp: record.timestamp || Date.now(),
  };

  return new Promise((resolve, reject) => {
    const request = store.put(fullRecord);
    request.onsuccess = () => resolve(fullRecord);
    request.onerror = () => reject(request.error);
  });
}

export async function getRecords(): Promise<GenerationRecord[]> {
  const dbConn = await openDB();
  const tx = dbConn.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const records = request.result as GenerationRecord[];
      records.sort((a, b) => b.timestamp - a.timestamp);
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getRecordsByType(type: "image" | "video"): Promise<GenerationRecord[]> {
  const all = await getRecords();
  return all.filter((r) => r.type === type);
}

export async function deleteRecord(id: string): Promise<boolean> {
  const dbConn = await openDB();
  const tx = dbConn.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllRecords(): Promise<void> {
  const dbConn = await openDB();
  const tx = dbConn.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
