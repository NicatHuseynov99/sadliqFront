<template>
  <div class="reservations" v-loading="isLoading">
    <!-- Ümumi mənzərə -->
    <div class="stat-row">
      <div class="stat-card dark">
        <span class="stat-value">{{ stats.total ?? 0 }}</span>
        <span class="stat-label">Rezerv sorğusu</span>
        <span class="stat-sub">bütün saraylar</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.pending ?? 0 }}</span>
        <span class="stat-label">Cavabsız</span>
        <span class="stat-sub">
          <template v-if="stats.stalePending">{{ stats.stalePending }}-i 3 gündən çoxdur</template>
          <template v-else>gecikən yoxdur</template>
        </span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.upcoming ?? 0 }}</span>
        <span class="stat-label">Gələcək tədbir</span>
        <span class="stat-sub">təsdiqlənmiş</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ confirmRate }}%</span>
        <span class="stat-label">Təsdiq nisbəti</span>
        <span class="stat-sub">{{ stats.confirmed ?? 0 }} təsdiq · {{ stats.rejected ?? 0 }} rədd</span>
      </div>
    </div>

    <!-- Ən yüklü saraylar -->
    <section class="block" v-if="stats.topVenues?.length">
      <h3 class="block-title">Ən çox sorğu alan saraylar</h3>
      <ol class="rank-list">
        <li v-for="(v, i) in stats.topVenues" :key="v.venueId">
          <span class="rank">{{ i + 1 }}</span>
          <button class="rank-name" @click="filterByVenue(v.venueId)">{{ v.name }}</button>
          <span class="rank-value">
            {{ v.total }} sorğu<template v-if="v.pending"> · {{ v.pending }} cavabsız</template>
          </span>
        </li>
      </ol>
    </section>

    <!-- Siyahı -->
    <section class="block">
      <div class="block-head">
        <h3 class="block-title">Rezervlər <em>{{ total }}</em></h3>
        <input
          v-model="filters.q"
          class="search-box"
          type="search"
          placeholder="Müştəri, telefon və ya saray üzrə axtar…"
          @input="onSearchInput"
        />
      </div>

      <div class="filter-row">
        <div class="filter-chips">
          <button
            v-for="s in STATUS_FILTERS"
            :key="s.value"
            class="chip"
            :class="{ active: filters.status === s.value }"
            @click="setStatus(s.value)"
          >
            {{ s.label }}
          </button>
        </div>
        <select v-model="filters.period" class="select" @change="reload">
          <option value="">Bütün tarixlər</option>
          <option value="upcoming">Gələcək tədbirlər</option>
          <option value="past">Keçmiş tədbirlər</option>
        </select>
        <input v-model="filters.from" type="date" class="select" @change="reload" />
        <input v-model="filters.to" type="date" class="select" @change="reload" />
        <button v-if="filters.venueId" class="chip active" @click="filterByVenue(null)">
          Saray süzgəci <IcoX class="ico" />
        </button>
      </div>

      <ul v-if="rows.length" class="res-list">
        <li v-for="r in rows" :key="r.id" class="res-item" :class="{ past: r.isPast, removed: r.isDeleted }">
          <img class="venue-cover" :src="r.venueImageUrl || FALLBACK_IMAGE" :alt="r.venueName" @error="onImgError" />

          <div class="res-content">
          <div class="res-head">
            <span v-if="r.isDeleted" class="status-badge removed-badge">Silinib</span>
            <span v-else class="status-badge" :class="statusClass(r.status)">{{ r.statusLabel }}</span>
            <b class="venue">{{ r.venueName }}</b>
            <span v-if="r.city" class="city">{{ r.city }}</span>
            <span class="hall">{{ r.hallName }}</span>
            <span class="spacer"></span>
            <span class="event-date">{{ formatDate(r.eventDate) }}</span>
            <span v-if="r.isPast" class="past-tag">keçib</span>
          </div>

          <div class="res-body">
            <div class="res-col">
              <span class="key">Müştəri</span>
              <span class="val">{{ r.customerName }}</span>
              <span class="sub">{{ r.contactPhone }}</span>
            </div>
            <div class="res-col">
              <span class="key">Qonaq</span>
              <span class="val">{{ r.guestCount }} nəfər</span>
              <span class="sub">{{ r.menuName }}</span>
            </div>
            <div class="res-col">
              <span class="key">Sorğu tarixi</span>
              <span class="val">{{ formatDate(r.createdAt) }}</span>
              <span class="sub" v-if="r.customerEmail">{{ r.customerEmail }}</span>
            </div>

            <!-- Saray tərəfdən kim açıb. Bizim baxışımız buraya düşmür. -->
            <div class="res-col">
              <span class="key">Saray tərəfdən baxan</span>
              <span class="val" :class="{ dim: !r.seenByName }">
                {{ r.seenByName ?? 'Hələ baxılmayıb' }}
              </span>
              <span class="sub" v-if="r.seenAt">
                {{ r.seenByRole }} · {{ formatDate(r.seenAt) }}
              </span>
            </div>
          </div>

          <p v-if="r.note" class="note">“{{ r.note }}”</p>

          <div v-if="r.isDeleted" class="res-actions">
            <button class="mini-btn ok" @click="restore(r)">Geri qaytar</button>
            <a class="mini-btn link" :href="`/venue/${r.venueId}`" target="_blank">Saraya bax</a>
          </div>
          <div v-else class="res-actions">
            <button
              v-if="r.status !== RESERVATION_STATUS.confirmed"
              class="mini-btn ok"
              @click="changeStatus(r, RESERVATION_STATUS.confirmed)"
            >
              Təsdiqlə
            </button>
            <button
              v-if="r.status !== RESERVATION_STATUS.rejected"
              class="mini-btn danger"
              @click="changeStatus(r, RESERVATION_STATUS.rejected)"
            >
              Rədd et
            </button>
            <button
              v-if="r.status !== RESERVATION_STATUS.pending"
              class="mini-btn"
              @click="changeStatus(r, RESERVATION_STATUS.pending)"
            >
              Gözləməyə qaytar
            </button>
            <a class="mini-btn link" :href="`/venue/${r.venueId}`" target="_blank">Saraya bax</a>
          </div>
          </div>
        </li>
      </ul>
      <UiEmpty v-else icon="🔍" title="Bu şərtlərə uyğun rezerv tapılmadı." />

      <Pager :page="filters.page" :page-size="filters.pageSize" :total="total" @change="goPage" />
    </section>

    <p class="note-line">
      Statusu dəyişəndə zalın təqvimi də yenilənir və müştəriyə bildiriş gedir —
      sahibin özü dəyişəndə olduğu kimi.
    </p>

    <!-- Admin müdaxiləsi izahsız qalmamalıdır -->
    <ReasonDialog
      v-if="statusTarget"
      caption="Admin müdaxiləsi"
      title="Statusu dəyiş"
      :text="statusDialogText"
      label="Müdaxilənin səbəbi"
      placeholder="Nəyə görə sahibin yerinə qərar verirsiniz?"
      confirm-text="Bəli, dəyiş"
      tone="danger"
      :is-sending="isChangingStatus"
      @close="statusTarget = null"
      @submit="submitStatusChange"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Pager from '@/components/Pager.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import ReasonDialog from '@/components/ReasonDialog.vue'
