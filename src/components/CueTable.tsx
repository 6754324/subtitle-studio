import { memo, useEffect, useState } from 'react'
import { useSubtitleStore } from '../store/subtitleStore'
import { formatTimestamp, parseTimestamp } from '../engine/time'
import type { Cue } from '../types'

const timeCls =
  'w-28 rounded border border-transparent bg-transparent px-1.5 py-1 font-mono text-xs text-zinc-300 outline-none transition hover:border-white/10 focus:border-brand-500/60 focus:bg-ink-800'

const CueRow = memo(function CueRow({ cue, index, total }: { cue: Cue; index: number; total: number }) {
  const selected = useSubtitleStore((s) => s.selectedCueId === cue.id)
  const updateCue = useSubtitleStore((s) => s.updateCue)
  const removeCue = useSubtitleStore((s) => s.removeCue)
  const moveCue = useSubtitleStore((s) => s.moveCue)
  const selectCue = useSubtitleStore((s) => s.selectCue)
  const addCue = useSubtitleStore((s) => s.addCue)

  const [startText, setStartText] = useState(formatTimestamp(cue.start))
  const [endText, setEndText] = useState(formatTimestamp(cue.end))

  useEffect(() => setStartText(formatTimestamp(cue.start)), [cue.start])
  useEffect(() => setEndText(formatTimestamp(cue.end)), [cue.end])

  const commitStart = () => {
    const ms = parseTimestamp(startText)
    if (ms != null) updateCue(cue.id, { start: ms })
    else setStartText(formatTimestamp(cue.start))
  }
  const commitEnd = () => {
    const ms = parseTimestamp(endText)
    if (ms != null) updateCue(cue.id, { end: ms })
    else setEndText(formatTimestamp(cue.end))
  }

  return (
    <div
      onClick={() => selectCue(cue.id)}
      className={`group flex items-start gap-2 border-b border-white/5 px-3 py-2 transition ${
        selected ? 'bg-brand-500/5' : 'hover:bg-white/[0.02]'
      }`}
    >
      <span className="mt-1.5 w-8 shrink-0 text-right font-mono text-xs text-zinc-600">{index + 1}</span>
      <input className={timeCls} value={startText} onChange={(e) => setStartText(e.target.value)} onBlur={commitStart} />
      <input className={timeCls} value={endText} onChange={(e) => setEndText(e.target.value)} onBlur={commitEnd} />
      <textarea
        className="min-h-[2.25rem] flex-1 resize-y rounded border border-transparent bg-transparent px-1.5 py-1 text-sm leading-relaxed text-zinc-200 outline-none transition hover:border-white/10 focus:border-brand-500/60 focus:bg-ink-800"
        value={cue.text}
        onChange={(e) => updateCue(cue.id, { text: e.target.value })}
        rows={cue.text.includes('\n') ? 2 : 1}
      />
      <div className="flex shrink-0 items-center gap-0.5 pt-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            moveCue(cue.id, -1)
          }}
          disabled={index === 0}
          className="rounded px-1 text-zinc-500 hover:text-white disabled:opacity-30"
          title="上移"
        >
          ↑
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            moveCue(cue.id, 1)
          }}
          disabled={index === total - 1}
          className="rounded px-1 text-zinc-500 hover:text-white disabled:opacity-30"
          title="下移"
        >
          ↓
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            addCue(cue.id)
          }}
          className="rounded px-1 text-zinc-500 hover:text-accent-300"
          title="在此后插入"
        >
          ＋
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            removeCue(cue.id)
          }}
          className="rounded px-1 text-zinc-600 hover:text-rose-400"
          title="删除"
        >
          ✕
        </button>
      </div>
    </div>
  )
})

export function CueTable() {
  const cues = useSubtitleStore((s) => s.cues)
  const addCue = useSubtitleStore((s) => s.addCue)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-white/10 px-3 py-2 text-xs text-zinc-500">
        <span className="w-8 shrink-0 text-right">#</span>
        <span className="w-28 shrink-0 px-1.5">开始</span>
        <span className="w-28 shrink-0 px-1.5">结束</span>
        <span className="flex-1 px-1.5">字幕文本</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {cues.map((cue, i) => (
          <CueRow key={cue.id} cue={cue} index={i} total={cues.length} />
        ))}
        {cues.length === 0 && (
          <div className="px-4 py-16 text-center text-sm text-zinc-600">
            还没有字幕 — 「载入示例」或「导入 SRT」
          </div>
        )}
      </div>
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => addCue(null)}
          className="w-full rounded-md border border-dashed border-white/15 px-3 py-2 text-sm text-zinc-500 transition hover:border-white/30 hover:text-zinc-300"
        >
          + 添加字幕
        </button>
      </div>
    </div>
  )
}
