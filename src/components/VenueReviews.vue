<template>
  <div>
    <h2 class="section-title">
      Qonaq rəyləri
      <span class="review-summary" v-if="reviews.length">
        ★ {{ averageRating }} · {{ reviews.length }} rəy
      </span>
    </h2>

    <!-- Rəy yazma / redaktə formu -->
    <div class="review-form" ref="reviewFormRef">
      <template v-if="auth.isAuth && (canReview.canReview || editingId)">
        <h4>{{ editingId ? 'Rəyi redaktə edin' : 'Rəyinizi yazın' }}</h4>

        <div class="star-picker">
          <button
            v-for="n in 5"
            :key="n"
            class="star-btn"
            :class="{ filled: n <= (hoverRating || reviewForm.rating) }"
            @click="reviewForm.rating = n"
            @mouseenter="hoverRating = n"
            @mouseleave="hoverRating = 0"
          >
            ★
          </button>
          <span class="star-hint">{{ ratingHint }}</span>
        </div>

        <el-input
          v-model="reviewForm.comment"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="Təcrübənizi qonaqlarla bölüşün — xidmət, yeməklər, zalın vəziyyəti..."
        />

        <p v-if="reviewError" class="form-error">{{ reviewError }}</p>

        <div class="review-form-foot">
          <UiButton :is-loading="isSendingReview" @click="submitReview">
            {{ editingId ? 'Yadda saxla' : 'Rəyi göndər' }}
          </UiButton>
          <button v-if="editingId" class="link-btn" @click="cancelEdit">İmtina</button>
        </div>
      </template>

      <!-- Rəy yalnız tədbiri keçmiş qonaqdan qəbul olunur — səbəbi burada yazılır -->
      <div v-else-if="auth.isAuth" class="review-locked">
        <span class="lock-icon">🔒</span>
        <div>
          <b>{{ canReview.reason || 'Bu saraya rəy yaza bilmirsiniz.' }}</b>
          <span>Reytinqin dəyəri budur: yalnız orada tədbir keçirmiş qonaqlar yaza bilir.</span>
        </div>
      </div>

      <div v-else class="review-login">
        <span>Rəy yazmaq üçün hesabınıza daxil olun.</span>
        <UiButton to="/login">Daxil ol</UiButton>
      </div>
    </div>

    <div class="review-list" v-if="reviews.length">
      <div v-for="r in reviews" :key="r.id" class="review-card" :class="{ mine: isMine(r), editing: editingId === r.id }">
        <div class="review-head">
          <span class="review-author">
            {{ r.author }}
            <em v-if="isMine(r)" class="mine-tag">siz</em>
            <em v-if="r.isVerifiedGuest" class="verified-tag" title="Bu saraydakı tədbiri keçmiş qonaq">
              ✓ təsdiqlənmiş qonaq
            </em>
          </span>
          <span class="review-stars">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
        </div>

        <p class="review-text">{{ r.text }}</p>

        <div class="review-foot">
          <span class="review-date">{{ formatDateFull(r.date) }}</span>

          <div class="review-actions" v-if="isMine(r)">
            <button class="icon-btn" title="Redaktə et" @click="startEdit(r)">✏️</button>
            <el-popconfirm
              title="Bu rəyi silmək istəyirsiniz?"
              confirm-button-text="Bəli, sil"
              cancel-button-text="Xeyr"
              @confirm="removeReview(r)"
            >
              <template #reference>
                <button class="icon-btn danger" title="Sil">🗑️</button>
              </template>
            </el-popconfirm>
          </div>

          <!-- Başqasının rəyi uyğunsuzdursa moderatora bildirmək olar -->
          <button v-else-if="auth.isAuth" class="report-btn" @click="openReport(r)">
            Şikayət et
          </button>
        </div>
      </div>
    </div>
    <el-empty v-else description="Hələ rəy yoxdur — ilk rəyi siz yazın" />

    <!-- Rəy şikayəti -->
    <el-dialog v-model="reportOpen" title="Rəyi şikayət et" width="420px">
      <p class="report-note">
        Şikayət moderatora göndərilir. Rəy dərhal silinmir — qərarı moderator verir.
      </p>
      <div class="report-reasons">
        <button
          v-for="r in REPORT_REASONS"
          :key="r.value"
          class="reason-chip"
          :class="{ active: reportReason === r.value }"
          @click="reportReason = r.value"
        >
          {{ r.label }}
        </button>
      </div>
      <el-input
        v-model="reportNote"
        type="textarea"
        :rows="3"
        maxlength="300"
        show-word-limit
        placeholder="Əlavə izah (məcburi deyil)"
      />
      <template #footer>
        <el-button @click="reportOpen = false">İmtina</el-button>
        <el-button type="danger" :disabled="!reportReason" @click="submitReport">Göndər</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from '@/utils/toast'
