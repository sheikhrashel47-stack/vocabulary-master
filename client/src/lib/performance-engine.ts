// Phase-5 Performance Engine: exam outcomes flow once into word-level evidence, mastery, mistakes, and an adaptive review queue.
import type { ExamHistoryRecord, ExamQuestionType } from "@/lib/exam-engine";

export type PerformanceKind = "meaning" | "synonym" | "antonym" | "mock";
export type TypeStat = { attempts: number; correct: number; wrong: number };
export type WordPerformance = { vocabularyId: string; attempts: number; correct: number; wrong: number; accuracy: number; mastery: number; lastAttemptAt?: string; lastCorrectAt?: string; lastWrongAt?: string; nextReviewAt?: string; currentState: "new" | "learning" | "weak" | "reviewing" | "strong" | "mastered"; typeStats: Record<PerformanceKind, TypeStat>; reviewedAt?: string };
export type RevisionItem = { vocabularyId: string; priority: number; reason: "weak" | "recently-wrong" | "due"; scheduledAt: string; nextReviewAt?: string };

const emptyTypeStats = (): Record<PerformanceKind, TypeStat> => ({ meaning: { attempts: 0, correct: 0, wrong: 0 }, synonym: { attempts: 0, correct: 0, wrong: 0 }, antonym: { attempts: 0, correct: 0, wrong: 0 }, mock: { attempts: 0, correct: 0, wrong: 0 } });
export const emptyPerformance = (vocabularyId: string): WordPerformance => ({ vocabularyId, attempts: 0, correct: 0, wrong: 0, accuracy: 0, mastery: 0, currentState: "new", typeStats: emptyTypeStats() });
export const kindFromQuestion = (type: ExamQuestionType): PerformanceKind => type === "wordToMeaning" || type === "meaningToWord" ? "meaning" : type === "synonym" ? "synonym" : type === "antonym" ? "antonym" : "mock";
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

export function calculatePerformance(previous: WordPerformance, correctAnswer: boolean, kind: PerformanceKind, at: string): WordPerformance {
  const typeStats = { ...previous.typeStats, [kind]: { ...previous.typeStats[kind] } }; const current = typeStats[kind]; current.attempts += 1; if (correctAnswer) current.correct += 1; else current.wrong += 1;
  const attempts = previous.attempts + 1; const correct = previous.correct + (correctAnswer ? 1 : 0); const wrong = previous.wrong + (correctAnswer ? 0 : 1); const accuracy = Math.round((correct / attempts) * 100);
  const coverage = Object.values(typeStats).filter((stat) => stat.attempts > 0).length; const evidence = Math.min(1, attempts / 8); const base = accuracy * evidence; const variety = Math.min(8, coverage * 2); const recentAdjustment = correctAnswer ? Math.min(6, Math.max(1, attempts * 0.45)) : -Math.min(12, 4 + wrong * 0.65); const mastery = Math.max(0, Math.min(100, Math.round(base + variety + recentAdjustment)));
  const currentState = mastery >= 96 && attempts >= 8 && coverage >= 2 ? "mastered" : mastery >= 61 ? "strong" : mastery >= 41 ? "reviewing" : mastery >= 21 ? "learning" : attempts ? "weak" : "new"; const nextReviewAt = daysFromNow(correctAnswer ? mastery >= 80 ? 14 : mastery >= 50 ? 5 : 2 : 1);
  return { ...previous, attempts, correct, wrong, accuracy, mastery, currentState, typeStats, lastAttemptAt: at, lastCorrectAt: correctAnswer ? at : previous.lastCorrectAt, lastWrongAt: correctAnswer ? previous.lastWrongAt : at, nextReviewAt };
}

export function priorityFor(performance: WordPerformance, now = Date.now()) { if (!performance.attempts) return 0; const lastWrongAge = performance.lastWrongAt ? (now - Date.parse(performance.lastWrongAt)) / 86_400_000 : 999; const due = performance.nextReviewAt && Date.parse(performance.nextReviewAt) <= now ? 18 : 0; const recentWrong = performance.lastWrongAt && lastWrongAge <= 7 ? Math.max(0, 21 - Math.floor(lastWrongAge * 3)) : 0; const weakness = Math.max(0, 100 - performance.mastery) * 0.42; const repetition = Math.min(15, performance.wrong * 2.4); return Math.round(weakness + recentWrong + repetition + due); }
export function revisionReason(performance: WordPerformance, now = Date.now()): RevisionItem["reason"] { if (performance.lastWrongAt && now - Date.parse(performance.lastWrongAt) <= 7 * 86_400_000) return "recently-wrong"; if (performance.nextReviewAt && Date.parse(performance.nextReviewAt) <= now) return "due"; return "weak"; }
export function performanceFromExam(record: ExamHistoryRecord) { return record.questionResults.map((question) => ({ eventId: `${record.examId}:${question.id}`, vocabularyId: question.vocabularyId, correct: question.status === "correct", kind: kindFromQuestion(question.type), at: record.completedAt })); }
