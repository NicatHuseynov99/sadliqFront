<template>
  <div class="detail-page" v-loading="isLoading">
    <div v-if="venue" class="detail-inner">
      <button class="back-btn" @click="$router.back()">← Geri qayıt</button>

      <!-- Şəkil qalereyası -->
      <div class="gallery">
        <div class="main-image">
          <img :src="activeImage" :alt="venue.name" @error="onImgError" />
          <span class="city-badge">{{ venue.city }}</span>
        </div>
        <div class="thumbs" v-if="venue.images?.length > 1">
          <img
            v-for="(img, i) in venue.images"
            :key="i"
            :src="img"
            :class="{ active: img === activeImage }"
            @click="activeImage = img"
            @error="onImgError"
          />
        </div>
      </div>

      <!-- Başlıq və əsas məlumat -->
      <div class="head-row">
        <div>
          <h1 class="venue-name">{{ venue.name }}</h1>
          <AddressLink
            :address="venue.address"
            :city="venue.city"
            :latitude="venue.latitude"
            :longitude="venue.longitude"
          />
          <p class="venue-phone">
            📞 <a :href="`tel:${venue.phone.replace(/\s/g, '')}`">{{ venue.phone }}</a>
          </p>
        </div>
        <div class="rating-box">
          <span class="rating-score">★ {{ venue.rating }}</span>
          <span class="rating-count">{{ venue.reviewCount }} rəy</span>
        </div>
      </div>

      <div class="feature-tags" v-if="venue.features?.length">
        <span v-for="f in venue.features" :key="f" class="feature-tag">✓ {{ f }}</span>
      </div>

      <p class="venue-desc">{{ venue.description }}</p>

      <!-- Zallar — hər zalın öz boş/dolu günləri ilə (rezervlər zal əsaslıdır) -->
      <h2 class="section-title">Zallar və boş günləri</h2>
      <div class="hall-list">
        <div v-for="h in venue.halls" :key="h.id" class="hall-card">
          <img :src="h.imageUrl" :alt="h.name" class="hall-img" @error="onImgError" />

          <div class="hall-body">
            <div class="hall-top">
              <div>
                <h3>{{ h.name }}</h3>
                <p class="hall-meta">👥 {{ h.capacity }} qonaq tutumu</p>
              </div>
              <span class="price">{{ h.minPrice }} ₼-dən</span>
            </div>

            <p class="hall-desc">{{ h.description }}</p>

            <!-- Yaxın 14 günün vəziyyəti -->
            <div class="strip-head">
              <span class="strip-label">Yaxın 2 həftə</span>
              <span class="strip-free" v-if="nextFreeOf(h.id)">
                Ən yaxın boş gün: <b>{{ formatDate(nextFreeOf(h.id)) }}</b>
              </span>
            </div>
            <div class="day-strip">
              <button
                v-for="d in nextDays(h.id)"
                :key="d.key"
                class="strip-day"
                :class="d.status"
                :disabled="d.status === 'busy'"
                :title="d.status === 'busy' ? 'Doludur' : 'Boşdur — rezerv et'"
                @click="onDateSelect(h, d.key)"
              >
                <span class="wd">{{ d.weekday }}</span>
                <span class="dn">{{ d.number }}</span>
              </button>
            </div>

            <div class="hall-footer">
              <button class="calendar-toggle" @click="toggleCalendar(h.id)">
                {{ openCalendars.has(h.id) ? '▲ Təqvimi gizlət' : '📅 Bütün ayı gör' }}
              </button>
              <button class="reserve-btn" @click="openReserve(h)">Rezerv et</button>
            </div>

            <div v-if="openCalendars.has(h.id)" class="hall-calendar">
              <AvailabilityCalendar :busy-dates="hallBusy[h.id]" @select="(key) => onDateSelect(h, key)" />

              <aside class="calendar-side">
                <div class="side-block">
                  <span class="side-label">Ən yaxın boş günlər</span>
                  <div class="free-days">
                    <button
                      v-for="d in nextFreeDays(h.id)"
                      :key="d.key"
                      class="free-day"
                      :class="{ weekend: d.isWeekend }"
                      @click="onDateSelect(h, d.key)"
                    >
                      <span class="fd-weekday">{{ d.weekday }}</span>
                      <span class="fd-day">{{ d.number }}</span>
                      <span class="fd-month">{{ d.month }}</span>
                    </button>
                  </div>
                  <span class="side-note">Qızılı günlər həftə sonudur — toylar üçün ən çox seçilən günlər.</span>
                </div>

                <div class="side-block stats">
                  <div class="stat">
                    <span class="stat-value">{{ h.capacity }}</span>
                    <span class="stat-label">qonaq tutumu</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ h.minPrice }} ₼</span>
                    <span class="stat-label">nəfərbaşı, ən az</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ busyCountIn90(h.id) }}</span>
                    <span class="stat-label">3 ayda dolu gün</span>
                  </div>
                </div>

                <button class="reserve-btn wide" @click="openReserve(h)">Bu zalı rezerv et</button>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <!-- Menyular — süfrə şəkli, altında tərkibi və qiyməti -->
      <h2 class="section-title">Menyular</h2>
      <div class="menu-list">
        <div v-for="m in venue.menus" :key="m.id" class="menu-card">
          <div class="menu-cover" @click="openMenu(m)">
            <img :src="m.coverImageUrl" :alt="`${m.name} süfrəsi`" @error="onImgError" />
            <div class="menu-price-badge">
              <strong>{{ m.pricePerPerson }} ₼</strong>
              <span>1 nəfər üçün</span>
            </div>
          </div>

          <div class="menu-body">
            <h3>{{ m.name }} menyusu</h3>
            <p class="menu-desc">{{ m.description }}</p>

            <span class="composition-label">Süfrənin tərkibi</span>
            <ul class="composition">
              <li v-for="i in m.items" :key="i.id">
                <span class="dot">•</span> {{ i.name }}
                <span class="cat-mini">{{ i.category }}</span>
              </li>
            </ul>

            <div class="menu-foot">
              <button class="photo-btn" @click="openMenu(m)">📷 Yeməklərin şəkilləri</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Məkanın xəritədəki yeri -->
      <MiniMap
        :latitude="venue.latitude"
        :longitude="venue.longitude"
        :name="venue.name"
        :address="`${venue.address}, ${venue.city}`"
      />

      <!-- Rəylər -->
      <h2 class="section-title">
        Qonaq rəyləri
        <span class="review-summary" v-if="reviews.length">
          ★ {{ averageRating }} · {{ reviews.length }} rəy
        </span>
      </h2>

      <!-- Rəy yazma / redaktə formu -->
      <div class="review-form" ref="reviewFormRef">
        <template v-if="auth.isAuth">
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
            <button class="reserve-btn" :disabled="isSendingReview" @click="submitReview">
              {{ isSendingReview ? 'Göndərilir...' : editingId ? 'Yadda saxla' : 'Rəyi göndər' }}
            </button>
            <button v-if="editingId" class="link-btn" @click="cancelEdit">İmtina</button>
          </div>
        </template>

        <div v-else class="review-login">
          <span>Rəy yazmaq üçün hesabınıza daxil olun.</span>
          <router-link to="/login"><button class="reserve-btn">Daxil ol</button></router-link>
        </div>
      </div>

      <div class="review-list" v-if="reviews.length">
        <div v-for="r in reviews" :key="r.id" class="review-card" :class="{ mine: isMine(r), editing: editingId === r.id }">
          <div class="review-head">
            <span class="review-author">
              {{ r.author }}
              <em v-if="isMine(r)" class="mine-tag">siz</em>
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
    </div>

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

    <!-- Menyu detalı dialoqu — yeməklərin şəkilləri ilə -->
    <el-dialog v-model="menuVisible" :title="selectedMenu?.name" width="620px">
      <div v-if="selectedMenu">
        <div class="dialog-cover">
          <img :src="selectedMenu.coverImageUrl" :alt="selectedMenu.name" @error="onImgError" />
          <div class="menu-price-badge">
            <strong>{{ selectedMenu.pricePerPerson }} ₼</strong>
            <span>1 nəfər üçün</span>
          </div>
        </div>
        <p class="dialog-desc">{{ selectedMenu.description }}</p>

        <div v-for="(items, cat) in groupedItems" :key="cat" class="cat-block">
          <h4 class="cat-title">{{ cat }}</h4>
          <div class="dish-grid">
            <div v-for="i in items" :key="i.id" class="dish">
              <img :src="i.imageUrl" :alt="i.name" @error="onImgError" />
              <span>{{ i.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="menuVisible = false">Bağla</el-button>
      </template>
    </el-dialog>

    <!-- Rezerv dialoqu -->
    <el-dialog
      v-model="reserveVisible"
      :title="`Rezerv — ${selectedHall?.name ?? ''}`"
      width="460px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="Tarix">
          <el-date-picker
            v-model="reserveForm.eventDate"
            type="date"
            placeholder="Gün seçin"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            style="width: 100%"
          />
          <span class="field-hint">Dolu günlər təqvimdə bağlıdır.</span>
        </el-form-item>

        <el-form-item label="Menyu">
          <el-select v-model="reserveForm.menuId" placeholder="Menyu seçin" style="width: 100%">
            <el-option
              v-for="m in venue?.menus ?? []"
              :key="m.id"
              :value="m.id"
              :label="`${m.name} — ${m.pricePerPerson} ₼`"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Qonaq sayı">
          <el-input-number
            v-model="reserveForm.guestCount"
            :min="1"
            :max="selectedHall?.capacity ?? 1000"
            style="width: 100%"
          />
          <span class="field-hint" v-if="selectedHall">Maksimum: {{ selectedHall.capacity }} qonaq</span>
        </el-form-item>

        <el-form-item label="Əlaqə telefonu">
          <el-input v-model="reserveForm.contactPhone" placeholder="+994 xx xxx xx xx" />
        </el-form-item>

        <el-form-item label="Qeyd (istəyə bağlı)">
          <el-input v-model="reserveForm.note" type="textarea" :rows="2" placeholder="Əlavə istəkləriniz..." />
        </el-form-item>

        <p class="total-line" v-if="estimatedTotal">
          Təxmini məbləğ: <b>{{ estimatedTotal.toLocaleString() }} ₼</b>
        </p>

        <p v-if="reserveError" class="form-error">{{ reserveError }}</p>
      </el-form>

      <template #footer>
        <el-button @click="reserveVisible = false">İmtina</el-button>
        <button class="reserve-btn submit-btn" :disabled="isSubmitting" @click="submitReserve">
          {{ isSubmitting ? 'Göndərilir...' : 'Sorğu göndər' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import AddressLink from '@/components/AddressLink.vue'
import MiniMap from '@/components/MiniMap.vue'
import AvailabilityCalendar from '@/components/AvailabilityCalendar.vue'
import { getVenueById, toDateKey } from '@/services/venueService'
import { getVenueReviews, createReview, updateReview, deleteReview } from '@/services/reviewService'
import { reportReview, REPORT_REASONS } from '@/services/reviewModerationService'
import { formatDate, formatDateFull, weekdayShort, MONTHS } from '@/utils/date'
import { createReservation } from '@/services/reservationService'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const venue = ref(null)
const isLoading = ref(false)
const activeImage = ref('')

const menuVisible = ref(false)
const selectedMenu = ref(null)

const hallBusy = ref({})
const openCalendars = ref(new Set())

const reviews = ref([])

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

const reserveVisible = ref(false)
const selectedHall = ref(null)
const isSubmitting = ref(false)
const reserveError = ref('')
const busyDates = ref(new Set())

const reserveForm = reactive({
  eventDate: '',
  menuId: null,
  guestCount: 100,
  contactPhone: '',
  note: '',
})

// Sarayın bütün detallarını (zallar, menyular, rəylər) yükləyir
const loadVenue = async () => {
  isLoading.value = true
  try {
    venue.value = await getVenueById(route.params.id)
    activeImage.value = venue.value.coverImageUrl
    // Dolu günlər sarayla birlikdə gəlir — zallar üçün ayrıca sorğu göndərilmir
    hallBusy.value = Object.fromEntries(venue.value.halls.map((h) => [h.id, h.busyDates]))
    reviews.value = venue.value.reviews ?? []
  } finally {
    isLoading.value = false
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
  reviews.value = await getVenueReviews(route.params.id)
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
      : await createReview(venue.value.id, reviewForm.rating, comment)

    resetForm()
    await loadReviews()
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
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
    ElNotification({ title: 'Silindi', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
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
    ElNotification({ title: 'Göndərildi', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  }
}

// Zalın yaxın 14 gününü vəziyyəti ilə birlikdə qaytarır
const nextDays = (hallId) => {
  const busy = hallBusy.value[hallId]
  const result = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)

  for (let i = 0; i < 14; i++) {
    const key = toDateKey(cursor)
    result.push({
      key,
      number: cursor.getDate(),
      weekday: weekdayShort(cursor),
      status: busy?.has(key) ? 'busy' : 'free',
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

// Zalın yaxın 14 gün ərzindəki ilk boş tarixi
const nextFreeOf = (hallId) => nextDays(hallId).find((d) => d.status === 'free')?.key ?? null

// Təqvimin yanındakı panel üçün: növbəti 90 gündə ilk 6 boş tarix
const nextFreeDays = (hallId, count = 6) => {
  const busy = hallBusy.value[hallId]
  const result = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)

  for (let i = 0; i < 90 && result.length < count; i++) {
    const key = toDateKey(cursor)
    if (!busy?.has(key)) {
      const weekday = cursor.getDay()
      result.push({
        key,
        number: cursor.getDate(),
        month: MONTHS[cursor.getMonth()].slice(0, 3),
        weekday: weekdayShort(cursor),
        isWeekend: weekday === 0 || weekday === 6,
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

// Yaxın 3 ayda neçə gün doludur
const busyCountIn90 = (hallId) => {
  const busy = hallBusy.value[hallId]
  if (!busy) return 0

  const limit = new Date()
  limit.setDate(limit.getDate() + 90)
  return [...busy].filter((d) => new Date(d) <= limit).length
}

const toggleCalendar = (hallId) => {
  const set = new Set(openCalendars.value)
  set.has(hallId) ? set.delete(hallId) : set.add(hallId)
  openCalendars.value = set
}


// Menyu dialoqunu açır
const openMenu = (menu) => {
  selectedMenu.value = menu
  menuVisible.value = true
}

// Menyu yeməklərini kateqoriyalara (Soyuq/İsti/Desert/İçki) görə qruplaşdırır
const groupedItems = computed(() => {
  const groups = {}
  for (const item of selectedMenu.value?.items ?? []) {
    const cat = item.category ?? 'Digər'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  return groups
})

// Rezerv təqvimində bağlanacaq günləri artıq yüklənmiş datadan götürür
const loadAvailability = (hallId) => {
  busyDates.value = hallBusy.value[hallId] ?? new Set()
}

// Keçmiş günləri və dolu günləri təqvimdə seçilməz edir
const disabledDate = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) return true

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return busyDates.value.has(`${y}-${m}-${d}`)
}

// Rezerv dialoqunu açır; giriş olmayanı login-ə yönləndirir
const openReserve = (hall) => {
  if (!auth.isAuth) {
    ElNotification({
      title: 'Giriş tələb olunur',
      message: 'Rezerv etmək üçün əvvəlcə daxil olun.',
      type: 'info',
      zIndex: 99999,
    })
    router.push('/login')
    return
  }

  if (!auth.isCustomer) {
    ElNotification({
      title: 'İcazə yoxdur',
      message: 'Rezervi yalnız müştəri hesabı ilə etmək olar.',
      type: 'warning',
      zIndex: 99999,
    })
    return
  }

  selectedHall.value = hall
  reserveError.value = ''
  reserveForm.eventDate = ''
  reserveForm.menuId = null
  reserveForm.guestCount = Math.min(100, hall.capacity ?? 100)
  reserveForm.contactPhone = auth.user?.phone ?? ''
  reserveForm.note = ''
  reserveVisible.value = true
  loadAvailability(hall.id)
}

// Boş günə kliklədikdə həmin zal və tarixlə rezerv dialoqunu açır
const onDateSelect = (hall, dateKey) => {
  openReserve(hall)
  if (reserveVisible.value) reserveForm.eventDate = dateKey
}

const estimatedTotal = computed(() => {
  const menu = venue.value?.menus?.find((m) => m.id === reserveForm.menuId)
  if (!menu || !reserveForm.guestCount) return null
  return menu.pricePerPerson * reserveForm.guestCount
})

// Rezerv sorğusunu göndərir (mock servis — localStorage-a yazılır)
const submitReserve = async () => {
  if (!reserveForm.eventDate || !reserveForm.menuId || !reserveForm.contactPhone) {
    reserveError.value = 'Tarix, menyu və əlaqə telefonu mütləq doldurulmalıdır.'
    return
  }

  isSubmitting.value = true
  reserveError.value = ''
  try {
    const result = await createReservation({
      venueId: venue.value.id,
      hallId: selectedHall.value.id,
      menuId: reserveForm.menuId,
      eventDate: reserveForm.eventDate,
      guestCount: reserveForm.guestCount,
      contactPhone: reserveForm.contactPhone,
      note: reserveForm.note || null,
    })
    reserveVisible.value = false
    ElNotification({
      title: 'Uğurlu',
      message: result.message,
      type: 'success',
      zIndex: 99999,
    })
    // Yeni rezerv edilən gün dərhal dolu kimi görünsün
    await loadVenue()
  } catch (e) {
    reserveError.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isSubmitting.value = false
  }
}

// Şəkil yüklənməsə ehtiyat şəkil qoyur
const onImgError = (e) => {
  e.target.src = 'https://picsum.photos/seed/sadliq/900/600'
}

onMounted(loadVenue)
</script>

<style scoped>
.detail-page {
  min-height: calc(100vh - 61px);
  background: #f4f6f8;
  padding: 24px 40px 60px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.detail-inner {
  max-width: 1360px;
  margin: 0 auto;
}

.back-btn {
  background: none;
  border: none;
  color: #721438;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 14px;
}

.gallery {
  margin-bottom: 20px;
}

.main-image {
  position: relative;
  height: 440px;
  border-radius: 14px;
  overflow: hidden;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.city-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 5px 12px;
  font-size: 12px;
  border-radius: 5px;
  font-weight: 600;
}

.thumbs {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.thumbs img {
  width: 110px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.7;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.thumbs img:hover {
  opacity: 1;
}

.thumbs img.active {
  opacity: 1;
  border-color: #721438;
}

.head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.venue-name {
  margin: 0 0 6px;
  color: #1a1118;
  font-size: 1.8rem;
}

.venue-phone {
  margin: 4px 0 0;
  color: #6c757d;
  font-size: 0.92rem;
}

.venue-phone a {
  color: #6c757d;
  text-decoration: none;
}

.venue-phone a:hover {
  color: #721438;
  text-decoration: underline;
}

.rating-box {
  text-align: center;
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 10px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.rating-score {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  color: #b07d2b;
}

.rating-count {
  font-size: 0.78rem;
  color: #adb5bd;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.feature-tag {
  background: #fdf3e0;
  color: #8a6220;
  font-size: 12px;
  padding: 4px 11px;
  border-radius: 20px;
  font-weight: 600;
}

.venue-desc {
  margin: 10px 0 0;
  color: #495057;
  line-height: 1.65;
  font-size: 0.95rem;
}

.section-title {
  margin: 34px 0 16px;
  font-size: 1.35rem;
  color: #1a1118;
  border-left: 4px solid #721438;
  padding-left: 12px;
}

.hall-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hall-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #eaeaea;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
}

.hall-img {
  width: 260px;
  height: 240px;
  flex-shrink: 0;
  object-fit: cover;
  align-self: flex-start;
}

.hall-body {
  padding: 16px 18px 18px;
  flex-grow: 1;
  min-width: 0;
}

.hall-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.hall-body h3 {
  margin: 0 0 4px;
  font-size: 1.15rem;
  color: #1a1118;
}

.hall-meta {
  margin: 0;
  font-size: 0.85rem;
  color: #6c757d;
}

.hall-desc {
  margin: 8px 0 14px;
  font-size: 0.85rem;
  color: #868e96;
  line-height: 1.45;
}

/* Yaxın günlərin zolağı */
.strip-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 7px;
  flex-wrap: wrap;
}

.strip-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #adb5bd;
}

.strip-free {
  font-size: 0.78rem;
  color: #8a6220;
}

.strip-free b {
  color: #721438;
}

.day-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.strip-day {
  flex: 0 0 auto;
  width: 44px;
  border: none;
  border-radius: 9px;
  padding: 6px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.15s;
}

.strip-day .wd {
  font-size: 0.62rem;
  text-transform: uppercase;
  opacity: 0.8;
}

.strip-day .dn {
  font-size: 0.95rem;
  font-weight: 700;
}

.strip-day.free {
  background: #fff;
  border: 1px solid #efe7ea;
  color: #1a1118;
}

.strip-day.free:hover {
  background: #721438;
  border-color: #721438;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(114, 20, 56, 0.22);
}

.strip-day.busy {
  background: #f6f7f8;
  border: 1px solid transparent;
  color: #ced4da;
  cursor: not-allowed;
  text-decoration: line-through;
}

.hall-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border-top: 1px solid #f1f3f5;
  padding-top: 12px;
}

.calendar-toggle {
  background: none;
  border: none;
  color: #721438;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.calendar-toggle:hover {
  text-decoration: underline;
}

.hall-calendar {
  margin-top: 16px;
  padding: 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fbf7f8 0%, #f8f4f5 100%);
  border: 1px solid #f2ecee;
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 20px;
  align-items: start;
}

.calendar-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.side-block {
  background: linear-gradient(180deg, #fdfbfc, #faf7f8);
  border: 1px solid #f2ecee;
  border-radius: 14px;
  padding: 14px 16px;
}

.side-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #b8a3ab;
  margin-bottom: 12px;
}

/* Ən yaxın boş günlər — tez seçim kartları */
.free-days {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.free-day {
  background: #fff;
  border: 1px solid #efe7ea;
  border-radius: 12px;
  padding: 9px 8px 8px;
  min-width: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.18s;
}

.free-day:hover {
  background: #721438;
  border-color: #721438;
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(114, 20, 56, 0.22);
}

.free-day:hover span {
  color: #fff !important;
}

/* Həftə sonu — toy günləri, qızılı vurğu */
.free-day.weekend {
  background: #fdf6e9;
  border-color: #f0dfbe;
}

.free-day.weekend .fd-day {
  color: #8a6220;
}

.fd-weekday {
  font-size: 0.6rem;
  color: #c2b2b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fd-day {
  font-size: 1.2rem;
  font-weight: 800;
  color: #721438;
  line-height: 1.05;
}

.fd-month {
  font-size: 0.68rem;
  color: #a89aa0;
  text-transform: lowercase;
}

.side-note {
  display: block;
  margin-top: 10px;
  font-size: 0.72rem;
  color: #b8a3ab;
  line-height: 1.5;
}

/* Zal statistikası */
.side-block.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  text-align: center;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1a1118;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.66rem;
  color: #b8a3ab;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.3;
}

.reserve-btn.wide {
  width: 100%;
  padding: 11px;
  font-size: 0.92rem;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(114, 20, 56, 0.2);
}

@media (max-width: 820px) {
  .hall-calendar {
    grid-template-columns: 1fr;
  }
}

/* Menyular — süfrə şəkli + tərkib */
.menu-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.menu-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #eaeaea;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.menu-cover {
  position: relative;
  height: 210px;
  cursor: pointer;
}

.menu-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-price-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(114, 20, 56, 0.95);
  color: #fff;
  padding: 8px 16px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.menu-price-badge strong {
  font-size: 1.35rem;
  font-weight: 800;
}

.menu-price-badge span {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.85;
}

.menu-body {
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.menu-body h3 {
  margin: 0 0 5px;
  font-size: 1.15rem;
  color: #1a1118;
}

.menu-desc {
  margin: 0 0 14px;
  font-size: 0.85rem;
  color: #868e96;
  line-height: 1.45;
}

.composition-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #8a6220;
  padding-bottom: 7px;
  border-bottom: 1px dashed #e9ecef;
  margin-bottom: 10px;
}

.composition {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
}

.composition li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.87rem;
  color: #495057;
  padding: 5px 0;
  border-bottom: 1px solid #f8f9fa;
}

.composition .dot {
  color: #dfb15b;
  font-weight: 700;
}

.cat-mini {
  margin-left: auto;
  background: #f8f9fa;
  color: #adb5bd;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}

.menu-foot {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f1f3f5;
}

.photo-btn {
  width: 100%;
  background: #fff;
  color: #721438;
  border: 1px solid #e5cdd6;
  padding: 9px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
}

.photo-btn:hover {
  background: #fdf3f6;
  border-color: #721438;
}

/* Menyu dialoqu */
.dialog-cover {
  position: relative;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}

.dialog-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dialog-desc {
  margin: 0 0 16px;
  color: #6c757d;
  font-size: 0.88rem;
}

.cat-block {
  margin-bottom: 18px;
}

.cat-title {
  margin: 0 0 10px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #8a6220;
  border-bottom: 1px dashed #e9ecef;
  padding-bottom: 6px;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.dish {
  text-align: center;
}

.dish img {
  width: 100%;
  height: 92px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 6px;
}

.dish span {
  font-size: 0.8rem;
  color: #495057;
  line-height: 1.3;
  display: block;
}

.price {
  color: #721438;
  font-weight: 700;
  font-size: 0.95rem;
}

.reserve-btn {
  background: #721438;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.87rem;
  font-weight: 600;
  transition: background 0.2s;
}

.reserve-btn:hover {
  background: #590f2b;
}

.reserve-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn {
  margin-left: 10px;
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
  color: #1a1118;
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
  color: #dfb15b;
}

.star-hint {
  margin-left: 10px;
  font-size: 0.83rem;
  color: #868e96;
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
  border-color: #dfb15b;
  background: #fffdf7;
}

.review-card.editing {
  border-color: #721438;
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
  border-color: #dfb15b;
  transform: translateY(-1px);
}

.icon-btn.danger:hover {
  border-color: #c0392b;
  background: #fdeaea;
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
  color: #1a1118;
  font-size: 0.92rem;
}

.review-stars {
  color: #dfb15b;
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
  color: #a02c4a;
}

.report-note {
  margin: 0 0 14px;
  font-size: 0.83rem;
  color: #868e96;
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
  border: 1px solid #f0eaec;
  color: #6c757d;
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.reason-chip:hover {
  border-color: #dfb15b;
}

.reason-chip.active {
  background: #721438;
  border-color: #721438;
  color: #fff;
}

.field-hint {
  font-size: 12px;
  color: #999;
}

.total-line {
  margin: 0 0 8px;
  font-size: 15px;
  color: #1a1118;
}

.total-line b {
  color: #721438;
}

.form-error {
  margin: 0;
  color: #d93025;
  font-size: 13px;
  white-space: pre-line;
}

@media (max-width: 700px) {
  .hall-card {
    flex-direction: column;
  }
  .hall-img {
    width: 100%;
    height: 180px;
  }
}

@media (max-width: 600px) {
  .main-image {
    height: 230px;
  }
  .head-row {
    flex-direction: column;
  }
}
</style>
