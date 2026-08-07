<template>
  <div class="res-page" v-loading="isLoading">
    <div class="res-inner">
      <header class="page-head">
        <div>
          <h1 class="page-title">Rezervlərim</h1>
          <p class="page-sub">Göndərdiyiniz rezerv sorğuları və onların vəziyyəti</p>
        </div>
        <router-link to="/" class="new-link">+ Yeni rezerv</router-link>
      </header>

      <!-- Yaxınlaşan təsdiqlənmiş tədbir: kabinet -->
      <WeddingBoard v-if="upcoming" :reservation="upcoming" />

      <!-- Statuslara görə xülasə -->
      <div class="summary" v-if="reservations.length">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="summary-card"
          :class="[tab.key, { active: activeTab === tab.value }]"
          @click="activeTab = tab.value"
        >
          <span class="summary-count">{{ counts[tab.value] ?? 0 }}</span>
          <span class="summary-label">{{ tab.label }}</span>
        </button>
      </div>

      <div v-if="!isLoading && visible.length === 0" class="no-result">
        <div class="empty-icon">🗓️</div>
        <h3>{{ reservations.length ? 'Bu bölmədə rezerv yoxdur.' : 'Hələ heç bir rezerviniz yoxdur.' }}</h3>
        <p>Ana səhifədən saray seçib rezerv sorğusu göndərə bilərsiniz.</p>
        <UiButton to="/">Saraylara bax</UiButton>
      </div>

      <div v-else class="res-list">
        <article v-for="r in visible" :key="r.id" class="res-card" :class="statusClass(r.status)">
          <div class="res-thumb">
            <img :src="r.venueImage" :alt="r.venueName" @error="onImgError" />
          </div>

          <div class="res-main">
            <div class="res-title-row">
              <div>
                <h3>{{ r.venueName }}</h3>
                <span class="res-city" v-if="r.venueCity">📍 {{ r.venueCity }}</span>
              </div>
              <span class="status-tag" :class="statusClass(r.status)">
                {{ statusIcon(r.status) }} {{ statusText(r.status) }}
              </span>
            </div>

            <div class="res-facts">
              <div class="fact">
                <span class="fact-label">Tarix</span>
                <b>{{ formatDateFull(r.eventDate) }}</b>
                <em v-if="daysLeft(r) !== null" class="fact-extra">{{ daysLeftText(r) }}</em>
              </div>
              <div class="fact">
                <span class="fact-label">Zal</span>
                <b>{{ r.hallName }}</b>
                <em class="fact-extra">{{ r.guestCount }} qonaq</em>
              </div>
              <div class="fact">
                <span class="fact-label">Menyu</span>
                <b>{{ r.menuName }}</b>
                <em class="fact-extra">{{ r.pricePerPerson }} ₼ / nəfər</em>
              </div>
              <div class="fact fact-total">
                <span class="fact-label">Ümumi məbləğ</span>
                <b>{{ (r.pricePerPerson * r.guestCount).toLocaleString() }} ₼</b>
              </div>
            </div>

            <p class="res-note" v-if="r.note">💬 {{ r.note }}</p>

            <!-- Sahibin göndərdiyi əks-təklif -->
            <div v-if="r.counterOffer" class="offer-box">
              <b>Saray başqa şərt təklif edir</b>
              <ul class="offer-list">
                <li v-if="r.counterOffer.eventDate">
                  Tarix: <s>{{ formatDateFull(r.eventDate) }}</s>
                  → <b>{{ formatDateFull(r.counterOffer.eventDate) }}</b>
                </li>
                <li v-if="r.counterOffer.hall?.name">
                  Zal: <s>{{ r.hallName }}</s> → <b>{{ r.counterOffer.hall.name }}</b>
                </li>
                <li v-if="r.counterOffer.menu?.name">
                  Menyu: <s>{{ r.menuName }}</s> → <b>{{ r.counterOffer.menu.name }}</b>
                </li>
                <li v-if="r.counterOffer.pricePerPerson">
                  Razılaşdırılmış qiymət: <b>{{ r.counterOffer.pricePerPerson }} ₼ / nəfər</b>
                </li>
              </ul>

              <p class="offer-message">{{ r.counterOffer.message }}</p>

              <div class="offer-actions">
                <el-popconfirm
                  title="Təklif rədd edilsin? Sorğu bağlanacaq."
                  confirm-button-text="Bəli, rədd et"
                  cancel-button-text="Xeyr"
                  @confirm="declineOffer(r)"
                >
                  <template #reference>
                    <button class="cancel-btn">Rədd et</button>
                  </template>
                </el-popconfirm>
                <button class="accept-btn" @click="acceptOffer(r)">Qəbul edirəm</button>
              </div>
            </div>

            <footer class="res-foot">
              <span class="res-contact">📞 {{ r.contactPhone }}</span>

              <!-- Şəffaflıq: sorğunun sahib tərəfindən açılıb-açılmadığı
                   və cavaba nə qədər vaxt qaldığı -->
              <span v-if="r.status === 0" class="seen-tag" :class="{ seen: r.seenAt }">
                {{ r.seenAt ? '👁 Saray baxıb' : '⏳ Hələ baxılmayıb' }}
              </span>

              <span v-if="holdLeft(r)" class="hold-tag">⏱ Cavaba {{ holdLeft(r) }} qalıb</span>

              <el-popconfirm
                v-if="r.status === 0 || r.status === 1"
                title="Rezervi ləğv etmək istədiyinizə əminsiniz?"
                confirm-button-text="Bəli, ləğv et"
                cancel-button-text="Xeyr"
                @confirm="cancel(r)"
              >
                <template #reference>
                  <button class="cancel-btn">Ləğv et</button>
                </template>
              </el-popconfirm>
            </footer>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElNotification } from 'element-plus'
