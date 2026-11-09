/** One square per letter verdict, Wordle-style. */
const SQUARES: Record<string, string> = {
  correct: '🟩',
  present: '🟨',
  absent: '⬛',
}

const HIDDEN = '⬜'

export interface ShareOptions {
  /** Wins are reported by guess count; losses as a plain failure. */
  solved: boolean
  guessCount: number
  maxGuesses: number
  /** The day the shared puzzle was set: today's date, or a replayed one. */
  date: string
  /** Appended so the recipient can play the same puzzle. */
  url?: string
}

/**
 * The shareable result: plain text plus emoji, never the answer itself.
 *
 * ```
 * 女声优缩写 Wordle 3/5 · 2026-11-03
 *
 * ⬛🟩⬛⬛
 * 🟨⬛⬛🟨
 * 🟩🟩🟩🟩
 * ```
 */
export function buildShareText(
  guesses: readonly Guess[],
  { solved, guessCount, maxGuesses, date, url }: ShareOptions,
): string {
  const score = solved ? `${guessCount}/${maxGuesses}` : `X/${maxGuesses}`
  const lines = [`女声优缩写 Wordle ${score} · ${date}`, '']

  for (const guess of guesses) {
    lines.push(guess.tiles.map((tile) => SQUARES[tile.state] ?? HIDDEN).join(''))
  }
  if (url) {
    lines.push('', url)
  }
  return lines.join('\n')
}

/**
 * Copy the shareable result to the clipboard. This is the only share path: no
 * `navigator.share`, so the same code runs on every platform.
 */
export async function copyResult(
  guesses: readonly Guess[],
  options: ShareOptions,
): Promise<boolean> {
  return copyText(buildShareText(guesses, options))
}

/** Copy `text`, preferring the async clipboard and falling back to a selection. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Older browsers, or a non-secure context. Fall through to the legacy path.
  }
  return copyWithSelection(text)
}

/**
 * The deprecated path, kept for browsers without the async clipboard. The text
 * is fully selected first, so a rejected `execCommand` still leaves the player
 * one copy keystroke away.
 */
function copyWithSelection(text: string): boolean {
  if (typeof document === 'undefined') return false

  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.opacity = '0'
  document.body.appendChild(area)

  try {
    area.select()
    area.setSelectionRange(0, text.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(area)
  }
}
