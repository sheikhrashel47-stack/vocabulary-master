// Phase-4 exam engine: every question is generated before an exam starts from local IndexedDB vocabulary; it never fabricates source records.
import type { VocabularyWord } from "@/data/vocabulary";

export type ExamSettings = { source: "all" | string; questionCount: 10 | 20 | 30 | 50 | 100; timeMinutes: 5 | 10 | 20 | 30 | 60; difficulty: "all" | "easy" | "medium" | "advanced"; negativeMarking: 0 | 0.25 | 0.5 };
export type ExamQuestionType = "wordToMeaning" | "meaningToWord" | "synonym" | "antonym";
export type ExamQuestion = { id: string; vocabularyId: string; type: ExamQuestionType; prompt: string; options: string[]; correctOption: string; word: string; meaningBn: string; synonyms: VocabularyWord["synonyms"]; antonyms: VocabularyWord["antonyms"]; tip?: string };
export type ExamSession = { examId: string; mode: "mock"; startedAt: string; expiresAt: string; settings: ExamSettings; currentQuestion: number; questions: ExamQuestion[]; answers: Record<string, string>; status: "active" | "submitted" | "expired" | "abandoned" };
export type QuestionResult = ExamQuestion & { selectedOption?: string; status: "correct" | "wrong" | "skipped" };
export type ExamHistoryRecord = { examId: string; createdAt: string; completedAt: string; mode: "mock"; totalQuestions: number; correct: number; wrong: number; skipped: number; positiveMarks: number; negativeMarks: number; finalScore: number; accuracy: number; durationSeconds: number; settings: ExamSettings; questionResults: QuestionResult[]; status: "submitted" | "expired" };

const shuffle = <T,>(values: T[]) => { const copy = [...values]; for (let index = copy.length - 1; index > 0; index -= 1) { const next = Math.floor(Math.random() * (index + 1)); [copy[index], copy[next]] = [copy[next], copy[index]]; } return copy; };
const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));
const textFor = (word: VocabularyWord, type: ExamQuestionType) => type === "wordToMeaning" ? word.meaningBn : word.word;

function makeQuestion(word: VocabularyWord, pool: VocabularyWord[], ordinal: number): ExamQuestion | null {
  const relations = word.synonyms.length ? word.synonyms : word.antonyms;
  const type: ExamQuestionType = relations.length && ordinal % 3 === 2 ? (word.synonyms.length ? "synonym" : "antonym") : ordinal % 2 ? "meaningToWord" : "wordToMeaning";
  let prompt = ""; let correctOption = ""; let distractors: string[] = [];
  if (type === "wordToMeaning") { prompt = `What is the Bengali meaning of “${word.word}”?`; correctOption = word.meaningBn; distractors = pool.filter((item) => item.id !== word.id).map((item) => item.meaningBn); }
  if (type === "meaningToWord") { prompt = `Which word means “${word.meaningBn}”?`; correctOption = word.word; distractors = pool.filter((item) => item.id !== word.id).map((item) => item.word); }
  if (type === "synonym") { const relation = word.synonyms[ordinal % word.synonyms.length]; prompt = `Which is a synonym of “${word.word}”?`; correctOption = relation.word; distractors = unique([...word.antonyms.map((item) => item.word), ...pool.filter((item) => item.id !== word.id).flatMap((item) => item.synonyms.map((relation) => relation.word))]); }
  if (type === "antonym") { const relation = word.antonyms[ordinal % word.antonyms.length]; prompt = `Which is an antonym of “${word.word}”?`; correctOption = relation.word; distractors = unique([...word.synonyms.map((item) => item.word), ...pool.filter((item) => item.id !== word.id).flatMap((item) => item.antonyms.map((relation) => relation.word))]); }
  const options = unique([correctOption, ...shuffle(distractors)]).slice(0, 4); if (!correctOption || options.length < 4 || new Set(options).size !== 4) return null;
  return { id: `${word.id}-${ordinal}`, vocabularyId: word.id, type, prompt, options: shuffle(options), correctOption, word: word.word, meaningBn: word.meaningBn, synonyms: word.synonyms, antonyms: word.antonyms, tip: word.tip };
}

export function createQuestions(words: VocabularyWord[], settings: ExamSettings): ExamQuestion[] {
  const filtered = words.filter((word) => settings.difficulty === "all" || word.difficulty === settings.difficulty).filter((word) => Boolean(word.word && word.meaningBn));
  const shuffled = shuffle(filtered); const questions: ExamQuestion[] = [];
  for (let index = 0; index < shuffled.length && questions.length < settings.questionCount; index += 1) { const question = makeQuestion(shuffled[index], shuffled, index); if (question) questions.push(question); }
  return questions;
}

export function scoreExam(session: ExamSession, status: "submitted" | "expired"): ExamHistoryRecord {
  const questionResults: QuestionResult[] = session.questions.map((question) => { const selectedOption = session.answers[question.id]; return { ...question, selectedOption, status: !selectedOption ? "skipped" : selectedOption === question.correctOption ? "correct" : "wrong" }; });
  const correct = questionResults.filter((item) => item.status === "correct").length; const wrong = questionResults.filter((item) => item.status === "wrong").length; const skipped = questionResults.filter((item) => item.status === "skipped").length; const positiveMarks = correct; const negativeMarks = Number((wrong * session.settings.negativeMarking).toFixed(2)); const finalScore = Number((positiveMarks - negativeMarks).toFixed(2)); const attempted = correct + wrong; const completedAt = new Date().toISOString();
  return { examId: session.examId, createdAt: session.startedAt, completedAt, mode: "mock", totalQuestions: session.questions.length, correct, wrong, skipped, positiveMarks, negativeMarks, finalScore, accuracy: attempted ? Number(((correct / attempted) * 100).toFixed(1)) : 0, durationSeconds: Math.max(0, Math.min(session.settings.timeMinutes * 60, Math.round((Date.parse(completedAt) - Date.parse(session.startedAt)) / 1000))), settings: session.settings, questionResults, status };
}

export function formatTime(seconds: number) { const safe = Math.max(0, Math.floor(seconds)); return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`; }
