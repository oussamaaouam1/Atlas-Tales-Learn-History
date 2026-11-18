# App Build Guide — Atlas Tales: Learn History

> **For Claude Code.** Put this file at the root of the new repo (and reference it from `CLAUDE.md`). Build phase by phase (section 12); a phase is done only when all its acceptance criteria pass.
> Companion files: **Story Production Spec** (`STORY_SPEC.md`, story JSON format) and the **Business Plan** (Claude Docs, product and pricing decisions).
> This is a **new, standalone project**. Nothing here may read from, write to or share keys with Pillow Tales. Pillow Tales only inspired some patterns, which are described in section 13.

Version 0.1 · 18 Nov 2026 · Owner: Oussama Aouam

---

## 1. Product summary for developers

A family app (all ages) where a **colourful illustrated world map** is the home screen. Tapping a continent zooms in; story pins appear on historic places; tapping a pin opens a **true history story** told as an illustrated, narrated page reader.

| Item | Value |
|---|---|
| Platforms | iOS (iPhone, iPad) and Android |
| Orientation | Portrait (iPad may allow landscape later) |
| Languages | Arabic (right-to-left), French, Spanish, English: UI, text and narration |
| Story format | 32–40 pages, 3 chapters, 40–60 images, per-page audio per language, 12–20 minutes |
| Monetization | All stories free with gentle ads; **Pro** ($2.99/month, $19.99/year) = no ads + early access + offline downloads + background playback + sleep timer |
| Audience | Families and all ages → Google Play **Families policy** applies; not in Apple's Kids category |
| Accounts | Anonymous by default; optional parent email login |
| Content cadence | 15–20 stories at launch, then 1 new story every week |

**Non-negotiable rules**

1. Every screen works in **left-to-right and right-to-left**.
2. **Family-safe**: no ads during a story, no ad tracking of children, parent gate before purchases, settings and external links.
3. **Offline-friendly**: stories open fast and stream pages; Pro can download whole stories.
4. **No political borders** on the map; pins on places, not countries.
5. **First-party analytics only** (stored in Convex). No third-party trackers.

---

## 2. Tech stack

Use the latest stable **Expo SDK** at project start (Pillow Tales runs SDK 54; do not downgrade below it).

| Layer | Choice | Why |
|---|---|---|
| App framework | React Native + Expo (dev client, EAS Build) | Same skills as before; one codebase for iOS and Android |
| Language | TypeScript, strict mode | Safety on a large codebase |
| Navigation | React Navigation (native stack + modal) | Proven, supports RTL |
| Animation | React Native Reanimated + Gesture Handler | Map zoom, image pan and zoom, parallax, transitions |
| Map overlay | `react-native-svg` | Tappable regions and pins over illustrated map images |
| Images | `expo-image` (WebP, caching, prefetch) | Fast decoding and caching of 40–60 images per story |
| Audio | `expo-audio` (background playback enabled) | Per-page narration, lock-screen controls |
| Files | `expo-file-system` | Offline downloads |
| Storage | AsyncStorage (preferences), SecureStore (tokens) | Same split as before |
| Localization | `expo-localization` + an in-app `t()` provider | Device language detection, RTL flag |
| Backend | **Convex** (new deployment) | Real-time DB + functions + HTTP webhooks |
| Asset storage | **Cloudflare R2** (new bucket) + Cloudflare CDN | Cheap delivery of images and audio |
| Purchases | **RevenueCat** (new project) via `react-native-purchases` | Apple + Google subscriptions, webhooks |
| Ads | `react-native-google-mobile-ads` (AdMob, Families self-certified) | Family-safe ads with child-directed tagging |
| Email OTP | Resend (new sender domain) | Optional parent login |
| Validation | `zod` | Story JSON schema in the upload script |
| Updates | EAS Update (over-the-air) | JS-only fixes without store review |

---

## 3. Project setup (Phase 0)

1. New git repo (for example `atlas-tales-app`), new Expo app with TypeScript template, pnpm.
2. New **EAS project**, new **bundle ID / package name**: `com.motkan.atlastales` (confirm it is free in App Store Connect and Play Console). Display name on the home screen: **Atlas Tales**.
3. New **Convex** project and production deployment.
4. New **R2 bucket** (for example `atlas-tales-assets`) with a public CDN domain.
5. New **RevenueCat** project with entitlement `pro`, offering `default`, products `pro_monthly`, `pro_yearly`.
6. New **AdMob** app IDs (iOS and Android) and ad unit IDs: `preroll_interstitial`, `map_banner`.
7. New **Resend** sender (for example `noreply@<domain>`).
8. `CLAUDE.md` in the repo pointing to this guide and `STORY_SPEC.md`.

