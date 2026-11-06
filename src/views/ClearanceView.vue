<script setup>
import { computed, ref } from 'vue'
import { useFishStore } from '../stores/fish'
import { TAG_STYLE, prettyDate } from '../utils/text'
import BaseIcon from '../components/BaseIcon.vue'

const store = useFishStore()

const picked = ref([])
const pending = ref(false)

const low = computed(() => store.lowMaterials)
const allPicked = computed(() => low.value.length > 0 && picked.value.length === low.value.length)
const totalStars = computed(() => low.value.length)

function toggle(id) {
  pending.value = false
  const i = picked.value.indexOf(id)
  if (i >= 0) picked.value.splice(i, 1)
  else picked.value.push(id)
}

function toggleAll() {
  pending.value = false
  picked.value = allPicked.value ? [] : low.value.map((m) => m.id)
}

function doClear() {
  if (!pending.value) {
    pending.value = true
    setTimeout(() => (pending.value = false), 4000)
    return
  }
  store.removeMaterials([...picked.value])
  picked.value = []
  pending.value = false
}
</script>

<template>
  <div class="mx-auto max-w-[900px] px-8 py-7">
    <header>
      <h1 class="text-[19px] font-semibold tracking-wide text-pond-800">鱼塘清仓</h1>
      <p class="mt-1 text-[12.5px] leading-relaxed text-pond-500">
        把 1-2 星的低价值饵料捞出来扔掉，鱼塘才不浑。超过 3 星的不在这儿，不用担心误删好东西。
      </p>
    </header>

    <!-- 概览条 -->
    <div
      class="mt-5 flex items-center gap-4 rounded-xl2 border px-5 py-4"
      :class="low.length ? 'border-fish-300/60 bg-fish-300/[0.10]' : 'border-pond-100 bg-white'"
    >
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70">
        <BaseIcon
          :name="low.length ? 'trash' : 'sparkles'"
          :size="18"
          :class="low.length ? 'text-amber-500' : 'text-weed-500'"
        />
      </div>
      <div class="flex-1">
        <p class="text-[13.5px] font-medium text-pond-800">
          {{ low.length ? `捞到 ${low.length} 条 1-2 星饵料` : '鱼塘很干净，没有低分饵料' }}
        </p>
        <p class="mt-0.5 text-[11.5px] text-pond-500">
          {{
            low.length
              ? '勾选后一次性清掉，删除后不可恢复（建议先导出备份）'
              : '继续保持，好饵料只留值得留的'
          }}
        </p>
      </div>
      <div v-if="low.length" class="flex items-center gap-2">
        <button class="btn-ghost !py-1.5 !text-[12px]" @click="toggleAll">
          {{ allPicked ? '取消全选' : '全选' }}
        </button>
        <button
          class="!py-1.5 !text-[12px]"
          :class="picked.length ? (pending ? 'btn-danger' : 'btn-primary') : 'btn-ghost'"
          :disabled="!picked.length"
          @click="doClear"
        >
          <BaseIcon name="trash" :size="13" />
          {{ pending ? `确认清掉 ${picked.length} 条` : `清仓（${picked.length}）` }}
        </button>
      </div>
    </div>

    <!-- 列表 -->
    <div v-if="low.length" class="mt-4 space-y-2 pb-6">
      <div
        v-for="m in low"
        :key="m.id"
        class="flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 transition-colors"
        :class="picked.includes(m.id) ? 'border-pond-300 bg-pond-50/60' : 'border-pond-100 hover:border-pond-200'"
        @click="toggle(m.id)"
      >
        <span
          class="mt-[3px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[5px] border transition-colors"
          :class="
            picked.includes(m.id)
              ? 'border-pond-500 bg-pond-500 text-white'
              : 'border-pond-300 bg-white text-transparent'
          "
        >
          <BaseIcon name="check" :size="10" />
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="chip" :class="TAG_STYLE[m.tag] || 'bg-pond-50 text-pond-600'">{{ m.tag }}</span>
            <span class="text-[11.5px] leading-none tracking-[0.1em] text-amber-400">
              {{ '★'.repeat(m.stars) }}<span class="text-pond-200">{{ '★'.repeat(5 - m.stars) }}</span>
            </span>
            <span class="text-[11px] text-pond-300">{{ prettyDate(m.date) }}</span>
          </div>
          <p class="mt-1.5 text-[13px] leading-relaxed text-pond-700">{{ m.summary }}</p>
        </div>
      </div>
    </div>

    <div v-else class="mt-6 rounded-xl2 border border-dashed border-pond-200 bg-white/50 px-6 py-14 text-center">
      <p class="text-[13px] text-pond-600">没有需要清仓的饵料</p>
      <p class="mt-1 text-[12px] text-pond-400">低分素材攒到一定数量，这里就会自动列出来</p>
    </div>
  </div>
</template>
