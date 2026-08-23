// Phase-6 persistence: every reward event is processed once inside a single local IndexedDB transaction.
import type { ExamHistoryRecord } from "@/lib/exam-engine";
import { getExamHistory } from "@/lib/exam-db";
import { initializeVocabularyDb } from "@/lib/vocabulary-db";
import { achievementDefinitions, defaultGamificationState, levelForXp, levelProgress, localDate, type Achievement, type DailyGoal, type GamificationState, type RewardSource, type RewardTransaction } from "@/lib/gamification-engine";

const STATE = "gamification-state"; const EVENTS = "gamification-events"; const TRANSACTIONS = "reward-transactions"; const GOALS = "daily-goals"; const ACHIEVEMENTS = "achievements"; const OWNERSHIP = "shop-ownership";
const getValue = <T,>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error ?? new Error("Local reward data could not be read.")); });
async function transaction<T>(stores: string | string[], mode: IDBTransactionMode, action: (tx: IDBTransaction) => Promise<T>) { const db = await initializeVocabularyDb(); try { return await action(db.transaction(stores, mode)); } finally { db.close(); } }
const profileKey = "profile";
function recordReward(tx: IDBTransaction, state: GamificationState, rewardId: string, type: RewardTransaction["type"], amount: number, source: RewardSource, referenceId: string, createdAt: string) {
  const transactions = tx.objectStore(TRANSACTIONS); transactions.put({ rewardId, type, amount, source, referenceId, createdAt } satisfies RewardTransaction);
  if (type === "xp") state.totalXp += amount; if (type === "coins") state.coins += amount; if (type === "spent") state.coins = Math.max(0, state.coins - amount);
}
function updateStreak(state: GamificationState, activityDate: string) {
  if (state.lastActiveDate === activityDate) return;
  const yesterday = new Date(`${activityDate}T00:00:00`); yesterday.setDate(yesterday.getDate() - 1); const prior = localDate(yesterday);
  state.currentStreak = state.lastActiveDate === prior ? state.currentStreak + 1 : 1; state.bestStreak = Math.max(state.bestStreak, state.currentStreak); state.lastActiveDate = activityDate;
}
function goalFor(date: string, existing?: DailyGoal): DailyGoal { return existing ?? { goalDate: date, type: "questions", target: 20, progress: 0, rewardGranted: false }; }

