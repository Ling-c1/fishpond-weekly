<script setup>
import { computed, onMounted } from 'vue'
import { useFishStore } from './stores/fish'
import SideBar from './components/SideBar.vue'
import Toast from './components/Toast.vue'
import TodayView from './views/TodayView.vue'
import HistoryView from './views/HistoryView.vue'
import MaterialsView from './views/MaterialsView.vue'
import ClearanceView from './views/ClearanceView.vue'
import WeeklyView from './views/WeeklyView.vue'
import SettingsView from './views/SettingsView.vue'

const store = useFishStore()

const VIEWS = {
  today: TodayView,
  history: HistoryView,
  materials: MaterialsView,
  clearance: ClearanceView,
  weekly: WeeklyView,
  settings: SettingsView
}

const current = computed(() => VIEWS[store.view] || TodayView)

onMounted(() => store.init())
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-pond-50">
    <SideBar />

    <main class="relative flex-1 overflow-y-auto">
      <KeepAlive>
        <component :is="current" />
      </KeepAlive>

      <!-- 初始化遮罩 -->
      <div
        v-if="!store.ready"
        class="absolute inset-0 flex items-center justify-center bg-pond-50"
      >
        <div class="flex items-center gap-2.5 text-[13px] text-pond-400">
          <span class="animate-fish text-[16px]">🐟</span>
          正在打捞鱼塘…
        </div>
      </div>
    </main>

    <Toast />
  </div>
</template>
