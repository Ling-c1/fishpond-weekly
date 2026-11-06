<script setup>
import { computed } from 'vue'
import { useFishStore } from '../stores/fish'
import FishLogo from './FishLogo.vue'
import BaseIcon from './BaseIcon.vue'

const store = useFishStore()

const NAV = [
  { key: 'today', label: '今日投喂', icon: 'edit' },
  { key: 'history', label: '鱼塘周记', icon: 'calendar' },
  { key: 'materials', label: '饵料库', icon: 'bookmark' },
  { key: 'clearance', label: '鱼塘清仓', icon: 'trash' },
  { key: 'weekly', label: '生成周记', icon: 'file' }
]

const lowCount = computed(() => store.lowMaterials.length)
</script>

<template>
  <aside class="flex w-[212px] shrink-0 flex-col border-r border-pond-100 bg-white">
    <!-- 品牌 -->
    <div class="flex items-center gap-2.5 px-5 pb-5 pt-6">
      <FishLogo :size="38" />
      <div class="leading-tight">
        <div class="text-[15px] font-semibold tracking-wide text-pond-800">鱼塘周记馆</div>
        <div class="mt-0.5 text-[11px] text-pond-400">养一条大肥鱼</div>
      </div>
    </div>

    <!-- 导航 -->
    <nav class="flex-1 space-y-1 px-3">
      <button
        v-for="item in NAV"
        :key="item.key"
        class="group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors"
        :class="
          store.view === item.key
            ? 'bg-pond-100 font-medium text-pond-800'
            : 'text-pond-600 hover:bg-pond-50'
        "
        @click="store.go(item.key)"
      >
        <span
          v-if="store.view === item.key"
          class="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-pond-500"
        />
        <BaseIcon :name="item.icon" :size="17" class="shrink-0" />
        <span class="flex-1 text-left">{{ item.label }}</span>
        <span
          v-if="item.key === 'clearance' && lowCount"
          class="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10.5px] font-medium text-rose-400"
        >
          {{ lowCount }}
        </span>
      </button>
    </nav>

    <!-- 底部 -->
    <div class="border-t border-pond-100 px-3 py-3">
      <div class="mb-2 rounded-xl bg-pond-50 px-3 py-2.5">
        <div class="flex items-center justify-between text-[11px] text-pond-500">
          <span>累计投喂</span>
          <span class="font-medium text-pond-700">{{ store.entries.length }} 次</span>
        </div>
        <div class="mt-1 flex items-center justify-between text-[11px] text-pond-500">
          <span>存塘饵料</span>
          <span class="font-medium text-pond-700">{{ store.materials.length }} 条</span>
        </div>
      </div>

      <button
        class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors"
        :class="
          store.view === 'settings'
            ? 'bg-pond-100 font-medium text-pond-800'
            : 'text-pond-600 hover:bg-pond-50'
        "
        @click="store.go('settings')"
      >
        <BaseIcon name="settings" :size="17" />
        <span>鱼塘设置</span>
      </button>
    </div>
  </aside>
</template>
