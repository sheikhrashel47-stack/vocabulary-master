// Scholar’s Ledger reminder: a calm, narrow mobile reading desk with immediate navigation and no decorative clutter.
import { BookOpenText, History, House, LockKeyhole, UserRound } from "lucide-react";
import type { ReactNode } from "react";

export type AppPage = "home" | "bank" | "category" | "parser" | "practice" | "mock" | "history" | "mistakes" | "revision" | "mastery" | "profile" | "settings" | "rewards" | "tools" | "today" | "flashcards" | "favorites" | "difficult" | "pinned" | "lists" | "random" | "tutor" | "detail";

const navigation: Array<{ key: AppPage; label: string; icon: typeof House; locked?: boolean }> = [
  { key: "home", label: "Home", icon: House },
  { key: "bank", label: "Bank", icon: BookOpenText },
  { key: "practice", label: "Practice", icon: LockKeyhole },
  { key: "history", label: "History", icon: History },
  { key: "profile", label: "Profile", icon: UserRound },
];
const logoAsset = "https://mocktest84-g8afqveb.manus.space/manus-storage/vocabulary-master-mark_cabe734c.png";

type AppShellProps = { page: AppPage; onNavigate: (page: AppPage) => void; onProfile: () => void; children: ReactNode };

export function AppShell({ page, onNavigate, onProfile, children }: AppShellProps) {
  return <div className="app-shell"><header className="topbar"><button className="brand-mark" onClick={() => onNavigate("home")} aria-label="Vocabulary Master home"><img src={logoAsset} alt="Vocabulary Master" /></button><div className="topbar-title"><span>VOCABULARY MASTER</span><strong>Study with clarity.</strong></div><button className="profile-shortcut" onClick={onProfile} aria-label="Open profile"><UserRound size={18} /></button></header><main className="app-main">{children}</main><nav className="bottom-nav" aria-label="Primary navigation">{navigation.map((item) => { const Icon = item.icon; const isActive = page === item.key; return <button key={item.key} onClick={() => onNavigate(item.key)} className={`nav-item ${isActive ? "active" : ""} ${item.locked ? "locked" : ""}`} aria-current={isActive ? "page" : undefined}><Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} /><span>{item.label}</span>{item.locked && <i aria-hidden="true" />}</button>; })}</nav></div>;
}
