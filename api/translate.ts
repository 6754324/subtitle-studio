/**
 * Vercel Edge function that batch-translates subtitle lines via DeepSeek.
 * Key from request body or DEEPSEEK_API_KEY env var. Kept out of `tsconfig`
 * include — Vercel bundles it itself.
 */
export const config = { runtime: 'edge' }

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function stripFences(text: string): string {
  const t = text.trim()
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fence ? fence[1] : t
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'POST only' }, 405)

  let body: Record<string, unknown> | null = null
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }

  const apiKey =
    typeof body.apiKey === 'string' && body.apiKey ? body.apiKey : process.env.DEEPSEEK_API_KEY
  if (!apiKey) return json({ error: 'no API key' }, 401)

  const texts = Array.isArray(body.texts)
    ? body.texts.filter((t): t is string => typeof t === 'string')
    : []
  if (texts.length === 0) return json({ translations: [] })

  const targetLang = typeof body.targetLang === 'string' ? body.targetLang : '英语'

  const system = `你是一名专业字幕译员。把用户给的字幕逐条翻译成${targetLang}。
保持口语自然、简洁，不添加解释。严格只输出一个 JSON 数组，元素是与输入顺序一一对应的译文字符串。`
  const user = texts.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  })

  if (!upstream.ok) {
    const err = await upstream.text().catch(() => '')
    return json({ error: `upstream ${upstream.status}`, detail: err }, 502)
  }

  const data = (await upstream.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content ?? ''
  try {
    const translations = JSON.parse(stripFences(content))
    return json({ translations: Array.isArray(translations) ? translations : [] })
  } catch {
    return json({ error: 'model returned invalid JSON', content }, 502)
  }
}
