// Scholar’s Ledger reminder: calm academic reading surfaces, truthful empty states, and locked future tools only.
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookMarked, ChevronRight, Heart, LockKeyhole, Search, Settings2, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, type AppPage } from "@/components/AppShell";
import { alphabet, sampleVocabulary, type VocabularyWord } from "@/data/vocabulary";
import { getAllWords, initializeVocabularyDb, saveWords } from "@/lib/vocabulary-db";

type Page = AppPage;
const asset = (name: string) => `https://mocktest84-g8afqveb.manus.space/manus-storage/${name}`;

function findMatch(word: VocabularyWord, value: string) {
  const q = value.trim().toLowerCase();
  return !q || [word.word, word.meaningBn, ...word.synonyms, ...word.antonyms].join(" ").toLowerCase().includes(q);
}

function EmptyIcon({ children }: { children: React.ReactNode }) { return <div className="empty-icon">{children}</div>; }

function Dashboard({ onBank }: { onBank: () => void }) {
  return <section className="page-section dashboard-page">
    <section className="hero-card">
      <div><p className="kicker">PREMIUM LIGHT · PHASE‑1</p><h1>Your vocabulary desk.</h1><p>Build your vocabulary, one clear word at a time.</p></div>
      <img src={asset("vocabulary-master-ledger-hero_894f14a1.png")} alt="Open study notebook and emerald bookmark" />
    </section>
    <div className="ledger-rule" />
    <section className="overview-card"><EmptyIcon><BookMarked size={22}/></EmptyIcon><div><p className="kicker">TODAY OVERVIEW</p><h2>Your vocabulary desk is ready.</h2><p>You have not started a learning record yet. Explore the Bank to begin with a word that matters.</p><button className="primary-btn" onClick={onBank}>Explore Vocabulary Bank <ArrowRight size={17}/></button></div></section>
    <section className="quiet-block"><p className="kicker">QUICK ACCESS</p><h2>Keep it simple.</h2><div className="quick-grid"><button onClick={onBank}><BookMarked size={19}/><strong>Browse words</strong><small>A–Z index</small></button><button onClick={() => toast.info("Practice tools are locked in Phase‑1.")}><LockKeyhole size={19}/><strong>Practice</strong><small>Coming later</small></button></div></section>
    <section className="future-card"><img src={asset("vocabulary-master-bank-still-life_fdc11b09.png")} alt="Blank index cards"/><div><p className="kicker">FUTURE DATA SLOT</p><strong>Learning insights will appear here.</strong><span>Only after real study activity exists.</span></div></section>
  </section>;
}

function WordItem({ word, onOpen, saved, onSave }: { word: VocabularyWord; onOpen: () => void; saved: boolean; onSave: () => void }) {
  return <article className="word-item"><button onClick={onOpen}><div><h3>{word.word}</h3><p>{word.meaningBn}</p><small>{word.synonyms.slice(0, 3).join(" · ")}</small></div><ChevronRight size={18}/></button><button className={saved ? "saved" : ""} onClick={onSave} aria-label={`Save ${word.word}`}><Heart size={18} fill={saved ? "currentColor" : "none"}/></button></article>;
}

