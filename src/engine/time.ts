/**
 * Subtitle timestamp handling. Accepts "HH:MM:SS,mmm" (SRT) and "HH:MM:SS.mmm"
 * (VTT/WebVTT) forms; returns milliseconds or null when unparseable.
 */
export function parseTimestamp(input: string): number | null {
  const t = input.trim()
  const m = t.match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  const sec = Number(m[3])
  const ms = Number(m[4].padEnd(3, '0'))
  if (min >= 60 || sec >= 60) return null
  return (h * 3600 + min * 60 + sec) * 1000 + ms
}

/** Format milliseconds as an SRT timestamp "HH:MM:SS,mmm". */
export function formatTimestamp(ms: number): string {
  const total = Math.max(0, Math.round(ms))
  const h = Math.floor(total / 3_600_000)
  const min = Math.floor((total % 3_600_000) / 60_000)
  const sec = Math.floor((total % 60_000) / 1000)
  const m = total % 1000
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${pad(h)}:${pad(min)}:${pad(sec)},${pad(m, 3)}`
}
