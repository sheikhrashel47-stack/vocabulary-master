// Scholar’s Ledger reminder: sample vocabulary is clearly marked, text-first, and never used to fabricate progress.
export type VocabularyWord = {
  id: string;
  word: string;
  meaningBn: string;
  synonyms: string[];
  antonyms: string[];
  tip?: string;
  firstLetter: string;
  category: string;
  difficulty: "easy" | "medium" | "advanced";
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const createdAt = "2026-08-24T00:00:00.000Z";

export const sampleVocabulary: VocabularyWord[] = [
  { id: "sample-adept", word: "Adept", meaningBn: "দক্ষ; পারদর্শী", synonyms: ["Skilled", "Proficient", "Expert"], antonyms: ["Inept", "Unskilled"], tip: "Adept = a depth of skill.", firstLetter: "A", category: "General", difficulty: "medium", tags: ["adjective"], createdAt, updatedAt: createdAt },
  { id: "sample-benevolent", word: "Benevolent", meaningBn: "দয়ালু; কল্যাণকামী", synonyms: ["Kind", "Generous", "Charitable"], antonyms: ["Cruel", "Malevolent"], tip: "Bene means good; benevolent means wishing good.", firstLetter: "B", category: "Character", difficulty: "advanced", tags: ["adjective"], createdAt, updatedAt: createdAt },
  { id: "sample-conceal", word: "Conceal", meaningBn: "লুকানো; গোপন রাখা", synonyms: ["Hide", "Cover", "Disguise"], antonyms: ["Reveal", "Expose"], tip: "Conceal keeps something out of sight.", firstLetter: "C", category: "Action", difficulty: "medium", tags: ["verb"], createdAt, updatedAt: createdAt },
  { id: "sample-compassion", word: "Compassion", meaningBn: "সহমর্মিতা; করুণা", synonyms: ["Empathy", "Mercy", "Kindness"], antonyms: ["Cruelty", "Indifference"], tip: "Compassion means feeling concern and wanting to help.", firstLetter: "C", category: "Character", difficulty: "medium", tags: ["noun"], createdAt, updatedAt: createdAt },
  { id: "sample-comprehend", word: "Comprehend", meaningBn: "বোঝা; অনুধাবন করা", synonyms: ["Understand", "Grasp", "Perceive"], antonyms: ["Misunderstand", "Ignore"], tip: "Comprehend is a deeper form of understand.", firstLetter: "C", category: "Learning", difficulty: "medium", tags: ["verb"], createdAt, updatedAt: createdAt },
  { id: "sample-conjecture", word: "Conjecture", meaningBn: "অনুমান করা; ধারণা", synonyms: ["Suppose", "Guess", "Hypothesis"], antonyms: ["Fact", "Proof"], tip: "A conjecture is an idea without final proof.", firstLetter: "C", category: "Learning", difficulty: "advanced", tags: ["noun", "verb"], createdAt, updatedAt: createdAt },
  { id: "sample-diligent", word: "Diligent", meaningBn: "পরিশ্রমী; অধ্যবসায়ী", synonyms: ["Hardworking", "Assiduous", "Industrious"], antonyms: ["Lazy", "Negligent"], tip: "Diligent work is careful, regular work.", firstLetter: "D", category: "Character", difficulty: "medium", tags: ["adjective"], createdAt, updatedAt: createdAt },
  { id: "sample-elated", word: "Elated", meaningBn: "অত্যন্ত আনন্দিত", synonyms: ["Joyful", "Delighted", "Euphoric"], antonyms: ["Depressed", "Miserable"], tip: "Elated is a lifted, high feeling.", firstLetter: "E", category: "Emotion", difficulty: "medium", tags: ["adjective"], createdAt, updatedAt: createdAt },
  { id: "sample-fragile", word: "Fragile", meaningBn: "ভঙ্গুর; নাজুক", synonyms: ["Delicate", "Brittle", "Weak"], antonyms: ["Strong", "Durable"], tip: "Fragile things break easily.", firstLetter: "F", category: "General", difficulty: "easy", tags: ["adjective"], createdAt, updatedAt: createdAt },
  { id: "sample-genuine", word: "Genuine", meaningBn: "আসল; খাঁটি", synonyms: ["Authentic", "Real", "Sincere"], antonyms: ["Fake", "Artificial"], tip: "Genuine means not copied or pretended.", firstLetter: "G", category: "General", difficulty: "medium", tags: ["adjective"], createdAt, updatedAt: createdAt },
  { id: "sample-hinder", word: "Hinder", meaningBn: "বাধা দেওয়া; ব্যাহত করা", synonyms: ["Obstruct", "Impede", "Delay"], antonyms: ["Help", "Assist"], tip: "A hindrance slows a path forward.", firstLetter: "H", category: "Action", difficulty: "medium", tags: ["verb"], createdAt, updatedAt: createdAt },
  { id: "sample-immense", word: "Immense", meaningBn: "বিরাট; অপরিমেয়", synonyms: ["Huge", "Enormous", "Vast"], antonyms: ["Tiny", "Small"], tip: "Immense describes something beyond ordinary size.", firstLetter: "I", category: "General", difficulty: "medium", tags: ["adjective"], createdAt, updatedAt: createdAt },
];

export const alphabet = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
