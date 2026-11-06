<script setup>
import { computed, ref } from 'vue'
import { useFishStore } from '../stores/fish'
import { estimateMeal } from '../utils/text'
import BaseIcon from '../components/BaseIcon.vue'

const store = useFishStore()

const PRESETS = ['deepseek-chat', 'deepseek-reasoner']
const showKey = ref(false)
const testing = ref(false)
const testResult = ref(null)
const showPrompt = ref(false)
const customModel = ref('')

const modelSelect = computed({
  get() {
    if (PRESETS.includes(store.settings.model)) return store.settings.model
    return 'custom'
  },
  set(v) {
    if (v === 'custom') {
      customModel.value = store.settings.model
      store.patchSettings({ model: '' })
    } else {
      store.patchSettings({ model: v })
    }
  }
})

const feastCost = computed(() => estimateMeal(1200, 'feast'))
const lightCost = computed(() => estimateMeal(1200, 'light'))

async function saveKey() {
  await store.patchSettings({ apiKey: (store.settings.apiKey || '').trim() })
  store.notify('密钥已存到本地，不会上传', 'success')
}

async function saveBase() {
  await store.patchSettings({ baseUrl: (store.settings.baseUrl || '').trim() })
}

async function applyCustomModel() {
  const v = customModel.value.trim()
  if (!v) return
  await store.patchSettings({ model: v })
}

async function test() {
  testing.value = true
  testResult.value = null
  const res = await window.fishpond.testApi()
  testing.value = false
  if (res && res.ok) {
    testResult.value = { ok: true, msg: `通了，肥鱼说「${(res.text || '').trim() || '开饭'}」` }
  } else {
    testResult.value = { ok: false, msg: (res && res.error) || '没通，检查一下密钥和地址' }
  }
}
</script>