### Environment variables (`.env.local`, never committed)

```bash
# Convex
EXPO_PUBLIC_CONVEX_URL=
EXPO_PUBLIC_CONVEX_SITE_URL=
CONVEX_DEPLOYMENT=

# Cloudflare R2 (scripts only, never in the app)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
R2_ENDPOINT=

# RevenueCat
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
# Server only (Convex dashboard): REVENUECAT_WEBHOOK_AUTH_HEADER

# AdMob (app IDs go in app config; unit IDs here)
EXPO_PUBLIC_ADMOB_PREROLL_IOS=
EXPO_PUBLIC_ADMOB_PREROLL_ANDROID=
EXPO_PUBLIC_ADMOB_BANNER_IOS=
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=

# Resend (server only, Convex dashboard): RESEND_API_KEY, RESEND_FROM_EMAIL

# Sharing
EXPO_PUBLIC_SHARE_URL=
```

### Suggested folder structure

```
/
├── App.tsx
├── app.json / app.config.ts
├── BUILD_GUIDE.md          ← this file
├── STORY_SPEC.md           ← story format
├── CLAUDE.md
├── convex/                 ← backend (schema, queries, mutations, http)
├── scripts/                ← uploadStory.ts, validateStory.ts, optimize helpers
├── content/                ← local story folders before upload (gitignored media)
├── assets/                 ← app artwork: map images, guide character, stamps, icons
└── src/
    ├── navigation/
    ├── features/
    │   ├── onboarding/     ← splash, age screen, language
    │   ├── map/            ← world, continent, pins, story card
    │   ├── reader/         ← page reader, image sequencer, audio, chapters, end screen
    │   ├── passport/
    │   ├── paywall/
    │   ├── ads/
    │   └── settings/       ← parent portal, language, downloads, account
    ├── providers/          ← Session, Language/RTL, Purchases, Ads, Theme
    ├── services/           ← convex client, offline storage, asset cache, analytics
    ├── components/         ← design-system components from Claude Design
    ├── i18n/               ← ar.json, fr.json, es.json, en.json
    ├── theme/              ← tokens (colours, type, spacing, radius)
    └── types/
```

---

## 4. Architecture

```
┌──────────────────────── Mobile app (Expo / React Native) ────────────────────────┐
│ Onboarding → Map (world → continent) → Story card → Reader → End (quiz, stamp)   │
│ Passport · Settings / Parent portal · Paywall (modal)                             │
│ Providers: Session · Language/RTL · Purchases · Ads · Theme                      │
│ Services: Convex client · Offline storage · Asset cache · First-party analytics  │
└──────────────┬──────────────────────────┬───────────────────────┬────────────────┘
               │ queries / mutations      │ images + audio (CDN)  │ IAP SDK / Ads SDK
               ▼                          ▼                       ▼
        ┌─────────────┐            ┌─────────────┐     ┌────────────────┐  ┌───────┐
        │   Convex    │◄── upload ─│ Cloudflare  │     │  RevenueCat    │  │ AdMob │
        │ DB + funcs  │   script   │     R2      │     │ (App Store +   │  └───────┘
        │ + HTTP      │            └─────────────┘     │  Google Play)  │
        └──────▲──────┘                                 └───────┬────────┘
               └────────────── webhook (subscription events) ───┘
```

Principles:
- **Anonymous first.** Every install gets an `install_<uuid>` identity on first launch; a parent account is optional and can be linked later; data follows the link.
- **Owner keys everywhere.** Progress, stamps, streaks and entitlements are keyed by `ownerType` (`install` | `user`) + `ownerKey`.
- **Server decides access.** Early access and Pro features are checked in Convex, not only in the app.
- **Webhook-driven subscriptions.** Purchases happen in the app through RevenueCat; RevenueCat's webhook updates Convex.

---

## 5. Data model (Convex)

All text fields that users see are **per language**: `{ ar, fr, es, en }` (type `LocalizedText`).

### Content

