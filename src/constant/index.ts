/** Colour strength, weakest first; used to decide a key's colour. */
export const STATE_RANK: Record<LetterState, number> = {
  absent: 0,
  present: 1,
  correct: 2,
}

/** Code widths the game supports, in letters; the answer picks the mode. */
export const SUPPORTED_LENGTHS: readonly number[] = [3, 4]

/** Number of allowed submissions, per code width. */
export const MAX_GUESSES: Record<number, number> = {
  3: 4,
  4: 5,
}
