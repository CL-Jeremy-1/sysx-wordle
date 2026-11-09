<script setup lang="ts">
import { NConfigProvider, NDatePicker, darkTheme, dateZhCN, zhCN } from 'naive-ui'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { isoDate } from '../game/date'
import { useHistory } from '../composables/useHistory'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  (event: 'close'): void
  /** The player picked a recorded day, to be replayed on the main board. */
  (event: 'pick', entry: HistoryEntry): void
}>()

const { byDate, loaded, errorMessage, load } = useHistory()

/** The highlighted day, ISO `YYYY-MM-DD`; only the panel's cursor. */
const selected = ref<string | null>(null)

// Fetch on the first open, then rest the cursor on the latest recorded day —
// clicking a day is still what starts a puzzle.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    void load().then(() => {
      if (selected.value) return
      const dates = [...byDate.value.keys()]
      selected.value = dates.length > 0 ? dates[dates.length - 1] : null
    })
  },
)

/** A click on a recorded day hands it to the page; the modal's job is done. */
function onPick(value: string | null) {
  if (!value) return
  const entry = byDate.value.get(value)
  if (entry) emit('pick', entry)
}

/** A day is pickable only when the history actually holds an entry for it. */
function isDateDisabled(timestamp: number): boolean {
  return !byDate.value.has(isoDate(timestamp))
}

// The app themes itself with `prefers-color-scheme`; Naive UI needs the same
// choice fed to it in JS.
const scheme = window.matchMedia('(prefers-color-scheme: dark)')
const isDark = ref(scheme.matches)

function onSchemeChange(event: MediaQueryListEvent) {
  isDark.value = event.matches
}

scheme.addEventListener('change', onSchemeChange)
onBeforeUnmount(() => scheme.removeEventListener('change', onSchemeChange))

/** The game's green as Naive UI's primary, and the app's own font. */
const themeOverrides = computed(() => ({
  common: {
    primaryColor: isDark.value ? '#538d4e' : '#6aaa64',
    primaryColorHover: isDark.value ? '#639c5e' : '#7bbb77',
    primaryColorPressed: isDark.value ? '#4a7f45' : '#5e9a59',
    borderRadius: '6px',
    fontFamily: 'inherit',
  },
}))
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="backdrop" @click.self="emit('close')">
      <div class="dialog" role="dialog" aria-modal="true" aria-label="历史题目">
        <header class="head">
          <h2>历史题目</h2>
          <button type="button" class="close" aria-label="关闭" @click="emit('close')">×</button>
        </header>

        <p v-if="errorMessage" class="state is-error">{{ errorMessage }}</p>
        <p v-else-if="!loaded" class="state">正在获取历史记录…</p>
        <p v-else-if="byDate.size === 0" class="state">暂无历史记录</p>

        <template v-else>
          <div class="calendar">
            <n-config-provider :theme="isDark ? darkTheme : null" :theme-overrides="themeOverrides" :locale="zhCN"
              :date-locale="dateZhCN">
              <n-date-picker v-model:formatted-value="selected" type="date" panel value-format="yyyy-MM-dd"
                :actions="[]" :is-date-disabled="isDateDisabled" @update:formatted-value="onPick" />
            </n-config-provider>
          </div>

          <p class="hint">选择日期，重玩那天的题目</p>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(8, 6, 13, 0.55);
  backdrop-filter: blur(2px);
}

.dialog {
  width: min(420px, 100%);
  max-height: 88svh;
  overflow: auto;
  padding: 22px 24px 24px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg);
  box-shadow: var(--shadow);
  text-align: left;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head h2 {
  margin: 0;
  font-size: 19px;
}

.close {
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.state {
  padding: 24px 0;
  font-size: 14px;
  color: var(--text);
  text-align: center;
}

.state.is-error {
  color: var(--color-present);
}

.calendar {
  display: flex;
  justify-content: center;
}

/* Naive UI strikes disabled dates through, which across a month of empty days
   reads as an error rather than "no record" — dim them instead. */
.calendar :deep(.n-date-panel-date--disabled) {
  text-decoration: none;
  opacity: 0.45;
}

.hint {
  margin: 14px 0 0;
  font-size: 13px;
  color: var(--text);
  text-align: center;
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
