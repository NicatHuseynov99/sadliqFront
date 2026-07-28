<template>
  <div class="site-wrapper">
    <!-- HERO & SEARCH SECTION -->
    <section class="hero-section">
      <div class="hero-content">
        <span class="badge-top">Bakı · Sumqayıt · Gəncə · Quba — 350+ Məkan</span>
        <h1>Xəyallarınızdakı Toy Məkanını Kəşf Edin</h1>
        <p>Bakı və bölgələrdə ən məşhur şadlıq sarayları, zallar və özəl tədbir məkanları.</p>

        <!-- Axtarış və Zəngin Filtr Paneli -->
        <div class="search-box">
          <div class="search-grid">
            <div class="field">
              <label>Axtarış</label>
              <input v-model="filters.searchQuery" type="text" placeholder="Restoran adı və ya ünvan..." />
            </div>

            <div class="field">
              <label>Şəhər / Bölgə</label>
              <select v-model="filters.city">
                <option value="">Bütün şəhərlər</option>
                <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <div class="field">
              <label>Tədbir tarixi</label>
              <input v-model="filters.date" type="date" :min="todayKey" />
            </div>

            <div class="field">
              <label>Qonaq sayı</label>
              <input v-model.number="filters.capacity" type="number" min="0" placeholder="Min. qonaq sayı" />
            </div>

            <div class="field">
              <label>Maks. Menyu Qiyməti</label>
              <div class="budget-row">
                <input v-model.number="filters.maxPrice" type="range" min="20" max="100" step="5" />
                <span class="budget-val">{{ filters.maxPrice ? filters.maxPrice + ' ₼' : 'Hamısı' }}</span>
              </div>
            </div>

            <button @click="resetFilters" class="reset-btn">Təmizlə</button>
          </div>

          <!-- Sürətli Filtrlər (Chips) -->
          <div class="quick-chips">
            <span class="chips-label">Sürətli:</span>
            <button class="chip" @click="toggleQuick('big')" :aria-pressed="quickFilters.big">500+ qonaq</button>
            <button class="chip" @click="toggleQuick('cheap')" :aria-pressed="quickFilters.cheap">45 ₼-a qədər</button>
            <button class="chip" @click="toggleQuick('baku')" :aria-pressed="quickFilters.baku">Yalnız Bakı</button>
            <button class="chip" @click="setWeekend" >Bu həftə sonu boş olanlar</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Restoranlar Siyahısı -->
    <section class="venues-container" v-loading="isLoading">
      <div class="results-header">
        <h2>Mövcud Saraylar <span>({{ totalCount }})</span></h2>
        <div class="sort-box">
          <label>Sıralama:</label>
          <select v-model="filters.sort">
            <option value="rating-desc">Reytinq — ən yüksək</option>
            <option value="price-asc">Qiymət — ucuzdan bahaya</option>
            <option value="price-desc">Qiymət — bahadan ucuza</option>
          </select>
        </div>
      </div>

      <div v-if="!isLoading && venues.length === 0" class="no-result">
        <h3>Axtarışınıza uyğun heç bir saray tapılmadı.</h3>
        <p>Filtrləri dəyişərək yenidən yoxlaya bilərsiniz.</p>
        <button @click="resetFilters" class="btn-reset-empty">Filtrləri sıfırla</button>
      </div>

      <div v-else class="venues-grid">
        <div v-for="venue in venues" :key="venue.id" class="venue-card">
          <div class="image-wrapper">
            <img :src="venue.coverImageUrl" :alt="venue.name" class="venue-img" @error="onImgError" />
            <span class="badge">{{ venue.city }}</span>
            <button class="fav-btn" :aria-pressed="state.favs.has(venue.id)" @click="toggleFav(venue.id)" aria-label="Seçilmişlərə əlavə et">♥</button>

            <div class="card-price-tag">
              <strong>Min. {{ getMinMenuPrice(venue) }} ₼</strong>
              <span>1 nəfər üçün</span>
            </div>
          </div>

          <div class="venue-info">
            <div class="title-row">
              <h3>{{ venue.name }}</h3>
              <span class="rating-pill">★ {{ venue.rating }}</span>
            </div>

            <div class="avail-row">
              <span v-if="filters.date" class="avail-badge free">
                ✅ {{ formatDate(filters.date) }} — boşdur ({{ freeHallCount(venue, filters.date) }} zal)
              </span>
              <template v-else-if="nearestDates[venue.id] !== undefined">
                <span v-if="nearestDates[venue.id]" class="avail-badge free">
                  ✅ Ən yaxın boş tarix: <b>{{ formatDate(nearestDates[venue.id]) }}</b>
                </span>
                <span v-else class="avail-badge busy">⛔ Yaxın 4 ayda boş tarix yoxdur</span>
              </template>
            </div>
            <div class="address-row">
              <AddressLink
                compact
                :address="venue.address"
                :city="venue.city"
                :latitude="venue.latitude"
                :longitude="venue.longitude"
              />
              <span class="rev-count">· {{ venue.reviewCount }} rəy</span>
            </div>
            <p class="description">{{ venue.description }}</p>

            <div class="halls-preview">
              <span v-for="hall in venue.halls" :key="hall.id" class="hall-tag">
                {{ hall.name }} (Max: {{ hall.capacity }} nəfər)
              </span>
            </div>

            <!-- Menyuların şəkilli önizləməsi -->
            <div class="menu-preview">
              <span class="menu-preview-label">Menyular</span>
              <div class="menu-chips">
                <div
                  v-for="m in venue.menus"
                  :key="m.id"
                  class="menu-chip"
                  @click="selectVenue(venue)"
                >
                  <img :src="m.coverImageUrl" :alt="m.name" @error="onImgError" />
                  <div class="menu-chip-text">
                    <strong>{{ m.name }}</strong>
                    <span>₼{{ m.pricePerPerson }}/nəfər</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="venue-footer">
              <div class="menus-summary">
                <small>{{ venue.halls.length }} zal · {{ venue.menus.length }} menyu</small>
              </div>
              <button @click="selectVenue(venue)" class="detail-btn">Seç / Bax</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sonsuz scroll: bu element ekrana girəndə növbəti səhifə yüklənir -->
      <div ref="sentinel" class="scroll-sentinel">
        <div v-if="isLoadingMore" class="loading-more">
          <span class="spinner"></span> Daha çox saray yüklənir...
        </div>
        <p v-else-if="!hasMore && venues.length > 0" class="list-end">
          Bütün saraylar göstərildi ({{ totalCount }})
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import AddressLink from '@/components/AddressLink.vue'
import { searchVenues, getNearestFreeDate, buildBusyMap, toDateKey } from '@/services/venueService'
import { formatDate } from '@/utils/date'

