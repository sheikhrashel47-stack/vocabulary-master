// Phase-2 parser: preserve pasted content, normalize harmless whitespace only, and never generate or rewrite vocabulary.
import { deriveFirstLetter, normalizeWordKey, type VocabularyWord, type WordRelation } from "@/data/vocabulary";

export type ParserIssue = { line: number; message: string; severity: "error" | "warning" };
export type ParsedRecord = VocabularyWord & { line: number; duplicate?: "existing" | "batch" };
export type ParserResult = { records: ParsedRecord[]; issues: ParserIssue[] };

type WorkingRecord = Omit<ParsedRecord, "id" | "wordKey" | "firstLetter" | "createdAt" | "updatedAt" | "source" | "category" | "difficulty" | "tags"> & { line: number };
type Section = "synonyms" | "antonyms" | "tip" | null;

const markerPattern = /^\s*(?:[-*•]\s*)?/;
const splitPair = (value: string) => {
  const match = value.match(/^\s*(.+?)\s*:\s*(.+?)\s*$/);
  return match ? { word: match[1].trim(), meaningBn: match[2].trim() } : null;
};
const relationFromLine = (value: string): WordRelation | null => {
  const clean = value.replace(markerPattern, "").trim();
  if (!clean) return null;
  const pair = splitPair(clean);
  return pair ? pair : { word: clean, meaningBn: "" };
};
const newWorkingRecord = (word: string, meaningBn: string, line: number): WorkingRecord => ({ word, meaningBn, synonyms: [], antonyms: [], tip: "", favorite: false, line });

export function parseVocabularyText(input: string): ParserResult {
  const issues: ParserIssue[] = [];
  const records: ParsedRecord[] = [];
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  let current: WorkingRecord | null = null;
  let section: Section = null;
  const createdAt = new Date().toISOString();

  const finish = () => {
    if (!current) return;
    if (!current.word || !current.meaningBn) {
      issues.push({ line: current.line, message: "Main word and Bengali meaning are both required.", severity: "error" });
    } else {
      records.push({
        id: crypto.randomUUID?.() ?? `word-${Date.now()}-${records.length}`,
        word: current.word,
        wordKey: normalizeWordKey(current.word),
        meaningBn: current.meaningBn,
        synonyms: current.synonyms,
        antonyms: current.antonyms,
        tip: current.tip?.trim() || undefined,
        firstLetter: deriveFirstLetter(current.word),
        category: "Imported",
        difficulty: "medium",
        tags: [],
        favorite: false,
        source: "imported",
        createdAt,
        updatedAt: createdAt,
        line: current.line,
      });
    }
    current = null;
    section = null;
  };

  lines.forEach((rawLine, position) => {
    const line = position + 1;
    const value = rawLine.trim();
    if (!value) return;
    const stripped = value.replace(markerPattern, "").trim();
    if (/^synonyms?\s*:/i.test(stripped)) { section = "synonyms"; return; }
    if (/^antonyms?\s*:/i.test(stripped)) { section = "antonyms"; return; }
    const tipMatch = stripped.match(/^tips?\s*(?:&|and)?\s*(?:explanation)?\s*:\s*(.*)$/i);
    if (tipMatch) { section = "tip"; if (current && tipMatch[1].trim()) current.tip = `${current.tip ? `${current.tip}\n` : ""}${tipMatch[1].trim()}`; return; }

    const pair = splitPair(value);
    const looksLikeHeader = Boolean(pair) && !value.startsWith("*") && !value.startsWith("-") && !value.startsWith("•");
    if (looksLikeHeader) { finish(); current = newWorkingRecord(pair!.word, pair!.meaningBn, line); return; }
    if (!current) { issues.push({ line, message: "Ignored text before a Word : Bengali meaning heading.", severity: "warning" }); return; }
    if (section === "synonyms" || section === "antonyms") {
      const relation = relationFromLine(value);
      if (!relation) return;
      if (section === "synonyms") current.synonyms.push(relation); else current.antonyms.push(relation);
      return;
    }
    if (section === "tip") { current.tip = `${current.tip ? `${current.tip}\n` : ""}${stripped}`; return; }
    issues.push({ line, message: "Ignored text outside a supported section.", severity: "warning" });
  });
  finish();

  const seen = new Set<string>();
  records.forEach((record) => { if (seen.has(record.wordKey)) record.duplicate = "batch"; else seen.add(record.wordKey); });
  return { records, issues };
}
