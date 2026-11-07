<script setup lang="ts">

/** The original three-row QWERTY layout. */
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const

const props = defineProps<{
  /** Every letter that actually occurs somewhere in the word list. */
  available: string
  keyStates: Record<string, LetterState>
  disabled: boolean
}>()

const emit = defineEmits<{
  (event: 'letter', letter: string): void
  (event: 'erase'): void
  (event: 'submit'): void
}>()

/** A key is dead when the word list never uses that letter. */
function isDead(letter: string): boolean {
  return !props.available.includes(letter)
}
</script>

<template>
  <div class="keyboard" :class="{ 'is-disabled': disabled }">
    <div v-for="(row, rowIndex) in ROWS" :key="row" class="row" :class="`row-${rowIndex + 1}`">
      <button v-if="rowIndex === 2" type="button" class="key key-wide" :disabled="disabled" aria-label="提交"
        @click="emit('submit')">
        提交
      </button>

      <button v-for="letter in row" :key="letter" type="button" class="key"
        :class="[keyStates[letter] ? `is-${keyStates[letter]}` : '', { 'is-dead': isDead(letter) }]"
        :disabled="disabled || isDead(letter)" :aria-label="isDead(letter) ? `${letter}（词库中没有）` : letter"
        @click="emit('letter', letter)">
        {{ letter }}
      </button>

      <button v-if="rowIndex === 2" type="button" class="key key-wide" :disabled="disabled" aria-label="删除"
        @click="emit('erase')">
        删除
      </button>
    </div>
  </div>
</template>

<style scoped>
.keyboard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 500px;
  touch-action: manipulation;
}

.row {
  display: flex;
  gap: 5px;
  justify-content: center;
}

/* The original keyboard indents its shorter rows by half a key. */
.row-2 {
  padding: 0 16px;
}

.key {
  flex: 1 1 0;
  min-width: 0;
  height: 50px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: var(--key-bg);
  color: var(--text-h);
  font-family: var(--mono);
  font-size: 17px;
  font-weight: 700;
  text-transform: lowercase;
  cursor: pointer;
  transition:
    background-color 0.14s ease,
    transform 0.08s ease;
}

.key:not(:disabled):active {
  transform: scale(0.95);
}

.key:disabled {
  cursor: default;
}

/* Letters the word list never uses: shown, but not pressable. */
.key.is-dead {
  background: var(--key-dead-bg);
  color: var(--text);
  opacity: 0.42;
}

.key-wide {
  flex: 1.5 1 0;
  font-family: var(--sans);
  font-size: 13px;
  letter-spacing: 0.02em;
}

.key.is-correct {
  background: var(--color-correct);
  color: #fff;
}

.key.is-present {
  background: var(--color-present);
  color: #fff;
}

.key.is-absent {
  background: var(--color-absent);
  color: #fff;
}

@media (max-width: 480px) {

  .keyboard,
  .row {
    gap: 4px;
  }

  .row-2 {
    padding: 0 11px;
  }

  .key {
    height: 44px;
    font-size: 15px;
  }

  .key-wide {
    font-size: 11px;
  }
}
</style>
