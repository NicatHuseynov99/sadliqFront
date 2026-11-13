<template>
  <span class="ui-tag" :class="[tone, { dot }]">
    <i v-if="dot" class="tag-dot"></i>
    <slot />
  </span>
</template>

<script setup>
// Status nişanları: hər səhifə öz rəngini yenidən yazmasın
defineProps({
  tone: { type: String, default: 'neutral' }, // neutral | brand | ok | warn | danger | info
  dot: { type: Boolean, default: false },
})
</script>

<style scoped>
.ui-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--r-pill);
  font-size: var(--fs-xs);
  font-weight: 600;
  white-space: nowrap;
}

.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.neutral {
  background: var(--surface-2);
  color: var(--muted);
}

.brand {
  background: var(--brand-soft);
  color: var(--brand);
}

.ok {
  background: var(--ok-soft);
  color: var(--ok);
}

.warn {
  background: var(--warn-soft);
  color: var(--warn);
}

.danger {
  background: var(--danger-soft);
  color: var(--danger);
}

.info {
  background: var(--info-soft);
  color: var(--info);
}
</style>
