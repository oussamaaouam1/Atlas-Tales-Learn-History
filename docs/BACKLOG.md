# Owner instruction sheet

Every instruction from the owner is logged here as it arrives, even mid-task, so current work is
never interrupted or broken. Items are picked up in order once the current task is safe to pause.
Status: `todo` · `doing` · `done` · `parked` (waiting on something).

| # | Date | Instruction (owner's words, summarised) | Status | Notes |
|---|---|---|---|---|
| 1 | 2026-11-19 | Map: keep the first, illustrated map, make it a bit bigger and fit the screen better; keep clouds, boat and effects | done | Commit 9a2b20a. Needs device check (Android + iPad). |
| 2 | 2026-11-19 | Onboarding (Splash, Age, Language): stick to the design zip | done | Rebuilt to the Round 3 Onboarding frame; needs device check. |
| 3 | 2026-11-19 | Guide characters: old history characters, drawn nicely, that move (idle + wave), made with GPT | done | Map-maker scholar (wave) + Silk Road traveller (point), 2 frames each; AnimatedGuide. More characters for later screens: todo. |
| 4 | 2026-11-19 | Free rein to generate any assets with GPT image generation | standing | Via Codex thread on the account pool; prompts in `assets/_prompts/`. |
| 5 | 2026-11-19 | Log all instructions in a sheet so work is not interrupted | done | This file. |
| 6 | 2026-11-19 | Test on Android phone and iPad with Expo Go (no emulator: too much RAM) | standing | Dev server in the "Expo dev server" bb terminal. |
| 7 | 2026-11-19 | Map buttons/pins to match the design (round icons, SVG pins + legend, New this week card) | parked | Offered, not chosen yet. |
| 8 | 2026-11-19 | App icon shows an owl; regenerate with the new guide character once approved | todo | `assets/brand/placeholder-app-icon.png` is a placeholder. |
| 9 | 2026-11-19 | Arabic: Expo Go logged "Layout direction could not be switched to rtl" | todo | Owner to retry after a full Expo Go restart. |
| 10 | 2026-11-19 | Map: Africa is badly positioned, move it down a little | done | Lowered 22 units; Mediterranean now visible. Needs device check. |
| 11 | 2026-11-19 | Map: two story-number indicators (chip badge + pin) — keep one | done | Kept the pin number; chip badge removed (count still read by screen readers). |
| 12 | 2026-11-19 | Map: clouds must float on top of the map, not under it | done | Clouds above continents, below pins; waves and boat stay on the ocean. |
| 13 | 2026-11-19 | Hide the top Android status bar (battery, notifications) | done | Hidden at runtime (expo-status-bar) and in app config (Android + iOS). |
| 14 | 2026-11-19 | Map: move Africa, North America and South America a little to the left | done | Shifted 20 units west; boat route moved to stay in the Atlantic. |
| 15 | 2026-11-19 | App icon: use more than one character and alternate them | done | Map-maker + traveller icon variants; splash shows the next one each launch. Store icon: owner picks at release. |
| 16 | 2026-11-19 | Guide characters: more detailed, close to realistic drawing | done | Both guides redrawn near-realistic (v2), same poses/frames; v1 kept in _masters. Icon variants still v1 style: regenerate if wanted. |
| 17 | 2026-11-19 | Phone log: "TypeError: Cannot read property 'length' of undefined" | done | Caused by the in-progress splash icon rotation (#15) reloading before splashIcons existed. |
| 18 | 2026-11-19 | Map scrolls horizontally on Android and vertically on iPad — looks bad | done | World adapts to the screen shape (no crop, no scroll); drag only in the zoomed continent view. |
| 19 | 2026-11-19 | Map: add a little bouncing effect to the continents | done | Staggered gentle hop + soft bounce landing per continent; still with reduce motion. |
| 20 | 2026-11-19 | Map: story count should be location pins — multiple pins, a different colour per continent | done | Teardrop pin per story (star when new), colour per continent, same-place stories fan out; pins bounce in. Continent-view pins unchanged. |
| 21 | 2026-11-19 | Age screen guide: waving looks bad; must not have an Arabic face; make it bigger | done | Renaissance explorer-cartographer (near-realistic), smooth 3-frame back-and-forth wave, ~88% of screen height. |
| 22 | 2026-11-19 | Map: the continent bouncing is a little much — reduce it and make it smooth | done | Half the height (2.5 px) and a slow sine float instead of a bounce. |
| 23 | 2026-11-19 | Settings → Language shows no character | done | Navigator guide now on Settings, pointing at the language cards. |
| 24 | 2026-11-19 | Language-screen guide: new character (not an Arabic face), bigger, smoother gesture | done | Young woman navigator-interpreter (~1500), near-realistic, smooth 3-frame point, ~86% of screen height. Traveller retired. |
| 25 | 2026-11-19 | iPad: "Cannot find native module 'ExpoAsset'" / "main has not been registered" | done | Project deps verified (expo install --check, expo-doctor 20/20). Expo Go iOS state after many reloads; Metro restarted with --clear; owner to force-quit Expo Go on iPad and reopen (update Expo Go if it persists). |
| 26 | 2026-11-19 | Android: make the language section smaller (no scrolling); order English, Spanish, French, Arabic | done | Compact cards (smaller text, padding, radio); Settings install ID on one line; order en, es, fr, ar. |
| 27 | 2026-11-19 | App icons: replace with the current guides (explorer + navigator) | done | Near-realistic explorer + navigator icons; splash alternates them. Store/home-screen icon set at release (needs a dev or store build). |
| 28 | 2026-11-19 | Splash: play the owner's video (splashScreen.mp4) | done | Full on first launch (tap to skip), short on later launches; silent 720p; localized title fades in over the end; borders accepted for the splash (owner). Adds expo-video (approved). |
| 29 | 2026-11-19 | Splash: the app icon doesn't look good over the video | done | Icon removed from the video splash (title only); static reduce-motion splash keeps it. |
| 30 | 2026-11-20 | Splash: play the full video on every launch, with a Skip button, and no "Atlas Tales / Learn History" | done | Full 6 s video every launch, Skip pill top corner (mirrors in Arabic), no title; short clip removed. |
| 31 | 2026-11-20 | Phase 4 (story player) approved | doing | Steps 1–3 built (backend, logic, player + chapter break + end/quiz); owner device test next. |
| 32 | 2026-11-20 | Generate a 15–20 page test story; narration with Gemini TTS; images in a creative style | doing (narration 12/72, free-tier quota) | Paper-cut diorama style; Tariq ibn Ziyad 711; validator --test mode for short test stories. |
| 33 | 2026-11-20 | Follow-up: Arabic word-by-word text reveal in the player (BUILD_GUIDE §7.2) | todo | |
| 34 | 2026-11-20 | Narration: use every free TTS model available (3.8 Flash, 3.8 Flash Lite, 3.1 Flash: 10 RPD / 3 RPM each) | doing | Day 1: en 18/18, fr 18/18, es 2/18, ar 0/18 (5 models used, incl. 2.5 Flash/Pro). Rest next day. |
| 35 | 2026-11-20 | Map: story pins are badly placed on the world map (iPad and Android) | todo | Calibrate each continent artwork with geographic control points. |
| 36 | 2026-11-20 | Story card: must not scroll; rounded corners on all 4 sides | done | Floating card, 4 corners, no scroll; chapters with minutes; "Continue chapter n" from saved progress. |
| 37 | 2026-11-20 | Player on phones: widest possible transcript with prev/next inside it; tap the picture to hide the controls; page-flip animation between images | todo | |
| 38 | 2026-11-20 | Suggestions / improvement ideas welcome | todo | |
