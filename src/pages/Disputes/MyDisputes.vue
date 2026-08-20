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

      <!-- Telefonda siyahı və yazışma eyni ekranda üst-üstə görünürdü —
           bir işlə belə başlıq iki dəfə təkrarlanırdı, bir neçəsi olanda
           isə yazışmaya çatmaq üçün bütün siyahını keçmək lazım gəlirdi.
           Bu enlərdə ikisi ayrı ekran kimi davranır: seçim siyahını
           gizlədir, «Bütün işlər» geri qaytarır. Masaüstündə hər ikisi
           həmişə yan-yana görünür (CSS-də media sorğusu ilə). -->
      <div v-else class="dis-layout" :class="{ 'list-open': showListMobile }">
        <!-- İşlərin siyahısı -->
        <div class="dis-list">
          <button
            v-for="d in disputes"
            :key="d.id"
            class="dis-row"
            :class="{ active: activeId === d.id }"
            @click="activeId = d.id; showListMobile = false"
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
        <div class="dis-thread-wrap">
          <button class="back-to-list" @click="showListMobile = true">← Bütün işlər</button>
          <DisputeThread :dispute-id="activeId" @changed="load" />
        </div>
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

// Telefonda siyahı ilə yazışma ayrı ekran kimi davranır — hansının
// göründüyünü bu idarə edir. Masaüstündə CSS ikisini də göstərir.
const showListMobile = ref(true)

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

.back-to-list {
  display: none;
}

@media (max-width: 900px) {
  .dis-page {
    padding: 22px 14px 50px;
  }

  .dis-layout {
    grid-template-columns: 1fr;
  }

  /* Bir ekranda ya siyahı, ya yazışma — ikisi birdən yox.
     Siyahı açıq olanda yazışma tərəfi tam gizlənir və əksinə. */
  .dis-layout.list-open .dis-thread-wrap {
    display: none;
  }

  .dis-layout:not(.list-open) .dis-list {
    display: none;
  }

  .dis-list {
    max-height: none;
  }

  .back-to-list {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: var(--brand);
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
    padding: 9px 2px;
    margin: -9px -2px 10px;
  }
}
</style>
