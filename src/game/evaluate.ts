/**
 * Score a guess the way the original Wordle does: exact positions first, then
 * remaining letters as "present" while the answer still has an unused copy of
 * them, so a repeated letter is only credited as many times as it occurs.
 *
 * Only the letter verdicts are decided here. Which Chinese characters are shown
 * is a separate concern — see {@link buildGuess}. The answer's own width wins:
 * it is what picked the mode, so it sizes the comparison.
 */
export function evaluateGuess(guess: string, answer: string): Evaluation {
  const code = guess.toLowerCase()
  const solution = answer.toLowerCase()
  const length = Math.min(solution.length, code.length)

  const pool = new Map<string, number>()
  for (const letter of solution) {
    pool.set(letter, (pool.get(letter) ?? 0) + 1)
  }

  const states: LetterState[] = new Array(length).fill('absent')

  for (let i = 0; i < length; i += 1) {
    const letter = code[i]
    if (letter === solution[i]) {
      states[i] = 'correct'
      pool.set(letter, (pool.get(letter) ?? 0) - 1)
    }
  }

  for (let i = 0; i < length; i += 1) {
    if (states[i] === 'correct') continue
    const letter = code[i]
    const remaining = pool.get(letter) ?? 0
    if (remaining > 0) {
      states[i] = 'present'
      pool.set(letter, remaining - 1)
    }
  }

  const tiles: Tile[] = []
  for (let i = 0; i < length; i += 1) {
    tiles.push({ letter: code[i], charOrAltChars: null, state: states[i] })
  }

  return { tiles, solved: states.every((state) => state === 'correct') }
}

/**
 * Build the tile row for a submitted guess.
 *
 * `matchedNames` are names in the word list which, when read in Chinese, match
 * the typed pinyin initials. Every tile shows its own character(s), so each
 * submission reads as straight letter-to-character correspondences even when
 * the letters are misplaced — the colour is what speaks about the answer.
 */
export function buildGuess(
  guessCode: string,
  answerCode: string,
  matchedNames: string[],
): { guess: Guess; solved: boolean } {
  const charOrAltCharsList = Array.from(matchedNames[0]).map((char0, i) =>
    matchedNames.slice(1)
      .reduce((char, str) => char == str[i] ? char : char + '/' + str[i], char0)
  )
  const { tiles, solved } = evaluateGuess(guessCode, answerCode)
  for (let i = 0; i < tiles.length; i += 1) {
    tiles[i].charOrAltChars = charOrAltCharsList[i] ?? null
  }
  const guessName = matchedNames.join('/')
  return { guess: { code: guessCode, name: guessName, tiles }, solved }
}

/** Per-letter keyboard colour, keeping the strongest verdict seen so far. */
export function mergeKeyStates(
  guesses: readonly Guess[],
  rank: Record<LetterState, number>,
): Record<string, LetterState> {
  const states: Record<string, LetterState> = {}
  for (const guess of guesses) {
    for (const tile of guess.tiles) {
      const current = states[tile.letter]
      if (!current || rank[tile.state] > rank[current]) {
        states[tile.letter] = tile.state
      }
    }
  }
  return states
}
