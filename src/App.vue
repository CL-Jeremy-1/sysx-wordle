<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GameBoard from './components/GameBoard.vue'
import HelpModal from './components/HelpModal.vue'
import LetterKeyboard from './components/LetterKeyboard.vue'
import ResultModal from './components/ResultModal.vue'
import { useWordle } from './composables/useWordle'

const game = useWordle()
const helpOpen = ref(false)
/** Lets the player send the result popup away and study the board. */
const resultDismissed = ref(false)

/** The page itself, so a shared result tells the recipient where to play. */
const shareUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  const { origin, pathname } = window.location
  return `${origin}${pathname}`
})

const finished = computed(
  () => game.status.value === 'won' || game.status.value === 'lost',
)

/** Mode numerals for the tagline; until the answer loads the mode is unknown. */
const CN_NUMERALS: Record<number, string> = { 3: '三', 4: '四', 5: '五' }
const tagline = computed(() =>
  game.status.value === 'playing' || finished.value
    ? `${CN_NUMERALS[game.codeLength.value]}位字母 · ${CN_NUMERALS[game.maxGuesses.value]}步机会 · 每步显示中文名`
    : '三或四位字母 · 由今日答案决定 · 每步显示中文名',
)
/** Wait for the final row's flip to finish before the popup takes over. */
const resultOpen = computed(
  () => finished.value && !game.revealing.value && !resultDismissed.value,
)

onMounted(() => {
  void game.start()
  // Show the rules once on a first visit, then stay out of the way.
  helpOpen.value = !localStorage.getItem('sysx-wordle:help-seen')
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  game.dispose()
  window.removeEventListener('keydown', onKeydown)
})

function closeHelp() {
  helpOpen.value = false
  localStorage.setItem('sysx-wordle:help-seen', '1')
}

function restart() {
  resultDismissed.value = false
  game.restart()
}

/** Skip the toast on a failed copy: the button already reports the failure. */
function onShared(message: string, ok: boolean) {
  if (ok) game.flash(message)
}

function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return

  if (helpOpen.value) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault()
      closeHelp()
    }
    return
  }

  // The result popup owns the keyboard while it is up.
  if (resultOpen.value) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault()
      resultDismissed.value = true
    }
    return
  }
  // After it is dismissed the board stays for study; a fresh game is an
  // explicit choice, so no key silently restarts it.
  if (finished.value) return

  if (event.key === 'Enter') {
    event.preventDefault()
    void game.submit()
    return
  }
  if (event.key === 'Backspace') {
    event.preventDefault()
    game.erase()
    return
  }
  if (event.key === 'Escape') {
    helpOpen.value = true
    return
  }
  if (!game.acceptsInput.value) return

  const letter = event.key.toLowerCase()
  if (letter.length === 1 && game.letters.value.includes(letter)) {
    event.preventDefault()
    game.press(letter)
  }
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <h1>女声优缩写 Wordle</h1>
        <p class="tagline">Powered by <a href="https://sysx.nulla.top/" target="_blank">SYSX</a></p>
      </div>
      <div class="tools">
        <button type="button" class="ghost" @click="helpOpen = true">玩法</button>
        <button type="button" class="ghost" :disabled="game.status.value === 'loading'" @click="restart()">
          重开
        </button>
      </div>
    </header>

    <main class="stage">
      <p v-if="game.status.value === 'loading'" class="placeholder">正在获取今日答案…</p>

      <template v-else-if="game.status.value === 'error'">
        <p class="placeholder is-error">{{ game.errorMessage.value }}</p>
        <button type="button" class="retry" @click="restart()">重试</button>
      </template>

      <template v-else>
        <GameBoard :guesses="game.guesses.value" :draft="game.draft.value" :code-length="game.codeLength.value"
          :max-guesses="game.maxGuesses.value" :current-row="game.currentRow.value" :revealing="game.revealing.value"
          :shaky="game.shaky.value" />

        <p class="message" :class="{ 'is-visible': !!game.message.value }">
          {{ game.message.value || ' ' }}
        </p>
      </template>
    </main>

    <footer class="dock">
      <LetterKeyboard v-if="game.wordList.value" :available="game.letters.value" :key-states="game.keyStates.value"
        :disabled="!game.acceptsInput.value" @letter="game.press" @erase="game.erase" @submit="game.submit" />

      <p class="site">
        <a href="https://sysx.nulla.top" target="_blank" rel="noopener noreferrer">
          想不出来女声优缩写？点我查询👈🔗
        </a>
      </p>
    </footer>

    <ResultModal v-if="resultOpen && (game.status.value === 'won' || game.status.value === 'lost')"
      :status="game.status.value" :guesses="game.guesses.value" :max-guesses="game.maxGuesses.value"
      :share-url="shareUrl" :answer-code="game.answerCode.value" :answer-name="game.answerName.value"
      @restart="restart()" @close="resultDismissed = true" @shared="onShared" />

    <HelpModal :open="helpOpen" :max-guesses="game.maxGuesses.value" :code-length="game.codeLength.value"
      @close="closeHelp" />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 620px;
  min-height: 100svh;
  margin: 0 auto;
  padding: 18px 16px 22px;
  box-sizing: border-box;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.brand h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--text-h);
}

.tagline {
  margin-top: 3px;
  font-size: 13px;
  color: var(--text);
}

.tools {
  display: flex;
  gap: 8px;
}

.ghost {
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-h);
  font-size: 14px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.ghost:hover:not(:disabled) {
  border-color: var(--tile-border-filled);
  background: var(--panel-bg);
}

.ghost:disabled {
  opacity: 0.5;
  cursor: default;
}

.stage {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.placeholder {
  font-size: 15px;
  color: var(--text);
}

.placeholder.is-error {
  max-width: 380px;
  color: var(--color-present);
  text-align: center;
}

.retry {
  padding: 8px 20px;
  border: 0;
  border-radius: 8px;
  background: var(--key-bg);
  color: var(--text-h);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.message {
  min-height: 22px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-h);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.message.is-visible {
  opacity: 1;
}

.dock {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}

.site {
  font-size: 18px;
  font-weight: 600;
  font-family: var(--sans);
  color: var(--text);
  margin-block: 0.5em;
}

.site a {
  color: #2288dc;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;
}

.site a:hover {
  border-bottom-color: currentColor;
}
</style>
