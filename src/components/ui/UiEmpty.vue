<template>
  <div class="ui-empty">
    <span class="ui-empty-icon">{{ icon }}</span>
    <h3>{{ title }}</h3>
    <p v-if="text">{{ text }}</p>
    <slot />
  </div>
</template>

<script setup>
// Boş hallar hər səhifədə eyni quruluşda: işarə, bir cümlə, bir addım
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
})
</script>

<style scoped>
.ui-empty {
  background: var(--surface);
  border: 1px dashed #eadfe3;
  border-radius: var(--r-lg);
  padding: 44px 24px;
  text-align: center;
}

.ui-empty-icon {
  font-size: 2.4rem;
  display: block;
  margin-bottom: 10px;
}

.ui-empty h3 {
  margin: 0 0 6px;
  font-size: var(--fs-lg);
  color: var(--ink);
}

.ui-empty p {
  margin: 0 auto 18px;
  max-width: 420px;
  font-size: var(--fs-sm);
  color: var(--muted);
  line-height: 1.65;
}
</style>
