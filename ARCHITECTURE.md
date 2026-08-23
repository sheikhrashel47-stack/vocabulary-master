# Vocabulary Master Architecture

## Application layers

The app separates visual shell, route-level page state, vocabulary data and future tool contracts. `AppShell` owns the responsive header and navigation. `Home.tsx` holds the small Phase‑1 screen state. `data/vocabulary.ts` contains explicitly marked sample records, while `lib/vocabulary-db.ts` owns the versioned IndexedDB boundary.

| Layer | Responsibility | Phase‑1 status |
|---|---|---|
| App shell | Header, mobile bottom navigation, desktop rail | Active |
| Vocabulary Bank | A–Z index, debounced search, word rows and details | Active |
| IndexedDB | `words` and `settings` stores, DB version 1 | Active |
| History/Profile/Settings | Truthful empty and structural states | Active |
| Tool registry | Named future tool contracts | Locked |

## Scale path

The current view filters a compact, clearly labelled sample set. For large imports, the bank boundary is ready to introduce indexed queries, chunked import processing, pagination and virtualized rows without rewriting word-detail or navigation contracts.

## Tool activation rule

Future tools must remain inactive until a specific user request activates one named module. A later parser or practice engine must write through a dedicated module interface and must not fabricate activity data.
