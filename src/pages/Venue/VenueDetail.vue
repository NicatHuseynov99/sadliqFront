<template>
  <div class="detail-page" v-loading="isLoading">
    <div v-if="venue" class="detail-inner">
      <button class="back-btn" @click="$router.back()">← Geri qayıt</button>

      <!-- Şəkil və video qalereyası -->
      <VenueGallery :venue="venue" />

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
            <IcoPhone class="ico" /> <a :href="`tel:${venue.phone.replace(/\s/g, '')}`">{{ venue.phone }}</a>
          </p>
          <p v-if="venue.parkingCapacity" class="venue-parking">
            <IcoSquareParking class="ico" /> Parkinq: <b>{{ venue.parkingCapacity }} avtomobil</b>
            <span v-if="venue.hasValetParking" class="valet-tag">valet xidməti</span>
          </p>
        </div>
        <div class="rating-box">
          <span class="rating-score"><IcoStar class="ico ico-fill" /> {{ venue.rating }}</span>
          <span class="rating-count">{{ venue.reviewCount }} rəy</span>
        </div>
      </div>

      <div class="feature-tags" v-if="venue.features?.length">
        <span v-for="f in venue.features" :key="f" class="feature-tag"><IcoCheck class="ico" /> {{ f }}</span>
      </div>

      <p class="venue-desc">{{ venue.description }}</p>

      <!-- Sorğu göndərməzdən əvvəl sarayın necə davrandığını bilmək -->
      <VenueTrust :venue-id="venue.id" />

      <!-- Məzmun sekmələrə bölünür: hamısı alt-alta olanda səhifə 3-4 ekran çəkirdi -->
      <nav class="tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="tab"
          :class="{ on: tab === t.key }"
          role="tab"
          :aria-selected="tab === t.key"
          @click="tab = t.key"
        >
          {{ t.icon }} {{ t.label }}
          <em v-if="t.count">{{ t.count }}</em>
        </button>
      </nav>

      <!-- Zallar — hər zalın öz boş/dolu günləri ilə (rezervlər zal əsaslıdır) -->
      <div v-show="tab === 'halls'" class="hall-list">
        <div v-for="h in venue.halls" :key="h.id" class="hall-card">
          <img :src="h.imageUrl || FALLBACK_IMAGE" :alt="h.name" class="hall-img" @error="onImgError" />

          <div class="hall-body">
            <div class="hall-top">
              <div>
                <h3>{{ h.name }}</h3>
                <p class="hall-meta"><IcoUsers class="ico" /> {{ h.capacity }} qonaq tutumu</p>
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
                <template v-if="openCalendars.has(h.id)"><IcoChevronUp class="ico" /> Təqvimi gizlət</template>
                <template v-else><IcoCalendarDays class="ico" /> Bütün ayı gör</template>
              </button>
              <UiButton size="sm" @click="openReserve(h)">Rezerv et</UiButton>
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

                <UiButton block @click="openReserve(h)">Bu zalı rezerv et</UiButton>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <!-- Menyular — süfrə şəkli, altında tərkibi və qiyməti -->
      <div v-show="tab === 'menus'" class="menu-list">
        <div v-for="m in venue.menus" :key="m.id" class="menu-card">
          <div class="menu-cover" @click="openMenu(m)">
            <img :src="m.coverImageUrl || FALLBACK_IMAGE" :alt="`${m.name} süfrəsi`" @error="onImgError" />
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
              <button class="photo-btn" @click="openMenu(m)"><IcoCamera class="ico" /> Yeməklərin şəkilləri</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Məkanın xəritədəki yeri -->
      <div v-show="tab === 'map'">
        <MiniMap
          :latitude="venue.latitude"
          :longitude="venue.longitude"
          :name="venue.name"
          :address="`${venue.address}, ${venue.city}`"
        />
      </div>

      <!-- Rəylər -->
      <div v-show="tab === 'reviews'">
        <VenueReviews :venue="venue" />
      </div>
    </div>

    <!-- Menyu detalı dialoqu — yeməklərin şəkilləri ilə -->
    <el-dialog v-model="menuVisible" :title="selectedMenu?.name" width="620px">
      <div v-if="selectedMenu">
        <div class="dialog-cover">
          <img :src="selectedMenu.coverImageUrl || FALLBACK_IMAGE" :alt="selectedMenu.name" @error="onImgError" />
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
              <img :src="i.imageUrl || FALLBACK_IMAGE" :alt="i.name" @error="onImgError" />
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
        <UiButton :is-loading="isSubmitting" @click="submitReserve">Sorğu göndər</UiButton>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from '@/utils/toast'
