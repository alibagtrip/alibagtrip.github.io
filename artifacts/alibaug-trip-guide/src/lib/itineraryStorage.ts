import type { TripDay } from '@/data/itinerary';

const DB_NAME = 'alibaug-pocket-guide';
const STORE_NAME = 'itinerary';
const RECORD_KEY = 'main-itinerary';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadItinerary(): Promise<TripDay[] | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(RECORD_KEY);

    request.onsuccess = () => {
      resolve(request.result ?? null);
      db.close();
    };

    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

export async function saveItinerary(days: TripDay[]): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');

    transaction.objectStore(STORE_NAME).put(days, RECORD_KEY);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };

    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
}