import {
  acceptCounterOffer,
  cancelReservation,
  declineCounterOffer,
  getMyReservations,
} from '@/services/reservationService'
import { formatDateFull } from '@/utils/date'
import WeddingBoard from '@/components/WeddingBoard.vue'
import UiButton from '@/components/ui/UiButton.vue'

const reservations = ref([])
const isLoading = ref(false)
const activeTab = ref('all')

const tabs = [
  { value: 'all', label: 'Hamısı', key: 'all' },
  { value: 0, label: 'Gözləyir', key: 'pending' },
  { value: 1, label: 'Təsdiqlənib', key: 'confirmed' },
  { value: 2, label: 'Rədd edilib', key: 'rejected' },
  { value: 5, label: 'Təklif gəldi', key: 'offered' },
  { value: 3, label: 'Ləğv edilib', key: 'cancelled' },
]

// Müştərinin öz rezervlərini yükləyir
const load = async () => {
  isLoading.value = true
  try {
    reservations.value = await getMyReservations()
  } finally {
    isLoading.value = false
  }
}

// Ən yaxın təsdiqlənmiş tədbir — kabinetdə göstərilir
const upcoming = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    reservations.value
      .filter((r) => r.status === 1 && new Date(r.eventDate) >= today)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))[0] ?? null
  )
})

// Hər status üçün rezerv sayı (xülasə kartlarında göstərilir)
const counts = computed(() => {
  const result = { all: reservations.value.length }
  for (const r of reservations.value) result[r.status] = (result[r.status] ?? 0) + 1
  return result
})

const visible = computed(() =>
  activeTab.value === 'all'
    ? reservations.value
    : reservations.value.filter((r) => r.status === activeTab.value),
)

// Backend ReservationStatus enum-una uyğun status mətnləri
const statusText = (s) =>
  ({
    0: 'Gözləyir',
    1: 'Təsdiqlənib',
    2: 'Rədd edilib',
    3: 'Ləğv edilib',
    4: 'Vaxtı keçib',
    5: 'Təklif gəldi',
  })[s] ?? '—'