import {
  getVenueReviews,
  createReview,
  updateReview,
  deleteReview,
  canReviewVenue,
} from '@/services/reviewService'
import { reportReview, REPORT_REASONS } from '@/services/reviewModerationService'
import { formatDateFull } from '@/utils/date'
import { useAuthStore } from '@/store/auth'
import UiButton from '@/components/ui/UiButton.vue'

const props = defineProps({
  venue: { type: Object, required: true },
})

const auth = useAuthStore()

const reviews = ref(props.venue.reviews ?? [])

// Rəy şikayəti dialoqu
const reportOpen = ref(false)
const reportReason = ref('')
const reportNote = ref('')
const reportTarget = ref(null)

const hoverRating = ref(0)
const isSendingReview = ref(false)
const reviewError = ref('')
const editingId = ref(null)
const reviewFormRef = ref(null)
const reviewForm = reactive({ rating: 5, comment: '' })

// Rəy yaza bilirmi və yaza bilmirsə səbəbi
const canReview = ref({ canReview: false, reason: '' })

const loadEligibility = async () => {
  if (!auth.isAuth || !props.venue.id) return

  try {
    canReview.value = await canReviewVenue(props.venue.id)
  } catch {
    // Yoxlama alınmasa forma bağlı qalır — yazmağa cəhd onsuz da serverdə yoxlanılır
    canReview.value = { canReview: false, reason: '' }
  }
}

// Rəy cari istifadəçiyə aiddirmi — redaktə/silmə ikonları buna görə göstərilir
const isMine = (review) => Boolean(review.customerId) && review.customerId === auth.user?.id

const averageRating = computed(() => {
  if (!reviews.value.length) return 0
  const sum = reviews.value.reduce((total, r) => total + r.rating, 0)
  return Math.round((sum / reviews.value.length) * 10) / 10
})

const ratingHint = computed(() =>
  ({ 1: 'Çox pis', 2: 'Pis', 3: 'Normal', 4: 'Yaxşı', 5: 'Əla' })[hoverRating.value || reviewForm.rating] ?? '',
)

const loadReviews = async () => {
  reviews.value = await getVenueReviews(props.venue.id)
}

const resetForm = () => {
  editingId.value = null
  reviewForm.rating = 5
  reviewForm.comment = ''
  reviewError.value = ''
}

