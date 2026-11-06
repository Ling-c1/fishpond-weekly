<script setup>
import { computed, ref } from 'vue'
import { useFishStore } from '../stores/fish'
import { offsetDay, prettyDate } from '../utils/text'
import { toBlocks } from '../utils/parse'
import BaseIcon from '../components/BaseIcon.vue'

const store = useFishStore()

const today = new Date()
const todayStrValue = offsetDay(today, 0)

const from = ref(offsetDay(today, -6))
const to = ref(todayStrValue)
const shownId = ref('')
const confirmDel = ref('')

const busy = computed(() => store.busy && store.busyKind === 'weekly')
const streaming = computed(() => (busy.value ? store.streamText : ''))

const inRangeEntries = computed(() =>
  store.entries.filter((e) => e.date >= from.value && e.date <= to.value)
)
const inRangeMaterials = computed(() =>
  store.materials.filter((m) => m.date >= from.value && m.date <= to.value)
)

const weeklies = computed(() => store.weekliesSorted)
const shown = computed(
  () => weeklies.value.find((w) => w.id === shownId.value) || weeklies.value[0] || null
)
const blocks = computed(() => (shown.value ? toBlocks(shown.value.content) : []))

const RANGES = [
  { label: '最近 7 天', days: 6 },
  { label: '最近 14 天', days: 13 },
  { label: '最近 30 天', days: 29 }
]

function pickRange(days) {
  from.value = offsetDay(today, -days)
  to.value = todayStrValue
}

async function generate() {
  if (from.value > to.value) {
    store.notify('起始日期比结束日期还晚，调一下再捞', 'warn')
    return
  }
  const w = await store.generateWeekly(from.value, to.value, store.settings.mode)
  if (w) shownId.value = w.id
}

function askDelete(id) {
  if (confirmDel.value === id) {
    store.removeWeekly(id)
    confirmDel.value = ''
    if (shownId.value === id) shownId.value = ''
  } else {
    confirmDel.value = id
    setTimeout(() => {
      if (confirmDel.value === id) confirmDel.value = ''
    }, 3000)
  }
}
</script>

<template>
  <div class="mx-auto max-w-[900px] px-8 py-7">
    <header>
      <h1 class="text-[19px] font-semibold tracking-wide text-pond-800">生成周记</h1>
      <p class="mt-1 text-[12.5px] text-pond-500">
        圈一段时间，肥鱼把这段时间的复盘和好饵料熬成一锅周报。
      </p>
    </header>

    <!-- 区间选择 -->
    <div class="card mt-5 px-5 py-4">
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="label">从</label>
          <input v-model="from" type="date" class="field w-[150px] !py-2" />
        </div>
        <span class="pb-2.5 text-pond-300">→</span>
        <div>
          <label class="label">到</label>
          <input v-model="to" type="date" class="field w-[150px] !py-2" />
        </div>

        <div class="flex items-center gap-1.5 pb-0.5">
          <button
            v-for="r in RANGES"
            :key="r.days"
            class="chip !px-2.5 !py-1 transition-colors"
            :class="
              from === offsetDay(today, -r.days) && to === todayStrValue
                ? 'bg-pond-500 text-white'
                : 'bg-pond-50 text-pond-600 hover:bg-pond-100'
            "
            @click="pickRange(r.days)"
          >
            {{ r.label }}
          </button>
        </div>

        <div class="ml-auto flex items-center gap-3 pb-0.5">
          <div class="text-right text-[11.5px] leading-tight text-pond-400">
            <div>{{ inRangeEntries.length }} 次复盘 · {{ inRangeMaterials.length }} 条饵料</div>
            <div class="mt-0.5">{{ from }} ~ {{ to }}</div>
          </div>
          <button class="btn-primary" :disabled="store.busy" @click="generate">
            <BaseIcon name="sparkles" :size="14" />
            {{ busy ? '熬制中…' : '生成周记' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 流式 -->
    <div v-if="busy" class="card mt-4 px-5 py-4">
      <div class="mb-3 flex items-center gap-2">
        <span class="animate-fish text-[15px]">🐟</span>
        <span class="text-[12.5px] text-pond-500">肥鱼正在熬周报，慢火…</span>
      </div>
      <pre
        v-if="streaming"
        class="max-h-[280px] overflow-y-auto whitespace-pre-wrap break-words font-sans text-[12.5px] leading-[1.95] text-pond-500"
        >{{ streaming }}</pre
      >
    </div>

    <!-- 周报内容 -->
    <section v-if="shown && !busy" class="card mt-4 overflow-hidden">
      <header class="flex items-center justify-between border-b border-pond-100 px-5 py-3.5">
        <div>
          <h2 class="section-title">🐟 鱼塘周记</h2>
          <p class="mt-1 text-[11.5px] text-pond-400">
            {{ prettyDate(shown.from) }} ~ {{ prettyDate(shown.to) }} ·
            {{ shown.stats ? `${shown.stats.entries} 次复盘 / ${shown.stats.materials} 条饵料` : '' }}
          </p>
        </div>
        <button
          class="!py-1.5 !text-[12px]"
          :class="confirmDel === shown.id ? 'btn-danger' : 'btn-ghost'"
          @click="askDelete(shown.id)"
        >
          <BaseIcon name="trash" :size="13" />
          {{ confirmDel === shown.id ? '确认删除？' : '删除' }}
        </button>
      </header>

      <div class="px-6 py-5">
        <template v-for="(b, i) in blocks" :key="i">
          <h3
            v-if="b.type === 'h'"
            class="mb-2.5 mt-5 flex items-center gap-2 border-l-[3px] border-pond-300 pl-2.5 text-[14px] font-semibold text-pond-800 first:mt-0"
          >
            <span v-if="b.emoji" class="text-[15px]">{{ b.emoji }}</span>
            <span>{{ b.text }}</span>
          </h3>
          <p
            v-else-if="b.type === 'li'"
            class="mb-1.5 flex gap-2 pl-1 text-[13.5px] leading-[1.9] text-pond-700"
          >
            <span class="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-pond-300" />
            <span>{{ b.text }}</span>
          </p>
          <p v-else class="mb-2 text-[13.5px] leading-[1.95] text-pond-700">{{ b.text }}</p>
        </template>
      </div>
    </section>

    <!-- 历史周报 -->
    <div v-if="weeklies.length" class="mt-6 pb-6">
      <div class="mb-2.5 flex items-center justify-between">
        <h2 class="text-[13px] font-medium text-pond-600">历史周记（{{ weeklies.length }}）</h2>
      </div>
      <div class="space-y-1.5">
        <button
          v-for="w in weeklies"
          :key="w.id"
          class="flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors"
          :class="
            shown && shown.id === w.id
              ? 'border-pond-300 bg-pond-50'
              : 'border-pond-100 bg-white hover:bg-pond-50/60'
          "
          @click="shownId = w.id"
        >
          <BaseIcon name="file" :size="15" class="text-pond-400" />
          <span class="text-[12.5px] text-pond-700">{{ w.from }} ~ {{ w.to }}</span>
          <span v-if="w.stats" class="text-[11px] text-pond-400">
            {{ w.stats.entries }} 次复盘 / {{ w.stats.materials }} 条饵料
          </span>
          <span class="ml-auto text-[11px] text-pond-300">{{ prettyDate(w.to) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
