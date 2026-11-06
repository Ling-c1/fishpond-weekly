<script setup>
import { computed, ref } from 'vue'
import { useFishStore } from '../stores/fish'
import { TAGS, TAG_STYLE, prettyDate } from '../utils/text'
import BaseIcon from '../components/BaseIcon.vue'

const store = useFishStore()

const keyword = ref('')
const tag = ref('')
const minStars = ref(0)
const sort = ref('new')
const confirmDel = ref('')

const list = computed(() =>
  store.searchMaterials({ keyword: keyword.value, tag: tag.value, minStars: minStars.value, sort: sort.value })
)

const STAR_FILTERS = [
  { v: 0, label: '全部星级' },
  { v: 3, label: '3 星以上' },
  { v: 4, label: '4 星以上' }
]

function setStars(m, n) {
  if (m.stars === n) return
  store.updateMaterial({ ...m, stars: n })
}

function askDelete(id) {
  if (confirmDel.value === id) {
    store.removeMaterials([id])
    confirmDel.value = ''
  } else {
    confirmDel.value = id
    setTimeout(() => {
      if (confirmDel.value === id) confirmDel.value = ''
    }, 3000)
  }
}

function reset() {
  keyword.value = ''
  tag.value = ''
  minStars.value = 0
  sort.value = 'new'
}
</script>

<template>
  <div class="mx-auto max-w-[900px] px-8 py-7">
    <header class="flex items-end justify-between">
      <div>
        <h1 class="text-[19px] font-semibold tracking-wide text-pond-800">饵料库</h1>
        <p class="mt-1 text-[12.5px] text-pond-500">
          共 {{ store.materials.length }} 条存塘，其中
          <span class="text-amber-600">{{ store.highMaterials.length }} 条</span> 是 4 星以上的好货
        </p>
      </div>
      <button v-if="keyword || tag || minStars || sort !== 'new'" class="btn-ghost !py-1.5 !text-[12px]" @click="reset">
        <BaseIcon name="refresh" :size="13" />
        重置筛选
      </button>
    </header>

    <!-- 搜索 -->
    <div class="mt-5 flex items-center gap-2.5">
      <div class="relative flex-1">
        <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-pond-300">
          <BaseIcon name="search" :size="15" />
        </span>
        <input
          v-model="keyword"
          class="field !pl-9"
          placeholder="搜关键词，比如「配图」「早起」「选题」…"
        />
      </div>
      <select v-model.number="minStars" class="field w-[118px] cursor-pointer !py-2.5">
        <option v-for="f in STAR_FILTERS" :key="f.v" :value="f.v">{{ f.label }}</option>
      </select>
      <select v-model="sort" class="field w-[104px] cursor-pointer !py-2.5">
        <option value="new">最新</option>
        <option value="star">按星级</option>
      </select>
    </div>

    <!-- 标签 -->
    <div class="mt-3 flex items-center gap-1.5">
      <button
        class="chip !px-2.5 !py-1 transition-colors"
        :class="tag === '' ? 'bg-pond-500 text-white' : 'bg-white text-pond-500 hover:bg-pond-100'"
        @click="tag = ''"
      >
        全部
      </button>
      <button
        v-for="t in TAGS"
        :key="t"
        class="chip !px-2.5 !py-1 transition-colors"
        :class="tag === t ? 'bg-pond-500 text-white' : 'bg-white text-pond-500 hover:bg-pond-100'"
        @click="tag = tag === t ? '' : t"
      >
        {{ t }}
        <span class="ml-1 opacity-60">{{ store.materials.filter((m) => m.tag === t).length }}</span>
      </button>
    </div>

    <!-- 列表 -->
    <div v-if="list.length" class="mt-4 grid grid-cols-2 gap-3 pb-6">
      <article
        v-for="m in list"
        :key="m.id"
        class="group card relative px-4 py-3.5 transition-colors hover:border-pond-200"
      >
        <div class="flex items-center gap-2">
          <span class="chip" :class="TAG_STYLE[m.tag] || 'bg-pond-50 text-pond-600'">{{ m.tag }}</span>
          <span class="text-[11px] text-pond-300">{{ prettyDate(m.date) }}</span>

          <div class="ml-auto flex items-center gap-0.5">
            <button
              v-for="n in 5"
              :key="n"
              class="text-[13px] leading-none transition-transform hover:scale-110"
              :class="n <= m.stars ? 'text-amber-400' : 'text-pond-200'"
              @click="setStars(m, n)"
            >
              ★
            </button>
          </div>
        </div>

        <p class="mt-2.5 text-[13.5px] leading-relaxed text-pond-800">{{ m.summary }}</p>

        <p
          v-if="m.note"
          class="mt-2 border-t border-dashed border-pond-100 pt-2 text-[12px] leading-relaxed text-pond-500"
        >
          <span class="text-pond-400">用法 · </span>{{ m.note }}
        </p>

        <button
          class="absolute -right-1.5 -top-1.5 hidden items-center gap-1 rounded-lg border px-2 py-1 text-[11px] shadow-sm group-hover:flex"
          :class="
            confirmDel === m.id
              ? 'border-rose-200 bg-rose-50 text-rose-500'
              : 'border-pond-100 bg-white text-pond-400 hover:text-rose-500'
          "
          @click="askDelete(m.id)"
        >
          <BaseIcon name="trash" :size="11" />
          {{ confirmDel === m.id ? '确认' : '' }}
        </button>
      </article>
    </div>

    <div v-else class="mt-6 rounded-xl2 border border-dashed border-pond-200 bg-white/50 px-6 py-12 text-center">
      <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-pond-100">
        <BaseIcon name="search" :size="18" class="text-pond-400" />
      </div>
      <p class="text-[13px] text-pond-600">
        {{ store.materials.length ? '这个条件下没捞到饵料' : '饵料库还是空的' }}
      </p>
      <p class="mt-1 text-[12px] text-pond-400">
        {{ store.materials.length ? '换个关键词试试，或者把筛选放宽一点' : '投喂的时候顺手记一句摘抄，这里就慢慢攒起来了' }}
      </p>
    </div>
  </div>
</template>
