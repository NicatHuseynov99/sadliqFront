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
              <span class="price">₼{{ h.minPrice }}-dən / nəfər</span>
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
              <AvailabilityCalendar :hall-id="h.id" @select="(key) => onDateSelect(h, key)" />
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
              <span>1 nəfər</span>
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
              <div class="calc">
                <span class="calc-label">100 nəfər üçün</span>
                <strong>{{ (m.pricePerPerson * 100).toLocaleString() }} ₼</strong>
              </div>
              <button class="photo-btn" @click="openMenu(m)">📷 Yeməklərin şəkilləri</button>
            </div>
          </div>
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
          <span class="review-date">{{ formatDateFull(r.date) }}</span>
        </div>
      </div>
      <el-empty v-else description="Hələ rəy yoxdur" />
    </div>

    <!-- Menyu detalı dialoqu — yeməklərin şəkilləri ilə -->
    <el-dialog v-model="menuVisible" :title="selectedMenu?.name" width="620px">
      <div v-if="selectedMenu">
        <div class="dialog-cover">
          <img :src="selectedMenu.coverImageUrl" :alt="selectedMenu.name" @error="onImgError" />
          <div class="menu-price-badge">
            <strong>{{ selectedMenu.pricePerPerson }} ₼</strong>
            <span>1 nəfər</span>
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
import AddressLink from '@/components/AddressLink.vue'
import AvailabilityCalendar from '@/components/AvailabilityCalendar.vue'
import { getVenueById, getHallBusyDates, toDateKey } from '@/services/venueService'
import { formatDate, formatDateFull, weekdayShort } from '@/utils/date'
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
    await loadHallBusy()
  } finally {
    isLoading.value = false
  }
}

// Hər zalın dolu günlərini yükləyir — rezervlər zal əsaslı olduğu üçün ayrı-ayrı saxlanılır
const loadHallBusy = async () => {
  const entries = await Promise.all(
    venue.value.halls.map(async (h) => [h.id, await getHallBusyDates(h.id)]),
  )
  hallBusy.value = Object.fromEntries(entries)
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

// Rezerv təqvimi üçün seçilən zalın dolu günlərini yükləyir (artıq yüklənibsə təkrar sorğu getmir)
const loadAvailability = async (hallId) => {
  if (hallBusy.value[hallId]) {
    busyDates.value = hallBusy.value[hallId]
    return
  }

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
    // Yeni rezerv edilən gün dərhal dolu kimi görünsün
    await loadHallBusy()
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
  color: #1e7e34;
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
  background: #e8f6ec;
  color: #1e7e34;
}

.strip-day.free:hover {
  background: #1e7e34;
  color: #fff;
  transform: translateY(-2px);
}

.strip-day.busy {
  background: #fdeaea;
  color: #c0392b;
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
  margin-top: 14px;
  max-width: 420px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f1f3f5;
}

.calc {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.calc-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #adb5bd;
  font-weight: 600;
}

.calc strong {
  font-size: 1.05rem;
  color: #721438;
}

.photo-btn {
  background: #fff;
  color: #721438;
  border: 1px solid #e5cdd6;
  padding: 7px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
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
