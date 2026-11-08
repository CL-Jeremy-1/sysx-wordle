<script setup lang="ts">
import { computed } from 'vue'
import GameCell from './GameCell.vue'

/** Matches the flip duration and stagger inside `GameCell.vue`. */
const FLIP_STEP_MS = 220

const props = defineProps<{
  guesses: Guess[]
  draft: string
  codeLength: number
  maxGuesses: number
  currentRow: number
  revealing: boolean
  shaky: boolean
}>()

/** Rows of cells: submitted guesses first, then the row being typed. */
const rows = computed(() => {
  const filled = props.guesses.map((guess, rowIndex) => ({
    key: `guess-${rowIndex}`,
    tiles: guess.tiles,
    reveal: props.revealing && rowIndex === props.guesses.length - 1,
  }))

  const remaining = props.maxGuesses - filled.length
  const empty = Array.from({ length: Math.max(0, remaining) }, (_, index) => {
    const rowIndex = filled.length + index
    const isDraft = rowIndex === props.currentRow
    const letters = isDraft ? [...props.draft] : []
    return {
      key: `empty-${rowIndex}`,
      tiles: Array.from({ length: props.codeLength }, (_, cellIndex) => ({
        letter: letters[cellIndex] ?? '',
        charOrAltChars: null,
        state: undefined,
      })),
      reveal: false,
    }
  })

  return [...filled, ...empty].map((row, rowIndex) => ({
    ...row,
    isCurrent: rowIndex === props.currentRow,
  }))
})
</script>

<template>
  <div class="board" :class="{ 'is-shaky': shaky }" role="grid" aria-label="猜词盘面">
    <div v-for="row in rows" :key="row.key" class="row" :class="{ 'is-current': row.isCurrent }" role="row">
      <GameCell v-for="(tile, cellIndex) in row.tiles" :key="cellIndex" :letter="tile.letter"
        :charOrAltChars="tile.charOrAltChars" :state="tile.state" :reveal="row.reveal"
        :flip-delay="cellIndex * FLIP_STEP_MS" />
    </div>
  </div>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 8px;
  --tile: 80px;
}

.row {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.board.is-shaky .row.is-current {
  animation: shake 0.5s ease;
}

@keyframes shake {

  10%,
  90% {
    transform: translateX(-2px);
  }

  20%,
  80% {
    transform: translateX(4px);
  }

  30%,
  50%,
  70% {
    transform: translateX(-7px);
  }

  40%,
  60% {
    transform: translateX(7px);
  }
}

@media (max-width: 480px) {
  .board {
    --tile: 58px;
  }

  .board,
  .row {
    gap: 6px;
  }
}
</style>