import AddressLink from '@/components/AddressLink.vue'
import MiniMap from '@/components/MiniMap.vue'
import AvailabilityCalendar from '@/components/AvailabilityCalendar.vue'
import VenueGallery from '@/components/VenueGallery.vue'
import VenueTrust from '@/components/VenueTrust.vue'
import VenueReviews from '@/components/VenueReviews.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { getVenueById, toDateKey } from '@/services/venueService'
import { formatDate, weekdayShort, MONTHS } from '@/utils/date'
import { createReservation } from '@/services/reservationService'
import { useAuthStore } from '@/store/auth'
import { FALLBACK_IMAGE, onImgError } from '@/utils/imageFallback'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const venue = ref(null)

// Səhifə sekmələrə bölünüb: hamısı bir yerdə olanda 3-4 ekran scroll olurdu
const tab = ref('halls')

const tabs = computed(() => [
  { key: 'halls', label: 'Zallar', icon: '🚪', count: venue.value?.halls?.length ?? 0 },
  { key: 'menus', label: 'Menyular', icon: '🍽', count: venue.value?.menus?.length ?? 0 },
  { key: 'reviews', label: 'Rəylər', icon: '⭐', count: venue.value?.reviewCount ?? 0 },
  { key: 'map', label: 'Yer', icon: '📍', count: 0 },
])
const isLoading = ref(false)

const menuVisible = ref(false)
const selectedMenu = ref(null)

const hallBusy = ref({})
const openCalendars = ref(new Set())

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
    // Dolu günlər sarayla birlikdə gəlir — zallar üçün ayrıca sorğu göndərilmir
    hallBusy.value = Object.fromEntries(venue.value.halls.map((h) => [h.id, h.busyDates]))
  } finally {
    isLoading.value = false
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
    toast.info('Rezerv etmək üçün əvvəlcə daxil olun.', 'Giriş tələb olunur')
    router.push('/login')
    return
  }

  if (!auth.isCustomer) {
    toast.warning('Rezervi yalnız müştəri hesabı ilə etmək olar.', 'İcazə yoxdur')
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
    toast.success(result.message)
    // Yeni rezerv edilən gün dərhal dolu kimi görünsün
    await loadVenue()
  } catch (e) {
    reserveError.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isSubmitting.value = false
  }
}

// Şəkil yüklənməsə ehtiyat şəkil qoyur
onMounted(async () => {
  await loadVenue()
})
</script>

<style scoped>
.detail-page {
  min-height: calc(100vh - 61px);
  background: var(--bg);
  padding: 24px 40px 60px;
  font-family: var(--font);
}

.detail-inner {
  max-width: var(--page-w);
  margin: 0 auto;
}

/* Toxunma sahesi: yazi 17px hundurlukde idi, mus ucun kifayetdir amma
   barmaq ucun deyil. Duz metn kimi qalir, sadece yuxari-asagi bosluq
   elave olunur. */
.back-btn {
  background: none;
  border: none;
  color: var(--brand);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 8px 0;
  margin: -8px 0 6px;
  display: inline-flex;
  align-items: center;
}

.head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.venue-name {
  margin: 0 0 6px;
  color: var(--ink);
  font-size: 1.8rem;
}

.venue-phone {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.venue-parking {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.92rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.venue-parking b {
  color: var(--ink);
}

.valet-tag {
  background: var(--info-soft);
  color: #1c5cab;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 20px;
}

/* Telefon nomresi zeng ucun basilir — 121x20 sahe barmaq ucun
   alcaqdir. Yazi eyni qalir, sahe boyuyur. */
.venue-phone a {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  color: var(--muted);
  text-decoration: none;
}

.venue-phone a:hover {
  color: var(--brand);
  text-decoration: underline;
}

.rating-box {
  text-align: center;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.rating-score {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--gold-ink);
}

.rating-count {
  font-size: 0.78rem;
  color: var(--muted-2);
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.feature-tag {
  background: #fdf3e0;
  color: var(--gold-ink);
  font-size: 12px;
  padding: 4px 11px;
  border-radius: 20px;
  font-weight: 600;
}

.venue-desc {
  margin: 10px 0 0;
  color: var(--ink-2);
  line-height: 1.65;
  font-size: 0.95rem;
}

/* Sekmə sətri — yapışıq qalır ki, uzun siyahıda da əlçatan olsun */
/* Telefonda 4 tab (Zallar/Menyular/Rəylər/Yer) 362px sahəyə sığmır
   (403px) — sonuncu tab kəsik pin ikonu kimi görünürdü, sürüşdürmək
   lazım olduğu heç yerdə bildirilmirdi. Panelin başqa lentlərində
   olduğu kimi sağ kənara solğunlaşma və gizli sürüşdürücü zolaq. */
.tabs {
  display: flex;
  gap: 6px;
  margin: 22px 0 18px;
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: var(--header-h);
  background: var(--bg);
  z-index: 5;
  padding-top: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  mask-image: linear-gradient(to right, #000 calc(100% - 26px), transparent);
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 26px), transparent);
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--muted);
  padding: 10px 16px;
  font-size: var(--fs-sm);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--t-fast), border-color var(--t-fast);
}