import { toast } from '@/utils/toast'
import { FALLBACK_IMAGE, onImgError } from '@/utils/imageFallback'
import {
  getReservationStats,
  searchReservations,
  updateReservationStatus,
  restoreReservation,
  STATUS_FILTERS,
  RESERVATION_STATUS,
  statusClass,
} from '@/services/adminReservationService'

const isLoading = ref(false)
const stats = ref({})
const rows = ref([])
const total = ref(0)

const filters = reactive({
  q: '',
  status: 'Pending',
  period: '',
  from: '',
  to: '',
  venueId: null,
  page: 1,
  pageSize: 20,
})

const lastPage = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)))

// Cavablanmış sorğuların neçə faizi təsdiqlənib
const confirmRate = computed(() => {
  const answered = (stats.value.confirmed ?? 0) + (stats.value.rejected ?? 0)
  if (!answered) return 0
  return Math.round(((stats.value.confirmed ?? 0) / answered) * 100)
})

const formatDate = (value) => {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const loadStats = async () => {
  stats.value = await getReservationStats()
}

const loadRows = async () => {
  const result = await searchReservations({
    q: filters.q || undefined,
    status: filters.status || undefined,
    period: filters.period || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    venueId: filters.venueId || undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  })
  rows.value = result.items
  total.value = result.totalCount
}

const refresh = async () => {
  isLoading.value = true
  try {
    await Promise.all([loadStats(), loadRows()])
  } finally {
    isLoading.value = false
  }
}

const reload = async () => {
  filters.page = 1
  isLoading.value = true
  try {
    await loadRows()
  } finally {
    isLoading.value = false
  }
}

const goPage = async (page) => {
  filters.page = page
  isLoading.value = true
  try {
    await loadRows()
  } finally {
    isLoading.value = false
  }
}

const setStatus = (value) => {
  filters.status = value
  reload()
}

const filterByVenue = (venueId) => {
  filters.venueId = venueId
  filters.status = ''
  reload()
}

// Hər hərfdə sorğu getməsin deyə yazmaq bitəndən sonra axtarırıq
let searchTimer = null
const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(reload, 350)
}

