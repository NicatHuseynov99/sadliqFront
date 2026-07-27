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
          <p class="venue-loc">📍 {{ venue.address }}, {{ venue.city }}</p>
          <p class="venue-phone">📞 {{ venue.phone }}</p>
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

      <!-- Zallar -->
      <h2 class="section-title">Zallar</h2>
      <div class="hall-list">
        <div v-for="h in venue.halls" :key="h.id" class="hall-card">
          <img :src="h.imageUrl" :alt="h.name" class="hall-img" @error="onImgError" />
          <div class="hall-body">
            <h3>{{ h.name }}</h3>
            <p class="hall-meta">👥 {{ h.capacity }} qonaq tutumu</p>
            <p class="hall-desc">{{ h.description }}</p>
            <div class="hall-footer">
              <span class="price">₼{{ h.minPrice }}-dən / nəfər</span>
              <button class="reserve-btn" @click="openReserve(h)">Rezerv et</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Menyular -->
      <h2 class="section-title">Menyular</h2>
      <div class="menu-list">
        <div v-for="m in venue.menus" :key="m.id" class="menu-card">
          <div class="menu-head">
            <h3>{{ m.name }}</h3>
            <span class="price">₼{{ m.pricePerPerson }}/nəfər</span>
          </div>
          <ul>
            <li v-for="i in m.items" :key="i.id">{{ i.name }}</li>
          </ul>
        </div>
      </div>

      <!-- Rəylər -->
      <h2 class="section-title">Qonaq rəyləri</h2>
      <div class="review-list" v-if="venue.reviews?.length">
        <div v-for="r in venue.reviews" :key="r.id" class="review-card">
          <div class="review-head">
            <span class="review-author">{{ r.author }}</span>
            <span class="review-stars">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
          </div>
          <p class="review-text">{{ r.text }}</p>
          <span class="review-date">{{ r.date }}</span>
        </div>
      </div>
      <el-empty v-else description="Hələ rəy yoxdur" />
    </div>

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
          <span class="field-hint" v-if="availLoading">Dolu günlər yoxlanılır...</span>
          <span class="field-hint" v-else>Dolu günlər təqvimdə bağlıdır.</span>
        </el-form-item>

        <el-form-item label="Menyu">
          <el-select v-model="reserveForm.menuId" placeholder="Menyu seçin" style="width: 100%">
            <el-option
              v-for="m in venue?.menus ?? []"
              :key="m.id"
              :value="m.id"
              :label="`${m.name} — ₼${m.pricePerPerson}/nəfər`"
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
          Təxmini məbləğ: <b>₼{{ estimatedTotal.toLocaleString() }}</b>
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
import { getVenueById, getHallBusyDates } from '@/services/venueService'
import { createReservation } from '@/services/reservationService'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const venue = ref(null)
const isLoading = ref(false)
const activeImage = ref('')

const reserveVisible = ref(false)
const selectedHall = ref(null)
const isSubmitting = ref(false)
const reserveError = ref('')
const availLoading = ref(false)
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
  } finally {
    isLoading.value = false
  }
}

// Seçilən zalın dolu/tutulmuş günlərini yükləyir ki, təqvimdə bağlansın
const loadAvailability = async (hallId) => {
  availLoading.value = true
  try {
    busyDates.value = await getHallBusyDates(hallId)
  } finally {
    availLoading.value = false
  }
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
    const menu = venue.value.menus.find((m) => m.id === reserveForm.menuId)
    const result = await createReservation({
      venueId: venue.value.id,
      venueName: venue.value.name,
      hallId: selectedHall.value.id,
      hallName: selectedHall.value.name,
      menuId: reserveForm.menuId,
      menuName: menu?.name,
      pricePerPerson: menu?.pricePerPerson,
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
  padding: 24px 20px 60px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.detail-inner {
  max-width: 1000px;
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
  height: 380px;
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

.venue-loc,
.venue-phone {
  margin: 0 0 4px;
  color: #6c757d;
  font-size: 0.92rem;
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}

.hall-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #eaeaea;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.hall-card:hover {
  transform: translateY(-3px);
}

.hall-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.hall-body {
  padding: 14px 16px 16px;
}

.hall-body h3 {
  margin: 0 0 6px;
  font-size: 1.05rem;
  color: #1a1118;
}

.hall-meta {
  margin: 0 0 6px;
  font-size: 0.85rem;
  color: #6c757d;
}

.hall-desc {
  margin: 0 0 12px;
  font-size: 0.83rem;
  color: #868e96;
  line-height: 1.4;
}

.hall-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f3f5;
  padding-top: 10px;
}

.menu-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.menu-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 18px;
  border: 1px solid #eaeaea;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.menu-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed #e9ecef;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.menu-head h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #1a1118;
}

.menu-card ul {
  margin: 0;
  padding-left: 18px;
  font-size: 0.87rem;
  color: #495057;
  line-height: 1.7;
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

@media (max-width: 600px) {
  .main-image {
    height: 230px;
  }
  .head-row {
    flex-direction: column;
  }
}
</style>
