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
- ~~Link Convex~~ Done: project `atlas-tales-learn-history` (team ossama-aouam), cloud dev deployment `effervescent-oriole-223`; `health:ping` verified on cloud.
- `eas init` (owner's Expo account), then paste the project ID into `app.config.ts` and run the first Android dev build.
- iOS dev build: pending Apple Developer approval.
- R2 bucket: needed in Phase 2. RevenueCat/AdMob/Resend: later.

**Decisions**
- Repo stays in the OneDrive folder (owner choice). If Metro or pnpm misbehave, pause OneDrive sync for this folder first.
- Phase order follows §12 strictly: 0 → 1 → 2.
- Added `CONVEX_ADMIN_KEY` to the env list (admin upsert for the upload script).
- Development runs in **Expo Go** (owner choice, 2026-11-18): `pnpm start` = `expo start --go`. Phase 0 "runs on device" is checked in Expo Go; the custom dev build (EAS `development` profile, already configured) is only needed when RevenueCat/AdMob are added at the end. Background playback and lock-screen controls can only be fully tested in a dev build.
- EAS project `@motkan/atlas-tales` linked (ID in `app.config.ts`).

**Phase 0 acceptance (2026-11-18)**
| Criterion | Result | How verified |
|---|---|---|
| App runs on Android | PASS | Expo Go on owner's Android phone shows "Convex: connected (atlas-tales)" |
| App runs on iOS | PENDING | Waiting for Apple Developer approval |
| Convex connected | PASS | Cloud dev deployment answers `health:ping` from the phone and from the CLI |
| `pnpm typecheck` | PASS | app + convex |
| `pnpm test` | PASS | Jest 1/1, Vitest 1/1 |

Phase 0 closed (iOS pending). Note: the phone needed Private DNS (`dns.google`) because the home router's DNS fails to resolve `*.convex.cloud`.

## 2026-11-18 · Phase 1 (Foundations) — in progress

**Decision: whole app in landscape** (owner, with reference screenshots of a library and a player).
- `app.config.ts` orientation `landscape`; BUILD_GUIDE §1, §7.2 (reader layout), §19.3 (16:9 screen art) and STORY_SPEC §9 (16:9 images, calm lower third) updated.
- Reader target layout (Phase 4): full-screen image, text card over the bottom, round corner buttons, play/pause top centre, prev/next arrows on the sides.
- Screens protect all four safe-area edges (the notch is on a side in landscape).

**Fixes**
- Expo Go ignores the native RTL plugin; added `extra.supportsRTL` so `forceRTL` works in Expo Go.
- R2: bucket name had a trailing space (fixed in `.env.local`); Node on this PC needs IPv4 first for `r2.dev` (`--dns-result-order=ipv4first`), to apply in the Phase 2 upload script.
- Schema deviation: `installs.installTokenHash` (SHA-256) instead of the raw `installToken` from BUILD_GUIDE §5.

**Open**
- Owner to verify on phone: Arabic RTL flip, install row in Convex (phone Private DNS must be `dns.google`).
- Settings has no parent gate yet (Phase 7).

## 2026-11-19 - Phase 1 design handoff
- Recovered the supplied 14-frame Claude Design PNG export from the previous thread.
- Applied Bright Explorer palette, radii, text sizes and card shadows to the shared tokens; retained existing token names.
- AppText uses the reference's separate Arabic sizes and line heights.
- Typography remains Cairo/system until Baloo 2 and Baloo Bhaijaan 2 are bundled. Map colours remain provisional. This is the theme integration, not a completed implementation of all reference screens.
- Phone acceptance remains open: landscape, Arabic RTL restart, and install registration.
- Validation: pnpm typecheck passed; pnpm test passed (33 app tests and 7 server tests). Device visual review remains pending.

## 2026-11-19 - Phase 1 accepted
- Owner confirmed landscape, navigation and map placeholder work in Expo Go.
- Owner confirmed the remaining Arabic RTL and Convex install-row checks are complete.
- Phase 1 closed. Latest code validation: typecheck and all 40 tests passed.
- Earlier phone-verification pending notes are resolved. Exact design fonts and later-phase screens remain follow-up design work.

### Phase 2 proposed plan
- Extend convex/schema.ts and add map/story queries plus an authenticated admin upload mutation.
- Implement scripts/validateStory.ts, scripts/uploadStory.ts and scripts/makeFixtureStory.ts; wire package.json commands.
- Generate two placeholder stories with multilingual text, images and silent audio; upload media to this project's R2 and story records to its development Convex deployment.
- Test malformed content, access restrictions and repeat uploads; run typecheck and the full test suite, then verify both stories and their page/image counts.
- Await phase-start approval per CLAUDE.md before implementation; confirm any additional dependencies in the concrete implementation plan.

## 2026-11-19 - Phase 2 in progress
- Approved tooling installed: tsx, AWS S3 SDK, sharp, music-metadata; Zod from the build guide.
- Added story schema validation, file checks, fixture data/generator and an R2 upload pipeline with content-addressed media and actual narration durations.
- Added indexed content tables, paginated map query, complete story query, authenticated atomic upserts and server-scheduled public release state.
- Configured a random admin upload key locally and on the existing dev deployment without exposing it.
- Deployed successfully to dev:effervescent-oriole-223; live map query responds successfully (currently empty).
- Validation: typecheck passed; all 54 tests passed (33 app, 21 server/scripts).
- Pending: owner approval for portable FFmpeg to generate the bundled silent M4A, then generate/upload two fixtures and verify their live counts. Phase 2 is NOT complete.
- Pro early-access remains locked until verified entitlements are implemented in Phase 7.

## 2026-11-19 - Phase 2 accepted
- Owner approved portable FFmpeg; generated and bundled a 2-second mono AAC/M4A silence file (1,527 bytes). Encoder remains in thread storage, outside the repo.
- Generated and validated placeholder-one and placeholder-two; each contains 32 pages, 3 chapters, 40 images and 128 audio files across four languages.
- Uploaded both fixtures to the project R2 bucket and dev:effervescent-oriole-223. Corrected a PowerShell-added newline in the admin key using dotenv-file input.
- Live verification passed: both stories appear once in the map query, each has 32 pages/40 images/128 audio references, and sample cover/image/audio CDN GETs return 200 with content.
- Typecheck and all 55 tests passed; diff whitespace check passed. Negative validator and authorization cases are covered.
- Phase 2 complete. Phase 3 (illustrated interactive map) has not started.
- Owner reiterated authorization to use GPT image generation for artwork; documented in CONTENT_PIPELINE.md.

## Phase 3 - Illustrated map
- Used the supplied Round 3 map design for floating labels, passport/settings actions, star pins and the preview sheet.
- Generated seven independent transparent continent illustrations with built-in GPT ImageGen. WebP layers live in assets/map, with prompts in assets/_prompts.
- The world layout is stylized. Continent lookup uses Natural Earth 1:110m coordinates (https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson). Pin positions are approximate within the illustrated artwork.
- Continent view zooms in, supports pan and pinch, and lifts slightly when a story pin opens. Nearby stories share a pin chooser. Live Convex previews show cover, chapters and reader navigation.
- Completion and Pro markers depend on the later progress and entitlement features. Physical-device rendering, gestures, RTL review and performance still need verification.

## 2026-11-19 - Phase 3 map improvements (owner choices: "Mix" style, story pins on world, living map)
- Design fonts: Baloo 2 + Baloo Bhaijaan 2 with per-style weights from the Round 2 token sheet; Cairo removed.
- World view is now a flat Bright Explorer SVG map drawn from the Natural Earth outlines on an exact equirectangular projection (src/features/map/worldShapes.ts): navy coastline, no political borders, Russia split at the Urals (east = Asia), French Guiana with South America, date-line safe. Pins land exactly on lat/lng. Painted continent art stays for the zoomed continent view.
- Story pins on the world map (grouped when close) plus a story count on each continent chip; tapping a pin opens the story sheet or the chooser.
- Living map: drifting clouds, a sailing boat, shimmering waves; static when the OS reduce-motion setting is on.
- continentAt follows the same Urals/overseas rules.
- Validation: typecheck passed; 74 tests passed (52 app, 22 server); Android export bundles.
- Open: device check on Android phone and iPad (owner); Expo Go logged "Layout direction could not be switched to rtl" once - recheck Arabic after a full Expo Go restart.
- Owner revised: back to the illustrated world map (flat SVG map removed; it stays in git history at d055407), made larger: toolbar floats over the map, world view fills the screen (cover, crop capped at ~15%, drag to see edges), continent view drawn larger with a round back button instead of the system header. Clouds, boat, waves and story pins/counts kept on the illustrated map. Tests: 66 passed (44 app, 22 server).
