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
          Saray süzgəci ✕
        </button>
      </div>

      <ul v-if="rows.length" class="res-list">
        <li v-for="r in rows" :key="r.id" class="res-item" :class="{ past: r.isPast }">
          <div class="res-head">
            <span class="status-badge" :class="statusClass(r.status)">{{ r.statusLabel }}</span>
            <b class="venue">{{ r.venueName }}</b>
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
          </div>

          <p v-if="r.note" class="note">“{{ r.note }}”</p>

          <div class="res-actions">
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
          </div>
        </li>
      </ul>
      <p v-else class="empty">Bu şərtlərə uyğun rezerv tapılmadı.</p>

      <div v-if="total > filters.pageSize" class="pager">
        <button class="mini-btn" :disabled="filters.page === 1" @click="goPage(filters.page - 1)">
          Əvvəlki
        </button>
        <span class="pager-info">{{ filters.page }} / {{ lastPage }}</span>
        <button class="mini-btn" :disabled="filters.page >= lastPage" @click="goPage(filters.page + 1)">
          Sonrakı
        </button>
      </div>
    </section>

    <p class="note-line">
      Statusu dəyişəndə zalın təqvimi də yenilənir və müştəriyə bildiriş gedir —
      sahibin özü dəyişəndə olduğu kimi.
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getReservationStats,
  searchReservations,
  updateReservationStatus,
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

// Admin sahibin yerinə qərar verir — səhvən basmamaq üçün təsdiq istəyirik
const changeStatus = async (reservation, status) => {
  const labels = { 0: 'gözləməyə qaytarmaq', 1: 'təsdiqləmək', 2: 'rədd etmək' }

  try {
    await ElMessageBox.confirm(
      `«${reservation.venueName}» üçün ${formatDate(reservation.eventDate)} tarixli rezervi ` +
        `${labels[status]} istəyirsiniz? Müştəriyə bildiriş gedəcək.`,
      'Statusu dəyiş',
      { confirmButtonText: 'Bəli', cancelButtonText: 'İmtina', type: 'warning' },
    )
  } catch {
    return
  }

  const result = await updateReservationStatus(reservation.id, status)
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  await refresh()
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
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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
  background: linear-gradient(135deg, #721438, #4a0d24);
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
  color: #6c757d;
}

.stat-sub {
  font-size: 0.72rem;
  color: #a6969c;
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
  color: #1a1118;
}

.block-head .block-title {
  margin: 0;
}

.block-title em {
  font-style: normal;
  background: #f6e9ee;
  color: #721438;
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
  background: #f6e9ee;
  color: #721438;
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
  color: #1a1118;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-name:hover {
  color: #721438;
  text-decoration: underline;
}

.rank-value {
  color: #868e96;
  font-size: 0.75rem;
  white-space: nowrap;
}

/* Süzgəclər */
.search-box,
.select {
  border: 1px solid #f0eaec;
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.82rem;
  color: #1a1118;
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
  border-color: #dfb15b;
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

.chip {
  background: #fff;
  border: 1px solid #f0eaec;
  color: #6c757d;
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: #dfb15b;
}

.chip.active {
  background: #721438;
  border-color: #721438;
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
  border: 1px solid #f4eff1;
  border-radius: 12px;
  padding: 14px 16px;
}

.res-item.past {
  background: #fbf9fa;
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
  color: #1a1118;
}

.hall {
  font-size: 0.76rem;
  color: #721438;
  background: #f6e9ee;
  padding: 2px 9px;
  border-radius: 20px;
}

.spacer {
  flex: 1;
}

.event-date {
  font-size: 0.82rem;
  font-weight: 600;
  color: #4a3f44;
}

.past-tag {
  font-size: 0.7rem;
  color: #a6969c;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: #f1f3f5;
  color: #6c757d;
}

.status-badge.pending {
  background: #fdf0e3;
  color: #b06a2b;
}

.status-badge.confirmed {
  background: #e6f4ea;
  color: #217a41;
}

.status-badge.rejected {
  background: #f8e3e8;
  color: #a02c4a;
}

.status-badge.cancelled {
  background: #f1f3f5;
  color: #6c757d;
}

.res-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  color: #b8a3ab;
}

.val {
  font-size: 0.85rem;
  color: #1a1118;
  font-weight: 600;
}

.sub {
  font-size: 0.76rem;
  color: #868e96;
}

.note {
  margin: 12px 0 0;
  font-size: 0.82rem;
  color: #4a3f44;
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
  border: 1px solid #ece5e8;
  color: #4a3f44;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.mini-btn:hover:not(:disabled) {
  border-color: #dfb15b;
}

.mini-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mini-btn.danger {
  color: #a02c4a;
  border-color: #f3dbe1;
}

.mini-btn.ok {
  color: #217a41;
  border-color: #d7ecdf;
}

.empty {
  color: #a6969c;
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
  color: #868e96;
}

.note-line {
  margin: 0;
  font-size: 0.76rem;
  color: #a6969c;
  text-align: center;
  line-height: 1.5;
}
</style>
