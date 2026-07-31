<template>
  <div class="visitors" v-loading="isLoading">
    <!-- Ümumi mənzərə -->
    <div class="stat-row">
      <div class="stat-card dark">
        <span class="stat-value">{{ stats.uniqueVisitors ?? 0 }}</span>
        <span class="stat-label">Ziyarətçi</span>
        <span class="stat-sub">son {{ days }} gün</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.totalViews ?? 0 }}</span>
        <span class="stat-label">Səhifə baxışı</span>
        <span class="stat-sub">son {{ days }} gün</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.guestVisitors ?? 0 }}</span>
        <span class="stat-label">Qeydiyyatsız</span>
        <span class="stat-sub">{{ guestShare }}% ziyarətçilərin</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.todayVisitors ?? 0 }}</span>
        <span class="stat-label">Bu gün</span>
        <span class="stat-sub">{{ stats.todayViews ?? 0 }} baxış</span>
      </div>
    </div>

    <!-- Gündəlik qrafik -->
    <section class="block">
      <div class="block-head">
        <h3 class="block-title">Gündəlik ziyarət</h3>
        <div class="filter-chips">
          <button
            v-for="d in [7, 14, 30]"
            :key="d"
            class="chip"
            :class="{ active: days === d }"
            @click="setDays(d)"
          >
            {{ d }} gün
          </button>
        </div>
      </div>

      <div v-if="maxDaily" class="chart">
        <div v-for="d in stats.daily" :key="d.date" class="bar-col">
          <div class="bar-stack" :title="`${d.visitors} ziyarətçi · ${d.views} baxış`">
            <div class="bar views" :style="{ height: barHeight(d.views) }"></div>
            <div class="bar visitors" :style="{ height: barHeight(d.visitors) }"></div>
          </div>
          <span class="bar-label">{{ shortDay(d.date) }}</span>
        </div>
      </div>
      <p v-else class="empty">Bu dövrdə ziyarət qeyd olunmayıb.</p>

      <div class="legend">
        <span><i class="dot views"></i> Baxış</span>
        <span><i class="dot visitors"></i> Ziyarətçi</span>
      </div>
    </section>

    <div class="two-col">
      <!-- Ən çox baxılan saraylar -->
      <section class="block">
        <h3 class="block-title">Ən çox baxılan saraylar</h3>
        <ol v-if="stats.topVenues?.length" class="rank-list">
          <li v-for="(v, i) in stats.topVenues" :key="v.venueId">
            <span class="rank">{{ i + 1 }}</span>
            <span class="rank-name">{{ v.name }}</span>
            <span class="rank-value">{{ v.views }} baxış · {{ v.visitors }} nəfər</span>
          </li>
        </ol>
        <p v-else class="empty">Hələ məlumat yoxdur.</p>
      </section>

      <!-- Səhifə növləri -->
      <section class="block">
        <h3 class="block-title">Səhifələr üzrə bölgü</h3>
        <ul v-if="stats.topPages?.length" class="share-list">
          <li v-for="p in stats.topPages" :key="p.pageType">
            <div class="share-head">
              <span>{{ p.label }}</span>
              <b>{{ p.views }}</b>
            </div>
            <div class="share-track">
              <div class="share-fill" :style="{ width: pageShare(p.views) }"></div>
            </div>
          </li>
        </ul>
        <p v-else class="empty">Hələ məlumat yoxdur.</p>
      </section>
    </div>

    <!-- Ziyarət siyahısı -->
    <section class="block">
      <div class="block-head">
        <h3 class="block-title">Qeydiyyatsız ziyarətlər <em>{{ total }}</em></h3>
        <input
          v-model="filters.q"
          class="search-box"
          type="search"
          placeholder="IP, ünvan və ya sessiya üzrə axtar…"
          @input="onSearchInput"
        />
      </div>

      <div class="filter-row">
        <select v-model="filters.pageType" class="select" @change="reload">
          <option v-for="p in PAGE_TYPES" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
        <input v-model="filters.from" type="date" class="select" @change="reload" />
        <input v-model="filters.to" type="date" class="select" @change="reload" />
      </div>

      <div class="table-wrap">
        <table class="visit-table">
          <thead>
            <tr>
              <th>Vaxt</th>
              <th>Ziyarətçi</th>
              <th>Səhifə</th>
              <th>Ünvan</th>
              <th>IP</th>
              <th>Brauzer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in visits" :key="v.id">
              <td class="muted nowrap">{{ formatTime(v.createdAt) }}</td>
              <td>
                <span class="guest-tag">Qonaq</span>
                <em class="session" :title="v.sessionId">{{ v.sessionId.slice(0, 8) }}</em>
              </td>
              <td>
                <span class="page-badge" :class="v.pageType">{{ v.pageLabel }}</span>
              </td>
              <td class="muted path" :title="v.title || ''">{{ v.path }}</td>
              <td class="muted nowrap" :title="v.ipAddress || ''">{{ prettyIp(v.ipAddress) }}</td>
              <td class="muted">{{ browserName(v.userAgent) }}</td>
            </tr>
            <tr v-if="!visits.length">
              <td colspan="6" class="empty-row">Bu şərtlərə uyğun ziyarət tapılmadı.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="total > filters.pageSize" class="pager">
        <button class="mini-btn" :disabled="filters.page === 1" @click="goPage(filters.page - 1)">Əvvəlki</button>
        <span class="pager-info">{{ filters.page }} / {{ lastPage }}</span>
        <button class="mini-btn" :disabled="filters.page >= lastPage" @click="goPage(filters.page + 1)">Sonrakı</button>
      </div>
    </section>

    <p class="privacy-note">
      IP ünvanı şəxsi məlumat sayılır. Ziyarət qeydləri 90 gün saxlanılır, sonra avtomatik silinir.
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getVisitStats, searchVisits, PAGE_TYPES, browserName } from '@/services/visitService'

