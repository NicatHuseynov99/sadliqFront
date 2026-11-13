<template>
  <!-- TOYUN nişanı: səkkizguşəli ulduz — şəbəkə və xalça naxışlarının əsas
       fiquru. İki üst-üstə düşən kvadratdan yaranır, içində kiçik romb. -->
  <svg class="brand-mark" :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true">
    <path :d="STAR" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" />
    <path d="M16 10.4 21.6 16 16 21.6 10.4 16Z" fill="currentColor" />
  </svg>
</template>

<script>
// Ulduzun 16 nöqtəsi: xarici künclər R radiusunda, daxili künclər iki
// kvadratın kəsişməsində (R·cos45°/cos22.5°)
const point = (radius, degrees) => {
  const a = (degrees * Math.PI) / 180
  return `${(16 + radius * Math.cos(a)).toFixed(2)} ${(16 + radius * Math.sin(a)).toFixed(2)}`
}

export const starPath = (outer = 14) => {
  const inner = (outer * Math.SQRT1_2) / Math.cos(Math.PI / 8)
  const points = []
  for (let i = 0; i < 8; i++) {
    points.push(point(outer, i * 45 - 90), point(inner, i * 45 - 67.5))
  }
  return `M${points.join('L')}Z`
}

const STAR = starPath()
</script>

<script setup>
defineProps({ size: { type: [Number, String], default: 28 } })
</script>

<style scoped>
.brand-mark {
  flex: none;
  display: block;
}
</style>
