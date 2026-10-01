import type { Cue } from '../types'
import { parseTimestamp, formatTimestamp } from './time'

/**
 * Parse SRT text into cues. Tolerant of a leading BOM, CRLF line endings and
 * malformed blocks (which are skipped rather than failing the whole parse).
 */
export function parseSrt(input: string): Cue[] {
  const normalized = input
    .replace(/^﻿/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
  const blocks = normalized.split(/\n{2,}/)
  const cues: Cue[] = []
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim() !== '')
    if (lines.length < 2) continue
    const timeIdx = lines.findIndex((l) => l.includes('-->'))
    if (timeIdx < 0) continue
    const [startStr = '', endStr = ''] = lines[timeIdx].split('-->')
    const start = parseTimestamp(startStr)
    const end = parseTimestamp(endStr)
    if (start == null || end == null) continue
    const text = lines
      .slice(timeIdx + 1)
      .join('\n')
      .trim()
    cues.push({ id: `cue-${cues.length}`, start, end, text })
  }
  return cues
}

/** Serialize cues to SRT, renumbering from 1. */
export function formatSrt(cues: Cue[]): string {
  const body = cues
    .map((c, i) => `${i + 1}\n${formatTimestamp(c.start)} --> ${formatTimestamp(c.end)}\n${c.text}`)
    .join('\n\n')
  return body.length ? body + '\n' : ''
}