// Silinmiş rezervi geri qaytarır
const restore = async (reservation) => {
  const result = await restoreReservation(reservation.id)
  if (!result.success) return toast.error(result.message)

  toast.success(result.message)
  await refresh()
}

// Admin sahibin yerinə qərar verir — səhvən basmamaq üçün təsdiq istəyirik
// Admin sahibin yerinə qərar verir — kənardan edilən müdaxilə izahsız
// qalmamalıdır, ona görə səbəb məcburidir və jurnala düşür.
const STATUS_LABELS = { 0: 'gözləməyə qaytarmaq', 1: 'təsdiqləmək', 2: 'rədd etmək' }

// Admin sahibin yerinə qərar verir — səbəb məcburidir və jurnala düşür
const statusTarget = ref(null)
const isChangingStatus = ref(false)

const changeStatus = (reservation, status) => {
  statusTarget.value = { reservation, status }
}

const statusDialogText = computed(() => {
  if (!statusTarget.value) return ''

  const { reservation, status } = statusTarget.value
  return (
    `«${reservation.venueName}» üçün ${formatDate(reservation.eventDate)} tarixli rezervi ` +
    `${STATUS_LABELS[status]} istəyirsiniz? Müştəriyə bildiriş gedəcək.`
  )
})

const submitStatusChange = async (reason) => {
  const { reservation, status } = statusTarget.value

  isChangingStatus.value = true
  try {
    const result = await updateReservationStatus(reservation.id, status, reason)
    if (!result.success) return toast.error(result.message)

    toast.success(result.message)
    statusTarget.value = null
    await refresh()
  } finally {
    isChangingStatus.value = false
  }
}

onMounted(refresh)
</script>

<style scoped>
.reservations {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Göstəricilər */
.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
  gap: 14px;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 1px 3px rgba(26, 17, 24, 0.06);
}

.stat-card.dark {
  background: linear-gradient(135deg, var(--brand), #4a0d24);
  color: #fff;
}

.stat-card.dark .stat-label,
.stat-card.dark .stat-sub {
  color: rgba(255, 255, 255, 0.75);
}

.stat-value {
  font-size: 1.7rem;
  font-weight: 700;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
}

.stat-sub {
  font-size: 0.72rem;
  color: var(--muted-2);
}

/* Blok */
.block {
  background: #fff;
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(26, 17, 24, 0.06);
}

.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.block-title {
  margin: 0 0 14px;
  font-size: 1rem;
  color: var(--ink);
}

.block-head .block-title {
  margin: 0;
}

.block-title em {
  font-style: normal;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.78rem;
  padding: 2px 9px;
  border-radius: 20px;
  margin-left: 6px;
}

/* Reytinq siyahısı */
.rank-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
}

