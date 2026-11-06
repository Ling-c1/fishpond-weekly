<script setup>
import { computed, ref, watch } from 'vue'
import { useFishStore } from '../stores/fish'
import { dayLabel, prettyDate, prettyTime } from '../utils/text'
import OutputPanel from '../components/OutputPanel.vue'
import BaseIcon from '../components/BaseIcon.vue'

const store = useFishStore()

const groups = computed(() =>
  [...store.groupedEntries].sort((a, b) => (a.date < b.date ? 1 : -1))
)

const allEntries = computed(() => groups.value.flatMap((g) => g.list))
const selectedId = ref(allEntries.value[0] ? allEntries.value[0].id : '')

watch(
  allEntries,
  (list) => {
    if (!list.find((e) => e.id === selectedId.value)) {
      selectedId.value = list[0] ? list[0].id : ''
    }
  },
  { immediate: true }
)

const selected = computed(() => allEntries.value.find((e) => e.id === selectedId.value) || null)

const selectedMaterials = computed(() => {
  if (!selected.value) return []
  const ids = new Set(selected.value.materialIds || [])
  return store.materials.filter((m) => ids.has(m.id))
})

const result = computed(() =>
  selected.value ? { entry: selected.value, materials: selectedMaterials.value } : null
)

const showRaw = ref(false)
const confirmDel = ref('')

function askDelete(id) {
  if (confirmDel.value === id) {
    store.removeEntry(id)
    confirmDel.value = ''
  } else {
    confirmDel.value = id
    setTimeout(() => {
      if (confirmDel.value === id) confirmDel.value = ''
    }, 3000)
  }
}

function pick(id) {
  selectedId.value = id
  showRaw.value = false
  confirmDel.value = ''
}

function preview(e) {
  const d = e.recap && e.recap.done
  if (d && d.length) return d[0]
  return (e.rawInput || '').slice(0, 28)
}

function starsOf(e) {
  return (e.materialIds || []).length
}
</script>

<template>
  <div class="flex h-full">
    <!-- 记录列表 -->
    <div class="flex w-[268px] shrink-0 flex-col border-r border-pond-100 bg-white">
      <div class="flex items-baseline justify-between px-5 pb-3 pt-6">
        <h1 class="text-[15px] font-semibold tracking-wide text-pond-800">鱼塘周记</h1>
        <span class="text-[11.5px] text-pond-400">{{ allEntries.length }} 次投喂</span>
      </div>

      <div class="flex-1 overflow-y-auto px-3 pb-4">
        <div v-if="!allEntries.length" class="px-3 py-10 text-center text-[12.5px] text-pond-400">
          还没有记录，先去投喂吧。
        </div>

        <div v-for="g in groups" :key="g.date" class="mb-3">
          <div class="flex items-center gap-2 px-2 py-1.5">
            <span class="text-[11.5px] font-medium text-pond-500">{{ prettyDate(g.date) }}</span>
            <span v-if="dayLabel(g.date)" class="chip bg-pond-100 text-[10px] text-pond-600">
              {{ dayLabel(g.date) }}
            </span>
          </div>

          <button
            v-for="e in g.list"
            :key="e.id"
            class="mb-1 w-full rounded-xl border px-3 py-2.5 text-left transition-colors"
            :class="
              selectedId === e.id
                ? 'border-pond-300 bg-pond-50'
                : 'border-transparent hover:bg-pond-50/70'
            "
            @click="pick(e.id)"
          >
            <div class="flex items-center gap-1.5 text-[10.5px] text-pond-400">
              <span>{{ prettyTime(e.createdAt) }}</span>
              <span
                class="rounded px-1 py-[1px]"
                :class="e.mode === 'feast' ? 'bg-fish-300/30 text-amber-700' : 'bg-weed-300/25 text-emerald-700'"
              >
                {{ e.mode === 'feast' ? '加餐' : '减脂' }}
              </span>
              <span v-if="starsOf(e)" class="ml-auto text-pond-400">{{ starsOf(e) }} 条</span>
            </div>
            <p class="mt-1 truncate text-[12.5px] text-pond-700">{{ preview(e) }}</p>
          </button>
        </div>
      </div>
    </div>

    <!-- 详情 -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="selected" class="mx-auto max-w-[720px] px-7 py-6">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-[16px] font-semibold text-pond-800">{{ prettyDate(selected.date) }}</h2>
            <p class="mt-0.5 text-[11.5px] text-pond-400">
              {{ prettyTime(selected.createdAt) }} · {{ selected.model }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button class="btn-ghost !py-1.5 !text-[12px]" @click="showRaw = !showRaw">
              <BaseIcon name="file" :size="13" />
              {{ showRaw ? '收起原文' : '查看原文' }}
            </button>
            <button
              class="!py-1.5 !text-[12px]"
              :class="confirmDel === selected.id ? 'btn-danger' : 'btn-ghost'"
              @click="askDelete(selected.id)"
            >
              <BaseIcon name="trash" :size="13" />
              {{ confirmDel === selected.id ? '确定删除？' : '删除' }}
            </button>
          </div>
        </div>

        <!-- 原文 -->
        <div v-if="showRaw" class="card mb-4 overflow-hidden">
          <div class="border-b border-pond-100 px-4 py-2.5 text-[12px] text-pond-500">当日投喂原文</div>
          <pre
            class="max-h-[260px] overflow-y-auto whitespace-pre-wrap break-words px-4 py-3 font-sans text-[12.5px] leading-[1.9] text-pond-600"
            >{{ selected.rawInput }}</pre
          >
        </div>

        <OutputPanel v-if="result" :result="result" />
      </div>

      <div v-else class="flex h-full items-center justify-center text-[13px] text-pond-400">
        左边选一条记录看看
      </div>
    </div>
  </div>
</template>
