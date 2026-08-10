<template>
  <!-- Dəstək növbəsi. Support bu bölmənin sahibidir: işi götürür,
       tərəflərlə danışır və yazılı qərar verir. -->
  <section class="block">
    <div class="block-head">
      <div>
        <h2 class="block-title">Şikayətlər <em v-if="total">{{ total }}</em></h2>
        <p class="block-sub">
          Açıq işlər yuxarıdadır. Qərar verərkən izah məcburidir — tərəflər onu görür.
        </p>
      </div>
      <input
        v-model="search"
        class="search-box"
        type="search"
        placeholder="Mövzu, izah, ad və ya saray…"
        @input="onSearchInput"
      />
    </div>

    <div class="filter-row">
      <div class="filter-chips">
        <button
          v-for="s in DISPUTE_STATUS_FILTERS"
          :key="s.value"
          class="chip"
          :class="{ active: statusFilter === s.value }"
          @click="setStatus(s.value)"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <div class="dv-layout">
      <div class="dv-list" v-loading="isLoading">
        <button
          v-for="d in disputes"
          :key="d.id"
          class="dv-row"
          :class="{ active: activeId === d.id }"
          @click="activeId = d.id"
        >
          <div class="dv-top">
            <b>{{ d.subject }}</b>
            <span class="dv-status" :class="statusClass(d.status)">{{ d.statusLabel }}</span>
          </div>

          <span class="dv-meta">
            {{ d.openedByName }} ({{ d.openedByCustomer ? 'müştəri' : 'saray' }})
            <template v-if="d.venueName"> · {{ d.venueName }}</template>
          </span>

          <div class="dv-foot">
            <span class="dv-chip">{{ d.categoryLabel }}</span>
            <span class="dv-chip">{{ d.messageCount }} mesaj</span>
            <span v-if="d.assignedToName" class="dv-chip assigned">{{ d.assignedToName }}</span>
            <span v-else class="dv-chip free">götürülməyib</span>
          </div>
        </button>

        <UiEmpty
          v-if="!isLoading && !disputes.length"
          icon="⚖️"
          title="İş tapılmadı."
          :text="search || statusFilter ? 'Bu şərtlərə uyğun şikayət yoxdur.' : 'Hələ heç bir şikayət açılmayıb.'"
        />

        <Pager :page="page" :page-size="pageSize" :total="total" @change="goPage" />
      </div>

      <DisputeThread :dispute-id="activeId" is-staff @changed="load" />
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { toast } from '@/utils/toast'
import Pager from '@/components/Pager.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import DisputeThread from '@/components/DisputeThread.vue'
import { searchDisputes, statusClass, DISPUTE_STATUS_FILTERS } from '@/services/disputeService'

const disputes = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

const search = ref('')
const statusFilter = ref('')
const isLoading = ref(false)
const activeId = ref(null)

const load = async () => {
  isLoading.value = true
  try {
    const result = await searchDisputes({
      search: search.value.trim() || undefined,
      status: statusFilter.value || undefined,
      page: page.value,
      pageSize,
    })
    disputes.value = result.items
    total.value = result.totalCount
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Şikayətlər yüklənmədi')
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

const setStatus = (value) => {
  statusFilter.value = value
  page.value = 1
  load()
}

const goPage = (value) => {
  page.value = value
  load()
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
  margin-bottom: 14px;
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
  min-width: 260px;
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

.filter-row {
  margin-bottom: 16px;
}

.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--r-pill);
  padding: 5px 14px;
  font-size: 0.77rem;
  color: var(--ink-2);
  cursor: pointer;
  transition: all var(--t-fast);
}

.chip:hover {
  border-color: var(--gold);
}

.chip.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.dv-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 18px;
  align-items: start;
}

.dv-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 620px;
  overflow-y: auto;
  padding-right: 4px;
}

.dv-row {
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  padding: 11px 13px;
  cursor: pointer;
  transition: border-color var(--t-fast), transform var(--t-fast);
}

.dv-row:hover {
  border-color: var(--gold);
  transform: translateY(-1px);
}

.dv-row.active {
  border-color: var(--brand);
  background: var(--brand-soft);
}

.dv-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.dv-top b {
  font-size: 0.85rem;
  color: var(--ink);
  line-height: 1.35;
}

.dv-status {
  border-radius: var(--r-pill);
  padding: 2px 8px;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
}

.dv-status.open {
  background: var(--warn-soft);
  color: var(--warn);
}

.dv-status.review {
  background: var(--info-soft);
  color: var(--info);
}

.dv-status.resolved {
  background: var(--ok-soft);
  color: var(--ok);
}

.dv-status.closed {
  background: var(--line);
  color: var(--muted);
}

.dv-meta {
  display: block;
  font-size: 0.74rem;
  color: var(--muted);
  margin-top: 3px;
}

.dv-foot {
  display: flex;
  gap: 5px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.dv-chip {
  background: var(--line);
  color: var(--ink-2);
  border-radius: var(--r-pill);
  padding: 2px 8px;
  font-size: 0.66rem;
}

/* Götürülməmiş iş gözə dəyməlidir — növbənin mənası budur */
.dv-chip.free {
  background: var(--warn-soft);
  color: var(--warn);
}

.dv-chip.assigned {
  background: var(--info-soft);
  color: var(--info);
}

@media (max-width: 900px) {
  .dv-layout {
    grid-template-columns: 1fr;
  }

  .dv-list {
    max-height: 320px;
  }
}
</style>
