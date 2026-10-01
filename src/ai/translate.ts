import type { Cue } from '../types'

export interface TranslateResult {
  cues: Cue[]
  /** 'demo' = no key configured, cues left unchanged; 'api' = live model output. */
  source: 'demo' | 'api'
}

/**
 * Translate all cue texts to `targetLang`. Falls back to leaving the cues
 * unchanged (source 'demo') when no API key is set or the endpoint fails, so
 * the portfolio stays runnable with zero configuration.
 */
export async function translateCues(
  cues: Cue[],
  targetLang: string,
  apiKey: string,
): Promise<TranslateResult> {
  if (!apiKey) {
    return { cues: cues.map((c) => ({ ...c })), source: 'demo' }
  }
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: cues.map((c) => c.text), targetLang, apiKey }),
    })
    if (!res.ok) throw new Error(`translate failed: ${res.status}`)
    const data = (await res.json()) as { translations?: unknown }
    const translations = Array.isArray(data.translations) ? data.translations : []
    return {
      cues: cues.map((c, i) => ({
        ...c,
        text: typeof translations[i] === 'string' && translations[i].trim() ? translations[i].trim() : c.text,
      })),
      source: 'api',
    }
  } catch {
    return { cues: cues.map((c) => ({ ...c })), source: 'demo' }
  }
}
