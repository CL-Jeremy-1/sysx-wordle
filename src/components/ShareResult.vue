<script setup lang="ts">
import { Check, Share2 } from '@lucide/vue'
import { ref, watch } from 'vue'
import { copyResult } from '../game/share'

/** How long the button keeps its "copied" confirmation. */
const CONFIRM_MS = 2000

const props = withDefaults(
  defineProps<{
    guesses: Guess[]
    solved: boolean
    maxGuesses: number
    /** The shared puzzle's day, `YYYY-MM-DD`, worked into the shared text. */
    date: string
    /** Shared alongside the grid so the recipient can play the same puzzle. */
    url?: string
  }>(),
  { url: '' },
)

const emit = defineEmits<{
  /** `ok` is false when the copy failed, so the page can skip its toast. */
  (event: 'done', message: string, ok: boolean): void
}>()

/** The rest of the page reacts through this, so it flashes only on success. */
const copied = ref(false)
let confirmTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.guesses.length,
  () => {
    clearTimeout(confirmTimer)
    copied.value = false
  },
)

async function onCopy() {
  clearTimeout(confirmTimer)
  const ok = await copyResult(props.guesses, {
    solved: props.solved,
    guessCount: props.guesses.length,
    maxGuesses: props.maxGuesses,
    date: props.date,
    url: props.url || undefined,
  })

  if (!ok) {
    copied.value = false
    emit('done', '复制失败，请手动复制', false)
    return
  }

  copied.value = true
  emit('done', '成绩已复制', true)
  confirmTimer = setTimeout(() => (copied.value = false), CONFIRM_MS)
}
</script>

<template>
  <button
    type="button"
    class="share"
    :class="{ 'is-copied': copied }"
    :aria-label="copied ? '已复制' : '复制成绩'"
    @click="onCopy"
  >
    <Check v-if="copied" class="icon" :size="16" :stroke-width="2.6" aria-hidden="true" />
    <Share2 v-else class="icon" :size="16" :stroke-width="2.2" aria-hidden="true" />
    <span>{{ copied ? '已复制' : '分享成绩' }}</span>
  </button>
</template>

<style scoped>
.share {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-h);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease;
}

.share:hover {
  border-color: var(--tile-border-filled);
  background: var(--panel-bg);
}

/* The confirmation state: the button itself reports the result. */
.share.is-copied {
  border-color: var(--color-correct);
  background: var(--color-correct);
  color: #fff;
}

.icon {
  flex: none;
}
</style>
