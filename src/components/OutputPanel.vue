<script setup>
import { computed } from 'vue'
import { useFishStore } from '../stores/fish'
import { TAG_STYLE, prettyTime } from '../utils/text'
import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  result: { type: Object, required: true },
  interactive: { type: Boolean, default: true }
})

const store = useFishStore()

const entry = computed(() => props.result.entry || {})
const recap = computed(() => entry.value.recap || { done: [], risks: [], todos: [], comment: '' })
const materials = computed(() => props.result.materials || [])

const modeLabel = computed(() =>
  entry.value.mode === 'feast' ? '加餐模式' : entry.value.mode === 'light' ? '减脂模式' : ''
)

const doneCount = computed(() => (recap.value.done || []).length)
const todoLeft = computed(() => (recap.value.todos || []).filter((t) => !t.done).length)

function toggle(i) {
  if (!props.interactive) return
  store.toggleTodo(entry.value.id, i)
}
</script>

<template>
  <div class="space-y-4">
    <!-- ============ 板块一：今日复盘 ============ -->
    <section class="card overflow-hidden">
      <header class="flex items-center justify-between border-b border-pond-100 px-5 py-3.5">
        <h2 class="section-title">
          <span class="text-[16px]">📋</span>
          <span>鱼塘今日复盘</span>
        </h2>
        <div class="flex items-center gap-2 text-[11.5px] text-pond-400">
          <span v-if="modeLabel" class="chip bg-pond-50 text-pond-500">{{ modeLabel }}</span>
          <span v-if="entry.createdAt">{{ prettyTime(entry.createdAt) }}</span>
        </div>
      </header>

      <div class="space-y-5 px-5 py-4">
        <!-- 今日收成 -->
        <div>
          <div class="mb-2 flex items-baseline gap-2">
            <span class="text-[13px]">✅</span>
            <h3 class="text-[13.5px] font-medium text-pond-800">今日收成</h3>
            <span class="text-[11px] text-pond-400">完成 {{ doneCount }} 项</span>
          </div>
          <ul v-if="doneCount" class="space-y-1.5 pl-0.5">
            <li
              v-for="(d, i) in recap.done"
              :key="i"
              class="flex gap-2.5 text-[13.5px] leading-relaxed text-pond-800"
            >
              <span class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-weed-500" />
              <span>{{ d }}</span>
            </li>
          </ul>
          <p v-else class="text-[12.5px] text-pond-400">今天没提到完成的事，明天再攒一点。</p>
        </div>

        <!-- 鱼塘暗礁 -->
        <div>
          <div class="mb-2 flex items-baseline gap-2">
            <span class="text-[13px]">⚠️</span>
            <h3 class="text-[13.5px] font-medium text-pond-800">鱼塘暗礁</h3>
            <span class="text-[11px] text-pond-400">卡点与破法</span>
          </div>
          <div v-if="recap.risks && recap.risks.length" class="space-y-2">
            <div
              v-for="(r, i) in recap.risks"
              :key="i"
              class="rounded-xl border border-fish-300/60 bg-fish-300/[0.12] px-3.5 py-2.5"
            >
              <p class="text-[13.5px] leading-relaxed text-pond-800">{{ r.point }}</p>
              <p v-if="r.advice" class="mt-1.5 flex gap-1.5 text-[12.5px] leading-relaxed text-amber-700">
                <span class="shrink-0 opacity-70">↳ 建议</span>
                <span>{{ r.advice }}</span>
              </p>
            </div>
          </div>
          <p v-else class="text-[12.5px] text-pond-400">今天水面很平，没有暗礁。</p>
        </div>

        <!-- 下轮投喂清单 -->
        <div>
          <div class="mb-2 flex items-baseline gap-2">
            <span class="text-[13px]">📌</span>
            <h3 class="text-[13.5px] font-medium text-pond-800">下轮投喂清单</h3>
            <span class="text-[11px] text-pond-400">还剩 {{ todoLeft }} 件</span>
          </div>
          <div v-if="recap.todos && recap.todos.length" class="space-y-0.5">
            <div
              v-for="(t, i) in recap.todos"
              :key="i"
              class="flex items-start gap-2.5 rounded-lg px-1 py-1.5 transition-colors"
              :class="interactive ? 'cursor-pointer hover:bg-pond-50' : ''"
              @click="toggle(i)"
            >
              <span
                class="mt-[3px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[5px] border transition-colors"
                :class="
                  t.done
                    ? 'border-weed-500 bg-weed-500 text-white'
                    : 'border-pond-300 bg-white text-transparent'
                "
              >
                <BaseIcon name="check" :size="10" />
              </span>
              <span
                class="flex-1 text-[13.5px] leading-relaxed transition-colors"
                :class="t.done ? 'text-pond-300 line-through' : 'text-pond-800'"
              >
                {{ t.text }}
              </span>
              <span
                class="chip mt-0.5 shrink-0"
                :class="
                  t.priority === '高' ? 'bg-rose-50 text-rose-500' : 'bg-pond-50 text-pond-500'
                "
              >
                {{ t.priority }}
              </span>
            </div>
          </div>
          <p v-else class="text-[12.5px] text-pond-400">明天的事，明天再想。</p>
        </div>

        <!-- 肥鱼点评 -->
        <div v-if="recap.comment">
          <div class="flex gap-2.5">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pond-100">
              <span class="text-[13px]">🐟</span>
            </div>
            <div
              class="relative flex-1 rounded-xl rounded-tl-sm bg-pond-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-pond-700"
            >
              {{ recap.comment }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 板块二：饵料收纳库 ============ -->
    <section class="card overflow-hidden">
      <header class="flex items-center justify-between border-b border-pond-100 px-5 py-3.5">
        <h2 class="section-title">
          <span class="text-[16px]">📂</span>
          <span>本期饵料收纳库</span>
        </h2>
        <span class="chip bg-pond-50 text-pond-500">捞到 {{ materials.length }} 条</span>
      </header>

      <div v-if="materials.length" class="grid grid-cols-2 gap-3 px-5 py-4">
        <article
          v-for="m in materials"
          :key="m.id"
          class="animate-fade-up rounded-xl border border-pond-100 bg-white px-3.5 py-3 transition-colors hover:border-pond-200"
        >
          <div class="flex items-center justify-between">
            <span class="chip" :class="TAG_STYLE[m.tag] || 'bg-pond-50 text-pond-600'">{{ m.tag }}</span>
            <span class="text-[11.5px] leading-none tracking-[0.1em] text-amber-400">
              {{ '★'.repeat(m.stars)
              }}<span class="text-pond-200">{{ '★'.repeat(5 - m.stars) }}</span>
            </span>
          </div>

          <p class="mt-2 text-[13.5px] leading-relaxed text-pond-800">{{ m.summary }}</p>

          <p
            v-if="m.note"
            class="mt-2 border-t border-dashed border-pond-100 pt-2 text-[12px] leading-relaxed text-pond-500"
          >
            <span class="text-pond-400">用法 · </span>{{ m.note }}
          </p>
        </article>
      </div>

      <div v-else class="px-5 py-8 text-center">
        <p class="text-[13px] text-pond-400">这次没捞到饵料，看来全是碎碎念。</p>
      </div>
    </section>
  </div>
</template>
