// Phase-6 reward engine: activity rewards remain separate from Phase-5 knowledge mastery.
export type RewardSource = "mock" | "daily-goal" | "achievement" | "level" | "shop";
export type RewardTransaction = { rewardId: string; type: "xp" | "coins" | "spent"; amount: number; source: RewardSource; referenceId: string; createdAt: string };
export type GamificationState = { key: "profile"; totalXp: number; coins: number; completedMocks: number; answeredQuestions: number; completedRevisionSessions: number; currentStreak: number; bestStreak: number; lastActiveDate?: string; updatedAt: string };
export type DailyGoal = { goalDate: string; type: "questions"; target: number; progress: number; completedAt?: string; rewardGranted: boolean };
export type Achievement = { achievementId: string; title: string; description: string; category: "Mock Test" | "Learning" | "Consistency"; target: number; progress: number; unlockedAt?: string; rewardGranted: boolean };

export const defaultGamificationState = (): GamificationState => ({ key: "profile", totalXp: 0, coins: 0, completedMocks: 0, answeredQuestions: 0, completedRevisionSessions: 0, currentStreak: 0, bestStreak: 0, updatedAt: new Date().toISOString() });
export const localDate = (value = new Date()) => { const date = value instanceof Date ? value : new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
export const levelStartXp = (level: number) => Math.max(0, 25 * (level - 1) * (level + 2));
export function levelForXp(totalXp: number) { return Math.max(1, Math.floor((-1 + Math.sqrt(9 + (totalXp * 4) / 25)) / 2)); }
export function levelProgress(totalXp: number) { const level = levelForXp(totalXp); const start = levelStartXp(level); const next = levelStartXp(level + 1); return { level, start, next, current: totalXp - start, needed: Math.max(1, next - start), percent: Math.min(100, Math.round(((totalXp - start) / Math.max(1, next - start)) * 100)) }; }
export const achievementDefinitions: Array<Omit<Achievement, "progress" | "unlockedAt" | "rewardGranted"> & { xp: number; coins: number; measure: (state: GamificationState) => number }> = [
  { achievementId: "first-mock", title: "First Steps", description: "Complete your first Mock Test.", category: "Mock Test", target: 1, xp: 50, coins: 20, measure: (state) => state.completedMocks },
  { achievementId: "questions-100", title: "Question Builder", description: "Answer 100 real vocabulary questions.", category: "Learning", target: 100, xp: 100, coins: 30, measure: (state) => state.answeredQuestions },
  { achievementId: "streak-7", title: "Consistency", description: "Maintain a 7-day learning streak.", category: "Consistency", target: 7, xp: 80, coins: 40, measure: (state) => state.bestStreak },
];
