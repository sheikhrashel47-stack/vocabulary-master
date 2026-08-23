// Admission Hub-style Mock Test reminder: a stable native-scroll exam surface, 50-question pages for long tests, and evidence-safe local persistence.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, ChevronRight, CircleCheck, CircleX, Clock3, FileClock, Flag, History, LockKeyhole, Play, RotateCcw, Sparkles, Target, Timer, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { alphabet } from "@/data/vocabulary";
import { createQuestions, formatTime, scoreExam, type ExamHistoryRecord, type ExamQuestion, type ExamSession, type ExamSettings } from "@/lib/exam-engine";
import { discardActiveExam, finalizeExam, getActiveExam, getExamCandidates, getExamHistory, saveActiveExam } from "@/lib/exam-db";
import { migrateExamPerformance } from "@/lib/performance-db";
import { processMockCompletion } from "@/lib/gamification-db";

type MockView = "hub" | "setup" | "confirm" | "exam" | "result" | "review" | "history";
const initialSettings: ExamSettings = { source: "all", questionCount: 20, timeMinutes: 10, difficulty: "all", negativeMarking: 0 };
const questionCounts: ExamSettings["questionCount"][] = [10, 20, 30, 50, 100, 200, 300, 500];
const timeLimits: ExamSettings["timeMinutes"][] = [5, 10, 20, 30, 60, 120, 180, 240];
const LONG_EXAM_THRESHOLD = 80;
const QUESTIONS_PER_PAGE = 50;

function ResultSummary({ record }: { record: ExamHistoryRecord }) {
  const attempted = record.correct + record.wrong;
  const attemptRate = record.totalQuestions ? Math.round((attempted / record.totalQuestions) * 100) : 0;
  const headline = record.accuracy >= 75 ? "Excellent focus." : record.accuracy >= 50 ? "A useful attempt." : "Start with revision.";
  const guidance = record.accuracy >= 75 ? "Keep your momentum by reviewing the few questions you missed." : record.wrong ? "Your mistakes are now ready for targeted revision." : "Complete a few more answers to build a clearer learning signal.";
  return <section className="result-hero-card"><div className="result-hero-kicker">{record.status === "expired" ? "TIME’S UP · SAVED LOCALLY" : "MOCK TEST · COMPLETE"}</div><div className="result-hero-main"><div className="result-score-ring" style={{ "--score": `${record.accuracy}%` } as React.CSSProperties}><div><b>{record.accuracy}%</b><span>Accuracy</span></div></div><div className="result-hero-copy"><div className="result-hero-copy-top"><span className="result-trophy"><Target size={20}/></span><div><h1>{headline}</h1><p>{guidance}</p></div></div><div className="result-score-plate"><span><b>{record.finalScore}<small> / {record.totalQuestions}</small></b><small>Final score</small></span><span><b>{record.correct}<small> / {record.totalQuestions}</small></b><small>Correct answers</small></span></div></div></div><div className="result-hero-meta"><span><Clock3 size={14}/>{formatTime(record.durationSeconds)} used</span><span>{record.totalQuestions} questions</span><span>{attemptRate}% attempted</span></div></section>;
}

function ExamQuestionCard({ question, index, answer, flagged, onAnswer, onFlag }: { question: ExamQuestion; index: number; answer?: string; flagged: boolean; onAnswer: (questionId: string, option: string) => void; onFlag: (questionId: string) => void }) {
  const typeLabel = question.type === "wordToMeaning" ? "WORD MEANING" : question.type === "meaningToWord" ? "MEANING TO WORD" : question.type.toUpperCase();
  return <article className={`mock-question-card ${answer ? "answered" : ""}`} id={`mock-question-${index}`}>
    <header><span>Q{index + 1}</span><div><small>{typeLabel}</small><button type="button" className={flagged ? "flagged" : ""} onClick={() => onFlag(question.id)} aria-label={flagged ? "Remove question flag" : "Flag question for review"}><Flag size={15} fill={flagged ? "currentColor" : "none"} /></button></div></header>
    <h2>{question.prompt}</h2>
    <div className="mock-options">
      {question.options.map((option) => <button key={`${question.id}-${option}`} type="button" className={answer === option ? "selected" : ""} onClick={() => onAnswer(question.id, option)} aria-pressed={answer === option}><b>{option}</b></button>)}
    </div>
    {answer && <button type="button" className="clear-mock-answer" onClick={() => onAnswer(question.id, answer)}>Clear selection</button>}
  </article>;
}

