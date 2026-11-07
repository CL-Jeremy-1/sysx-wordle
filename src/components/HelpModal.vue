<script setup lang="ts">
defineProps<{
  open: boolean
  maxGuesses: number
  codeLength: number
}>()

const emit = defineEmits<{ (event: 'close'): void }>()
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="backdrop" @click.self="emit('close')">
      <div class="dialog" role="dialog" aria-modal="true" aria-label="玩法说明">
        <header class="head">
          <h2>怎么玩</h2>
          <button type="button" class="close" aria-label="关闭" @click="emit('close')">×</button>
        </header>

        <ol class="steps">
          <li>猜一个由 {{ codeLength }} 个字人名对应的汉语拼音缩写，有 {{ maxGuesses }} 次机会。</li>
          <!-- <li>每个字母对应一个汉字，拼起来就是答案的中文名。</li> -->
          <li>每次提交后，字母下方都会显示这个字母在你这次输入里对应的汉字。</li>
        </ol>

        <h3>颜色含义</h3>
        <ul class="legend">
          <li>
            <span class="chip is-correct">正</span>
            <span>这个字母的位置对了，而且答案的这一位就是它。</span>
          </li>
          <li>
            <span class="chip is-present">偏</span>
            <span>答案里有这个字母，但不在这个位置。</span>
          </li>
          <li>
            <span class="chip is-absent">无</span>
            <span>答案里没有这个字母。</span>
          </li>
        </ul>

        <p class="note">
          颜色指的是<strong>字母</strong>猜得对不对，汉字是这次输入的对应的人名的字，不会影响颜色。
          只能提交 <a href="https://sysx.nulla.top" target="_blank">SYSX</a>
          中存在的{{ codeLength === 3 ? '三' : '四' }}字人名。
        </p>
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
  width: min(460px, 100%);
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

.steps {
  margin: 12px 0 18px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 15px;
}

h3 {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--text-h);
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chip {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.chip.is-correct {
  background: var(--color-correct);
}

.chip.is-present {
  background: var(--color-present);
}

.chip.is-absent {
  background: var(--color-absent);
}

.note {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text);
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
