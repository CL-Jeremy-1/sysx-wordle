/** Local-time ISO date (`YYYY-MM-DD`) of a timestamp, matching the API's dates. */
export function isoDate(timestamp: number): string {
  const date = new Date(timestamp)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Today in the player's timezone — the daily puzzle's day. */
export function todayIso(): string {
  return isoDate(Date.now())
}