function Bank({ words, saved, setSaved, onOpen }: { words: VocabularyWord[]; saved: Set<string>; setSaved: (id: string) => void; onOpen: (word: VocabularyWord) => void }) {
  const [input, setInput] = useState(""); const [query, setQuery] = useState(""); const [letter, setLetter] = useState("ALL");
  useEffect(() => { const id = window.setTimeout(() => setQuery(input), 180); return () => window.clearTimeout(id); }, [input]);
  const counts = useMemo(() => Object.fromEntries(alphabet.map((l) => [l, words.filter((w) => w.firstLetter === l).length])), [words]);
  const result = useMemo(() => words.filter((w) => (letter === "ALL" || w.firstLetter === letter) && findMatch(w, query)), [words, letter, query]);
  return <section className="page-section"><div className="page-title"><div><p className="kicker">VOCABULARY BANK</p><h1>Find the right word.</h1></div><span>Sample data</span></div><label className="search-field"><Search size={19}/><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search word, meaning, synonym…"/></label><div className="alphabet-grid"><button className={letter === "ALL" ? "on" : ""} onClick={() => setLetter("ALL")}>All</button>{alphabet.map((l) => <button key={l} disabled={!counts[l]} className={letter === l ? "on" : ""} onClick={() => setLetter(l)}>{l}<small>{counts[l] || ""}</small></button>)}</div><div className="result-header"><div><p className="kicker">{letter === "ALL" ? "ALL WORDS" : `${letter} VOCABULARY`}</p><h2>{result.length ? `${result.length} result${result.length === 1 ? "" : "s"}` : "No vocabulary found."}</h2></div>{input && <button onClick={() => setInput("")}>Clear</button>}</div>{result.length ? <div className="word-list">{result.map((word) => <WordItem key={word.id} word={word} saved={saved.has(word.id)} onSave={() => setSaved(word.id)} onOpen={() => onOpen(word)}/>)}</div> : <div className="empty-card"><Search size={22}/><h2>No vocabulary found.</h2><p>Try another word or meaning.</p></div>}</section>;
}

function Detail({ word, saved, onSave, onBack }: { word: VocabularyWord; saved: boolean; onSave: () => void; onBack: () => void }) {
  const section = (title: string, values: string[]) => <section className="detail-section"><p className="kicker">{title.toUpperCase()}</p><div>{values.map((value) => <span key={value}>{value}</span>)}</div></section>;
  return <section className="page-section"><button className="back-btn" onClick={onBack}><ArrowLeft size={17}/> Back to Bank</button><section className="word-hero"><div><p className="kicker">{word.firstLetter} · {word.category.toUpperCase()}</p><h1>{word.word}</h1><p>{word.meaningBn}</p></div><img src={asset("vocabulary-master-word-detail_d468e227.png")} alt="Academic paper detail"/></section><div className="ledger-rule"/>{section("Synonyms", word.synonyms)}{section("Antonyms", word.antonyms)}{word.tip && <section className="tip-card"><Sparkles size={18}/><div><p className="kicker">MEMORY TIP</p><strong>{word.tip}</strong></div></section>}<div className="detail-actions"><button className={saved ? "secondary-btn saved" : "secondary-btn"} onClick={onSave}><Heart size={17} fill={saved ? "currentColor" : "none"}/>{saved ? "Saved to favorites" : "Save word"}</button><button className="secondary-btn" onClick={() => toast.info("Practice is locked in Phase‑1.")}><LockKeyhole size={16}/> Practice locked</button><button className="icon-btn" onClick={() => toast.info("Audio will be available in a future phase.")}><Volume2 size={18}/></button></div></section>;
}