| Table | Key fields | Notes |
|---|---|---|
| `stories` | `slug`, `title`, `hook`, `keyTakeaway`, `era {period, yearStart, yearEnd, region}`, `location {name, lat, lng}`, `mapPin? {continent, x, y}`, `coverImageUrl`, `chapters [{number, firstPage, title}]`, `didYouKnow`, `quiz [{question, options[], answerIndex}]`, `sources [{title, url}]`, `durationSec`, `pageCount`, `seriesId?`, `episodeNumber?`, `releaseAt`, `proEarlyAccessAt`, `status` (`draft` \| `published`) | `releaseAt` = public date; `proEarlyAccessAt` = 3 days earlier |
| `storyPages` | `storyId`, `page`, `chapter`, `text: LocalizedText`, `audio: { ar, fr, es, en }` (URL + `durationSec`), `tag`, `speaker` | One row per page |
| `storyImages` | `storyId`, `page`, `order`, `url`, `type` (`scene` \| `plate` \| `cutout` \| `detail` \| `map`), `shot`, `durationSec`, `layers?` | Ordered images inside a page; `layers` for plate + cutout compositions |
| `series` | `slug`, `title`, `coverImageUrl`, `storyIds[]` | Phase 2 feature |
| `releases` | `date`, `storyId` | The weekly story calendar |
| `continents` | `key`, `name: LocalizedText`, `imageUrl`, `bounds` | Map configuration (can also live in app assets) |

### Identity

| Table | Key fields |
|---|---|
| `installs` | `ownerKey`, `installToken`, `platform`, `appVersion`, `locale`, `linkedUserKey?`, `ageBand` (`child` \| `teen` \| `adult` \| `unknown`), `firstSeenAtMs`, `lastSeenAtMs` |
| `users` | `ownerKey`, `email`, `status`, `createdAtMs` |
| `parentOtpCodes` | `email`, `codeHash`, `attempts`, `expiresAtMs` |
| `parentSessions` | `userOwnerKey`, `sessionTokenHash`, `expiresAtMs`, `revokedAtMs?` |

### Commerce

| Table | Key fields |
|---|---|
| `subscriptions` | `ownerType`, `ownerKey`, `provider` (`apple` \| `google`), `productId`, `status`, `periodEndMs`, `rcAppUserId` |

### Progress and engagement

| Table | Key fields |
|---|---|
| `storyProgress` | owner, `storyId`, `currentPage`, `currentChapter`, `maxPageReached`, `completedAtMs?` |
| `stamps` | owner, `storyId`, `place`, `earnedAtMs` |
| `streaks` | owner, `currentDays`, `bestDays`, `lastListenDate` |
| `quizResults` | owner, `storyId`, `score`, `answeredAtMs` |
| `shareUnlocks` | owner, `shareCount` (share quest, optional) |
| `events` | owner, `type` (`story_open`, `page_view`, `chapter_complete`, `story_complete`, `paywall_view`, `purchase`, `ad_shown`), `storyId?`, `atMs` | First-party analytics |

### Support

| Table | Key fields |
|---|---|
| `supportTickets` | `email?`, `message`, `ownerKey`, `createdAtMs` |
| `waitlist` | `email`, `language`, `createdAtMs` |

---

## 6. Screens and navigation

```
Splash ──► AgeScreen (first launch only) ──► LanguageScreen (first launch only)
                                                   │
                                                   ▼
                     ┌──────────────── MapScreen (home) ────────────────┐
                     │  tap continent ► ContinentScreen (zoomed map)     │
                     │  tap pin ► StoryCardSheet ► ReaderScreen          │
                     │  ReaderScreen ► ChapterBreak ► EndScreen (quiz,   │
                     │                stamp, did you know, next story)   │
                     │  PassportScreen · SettingsScreen (parent gate)    │
                     └───────────────────────────────────────────────────┘
                      PaywallModal (parent gate first) — from card, settings, early-access badge
```

