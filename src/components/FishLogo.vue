<script setup>
defineProps({
  size: { type: Number, default: 40 },
  flat: { type: Boolean, default: false }
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- 底色：一汪小水塘 -->
    <circle v-if="!flat" cx="32" cy="32" r="32" fill="#E8F4FB" />
    <circle v-if="!flat" cx="32" cy="32" r="32" stroke="#CFE8F6" stroke-width="1.5" />

    <!-- 水波 -->
    <path
      d="M10 48c4-2.5 8-2.5 12 0s8 2.5 12 0 8-2.5 12 0"
      stroke="#BFE0F1"
      stroke-width="2"
      stroke-linecap="round"
      opacity="0.9"
    />

    <!-- 鱼尾 -->
    <path d="M20 33.5 8.5 24.5c-.8-.6-1.9 0-1.9 1v16c0 1 1.1 1.6 1.9 1l11.5-9z" fill="#5FB0D6" />

    <!-- 鱼身 -->
    <ellipse cx="35" cy="33.5" rx="17" ry="11.5" fill="#7CC0E0" />

    <!-- 肚皮高光 -->
    <path d="M22 38c4 3.6 12 4.8 20 1.2" stroke="#A8D8EE" stroke-width="2.4" stroke-linecap="round" opacity="0.9" />

    <!-- 背鳍 -->
    <path d="M30 22.4c2.6-3.2 7.4-3.6 10.6-1.2-3.4.6-7 1.6-10.6 1.2z" fill="#5FB0D6" />

    <!-- 眼睛 -->
    <circle cx="45" cy="30.5" r="3.2" fill="#FFFFFF" />
    <circle cx="45.9" cy="30.5" r="1.6" fill="#274A60" />
    <circle cx="46.6" cy="29.8" r="0.55" fill="#FFFFFF" />

    <!-- 泡泡 -->
    <circle cx="55" cy="20" r="2.6" fill="#CFE8F6" />
    <circle cx="59" cy="12.5" r="1.6" fill="#CFE8F6" />
  </svg>
</template>
