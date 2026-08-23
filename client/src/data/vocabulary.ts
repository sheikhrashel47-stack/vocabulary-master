// Scholar’s Ledger reminder: Vocabulary Master starts empty and renders only the user’s locally imported records.
export type WordRelation = { word: string; meaningBn: string };

export type VocabularyWord = {
  id: string;
  word: string;
  wordKey: string;
  meaningBn: string;
  synonyms: WordRelation[];
  antonyms: WordRelation[];
  tip?: string;
  firstLetter: string;
  category: string;
  difficulty: "easy" | "medium" | "advanced";
  tags: string[];
  favorite?: boolean;
  source: "sample" | "imported";
  createdAt: string;
  updatedAt: string;
};

export const normalizeWordKey = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase();
export const deriveFirstLetter = (word: string) => word.match(/[A-Za-z]/)?.[0]?.toUpperCase() ?? "#";
export const alphabet = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
