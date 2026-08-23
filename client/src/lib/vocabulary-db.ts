// Phase-2 data engine: IndexedDB is the sole source of truth for vocabulary, import metadata, and real dashboard aggregates.
import { deriveFirstLetter, normalizeWordKey, type VocabularyWord, type WordRelation } from "@/data/vocabulary";

const DB_NAME = "vocabulary-master-db";
const DB_VERSION = 9;
const WORDS_STORE = "words";
const SETTINGS_STORE = "settings";
const STATS_KEY = "library-stats";
export const EXAM_SESSIONS_STORE = "exam-sessions";
export const EXAM_HISTORY_STORE = "exam-history";

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
      if (!db.objectStoreNames.contains(EXAM_SESSIONS_STORE)) db.createObjectStore(EXAM_SESSIONS_STORE, { keyPath: "examId" });
      const history = db.objectStoreNames.contains(EXAM_HISTORY_STORE) ? request.transaction!.objectStore(EXAM_HISTORY_STORE) : db.createObjectStore(EXAM_HISTORY_STORE, { keyPath: "examId" });
      if (!history.indexNames.contains("completedAt")) history.createIndex("completedAt", "completedAt", { unique: false });
      const performance = db.objectStoreNames.contains("word-performance") ? request.transaction!.objectStore("word-performance") : db.createObjectStore("word-performance", { keyPath: "vocabularyId" });
      if (!performance.indexNames.contains("mastery")) performance.createIndex("mastery", "mastery", { unique: false });
      if (!performance.indexNames.contains("lastWrongAt")) performance.createIndex("lastWrongAt", "lastWrongAt", { unique: false });
      const revision = db.objectStoreNames.contains("revision-queue") ? request.transaction!.objectStore("revision-queue") : db.createObjectStore("revision-queue", { keyPath: "vocabularyId" });
      if (!revision.indexNames.contains("priority")) revision.createIndex("priority", "priority", { unique: false });
      if (!db.objectStoreNames.contains("performance-events")) db.createObjectStore("performance-events", { keyPath: "eventId" });
      if (!db.objectStoreNames.contains("gamification-state")) db.createObjectStore("gamification-state", { keyPath: "key" });
      if (!db.objectStoreNames.contains("gamification-events")) db.createObjectStore("gamification-events", { keyPath: "eventId" });
      const rewards = db.objectStoreNames.contains("reward-transactions") ? request.transaction!.objectStore("reward-transactions") : db.createObjectStore("reward-transactions", { keyPath: "rewardId" });
      if (!rewards.indexNames.contains("createdAt")) rewards.createIndex("createdAt", "createdAt", { unique: false });
      if (!db.objectStoreNames.contains("daily-goals")) db.createObjectStore("daily-goals", { keyPath: "goalDate" });
      if (!db.objectStoreNames.contains("achievements")) db.createObjectStore("achievements", { keyPath: "achievementId" });
      if (!db.objectStoreNames.contains("shop-ownership")) db.createObjectStore("shop-ownership", { keyPath: "itemId" });
      const wordTools = db.objectStoreNames.contains("word-tools") ? request.transaction!.objectStore("word-tools") : db.createObjectStore("word-tools", { keyPath: "vocabularyId" });
      if (!wordTools.indexNames.contains("difficult")) wordTools.createIndex("difficult", "difficult", { unique: false });
      if (!wordTools.indexNames.contains("pinned")) wordTools.createIndex("pinned", "pinned", { unique: false });
      if (!db.objectStoreNames.contains("personal-notes")) db.createObjectStore("personal-notes", { keyPath: "vocabularyId" });
      const lists = db.objectStoreNames.contains("custom-lists") ? request.transaction!.objectStore("custom-lists") : db.createObjectStore("custom-lists", { keyPath: "listId" });
      if (!lists.indexNames.contains("updatedAt")) lists.createIndex("updatedAt", "updatedAt", { unique: false });
      const listItems = db.objectStoreNames.contains("custom-list-items") ? request.transaction!.objectStore("custom-list-items") : db.createObjectStore("custom-list-items", { keyPath: "listItemId" });
      if (!listItems.indexNames.contains("listId")) listItems.createIndex("listId", "listId", { unique: false });
      if (!listItems.indexNames.contains("vocabularyId")) listItems.createIndex("vocabularyId", "vocabularyId", { unique: false });
      if (!db.objectStoreNames.contains("word-of-day")) db.createObjectStore("word-of-day", { keyPath: "date" });
      if (!db.objectStoreNames.contains("tool-history")) db.createObjectStore("tool-history", { keyPath: "eventId" });
      const targets = db.objectStoreNames.contains("learning-targets") ? request.transaction!.objectStore("learning-targets") : db.createObjectStore("learning-targets", { keyPath: "targetId" });
      if (!targets.indexNames.contains("updatedAt")) targets.createIndex("updatedAt", "updatedAt", { unique: false });
      if (!targets.indexNames.contains("deadline")) targets.createIndex("deadline", "deadline", { unique: false });
      if (!db.objectStoreNames.contains("planner-state")) db.createObjectStore("planner-state", { keyPath: "date" });
      const safety = db.objectStoreNames.contains("safety-backups") ? request.transaction!.objectStore("safety-backups") : db.createObjectStore("safety-backups", { keyPath: "snapshotId" });
      if (!safety.indexNames.contains("createdAt")) safety.createIndex("createdAt", "createdAt", { unique: false });
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

export async function removeSampleVocabulary(): Promise<number> {
  return transaction(WORDS_STORE, "readwrite", async (tx) => new Promise<number>((resolve, reject) => {
    const store = tx.objectStore(WORDS_STORE); let removed = 0; const request = store.openCursor();
    request.onerror = () => reject(request.error ?? new Error("Could not remove demo vocabulary."));
    request.onsuccess = () => { const cursor = request.result; if (!cursor) return; const word = cursor.value as VocabularyWord; if (word.source === "sample") { cursor.delete(); removed += 1; } cursor.continue(); };
    tx.oncomplete = () => resolve(removed); tx.onerror = () => reject(tx.error ?? new Error("Could not remove demo vocabulary."));
  })).then(async (removed) => { await rebuildDashboardStats(); return removed; });
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
