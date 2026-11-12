/** Time zone endpoint from `VITE_ANSWER_API` in `.env`. */
export const TIMEZONE_API_URL: string = import.meta.env.VITE_ANSWER_API
  ? `${import.meta.env.VITE_ANSWER_API}/timezone`
  : ''

/** The endpoint's raw body, e.g. `Asia/Shanghai`. */
export async function fetchTimezone(signal?: AbortSignal): Promise<string> {
  if (!TIMEZONE_API_URL) {
    //throw new Error('未配置答案接口：请在 .env 中设置 VITE_ANSWER_API')
    return '';
  }

  const response = await fetch(TIMEZONE_API_URL, { signal })
  if (!response.ok) {
    throw new Error(`时区接口返回 HTTP ${response.status}`)
  }
  return response.text()
}

/** Local-time ISO date (`YYYY-MM-DD`) of a timestamp, matching a time zone. */
export function isoDate(timestamp: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp));
}
