// Scholar’s Ledger reminder: calm academic reading surfaces, truthful empty states, paged lists, and locked future tools only.
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookMarked, ChevronRight, Heart, LockKeyhole, Search, Settings2, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, type AppPage } from "@/components/AppShell";
import { alphabet, sampleVocabulary, type VocabularyWord } from "@/data/vocabulary";
import { getLetterCounts, getWordPage, initializeVocabularyDb, saveWords, toggleWordFavorite } from "@/lib/vocabulary-db";
import { futureTools } from "@/lib/tool-registry";

type Page = AppPage;
type BankView = { input: string; query: string; letter: string; limit: number };
const PAGE_SIZE = 50;
const asset = (name: string) => `https://mocktest84-g8afqveb.manus.space/manus-storage/${name}`;

function EmptyIcon({ children }: { children: React.ReactNode }) { return <div className="empty-icon">{children}</div>; }

function Dashboard({ onBank }: { onBank: () => void }) {
  return <section className="page-section dashboard-page">
    <section className="hero-card"><div><p className="kicker">PREMIUM LIGHT · PHASE‑1</p><h1>Your vocabulary desk.</h1><p>Build your vocabulary, one clear word at a time.</p></div><img src={asset("vocabulary-master-ledger-hero_894f14a1.png")} alt="Open study notebook and emerald bookmark" /></section>
    <div className="ledger-rule" />
    <section className="overview-card"><EmptyIcon><BookMarked size={22}/></EmptyIcon><div><p className="kicker">TODAY OVERVIEW</p><h2>Your vocabulary desk is ready.</h2><p>You have not started a learning record yet. Explore the Bank to begin with a word that matters.</p><button className="primary-btn" onClick={onBank}>Explore Vocabulary Bank <ArrowRight size={17}/></button></div></section>
    <section className="quiet-block"><p className="kicker">QUICK ACCESS</p><h2>Keep it simple.</h2><div className="quick-grid"><button onClick={onBank}><BookMarked size={19}/><strong>Browse words</strong><small>A–Z index</small></button><button onClick={() => toast.info("Practice tools are locked in Phase‑1.")}><LockKeyhole size={19}/><strong>Practice</strong><small>Coming later</small></button></div></section>
    <section className="future-card"><img src={asset("vocabulary-master-bank-still-life_fdc11b09.png")} alt="Blank index cards"/><div><p className="kicker">FUTURE DATA SLOT</p><strong>Learning insights will appear here.</strong><span>Only after real study activity exists.</span></div></section>
  </section>;
}

function WordItem({ word, onOpen, onSave }: { word: VocabularyWord; onOpen: () => void; onSave: () => void }) {
  return <article className="word-item"><button onClick={onOpen}><div><h3>{word.word}</h3><p>{word.meaningBn}</p><small>{word.synonyms.slice(0, 3).join(" · ")}</small></div><ChevronRight size={18}/></button><button className={word.favorite ? "saved" : ""} onClick={onSave} aria-label={`Save ${word.word}`}><Heart size={18} fill={word.favorite ? "currentColor" : "none"}/></button></article>;
}

