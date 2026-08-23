// Scholar’s Ledger reminder: keep persistent vocabulary data local, versioned, and migration-ready.
import type { VocabularyWord } from "@/data/vocabulary";

const DB_NAME = "vocabulary-master-db";
const DB_VERSION = 1;
const WORDS_STORE = "words";
const SETTINGS_STORE = "settings";

export function initializeVocabularyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Database initialization failed."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WORDS_STORE)) {
        const words = db.createObjectStore(WORDS_STORE, { keyPath: "id" });
        words.createIndex("word", "word", { unique: true });
        words.createIndex("firstLetter", "firstLetter", { unique: false });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveWords(words: VocabularyWord[]): Promise<void> {
  const db = await initializeVocabularyDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(WORDS_STORE, "readwrite");
    const store = transaction.objectStore(WORDS_STORE);
    words.forEach((word) => store.put(word));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save words."));
  });
  db.close();
}

export async function getAllWords(): Promise<VocabularyWord[]> {
  const db = await initializeVocabularyDb();
  const words = await new Promise<VocabularyWord[]>((resolve, reject) => {
    const request = db.transaction(WORDS_STORE, "readonly").objectStore(WORDS_STORE).getAll();
    request.onsuccess = () => resolve(request.result as VocabularyWord[]);
    request.onerror = () => reject(request.error ?? new Error("Could not read words."));
  });
  db.close();
  return words;
}
