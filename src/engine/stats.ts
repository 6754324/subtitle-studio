import type { Cue } from '../types'

export interface SubtitleStats {
  count: number
  totalDuration: number
  avgDuration: number
  minDuration: number
  maxDuration: number
  totalChars: number
}

export function computeStats(cues: Cue[]): SubtitleStats {
  const durations = cues.map((c) => c.end - c.start)
  const totalDuration = durations.reduce((a, b) => a + b, 0)
  const totalChars = cues.reduce((a, c) => a + c.text.length, 0)
  return {
    count: cues.length,
    totalDuration,
    avgDuration: cues.length ? totalDuration / cues.length : 0,
    minDuration: cues.length ? Math.min(...durations) : 0,
    maxDuration: cues.length ? Math.max(...durations) : 0,
    totalChars,
  }
}