const PAGE_SIZE = 12

const router = useRouter()

const venues = ref([])
const totalCount = ref(0)
const page = ref(1)
const hasMore = ref(false)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const nearestDates = ref({})
const busyMap = ref({})
const sentinel = ref(null)

const todayKey = toDateKey(new Date())

// Şəhər siyahısı bütün saraylardan asılı olduğu üçün sabit saxlanılır
// (səhifələnmiş siyahıdan çıxarılsa, hər scroll-da dəyişərdi)
const cities = ['Bakı', 'Sumqayıt', 'Gəncə', 'Xırdalan', 'Quba', 'Şəki', 'Lənkəran', 'Mingəçevir']

const filters = reactive({
  searchQuery: '',
  city: '',
  date: '',
  capacity: null,
  maxPrice: null,
  sort: 'rating-desc'
})

// Filtrləri backend-in gözlədiyi query parametrlərinə çevirir
const buildParams = (pageNumber) => ({
  q: filters.searchQuery || undefined,
  city: filters.city || undefined,
  date: filters.date || undefined,
  capacity: filters.capacity || undefined,
  maxPrice: filters.maxPrice || undefined,
  sort: filters.sort,
  page: pageNumber,
  pageSize: PAGE_SIZE,
})

// Yeni gələn sarayların dolu günlərini və ən yaxın boş tarixini hesablayıb yaddaşa yazır
const indexVenues = (list) => {
  busyMap.value = { ...busyMap.value, ...buildBusyMap(list) }
  const nearest = {}
  for (const v of list) nearest[v.id] = getNearestFreeDate(v)
  nearestDates.value = { ...nearestDates.value, ...nearest }
}

// Siyahını sıfırdan yükləyir (ilk açılış və hər filtr dəyişikliyində)
const loadFirstPage = async () => {
  isLoading.value = true
  try {
    const result = await searchVenues(buildParams(1))
    venues.value = result.items
    totalCount.value = result.totalCount
    hasMore.value = result.hasMore
    page.value = 1
    indexVenues(result.items)
  } finally {
    isLoading.value = false
  }
}

