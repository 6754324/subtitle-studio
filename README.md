# Subtitle Studio

A subtitle timing, clean-up and translation workbench. Paste or load an SRT track,
edit cues inline, run timing operations, and export a clean file — with optional
AI translation of every line.

## Features

- **SRT import/export** — tolerant parser (BOM, CRLF, malformed blocks) and a
  renumbering serializer, with a paste-import dialog and `.srt` download.
- **Inline editing** — start/end timestamps (parsed on blur) and subtitle text,
  with per-row reorder / insert-after / delete.
- **Timeline operations**
  - 整体平移 — shift every cue by ±ms (with quick `+500 / -500 / +1000ms`).
  - 合并近邻 — merge cues whose gap is within a threshold.
  - 拆分长句 — split over-long cues, distributing time proportionally and
    preferring punctuation break points.
- **Quality check** — flags overlapping / invalid cues and reading-speed
  violations (characters per second).
- **AI translation** — batch-translate all lines to a target language via
  DeepSeek, with a canned-demo fallback so the app runs with no key.

## The self-developed core

The algorithm layer is pure TypeScript under [`src/engine`](src/engine), fully
unit-tested (20 tests) in [`src/engine/engine.test.ts`](src/engine/engine.test.ts):

| Module | Responsibility |
| --- | --- |
| [`time.ts`](src/engine/time.ts) | Parse/format `HH:MM:SS,mmm` and `HH:MM:SS.mmm` timestamps to/from ms. |
| [`srt.ts`](src/engine/srt.ts) | SRT parsing (tolerant) and serialization (renumbering). |
| [`ops.ts`](src/engine/ops.ts) | shift / merge / split / overlap-detect / reading-speed algorithms. |
| [`stats.ts`](src/engine/stats.ts) | Count, total/avg/min/max duration, character totals. |

The AI layer ([`src/ai/translate.ts`](src/ai/translate.ts)) is isolated from this
engine — it only rewrites cue text, which then flows through the same editor and
export path as hand-edited subtitles.

## Tech

React 19 · TypeScript (strict) · Vite · Tailwind CSS 4 · Zustand (persisted state) · Vitest

## AI setup

Paste a DeepSeek API key in the right panel to enable live translation. The browser
calls the serverless proxy at [`api/translate.ts`](api/translate.ts) (deployed on
Vercel). Without a key the app uses the demo path. You can also set a
`DEEPSEEK_API_KEY` environment variable on the deployment.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # type-check + production build
```