// Lokal test zamanı IP həmişə IPv6 loopback (::1) olur — bu, «eyni kompüter»
// deməkdir. Real serverdə ziyarətçinin əsl ünvanı görünəcək.
const prettyIp = (ip) => {
  if (!ip) return '—'
  if (ip === '::1' || ip === '127.0.0.1') return 'Lokal'
  return ip
}

const isLoading = ref(false)
const stats = ref({})
const visits = ref([])
const total = ref(0)
const days = ref(14)

// Bu bölmə yalnız qeydiyyatdan keçməmiş ziyarətçilər üçündür — giriş etmiş
// istifadəçinin fəaliyyəti onsuz da jurnalda görünür.
const filters = reactive({
  q: '',
  pageType: '',
  audience: 'guest',
  from: '',
  to: '',
  page: 1,
  pageSize: 30,
})

const lastPage = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)))

const guestShare = computed(() => {
  const all = stats.value.uniqueVisitors ?? 0
  if (!all) return 0
  return Math.round(((stats.value.guestVisitors ?? 0) / all) * 100)
})

const maxDaily = computed(() =>
  Math.max(0, ...(stats.value.daily ?? []).map((d) => d.views)),
)

const barHeight = (value) => (maxDaily.value ? `${Math.max(2, (value / maxDaily.value) * 100)}%` : '2%')

const pageShare = (views) => {
  const top = Math.max(...(stats.value.topPages ?? []).map((p) => p.views), 1)
  return `${Math.round((views / top) * 100)}%`
}

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek']

const shortDay = (value) => {
  const d = new Date(value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

const formatTime = (value) => {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadStats = async () => {
  stats.value = await getVisitStats(days.value)
}

const loadVisits = async () => {
  const result = await searchVisits({
    q: filters.q || undefined,
    pageType: filters.pageType || undefined,
    audience: filters.audience || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  })
  visits.value = result.items
  total.value = result.totalCount
}

const reload = async () => {
  filters.page = 1
  isLoading.value = true
  try {
    await loadVisits()
  } finally {
    isLoading.value = false
  }
}

const goPage = async (page) => {
  filters.page = page
  isLoading.value = true
  try {
    await loadVisits()
  } finally {
    isLoading.value = false
  }
}

const setDays = async (value) => {
  days.value = value
  isLoading.value = true
  try {
    await loadStats()
  } finally {
    isLoading.value = false
  }
}

// Hər hərfdə sorğu getməsin deyə yazmaq bitəndən sonra axtarırıq
let searchTimer = null
const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(reload, 350)
}

onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([loadStats(), loadVisits()])
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.visitors {
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

/* Bloklar */
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

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
}

/* Qrafik */
.chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 170px;
  padding-top: 10px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
}

.bar-stack {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
}

.bar {
  width: 45%;
  max-width: 16px;
  border-radius: 4px 4px 0 0;
  transition: height 0.25s;
}

.bar.views {
  background: #f0d9e1;
}

.bar.visitors {
  background: #721438;
}

.bar-label {
  font-size: 0.62rem;
  color: #a6969c;
  white-space: nowrap;
}

.legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 0.75rem;
  color: #868e96;
}

.dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 3px;
  margin-right: 5px;
}

.dot.views {
  background: #f0d9e1;
}

.dot.visitors {
  background: #721438;
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
  color: #1a1118;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-value {
  color: #868e96;
  font-size: 0.75rem;
  white-space: nowrap;
}

/* Pay zolaqları */
.share-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #4a3f44;
  margin-bottom: 5px;
}

.share-track {
  height: 7px;
  background: #f6f1f3;
  border-radius: 20px;
  overflow: hidden;
}

.share-fill {
  height: 100%;
  background: linear-gradient(90deg, #721438, #b6577c);
  border-radius: 20px;
  transition: width 0.25s;
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
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.filter-chips {
  display: flex;
  gap: 6px;
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

/* Cədvəl */
.table-wrap {
  overflow-x: auto;
}

.visit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.visit-table th {
  text-align: left;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #b8a3ab;
  padding: 8px 10px;
  border-bottom: 1px solid #f2ecee;
  white-space: nowrap;
}

.visit-table td {
  padding: 9px 10px;
  border-bottom: 1px solid #faf7f8;
  color: #1a1118;
}

.visit-table .muted {
  color: #868e96;
  font-size: 0.8rem;
}

.nowrap {
  white-space: nowrap;
}

.path {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guest-tag {
  background: #f1f3f5;
  color: #6c757d;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 20px;
}

.session {
  font-style: normal;
  font-size: 0.66rem;
  color: #c0b2b7;
  margin-left: 6px;
  font-family: 'Consolas', monospace;
}

.page-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
  background: #f1f3f5;
  color: #6c757d;
  white-space: nowrap;
}

.page-badge.venue {
  background: #f6e9ee;
  color: #721438;
}

.page-badge.search {
  background: #fdf3e0;
  color: #b07d2b;
}

.page-badge.home {
  background: #e8f0fb;
  color: #1c5cab;
}

.empty,
.empty-row {
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

.privacy-note {
  margin: 0;
  font-size: 0.75rem;
  color: #a6969c;
  text-align: center;
}
</style>
