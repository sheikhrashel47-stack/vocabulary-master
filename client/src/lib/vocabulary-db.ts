// Phase-2 data engine: IndexedDB is the sole source of truth for vocabulary, import metadata, and real dashboard aggregates.
import { deriveFirstLetter, normalizeWordKey, type VocabularyWord, type WordRelation } from "@/data/vocabulary";

const DB_NAME = "vocabulary-master-db";
const DB_VERSION = 3;
const WORDS_STORE = "words";
const SETTINGS_STORE = "settings";
const STATS_KEY = "library-stats";

export type WordPage = { items: VocabularyWord[]; hasMore: boolean };
export type LibraryStats = { totalWords: number; withSynonyms: number; withAntonyms: number; letterCounts: Record<string, number>; updatedAt: string };
export type ImportProgress = { completed: number; total: number; stage: "saving" | "complete" };

const asRelations = (values: unknown): WordRelation[] => Array.isArray(values) ? values.map((value) => typeof value === "string" ? { word: value, meaningBn: "" } : value as WordRelation).filter((value) => Boolean(value.word)) : [];
function normalizeStoredWord(value: VocabularyWord): VocabularyWord {
  return { ...value, wordKey: value.wordKey || normalizeWordKey(value.word), firstLetter: value.firstLetter || deriveFirstLetter(value.word), synonyms: asRelations(value.synonyms), antonyms: asRelations(value.antonyms), source: value.source || "imported" };
}
function searchableText(word: VocabularyWord) { return [word.word, word.meaningBn, ...word.synonyms.flatMap((relation) => [relation.word, relation.meaningBn]), ...word.antonyms.flatMap((relation) => [relation.word, relation.meaningBn]), ...word.tags].join(" ").toLocaleLowerCase(); }
function matchesQuery(word: VocabularyWord, query: string) { return !query || searchableText(word).includes(query); }

export function initializeVocabularyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Database initialization failed."));
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const words = db.objectStoreNames.contains(WORDS_STORE) ? request.transaction!.objectStore(WORDS_STORE) : db.createObjectStore(WORDS_STORE, { keyPath: "id" });
      if (!words.indexNames.contains("word")) words.createIndex("word", "word", { unique: true });
      if (!words.indexNames.contains("wordKey")) words.createIndex("wordKey", "wordKey", { unique: true });
      if (!words.indexNames.contains("firstLetter")) words.createIndex("firstLetter", "firstLetter", { unique: false });
      if (!words.indexNames.contains("createdAt")) words.createIndex("createdAt", "createdAt", { unique: false });
      if (!words.indexNames.contains("updatedAt")) words.createIndex("updatedAt", "updatedAt", { unique: false });
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      if (event.oldVersion < 3 && db.objectStoreNames.contains(WORDS_STORE)) {
        const cursor = words.openCursor();
        cursor.onsuccess = () => { const item = cursor.result; if (!item) return; item.update(normalizeStoredWord(item.value as VocabularyWord)); item.continue(); };
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function transaction<T>(stores: string | string[], mode: IDBTransactionMode, runner: (tx: IDBTransaction) => Promise<T>): Promise<T> {
  const db = await initializeVocabularyDb();
  try { return await runner(db.transaction(stores, mode)); } finally { db.close(); }
}

export async function saveWords(words: VocabularyWord[]): Promise<void> {
  await transaction(WORDS_STORE, "readwrite", async (tx) => new Promise<void>((resolve, reject) => { const store = tx.objectStore(WORDS_STORE); words.forEach((word) => store.put(normalizeStoredWord(word))); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error ?? new Error("Could not save words.")); }));
  await rebuildDashboardStats();
}

export async function getWordPage({ letter = "ALL", query = "", limit = 50 }: { letter?: string; query?: string; limit?: number }): Promise<WordPage> {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return transaction(WORDS_STORE, "readonly", async (tx) => new Promise<WordPage>((resolve, reject) => {
    const store = tx.objectStore(WORDS_STORE);
    const source: IDBObjectStore | IDBIndex = letter === "ALL" ? store.index("word") : store.index("firstLetter");
    const request = source.openCursor(letter === "ALL" ? undefined : IDBKeyRange.only(letter));
    const items: VocabularyWord[] = [];
    request.onerror = () => reject(request.error ?? new Error("Could not read vocabulary."));
    request.onsuccess = () => { const cursor = request.result; if (!cursor) return resolve({ items, hasMore: false }); const word = normalizeStoredWord(cursor.value as VocabularyWord); if (matchesQuery(word, normalizedQuery)) { if (items.length === limit) return resolve({ items, hasMore: true }); items.push(word); } cursor.continue(); };
  }));
}

