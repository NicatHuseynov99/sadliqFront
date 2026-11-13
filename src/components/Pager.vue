<template>
  <nav v-if="lastPage > 1" class="pager" aria-label="Səhifələr">
    <button class="arrow" :disabled="page === 1" title="Əvvəlki səhifə" @click="go(page - 1)">
      ‹
    </button>

    <ul class="pages">
      <li v-for="(item, i) in items" :key="`${item}-${i}`">
        <span v-if="item === '…'" class="gap">…</span>
        <button
          v-else
          class="page"
          :class="{ active: item === page }"
          @click="go(item)"
        >
          {{ item }}
        </button>
      </li>
    </ul>

    <button class="arrow" :disabled="page === lastPage" title="Növbəti səhifə" @click="go(page + 1)">
      ›
    </button>

    <span v-if="total" class="total">{{ total }} qeyd</span>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, default: 20 },
  total: { type: Number, default: 0 },
})

const emit = defineEmits(['change'])

const lastPage = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

// Səhifə çox olanda hamısını yazmaq mənasızdır: əvvəl, son, cari və qonşuları
// göstərilir, aradakılar «…» ilə qısaldılır.
const items = computed(() => {
  const last = lastPage.value
  const current = props.page

  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)

  const pages = new Set([1, last, current, current - 1, current + 1])

  // Başda və ya sonda olanda o tərəfdə bir neçə səhifə daha göstəririk
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= last - 2) [last - 3, last - 2, last - 1].forEach((p) => pages.add(p))

  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b)

  const result = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…')
    result.push(p)
  })

  return result
})

const go = (value) => {
  if (value < 1 || value > lastPage.value || value === props.page) return
  emit('change', value)
}
</script>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.pages {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.page,
.arrow {
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--line-2);
  background: #fff;
  color: var(--muted);
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.page:hover:not(.active),
.arrow:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--brand);
  transform: translateY(-1px);
}

/* Cari səhifə */
.page.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
  box-shadow: 0 5px 14px rgba(114, 20, 56, 0.25);
  cursor: default;
}

.arrow {
  font-size: 1.1rem;
  line-height: 1;
  display: grid;
  place-items: center;
}

.arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.gap {
  padding: 0 4px;
  color: #c9bcc1;
  font-size: 0.82rem;
  user-select: none;
}

.total {
  margin-left: 10px;
  font-size: 0.76rem;
  color: var(--muted-2);
}

@media (max-width: 520px) {
  .total {
    width: 100%;
    text-align: center;
    margin: 4px 0 0;
  }
}
</style>
