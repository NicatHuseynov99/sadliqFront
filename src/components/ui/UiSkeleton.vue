<template>
  <div class="ui-sk" :class="shape" :style="style"></div>
</template>

<script setup>
import { computed } from 'vue'

// Yükləmə zamanı məzmunun öz formasında boz blok.
// Fırlanan spinner səhifəni «donmuş» göstərir, bu isə nə gələcəyini bildirir.
const props = defineProps({
  shape: { type: String, default: 'line' }, // line | title | block | circle
  width: { type: String, default: '' },
  height: { type: String, default: '' },
})

const style = computed(() => ({
  width: props.width || undefined,
  height: props.height || undefined,
}))
</script>

<style scoped>
.ui-sk {
  background: linear-gradient(90deg, #f2eef0 25%, #f8f5f6 50%, #f2eef0 75%);
  background-size: 840px 100%;
  animation: ui-shimmer 1.4s infinite linear;
  border-radius: var(--r-sm);
}

.line {
  height: 12px;
  margin-bottom: 8px;
}

.title {
  height: 20px;
  width: 55%;
  margin-bottom: 12px;
}

.block {
  height: 150px;
  border-radius: var(--r);
}

.circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
</style>
