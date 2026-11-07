import { SUPPORTED_LENGTHS } from '../constant'

/** Answer endpoint from `VITE_ANSWER_API` in `.env`. */
export const ANSWER_API_URL: string = import.meta.env.VITE_ANSWER_API
  ? `${import.meta.env.VITE_ANSWER_API}/today`
  : ''

/** The endpoint's raw body, e.g. `hgcn`. */
export async function fetchAnswerText(signal?: AbortSignal): Promise<string> {
  if (!ANSWER_API_URL) {
    throw new Error('未配置答案接口：请在 .env 中设置 VITE_ANSWER_API')
  }

  const response = await fetch(ANSWER_API_URL, { signal })
  if (!response.ok) {
    throw new Error(`答案接口返回 HTTP ${response.status}`)
  }
  return response.text()
}

/**
 * The code in the endpoint's answer, or `null` when nothing usable came back.
 *
 * The endpoint replies with the bare code. JSON (`"hgcn"`, `{"code":"hgcn"}`,
 * `["hgcn"]`) and stray whitespace or quotes are tolerated so a small change on
 * the server does not break the game.
 */
export function extractAnswerCode(body: string): string | null {
  const text = stripQuotes(body.trim())
  if (!text) return null

  // The endpoint replies with the bare code, so require the whole payload to
  // be exactly that. A stray page or error message must not be mistaken for one.
  if (isCode(text)) return text.toLowerCase()

  if (text.startsWith('{') || text.startsWith('[') || text.startsWith('"')) {
    try {
      return firstCode(JSON.parse(text))
    } catch {
      // Not JSON after all; nothing left to try.
    }
  }
  return null
}

function isCode(text: string): boolean {
  return /^[a-z]+$/i.test(text) && SUPPORTED_LENGTHS.includes(text.length)
}

/** Strip one layer of wrapping quotes, so `"hgcn"` reads as `hgcn`. */
function stripQuotes(text: string): string {
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1).trim()
  }
  return text
}

/** Walk parsed JSON, reading values only — object keys are never the code. */
function firstCode(value: unknown): string | null {
  if (typeof value === 'string') {
    return isCode(value.trim()) ? value.trim().toLowerCase() : null
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstCode(item)
      if (found) return found
    }
    return null
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const found = firstCode(item)
      if (found) return found
    }
  }
  return null
}
