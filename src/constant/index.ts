/** Colour strength, weakest first; used to decide a key's colour. */
export const STATE_RANK: Record<LetterState, number> = {
  absent: 0,
  present: 1,
  correct: 2,
}

/** Width of the code, in letters. */
export const CODE_LENGTH = 4

/** Number of allowed submissions. */
export const MAX_GUESSES = 5
