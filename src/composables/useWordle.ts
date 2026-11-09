import { computed, nextTick, ref, shallowRef } from 'vue'
import { MAX_GUESSES, STATE_RANK } from '../constant'
import { extractAnswerCode, fetchAnswerText } from '../game/answerApi'
import { buildGuess, mergeKeyStates } from '../game/evaluate'
import { loadWordList, type WordList } from '../game/wordList'

export type GameStatus = 'loading' | 'playing' | 'won' | 'lost' | 'error'

/**
 * How long a row's flip runs, so input waits for it to settle: one stagger
 * (220ms, see `GameBoard.vue`) per gap between cells, plus the settle window.
 */
function revealMs(codeLength: number): number {
  return (codeLength - 1) * 220 + 260
}

export function useWordle() {
  const wordList = shallowRef<WordList | null>(null)
  const answerCode = ref('')
  const answerName = ref('')
  const guesses = ref<Guess[]>([])
  const draft = ref('')
  const status = ref<GameStatus>('loading')
  const errorMessage = ref('')
  const message = ref('')
  const revealing = ref(false)
  const shaky = ref(false)
  /** Mode width: set from the answer once it arrives; the four-letter default
   *  only shows while loading, when no board is rendered. */
  const codeLength = ref(4)
  const maxGuesses = computed(() => MAX_GUESSES[codeLength.value])

  let messageTimer: ReturnType<typeof setTimeout> | undefined
  let shakeTimer: ReturnType<typeof setTimeout> | undefined

  const currentRow = computed(() => (status.value === 'playing' ? guesses.value.length : -1))
  const keyStates = computed<Record<string, LetterState>>(() =>
    mergeKeyStates(guesses.value, STATE_RANK),
  )
  const letters = computed(() => wordList.value?.letters ?? '')
  const canSubmit = computed(
    () => status.value === 'playing' && !revealing.value && draft.value.length === codeLength.value,
  )
  const acceptsInput = computed(() => status.value === 'playing' && !revealing.value)

  function flash(text: string) {
    message.value = text
    clearTimeout(messageTimer)
    messageTimer = setTimeout(() => {
      if (message.value === text) message.value = ''
    }, 2200)
  }

  async function shake() {
    shaky.value = false
    clearTimeout(shakeTimer)
    await nextTick()
    shaky.value = true
    shakeTimer = setTimeout(() => (shaky.value = false), 600)
  }

  function reject(text: string) {
    flash(text)
    if (status.value === 'playing') void shake()
  }

  /**
   * Start a puzzle. Without `explicitCode` it asks today's endpoint; with one —
   * a history replay — the given code is the answer and nothing is fetched.
   */
  async function start(explicitCode?: string, signal?: AbortSignal) {
    status.value = 'loading'
    errorMessage.value = ''
    guesses.value = []
    draft.value = ''
    message.value = ''

    try {
      // The answer comes first: its width picks the word list and guess count.
      const code = explicitCode ?? extractAnswerCode(await fetchAnswerText(signal))
      if (!code) {
        throw new Error('答案接口没有返回三或四位字母')
      }

      codeLength.value = code.length
      const list = await loadWordList(code.length, signal)
      wordList.value = list
      if (!list.isValidGuess(code)) {
        throw new Error(`答案不在词库中`)
      }

      answerCode.value = code
      answerName.value = list.lookup(code).map((entry) => entry[0]).join('/')
      status.value = 'playing'
    } catch (error) {
      if (signal?.aborted) return
      status.value = 'error'
      errorMessage.value = error instanceof Error ? error.message : String(error)
    }
  }

  function press(letter: string) {
    if (!acceptsInput.value) return
    if (!letter || draft.value.length >= codeLength.value) return
    draft.value += letter.toLowerCase()
  }

  function erase() {
    if (!acceptsInput.value) return
    draft.value = draft.value.slice(0, -1)
  }

  async function submit() {
    if (!acceptsInput.value) return
    if (draft.value.length < codeLength.value) {
      reject('未填写完整')
      return
    }

    const code = draft.value
    const list = wordList.value
    if (!list?.isValidGuess(code)) {
      reject('不是数据库里的声优缩写')
      return
    }

    // At most 2 candidates will be returned
    const matchedNames = list.lookup(code).map((entry) => entry[0])
    const { guess, solved } = buildGuess(code, answerCode.value, matchedNames)

    revealing.value = true
    guesses.value = [...guesses.value, guess]
    draft.value = ''

    await wait(revealMs(codeLength.value))
    revealing.value = false

    if (solved) status.value = 'won'
    else if (guesses.value.length >= maxGuesses.value) status.value = 'lost'
  }

  /** Back to the daily puzzle; a history replay is replayed by picking again. */
  function restart() {
    void start()
  }

  /** Drop every transient signal produced by an unmounted board. */
  function dispose() {
    clearTimeout(messageTimer)
    clearTimeout(shakeTimer)
  }

  return {
    // state
    status,
    errorMessage,
    message,
    guesses,
    draft,
    revealing,
    shaky,
    answerCode,
    answerName,
    wordList,
    // derived
    letters,
    keyStates,
    currentRow,
    canSubmit,
    acceptsInput,
    maxGuesses,
    codeLength,
    // actions
    start,
    press,
    erase,
    submit,
    restart,
    dispose,
    flash,
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
