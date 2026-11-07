/**
 * Game-wide type definitions, declared ambient so every module — including
 * `.vue` SFCs — can use them without imports. Runtime constants live in
 * `constant/index.ts` instead: declaration files emit no code.
 */

/** One entry of `public/data.json`: a Chinese name and its four-letter code. */
type WordEntry = readonly [name: string, code: string]

/** Per-letter verdict, following the original Wordle colouring. */
type LetterState = 'correct' | 'present' | 'absent'

/** A single letter tile of one submitted guess. */
interface Tile {
  letter: string
  /**
   * The Chinese character standing at this position, revealed only where the
   * letter already matches the answer — otherwise the mapping stays hidden.
   */
  charOrAltChars: string | null
  state: LetterState
}

/**
 * One submitted guess: the raw letters typed, the tile verdicts and the name(s)
 * matched. Multiple names are joined together with "/".
 */
interface Guess {
  code: string
  name: string
  tiles: Tile[]
}

interface Evaluation {
  tiles: Tile[]
  /** `true` when every letter is in its place. */
  solved: boolean
}
