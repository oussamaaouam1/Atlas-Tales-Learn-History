# Story Production Spec — Atlas Tales: Learn History (v0.1)

> Feed this file to Claude (for example as Claude Project knowledge) at the start of every story chat.
> It defines the **structure** of a story and how it is produced. The **visual style bible** is not decided yet (see section 10).
> This is a separate project file. Business decisions live in the business plan, not here.

---

## 0. The product in one paragraph

A family app (all ages) with a colourful world map. Tapping a place opens a **true, exciting story from history**, told in **Arabic, French, Spanish and English** with the same visuals. Stories are **32–40 pages** (about 12–20 minutes), split into **3 chapters**, with **40–60 images**. Tone: real, gripping and lightly funny, never a textbook. A friendly **guide character** introduces the story and makes 2–3 short asides per chapter.

## 1. Roles

| Who | Does what |
|---|---|
| Claude (content chat) | Researches, builds the fact list, writes the story JSON, adapts languages, writes the image list and prompts, writes narration notes |
| Oussama | Chooses stories, verifies facts, generates and polishes **images and audio by hand**, sets image timings, uploads |
| Upload script | Validates the JSON (schema check) and uploads it |

## 2. Workflow (6 stages)

| # | Stage | Output | Gate |
|---|---|---|---|
| 1 | **Brief**: Claude asks the brief questions (section 3) in ONE multiple-choice round | Filled brief | Oussama answers |
| 2 | **Research + fact list** | Fact list table (section 6) | Oussama approves the facts |
| 3 | **Story JSON** in the master language | JSON v2 (section 8), text in the master language only | Oussama reads it |
| 4 | **Adaptation** into the other 3 languages | Same JSON with all 4 languages filled | Spot-check |
| 5 | **Image list + prompts**, delivered **3 at a time**; Claude waits for `next` | 40–60 image entries (section 9) | Oussama generates by hand |
| 6 | **Final check** | Checklist (section 11) passed | Upload |

Rules: never skip the fact gate. Never write all stages in one message. End each image batch with: *"Say `next` for images X–Y."*

## 3. Brief questions (one round)

1. Which story? (from the regional backlog, or "suggest 5 for region X")
2. Region and era?
3. Focus: one person, one event, a place, or an invention?
4. Master language for writing: Arabic or English?
5. Length: 32 pages (standard) or 40 (big story)?
6. Accuracy mode: **strict** (only sourced facts) or **dramatized** (imagined scenes allowed, clearly labelled)?
7. Anything to avoid or to emphasize?

## 4. Story arc — 32-page beat map in 3 chapters

**Chapter 1: The world and the dream (pages 1–11)**

| Pages | Beat | Purpose |
|---|---|---|
| 1 | **Cold open** | Drop into the most dramatic moment ("The ships are burning…"). Then the guide: "But how did we get here? Let's go back…" |
| 2–4 | **Rewind** | Who, where, when: fast, concrete, with one relatable comparison |
| 5–7 | **The world** | What life looked like; what was at stake; the rival or the danger |
| 8–10 | **The ambition or problem** | What the hero wants or must solve, and why it seems impossible |
| 11 | **Chapter cliffhanger** | A decision or threat left open |

**Chapter 2: The struggle (pages 12–22)**

| Pages | Beat | Purpose |
|---|---|---|
| 12–14 | **Obstacle 1** | First attempt, partial success or failure |
| 15–17 | **Obstacle 2** | Bigger cost; an ally or rival appears |
| 18–21 | **Darkest moment** | Everything seems lost; the key question is asked |
| 22 | **Chapter cliffhanger** | The night before the decisive moment |

**Chapter 3: The turning point and the legacy (pages 23–32)**

| Pages | Beat | Purpose |
|---|---|---|
| 23–26 | **Turning point** | The decisive real event, told moment by moment |
| 27–28 | **Outcome** | What was won or lost, and at what price |
| 29–30 | **What happened next** | The years after; surprising twists |
| 31 | **Why it matters today** | A link to something the listener knows (a word, a food, a city, an invention) |
| 32 | **Closing echo** | Mirror of the cold open, with new meaning; the guide signs off and teases the next story |

