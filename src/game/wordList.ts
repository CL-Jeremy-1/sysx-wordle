/** Unicode NFC so characters that have composed forms compare equal. */
function normalize(value: string): string {
  return value.normalize('NFC')
}

/**
 * A code is not unique in the word list: some codes fit several names that share
 * the same initials. Every entry is kept, and lookups return them all.
 */
export class WordList {
  private readonly byCode = new Map<string, WordEntry[]>()
  readonly entries: WordEntry[]
  /** Width every code in this list shares, in letters. */
  readonly codeLength: number
  /** Every letter that can appear at some position, in keyboard order. */
  readonly letters: string
  /** Every distinct character used by the list, for input validation. */
  private readonly codeChars: Set<string>

  constructor(entries: WordEntry[]) {
    this.entries = entries
    this.codeLength = normalize(entries[0]?.[1] ?? '').length
    const chars = new Set<string>()
    for (const entry of entries) {
      const code = normalize(entry[1])
      const bucket = this.byCode.get(code)
      if (bucket) bucket.push(entry)
      else this.byCode.set(code, [entry])
      for (const letter of code) chars.add(letter)
    }
    this.codeChars = chars
    this.letters = [...chars].sort().join('')
  }

  /** All entries whose code equals `code`, or an empty array. */
  lookup(code: string): WordEntry[] {
    return this.byCode.get(normalize(code)) ?? []
  }

  /** A run of `codeLength` letters that some entry uses. */
  isValidGuess(code: string): boolean {
    const normalized = normalize(code)
    return normalized.length === this.codeLength && this.byCode.has(normalized)
  }

  /** A single character that occurs anywhere in the list. */
  isCodeChar(char: string): boolean {
    return this.codeChars.has(normalize(char))
  }

  /**
   * The preferred spelling of a code: the entry the word list itself lists
   * first. Used when the answer endpoint only hands back the letters.
   */
  preferredName(code: string): string {
    return this.lookup(code)[0]?.[0] ?? ''
  }

  /** The name typed for a guess, favouring the answer when codes collide. */
  resolveName(code: string, answerCode: string): string {
    const candidates = this.lookup(code)
    if (candidates.length === 0) return ''
    const exact = candidates.find((e) => e[1] === answerCode)
    return (exact ?? candidates[0])[0]
  }
  randomCode() {
    const length = this.entries.length
    return this.entries[Math.floor(Math.random() * length)][1]
  }
}

/**
 * The word list is served as a static asset, so it stays in sync with `public/`.
 * The mode's width picks the file: `3letters.json` / `4letters.json`.
 */
export async function loadWordList(
  codeLength: number,
  signal?: AbortSignal,
): Promise<WordList> {
  const url = `${import.meta.env.BASE_URL}${codeLength}letters.json`
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`词库加载失败（HTTP ${response.status}）`)
  }
  const raw: unknown = await response.json()
  if (!Array.isArray(raw)) {
    throw new Error('词库格式异常：顶层不是数组')
  }
  const entries: WordEntry[] = []
  for (const item of raw) {
    if (
      Array.isArray(item) &&
      typeof item[0] === 'string' &&
      typeof item[1] === 'string' &&
      item[1].length === codeLength
    ) {
      entries.push([normalize(item[0]), normalize(item[1])])
    }
  }
  if (entries.length === 0) {
    throw new Error('词库为空')
  }
  return new WordList(entries)
}
