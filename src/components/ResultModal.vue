<script setup lang="ts">
import { ref } from 'vue'
import ShareResult from './ShareResult.vue'

/** Matches the button's own confirmation window in `ShareResult.vue`. */
const NOTE_MS = 2000

withDefaults(
  defineProps<{
    status: 'won' | 'lost'
    guesses: Guess[]
    maxGuesses: number
    /** Page link appended to the shared result. Never part of the grid. */
    shareUrl?: string
    /** Revealed only on a win. @see {@link Guess}.code */
    answerCode?: string
    /** Multiple names are joined with "/". @see {@link Guess}.name */
    answerName?: string
  }>(),
  { shareUrl: '', answerCode: '', answerName: '' },
)

const emit = defineEmits<{
  (event: 'restart'): void
  (event: 'close'): void
  /** `ok` is false when the copy failed, so the page can skip its toast. */
  (event: 'shared', message: string, ok: boolean): void
}>()

/**
 * The page behind this modal is blurred, so its toast is not readable from
 * here. Repeat the outcome inside the dialog, where the player is looking.
 */
const note = ref('')
let noteTimer: ReturnType<typeof setTimeout> | undefined

function onShared(message: string, ok: boolean) {
  clearTimeout(noteTimer)
  note.value = message
  noteTimer = setTimeout(() => (note.value = ''), NOTE_MS)
  emit('shared', message, ok)
}
</script>

<template>
  <Transition name="fade">
    <div class="backdrop" @click.self="emit('close')">
      <div class="dialog" :class="`is-${status}`" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <p id="result-title" class="title">
          {{ status === 'won' ? '猜对了！' : '机会用完了' }}
        </p>

        <p class="answer" v-if="status === 'won'">
          <span class="code">{{ answerCode }}</span>
          <span class="arrow" aria-hidden="true">→</span>
          <span class="name">{{ answerName.replace('/', '\n') }}</span>
        </p>

        <!-- <p class="answer" v-else-if="answerName">
          <span class="name">{{ answerName }}</span>
        </p> -->

        <p class="meta" v-if="status === 'won'">
          第 {{ guesses.length }} / {{ maxGuesses }} 步成功
        </p>
        <!-- <p class="meta" v-else-if="answerName">
          答案是「{{ answerName }}」，{{ maxGuesses }} 步都没猜中
        </p>
        <p class="meta" v-else>试试分享你的成绩，看看别人要几步。</p> -->

        <div class="actions">
          <ShareResult :guesses="guesses" :solved="status === 'won'" :max-guesses="maxGuesses" :url="shareUrl"
            @done="onShared" />
          <button type="button" class="ghost" @click="emit('close')">关闭</button>
          <button type="button" class="again" @click="emit('restart')">
            {{ status === 'won' ? '再来一局' : '重试' }}
          </button>
        </div>

        <!-- <p class="note" :class="{ 'is-visible': !!note }" aria-live="polite">
          {{ note || ' ' }}
        </p> -->
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(8, 6, 13, 0.55);
  backdrop-filter: blur(2px);
}

.dialog {
  width: min(340px, 100%);
  padding: 24px;
  border: 2px solid var(--border);
  border-radius: 14px;
  background: var(--bg);
  box-shadow: var(--shadow);
  text-align: center;
  animation: rise 0.24s ease;
}

.dialog.is-won {
  border-color: var(--color-correct);
}

.dialog.is-lost {
  border-color: var(--color-present);
}

.title {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-h);
}

.answer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
}

.code {
  font-family: var(--mono);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-h);
}

.arrow {
  color: var(--text);
}

.name {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: pre-line;
  color: var(--color-correct);
}

.is-lost .name {
  color: var(--color-present);
}

.meta {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text);
}

/* Stacked full-width actions: three buttons read better than a cramped row. */
.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.actions>* {
  width: 100%;
}

/* Inline outcome line, since the page toast sits behind the blurred backdrop. */
.note {
  min-height: 18px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--text);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.note.is-visible {
  opacity: 1;
}

.ghost,
.again {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.ghost {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-h);
}

.ghost:hover {
  border-color: var(--tile-border-filled);
  background: var(--panel-bg);
}

.again {
  border: 1px solid transparent;
  background: var(--color-correct);
  color: #fff;
}

.again:hover {
  filter: brightness(1.08);
}

.is-lost .again {
  background: var(--color-present);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
