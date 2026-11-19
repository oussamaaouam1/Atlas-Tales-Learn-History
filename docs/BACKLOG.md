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
| 18 | 2026-11-19 | Map scrolls horizontally on Android and vertically on iPad — looks bad | todo | Fit the world to the screen with no scrolling. |
