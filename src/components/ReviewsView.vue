<template>
  <div class="reviews" v-loading="isLoading">
    <!-- Ümumi mənzərə -->
    <div class="stat-row">
      <div class="stat-card dark">
        <span class="stat-value">{{ stats.totalReviews ?? 0 }}</span>
        <span class="stat-label">Rəy</span>
        <span class="stat-sub">orta bal {{ stats.averageRating ?? 0 }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.openReports ?? 0 }}</span>
        <span class="stat-label">Açıq şikayət</span>
        <span class="stat-sub">baxılmalıdır</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.reportedReviews ?? 0 }}</span>
        <span class="stat-label">Şikayət olunan rəy</span>
        <span class="stat-sub">ümumilikdə</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.hiddenReviews ?? 0 }}</span>
        <span class="stat-label">Gizlədilmiş</span>
        <span class="stat-sub">reytinqə düşmür</span>
      </div>
    </div>

    <!-- Siyahı -->
    <section class="block">
      <div class="block-head">
        <h3 class="block-title">Rəylər <em>{{ total }}</em></h3>
        <input
          v-model="filters.q"
          class="search-box"
          type="search"
          placeholder="Rəy mətni və ya müəllif üzrə axtar…"
          @input="onSearchInput"
        />
      </div>

      <div class="filter-row">
        <div class="filter-chips">
          <button
            v-for="s in REVIEW_STATUSES"
            :key="s.value"
            class="chip"
            :class="{ active: filters.status === s.value }"
            @click="setStatus(s.value)"
          >
            {{ s.label }}
          </button>
        </div>
        <select v-model="filters.rating" class="select" @change="reload">
          <option value="">Bütün ballar</option>
          <option v-for="r in [5, 4, 3, 2, 1]" :key="r" :value="r">{{ r }} ulduz</option>
        </select>
      </div>

      <ul v-if="reviews.length" class="review-list">
        <li v-for="r in reviews" :key="r.id" class="review-item" :class="{ hidden: r.isHidden }">
          <div class="review-head">
            <span class="stars">{{ '★'.repeat(r.rating) }}<i>{{ '★'.repeat(5 - r.rating) }}</i></span>
            <b class="author">{{ r.authorName }}</b>
            <span class="venue-name">{{ r.venueName }}</span>
            <span class="spacer"></span>
            <span v-if="r.isHidden" class="tag off">Gizlədilib</span>
            <button
              v-if="r.reportCount"
              class="tag warn"
              :title="'Şikayətlərə bax'"
              @click="openReports(r)"
            >
              {{ r.reportCount }} şikayət<template v-if="r.openReportCount">
                · {{ r.openReportCount }} açıq</template>
            </button>
            <span class="date">{{ formatDate(r.createdAt) }}</span>
          </div>

          <p class="comment">{{ r.comment }}</p>

          <p v-if="r.isHidden && r.hiddenReason" class="hidden-reason">
            Səbəb: {{ r.hiddenReason }}
          </p>

          <div class="review-actions">
            <button v-if="!r.isHidden" class="mini-btn danger" @click="openHide(r)">Gizlət</button>
            <button v-else class="mini-btn ok" @click="unhide(r)">Yenidən göstər</button>
            <button
              v-if="r.openReportCount"
              class="mini-btn"
              @click="resolve(r)"
            >
              Şikayətləri bağla
            </button>
            <button class="mini-btn danger" @click="remove(r)">Sil</button>
          </div>
        </li>
      </ul>
      <p v-else class="empty">Bu şərtlərə uyğun rəy tapılmadı.</p>

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

    <!-- Gizlətmə səbəbi -->
    <el-dialog v-model="hideOpen" title="Rəyi gizlət" width="440px">
      <p class="dialog-note">
        Rəy silinmir — saytda görünmür və sarayın reytinqinə təsir etmir.
        İstənilən vaxt geri qaytara bilərsiniz.
      </p>
      <div class="reason-chips">
        <button
          v-for="reason in HIDE_REASONS"
          :key="reason"
          class="chip"
          :class="{ active: hideReason === reason }"
          @click="hideReason = reason"
        >
          {{ reason }}
        </button>
      </div>
      <input v-model="hideReason" class="search-box full" placeholder="Səbəb yazın…" />
      <template #footer>
        <button class="mini-btn" @click="hideOpen = false">İmtina</button>
        <button class="mini-btn danger" :disabled="!hideReason.trim()" @click="confirmHide">
          Gizlət
        </button>
      </template>
    </el-dialog>

    <!-- Şikayətlər -->
    <el-dialog v-model="reportsOpen" title="Şikayətlər" width="480px">
      <ul v-if="reports.length" class="report-list">
        <li v-for="rep in reports" :key="rep.id">
          <div class="report-head">
            <b>{{ rep.reasonLabel }}</b>
            <span class="tag" :class="rep.isResolved ? 'ok' : 'warn'">
              {{ rep.isResolved ? 'Bağlanıb' : 'Açıq' }}
            </span>
          </div>
          <p v-if="rep.note" class="report-note">{{ rep.note }}</p>
          <span class="date">{{ rep.reporterName || 'Naməlum' }} · {{ formatDate(rep.createdAt) }}</span>
        </li>
      </ul>
      <p v-else class="empty">Şikayət yoxdur.</p>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getReviewStats,
  searchReviews,
  getReviewReports,
  setReviewHidden,
  resolveReviewReports,
  deleteReview,
  REVIEW_STATUSES,
  HIDE_REASONS,
} from '@/services/reviewModerationService'

