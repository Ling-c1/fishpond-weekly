<script setup>
import { useFishStore } from '../stores/fish'
import BaseIcon from './BaseIcon.vue'

const store = useFishStore()

const STYLE = {
  info: 'border-pond-200 bg-white text-pond-700',
  success: 'border-weed-300 bg-weed-300/25 text-emerald-800',
  warn: 'border-fish-300 bg-fish-300/25 text-amber-800',
  error: 'border-rose-200 bg-rose-50 text-rose-600'
}

const ICON = {
  info: 'info',
  success: 'check',
  warn: 'info',
  error: 'info'
}
</script>

<template>
  <div
    class="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col-reverse items-center gap-2"
  >
    <transition-group name="toast">
      <div
        v-for="t in store.toastList"
        :key="t.id"
        class="pointer-events-auto flex max-w-[420px] items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] leading-relaxed shadow-card"
        :class="STYLE[t.type] || STYLE.info"
      >
        <BaseIcon :name="ICON[t.type] || 'info'" :size="15" class="mt-0.5 shrink-0" />
        <span class="flex-1">{{ t.text }}</span>
        <button class="mt-0.5 opacity-50 transition hover:opacity-100" @click="store.dismissToast(t.id)">
          <BaseIcon name="close" :size="13" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.22s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
