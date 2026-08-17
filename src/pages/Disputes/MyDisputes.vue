<template>
  <!-- İstifadəçinin şikayətləri: həm açdıqları, həm tərəfi olduqları.
       Saray sahibi burada həm öz şikayətlərini, həm sarayı barədə
       açılanları görür — özünü müdafiə edə bilməlidir. -->
  <div class="dis-page" v-loading="isLoading">
    <div class="dis-inner">
      <header class="page-head">
        <div>
          <h1 class="page-title">Şikayətlərim</h1>
          <p class="page-sub">
            Açdığınız və sizə aid olan işlər. Qərarı platformanın dəstək xidməti verir.
          </p>
        </div>
      </header>

      <UiEmpty
        v-if="!isLoading && !disputes.length"
        icon="⚖️"
        title="Şikayətiniz yoxdur."
        text="Rezervlə bağlı problem yaranarsa, rezervin yanındakı «Şikayət et» düyməsindən istifadə edin."
      >
        <UiButton to="/my-reservations">Rezervlərimə bax</UiButton>
      </UiEmpty>

      <div v-else class="dis-layout">
        <!-- İşlərin siyahısı -->
        <div class="dis-list">
          <button
            v-for="d in disputes"
            :key="d.id"
            class="dis-row"
            :class="{ active: activeId === d.id }"
            @click="activeId = d.id"
          >
            <div class="dr-top">
              <b>{{ d.subject }}</b>
              <span class="dr-status" :class="statusClass(d.status)">{{ d.statusLabel }}</span>
            </div>

            <span class="dr-meta">
              {{ d.categoryLabel }}
              <template v-if="d.venueName"> · {{ d.venueName }}</template>
            </span>

            <span class="dr-foot">
              {{ d.messageCount }} mesaj · {{ shortDate(d.lastMessageAt ?? d.createdAt) }}
            </span>
          </button>
        </div>

        <!-- Seçilmiş işin yazışması -->
        <DisputeThread :dispute-id="activeId" @changed="load" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { toast } from '@/utils/toast'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiButton from '@/components/ui/UiButton.vue'
import DisputeThread from '@/components/DisputeThread.vue'
import { getMyDisputes, statusClass } from '@/services/disputeService'

const disputes = ref([])
const isLoading = ref(false)
const activeId = ref(null)

const load = async () => {
  isLoading.value = true
  try {
    disputes.value = await getMyDisputes()

    // İlk açılışda ən son iş seçilir
    if (!activeId.value && disputes.value.length) activeId.value = disputes.value[0].id
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Şikayətlər yüklənmədi')
  } finally {
    isLoading.value = false
  }
}

const shortDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

onMounted(load)
</script>

<style scoped>
.dis-page {
  min-height: calc(100vh - 61px);
  background: var(--bg);
  padding: 30px 40px 60px;
  font-family: var(--font);
}

.dis-inner {
  max-width: var(--page-w);
  margin: 0 auto;
}

.page-head {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 4px;
  color: var(--ink);
  font-size: 1.7rem;
}

.page-sub {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.dis-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;
  align-items: start;
}

.dis-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 620px;
  overflow-y: auto;
  padding-right: 4px;
}

.dis-row {
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  padding: 11px 13px;
  cursor: pointer;
  transition: border-color var(--t-fast), transform var(--t-fast);
}

.dis-row:hover {
  border-color: var(--gold);
  transform: translateY(-1px);
}

.dis-row.active {
  border-color: var(--brand);
  background: var(--brand-soft);
}

.dr-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.dr-top b {
  font-size: 0.85rem;
  color: var(--ink);
  line-height: 1.35;
}

.dr-status {
  border-radius: var(--r-pill);
  padding: 2px 8px;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
}

.dr-status.open {
  background: var(--warn-soft);
  color: var(--warn);
}

.dr-status.review {
  background: var(--info-soft);
  color: var(--info);
}

.dr-status.resolved {
  background: var(--ok-soft);
  color: var(--ok);
}

.dr-status.closed {
  background: var(--line);
  color: var(--muted);
}

.dr-meta {
  display: block;
  font-size: 0.74rem;
  color: var(--muted);
  margin-top: 3px;
}

.dr-foot {
  display: block;
  font-size: 0.68rem;
  color: var(--muted-2);
  margin-top: 6px;
}

@media (max-width: 900px) {
  .dis-page {
    padding: 22px 14px 50px;
  }

  .dis-layout {
    grid-template-columns: 1fr;
  }

  .dis-list {
    max-height: 300px;
  }
}
</style>
