import { computed, nextTick, ref, shallowRef } from 'vue'
import { CODE_LENGTH, MAX_GUESSES, STATE_RANK } from '../constant'
import { extractAnswerCode, fetchAnswerText } from '../game/answerApi'
import { buildGuess, mergeKeyStates } from '../game/evaluate'
import { loadWordList, type WordList } from '../game/wordList'

export type GameStatus = 'loading' | 'playing' | 'won' | 'lost' | 'error'

/** How long the flip animation runs, so input waits for the row to settle. */
export const REVEAL_MS = 3 * 220 + 260

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

  let messageTimer: ReturnType<typeof setTimeout> | undefined
  let shakeTimer: ReturnType<typeof setTimeout> | undefined

  const currentRow = computed(() => (status.value === 'playing' ? guesses.value.length : -1))
  const keyStates = computed<Record<string, LetterState>>(() =>
    mergeKeyStates(guesses.value, STATE_RANK),
  )
  const letters = computed(() => wordList.value?.letters ?? '')
  const canSubmit = computed(
    () => status.value === 'playing' && !revealing.value && draft.value.length === CODE_LENGTH,
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

  async function start(signal?: AbortSignal) {
    status.value = 'loading'
    errorMessage.value = ''
    guesses.value = []
    draft.value = ''
    message.value = ''

    try {
      const list = await loadWordList(undefined, signal)
      wordList.value = list

      const body = await fetchAnswerText(signal)
      const code = extractAnswerCode(body)
      if (!code) {
        throw new Error('答案接口没有返回四位字母')
      }
      if (!list.isValidGuess(code)) {
        throw new Error(`答案「${code}」不在词库中`)
      }

      answerCode.value = code
      answerName.value = list.preferredName(code)
      status.value = 'playing'
    } catch (error) {
      if (signal?.aborted) return
      status.value = 'error'
      errorMessage.value = error instanceof Error ? error.message : String(error)
    }
  }

  function press(letter: string) {
    if (!acceptsInput.value) return
    if (!letter || draft.value.length >= CODE_LENGTH) return
    draft.value += letter.toLowerCase()
  }

  function erase() {
    if (!acceptsInput.value) return
    draft.value = draft.value.slice(0, -1)
  }

  async function submit() {
    if (!acceptsInput.value) return
    if (draft.value.length < CODE_LENGTH) {
      reject('未填写完整')
      return
    }

    const code = draft.value
    const list = wordList.value
    if (!list?.isValidGuess(code)) {
      reject('不是数据库里的声优缩写')
      return
    }

    // The characters shown are the ones the player's own code spells, so a code
    // that fits several names displays the spelling the player meant.
    const guessName = list.resolveName(code, answerCode.value)
    const { guess, solved } = buildGuess(code, answerCode.value, guessName)

    revealing.value = true
    guesses.value = [...guesses.value, guess]
    draft.value = ''

    await wait(REVEAL_MS)
    revealing.value = false

    if (solved) status.value = 'won'
    else if (guesses.value.length >= MAX_GUESSES) status.value = 'lost'
  }

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
    maxGuesses: MAX_GUESSES,
    codeLength: CODE_LENGTH,
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