// Növbəti səhifəni yükləyib mövcud siyahının sonuna əlavə edir (sonsuz scroll)
const loadNextPage = async () => {
  if (!hasMore.value || isLoading.value || isLoadingMore.value) return

  isLoadingMore.value = true
  try {
    const result = await searchVenues(buildParams(page.value + 1))
    venues.value = [...venues.value, ...result.items]
    totalCount.value = result.totalCount
    hasMore.value = result.hasMore
    page.value = result.page
    indexVenues(result.items)
  } finally {
    isLoadingMore.value = false
  }
}

// Filtr dəyişəndə sorğunu bir az gecikdiririk ki, hər hərf üçün sorğu getməsin
let filterTimer = null
watch(filters, () => {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(loadFirstPage, 350)
})

// Siyahının sonundakı element ekrana girəndə növbəti səhifə yüklənir
let observer = null
onMounted(async () => {
  await loadFirstPage()

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadNextPage()
    },
    { rootMargin: '300px' },
  )

  if (sentinel.value) observer.observe(sentinel.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(filterTimer)
})

// Seçilən tarixdə boş olan zalların sayı
const freeHallCount = (venue, dateKey) =>
  venue.halls.filter((h) => !(busyMap.value[h.id]?.has(dateKey))).length

// Növbəti şənbə tarixini filtrə yazır
const setWeekend = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7))
  filters.date = toDateKey(d)
}

const state = reactive({
  favs: new Set()
})

const quickFilters = reactive({
  big: false,
  cheap: false,
  baku: false
})

const toggleQuick = (key) => {
  quickFilters[key] = !quickFilters[key]
  if (key === 'big') filters.capacity = quickFilters.big ? 500 : null
  if (key === 'cheap') filters.maxPrice = quickFilters.cheap ? 45 : null
  if (key === 'baku') filters.city = quickFilters.baku ? 'Bakı' : ''
}

// Kartda göstərilən minimum menyu qiyməti
const getMinMenuPrice = (venue) => {
  if (!venue.menus || venue.menus.length === 0) return 0
  return Math.min(...venue.menus.map(m => m.pricePerPerson))
}

const resetFilters = () => {
  filters.searchQuery = ''
  filters.city = ''
  filters.date = ''
  filters.capacity = null
  filters.maxPrice = null
  filters.sort = 'rating-desc'
  Object.keys(quickFilters).forEach(k => quickFilters[k] = false)
}

const toggleFav = (id) => {
  state.favs.has(id) ? state.favs.delete(id) : state.favs.add(id)
}

// Kart seçiləndə sarayın detal səhifəsinə keçid edir
const selectVenue = (venue) => {
  router.push({ name: 'venue-detail', params: { id: venue.id } })
}

// Şəkil yüklənməsə ehtiyat şəkil qoyur ki, kart boş görünməsin
const onImgError = (e) => {
  e.target.src = 'https://picsum.photos/seed/sadliq/900/600'
}
</script>

<style scoped>
.site-wrapper {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2c3e50;
  background-color: #f4f6f8;
  min-height: 100vh;
  padding-bottom: 60px;
}

.hero-section {
  background: linear-gradient(rgba(26, 17, 24, 0.75), rgba(26, 17, 24, 0.75)), url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80') center/cover;
  padding: 60px 20px;
  text-align: center;
  color: white;
}

.badge-top {
  display: inline-block;
  background: rgba(197, 155, 71, 0.2);
  color: #dfb15b;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hero-content h1 {
  font-size: 2.4rem;
  margin-bottom: 12px;
  font-weight: 600;
}

.hero-content p {
  font-size: 1.05rem;
  opacity: 0.85;
  max-width: 600px;
  margin: 0 auto;
}

.search-box {
  margin-top: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: inline-block;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  max-width: 1200px;
  width: 100%;
  text-align: left;
}

.search-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 0.9fr 1.1fr auto;
  gap: 12px;
  align-items: end;
}

.field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6c757d;
  margin-bottom: 5px;
}

.field input, .field select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  color: #212529;
}

.field input:focus, .field select:focus {
  border-color: #dfb15b;
  outline: none;
  box-shadow: 0 0 0 3px rgba(223, 177, 91, 0.15);
}

