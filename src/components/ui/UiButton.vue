<template>
  <component
    :is="tag"
    class="ui-btn"
    :class="[variant, size, { block, loading: isLoading }]"
    :disabled="tag === 'button' ? disabled || isLoading : null"
    :to="to"
    :href="href"
  >
    <span v-if="isLoading" class="spin"></span>
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'

// Bütün düymələr bir yerdən idarə olunur: variant və ölçü seçilir,
// qalan hər şey (rəng, kölgə, fokus) nişanlardan gəlir.
const props = defineProps({
  // primary | ghost | soft | danger | danger-solid | gold
  //
  // danger — ağ fonlu, nazik çərçivəli: siyahı içindəki «Sil» kimi
  //   ikinci dərəcəli yerlər üçün.
  // danger-solid — dolu qırmızı: pəncərədə əsas təsdiq düyməsi ağ fon
  //   üzərində kontur qalsa görünmür.
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' }, // sm | md | lg
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },

  // Link kimi işləməsi üçün
  to: { type: [String, Object], default: null },
  href: { type: String, default: null },
})

const tag = computed(() => {
  if (props.to) return 'router-link'
  if (props.href) return 'a'
  return 'button'
})
</script>

<style scoped>
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  border: 1px solid transparent;
  border-radius: var(--r);
  font-family: var(--font);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background var(--t-fast), border-color var(--t-fast), transform var(--t-fast);
}

.ui-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.ui-btn:disabled,
.ui-btn.loading {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Ölçülər */
.sm {
  padding: 6px 13px;
  font-size: var(--fs-xs);
}

.md {
  padding: 9px 18px;
  font-size: var(--fs-sm);
}

.lg {
  padding: 12px 26px;
  font-size: var(--fs-md);
}

.block {
  width: 100%;
}

/* Variantlar */
.primary {
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff;
}

.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--brand-dark), var(--brand));
}

/* Çərçivə --line-2-dən (#f0eaec) götürülürdü — ağ fon üzərində
   demək olar görünmürdü və düymə mətn kimi oxunurdu */
.ghost {
  background: var(--surface);
  border-color: #ddccd3;
  color: var(--brand);
}

.ghost:hover:not(:disabled) {
  border-color: var(--gold);
  background: var(--brand-soft);
}

.soft {
  background: var(--brand-soft);
  color: var(--brand);
}

.soft:hover:not(:disabled) {
  background: #f0dde4;
}

.danger {
  background: var(--surface);
  border-color: #e8bfc9;
  color: var(--danger);
}

.danger:hover:not(:disabled) {
  background: var(--danger-soft);
}

/* Geri alınmayan əməliyyatın əsas düyməsi — dolu, gözdən qaçmasın */
.danger-solid {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}

.danger-solid:hover:not(:disabled) {
  background: #86243d;
  border-color: #86243d;
}

.gold {
  background: var(--gold);
  color: var(--ink);
}

.gold:hover:not(:disabled) {
  background: #ecc272;
}

/* Yüklənmə dairəsi */
.spin {
  width: 13px;
  height: 13px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ui-spin 0.7s linear infinite;
}

@keyframes ui-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