.tab:hover {
  color: var(--brand);
}

.tab.on {
  color: var(--brand);
  border-bottom-color: var(--brand);
}

.tab em {
  font-style: normal;
  color: var(--faint);
  margin-left: 4px;
  font-size: var(--fs-xs);
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
  border: 1px solid var(--line);
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
  color: var(--ink);
}

.hall-meta {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.hall-desc {
  margin: 8px 0 14px;
  font-size: 0.85rem;
  color: var(--muted);
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
  color: var(--muted-2);
}

.strip-free {
  font-size: 0.78rem;
  color: var(--gold-ink);
}

.strip-free b {
  color: var(--brand);
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

/* 0.62rem = 9.9px — telefonda oxunmurdu. Gün adı qısa olduğuna görə
   böyüdülməsi zolağın enini dəyişmir. */
.strip-day .wd {
  font-size: 0.7rem;
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
  color: var(--ink);
}

.strip-day.free:hover {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(114, 20, 56, 0.22);
}

.strip-day.busy {
  background: var(--surface-2);
  border: 1px solid transparent;
  color: var(--faint);
  cursor: not-allowed;
  text-decoration: line-through;
}

.hall-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--surface-2);
  padding-top: 12px;
}

.calendar-toggle {
  background: none;
  border: none;
  color: var(--brand);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 9px 4px;
  margin: -9px -4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.calendar-toggle:hover {
  text-decoration: underline;
}

.hall-calendar {
  margin-top: 16px;
  padding: 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fbf7f8 0%, #f8f4f5 100%);
  border: 1px solid var(--line);
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
  background: linear-gradient(180deg, #fdfbfc, var(--bg));
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 16px;
}

.side-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted-2);
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
  background: var(--brand);
  border-color: var(--brand);
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
  color: var(--gold-ink);
}

.fd-weekday {
  font-size: 0.6rem;
  color: var(--muted-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fd-day {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--brand);
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
  color: var(--muted-2);
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
  color: var(--ink);
  line-height: 1.1;
}

.stat-label {
  font-size: 0.66rem;
  color: var(--muted-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.3;
}

/* minmax(0, 1fr): sadə «1fr» sütunu məzmundan dar ola bilmir — 360px
   telefonda təqvim qabından 26px kənara çıxır və sağ sütunu kəsilirdi. */
@media (max-width: 820px) {
  .hall-calendar {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Telefonda iç-içə üç çərçivə (zal kartı → boz qab → təqvim kartı) eni
   yeyirdi. Boz qab götürülür, təqvim kartın tam enini tutur. */
@media (max-width: 600px) {
  .hall-calendar {
    padding: 0;
    gap: 12px;
    background: none;
    border: none;
  }

  .side-block {
    padding: 12px;
  }

  .free-days {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(54px, 1fr));
  }

  .free-day {
    min-width: 0;
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
  border: 1px solid var(--line);
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
  color: var(--ink);
}

.menu-desc {
  margin: 0 0 14px;
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.45;
}

.composition-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gold-ink);
  padding-bottom: 7px;
  border-bottom: 1px dashed var(--line);
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
  color: var(--ink-2);
  padding: 5px 0;
  border-bottom: 1px solid var(--surface-2);
}

.composition .dot {
  color: var(--gold);
  font-weight: 700;
}

.cat-mini {
  margin-left: auto;
  background: var(--surface-2);
  color: var(--muted-2);
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}

.menu-foot {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--surface-2);
}

.photo-btn {
  width: 100%;
  background: #fff;
  color: var(--brand);
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
  border-color: var(--brand);
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
  color: var(--muted);
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
  color: var(--gold-ink);
  border-bottom: 1px dashed var(--line);
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
  color: var(--ink-2);
  line-height: 1.3;
  display: block;
}

.price {
  color: var(--brand);
  font-weight: 700;
  font-size: 0.95rem;
}

.field-hint {
  font-size: 12px;
  color: #999;
}

.total-line {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--ink);
}

.total-line b {
  color: var(--brand);
}

.form-error {
  margin: 0;
  color: var(--danger);
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
  .head-row {
    flex-direction: column;
  }

  /* Zal statistikası və düymələr telefonda sıxılmasın */
  .side-block.stats {
    grid-template-columns: 1fr;
  }

  .hall-footer {
    flex-direction: column;
    gap: 8px;
  }

  .hall-footer button {
    width: 100%;
  }

  .day-strip {
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .detail-page {
    padding: 20px 14px 50px;
  }
}
</style>
