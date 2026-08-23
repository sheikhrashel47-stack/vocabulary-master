# Vocabulary Master

Vocabulary Master is a premium, mobile-first vocabulary foundation for admission learners. This **v1.0.0 Phase‑1** release provides the calm study shell, local vocabulary storage, Vocabulary Bank, A–Z discovery, cross-field search, word-detail structure, History/Profile/Settings shells, and future-tool registry.

## Phase‑1 boundary

The application intentionally does not activate any learning or testing system. Parser, Match, Mock, Flash, Fill in the Blank, revision, rewards, AI, notifications, external APIs, and cloud sync remain locked for future phases. The built-in vocabulary rows are clearly labelled **Sample data** and never power fake progress statistics.

## Local data model

Words live in IndexedDB under `vocabulary-master-db`, version 1. The `words` store is keyed by stable `id` and includes `word`, `meaningBn`, `synonyms`, `antonyms`, `tip`, `firstLetter`, `category`, `difficulty`, `tags`, `createdAt`, and `updatedAt`. The `settings` store is reserved for small persistent preferences.

## Development

Run `pnpm install`, then `pnpm dev`. Use `pnpm check` for TypeScript validation and `pnpm build` for a production build.

## Roadmap

Future prompts can activate one named tool at a time without changing the Phase‑1 foundation. The detailed architecture appears in [ARCHITECTURE.md](./ARCHITECTURE.md).
