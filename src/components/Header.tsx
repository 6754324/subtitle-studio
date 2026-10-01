import { useSubtitleStore } from '../store/subtitleStore'
import { formatSrt } from '../engine/srt'

export function Header({ onOpenImport }: { onOpenImport: () => void }) {
  const cues = useSubtitleStore((s) => s.cues)
  const loadDemo = useSubtitleStore((s) => s.loadDemo)
  const clearAll = useSubtitleStore((s) => s.clearAll)

  const exportSrt = () => {
    const text = formatSrt(cues)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subtitles.srt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ink-200 px-4">
      <div className="flex items-baseline gap-2.5">
        <h1 className="font-display text-lg font-semibold tracking-tight text-ink-900">Subtitle Studio</h1>
        <span className="text-xs text-ink-400">字幕 · 时间轴 · 翻译</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={loadDemo}
          className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-600 transition hover:border-ink-300 hover:text-ink-900"
        >
          载入示例
        </button>
        <button
          onClick={onOpenImport}
          className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-600 transition hover:border-ink-300 hover:text-ink-900"
        >
          导入 SRT
        </button>
        <button
          onClick={clearAll}
          disabled={cues.length === 0}
          className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-500 transition hover:text-ink-900 disabled:opacity-40"
        >
          清空
        </button>
        <button
          onClick={exportSrt}
          disabled={cues.length === 0}
          className="rounded-md bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-paper-50 transition hover:bg-brand-500 disabled:opacity-40"
        >
          导出 SRT
        </button>
      </div>
    </header>
  )
}