const statusClass = (s) =>
  ({ 0: 'pending', 1: 'confirmed', 2: 'rejected', 3: 'cancelled', 4: 'expired', 5: 'offered' })[s] ?? ''

const statusIcon = (s) => ({ 0: '⏳', 1: '✅', 2: '✕', 3: '🚫', 4: '⌛', 5: '🔁' })[s] ?? ''

// Tədbirə neçə gün qaldığını hesablayır (keçmiş tarixlərdə null qaytarır)
const daysLeft = (r) => {
  if (r.status === 2 || r.status === 3) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((new Date(r.eventDate) - today) / 86400000)
  return diff < 0 ? null : diff
}

// Tarix nə vaxta qədər tutulub: cavab gəlməsə həmin an boşalır
const holdLeft = (r) => {
  if (!r.holdExpiresAt || (r.status !== 0 && r.status !== 5)) return ''

  const hours = Math.round((new Date(r.holdExpiresAt) - Date.now()) / 3600000)
  if (hours <= 0) return ''

  return hours < 24 ? `${hours} saat` : `${Math.round(hours / 24)} gün`
}

const daysLeftText = (r) => {
  const days = daysLeft(r)
  if (days === 0) return 'bu gün!'
  return `${days} gün qaldı`
}

// Rezervi ləğv edir və siyahını yeniləyir
const cancel = async (r) => {
  try {
    const result = await cancelReservation(r.id)
    ElNotification({ title: 'Uğurlu', message: result.message, type: 'success', zIndex: 99999 })
    await load()
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  }
}

// Sahibin təklifini qəbul etmək və ya rədd etmək
const respondToOffer = async (reservation, action) => {
  try {
    const message = await action(reservation.counterOffer.id)
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
    await load()
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  }
}

const acceptOffer = (r) => respondToOffer(r, acceptCounterOffer)
const declineOffer = (r) => respondToOffer(r, declineCounterOffer)

const onImgError = (e) => {
  e.target.src = 'https://picsum.photos/seed/sadliq/600/400'
}

onMounted(load)
</script>

<style scoped>
.res-page {
  min-height: calc(100vh - 61px);
  background: #f4f6f8;
  padding: 30px 40px 60px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.res-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 22px;
}

.page-title {
  margin: 0 0 4px;
  color: var(--ink);
  font-size: 1.7rem;
}

.page-sub {
  margin: 0;
  color: #6c757d;
  font-size: 0.92rem;
}

.new-link {
  background: var(--brand);
  color: #fff;
  text-decoration: none;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 0.87rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s;
}

.new-link:hover {
  background: var(--brand-dark);
}

/* Status xülasəsi */
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 118px), 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 14px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  transition: all 0.2s;
  border-bottom: 3px solid #eaeaea;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-count {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--ink);
  line-height: 1;
}

.summary-label {
  font-size: 0.76rem;
  color: var(--muted);
  font-weight: 600;
}

