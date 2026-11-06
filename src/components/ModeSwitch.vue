<script setup>
import { computed } from 'vue'
import { useFishStore } from '../stores/fish'

const store = useFishStore()

const MODES = [
  {
    key: 'feast',
    emoji: '🍚',
    title: '加餐模式',
    desc: '复盘深度分析，素材补充用法',
    cost: '白饭多'
  },
  {
    key: 'light',
    emoji: '🥗',
    title: '减脂模式',
    desc: '复盘只留清单，素材只留精华',
    cost: '省白饭'
  }
]

const current = computed(() => store.settings.mode)
// 还没写内容时，只提示「起步成本」，避免误以为是已经花掉的白饭
const hasInput = computed(() => (store.inputDraft || '').trim().length > 0)

function pick(mode) {
  if (mode !== current.value) store.setMode(mode)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="grid flex-1 grid-cols-2 gap-2">
      <button
        v-for="m in MODES"
        :key="m.key"
        class="group relative flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all"
        :class="
          current === m.key
            ? 'border-pond-400 bg-pond-50 shadow-[0_0_0_3px_rgba(79,162,204,0.10)]'
            : 'border-pond-100 bg-white hover:border-pond-300'
        "
        @click="pick(m.key)"
      >
        <span class="text-[17px] leading-none">{{ m.emoji }}</span>
        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-1.5">
            <span
              class="text-[13px] font-medium"
              :class="current === m.key ? 'text-pond-800' : 'text-pond-600'"
            >
              {{ m.title }}
            </span>
            <span
              class="rounded px-1 py-[1px] text-[10px]"
              :class="
                m.key === 'feast' ? 'bg-fish-300/40 text-amber-700' : 'bg-weed-300/30 text-emerald-700'
              "
            >
              {{ m.cost }}
            </span>
          </span>
          <span class="mt-0.5 block truncate text-[11px] text-pond-400">{{ m.desc }}</span>
        </span>
      </button>
    </div>

    <div class="shrink-0 rounded-xl bg-pond-50 px-3 py-2 text-right">
      <div class="text-[10.5px] text-pond-400">{{ hasInput ? '本次预计' : '起步约' }}</div>
      <div class="text-[13px] font-medium text-pond-700">≈ {{ store.mealCost }} 白饭</div>
    </div>
  </div>
</template>