const isLoading = ref(false)
const stats = ref({})
const reviews = ref([])
const total = ref(0)

const filters = reactive({
  q: '',
  status: 'reported',
  rating: '',
  page: 1,
  pageSize: 20,
})

const lastPage = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)))

const hideOpen = ref(false)
const hideReason = ref('')
const hideTarget = ref(null)

const reportsOpen = ref(false)
const reports = ref([])

const formatDate = (value) => {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const loadStats = async () => {
  stats.value = await getReviewStats()
}

const loadReviews = async () => {
  const result = await searchReviews({
    q: filters.q || undefined,
    status: filters.status || undefined,
    rating: filters.rating || undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  })
  reviews.value = result.items
  total.value = result.totalCount
}

const refresh = async () => {
  isLoading.value = true
  try {
    await Promise.all([loadStats(), loadReviews()])
  } finally {
    isLoading.value = false
  }
}

const reload = async () => {
  filters.page = 1
  isLoading.value = true
  try {
    await loadReviews()
  } finally {
    isLoading.value = false
  }
}

const goPage = async (page) => {
  filters.page = page
  isLoading.value = true
  try {
    await loadReviews()
  } finally {
    isLoading.value = false
  }
}

const setStatus = (value) => {
  filters.status = value
  reload()
}

// Hər hərfdə sorğu getməsin deyə yazmaq bitəndən sonra axtarırıq
let searchTimer = null
const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(reload, 350)
}

const openHide = (review) => {
  hideTarget.value = review
  hideReason.value = ''
  hideOpen.value = true
}

const confirmHide = async () => {
  const result = await setReviewHidden(hideTarget.value.id, true, hideReason.value.trim())
  if (!result.success) return ElMessage.error(result.message)

  hideOpen.value = false
  ElMessage.success(result.message)
  await refresh()
}

const unhide = async (review) => {
  const result = await setReviewHidden(review.id, false)
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  await refresh()
}

const resolve = async (review) => {
  const result = await resolveReviewReports(review.id)
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  await refresh()
}

// Silmək geri qaytarıla bilmir — ona görə ayrıca təsdiq istəyirik
const remove = async (review) => {
  try {
    await ElMessageBox.confirm(
      'Rəy tamamilə silinəcək və geri qaytarıla bilməyəcək. Gizlətmək daha təhlükəsizdir.',
      'Rəyi sil',
      { confirmButtonText: 'Sil', cancelButtonText: 'İmtina', type: 'warning' },
    )
  } catch {
    return
  }

  const result = await deleteReview(review.id)
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  await refresh()
}

const openReports = async (review) => {
  reports.value = await getReviewReports(review.id)
  reportsOpen.value = true
}

onMounted(refresh)
</script>

<style scoped>
.reviews {
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
  margin: 0;
  font-size: 1rem;
  color: #1a1118;
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

.search-box.full {
  width: 100%;
  max-width: none;
  margin-top: 10px;
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

.filter-chips,
.reason-chips {
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

/* Rəy siyahısı */
.review-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-item {
  border: 1px solid #f4eff1;
  border-radius: 12px;
  padding: 14px 16px;
}

.review-item.hidden {
  background: #fbf8f9;
  border-color: #efe4e8;
}

.review-item.hidden .comment {
  color: #a6969c;
}

.review-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.stars {
  color: #dfb15b;
  font-size: 0.85rem;
  letter-spacing: 1px;
}

.stars i {
  color: #ece5e8;
  font-style: normal;
}

.author {
  font-size: 0.85rem;
  color: #1a1118;
}

.venue-name {
  font-size: 0.76rem;
  color: #721438;
  background: #f6e9ee;
  padding: 2px 9px;
  border-radius: 20px;
}

.spacer {
  flex: 1;
}

.date {
  font-size: 0.72rem;
  color: #a6969c;
}

.tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
  border: none;
  background: #f1f3f5;
  color: #6c757d;
}

.tag.warn {
  background: #fdf0e3;
  color: #b06a2b;
  cursor: pointer;
}

.tag.ok {
  background: #e6f4ea;
  color: #217a41;
}

.tag.off {
  background: #f8e3e8;
  color: #a02c4a;
}

.comment {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #4a3f44;
}

.hidden-reason {
  margin: 8px 0 0;
  font-size: 0.76rem;
  color: #a02c4a;
}

.review-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

/* Şikayət siyahısı */
.report-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.report-note {
  margin: 0 0 4px;
  font-size: 0.82rem;
  color: #4a3f44;
}

.dialog-note {
  margin: 0 0 14px;
  font-size: 0.82rem;
  color: #868e96;
  line-height: 1.5;
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
</style>