.budget-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 6px 10px;
}

.budget-row input[type=range] {
  flex: 1;
  padding: 0;
  accent-color: #721438;
}

.budget-val {
  font-weight: 600;
  font-size: 0.85rem;
  color: #721438;
  white-space: nowrap;
}

.reset-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 11px 16px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  height: 41px;
}

.reset-btn:hover {
  background: #c82333;
}

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
  align-items: center;
}

.chips-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #6c757d;
  margin-right: 5px;
}

.chip {
  border: 1px solid #ced4da;
  background: #f8f9fa;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.chip:hover {
  border-color: #dfb15b;
  color: #212529;
}

.chip[aria-pressed="true"] {
  background: #1a1118;
  border-color: #1a1118;
  color: #fff;
}

.scroll-sentinel {
  min-height: 40px;
  display: grid;
  place-items: center;
  margin-top: 28px;
}

.loading-more {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6c757d;
  font-size: 0.9rem;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e9ecef;
  border-top-color: #721438;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.list-end {
  color: #adb5bd;
  font-size: 0.85rem;
  margin: 0;
}

.venues-container {
  max-width: 1360px;
  margin: 40px auto;
  padding: 0 40px;
  min-height: 200px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.results-header h2 {
  font-size: 1.6rem;
  color: #1a1118;
}

.results-header h2 span {
  color: #721438;
}

.sort-box {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #6c757d;
}

.sort-box select {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: #fff;
  font-size: 0.9rem;
}

.no-result {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.no-result h3 {
  font-size: 1.4rem;
  color: #333;
  margin-bottom: 8px;
}

.no-result p {
  color: #666;
  margin-bottom: 20px;
}

.btn-reset-empty {
  background: #1a1118;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.venues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.venue-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #eaeaea;
}

.venue-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.image-wrapper {
  position: relative;
  height: 220px;
}

.venue-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 4px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.fav-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  color: #721438;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: transform 0.2s;
}

.fav-btn:hover {
  transform: scale(1.1);
}

.fav-btn[aria-pressed="true"] {
  background: #721438;
  color: #fff;
}

.card-price-tag {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.card-price-tag strong {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.1;
}

.card-price-tag span {
  font-size: 0.65rem;
  text-transform: uppercase;
  opacity: 0.8;
}

.venue-info {
  padding: 18px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.title-row h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a1118;
}

.rating-pill {
  background: #fdf3e0;
  color: #b07d2b;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 3px 9px;
  border-radius: 20px;
  white-space: nowrap;
}

.rev-count {
  color: #adb5bd;
  font-size: 0.8rem;
}

.avail-row {
  margin-bottom: 8px;
}

.avail-badge {
  display: inline-block;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.avail-badge.free {
  background: #e8f6ec;
  color: #1e7e34;
}

.avail-badge.busy {
  background: #fdeaea;
  color: #c0392b;
}

.address-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.menu-preview {
  margin-bottom: 14px;
}

.menu-preview-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #adb5bd;
  margin-bottom: 7px;
}

.menu-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.menu-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f9fa;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 5px 10px 5px 5px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.menu-chip:hover {
  border-color: #dfb15b;
  background: #fffaf0;
}

.menu-chip img {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
}

.menu-chip-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.menu-chip-text strong {
  font-size: 0.8rem;
  color: #1a1118;
}

.menu-chip-text span {
  font-size: 0.72rem;
  color: #721438;
  font-weight: 600;
}

.description {
  font-size: 0.88rem;
  color: #495057;
  margin-bottom: 14px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.halls-preview {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hall-tag {
  background: #f1f3f5;
  color: #495057;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.venue-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f3f5;
  padding-top: 12px;
  margin-top: auto;
  gap: 10px;
}

.menus-summary small {
  color: #6c757d;
  font-size: 0.75rem;
  display: block;
  max-width: 170px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-btn {
  background: #721438;
  color: white;
  border: none;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  transition: background 0.2s;
  white-space: nowrap;
}

.detail-btn:hover {
  background: #590f2b;
}

@media (max-width: 900px) {
  .search-grid {
    grid-template-columns: 1fr 1fr;
  }
  .reset-btn {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .search-grid {
    grid-template-columns: 1fr;
  }
  .venues-grid {
    grid-template-columns: 1fr;
  }
  .venues-container {
    padding: 0 16px;
  }
}
</style>