function Bank({ ready, view, onChange, refreshKey, onOpen, onSave, restoreTop, onRestored }: { ready: boolean; view: BankView; onChange: (next: BankView) => void; refreshKey: number; onOpen: (word: VocabularyWord) => void; onSave: (id: string) => void; restoreTop: number | null; onRestored: () => void }) {
  const [items, setItems] = useState<VocabularyWord[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => { const timer = window.setTimeout(() => onChange({ ...view, query: view.input.trim(), limit: PAGE_SIZE }), 220); return () => window.clearTimeout(timer); }, [view.input]);
  useEffect(() => { if (!ready) return; getLetterCounts().then(setCounts).catch(() => toast.error("The vocabulary index could not be loaded.")); }, [ready, refreshKey]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    setLoading(true);
    getWordPage({ letter: view.letter, query: view.query, limit: view.limit }).then((page) => { if (active) { setItems(page.items); setHasMore(page.hasMore); } }).catch(() => { if (active) toast.error("The vocabulary list could not be loaded."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ready, view.letter, view.query, view.limit, refreshKey]);
  useEffect(() => {
    if (restoreTop === null || loading) return;
    const frame = window.requestAnimationFrame(() => { window.scrollTo({ top: restoreTop, behavior: "auto" }); onRestored(); });
    return () => window.cancelAnimationFrame(frame);
  }, [restoreTop, loading, items.length]);

  const setInput = (input: string) => onChange({ ...view, input, limit: PAGE_SIZE });
  const chooseLetter = (letter: string) => onChange({ ...view, letter, limit: PAGE_SIZE });
  const clearSearch = () => onChange({ ...view, input: "", query: "", limit: PAGE_SIZE });

  return <section className="page-section"><div className="page-title"><div><p className="kicker">VOCABULARY BANK</p><h1>Find the right word.</h1></div><span>Sample data</span></div><label className="search-field"><Search size={19}/><input value={view.input} onChange={(event) => setInput(event.target.value)} placeholder="Search word, meaning, synonym or antonym…" aria-label="Search vocabulary"/></label><div className="alphabet-grid"><button className={view.letter === "ALL" ? "on" : ""} onClick={() => chooseLetter("ALL")}>All</button>{alphabet.map((letter) => <button key={letter} disabled={!counts[letter]} className={view.letter === letter ? "on" : ""} onClick={() => chooseLetter(letter)}>{letter}<small>{counts[letter] || ""}</small></button>)}</div><div className="result-header" aria-live="polite"><div><p className="kicker">{view.letter === "ALL" ? "ALL WORDS" : `${view.letter} VOCABULARY`}</p><h2>{loading ? "Loading vocabulary…" : items.length ? `${items.length}${hasMore ? "+" : ""} words` : "No vocabulary found."}</h2></div>{view.input && <button onClick={clearSearch}>Clear</button>}</div>{items.length ? <><div className="word-list">{items.map((word) => <WordItem key={word.id} word={word} onSave={() => onSave(word.id)} onOpen={() => onOpen(word)}/>)}</div>{hasMore && <button className="load-more" onClick={() => onChange({ ...view, limit: view.limit + PAGE_SIZE })}>Load 50 more words</button>}</> : !loading && <div className="empty-card"><Search size={22}/><h2>No vocabulary found.</h2><p>Try another word or meaning.</p></div>}</section>;
}

function Detail({ word, onSave, onBack }: { word: VocabularyWord; onSave: () => void; onBack: () => void }) {
  const section = (title: string, values: string[]) => <section className="detail-section"><p className="kicker">{title.toUpperCase()}</p><div>{values.map((value) => <span key={value}>{value}</span>)}</div></section>;
  return <section className="page-section"><button className="back-btn" onClick={onBack}><ArrowLeft size={17}/> Back to Bank</button><section className="word-hero"><div><p className="kicker">{word.firstLetter} · {word.category.toUpperCase()}</p><h1>{word.word}</h1><p>{word.meaningBn}</p></div><img src={asset("vocabulary-master-word-detail_d468e227.png")} alt="Academic paper detail"/></section><div className="ledger-rule"/>{section("Synonyms", word.synonyms)}{section("Antonyms", word.antonyms)}{word.tip && <section className="tip-card"><Sparkles size={18}/><div><p className="kicker">MEMORY TIP</p><strong>{word.tip}</strong></div></section>}<div className="detail-actions"><button className={word.favorite ? "secondary-btn saved" : "secondary-btn"} onClick={onSave}><Heart size={17} fill={word.favorite ? "currentColor" : "none"}/>{word.favorite ? "Saved to favorites" : "Save word"}</button><button className="secondary-btn" onClick={() => toast.info("Practice is locked in Phase‑1.")}><LockKeyhole size={16}/> Practice locked</button><button className="icon-btn" onClick={() => toast.info("Audio will be available in a future phase.")} aria-label="Audio is locked"><Volume2 size={18}/></button></div></section>;
}

function LockedPractice() { const labels = (["match", "mock", "flash", "revision"] as const).map((key) => futureTools[key].label).join(", "); return <section className="page-section locked-page"><p className="kicker"><LockKeyhole size={14}/> PHASE‑1 · LOCKED</p><h1>Practice will open later.</h1><p>Vocabulary Master-এর learning tools এখনো সক্রিয় নয়। এখন Bank তৈরি করুন, শব্দ খুঁজুন এবং learning foundation প্রস্তুত রাখুন।</p><div><span><LockKeyhole size={15}/>{labels}</span><small>Future architecture is ready</small></div></section>; }
function History({ onBank }: { onBank: () => void }) { return <section className="page-section center-empty"><EmptyIcon><BookMarked size={23}/></EmptyIcon><p className="kicker">HISTORY</p><h1>No activity yet.</h1><p>Start exploring the Vocabulary Bank. Your future learning activity will appear here.</p><button className="secondary-btn" onClick={onBank}>Open Vocabulary Bank <ArrowRight size={16}/></button></section>; }
function Profile({ onSettings }: { onSettings: () => void }) { return <section className="page-section"><p className="kicker">PROFILE</p><h1>Your vocabulary journey.</h1><section className="profile-card"><img src={asset("vocabulary-master-mark_cabe734c.png")} alt="Vocabulary Master mark"/><div><strong>Vocabulary Master</strong><span>Phase‑1 foundation</span></div></section><div className="settings-list"><button onClick={onSettings}><Settings2 size={19}/><span>Settings</span><ChevronRight size={18}/></button><button onClick={() => toast.info("Saved words are kept locally on this device.")}><Heart size={19}/><span>Favorites</span><ChevronRight size={18}/></button></div></section>; }
function Settings() { return <section className="page-section"><p className="kicker">SETTINGS</p><h1>Keep your desk calm.</h1><div className="settings-list"><div><span>◐</span><p><strong>Appearance</strong><small>Premium Light · active</small></p><b>Active</b></div><div><span>⌁</span><p><strong>Motion</strong><small>Respects device reduced-motion preference</small></p></div><div><span>▣</span><p><strong>Data foundation</strong><small>Local IndexedDB · version 2</small></p></div><div><LockKeyhole size={18}/><p><strong>Import & export</strong><small>Available in a future phase</small></p></div></div><p className="note">Only implemented settings are shown in Phase‑1.</p></section>; }

export default function Home() {
  const [page, setPage] = useState<Page>("home");
  const [selected, setSelected] = useState<VocabularyWord | null>(null);
  const [ready, setReady] = useState(false);
  const [favoriteRevision, setFavoriteRevision] = useState(0);
  const [restoreTop, setRestoreTop] = useState<number | null>(null);
  const [bankView, setBankView] = useState<BankView>({ input: "", query: "", letter: "ALL", limit: PAGE_SIZE });
  const bankScrollTop = useRef(0);
  const [welcome, setWelcome] = useState(() => localStorage.getItem("vm-onboarding-seen") !== "1");

  useEffect(() => { let active = true; initializeVocabularyDb().then(async () => { const existing = await getWordPage({ limit: 1 }); if (!existing.items.length) await saveWords(sampleVocabulary); if (active) setReady(true); }).catch(() => toast.error("Something went wrong while preparing local data.")); return () => { active = false; }; }, []);
  const navigate = (next: Page) => { setSelected(null); setPage(next); window.scrollTo({ top: 0, behavior: "auto" }); };
  const openWord = (word: VocabularyWord) => { bankScrollTop.current = window.scrollY; setSelected(word); setPage("detail"); window.scrollTo({ top: 0, behavior: "auto" }); };
  const returnToBank = () => { setSelected(null); setPage("bank"); setRestoreTop(bankScrollTop.current); };
  const toggleFavorite = async (id: string) => { try { const favorite = await toggleWordFavorite(id); setSelected((current) => current?.id === id ? { ...current, favorite } : current); setFavoriteRevision((value) => value + 1); toast.success(favorite ? "Word saved locally." : "Word removed from favorites."); } catch { toast.error("This word could not be saved."); } };
  const pageView = page === "home" ? <Dashboard onBank={() => navigate("bank")}/> : page === "bank" ? <Bank ready={ready} view={bankView} onChange={setBankView} refreshKey={favoriteRevision} onOpen={openWord} onSave={toggleFavorite} restoreTop={restoreTop} onRestored={() => setRestoreTop(null)}/> : page === "detail" && selected ? <Detail word={selected} onSave={() => toggleFavorite(selected.id)} onBack={returnToBank}/> : page === "practice" ? <LockedPractice/> : page === "history" ? <History onBank={() => navigate("bank")}/> : page === "profile" ? <Profile onSettings={() => navigate("settings")}/> : <Settings/>;
  const closeWelcome = (goBank = false) => { localStorage.setItem("vm-onboarding-seen", "1"); setWelcome(false); if (goBank) navigate("bank"); };
  return <><AppShell page={page} onNavigate={navigate} onProfile={() => navigate("profile")}>{pageView}{!ready && <p className="db-status">Preparing local vocabulary desk…</p>}</AppShell>{welcome && <div className="welcome-layer"><section className="welcome-sheet"><img src={asset("vocabulary-master-mark_cabe734c.png")} alt="Vocabulary Master"/><p className="kicker">VOCABULARY MASTER</p><h1>Learn smarter.<br/>Build your vocabulary.</h1><p>Start with a clean word bank. Learning tools stay locked until a future phase.</p><button className="primary-btn" onClick={() => closeWelcome(true)}>Explore Vocabulary Bank <ArrowRight size={17}/></button><button className="skip" onClick={() => closeWelcome()}>Skip for now</button></section></div>}</>;
}
