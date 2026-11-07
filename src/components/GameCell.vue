<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/** Must match the `flip` animation duration below. */
const FLIP_MS = 560

const props = withDefaults(
  defineProps<{
    letter?: string
    /** The Chinese character, shown only once the position is pinned down. */
    char?: string | null
    state?: LetterState
    /** Plays the flip animation when the row's verdict arrives. */
    reveal?: boolean
    /** Stagger, in ms, so the row flips left to right. */
    flipDelay?: number
  }>(),
  {
    letter: '',
    char: null,
    state: undefined,
    reveal: false,
    flipDelay: 0,
  },
)

/** The colour is applied halfway through the flip, like the original. */
const settled = ref(false)
/** Drop the colour for the first half of the flip, then show the verdict. */
const colors = computed(() => (props.state && (!props.reveal || settled.value) ? props.state : null))
const flipping = ref(false)
let settleTimer: ReturnType<typeof setTimeout> | undefined
let flipTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.reveal,
  (reveal) => {
    clearTimeout(settleTimer)
    clearTimeout(flipTimer)
    if (!reveal) {
      settled.value = false
      flipping.value = false
      return
    }

    settled.value = false
    flipping.value = false
    flipTimer = setTimeout(() => {
      flipping.value = true
    }, props.flipDelay)
    settleTimer = setTimeout(() => {
      settled.value = true
    }, props.flipDelay + FLIP_MS / 2)
  },
  { immediate: true },
)

watch(
  () => props.letter,
  () => {
    // A fresh letter means a new turn; drop any colour left from the last one.
    if (!props.reveal) {
      settled.value = false
      flipping.value = false
    }
  },
)
</script>

<template>
  <div class="cell"
    :class="[colors ? `is-${colors}` : '', { 'is-flipping': flipping, 'is-typing': letter && !colors }]">
    <span class="letter">{{ letter }}</span>
    <span v-if="char && letter" class="char">{{ char }}</span>
  </div>
</template>

<style scoped>
.cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--tile, 68px);
  height: var(--tile, 68px);
  border: 2px solid var(--tile-border);
  border-radius: 6px;
  background: transparent;
  transition:
    border-color 0.14s ease,
    background-color 0.14s ease;
}

.cell.is-typing {
  border-color: var(--tile-border-filled);
}

.cell.is-typing .letter {
  animation: pop 0.12s ease;
}

.letter {
  font-family: var(--mono);
  font-size: calc(var(--tile, 68px) * 0.42);
  font-weight: 700;
  line-height: 1;
  color: var(--text-h);
  user-select: none;
}

/* The Chinese character sits under its letter, on the same tile. It appears
   with the letter and keeps whatever colour the verdict gives the tile. */
.char {
  position: absolute;
  bottom: 4px;
  left: 3px;
  right: 0;
  font-size: calc(var(--tile, 68px) * 0.25);
  font-family: var(--sans);
  line-height: 1.1;
  color: white;
  user-select: none;
}

.cell.is-flipping {
  animation: flip 0.56s ease forwards;
}

.cell.is-correct {
  background: var(--color-correct);
  border-color: var(--color-correct);
}

.cell.is-present {
  background: var(--color-present);
  border-color: var(--color-present);
}

.cell.is-absent {
  background: var(--color-absent);
  border-color: var(--color-absent);
}

.cell.is-correct .letter,
.cell.is-present .letter,
.cell.is-absent .letter {
  color: #fff;
}

@keyframes pop {
  from {
    transform: scale(0.86);
  }

  to {
    transform: scale(1);
  }
}

@keyframes flip {
  0% {
    transform: rotateX(0deg);
  }

  50% {
    transform: rotateX(90deg);
  }

  100% {
    transform: rotateX(0deg);
  }
}
</style>