.summary-card.active {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.summary-card.all.active { border-bottom-color: var(--brand); }
.summary-card.pending.active { border-bottom-color: #b07d2b; }
.summary-card.confirmed.active { border-bottom-color: #1e7e34; }
.summary-card.rejected.active { border-bottom-color: #c0392b; }
.summary-card.cancelled.active { border-bottom-color: var(--muted); }

/* Rezerv kartları */
.res-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.res-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #eaeaea;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  overflow: hidden;
  border-left: 4px solid #eaeaea;
  transition: transform 0.2s, box-shadow 0.2s;
}

.res-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
}

.res-card.pending { border-left-color: var(--gold); }
.res-card.confirmed { border-left-color: #1e7e34; }
.res-card.rejected { border-left-color: #c0392b; }
.res-card.cancelled { border-left-color: #ced4da; }
.res-card.expired { border-left-color: #d8c39a; }
.res-card.offered { border-left-color: #7ba1d0; }

/* Sahibin əks-təklifi */
.offer-box {
  background: #f4f8fd;
  border: 1px solid #dde8f4;
  border-radius: 11px;
  padding: 12px 15px;
  margin: 10px 0 4px;
}

.offer-box > b {
  display: block;
  font-size: 0.86rem;
  color: var(--info);
  margin-bottom: 7px;
}

.offer-list {
  margin: 0 0 8px;
  padding-left: 17px;
  font-size: 0.8rem;
  color: #4a5b70;
  line-height: 1.75;
}

.offer-list s {
  color: var(--muted-2);
}

.offer-message {
  margin: 0 0 10px;
  font-size: 0.8rem;
  color: #6c757d;
  line-height: 1.55;
  white-space: pre-line;
}

.offer-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.accept-btn {
  background: #1e7e34;
  color: #fff;
  border: none;
  padding: 7px 18px;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
}

.accept-btn:hover {
  background: #17692b;
}

/* «Baxıldı» nişanı */
.seen-tag {
  font-size: 0.74rem;
  color: var(--warn);
  background: var(--warn-soft);
  padding: 3px 10px;
  border-radius: 20px;
  margin-right: auto;
  margin-left: 10px;
}

.hold-tag {
  font-size: 0.74rem;
  color: var(--info);
  background: var(--info-soft);
  padding: 3px 10px;
  border-radius: 20px;
  margin-right: 10px;
}

.seen-tag.seen {
  color: var(--ok);
  background: #f0f8f3;
}

.res-card.cancelled .res-thumb img,
.res-card.rejected .res-thumb img {
  filter: grayscale(0.85);
}

.res-thumb {
  width: 170px;
  flex-shrink: 0;
}

.res-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.res-main {
  flex-grow: 1;
  padding: 16px 20px 14px;
  min-width: 0;
}

.res-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.res-title-row h3 {
  margin: 0 0 2px;
  color: var(--ink);
  font-size: 1.15rem;
}

.res-city {
  font-size: 0.8rem;
  color: #adb5bd;
}

.status-tag {
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.status-tag.pending { background: #fff6e0; color: #b07d2b; }
.status-tag.confirmed { background: #e3f6e8; color: #1e7e34; }
.status-tag.rejected { background: var(--danger-soft); color: #c0392b; }
.status-tag.cancelled { background: #f1f3f5; color: var(--muted); }
.status-tag.offered { background: #eaf1fa; color: var(--info); }
.status-tag.expired { background: #f4efe6; color: #8a6d3b; }

/* Detal sətirləri */
.res-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid #f1f3f5;
  border-bottom: 1px solid #f1f3f5;
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fact-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #adb5bd;
  font-weight: 700;
}

.fact b {
  font-size: 0.92rem;
  color: var(--ink);
  font-weight: 600;
}

.fact-extra {
  font-style: normal;
  font-size: 0.75rem;
  color: var(--muted);
}

.fact-total b {
  color: var(--brand);
  font-size: 1.1rem;
  font-weight: 800;
}

.res-note {
  margin: 12px 0 0;
  font-size: 0.83rem;
  color: var(--muted);
  font-style: italic;
}

.res-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.res-contact {
  font-size: 0.83rem;
  color: #6c757d;
}

.cancel-btn {
  background: #fff;
  color: #c0392b;
  border: 1px solid #e5b4ae;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #c0392b;
  border-color: #c0392b;
  color: #fff;
}

/* Boş vəziyyət */
.no-result {
  text-align: center;
  padding: 54px 20px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 2.6rem;
  margin-bottom: 10px;
}

.no-result h3 {
  color: #333;
  margin: 0 0 8px;
}

.no-result p {
  color: #666;
  margin: 0 0 20px;
}

@media (max-width: 760px) {
  .res-page {
    padding: 22px 14px 50px;
  }

  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .res-foot {
    flex-wrap: wrap;
    gap: 8px;
  }

  .res-card {
    flex-direction: column;
  }
  .res-thumb {
    width: 100%;
    height: 150px;
  }
}
</style>
