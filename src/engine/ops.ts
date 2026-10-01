import type { Cue, OverlapIssue, SpeedIssue } from '../types'

/** Shift every cue by a delta in milliseconds (negative shifts earlier). */
export function shiftCues(cues: Cue[], deltaMs: number): Cue[] {
  return cues.map((c) => ({ ...c, start: c.start + deltaMs, end: c.end + deltaMs }))
}

/** Merge cues whose gap from the previous one is within `maxGapMs`. */
export function mergeAdjacent(cues: Cue[], maxGapMs: number): Cue[] {
  const sorted = [...cues].sort((a, b) => a.start - b.start)
  const out: Cue[] = []
  for (const cue of sorted) {
    const last = out[out.length - 1]
    if (last && cue.start - last.end <= maxGapMs) {
      last.end = Math.max(last.end, cue.end)
      last.text = `${last.text}\n${cue.text}`
    } else {
      out.push({ ...cue })
    }
  }
  return out
}

function splitText(text: string, maxChars: number): string[] {
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > maxChars) {
    const window = remaining.slice(0, maxChars)
    let cut = maxChars
    const puncts = [...window.matchAll(/[。！？!?；;，,、]/g)]
    const last = puncts[puncts.length - 1]
    if (last && last.index !== undefined && last.index + 1 >= Math.floor(maxChars / 2)) {
      cut = last.index + 1
    }
    chunks.push(remaining.slice(0, cut))
    remaining = remaining.slice(cut)
  }
  if (remaining) chunks.push(remaining)
  return chunks
}

/** Split cues longer than `maxChars`, distributing time proportionally by length. */
export function splitLongCues(cues: Cue[], maxChars: number): Cue[] {
  const out: Cue[] = []
  for (const cue of cues) {
    const text = cue.text.trim()
    if (!text || text.length <= maxChars) {
      out.push({ ...cue, text })
      continue
    }
    const chunks = splitText(text, maxChars)
    const totalDuration = Math.max(cue.end - cue.start, 1)
    let t = cue.start
    for (const chunk of chunks) {
      const duration = Math.round((chunk.length / text.length) * totalDuration)
      out.push({ ...cue, start: t, end: t + duration, text: chunk })
      t += duration
    }
  }
  return out
}

/** Report invalid or overlapping cues. `index` refers to the original order. */
export function detectOverlaps(cues: Cue[]): OverlapIssue[] {
  const indexed = cues.map((c, index) => ({ c, index }))
  const sorted = [...indexed].sort((a, b) => a.c.start - b.c.start)
  const issues: OverlapIssue[] = []
  for (let k = 0; k < sorted.length; k++) {
    const { c, index } = sorted[k]
    if (c.end <= c.start) {
      issues.push({ cueId: c.id, index, message: '结束时间早于或等于开始时间' })
    }
    if (k > 0) {
      const prev = sorted[k - 1].c
      if (c.start < prev.end) {
        issues.push({ cueId: c.id, index, message: '与前一条字幕时间重叠' })
      }
    }
  }
  return issues
}

/** Flag cues exceeding `thresholdCps` characters per second (readability). */
export function readingSpeed(cues: Cue[], thresholdCps = 20): SpeedIssue[] {
  return cues
    .map((c, index) => {
      const seconds = (c.end - c.start) / 1000
      const cps = seconds > 0 ? c.text.length / seconds : 0
      return { cueId: c.id, index, cps, text: c.text }
    })
    .filter((s) => s.cps > thresholdCps)
}
