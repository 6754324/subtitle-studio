import { describe, expect, it } from 'vitest'
import { parseTimestamp, formatTimestamp } from './time'
import { parseSrt, formatSrt } from './srt'
import { shiftCues, mergeAdjacent, splitLongCues, detectOverlaps, readingSpeed } from './ops'
import { computeStats } from './stats'
import type { Cue } from '../types'

function cue(partial: Partial<Cue> & { id: string }): Cue {
  return { start: 0, end: 1000, text: '', ...partial }
}

describe('parseTimestamp', () => {
  it('parses SRT comma form', () => {
    expect(parseTimestamp('00:00:01,500')).toBe(1500)
  })
  it('parses VTT dot form', () => {
    expect(parseTimestamp('00:01:02.250')).toBe(62250)
  })
  it('parses single-digit hour', () => {
    expect(parseTimestamp('1:00:00,000')).toBe(3600000)
  })
  it('rejects invalid input', () => {
    expect(parseTimestamp('1:60:00,000')).toBeNull()
    expect(parseTimestamp('00:00:99,000')).toBeNull()
    expect(parseTimestamp('garbage')).toBeNull()
  })
})

describe('formatTimestamp', () => {
  it('formats milliseconds to SRT', () => {
    expect(formatTimestamp(1500)).toBe('00:00:01,500')
    expect(formatTimestamp(3725000)).toBe('01:02:05,000')
  })
  it('clamps negatives to zero', () => {
    expect(formatTimestamp(-5)).toBe('00:00:00,000')
  })
})

describe('parseSrt', () => {
  it('parses a full block', () => {
    const cues = parseSrt('1\n00:00:01,000 --> 00:00:03,000\n你好\n\n2\n00:00:04,000 --> 00:00:06,000\n世界')
    expect(cues).toHaveLength(2)
    expect(cues[0].start).toBe(1000)
    expect(cues[0].end).toBe(3000)
    expect(cues[0].text).toBe('你好')
    expect(cues[1].text).toBe('世界')
  })
  it('handles BOM and CRLF', () => {
    const cues = parseSrt('﻿1\r\n00:00:01,000 --> 00:00:02,000\r\n测试')
    expect(cues).toHaveLength(1)
    expect(cues[0].text).toBe('测试')
  })
  it('skips malformed blocks', () => {
    const cues = parseSrt('junk\n\n1\n00:00:01,000 --> 00:00:02,000\nok')
    expect(cues).toHaveLength(1)
    expect(cues[0].text).toBe('ok')
  })
  it('preserves multi-line text', () => {
    const cues = parseSrt('1\n00:00:01,000 --> 00:00:02,000\n第一行\n第二行')
    expect(cues[0].text).toBe('第一行\n第二行')
  })
})

describe('formatSrt', () => {
  it('round-trips cues', () => {
    const cues = [cue({ id: 'a', start: 1000, end: 3000, text: '你好' })]
    const out = formatSrt(cues)
    expect(out).toBe('1\n00:00:01,000 --> 00:00:03,000\n你好\n')
  })
  it('returns empty for no cues', () => {
    expect(formatSrt([])).toBe('')
  })
})

describe('shiftCues', () => {
  it('moves both start and end', () => {
    const out = shiftCues([cue({ id: 'a', start: 1000, end: 2000 })], 500)
    expect(out[0].start).toBe(1500)
    expect(out[0].end).toBe(2500)
  })
})

describe('mergeAdjacent', () => {
  it('merges cues within the gap', () => {
    const cues = [
      cue({ id: 'a', start: 0, end: 1000, text: 'A' }),
      cue({ id: 'b', start: 1100, end: 2000, text: 'B' }),
    ]
    const out = mergeAdjacent(cues, 200)
    expect(out).toHaveLength(1)
    expect(out[0].end).toBe(2000)
    expect(out[0].text).toBe('A\nB')
  })
  it('keeps cues beyond the gap separate', () => {
    const cues = [
      cue({ id: 'a', start: 0, end: 1000, text: 'A' }),
      cue({ id: 'b', start: 3000, end: 4000, text: 'B' }),
    ]
    expect(mergeAdjacent(cues, 200)).toHaveLength(2)
  })
})

describe('splitLongCues', () => {
  it('splits a long cue into two', () => {
    const out = splitLongCues([cue({ id: 'a', start: 0, end: 1000, text: '一二三四五六' })], 3)
    expect(out.length).toBeGreaterThan(1)
    expect(out.every((c) => c.text.length <= 3)).toBe(true)
    expect(out[out.length - 1].end).toBe(1000)
  })
  it('leaves short cues alone', () => {
    const out = splitLongCues([cue({ id: 'a', start: 0, end: 1000, text: '短' })], 3)
    expect(out).toHaveLength(1)
  })
})

describe('detectOverlaps', () => {
  it('flags invalid and overlapping cues', () => {
    const cues = [
      cue({ id: 'a', start: 0, end: 2000, text: 'A' }),
      cue({ id: 'b', start: 1500, end: 3000, text: 'B' }),
      cue({ id: 'c', start: 5000, end: 5000, text: 'C' }),
    ]
    const issues = detectOverlaps(cues)
    expect(issues.some((i) => i.cueId === 'b')).toBe(true)
    expect(issues.some((i) => i.cueId === 'c')).toBe(true)
  })
})

describe('readingSpeed', () => {
  it('flags too-fast cues', () => {
    const cues = [cue({ id: 'a', start: 0, end: 1000, text: '这是一句非常长的字幕文本超过了正常阅读速度的阈值' })]
    const issues = readingSpeed(cues, 20)
    expect(issues).toHaveLength(1)
    expect(issues[0].cps).toBeGreaterThan(20)
  })
})

describe('computeStats', () => {
  it('sums durations and counts', () => {
    const cues = [
      cue({ id: 'a', start: 0, end: 1000, text: 'A' }),
      cue({ id: 'b', start: 1000, end: 3000, text: 'BB' }),
    ]
    const stats = computeStats(cues)
    expect(stats.count).toBe(2)
    expect(stats.totalDuration).toBe(3000)
    expect(stats.avgDuration).toBe(1500)
    expect(stats.totalChars).toBe(3)
  })
})