.rank {
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 7px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.72rem;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.rank-name {
  flex: 1;
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  color: var(--ink);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-name:hover {
  color: var(--brand);
  text-decoration: underline;
}

.rank-value {
  color: var(--muted);
  font-size: 0.75rem;
  white-space: nowrap;
}

/* Süzgəclər */
.search-box,
.select {
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.82rem;
  color: var(--ink);
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.search-box {
  flex: 1;
  min-width: 220px;
  max-width: 340px;
}

.search-box:focus,
.select:focus {
  border-color: var(--gold);
}

.filter-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 16px;
}

.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 8 status çipi (Hamısı/Gözləyir/Təsdiqlənib/Rədd edilib/Ləğv edilib/
   Vaxtı keçib/Təklif göndərilib/Silinmiş) telefonda wrap ilə 3 sətrə
   qədər qırılırdı. Panelin qalan lentləri ilə eyni qayda: bir sətir,
   üfüqi sürüşür. */
@media (max-width: 640px) {
  .filter-chips {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 2px;
    mask-image: linear-gradient(to right, #000 calc(100% - 22px), transparent);
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 22px), transparent);
  }

  .filter-chips::-webkit-scrollbar {
    display: none;
  }

  .filter-chips .chip {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}

.chip {
  background: #fff;
  border: 1px solid var(--line-2);
  color: var(--muted);
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: var(--gold);
}

.chip.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

/* Rezerv kartları */
.res-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.res-item {
  display: flex;
  gap: 16px;
  border: 1px solid #f4eff1;
  border-radius: 14px;
  padding: 14px 16px;
  transition: box-shadow 0.15s, transform 0.15s;
}

.res-item:hover {
  box-shadow: 0 8px 22px rgba(26, 17, 24, 0.07);
  transform: translateY(-1px);
}

.res-item.past {
  background: #fbf9fa;
}

.res-item.past .venue-cover {
  filter: grayscale(0.6);
}

/* Silinmiş rezerv sönük göstərilir, amma məlumatı oxunaqlı qalır */
.res-item.removed {
  background: #fbf8f9;
  border-color: #f0e0e4;
}

.res-item.removed .venue-cover {
  filter: grayscale(1);
  opacity: 0.6;
}

.status-badge.removed-badge {
  background: #f8e3e8;
  color: var(--accent);
}

/* Sarayın şəkli — sətri bir baxışda tanımaq üçün */
.venue-cover {
  width: 132px;
  height: 100px;
  flex: none;
  object-fit: cover;
  border-radius: 12px;
  background: #f6f1f3;
}

.res-content {
  flex: 1;
  min-width: 0;
}

.city {
  font-size: 0.74rem;
  color: var(--muted);
  background: #f6f1f3;
  padding: 2px 9px;
  border-radius: 20px;
}

.mini-btn.link {
  color: #1c5cab;
  border-color: #dce8f7;
  text-decoration: none;
  display: inline-block;
}

@media (max-width: 640px) {
  .res-item {
    flex-direction: column;
  }

  .venue-cover {
    width: 100%;
    height: 130px;
  }
}

.res-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.venue {
  font-size: 0.9rem;
  color: var(--ink);
}

.hall {
  font-size: 0.76rem;
  color: var(--brand);
  background: var(--brand-soft);
  padding: 2px 9px;
  border-radius: 20px;
}

.spacer {
  flex: 1;
}

.event-date {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-2);
}

.past-tag {
  font-size: 0.7rem;
  color: var(--muted-2);
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--surface-2);
  color: var(--muted);
}

.status-badge.pending {
  background: #fdf0e3;
  color: var(--warn);
}

.status-badge.confirmed {
  background: #e6f4ea;
  color: var(--ok);
}

.status-badge.rejected {
  background: #f8e3e8;
  color: var(--accent);
}

.status-badge.cancelled {
  background: var(--surface-2);
  color: var(--muted);
}

.status-badge.expired {
  background: #f4efe6;
  color: #8a6d3b;
}

.status-badge.offered {
  background: #eaf1fa;
  color: var(--info);
}

.res-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 12px;
}

.res-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.key {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-2);
}

.val {
  font-size: 0.85rem;
  color: var(--ink);
  font-weight: 600;
}

.val.dim {
  color: #b0a2a8;
  font-weight: 500;
}

.sub {
  font-size: 0.76rem;
  color: var(--muted);
}

.note {
  margin: 12px 0 0;
  font-size: 0.82rem;
  color: var(--ink-2);
  font-style: italic;
}

.res-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

/* Düymələr */
.mini-btn {
  background: #fff;
  border: 1px solid var(--line);
  color: var(--ink-2);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.mini-btn:hover:not(:disabled) {
  border-color: var(--gold);
}

.mini-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mini-btn.danger {
  color: var(--accent);
  border-color: #f3dbe1;
}

.mini-btn.ok {
  color: var(--ok);
  border-color: #d7ecdf;
}

.empty {
  color: var(--muted-2);
  font-size: 0.83rem;
  text-align: center;
  padding: 22px 10px;
  margin: 0;
}

/* Səhifələmə */
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 14px;
}

.pager-info {
  font-size: 0.8rem;
  color: var(--muted);
}

.note-line {
  margin: 0;
  font-size: 0.76rem;
  color: var(--muted-2);
  text-align: center;
  line-height: 1.5;
}
</style>