<template>
  <div class="mx-auto max-w-[820px] px-8 py-7">
    <header>
      <h1 class="text-[19px] font-semibold tracking-wide text-pond-800">鱼塘设置</h1>
      <p class="mt-1 text-[12.5px] text-pond-500">填一次就好，之后打开就能用。</p>
    </header>

    <!-- API -->
    <section class="card mt-5 px-5 py-5">
      <div class="mb-4 flex items-center gap-2">
        <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-pond-100">
          <BaseIcon name="key" :size="15" class="text-pond-500" />
        </span>
        <div>
          <h2 class="text-[13.5px] font-medium text-pond-800">大模型接口</h2>
          <p class="text-[11.5px] text-pond-400">用自己的 API Key，费用走你自己的账户</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="label">API Key</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input
                v-model="store.settings.apiKey"
                :type="showKey ? 'text' : 'password'"
                class="field !pr-9 font-mono !text-[12.5px]"
                placeholder="sk-xxxxxxxxxxxxxxxx"
                spellcheck="false"
                @change="saveKey"
              />
              <button
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-pond-300 transition hover:text-pond-500"
                @click="showKey = !showKey"
              >
                <BaseIcon :name="showKey ? 'eyeOff' : 'eye'" :size="15" />
              </button>
            </div>
            <button class="btn-ghost shrink-0" :disabled="testing" @click="test">
              <BaseIcon name="refresh" :size="13" />
              {{ testing ? '测试中' : '测试连接' }}
            </button>
          </div>
          <p v-if="testResult" class="mt-2 text-[12px]" :class="testResult.ok ? 'text-emerald-600' : 'text-rose-500'">
            {{ testResult.msg }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">接口地址</label>
            <input
              v-model="store.settings.baseUrl"
              class="field font-mono !text-[12.5px]"
              placeholder="https://api.deepseek.com/v1"
              spellcheck="false"
              @change="saveBase"
            />
            <p class="hint mt-1">默认 DeepSeek，兼容 OpenAI 格式的都能填</p>
          </div>

          <div>
            <label class="label">模型</label>
            <select v-model="modelSelect" class="field cursor-pointer">
              <option value="deepseek-chat">deepseek-chat（通用，便宜）</option>
              <option value="deepseek-reasoner">deepseek-reasoner（会思考，白饭贵）</option>
              <option value="custom">自定义模型名…</option>
            </select>
            <div v-if="modelSelect === 'custom'" class="mt-2 flex gap-2">
              <input
                v-model="customModel"
                class="field font-mono !text-[12.5px]"
                placeholder="填模型名，如 qwen-plus"
                spellcheck="false"
                @change="applyCustomModel"
              />
              <button class="btn-soft shrink-0 !py-1.5" @click="applyCustomModel">确定</button>
            </div>
            <p v-else class="hint mt-1">当前：{{ store.settings.model }}</p>
          </div>
        </div>
      </div>

      <!-- 白饭预估 -->
      <div class="mt-4 rounded-xl bg-pond-50 px-4 py-3">
        <div class="flex items-center gap-1.5 text-[12px] font-medium text-pond-700">
          <span>🍚</span><span>白饭消耗预估</span>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-3 text-[12px] text-pond-600">
          <div class="flex items-baseline justify-between rounded-lg bg-white px-3 py-2">
            <span>加餐模式 · 每次</span>
            <span class="font-medium text-amber-600">≈ {{ feastCost }}</span>
          </div>
          <div class="flex items-baseline justify-between rounded-lg bg-white px-3 py-2">
            <span>减脂模式 · 每次</span>
            <span class="font-medium text-emerald-600">≈ {{ lightCost }}</span>
          </div>
        </div>
        <p class="mt-2 text-[11px] leading-relaxed text-pond-400">
          白饭 = token。数字按 1200 字投喂量估算，实际以模型账单为准。想省白饭就用减脂模式。
        </p>
      </div>
    </section>

    <!-- 投喂限制 -->
    <section class="card mt-4 px-5 py-5">
      <div class="mb-4 flex items-center gap-2">
        <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-pond-100">
          <BaseIcon name="bowl" :size="15" class="text-pond-500" />
        </span>
        <div>
          <h2 class="text-[13.5px] font-medium text-pond-800">投喂习惯</h2>
          <p class="text-[11.5px] text-pond-400">控制一次能吃多少</p>
        </div>
      </div>

      <div class="grid grid-cols-2 items-end gap-3">
        <div>
          <label class="label">单次字数上限</label>
          <input
            v-model.number="store.settings.maxChars"
            type="number"
            min="500"
            step="500"
            class="field w-[160px]"
            @change="store.patchSettings({ maxChars: Math.max(500, Number(store.settings.maxChars) || 6000) })"
          />
        </div>
        <p class="hint pb-2.5">
          超过这个字数会提示拆分投喂，避免模型嚼不烂还浪费白饭。建议 3000-8000。
        </p>
      </div>
    </section>

    <!-- 本地数据 -->
    <section class="card mt-4 px-5 py-5">
      <div class="mb-4 flex items-center gap-2">
        <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-pond-100">
          <BaseIcon name="save" :size="15" class="text-pond-500" />
        </span>
        <div>
          <h2 class="text-[13.5px] font-medium text-pond-800">本地数据</h2>
          <p class="text-[11.5px] text-pond-400">全部存在你自己电脑上，不上传任何服务器</p>
        </div>
      </div>

      <div class="rounded-xl bg-pond-50 px-3.5 py-2.5">
        <div class="text-[11px] text-pond-400">数据文件位置</div>
        <div class="mt-0.5 break-all font-mono text-[11.5px] text-pond-600">
          {{ store.dataPath || '（尚未初始化）' }}
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn-ghost" @click="store.exportBackup()">
          <BaseIcon name="download" :size="14" />
          导出备份
        </button>
        <button class="btn-ghost" @click="store.importBackup()">
          <BaseIcon name="upload" :size="14" />
          导入备份
        </button>
        <button class="btn-ghost" @click="store.openFolder()">
          <BaseIcon name="folder" :size="14" />
          打开数据文件夹
        </button>
      </div>
      <p class="hint mt-2">
        换电脑或者重装系统前，记得先导出一份 JSON 备份；导入会覆盖当前所有数据。
      </p>
    </section>

    <!-- 内置提示词 -->
    <section class="card mt-4 px-5 py-4">
      <button class="flex w-full items-center justify-between" @click="showPrompt = !showPrompt">
        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-pond-100">
          <BaseIcon name="file" :size="15" class="text-pond-500" />
        </span>
          <div class="text-left">
            <h2 class="text-[13.5px] font-medium text-pond-800">内置提示词</h2>
            <p class="text-[11.5px] text-pond-400">已经托管在软件里，你不需要自己写</p>
          </div>
        </div>
        <span class="text-[11.5px] text-pond-400">{{ showPrompt ? '收起' : '查看' }}</span>
      </button>

      <pre
        v-if="showPrompt"
        class="mt-3 max-h-[320px] overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-pond-50 px-4 py-3 font-sans text-[11.5px] leading-[1.9] text-pond-600"
        >{{ store.systemPrompt }}</pre
      >
    </section>

    <p class="mt-6 pb-4 text-center text-[11px] text-pond-300">
      鱼塘周记馆 v1.0.0 · 纯本地运行 · 不接入任何社交软件
    </p>
  </div>
</template>
