import { useState } from 'react'
import { useSubtitleStore } from '../store/subtitleStore'
import { parseSrt } from '../engine/srt'

export function ImportModal({ onClose }: { onClose: () => void }) {
  const setCues = useSubtitleStore((s) => s.setCues)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const import_ = () => {
    const cues = parseSrt(text)
    if (cues.length === 0) {
      setError('未能解析出任何字幕，请检查 SRT 格式（序号 / 时间轴 --> / 文本）。')
      return
    }
    setCues(cues)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="flex h-full max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-white/10 bg-ink-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">导入 SRT</h2>
          <span className="text-xs text-zinc-600">粘贴 .srt 内容</span>
          <button onClick={onClose} className="ml-auto text-zinc-500 transition hover:text-white">
            ✕
          </button>
        </header>
        <textarea
          className="min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-zinc-200 outline-none"
          placeholder={'1\n00:00:01,000 --> 00:00:03,000\n第一句字幕\n\n2\n00:00:04,000 --> 00:00:06,000\n第二句字幕'}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError('')
          }}
        />
        {error && <p className="px-4 pb-2 text-xs text-rose-400">{error}</p>}
        <footer className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-400 transition hover:text-white"
          >
            取消
          </button>
          <button
            onClick={import_}
            className="rounded-md bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brand-500"
          >
            导入
          </button>
        </footer>
      </div>
    </div>
  )
}