**40-page variant:** add 2–3 pages to each chapter (more obstacles, more detail in the turning point).

**Devices to use:** cold open mirrored at the end · rule of three for obstacles · one key question asked at the darkest moment and answered at the turning point · a cliffhanger line at the end of chapters 1 and 2 · relatable numbers ("as tall as 40 camels stacked up").

## 5. Truth and sensitivity rules (non-negotiable)

1. **Real events only.** Every page is tagged `fact`, `disputed`, `legend` or `imagined`.
2. **Disputed** points are said as disputed ("historians disagree…"). **Legends** are said as legends ("the story goes…").
3. **No invented quotes presented as real.** Dialogue only if sourced (cite it) or clearly imagined ("he may have thought…") and tagged `imagined`.
4. **Never depict prophets** in images or describe their physical appearance. Treat all religious figures and beliefs with respect; no jokes about any religion or culture.
5. **No modern political borders or flags.** No commentary on current politics.
6. **No graphic violence.** Battles are told through tension, strategy and consequences, not gore.
7. **No ethnic stereotypes** in text or image prompts.
8. Names spelled consistently per language (use the `names` table in the JSON).

## 6. Fact list format (stage 2)

| # | Claim | Pages | Source (title + URL) | Confidence (high / medium / low) | Tag |
|---|---|---|---|---|---|
| 1 | Example: X happened in year Y | 2, 23 | … | high | fact |

At least **2 independent reputable sources** for each key claim (encyclopedias, university or museum pages, published histories).

## 7. Writing rules

- **Per page:** 40–70 words (2–4 sentences), about 20–35 seconds of narration.
- **Total:** about 1,600–2,600 words for 32–40 pages.
- **Readable for age 8+**, interesting for adults: short sentences, concrete images, sensory details.
- **Hook in the first 20 seconds.** Every page ends with a small pull forward (a question, a surprise, a "but…").
- **Guide character:** intro on page 1, 2–3 short funny asides per chapter (one sentence each), sign-off on the last page. Marked with `"speaker": "guide"`.
- **Humour:** surprise, irony, relatable comparisons. Never at the expense of a religion, culture or real victims.
- **Adaptation, not translation:** natural phrasing in each language; local name forms (for example Córdoba / قرطبة / Cordoue).

## 8. Story JSON v2

```json
{
  "id": "slug-of-the-story",
  "version": 2,
  "title":   { "ar": "", "fr": "", "es": "", "en": "" },
  "hook":    { "ar": "", "fr": "", "es": "", "en": "" },
  "keyTakeaway": { "ar": "", "fr": "", "es": "", "en": "" },
  "era":    { "period": "", "yearStart": 0, "yearEnd": 0, "region": "" },
  "location": { "name": "", "lat": 0, "lng": 0 },
  "masterLanguage": "ar",
  "accuracyMode": "strict",
  "names": [
    { "id": "hero", "ar": "", "fr": "", "es": "", "en": "" }
  ],
  "characters": {
    "hero": {
      "role": "", "age": "", "isReligiousFigure": false, "depict": true,
      "appearance": "3-5 fixed visual identifiers: period clothing, age, one signature item, one distinctive mark (artist's interpretation)",
      "personality": ""
    },
    "guide": { "role": "narrator guide", "appearance": "from the style bible", "personality": "curious, funny" }
  },
  "settings": [
    { "id": "palace", "name": "", "description": "fixed visual description + era details" }
  ],
  "chapters": [
    { "number": 1, "firstPage": 1,  "title": { "ar": "", "fr": "", "es": "", "en": "" } },
    { "number": 2, "firstPage": 12, "title": { "ar": "", "fr": "", "es": "", "en": "" } },
    { "number": 3, "firstPage": 23, "title": { "ar": "", "fr": "", "es": "", "en": "" } }
  ],
  "pages": [
    {
      "page": 1,
      "chapter": 1,
      "beat": "cold-open",
      "year": "",
      "settingId": "palace",
      "tag": "fact",
      "speaker": "narrator",
      "text": { "ar": "", "fr": "", "es": "", "en": "" },
      "historicalNote": "",
      "images": ["img-01", "img-02"]
    }
  ],
  "images": [
    {
      "id": "img-01",
      "page": 1,
      "order": 1,
      "type": "scene",
      "shot": "wide",
      "durationSec": null,
      "prompt": ""
    }
  ],
  "didYouKnow": { "ar": "", "fr": "", "es": "", "en": "" },
  "quiz": [
    {
      "question": { "ar": "", "fr": "", "es": "", "en": "" },
      "options":  [ { "ar": "", "fr": "", "es": "", "en": "" } ],
      "answerIndex": 0
    }
  ],
  "sources": [ { "title": "", "url": "" } ]
}
```