export async function getExistingWordKeys(keys: string[]): Promise<Set<string>> {
  const unique = Array.from(new Set(keys));
  return transaction(WORDS_STORE, "readonly", async (tx) => new Promise<Set<string>>((resolve, reject) => {
    const index = tx.objectStore(WORDS_STORE).index("wordKey"); const existing = new Set<string>(); let finished = 0;
    if (!unique.length) return resolve(existing);
    unique.forEach((key) => { const request = index.getKey(key); request.onerror = () => reject(request.error ?? new Error("Could not check duplicates.")); request.onsuccess = () => { if (request.result !== undefined) existing.add(key); finished += 1; if (finished === unique.length) resolve(existing); }; });
  }));
}

export async function importVocabularyRecords(records: VocabularyWord[], onProgress?: (progress: ImportProgress) => void): Promise<void> {
  const batchSize = 500;
  for (let start = 0; start < records.length; start += batchSize) {
    const batch = records.slice(start, start + batchSize);
    await transaction(WORDS_STORE, "readwrite", async (tx) => new Promise<void>((resolve, reject) => { const store = tx.objectStore(WORDS_STORE); batch.forEach((record) => store.add(normalizeStoredWord(record))); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error ?? new Error("Could not save this import batch.")); }));
    onProgress?.({ completed: Math.min(start + batch.length, records.length), total: records.length, stage: "saving" });
  }
  await rebuildDashboardStats();
  onProgress?.({ completed: records.length, total: records.length, stage: "complete" });
}

export async function toggleWordFavorite(id: string): Promise<boolean> {
  return transaction(WORDS_STORE, "readwrite", async (tx) => new Promise<boolean>((resolve, reject) => { const store = tx.objectStore(WORDS_STORE); const request = store.get(id); request.onerror = () => reject(request.error ?? new Error("Could not read this word.")); request.onsuccess = () => { const word = request.result as VocabularyWord | undefined; if (!word) return reject(new Error("Word not found.")); const favorite = !Boolean(word.favorite); store.put({ ...normalizeStoredWord(word), favorite, updatedAt: new Date().toISOString() }); resolve(favorite); }; tx.onerror = () => reject(tx.error ?? new Error("Could not save favorite.")); }));
}

export async function getDashboardStats(): Promise<LibraryStats> {
  const cached = await transaction(SETTINGS_STORE, "readonly", async (tx) => new Promise<LibraryStats | undefined>((resolve, reject) => { const request = tx.objectStore(SETTINGS_STORE).get(STATS_KEY); request.onerror = () => reject(request.error ?? new Error("Could not read dashboard data.")); request.onsuccess = () => resolve(request.result?.value as LibraryStats | undefined); }));
  return cached ?? rebuildDashboardStats();
}

export async function rebuildDashboardStats(): Promise<LibraryStats> {
  const stats = await transaction(WORDS_STORE, "readonly", async (tx) => new Promise<LibraryStats>((resolve, reject) => { const result: LibraryStats = { totalWords: 0, withSynonyms: 0, withAntonyms: 0, letterCounts: {}, updatedAt: new Date().toISOString() }; const request = tx.objectStore(WORDS_STORE).openCursor(); request.onerror = () => reject(request.error ?? new Error("Could not calculate library data.")); request.onsuccess = () => { const cursor = request.result; if (!cursor) return resolve(result); const word = normalizeStoredWord(cursor.value as VocabularyWord); result.totalWords += 1; if (word.synonyms.length) result.withSynonyms += 1; if (word.antonyms.length) result.withAntonyms += 1; result.letterCounts[word.firstLetter] = (result.letterCounts[word.firstLetter] ?? 0) + 1; cursor.continue(); }; }));
  await transaction(SETTINGS_STORE, "readwrite", async (tx) => new Promise<void>((resolve, reject) => { tx.objectStore(SETTINGS_STORE).put({ key: STATS_KEY, value: stats }); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error ?? new Error("Could not save dashboard data.")); }));
  return stats;
}
