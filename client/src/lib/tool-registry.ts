// Scholar’s Ledger reminder: future learning tools stay declarative and locked in Phase-1.
export type ToolKey = "parser" | "match" | "mock" | "flash" | "fillBlank" | "meaningTest" | "revision" | "mistake" | "reward" | "shop";

export const futureTools: Record<ToolKey, { label: string; active: boolean }> = {
  parser: { label: "Vocabulary Parser", active: false },
  match: { label: "Match Game", active: false },
  mock: { label: "Mock Test", active: false },
  flash: { label: "Flash Test", active: false },
  fillBlank: { label: "Fill in the Blank", active: false },
  meaningTest: { label: "Meaning Test", active: false },
  revision: { label: "Smart Revision", active: false },
  mistake: { label: "Mistake Test", active: false },
  reward: { label: "Rewards", active: false },
  shop: { label: "Shop", active: false },
};