export async function processMockCompletion(record: ExamHistoryRecord) {
  const eventId = `mock:${record.examId}`; const createdAt = record.completedAt; const activityDate = localDate(new Date(createdAt));
  if (record.correct + record.wrong <= 0) return { processed: false, xp: 0, coins: 0, levelUp: null as number | null };
  return transaction([STATE, EVENTS, TRANSACTIONS, GOALS, ACHIEVEMENTS], "readwrite", async (tx) => {
    const events = tx.objectStore(EVENTS); if (await getValue(events.get(eventId))) return { processed: false, xp: 0, coins: 0, levelUp: null as number | null };
    const stateStore = tx.objectStore(STATE); const state = (await getValue(stateStore.get(profileKey)) as GamificationState | undefined) ?? defaultGamificationState(); const levelBefore = levelForXp(state.totalXp);
    state.completedMocks += 1; state.answeredQuestions += record.correct + record.wrong; updateStreak(state, activityDate); recordReward(tx, state, `${eventId}:completion`, "xp", 20, "mock", record.examId, createdAt);
    const goals = tx.objectStore(GOALS); const goal = goalFor(activityDate, await getValue(goals.get(activityDate)) as DailyGoal | undefined); goal.progress += record.correct + record.wrong;
    if (goal.progress >= goal.target && !goal.rewardGranted) { goal.completedAt = createdAt; goal.rewardGranted = true; recordReward(tx, state, `goal:${activityDate}:complete:xp`, "xp", 30, "daily-goal", activityDate, createdAt); recordReward(tx, state, `goal:${activityDate}:complete:coins`, "coins", 20, "daily-goal", activityDate, createdAt); }
    goals.put(goal);
    const achievements = tx.objectStore(ACHIEVEMENTS); for (const definition of achievementDefinitions) { const stored = (await getValue(achievements.get(definition.achievementId)) as Achievement | undefined) ?? { achievementId: definition.achievementId, title: definition.title, description: definition.description, category: definition.category, target: definition.target, progress: 0, rewardGranted: false }; stored.progress = Math.min(definition.target, definition.measure(state)); if (stored.progress >= stored.target && !stored.rewardGranted) { stored.unlockedAt = createdAt; stored.rewardGranted = true; recordReward(tx, state, `achievement:${stored.achievementId}:xp`, "xp", definition.xp, "achievement", stored.achievementId, createdAt); recordReward(tx, state, `achievement:${stored.achievementId}:coins`, "coins", definition.coins, "achievement", stored.achievementId, createdAt); } achievements.put(stored); }
    const levelAfter = levelForXp(state.totalXp); for (let level = levelBefore + 1; level <= levelAfter; level += 1) recordReward(tx, state, `level:${level}:coins`, "coins", 50, "level", String(level), createdAt);
    state.updatedAt = createdAt; stateStore.put(state); events.put({ eventId, source: "mock", referenceId: record.examId, createdAt, processedAt: new Date().toISOString() });
    return { processed: true, xp: state.totalXp, coins: state.coins, levelUp: levelAfter > levelBefore ? levelAfter : null };
  });
}
export async function migrateMockRewards() { const history = await getExamHistory(); for (const record of history) await processMockCompletion(record); }
export async function getGamificationSnapshot() { return transaction([STATE, GOALS, ACHIEVEMENTS, TRANSACTIONS], "readonly", async (tx) => { const state = (await getValue(tx.objectStore(STATE).get(profileKey)) as GamificationState | undefined) ?? defaultGamificationState(); const today = localDate(); const goal = goalFor(today, await getValue(tx.objectStore(GOALS).get(today)) as DailyGoal | undefined); const achievements = await getValue(tx.objectStore(ACHIEVEMENTS).getAll()) as Achievement[]; const rewards = await getValue(tx.objectStore(TRANSACTIONS).getAll()) as RewardTransaction[]; return { state, level: levelProgress(state.totalXp), goal, achievements: achievements.sort((a, b) => Number(Boolean(b.unlockedAt)) - Number(Boolean(a.unlockedAt))), rewards: rewards.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8) }; }); }
export const shopItems = [{ itemId: "emerald", name: "Emerald", category: "Theme", price: 0, description: "The default academic palette." }, { itemId: "midnight", name: "Midnight", category: "Theme", price: 500, description: "A calm dark study palette." }, { itemId: "focus-badge", name: "Focus Badge", category: "Profile", price: 250, description: "A subtle profile mark." }];
export async function getOwnedItems() { return transaction(OWNERSHIP, "readonly", async (tx) => getValue(tx.objectStore(OWNERSHIP).getAll()) as Promise<Array<{ itemId: string; acquiredAt: string }>>); }
export async function purchaseShopItem(itemId: string) { const item = shopItems.find((entry) => entry.itemId === itemId); if (!item) throw new Error("Shop item not found."); return transaction([STATE, OWNERSHIP, TRANSACTIONS], "readwrite", async (tx) => { const owned = tx.objectStore(OWNERSHIP); if (await getValue(owned.get(itemId))) return "owned" as const; const stateStore = tx.objectStore(STATE); const state = (await getValue(stateStore.get(profileKey)) as GamificationState | undefined) ?? defaultGamificationState(); if (state.coins < item.price) return "insufficient" as const; const createdAt = new Date().toISOString(); if (item.price) recordReward(tx, state, `shop:${itemId}:spent`, "spent", item.price, "shop", itemId, createdAt); owned.put({ itemId, acquiredAt: createdAt }); state.updatedAt = createdAt; stateStore.put(state); return "purchased" as const; }); }
