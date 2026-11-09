/** History endpoint from `VITE_ANSWER_API` in `.env`. */
export const HISTORY_API_URL: string = import.meta.env.VITE_ANSWER_API
  ? `${import.meta.env.VITE_ANSWER_API}/history`
  : ''

/**
 * The answer history, one entry per completed day, oldest first.
 *
 * The endpoint replies with `[{"sysx":"schy","date":"2026-10-09"}, …]`. Entries
 * that do not look like a `{ letters, ISO date }` pair are skipped rather than
 * fatal, so one bad row never hides the rest of the history.
 */
export async function fetchHistory(signal?: AbortSignal): Promise<HistoryEntry[]> {
  if (!HISTORY_API_URL) {
    throw new Error('未配置答案接口：请在 .env 中设置 VITE_ANSWER_API')
  }

  const response = await fetch(HISTORY_API_URL, { signal })
  if (!response.ok) {
    throw new Error(`历史接口返回 HTTP ${response.status}`)
  }

  const raw: unknown = await response.json()
  if (!Array.isArray(raw)) {
    throw new Error('历史接口格式异常：顶层不是数组')
  }

  const entries: HistoryEntry[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const { sysx, date } = item as Record<string, unknown>
    if (typeof sysx !== 'string' || !/^[a-z]{3,4}$/i.test(sysx)) continue
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) continue
    entries.push({ sysx: sysx.toLowerCase(), date })
  }
  entries.sort((a, b) => a.date.localeCompare(b.date))
  return entries
}