| Screen | Purpose | Key UI |
|---|---|---|
| Splash | Brand moment, bootstrap session | Short animation; skip after 2 s |
| AgeScreen | **Neutral age screen** for ads compliance | Year-of-birth picker, no hints about "right" answers; stores `ageBand` |
| LanguageScreen | Pick AR / FR / ES / EN | Flags avoided (languages, not countries); shows each name in its own script |
| MapScreen | Home: illustrated world | Continents tappable; weekly-story badge; streak counter; passport and settings buttons; one small banner ad (free users) |
| ContinentScreen | Zoomed continent | Pins (free, new, completed, Pro early access); pan and pinch within bounds |
| StoryCardSheet | Story preview | Cover, title, era, length, 3 chapters, language, continue/start, download (Pro) |
| ReaderScreen | The story | Page text (toggle), timed image sequence with pan/zoom, narration controls, chapter progress, sleep timer (Pro), language switch |
| ChapterBreak | Between chapters | Cliffhanger line, "continue now" / "continue tomorrow" |
| EndScreen | After the last page | Stamp animation, "Did you know?", 3-question quiz, sources link (parent gate), next suggested story |
| PassportScreen | Collection | Stamps by continent; counts; share image (parent gate) |
| PaywallModal | Pro offer | Yearly first with trial, monthly; restore purchases; terms and privacy links |
| SettingsScreen | Parent portal | Language, downloads manager, subscription status, restore, parent login, delete account, support |

---

## 7. Feature specs

### 7.1 Map (illustrated image + SVG pins)

- **Artwork:** one world image and one image per continent, drawn from a correct **equirectangular** outline (Natural Earth), then illustrated. Same projection for all images.
- **Overlay:** an `react-native-svg` layer on top with simplified continent polygons (hit areas) and pins. Polygons are hand-simplified, invisible, used only for taps.
- **Pin position:** computed from `location.lat/lng` with the equirectangular formula for that image's bounds; `mapPin {continent, x, y}` (0–1 relative coordinates) overrides it when the artwork needs a nudge.
- **Zoom:** tap a continent → Reanimated shared-element-style zoom into ContinentScreen. Pan and pinch clamped to the image bounds.
- **No political borders**, no country names; pins on cities and historic places.
- **Performance:** pre-sized WebP images per device density; pins as SVG; target 60 fps on a mid-range Android phone.
- **Pin states:** `new` (released in the last 7 days), `early` (Pro early access), `completed` (stamp earned), `default`.

### 7.2 Reader

- Pages come from `storyPages`; images from `storyImages` ordered by `page` then `order`.
- **Audio:** one file per page per language. When a page's audio ends, go to the next page automatically (autoplay mode) or wait (manual mode).
- **Image sequencer:** within a page, show each image for its `durationSec`, crossfade between them, apply a slow pan-and-zoom (Ken Burns) with Reanimated; `plate + cutout` compositions animate with light parallax.
- **Text:** follow-along text, toggle on/off, adjustable size; Arabic revealed word by word.
- **Chapters:** after the last page of chapters 1 and 2, show ChapterBreak. Save progress at each page.
- **Resume:** reopening a story starts at the saved page; "continue where you stopped" on the map card.
- **Language switch** inside the reader keeps the same page.
- **Background playback + lock-screen controls** (Pro) and **sleep timer** (Pro: 10 / 20 / 30 min / end of chapter).
- **Ads:** for free users, one skippable pre-roll **before** the story or chapter starts. Never during a page.

### 7.3 Offline and caching

