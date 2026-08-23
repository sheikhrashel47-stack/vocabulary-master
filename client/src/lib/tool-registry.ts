// Phase-6 tool boundary: local rewards are active; AI and external infrastructure remain locked.
export type ToolKey =
  | "parser" | "match" | "mock" | "flash" | "fillBlank" | "synonymTest" | "antonymTest" | "meaningTest"
  | "revision" | "mistake" | "xp" | "level" | "reward" | "shop" | "achievement" | "streak"
  | "wordOfDay" | "aiTutor" | "notification" | "social" | "leaderboard" | "cloudSync" | "externalApi";

export const futureTools: Record<ToolKey, { label: string; active: boolean }> = {
  parser: { label: "Vocabulary Parser", active: true },
  match: { label: "Match Game", active: false },
  mock: { label: "Mock Test", active: true },
  flash: { label: "Flash Test", active: false },
  fillBlank: { label: "Fill in the Blank", active: false },
  synonymTest: { label: "Synonym Test", active: false },
  antonymTest: { label: "Antonym Test", active: false },
  meaningTest: { label: "Bengali Meaning Test", active: false },
  revision: { label: "Smart Revision", active: true },
  mistake: { label: "Mistake Bank", active: true },
  xp: { label: "XP", active: true },
  level: { label: "Level System", active: true },
  reward: { label: "Rewards", active: true },
  shop: { label: "Shop", active: true },
  achievement: { label: "Achievements", active: true },
  streak: { label: "Streak", active: true },
  wordOfDay: { label: "Word of the Day", active: false },
  aiTutor: { label: "AI Tutor", active: false },
  notification: { label: "Notifications", active: false },
  social: { label: "Social Features", active: false },
  leaderboard: { label: "Leaderboard", active: false },
  cloudSync: { label: "Cloud Synchronization", active: false },
  externalApi: { label: "External API", active: false },
};
