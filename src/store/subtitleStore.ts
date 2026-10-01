import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cue } from '../types'
import { DEMO_CUES } from '../data/demo'
import { shiftCues, mergeAdjacent, splitLongCues } from '../engine/ops'

interface SubtitleState {
  cues: Cue[]
  selectedCueId: string | null
  targetLang: string
  apiKey: string

  setCues: (cues: Cue[]) => void
  addCue: (afterId: string | null) => void
  updateCue: (id: string, patch: Partial<Cue>) => void
  removeCue: (id: string) => void
  moveCue: (id: string, dir: -1 | 1) => void
  selectCue: (id: string | null) => void

  applyShift: (deltaMs: number) => void
  applyMerge: (maxGapMs: number) => void
  applySplit: (maxChars: number) => void

  setTargetLang: (lang: string) => void
  setApiKey: (key: string) => void

  loadDemo: () => void
  clearAll: () => void
}

export const useSubtitleStore = create<SubtitleState>()(
  persist(
    (set, get) => ({
      cues: [],
      selectedCueId: null,
      targetLang: '英语',
      apiKey: '',

      setCues: (cues) => set({ cues, selectedCueId: null }),

      addCue: (afterId) => {
        const { cues } = get()
        const idx = afterId ? cues.findIndex((c) => c.id === afterId) : -1
        const base = idx >= 0 ? cues[idx].end : cues.length ? cues[cues.length - 1].end : 0
        const cue: Cue = {
          id: crypto.randomUUID(),
          start: base,
          end: base + 1000,
          text: '',
        }
        const next = [...cues]
        next.splice(idx + 1, 0, cue)
        set({ cues: next, selectedCueId: cue.id })
      },

      updateCue: (id, patch) =>
        set((s) => ({
          cues: s.cues.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeCue: (id) =>
        set((s) => ({
          cues: s.cues.filter((c) => c.id !== id),
          selectedCueId: s.selectedCueId === id ? null : s.selectedCueId,
        })),

      moveCue: (id, dir) =>
        set((s) => {
          const idx = s.cues.findIndex((c) => c.id === id)
          const target = idx + dir
          if (idx < 0 || target < 0 || target >= s.cues.length) return s
          const next = [...s.cues]
          const [item] = next.splice(idx, 1)
          next.splice(target, 0, item)
          return { cues: next }
        }),

      selectCue: (id) => set({ selectedCueId: id }),

      applyShift: (deltaMs) => set((s) => ({ cues: shiftCues(s.cues, deltaMs) })),
      applyMerge: (maxGapMs) => set((s) => ({ cues: mergeAdjacent(s.cues, maxGapMs) })),
      applySplit: (maxChars) => set((s) => ({ cues: splitLongCues(s.cues, maxChars) })),

      setTargetLang: (targetLang) => set({ targetLang }),
      setApiKey: (apiKey) => set({ apiKey }),

      loadDemo: () => set({ cues: DEMO_CUES, selectedCueId: DEMO_CUES[0]?.id ?? null }),
      clearAll: () => set({ cues: [], selectedCueId: null }),
    }),
    {
      name: 'subtitle-studio',
      partialize: (s) => ({ cues: s.cues, targetLang: s.targetLang }),
    },
  ),
)
