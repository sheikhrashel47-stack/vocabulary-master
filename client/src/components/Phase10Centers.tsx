// Phase-10 activation: these centers route to existing local learning engines; they do not invent a second scoring pipeline.
import { ArrowLeft, ArrowRight, BookOpenCheck, BrainCircuit, CircleAlert, FileClock, Layers3, ListChecks, Sparkles, Target } from "lucide-react";
import type { AppPage } from "@/components/AppShell";
type Router = (page: AppPage) => void;
const practiceCards:{title:string;detail:string;icon:typeof Sparkles;route:AppPage;badge:string}[]=[
  {title:"Flashcards",detail:"Turn over words and study from your local library.",icon:Layers3,route:"flashcards",badge:"Study"},
  {title:"Smart Revision",detail:"Due words, weak words and recent mistakes in priority order.",icon:BrainCircuit,route:"revision",badge:"Evidence"},
  {title:"Mistake Practice",detail:"Open words previously answered incorrectly.",icon:CircleAlert,route:"mistakes",badge:"Review"},
  {title:"Mastery Practice",detail:"See tracked words, progress and next revision priority.",icon:Target,route:"mastery",badge:"Progress"},
  {title:"Full Mock",detail:"Scored examination with saved timer, flags, history and result review.",icon:FileClock,route:"mock",badge:"Exam"},
];
export function PracticeCenter({onNavigate}:{onNavigate:Router}){return <section className="page-section center-page"><p className="kicker">PHASE‑10 · PRACTICE CENTER</p><h1>Choose a focused study mode.</h1><p className="lead-copy">Every mode uses your own local vocabulary. Results and revision evidence remain connected.</p><div className="center-grid">{practiceCards.map(card=>{const Icon=card.icon;return <button key={card.title} className="center-card" onClick={()=>onNavigate(card.route)}><Icon size={21}/><span><small>{card.badge}</small><strong>{card.title}</strong><em>{card.detail}</em></span><ArrowRight size={17}/></button>})}</div></section>}
const examCards:{title:string;detail:string;icon:typeof FileClock;route:AppPage;caption:string}[]=[
  {title:"Quick Test",detail:"Select a compact exam from the proven Mock setup.",icon:FileClock,route:"mock",caption:"5–100 questions"},
  {title:"Custom Test",detail:"Set source, letter, count, duration, difficulty and negative marking.",icon:ListChecks,route:"mock",caption:"Your configuration"},
  {title:"Full Mock Test",detail:"Admission Hub-style paged mock engine with stable scroll and review.",icon:BookOpenCheck,route:"mock",caption:"Long-session safe"},
  {title:"Weakness Review",detail:"Use the Mastery panel to identify evidence-backed weak areas first.",icon:Target,route:"mastery",caption:"Evidence-backed"},
  {title:"Mistake Test",detail:"Review recent and recurring errors through the Mistake Bank.",icon:CircleAlert,route:"mistakes",caption:"Priority errors"},
];
export function ExamCenter({onNavigate}:{onNavigate:Router}){return <section className="page-section center-page"><p className="kicker">PHASE‑10 · EXAM CENTER</p><h1>Build a test around your words.</h1><p className="lead-copy">The existing Mock Test is the single scored exam engine, so timer, autosave, review, history, mastery and rewards stay consistent.</p><div className="center-grid">{examCards.map(card=>{const Icon=card.icon;return <button key={card.title} className="center-card" onClick={()=>onNavigate(card.route)}><Icon size={21}/><span><small>{card.caption}</small><strong>{card.title}</strong><em>{card.detail}</em></span><ArrowRight size={17}/></button>})}</div><section className="center-note"><Sparkles size={17}/><span><strong>Honest activation.</strong> No answer, score, XP or challenge completion is invented outside an actual study or Mock session.</span></section></section>}