// Redaktə düyməsi: rəyi formaya yükləyib formaya sürüşdürür
const startEdit = (review) => {
  editingId.value = review.id
  reviewForm.rating = review.rating
  reviewForm.comment = review.text
  reviewError.value = ''
  reviewFormRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const cancelEdit = () => resetForm()

// Redaktə rejimindədirsə yeniləyir, əks halda yeni rəy əlavə edir
const submitReview = async () => {
  if (!reviewForm.comment.trim()) {
    reviewError.value = 'Rəy mətnini yazın.'
    return
  }

  isSendingReview.value = true
  reviewError.value = ''
  try {
    const comment = reviewForm.comment.trim()
    const { message } = editingId.value
      ? await updateReview(editingId.value, reviewForm.rating, comment)
      : await createReview(props.venue.id, reviewForm.rating, comment)

    resetForm()
    await loadReviews()
    toast.success(message)
  } catch (e) {
    reviewError.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isSendingReview.value = false
  }
}

// İstifadəçi öz rəyini silir
const removeReview = async (review) => {
  try {
    const { message } = await deleteReview(review.id)
    if (editingId.value === review.id) resetForm()
    await loadReviews()
    toast.success(message, 'Silindi')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

// Uyğunsuz rəyi moderatorun diqqətinə çatdırır
const openReport = (review) => {
  reportTarget.value = review
  reportReason.value = ''
  reportNote.value = ''
  reportOpen.value = true
}

const submitReport = async () => {
  try {
    const { message } = await reportReview({
      reviewId: reportTarget.value.id,
      reason: reportReason.value,
      note: reportNote.value.trim(),
    })
    reportOpen.value = false
    toast.success(message, 'Göndərildi')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

onMounted(() => {
  loadEligibility()
})
</script>

<style scoped>
.section-title {
  margin: 34px 0 16px;
  font-size: 1.35rem;
  color: var(--ink);
  border-left: 4px solid var(--brand);
  padding-left: 12px;
}

.review-summary {
  font-size: 0.85rem;
  font-weight: 600;
  color: #b07d2b;
  margin-left: 10px;
}

/* Rəy yazma formu */
.review-form {
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.review-form h4 {
  margin: 0 0 12px;
  font-size: 1rem;
  color: var(--ink);
}

.star-picker {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  line-height: 1;
  color: #e9ecef;
  cursor: pointer;
  padding: 0;
  transition: transform 0.12s, color 0.12s;
}

.star-btn:hover {
  transform: scale(1.15);
}

.star-btn.filled {
  color: var(--gold);
}

.star-hint {
  margin-left: 10px;
  font-size: 0.83rem;
  color: var(--muted);
}

.review-form-foot {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
}

.link-btn {
  background: none;
  border: none;
  color: #c0392b;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover {
  text-decoration: underline;
}

/* Rəy yaza bilməyənə səbəb izah olunur */
.review-locked {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.review-locked .lock-icon {
  font-size: 1.1rem;
}

.review-locked b {
  display: block;
  font-size: 0.88rem;
  color: var(--ink);
  margin-bottom: 3px;
}

.review-locked span {
  font-size: 0.8rem;
  color: var(--muted);
  line-height: 1.55;
}

.review-login {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  color: #6c757d;
  font-size: 0.9rem;
}

.review-login a {
  text-decoration: none;
}

/* Tədbiri keçmiş qonaq nişanı — reytinqin dəyəri buna söykənir */
.verified-tag {
  background: var(--ok-soft);
  color: var(--ok);
  font-style: normal;
  font-size: 0.67rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  margin-left: 6px;
  white-space: nowrap;
}

.mine-tag {
  background: #fdf3e0;
  color: #b07d2b;
  font-style: normal;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
  margin-left: 6px;
}

.review-card.mine {
  border-color: var(--gold);
  background: #fffdf7;
}

.review-card.editing {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(114, 20, 56, 0.1);
}

.review-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.review-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  background: #f8f9fa;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  width: 30px;
  height: 28px;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: #fff;
  border-color: var(--gold);
  transform: translateY(-1px);
}

.icon-btn.danger:hover {
  border-color: #c0392b;
  background: var(--danger-soft);
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 18px;
  border: 1px solid #eaeaea;
}

.review-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.review-author {
  font-weight: 700;
  color: var(--ink);
  font-size: 0.92rem;
}

.review-stars {
  color: var(--gold);
  letter-spacing: 2px;
}

.review-text {
  margin: 0 0 6px;
  color: #495057;
  font-size: 0.9rem;
  line-height: 1.5;
}

.review-date {
  font-size: 0.75rem;
  color: #adb5bd;
}

/* Şikayət düyməsi — gözə soxulmasın deyə sönük saxlanılır */
.report-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.75rem;
  color: #c0b2b7;
  cursor: pointer;
  transition: color 0.15s;
}

.report-btn:hover {
  color: var(--accent);
}

.report-note {
  margin: 0 0 14px;
  font-size: 0.83rem;
  color: var(--muted);
  line-height: 1.5;
}

.report-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.reason-chip {
  background: #fff;
  border: 1px solid var(--line-2);
  color: #6c757d;
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.reason-chip:hover {
  border-color: var(--gold);
}

.reason-chip.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.form-error {
  margin: 0;
  color: #d93025;
  font-size: 13px;
  white-space: pre-line;
}

</style>