- **Streaming for everyone:** open the story after the first 3 pages are cached; prefetch 3 pages ahead (images + audio in the active language only).
- **Downloads (Pro):** download a full story in the active language in background chunks (sliding window: pages near the reader's position first). Store under `documentDirectory/stories/<storyId>/<lang>/`.
- **Reader loads local first**, falls back to network.
- **Downloads manager** in settings: list, size, delete.
- If Pro expires, downloaded stories still stream normally but the offline copies are removed on next launch.

### 7.4 Passport, streaks, quiz

- **Stamp** awarded server-side when `storyProgress.completedAtMs` is set (in the same mutation).
- **Streak:** a day counts when at least one page is listened to in the user's local date; best streak kept.
- **Quiz:** 3 questions on the EndScreen; results saved; no penalty, just a score and a friendly message.

### 7.5 Weekly release and early access

- `releases` defines the weekly calendar. A story is visible when `now >= proEarlyAccessAt` for Pro users and `now >= releaseAt` for everyone else; the query enforces it server-side.
- Map shows a "new this week" badge for 7 days after `releaseAt`.

### 7.6 Pro and paywall

- RevenueCat entitlement `pro`. App identifies the RevenueCat user with the `ownerKey`.
- Webhook `POST /revenuecat-webhook` (auth header checked) upserts `subscriptions`.
- `isPro` = active entitlement in RevenueCat **or** active row in Convex (whichever arrives first).
- Pro unlocks: no ads, early access, downloads, background playback, sleep timer.
- **Parent gate** (simple arithmetic or hold-to-confirm) before the paywall checkout, restore, external links and settings.
- Paywall shows the yearly plan first with the 7-day trial; prices come from the store (regional pricing is set in App Store Connect and Play Console).

### 7.7 Ads (AdMob, Families-compliant)

- Initialize only after the age screen. Set the request configuration from `ageBand`:
  - `child` or `unknown` → `tagForChildDirectedTreatment: true`, `maxAdContentRating: G`, non-personalized ads.
  - `teen` → `tagForUnderAgeOfConsent: true`, `maxAdContentRating: PG`.
  - `adult` → standard settings (still `maxAdContentRating: PG` to keep the brand family-safe).
- Do **not** request iOS App Tracking Transparency permission; serve non-personalized ads.
- Formats: one **pre-roll interstitial** before a story or chapter starts (max once per 10 minutes), one **banner** on MapScreen. Nothing in the reader, passport, end screen or paywall.
- `isPro` → never load the ads SDK requests.
- Google Play Console: target audience = mixed (children + adults), declare ads, Families self-certified SDK.

### 7.8 Accounts

- First launch: generate `install_<uuid>`, store the token in SecureStore, create the `installs` row.
- Optional **parent login** by email OTP (Resend) from settings; links the install to a `user` and migrates progress, stamps, streaks and subscription.
- **Delete account** flow (OTP) removes all user data (required by both stores and GDPR).

---

## 8. Internationalization and right-to-left Arabic

- Languages: `ar`, `fr`, `es`, `en`. UI strings in `src/i18n/<lang>.json`; story text from Convex.
- **Enable RTL support** in the Expo app config and switch direction with `I18nManager.forceRTL(lang === 'ar')`; changing between Arabic and a left-to-right language requires a reload (`Updates.reloadAsync()`), so confirm with the user first.
- **Layout rules:** use `start` / `end` (never `left` / `right`) in styles; flip directional icons (back, next, progress); keep the map itself unflipped (geography does not mirror).
- **Fonts:** Arabic font (for example Cairo, Tajawal or Noto Naskh Arabic) plus a Latin font from the design system; load both at startup.
- **Numbers and dates:** format per locale; keep years as Western digits unless the design says otherwise.
- **Test matrix:** every screen screenshotted in `en` and `ar` before a phase is marked done.

---

## 9. Design system integration (from Claude Design)

- Claude Design delivers tokens (colours, typography, spacing, radius, shadows) and components. Implement tokens in `src/theme/tokens.ts` and components in `src/components/` **before** building screens.
- App artwork (map, guide character, stamps, frames, backgrounds, onboarding) is generated by Oussama with ChatGPT and delivered as **transparent PNG → WebP** at 1x, 2x and 3x; small UI icons are SVG.
- No text baked into images; all labels come from i18n.
- **What is code and what is an image is defined in section 19 (App asset rules).** Buttons, cards, lists and layouts are always code.

---

## 10. Content pipeline (code side)

- **Story folder** (local, from production): `content/<slug>/story.json` (format in `STORY_SPEC.md`), `cover.webp`, `images/<id>.webp`, `audio/<lang>/<page>.m4a`.
- `scripts/validateStory.ts <folder>`: zod schema check: 4 languages everywhere, 32–40 pages, 3 chapters, every page has ≥ 1 image, every image has `durationSec`, quiz has 3 questions with a valid `answerIndex`, `location` and `era` set, every referenced file exists. Fails loudly with a list of problems.
- `scripts/uploadStory.ts <folder> [--release YYYY-MM-DD]`: runs the validation, uploads files to R2 under `stories/<slug>/…`, then calls a Convex admin mutation (`admin.upsertStory`, protected by an admin key) that writes `stories`, `storyPages`, `storyImages` and the `releases` row. Idempotent: re-running updates the story.
- Audio format: AAC/M4A mono 64–96 kbps. Images: WebP (Oussama's own optimization tool).

---

## 11. Release

- **EAS profiles:** `development`, `preview` (internal testers), `production`.
- **Over-the-air updates** for JS-only changes; a new native build for new native modules or config (ads SDK, background audio, RTL config).
- **Store listings in 4 languages** (title, subtitle, keywords, screenshots from the real app in each language, preview video). Titles (max 30 characters):
  - EN: `Atlas Tales: Learn History` · subtitle idea: "True stories on a magic map"
  - FR: `Atlas Tales: L'Histoire facile`
  - ES: `Atlas Tales: Aprende historia`
  - AR: `Atlas Tales: تعلّم التاريخ`
- **Compliance checklist:** privacy policy and terms URLs; data safety / privacy nutrition labels (no tracking); Google Play target audience = mixed, ads declared, Families self-certified SDK; Apple age rating 9+, not in Kids category; parent gate demonstrated in review notes; account deletion available.
- **Small business fee programs:** Apple Small Business Program; Google 15% tier.

---

## 12. Build phases and acceptance criteria

| Phase | Scope | Done when |
|---|---|---|
| **0. Setup** | Repo, Expo app, EAS, Convex, R2, env, CLAUDE.md, typecheck + test scripts | App runs on iOS and Android dev builds; Convex connected; `pnpm typecheck` and `pnpm test` pass |
| **1. Foundations** | Theme tokens (placeholder until Claude Design delivers, section 17) + core components, navigation skeleton, i18n with 4 languages, RTL switching, fonts, anonymous identity | Every placeholder screen renders correctly in `en` and `ar`; language switch persists; an install row is created on first launch |
| **2. Content backend** | Convex schema (section 5), queries for map and story, `validateStory.ts`, `uploadStory.ts`, `makeFixtureStory.ts` (section 17), 2 fixture stories uploaded | Validation rejects a broken story with clear errors; 2 fixture stories appear in Convex with all pages and images; validator unit tests pass |
| **3. Map** | World image + continent images, SVG hit areas, zoom transition, pins with states, StoryCardSheet | Tapping each continent zooms in; pins show at the right places; card opens with correct data; 60 fps on a mid-range Android |
| **4. Reader** | Page reader, per-page audio, image sequencer with pan/zoom, text toggle, chapters, resume, language switch, EndScreen with quiz | A full test story plays end to end in all 4 languages; progress resumes after app restart; chapter breaks appear |
| **5. Offline** | Streaming prefetch, Pro downloads, downloads manager | Story opens in under 2 s on 4G; a downloaded story plays in airplane mode |
| **6. Engagement** | Stamps, PassportScreen, streaks, weekly releases, "new" badges | Completing a story adds a stamp; streak counts across days; a future-dated story stays hidden until its date |
| **7. Monetization** | RevenueCat Pro, paywall, parent gate, webhook, AdMob with age-based configuration, early access | Sandbox purchase unlocks Pro on both platforms; webhook updates Convex; free users see the pre-roll and banner only where allowed; Pro sees no ads and gets early access |
| **8. Polish and release** | Account deletion, support, first-party analytics events, error boundary, OTA, website with privacy and terms pages (section 16), store listings, compliance checklist | Privacy and terms URLs live in 4 languages; internal testing build approved on both stores' review; all checklist items done |

Post-launch (not in v1): time slider between eras, series, family profiles with separate passports, kid and adult narration modes.

---

## 13. Patterns borrowed from Pillow Tales (describe, don't copy)

These worked well in a previous app; re-implement them cleanly here.

| Pattern | What to rebuild |
|---|---|
| Anonymous-first identity | `install_<uuid>` token in SecureStore → Convex `installs`; optional parent account via email OTP; install linked to user, data migrated |
| Owner keys | Every per-user table keyed by `ownerType` + `ownerKey` |
| Webhook-driven subscriptions | RevenueCat SDK in the app; RevenueCat webhook → Convex HTTP action → `subscriptions` table |
| Progressive story loading | Open after the first pages; prefetch ahead; background chunks with a sliding window near the current page; only the active language's audio |
| Offline-first reader | Local files first, network fallback |
| Parent gate | Simple challenge before purchases, settings and external links |
| Upload scripts | Local story folder → R2 upload → Convex admin upsert, idempotent |
| OTA updates | EAS Update for JS changes; release script for native builds |

---

## 14. Open decisions

- Trademark, domain and social-handle checks for "Atlas Tales"
- Visual style bible and design system (Claude Design session)
- Whether to keep the share-to-unlock quest (all content is free now; could unlock a bonus stamp instead)
- Exact Expo SDK version at project start
- Crash reporting beyond store reports (see section 15.3)

---

## 15. Testing approach

### 15.1 Automated (run with `pnpm test`, must pass before a phase is done)

| Area | What to test |
|---|---|
| Story validator | A valid fixture passes; each rule fails with a clear message (missing language, 31 pages, missing image `durationSec`, bad `answerIndex`, missing `location`) |
| Access rules (Convex) | Free user cannot see a story before `releaseAt`; Pro user sees it from `proEarlyAccessAt`; downloads refused without Pro |
| Progress and stamps | Completing a story creates exactly one stamp; repeating does not duplicate it |
| Streaks | Same day counts once; a missed day resets; time zones handled with the user's local date |
| Subscriptions webhook | Rejects a wrong auth header; activation, renewal, cancellation and expiration update `subscriptions` correctly |
| Ads configuration | `ageBand` → the right request configuration; Pro → no ad requests |
| i18n | Every key exists in all 4 language files (no missing translations) |

### 15.2 Manual checklist per phase

- Test on one iPhone, one mid-range Android phone and one iPad
- Every new screen checked in **English and Arabic** (layout direction, fonts, icons)
- Airplane-mode check for any screen that loads content
- Slow-network check (throttled 3G) for story opening

### 15.3 Crash reporting

- **v1 default:** store crash reports only (Xcode Organizer, Google Play Console vitals) plus the app's error boundary, which logs a first-party `error` event to Convex (message, screen, app version; no personal data).
- **Optional later:** a crash-reporting SDK with personal data scrubbing, only after checking it against the Families policy and the privacy policy.

---

## 16. Website and legal pages

A small website is required before store submission.

- **Pages:** home (what the app is, store badges, waitlist form), **privacy policy**, **terms of use**, **support / contact**, **account deletion instructions**. All in 4 languages, Arabic right-to-left.
- **Tech:** a simple Next.js or static site on the app's domain (Vercel or Cloudflare Pages). The waitlist form posts to the Convex `POST /waitlist/join` HTTP action.
- **Privacy policy must state:** anonymous install IDs, optional parent email, first-party usage events, AdMob family-safe ads with non-personalized ads, RevenueCat for purchases, no selling of data, how to delete data. Have it reviewed before launch.

---

## 17. Placeholders, so building never waits for design or content

| Missing input | Placeholder | Replaced by |
|---|---|---|
| Design tokens and components | `src/theme/tokens.ts` with a neutral palette, system fonts + one Arabic font, 8-pt spacing, radius 12 | Claude Design output |
| Map artwork | Flat coloured continent shapes from a public-domain equirectangular outline, exported as WebP at the final sizes | Illustrated map images (same size and projection, so pins stay correct) |
| Guide character, stamps, icons | Simple shapes or emoji-free vector placeholders | ChatGPT-generated transparent PNG → WebP |
| Stories | `scripts/makeFixtureStory.ts <slug>`: generates a valid 32-page, 3-chapter story folder in the `STORY_SPEC.md` format with solid-colour images, 2-second silent M4A audio per page per language, and lorem text in each language (Arabic lorem for `ar`) | Real stories from the content pipeline |

Rule: placeholders live in clearly named files (`placeholder-*`) so they are easy to find and replace.

---

## 18. Owner checklist (Oussama, outside the code)

Start these early; some take days.

- [ ] Apple Developer Program enrolment (organization or individual) and App Store Connect app record
- [ ] Google Play Console account and app record
- [ ] Domain for Atlas Tales and email
- [ ] Convex account / new project
- [ ] Cloudflare account, R2 bucket, public domain
- [ ] RevenueCat project; products `pro_monthly`, `pro_yearly` created in both stores with regional prices and a 7-day trial
- [ ] AdMob account, iOS and Android apps, ad units
- [ ] Resend account and verified sender domain
- [ ] Apple Small Business Program and Google 15% fee tier
- [ ] Trademark search for "Atlas Tales" (EUIPO, USPTO, OMPIC)
- [ ] Privacy policy and terms text reviewed
- [ ] Claude Design session: design system + key screens
- [ ] Map artwork and app artwork (the launch asset list in section 19.5)

---

## 19. App asset rules

ChatGPT (directed by Oussama) produces the app's **artwork**. Claude Design defines the **interface**, which Claude Code builds **in code**. The line between the two is fixed.

### 19.1 Code versus image

| Always built in code (from the design system) | Generated artwork (ChatGPT, transparent PNG → WebP) |
|---|---|
| Buttons, cards, tabs, lists, the story library and grids, story card, paywall layout, settings, progress bars, toggles, sheets, all text | Map artwork, screen backgrounds, decorative frames and borders, textures, the guide character, passport stamps and passport cover, app icon, splash art, onboarding and empty-state illustrations, badges, chapter-break and end-screen art |
| Small UI icons (SVG from one icon set) | Store feature graphic (background art only) |

Why: code components handle 4 languages, right-to-left, pressed/disabled/loading states, screen sizes, accessibility and global colour changes. Images do not.

### 19.2 Illustrated look on code components (frames and textures)

- A button or card can use a generated **frame or texture as its background** (parchment, carved wood, painted border); the label, icon, states and direction stay in code.
- Frames are drawn so they can stretch with **9-slice**: corners stay intact, edges and centre stretch. Each frame has **cap insets** (the corner size in px) recorded in `assets/manifest.json`.
- Build a cross-platform `<NineSlice>` component that renders the 9 regions with `expo-image` (React Native's `capInsets` works on iOS only, so do not rely on it).
- Frames must look correct when mirrored for right-to-left, or come as a left and a right version.
- Pressed and disabled states come from code (opacity, scale, tint), not from extra images.

### 19.3 Technical specs for every generated asset

| Spec | Rule |
|---|---|
| Master file | PNG, transparent background (except full-screen backgrounds), sRGB, generated at the largest size needed |
| Exports | WebP at `@1x`, `@2x`, `@3x` (Oussama's optimization tool) |
| Padding | 8% transparent margin around cutouts (characters, stamps, decorations) so shadows and animations are not cut |
| Text | None inside images |
| Consistency | Same palette and style bible for every asset; keep the prompt with the asset |
| Edges | Check halos on light and dark backgrounds before export |
| Map art | Equirectangular, same projection and pixel size as the placeholder it replaces |
| Naming | kebab-case, `<group>-<name>[-<variant>]@<scale>.webp`, e.g. `guide-happy@3x.webp`, `frame-card-parchment@2x.webp` |

### 19.4 Folders and manifest

```
assets/
├── brand/        app icon, adaptive icon layers, splash
├── map/          world, continents, ocean, decorations
├── characters/   guide character poses and expressions
├── passport/     cover, page texture, stamp template, stamps/<story-slug>
├── frames/       9-slice frames for buttons, cards, sheets
├── textures/     tileable backgrounds (parchment, sea, sky)
├── illustrations/ onboarding, empty states, paywall, chapter breaks, end screen
├── store/        feature graphic background
└── manifest.json  { "file", "type", "sizes", "capInsets"?, "usedIn": [screens] }
```

Every generated asset has its prompt saved next to it in `assets/_prompts/<file>.md` (not bundled in the app).

### 19.5 Launch asset list (checklist for the ChatGPT sessions)

| Group | Assets | Used in |
|---|---|---|
| Brand | App icon (1024 master), Android adaptive icon foreground + background, splash illustration | Stores, home screen, Splash |
| Map | World map art; 7 continent arts (Africa, Europe, Asia, North America, South America, Oceania, Antarctica as a simple ice art); ocean texture; decorations: 3 ships, 4 clouds, compass rose, 2 sea creatures | MapScreen, ContinentScreen |
| Pins | Pin artwork for `default`, `new`, `early`, `completed` (or SVG if the design system prefers) | Map |
| Guide character | Front pose, side pose, waving; expressions: happy, surprised, thinking, laughing, sleepy, proud | Onboarding, reader intro, chapter breaks, end screen, empty states |
| Passport | Cover, page texture, stamp template, one stamp per launch story (15–20) | PassportScreen, EndScreen |
| Frames | Primary button frame, secondary button frame, card frame, sheet frame, tab bar background (all 9-slice) | Across the app |
| Textures | Parchment (tileable), sky gradient art, night-sky art for the reader | Backgrounds |
| Illustrations | Welcome, age screen, language screen, chapter break (3 variants), end-screen celebration, paywall hero | Onboarding, Reader, Paywall |
| Empty and error states | No downloads, no stamps yet, offline, something went wrong | Settings, Passport, all screens |
| Store | Google Play feature graphic background (1024×500), screenshot frame backgrounds | Store listings |

Until an asset exists, use its `placeholder-*` version (section 17).
