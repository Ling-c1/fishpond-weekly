<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useFishStore } from '../stores/fish'
import { prettyDate, todayStr, estimateTokens, estimateMeal } from '../utils/text'
import { stripStreaming } from '../utils/parse'
import ModeSwitch from '../components/ModeSwitch.vue'
import OutputPanel from '../components/OutputPanel.vue'
import BaseIcon from '../components/BaseIcon.vue'

const store = useFishStore()
const box = ref(null)
const resultRef = ref(null)

// 出结果后自动滚到复盘面板，省得用户自己往下拉
watch(
  () => store.lastResult,
  async (v) => {
    if (!v) return
    await nextTick()
    resultRef.value && resultRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
)

const today = todayStr()
const charCount = computed(() => (store.inputDraft || '').length)
const overLimit = computed(() => charCount.value > store.settings.maxChars)
const streaming = computed(
  () => store.busy && store.busyKind === 'analyze' ? stripStreaming(store.streamText) : ''
)

// 本次实际吃掉的量：接口给了 usage 就用真实值，没给就按输入估算兜底
const spent = computed(() => {
  const entry = store.lastResult && store.lastResult.entry
  if (!entry) return 0
  const input = estimateTokens(entry.rawInput || '')
  const output = entry.usage && entry.usage.completion_tokens
  return output ? input + output : estimateMeal((entry.rawInput || '').length, entry.mode)
})

const QUICK = [
  { key: 'history', label: '鱼塘周记', icon: 'calendar' },
  { key: 'materials', label: '检索素材', icon: 'search' },
  { key: 'clearance', label: '鱼塘清仓', icon: 'trash' }
]

function run() {
  store.analyze()
}

function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    run()
  }
}

function focusBox() {
  box.value && box.value.focus()
}
</script>

<template>
  <div class="mx-auto max-w-[900px] px-8 py-7">
    <!-- 页头 -->
    <header class="flex items-start justify-between">
      <div>
        <h1 class="text-[19px] font-semibold tracking-wide text-pond-800">今日投喂</h1>
        <p class="mt-1 text-[12.5px] text-pond-500">
          {{ prettyDate(today) }} · 碎碎念和饵料混着丢进来，肥鱼自己分
          <span v-if="store.todayCount" class="ml-1 text-pond-400">
            （今天已经喂了 {{ store.todayCount }} 次）
          </span>
        </p>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          v-for="q in QUICK"
          :key="q.key"
          class="btn-ghost !px-2.5 !py-1.5 !text-[12px]"
          @click="store.go(q.key)"
        >
          <BaseIcon :name="q.icon" :size="13" />
          {{ q.label }}
        </button>
      </div>
    </header>

    <!-- 没填 Key 的引导 -->
    <div
      v-if="!store.settings.apiKey"
      class="mt-5 flex items-center gap-3 rounded-xl border border-fish-300/60 bg-fish-300/[0.12] px-4 py-3"
    >
      <span class="text-[16px]">🐟</span>
      <p class="flex-1 text-[12.5px] leading-relaxed text-amber-800">
        还没填 API 密钥，肥鱼现在只能空着肚子。填一次就能一直用。
      </p>
      <button class="btn-ghost !py-1.5 !text-[12px]" @click="store.go('settings')">
        去设置
        <BaseIcon name="arrowRight" :size="13" />
      </button>
    </div>

    <!-- 模式 -->
    <ModeSwitch class="mt-5" />

    <!-- 输入 -->
    <div class="card mt-4 overflow-hidden">
      <textarea
        ref="box"
        v-model="store.inputDraft"
        rows="8"
        spellcheck="false"
        class="block w-full resize-none border-0 bg-transparent px-5 py-4 text-[14px] leading-[1.95] text-pond-900 outline-none placeholder:leading-[1.95] placeholder:text-pond-300"
        placeholder="今天干了什么、卡在哪儿、心情怎么样、看到哪句话想存下来…… 一股脑丢进来就行，不用分类，不用排版。"
        @keydown="onKeydown"
      />

      <div class="flex items-center justify-between gap-3 border-t border-pond-100 px-4 py-2.5">
        <div class="flex items-center gap-3 text-[11.5px] text-pond-400">
          <span :class="overLimit ? 'font-medium text-rose-500' : ''">
            {{ charCount }} / {{ store.settings.maxChars }} 字
          </span>
          <span class="text-pond-200">|</span>
          <span>Ctrl + Enter 快速投喂</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="store.inputDraft"
            class="btn-ghost !px-2.5 !py-1.5 !text-[12px]"
            @click="store.inputDraft = ''"
          >
            清空
          </button>
          <button class="btn-primary" :disabled="store.busy" @click="run">
            <BaseIcon name="send" :size="14" />
            {{ store.busy && store.busyKind === 'analyze' ? '肥鱼在嚼…' : '开始整理' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 流式输出 -->
    <div v-if="streaming || (store.busy && store.busyKind === 'analyze')" class="card mt-4 px-5 py-4">
      <div class="mb-3 flex items-center gap-2">
        <span class="animate-fish text-[15px]">🐟</span>
        <span class="text-[12.5px] text-pond-500">肥鱼正在咀嚼，边吃边整理…</span>
        <span class="flex gap-1">
          <span class="animate-bubble h-1 w-1 rounded-full bg-pond-300" style="animation-delay: 0s" />
          <span class="animate-bubble h-1 w-1 rounded-full bg-pond-300" style="animation-delay: 0.3s" />
          <span class="animate-bubble h-1 w-1 rounded-full bg-pond-300" style="animation-delay: 0.6s" />
        </span>
      </div>
      <pre
        v-if="streaming"
        class="max-h-[240px] overflow-y-auto whitespace-pre-wrap break-words font-sans text-[12.5px] leading-[1.95] text-pond-500"
        >{{ streaming }}</pre
      >
    </div>

    <!-- 结果 -->
    <div v-if="store.lastResult && !store.busy" ref="resultRef" class="mt-4">
      <OutputPanel :result="store.lastResult" class="animate-fade-up" />
    </div>

    <!-- 空状态：输入框也是空的时候才提示 -->
    <div
      v-else-if="!store.busy && !charCount"
      class="mt-4 rounded-xl2 border border-dashed border-pond-200 bg-white/50 px-6 py-10 text-center"
    >
      <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-pond-100">
        <BaseIcon name="bowl" :size="20" class="text-pond-400" />
      </div>
      <p class="text-[13px] text-pond-600">鱼塘还是空的，投喂第一口吧。</p>
      <p class="mt-1.5 text-[12px] leading-relaxed text-pond-400">
        比如：「今天把方案改完了，卡在配图选不出来，看到一句话挺喜欢——
        <span class="text-pond-500">慢就是快</span>，先存着」
      </p>
    </div>

    <!-- 写了但还没提交：给一句下一步的提示 -->
    <div v-else-if="!store.busy && charCount" class="mt-4 py-8 text-center">
      <p class="text-[12.5px] text-pond-400">
        写好了就按 <span class="text-pond-500">Ctrl + Enter</span>，或者点右边的「开始整理」
      </p>
    </div>

    <!-- 白饭提示 -->
    <p v-if="store.lastResult" class="mt-3 text-center text-[11px] text-pond-300">
      本次大约吃掉 {{ spent }} 白饭
      · 数据只存在你自己的电脑里
    </p>
  </div>
</template>
