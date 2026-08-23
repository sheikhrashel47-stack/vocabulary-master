// Scholar’s Ledger reminder: vocabulary data stays structured, clearly sourced, and never fabricates learning progress.
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

const createdAt = "2026-08-24T00:00:00.000Z";
const relation = (word: string, meaningBn = ""): WordRelation => ({ word, meaningBn });
const sample = (id: string, word: string, meaningBn: string, synonyms: string[], antonyms: string[], tip: string, category: string, difficulty: VocabularyWord["difficulty"], tags: string[]): VocabularyWord => ({ id, word, wordKey: normalizeWordKey(word), meaningBn, synonyms: synonyms.map((value) => relation(value)), antonyms: antonyms.map((value) => relation(value)), tip, firstLetter: deriveFirstLetter(word), category, difficulty, tags, source: "sample", createdAt, updatedAt: createdAt });

export const sampleVocabulary: VocabularyWord[] = [
  sample("sample-adept", "Adept", "দক্ষ; পারদর্শী", ["Skilled", "Proficient", "Expert"], ["Inept", "Unskilled"], "Adept = a depth of skill.", "General", "medium", ["adjective"]),
  sample("sample-benevolent", "Benevolent", "দয়ালু; কল্যাণকামী", ["Kind", "Generous", "Charitable"], ["Cruel", "Malevolent"], "Bene means good; benevolent means wishing good.", "Character", "advanced", ["adjective"]),
  sample("sample-conceal", "Conceal", "লুকানো; গোপন রাখা", ["Hide", "Cover", "Disguise"], ["Reveal", "Expose"], "Conceal keeps something out of sight.", "Action", "medium", ["verb"]),
  sample("sample-compassion", "Compassion", "সহমর্মিতা; করুণা", ["Empathy", "Mercy", "Kindness"], ["Cruelty", "Indifference"], "Compassion means feeling concern and wanting to help.", "Character", "medium", ["noun"]),
  sample("sample-comprehend", "Comprehend", "বোঝা; অনুধাবন করা", ["Understand", "Grasp", "Perceive"], ["Misunderstand", "Ignore"], "Comprehend is a deeper form of understand.", "Learning", "medium", ["verb"]),
  sample("sample-conjecture", "Conjecture", "অনুমান করা; ধারণা", ["Suppose", "Guess", "Hypothesis"], ["Fact", "Proof"], "A conjecture is an idea without final proof.", "Learning", "advanced", ["noun", "verb"]),
  sample("sample-diligent", "Diligent", "পরিশ্রমী; অধ্যবসায়ী", ["Hardworking", "Assiduous", "Industrious"], ["Lazy", "Negligent"], "Diligent work is careful, regular work.", "Character", "medium", ["adjective"]),
  sample("sample-elated", "Elated", "অত্যন্ত আনন্দিত", ["Joyful", "Delighted", "Euphoric"], ["Depressed", "Miserable"], "Elated is a lifted, high feeling.", "Emotion", "medium", ["adjective"]),
  sample("sample-fragile", "Fragile", "ভঙ্গুর; নাজুক", ["Delicate", "Brittle", "Weak"], ["Strong", "Durable"], "Fragile things break easily.", "General", "easy", ["adjective"]),
  sample("sample-genuine", "Genuine", "আসল; খাঁটি", ["Authentic", "Real", "Sincere"], ["Fake", "Artificial"], "Genuine means not copied or pretended.", "General", "medium", ["adjective"]),
  sample("sample-hinder", "Hinder", "বাধা দেওয়া; ব্যাহত করা", ["Obstruct", "Impede", "Delay"], ["Help", "Assist"], "A hindrance slows a path forward.", "Action", "medium", ["verb"]),
  sample("sample-immense", "Immense", "বিরাট; অপরিমেয়", ["Huge", "Enormous", "Vast"], ["Tiny", "Small"], "Immense describes something beyond ordinary size.", "General", "medium", ["adjective"]),
];

export const alphabet = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
