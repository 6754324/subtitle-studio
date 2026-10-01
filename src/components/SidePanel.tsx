import { useState, type ReactNode } from 'react'
import { useSubtitleStore } from '../store/subtitleStore'
import { detectOverlaps, readingSpeed } from '../engine/ops'
import { computeStats } from '../engine/stats'
import { formatTimestamp } from '../engine/time'
import { translateCues } from '../ai/translate'
import { LANGUAGES } from '../data/demo'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">{title}</h2>
      {children}
    </section>
  )
}

const fieldCls =
  'w-full rounded-md border border-ink-200 bg-paper-200 px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-500/60'

export function SidePanel() {
  const cues = useSubtitleStore((s) => s.cues)
  const targetLang = useSubtitleStore((s) => s.targetLang)
  const apiKey = useSubtitleStore((s) => s.apiKey)
  const setTargetLang = useSubtitleStore((s) => s.setTargetLang)
  const setApiKey = useSubtitleStore((s) => s.setApiKey)
  const setCues = useSubtitleStore((s) => s.setCues)
  const applyShift = useSubtitleStore((s) => s.applyShift)
  const applyMerge = useSubtitleStore((s) => s.applyMerge)
  const applySplit = useSubtitleStore((s) => s.applySplit)

  const [shiftValue, setShiftValue] = useState('500')
  const [mergeValue, setMergeValue] = useState('300')
  const [splitValue, setSplitValue] = useState('20')
  const [translating, setTranslating] = useState(false)
  const [translateSource, setTranslateSource] = useState<'demo' | 'api' | null>(null)

  const overlaps = detectOverlaps(cues)
  const speedIssues = readingSpeed(cues, 20)
  const stats = computeStats(cues)

  const onTranslate = async () => {
    setTranslating(true)
    setTranslateSource(null)
    const result = await translateCues(cues, targetLang, apiKey.trim())
    setCues(result.cues)
    setTranslateSource(result.source)
    setTranslating(false)
  }

  return (
    <div className="space-y-6">
      <Section title="时间轴操作">
        <div>
          <label className="mb-1 block text-[11px] text-ink-400">整体平移（毫秒，可负）</label>
          <div className="flex gap-1.5">
            <input className={fieldCls} value={shiftValue} onChange={(e) => setShiftValue(e.target.value)} />
            <button
              onClick={() => applyShift(Number(shiftValue) || 0)}
              className="shrink-0 rounded-md bg-paper-200 px-3 text-sm text-ink-700 transition hover:bg-paper-200/70"
            >
              应用
            </button>
          </div>
          <div className="mt-1.5 flex gap-1">
            {[-500, 500, 1000].map((d) => (
              <button
                key={d}
                onClick={() => applyShift(d)}
                className="rounded border border-ink-200 px-2 py-0.5 text-[11px] text-ink-500 transition hover:text-ink-900"
              >
                {d > 0 ? `+${d}` : d}ms
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-ink-400">合并近邻（间隔 ≤ 毫秒）</label>
          <div className="flex gap-1.5">
            <input className={fieldCls} value={mergeValue} onChange={(e) => setMergeValue(e.target.value)} />
            <button
              onClick={() => applyMerge(Number(mergeValue) || 0)}
              className="shrink-0 rounded-md bg-paper-200 px-3 text-sm text-ink-700 transition hover:bg-paper-200/70"
            >
              合并
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-ink-400">拆分长句（超过 字）</label>
          <div className="flex gap-1.5">
            <input className={fieldCls} value={splitValue} onChange={(e) => setSplitValue(e.target.value)} />
            <button
              onClick={() => applySplit(Number(splitValue) || 20)}
              className="shrink-0 rounded-md bg-paper-200 px-3 text-sm text-ink-700 transition hover:bg-paper-200/70"
            >
              拆分
            </button>
          </div>
        </div>
      </Section>

      <Section title="AI 翻译">
        <input
          className={fieldCls}
          type="password"
          placeholder="DeepSeek API Key（可选）"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <select
          className={fieldCls}
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          onClick={onTranslate}
          disabled={translating || cues.length === 0}
          className="w-full rounded-md bg-accent-600 px-3 py-2 text-sm font-medium text-paper-50 transition hover:bg-accent-500 disabled:opacity-50"
        >
          {translating ? '翻译中…' : `✨ 翻译为${targetLang}`}
        </button>
        <p className="text-[11px] leading-relaxed text-ink-400">
          {translateSource === 'api' && '已用 AI 模型逐条翻译。'}
          {translateSource === 'demo' && '未配置 Key，示例模式未改动字幕（可离线体验）。'}
          {!translateSource && '未配置 Key 时使用内置示例，配置后走 DeepSeek 实时翻译。'}
        </p>
      </Section>

      <Section title="质量检查">
        {overlaps.length === 0 && speedIssues.length === 0 ? (
          <p className="text-[11px] text-emerald-600">✓ 未发现时间轴或语速问题</p>
        ) : (
          <ul className="space-y-1.5">
            {overlaps.map((o, i) => (
              <li key={`o-${i}`} className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-700">
                第 {o.index + 1} 条：{o.message}
              </li>
            ))}
            {speedIssues.map((s, i) => (
              <li key={`s-${i}`} className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-700">
                第 {s.index + 1} 条语速过快（{s.cps.toFixed(1)} 字/秒）
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="统计">
        <div className="grid grid-cols-2 gap-1.5 text-center text-xs">
          <div className="rounded-md bg-ink-900/5 px-1 py-2">
            <div className="font-mono text-base text-ink-900">{stats.count}</div>
            <div className="text-ink-400">条字幕</div>
          </div>
          <div className="rounded-md bg-ink-900/5 px-1 py-2">
            <div className="font-mono text-base text-ink-900">{stats.totalChars}</div>
            <div className="text-ink-400">总字数</div>
          </div>
        </div>
        <div className="rounded-md bg-ink-900/5 px-3 py-2 font-mono text-xs text-ink-500">
          总时长 {formatTimestamp(stats.totalDuration)}
          <br />
          平均 {stats.count ? (stats.avgDuration / 1000).toFixed(1) : '0.0'} 秒 / 条
        </div>
      </Section>
    </div>
  )
}
