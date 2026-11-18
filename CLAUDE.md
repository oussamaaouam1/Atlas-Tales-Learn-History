# CLAUDE.md — Atlas Tales: Learn History

## What this repo is
A React Native + Expo app for iOS and Android: a colourful illustrated world map where each place opens a true, narrated, illustrated history story, in Arabic (right-to-left), French, Spanish and English. Family app, free with gentle ads, Pro subscription.

## Read before any work
1. `BUILD_GUIDE.md`: architecture, data model, screens, feature specs, build phases with acceptance criteria. **Source of truth for the code.**
2. `STORY_SPEC.md`: the story JSON format. The validator and upload scripts must match it exactly.

If the two files disagree, stop and ask; do not guess.

## How to work
- Build **one phase at a time**, in the order of section 12 of `BUILD_GUIDE.md`. Do not start the next phase until every acceptance criterion of the current one passes.
- At the start of a phase: write a short plan (files to create or change, tests to add) and wait for approval.
- At the end of a phase: run `pnpm typecheck` and `pnpm test`, list what was done against the acceptance criteria, and note anything left open.
- Keep a short changelog in `docs/PROGRESS.md` (date, phase, what changed, open issues).

## Hard rules
- **This is a standalone project.** Never read from, copy from, or reuse keys, IDs, buckets or deployments of any other project (including Pillow Tales).
- **Never commit secrets.** `.env.local`, credentials and keys stay out of git.
- **Right-to-left:** use `start`/`end`, never `left`/`right`, in styles. Check every new screen in `en` and `ar`.
- **Family-safe:** no ads during a story; no ad tracking for children or unknown ages; parent gate before purchases, settings and external links; no third-party analytics.
- **No political borders** on the map; pins on places, not countries.
- **UI is code, artwork is images** (section 19 of `BUILD_GUIDE.md`): buttons, cards, lists and layouts are always components; generated art is only used as illustrations, backgrounds, textures or 9-slice frames behind components. Never put text inside images.
- **TypeScript strict**, no `any` without a comment explaining why.
- **Placeholders** (design tokens, map art, fixture stories) live in files named `placeholder-*` so they are easy to replace.
- Ask before adding a dependency that is not listed in section 2 of `BUILD_GUIDE.md`.

## Commands (fill in during Phase 0)
- `pnpm start`: Expo dev server
- `pnpm typecheck`: TypeScript check
- `pnpm test`: unit tests
- `pnpm convex:dev`: Convex dev
- `pnpm story:fixture <slug>`: generate a fixture story
- `pnpm story:validate <folder>`: validate a story folder
- `pnpm story:upload <folder> [--release YYYY-MM-DD]`: upload a story