function LockedPractice() { return <section className="page-section locked-page"><p className="kicker"><LockKeyhole size={14}/> PHASE‑1 · LOCKED</p><h1>Practice will open later.</h1><p>Vocabulary Master-এর learning tools এখনো সক্রিয় নয়। এখন Bank তৈরি করুন, শব্দ খুঁজুন এবং learning foundation প্রস্তুত রাখুন।</p><div><span><LockKeyhole size={15}/> Match, Mock, Flash ও Revision</span><small>Future architecture is ready</small></div></section>; }
function History({ onBank }: { onBank: () => void }) { return <section className="page-section center-empty"><EmptyIcon><BookMarked size={23}/></EmptyIcon><p className="kicker">HISTORY</p><h1>No activity yet.</h1><p>Start exploring the Vocabulary Bank. Your future learning activity will appear here.</p><button className="secondary-btn" onClick={onBank}>Open Vocabulary Bank <ArrowRight size={16}/></button></section>; }
function Profile({ onSettings }: { onSettings: () => void }) { return <section className="page-section"><p className="kicker">PROFILE</p><h1>Your vocabulary journey.</h1><section className="profile-card"><img src={asset("vocabulary-master-mark_cabe734c.png")} alt="Vocabulary Master mark"/><div><strong>Vocabulary Master</strong><span>Phase‑1 foundation</span></div></section><div className="settings-list"><button onClick={onSettings}><Settings2 size={19}/><span>Settings</span><ChevronRight size={18}/></button><button onClick={() => toast.info("Favorites will appear after you save words.")}><Heart size={19}/><span>Favorites</span><ChevronRight size={18}/></button></div></section>; }
function Settings() { return <section className="page-section"><p className="kicker">SETTINGS</p><h1>Keep your desk calm.</h1><div className="settings-list"><div><span>◐</span><p><strong>Appearance</strong><small>Premium Light · active</small></p><b>Active</b></div><div><span>⌁</span><p><strong>Motion</strong><small>Respects device reduced-motion preference</small></p></div><div><span>▣</span><p><strong>Data foundation</strong><small>Local IndexedDB · version 1</small></p></div><div><LockKeyhole size={18}/><p><strong>Import & export</strong><small>Available in a future phase</small></p></div></div><p className="note">Only implemented settings are shown in Phase‑1.</p></section>; }

export default function Home() {
  const [page, setPage] = useState<Page>("home"); const [selected, setSelected] = useState<VocabularyWord | null>(null); const [words, setWords] = useState<VocabularyWord[]>(sampleVocabulary); const [saved, setSaved] = useState<Set<string>>(new Set()); const [ready, setReady] = useState(false); const [welcome, setWelcome] = useState(() => localStorage.getItem("vm-onboarding-seen") !== "1");
  useEffect(() => { initializeVocabularyDb().then(async () => { const records = await getAllWords(); if (records.length) setWords(records); else await saveWords(sampleVocabulary); setReady(true); }).catch(() => toast.error("Something went wrong while preparing local data.")); }, []);
  const navigate = (next: Page) => { setPage(next); window.scrollTo({ top: 0, behavior: "auto" }); };
  const toggleSaved = (id: string) => setSaved((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const openWord = (word: VocabularyWord) => { setSelected(word); navigate("detail"); };
  const pageView = page === "home" ? <Dashboard onBank={() => navigate("bank")}/> : page === "bank" ? <Bank words={words} saved={saved} setSaved={toggleSaved} onOpen={openWord}/> : page === "detail" && selected ? <Detail word={selected} saved={saved.has(selected.id)} onSave={() => toggleSaved(selected.id)} onBack={() => navigate("bank")}/> : page === "practice" ? <LockedPractice/> : page === "history" ? <History onBank={() => navigate("bank")}/> : page === "profile" ? <Profile onSettings={() => navigate("settings")}/> : <Settings/>;
  const closeWelcome = (goBank = false) => { localStorage.setItem("vm-onboarding-seen", "1"); setWelcome(false); if (goBank) navigate("bank"); };
  return <><AppShell page={page} onNavigate={navigate} onProfile={() => navigate("profile")}>{pageView}{!ready && <p className="db-status">Preparing local vocabulary desk…</p>}</AppShell>{welcome && <div className="welcome-layer"><section className="welcome-sheet"><img src={asset("vocabulary-master-mark_cabe734c.png")} alt="Vocabulary Master"/><p className="kicker">VOCABULARY MASTER</p><h1>Learn smarter.<br/>Build your vocabulary.</h1><p>Start with a clean word bank. Learning tools stay locked until a future phase.</p><button className="primary-btn" onClick={() => closeWelcome(true)}>Explore Vocabulary Bank <ArrowRight size={17}/></button><button className="skip" onClick={() => closeWelcome()}>Skip for now</button></section></div>}</>;
}