export function MockTest({ onBack, onOpenRevision, initialView = "hub" }: { onBack: () => void; onOpenRevision?: () => void; initialView?: "hub" | "history" }) {
  const [view, setView] = useState<MockView>(initialView);
  const [settings, setSettings] = useState<ExamSettings>(initialSettings);
  const [draft, setDraft] = useState<ExamSession | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [result, setResult] = useState<ExamHistoryRecord | null>(null);
  const [history, setHistory] = useState<ExamHistoryRecord[]>([]);
  const [now, setNow] = useState(Date.now());
  const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "wrong" | "skipped">("all");
  const [submitPrompt, setSubmitPrompt] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const persistTimerRef = useRef<number | null>(null);
  const pendingSessionRef = useRef<ExamSession | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const completionLockRef = useRef(false);

  const refreshHistory = async () => setHistory(await getExamHistory());
  const queueSessionSave = (next: ExamSession) => {
    pendingSessionRef.current = next;
    if (persistTimerRef.current !== null) return;
    persistTimerRef.current = window.setTimeout(() => {
      persistTimerRef.current = null;
      const pending = pendingSessionRef.current;
      pendingSessionRef.current = null;
      if (!pending) return;
      writeQueueRef.current = writeQueueRef.current.catch(() => undefined).then(() => saveActiveExam(pending));
    }, 180);
  };
  const flushSessionSave = async () => {
    if (persistTimerRef.current !== null) { window.clearTimeout(persistTimerRef.current); persistTimerRef.current = null; }
    const pending = pendingSessionRef.current;
    pendingSessionRef.current = null;
    if (pending) writeQueueRef.current = writeQueueRef.current.catch(() => undefined).then(() => saveActiveExam(pending));
    await writeQueueRef.current;
  };
  const cancelPendingSave = async () => {
    if (persistTimerRef.current !== null) { window.clearTimeout(persistTimerRef.current); persistTimerRef.current = null; }
    pendingSessionRef.current = null;
    await writeQueueRef.current;
  };

  useEffect(() => {
    void migrateExamPerformance().then(refreshHistory);
    void getActiveExam().then((active) => { if (active && active.status === "active") setSession({ ...active, flaggedQuestionIds: active.flaggedQuestionIds ?? [] }); });
  }, []);
  useEffect(() => { setView(initialView); }, [initialView]);
  useEffect(() => {
    const isExamRunning = view === "exam";
    document.body.classList.toggle("vm-exam-active", isExamRunning);
    if (!isExamRunning) return;
    const saveOnBackground = () => { if (document.visibilityState !== "visible") void flushSessionSave(); };
    document.addEventListener("visibilitychange", saveOnBackground);
    window.addEventListener("pagehide", saveOnBackground);
    return () => { document.body.classList.remove("vm-exam-active"); document.removeEventListener("visibilitychange", saveOnBackground); window.removeEventListener("pagehide", saveOnBackground); void flushSessionSave(); };
  }, [view]);
  useEffect(() => { if (!session || view !== "exam") return; const tick = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(tick); }, [session?.examId, view]);

  const remaining = session ? Math.max(0, Math.ceil((Date.parse(session.expiresAt) - now) / 1000)) : 0;
  const complete = async (status: "submitted" | "expired") => {
    if (!session || session.status !== "active" || completionLockRef.current) return;
    completionLockRef.current = true;
    try {
      await flushSessionSave();
      const locked = { ...session, status };
      setSession(locked);
      const record = scoreExam(locked, status);
      await finalizeExam(record);
      await migrateExamPerformance();
      const reward = await processMockCompletion(record);
      setResult(record);
      await refreshHistory();
      if (reward.processed) toast.success(reward.levelUp ? `Mock saved · Level ${reward.levelUp} reached.` : "Mock saved · meaningful activity recorded.");
      setSubmitPrompt(false);
      setView("result");
    } catch {
      completionLockRef.current = false;
      toast.error("The Mock Test could not be submitted. Your saved answers are still kept locally.");
    }
  };
  useEffect(() => { if (session && view === "exam" && remaining <= 0) void complete("expired"); }, [remaining, session?.examId, view]);

  const prepare = async () => {
    const candidates = await getExamCandidates(Math.max(120, settings.questionCount * 6), settings.source);
    const questions = createQuestions(candidates, settings);
    if (!questions.length) { toast.error("No valid vocabulary is available for a Mock Test yet."); return; }
    const effectiveSettings = { ...settings, questionCount: questions.length as ExamSettings["questionCount"] };
    const startedAt = new Date().toISOString();
    setDraft({ examId: crypto.randomUUID?.() ?? `mock-${Date.now()}`, mode: "mock", startedAt, expiresAt: new Date(Date.now() + effectiveSettings.timeMinutes * 60_000).toISOString(), settings: effectiveSettings, currentQuestion: 0, questions, answers: {}, flaggedQuestionIds: [], status: "active" });
    setView("confirm");
  };
  const start = async () => {
    if (!draft) return;
    completionLockRef.current = false;
    await saveActiveExam(draft);
    setSession(draft);
    setCurrentPage(0);
    setNow(Date.now());
    setView("exam");
  };
  const choose = (questionId: string, answer: string) => {
    if (!session || session.status !== "active") return;
    const answers = { ...session.answers };
    if (answers[questionId] === answer) delete answers[questionId]; else answers[questionId] = answer;
    const next = { ...session, answers };
    setSession(next);
    queueSessionSave(next);
  };
  const toggleFlag = (questionId: string) => {
    if (!session || session.status !== "active") return;
    const flags = new Set(session.flaggedQuestionIds ?? []);
    if (flags.has(questionId)) flags.delete(questionId); else flags.add(questionId);
    const next = { ...session, flaggedQuestionIds: Array.from(flags) };
    setSession(next);
    queueSessionSave(next);
  };
  const changePage = (nextPage: number) => {
    if (!session) return;
    const totalPages = Math.max(1, Math.ceil(session.questions.length / QUESTIONS_PER_PAGE));
    setCurrentPage(Math.max(0, Math.min(totalPages - 1, nextPage)));
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" })));
  };
  const goToEnd = () => {
    if (!session) return;
    if (session.questions.length > LONG_EXAM_THRESHOLD) changePage(Math.ceil(session.questions.length / QUESTIONS_PER_PAGE) - 1);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: document.documentElement.scrollHeight, left: 0, behavior: "auto" })));
  };
  const discard = async () => {
    if (!session) return;
    await cancelPendingSave();
    await discardActiveExam(session.examId);
    completionLockRef.current = false;
    setSession(null);
    setView("hub");
  };

  const activeSession = session && session.status === "active" ? session : null;
  const answered = session ? Object.keys(session.answers).length : 0;
  const flagged = session?.flaggedQuestionIds?.length ?? 0;
  const totalPages = session ? Math.max(1, Math.ceil(session.questions.length / QUESTIONS_PER_PAGE)) : 1;
  const isLongExam = Boolean(session && session.questions.length > LONG_EXAM_THRESHOLD);
  const visibleStart = isLongExam ? currentPage * QUESTIONS_PER_PAGE : 0;
  const visibleQuestions = session ? session.questions.slice(visibleStart, isLongExam ? visibleStart + QUESTIONS_PER_PAGE : undefined) : [];
  const reviewItems = useMemo(() => result?.questionResults.filter((item) => reviewFilter === "all" || item.status === reviewFilter) ?? [], [result, reviewFilter]);

  if (view === "hub") return <section className="page-section mock-hub"><button className="back-btn" onClick={onBack}><ArrowLeft size={17}/> Back</button><p className="kicker">MOCK TEST · PHASE‑4</p><h1>Test yourself.</h1><p className="lead-copy">A focused vocabulary exam with no answer feedback until submission.</p>{activeSession && <section className="resume-exam"><FileClock size={20}/><div><strong>Unfinished Mock Test</strong><span>{activeSession.questions.length} questions · {formatTime(Math.max(0, Math.ceil((Date.parse(activeSession.expiresAt) - Date.now()) / 1000)))} remaining</span></div><button onClick={() => { setNow(Date.now()); setCurrentPage(0); setView("exam"); }}>Resume</button></section>}<div className="mock-hub-actions"><button className="primary-btn" onClick={() => setView("setup")}><Play size={17}/> Start New Test</button><button className="secondary-btn" onClick={() => { void refreshHistory(); setView("history"); }}><History size={17}/> Exam History</button></div></section>;
  if (view === "setup") return <section className="page-section exam-setup"><button className="back-btn" onClick={() => setView("hub")}><ArrowLeft size={17}/> Mock Test</button><p className="kicker">EXAM SETUP</p><h1>Set your conditions.</h1><div className="setup-list"><label>Vocabulary Source<select value={settings.source} onChange={(event) => setSettings({ ...settings, source: event.target.value })}><option value="all">All Vocabulary</option>{alphabet.map((letter) => <option key={letter} value={letter}>{letter} Vocabulary</option>)}</select></label><label>Question Type<select disabled value="mixed"><option>Mixed</option></select></label><label>Questions<select value={settings.questionCount} onChange={(event) => setSettings({ ...settings, questionCount: Number(event.target.value) as ExamSettings["questionCount"] })}>{questionCounts.map((count) => <option key={count} value={count}>{count}</option>)}</select></label><label>Time<select value={settings.timeMinutes} onChange={(event) => setSettings({ ...settings, timeMinutes: Number(event.target.value) as ExamSettings["timeMinutes"] })}>{timeLimits.map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}</select></label><label>Difficulty<select value={settings.difficulty} onChange={(event) => setSettings({ ...settings, difficulty: event.target.value as ExamSettings["difficulty"] })}><option value="all">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="advanced">Advanced</option></select></label><label>Negative Marking<select value={settings.negativeMarking} onChange={(event) => setSettings({ ...settings, negativeMarking: Number(event.target.value) as ExamSettings["negativeMarking"] })}><option value={0}>Off</option><option value={0.25}>−0.25</option><option value={0.5}>−0.50</option></select></label></div><button className="primary-btn setup-start" onClick={() => void prepare()}>Prepare Test <ArrowRight size={17}/></button><p className="note">Only real local vocabulary is used. If fewer valid questions exist, the test is limited safely.</p></section>;
  if (view === "confirm" && draft) return <section className="page-section exam-confirm"><button className="back-btn" onClick={() => setView("setup")}><ArrowLeft size={17}/> Edit setup</button><p className="kicker">READY TO BEGIN</p><h1>Mock Test</h1><div className="exam-rule-card"><p><b>{draft.questions.length}</b> Questions</p><p><b>{draft.settings.timeMinutes}</b> Minutes</p><p><b>{draft.settings.negativeMarking ? `−${draft.settings.negativeMarking}` : "Off"}</b> Negative marking</p></div><div className="exam-rules"><p><LockKeyhole size={16}/> No answer feedback during the test.</p><p><Timer size={16}/> The timer submits automatically at zero.</p><p><Flag size={16}/> Answers and flags remain saved if the page refreshes.</p></div><button className="primary-btn" onClick={() => void start()}>Start Exam <Play size={17}/></button></section>;
  if (view === "exam" && session) return <section className="mock-exam-shell"><header className="mock-exam-top"><div><div className="mock-exam-title"><b>MOCK TEST</b><strong className={remaining <= 60 ? "critical" : remaining <= 180 ? "warning" : ""}><Clock3 size={16}/>{formatTime(remaining)}</strong></div><p><b>{answered}</b> answered · {isLongExam ? `${visibleStart + 1}–${visibleStart + visibleQuestions.length} / ` : ""}{session.questions.length} questions</p><div className="mock-exam-progress"><i style={{ width: `${session.questions.length ? Math.round((answered / session.questions.length) * 100) : 0}%` }} /></div></div><div className="mock-exam-actions"><button type="button" onClick={goToEnd}>শেষে যান</button><button type="button" className="danger" onClick={() => setSubmitPrompt(true)}>Submit</button></div></header><main className="mock-exam-list">{visibleQuestions.map((question, index) => <ExamQuestionCard key={question.id} question={question} index={visibleStart + index} answer={session.answers[question.id]} flagged={Boolean(session.flaggedQuestionIds?.includes(question.id))} onAnswer={choose} onFlag={toggleFlag} />)}{isLongExam && <nav className="mock-page-nav" aria-label="Mock question pages"><button type="button" className="secondary-btn" disabled={currentPage === 0} onClick={() => changePage(currentPage - 1)}>← আগের ৫০</button><span>পৃষ্ঠা {currentPage + 1} / {totalPages}<small>{visibleStart + 1}–{visibleStart + visibleQuestions.length}</small></span><button type="button" className="primary-btn" disabled={currentPage === totalPages - 1} onClick={() => changePage(currentPage + 1)}>পরের ৫০ →</button></nav>}<div className="mock-exam-end"><button type="button" className="back-btn" onClick={() => { if (window.confirm("Exit and discard this unfinished Mock Test?")) void discard(); }}><ArrowLeft size={16}/> Exit & discard</button><button type="button" className="submit-exam" onClick={() => setSubmitPrompt(true)}>Submit Mock Test</button></div></main>{submitPrompt && <div className="exam-modal"><section><TriangleAlert size={22}/><h2>Submit your test?</h2><p>Answered: {answered} / {session.questions.length}</p><p>Unanswered: {session.questions.length - answered} · Flagged: {flagged}</p><div><button className="secondary-btn" onClick={() => setSubmitPrompt(false)}>Cancel</button><button className="primary-btn" onClick={() => void complete("submitted")}>Submit Test</button></div></section></div>}</section>;
  if (view === "result" && result) {
    const attempted = result.correct + result.wrong;
    const reviewWrong = () => { setReviewFilter("wrong"); setView("review"); };
    return <section className="page-section exam-result"><ResultSummary record={result}/><section className="result-stat-grid"><span><CircleCheck size={17}/><b>{result.correct}</b><small>Correct</small></span><span className="wrong"><CircleX size={17}/><b>{result.wrong}</b><small>Wrong</small></span><span><b>{result.skipped}</b><small>Skipped</small></span><span><b>{attempted ? `${result.accuracy}%` : "—"}</b><small>Accuracy</small></span></section><section className="result-insight-card"><p className="kicker">PERFORMANCE ANALYSIS</p><p>{result.wrong ? `${result.wrong} wrong answer${result.wrong === 1 ? "" : "s"} moved into your local learning evidence. Review those first, then continue Smart Revision.` : attempted ? "No wrong answer was recorded in this test. Keep building evidence with another focused session." : "No answer was recorded. Your unfinished areas are still visible in the exam review."}</p><div><span>Positive marks <b>{result.positiveMarks}</b></span><span>Negative marks <b>{result.negativeMarks}</b></span><span>Attempt rate <b>{result.totalQuestions ? Math.round((attempted / result.totalQuestions) * 100) : 0}%</b></span></div></section><section className="result-priority-card"><div><p className="kicker">YOUR NEXT 3 STEPS</p><h2>Priority Revision</h2></div><ol><li><button onClick={reviewWrong}><span>1</span><div><b>Review wrong answers</b><small>{result.wrong ? `${result.wrong} question${result.wrong === 1 ? "" : "s"} need attention` : "No wrong answers in this result"}</small></div><ArrowRight size={17}/></button></li><li><button onClick={() => onOpenRevision ? onOpenRevision() : setView("review")}><span>2</span><div><b>Open Smart Revision</b><small>Use your saved mistake and mastery evidence</small></div><ArrowRight size={17}/></button></li><li><button onClick={() => { setSettings(initialSettings); setView("setup"); }}><span>3</span><div><b>Start another Mock Test</b><small>Build a stronger performance signal</small></div><ArrowRight size={17}/></button></li></ol></section><div className="mock-hub-actions result-actions"><button className="primary-btn" onClick={() => setView("review")}>Review Answers <BookOpenCheck size={17}/></button><button className="secondary-btn" onClick={() => { setSettings(initialSettings); setView("setup"); }}><RotateCcw size={17}/> New Mock Test</button><button className="secondary-btn" onClick={onBack}>Back to Dashboard</button></div></section>;
  }
  if (view === "review" && result) return <section className="page-section exam-review"><button className="back-btn" onClick={() => setView("result")}><ArrowLeft size={17}/> Result</button><p className="kicker">EXAM REVIEW</p><h1>Review answers.</h1><div className="review-filters">{(["all", "wrong", "correct", "skipped"] as const).map((filter) => <button key={filter} className={reviewFilter === filter ? "active" : ""} onClick={() => setReviewFilter(filter)}>{filter} <span>{result.questionResults.filter((item) => filter === "all" || item.status === filter).length}</span></button>)}</div><div className="review-list">{reviewItems.map((question) => { const ordinal = result.questionResults.findIndex((item) => item.id === question.id) + 1; return <article key={question.id} className={question.status}><header><p className="kicker">QUESTION {ordinal}</p><span>{question.status}</span></header><h2>{question.prompt}</h2><div className="review-options">{question.options.map((option) => <p key={`${question.id}-${option}`} className={`${option === question.correctOption ? "correct-option" : ""} ${option === question.selectedOption && option !== question.correctOption ? "wrong-option" : ""}`}><b>{option}</b>{option === question.selectedOption && <small>Your answer</small>}{option === question.correctOption && <small>Correct answer</small>}</p>)}</div><p className="review-meaning">Bengali meaning <b>{question.meaningBn}</b></p>{question.tip && <div className="review-tip"><Sparkles size={16}/>{question.tip}</div>}</article>; })}</div></section>;
  return <section className="page-section exam-history"><button className="back-btn" onClick={onBack}><ArrowLeft size={17}/> Back</button><p className="kicker">EXAM HISTORY</p><h1>Past Mock Tests.</h1>{history.length ? <div className="history-list">{history.map((record) => <button key={record.examId} onClick={() => { setResult(record); setView("result"); }}><span>{new Date(record.completedAt).toLocaleDateString()}</span><strong>{record.finalScore} / {record.totalQuestions}</strong><small>{record.accuracy}% accuracy · {formatTime(record.durationSeconds)}</small><ChevronRight size={17}/></button>)}</div> : <div className="empty-card"><History size={22}/><h2>No mock tests yet.</h2><p>Complete your first test to build your exam history.</p><button className="primary-btn" onClick={() => setView("setup")}>Start Mock Test</button></div>}</section>;
}