Field notes:
- `beat`: one of `cold-open`, `rewind`, `world`, `ambition`, `cliffhanger`, `obstacle-1`, `obstacle-2`, `darkest`, `turning-point`, `outcome`, `what-next`, `today`, `closing-echo`.
- `tag`: `fact` | `disputed` | `legend` | `imagined`.
- `speaker`: `narrator` | `guide`.
- `depict: false`: the figure is never shown (always false for prophets); show them by implication (a doorway, a crowd, a landscape) or not at all.
- `durationSec`: filled by Oussama after recording the audio (how long each image stays on screen within its page).
- Quiz: exactly 3 questions, 3–4 options each.

## 9. Images (stage 5)

**Count:** 40–60 per story, **not tied 1:1 to pages**. A dramatic page can have 2–3 images, a calm page 1.

**Image types:**

| type | Use |
|---|---|
| `scene` | Full illustrated moment |
| `plate` | Background location only (reused with cutouts) |
| `cutout` | A character or object on a **transparent background** |
| `detail` | Close-up of an object: coin, letter, sword, map, tool |
| `map` | Route or region map (no modern borders) |

**Shot types:** vary across consecutive images: `wide` → `medium` → `close` → `detail`.

**Prompt slots (fixed order):**

```
[STYLE TAG]          ← global, identical in every prompt (from the style bible, TBD)
+ [ERA BLOCK]        ← period, clothing, architecture, tools; no anachronisms
+ [SETTING]          ← setting name + fixed description + time of day / light
+ [CHARACTER BLOCK]  ← name + appearance copied VERBATIM from the JSON, for every character present
+ [ACTION / POSE]
+ [EMOTION]          ← follows the page beat
+ [SHOT]             ← wide / medium / close / detail
+ [CONSTRAINTS]      ← no text, no letters, no modern flags or borders, no gore; transparent background for cutouts
```

**Consistency:** never paraphrase a character's appearance; restate the setting each time; never depict a figure with `depict: false`.

**Delivery:** 3 image entries at a time, then *"Say `next` for images X–Y."*

## 10. Visual style bible: TO BE DECIDED

Placeholder. Will define: the global STYLE TAG, colour palette, lighting, guide character sheet (front, side, 4–6 expressions), passport stamp template, reference images.

## 11. Pre-upload checklist

- [ ] Fact list approved; every key claim has 2 sources
- [ ] Every page tagged; legends and disputed points worded as such; no fake quotes
- [ ] No prophet depicted; `depict` set correctly for every character
- [ ] All 4 languages filled for every text field (title, hook, chapters, pages, didYouKnow, quiz)
- [ ] Names consistent with the `names` table in every language
- [ ] 32–40 pages, 3 chapters, cliffhangers at the end of chapters 1 and 2
- [ ] 40–60 images; every page has at least 1 image; every image has `durationSec`
- [ ] Images: no text, no modern borders or flags; cutouts on transparent background; WebP optimized
- [ ] Audio: one file per page per language, names pronounced correctly, M4A
- [ ] `location` lat/lng set (the map pin) and `era` filled
- [ ] Quiz has 3 questions with the correct `answerIndex`
- [ ] JSON passes the schema check in the upload script

## 12. Story backlog (fill by region so the map grows evenly)

| Region | Story idea | Era | Status |
|---|---|---|---|
| North Africa | | | idea |
| Al-Andalus / Iberia | | | idea |
| Middle East | | | idea |
| Sub-Saharan Africa | | | idea |
| Europe | | | idea |
| Asia | | | idea |
| Americas | | | idea |
| Oceania | | | idea |
