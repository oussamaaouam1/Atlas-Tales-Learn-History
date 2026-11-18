# Progress

## 2026-11-18 · Phase 0 (Setup)

**Done**
- Git repo (`main`), remote `github.com/oussamaaouam1/Atlas-Tales-Learn-History`.
- Expo SDK 58 app (blank TypeScript template, React Navigation instead of expo-router), pnpm 12 hoisted.
- `app.config.ts`: name "Atlas Tales", `com.motkan.atlastales`, portrait, RTL support (`expo-localization` plugin), expo-audio with background playback and no microphone.
- All native modules from BUILD_GUIDE §2 installed now (except RevenueCat and AdMob), so one dev build covers Phases 1–6.
- `eas.json` with `development`, `preview`, `production` profiles.
- Convex: empty schema + `health.ping` query; app shell shows the connection status. Verified against a local anonymous deployment.
- Tests: Jest (jest-expo) for the app, Vitest + convex-test for Convex/scripts. `pnpm typecheck` and `pnpm test` pass; `expo-doctor` 20/20; Android JS bundle exports.
- `.env.example`, `.gitignore` (env files, generated native folders, story media), folder structure from §3.

**Open**
- Link Convex to the owner's cloud account (`npx convex login`, then `pnpm convex:dev`) — needed for the app on a real phone.
- `eas init` (owner's Expo account), then paste the project ID into `app.config.ts` and run the first Android dev build.
- iOS dev build: pending Apple Developer approval.
- R2 bucket: needed in Phase 2. RevenueCat/AdMob/Resend: later.

**Decisions**
- Repo stays in the OneDrive folder (owner choice). If Metro or pnpm misbehave, pause OneDrive sync for this folder first.
- Phase order follows §12 strictly: 0 → 1 → 2.
- Added `CONVEX_ADMIN_KEY` to the env list (admin upsert for the upload script).
