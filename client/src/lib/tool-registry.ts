// Phase-2 tool boundary: parser is active for local vocabulary management; all learning, reward, AI, and sync tools remain inactive.
export type ToolKey =
  | "parser" | "match" | "mock" | "flash" | "fillBlank" | "synonymTest" | "antonymTest" | "meaningTest"
  | "revision" | "mistake" | "xp" | "level" | "reward" | "shop" | "achievement" | "streak"
  | "wordOfDay" | "aiTutor" | "notification" | "social" | "leaderboard" | "cloudSync" | "externalApi";

export const futureTools: Record<ToolKey, { label: string; active: boolean }> = {
  parser: { label: "Vocabulary Parser", active: true },
  match: { label: "Match Game", active: false },
  mock: { label: "Mock Test", active: false },
  flash: { label: "Flash Test", active: false },
  fillBlank: { label: "Fill in the Blank", active: false },
  synonymTest: { label: "Synonym Test", active: false },
  antonymTest: { label: "Antonym Test", active: false },
  meaningTest: { label: "Bengali Meaning Test", active: false },
  revision: { label: "Smart Revision", active: false },
  mistake: { label: "Mistake Bank", active: false },
  xp: { label: "XP", active: false },
  level: { label: "Level System", active: false },
  reward: { label: "Rewards", active: false },
  shop: { label: "Shop", active: false },
  achievement: { label: "Achievements", active: false },
  streak: { label: "Streak", active: false },
  wordOfDay: { label: "Word of the Day", active: false },
  aiTutor: { label: "AI Tutor", active: false },
  notification: { label: "Notifications", active: false },
  social: { label: "Social Features", active: false },
  leaderboard: { label: "Leaderboard", active: false },
  cloudSync: { label: "Cloud Synchronization", active: false },
  externalApi: { label: "External API", active: false },
};
