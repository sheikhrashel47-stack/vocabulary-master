// Scholar’s Ledger reminder: keep persistent vocabulary data local, versioned, migration-ready, and efficient for large collections.
import type { VocabularyWord } from "@/data/vocabulary";

const DB_NAME = "vocabulary-master-db";
const DB_VERSION = 2;
const WORDS_STORE = "words";
const SETTINGS_STORE = "settings";

export type WordPage = { items: VocabularyWord[]; hasMore: boolean };

function searchableText(word: VocabularyWord) {
  return [word.word, word.meaningBn, ...word.synonyms, ...word.antonyms, ...word.tags].join(" ").toLocaleLowerCase();
}

function matchesQuery(word: VocabularyWord, query: string) {
  return !query || searchableText(word).includes(query);
}

export function initializeVocabularyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Database initialization failed."));
    request.onupgradeneeded = () => {
      const db = request.result;
      const words = db.objectStoreNames.contains(WORDS_STORE)
        ? request.transaction!.objectStore(WORDS_STORE)
        : db.createObjectStore(WORDS_STORE, { keyPath: "id" });

      if (!words.indexNames.contains("word")) words.createIndex("word", "word", { unique: true });
      if (!words.indexNames.contains("firstLetter")) words.createIndex("firstLetter", "firstLetter", { unique: false });
      if (!words.indexNames.contains("updatedAt")) words.createIndex("updatedAt", "updatedAt", { unique: false });
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveWords(words: VocabularyWord[]): Promise<void> {
  const db = await initializeVocabularyDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(WORDS_STORE, "readwrite");
    const store = transaction.objectStore(WORDS_STORE);
    words.forEach((word) => store.put({ ...word, favorite: Boolean(word.favorite) }));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save words."));
  });
  db.close();
}

export async function getWordPage({ letter = "ALL", query = "", limit = 50, offset = 0 }: { letter?: string; query?: string; limit?: number; offset?: number }): Promise<WordPage> {
  const db = await initializeVocabularyDb();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const page = await new Promise<WordPage>((resolve, reject) => {
    const transaction = db.transaction(WORDS_STORE, "readonly");
    const store = transaction.objectStore(WORDS_STORE);
    const source: IDBObjectStore | IDBIndex = letter === "ALL" ? store : store.index("firstLetter");
    const range = letter === "ALL" ? undefined : IDBKeyRange.only(letter);
    const items: VocabularyWord[] = [];
    let matched = 0;
    const request = source.openCursor(range);

    request.onerror = () => reject(request.error ?? new Error("Could not read vocabulary."));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve({ items, hasMore: false });
      const word = cursor.value as VocabularyWord;
      if (matchesQuery(word, normalizedQuery)) {
        if (matched >= offset && items.length < limit) items.push(word);
        else if (items.length >= limit) return resolve({ items, hasMore: true });
        matched += 1;
      }
      cursor.continue();
    };
  });
  db.close();
  return page;
}

export async function getLetterCounts(): Promise<Record<string, number>> {
  const db = await initializeVocabularyDb();
  const counts = await new Promise<Record<string, number>>((resolve, reject) => {
    const transaction = db.transaction(WORDS_STORE, "readonly");
    const index = transaction.objectStore(WORDS_STORE).index("firstLetter");
    const result: Record<string, number> = {};
    const letters = Array.from({ length: 26 }, (_, position) => String.fromCharCode(65 + position));
    let completed = 0;
    letters.forEach((letter) => {
      const request = index.count(IDBKeyRange.only(letter));
      request.onerror = () => reject(request.error ?? new Error("Could not read vocabulary index."));
      request.onsuccess = () => {
        result[letter] = request.result;
        completed += 1;
        if (completed === letters.length) resolve(result);
      };
    });
  });
  db.close();
  return counts;
}

export async function toggleWordFavorite(id: string): Promise<boolean> {
  const db = await initializeVocabularyDb();
  const favorite = await new Promise<boolean>((resolve, reject) => {
    const transaction = db.transaction(WORDS_STORE, "readwrite");
    const store = transaction.objectStore(WORDS_STORE);
    const request = store.get(id);
    request.onerror = () => reject(request.error ?? new Error("Could not read this word."));
    request.onsuccess = () => {
      const word = request.result as VocabularyWord | undefined;
      if (!word) return reject(new Error("Word not found."));
      const nextFavorite = !Boolean(word.favorite);
      store.put({ ...word, favorite: nextFavorite, updatedAt: new Date().toISOString() });
      resolve(nextFavorite);
    };
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save favorite."));
  });
  db.close();
  return favorite;
}
