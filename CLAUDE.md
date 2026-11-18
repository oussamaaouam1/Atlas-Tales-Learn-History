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

## Commands
- `pnpm start`: Expo dev server (for the dev client build)
- `pnpm android` / `pnpm ios`: local native build and run (iOS needs macOS; use EAS on Windows)
- `pnpm typecheck`: TypeScript check (app + `convex/`)
- `pnpm test`: all unit tests (`test:app` = Jest/jest-expo for `src/` and `__tests__/`; `test:server` = Vitest for `convex/` (convex-test, edge runtime) and `scripts/`)
- `pnpm convex:dev`: Convex dev
- `pnpm story:fixture <slug>`: generate a fixture story (Phase 2)
- `pnpm story:validate <folder>`: validate a story folder (Phase 2)
- `pnpm story:upload <folder> [--release YYYY-MM-DD]`: upload a story (Phase 2)
- EAS: `npx eas-cli@latest build --profile development --platform android`

## Tooling notes
- Expo SDK 58 (React Native 0.88, React 19.3, TypeScript 6). Add Expo/RN packages with `npx expo install`, never plain `pnpm add`, so versions match the SDK.
- pnpm 12 with `nodeLinker: hoisted` in `pnpm-workspace.yaml` (pnpm 12 ignores `.npmrc` for this). Approve package build scripts with `pnpm approve-builds <pkg>`.
- TypeScript 6 does not auto-load `@types/*`: add test-runner types via `compilerOptions.types`.
- Run `pnpm typecheck` and `pnpm test` after every change, not only at the end of a phase.
- RevenueCat and AdMob are integrated last (owner decision), after all other features.
- Config lives in `app.config.ts`; `ios/` and `android/` are generated (Continuous Native Generation) and gitignored.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
