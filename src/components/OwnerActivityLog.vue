<template>
  <!-- Sahibin öz sarayları üzrə fəaliyyət jurnalı: administratorlarının
       nə etdiyini görmək üçün. Səlahiyyət vermək kor inam olmamalıdır.
       Platforma işçilərinin əməliyyatları bu siyahıya düşmür. -->
  <section class="block">
    <div class="block-head">
      <div>
        <h2 class="block-title">Fəaliyyət jurnalı <em v-if="total">{{ total }}</em></h2>
        <p class="block-sub">
          Saraylarınızda kimin nə etdiyi. Yalnız sizin komandanızın əməliyyatları görünür.
        </p>
      </div>
      <input
        v-model="search"
        class="search-box"
        type="search"
        placeholder="Ad və ya əməliyyat üzrə axtar…"
        @input="onSearchInput"
      />
    </div>

    <div v-loading="isLoading" class="log-list">
      <div v-for="a in items" :key="a.id" class="log-row" :class="{ failed: !a.isSuccess }">
        <div class="lr-main">
          <b>{{ a.userName }}</b>
          <span>{{ a.description }}</span>
        </div>
        <span class="lr-time">{{ shortTime(a.createdAt) }}</span>
      </div>

      <UiEmpty
        v-if="!isLoading && !items.length"
        icon="📜"
        title="Qeyd yoxdur."
        :text="search ? 'Axtarışa uyğun qeyd tapılmadı.' : 'Hələ heç bir əməliyyat qeydə alınmayıb.'"
      />

      <Pager :page="page" :page-size="pageSize" :total="total" @change="goPage" />
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { toast } from '@/utils/toast'
import Pager from '@/components/Pager.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import { getOwnerActivityLog } from '@/services/ownerService'

const items = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 30

const search = ref('')
const isLoading = ref(false)

const load = async () => {
  isLoading.value = true
  try {
    const result = await getOwnerActivityLog({
      q: search.value.trim() || undefined,
      page: page.value,
      pageSize,
    })
    items.value = result.items
    total.value = result.totalCount
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Jurnal yüklənmədi')
  } finally {
    isLoading.value = false
  }
}

let searchTimer = null
const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
}

const goPage = (value) => {
  page.value = value
  load()
}

const shortTime = (value) => {
  if (!value) return '—'

  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  const today = new Date().toDateString() === d.toDateString()

  return today
    ? `bu gün ${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onBeforeUnmount(() => clearTimeout(searchTimer))

load()
</script>

<style scoped>
.block {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 22px 24px;
  box-shadow: var(--shadow-1);
}

.block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.block-title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--ink);
}

.block-title em {
  font-style: normal;
  font-size: 0.78rem;
  color: var(--muted);
  margin-left: 6px;
}

.block-sub {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: var(--muted);
}

.search-box {
  min-width: 240px;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.83rem;
  font-family: inherit;
  outline: none;
}

.search-box:focus {
  border-color: var(--gold);
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 13px;
  border: 1px solid var(--line-2);
  border-radius: var(--r);
}

/* Uğursuz əməliyyat gözə dəyməlidir */
.log-row.failed {
  border-color: #f3dbe1;
  background: var(--danger-soft);
}

.lr-main b {
  font-size: 0.83rem;
  color: var(--ink);
  margin-right: 6px;
}

.lr-main span {
  font-size: 0.82rem;
  color: var(--ink-2);
  line-height: 1.5;
}

.lr-time {
  font-size: 0.71rem;
  color: var(--muted-2);
  white-space: nowrap;
}

@media (max-width: 700px) {
  .log-row {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
