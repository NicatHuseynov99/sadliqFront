<template>
  <div class="site-wrapper">
    <!-- HERO & SEARCH SECTION -->
    <section class="hero-section">
      <div class="hero-content">
        <span class="badge-top">{{ options.cities.length }} şəhər · {{ totalCount }} məkan</span>
        <h1>Xəyallarınızdakı Toy Məkanını Kəşf Edin</h1>
        <p>Bakı və bölgələrdə ən məşhur şadlıq sarayları, zallar və özəl tədbir məkanları.</p>

        <!-- Axtarış və filtr paneli -->
        <div class="search-box">
          <div class="search-main">
            <span class="search-icon">🔍</span>
            <input
              v-model="filters.searchQuery"
              type="text"
              class="search-input"
              placeholder="Saray adı və ya ünvan yazın..."
            />
            <button class="search-clear" v-if="filters.searchQuery" @click="filters.searchQuery = ''">✕</button>
          </div>

          <div class="search-grid">
            <div class="field">
              <label>Şəhər</label>
              <select v-model="filters.city">
                <option value="">Bütün şəhərlər</option>
                <option v-for="c in options.cities" :key="c.name" :value="c.name">
                  {{ c.name }} ({{ c.count }})
                </option>
              </select>
            </div>

            <div class="field">
              <label>Neçə qonaq gözləyirsiniz?</label>
              <input
                v-model.number="filters.capacity"
                type="number"
                min="0"
                step="50"
                placeholder="məs. 250"
              />
              <div class="mini-chips">
                <button
                  v-for="c in capacityOptions"
                  :key="c"
                  class="mini-chip"
                  :aria-pressed="filters.capacity === c"
                  @click="filters.capacity = filters.capacity === c ? null : c"
                >
                  {{ c }}
                </button>
              </div>
            </div>

            <div class="field">
              <label>Ümumi büdcəniz</label>
              <div class="input-suffix">
                <input v-model.number="filters.budget" type="number" min="0" step="500" placeholder="məs. 12000" />
                <span>₼</span>
              </div>
              <span class="field-hint">{{ budgetHint }}</span>
            </div>

            <div class="field field-wide">
              <label>
                Bir nəfər üçün qiymət
                <b class="range-val">{{ filters.priceRange[0] }} – {{ filters.priceRange[1] }} ₼</b>
              </label>
              <el-slider
                v-model="filters.priceRange"
                range
                :min="options.minPrice"
                :max="options.maxPrice"
                :step="5"
                class="price-slider"
              />
            </div>
          </div>

          <!-- Reytinq -->
          <div class="chip-row">
            <span class="chips-label">Reytinq</span>
            <button
              v-for="r in ratingOptions"
              :key="r"
              class="chip chip-star"
              :aria-pressed="filters.minRating === r"
              @click="filters.minRating = filters.minRating === r ? null : r"
            >
              ★ {{ r }}+
            </button>

            <span class="chips-label divider-label">Özəlliklər</span>
            <button
              v-for="f in options.features"
              :key="f.name"
              class="chip"
              :aria-pressed="filters.features.includes(f.name)"
              @click="toggleFeature(f.name)"
            >
              {{ f.name }} <em>{{ f.count }}</em>
            </button>

            <button v-if="hasActiveFilters" class="clear-link" @click="resetFilters">
              Təmizlə ({{ activeFilterCount }}) ✕
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Restoranlar Siyahısı -->
    <section class="venues-container" v-loading="isLoading">
      <div class="results-header">
        <h2>Mövcud Saraylar <span>({{ totalCount }})</span></h2>

        <div class="header-tools">
          <!-- Siyahı və xəritə eyni süzgəclərlə işləyir -->
          <div class="view-switch">
            <button :class="{ active: view === 'list' }" @click="view = 'list'">☰ Siyahı</button>
            <button :class="{ active: view === 'map' }" @click="view = 'map'">🗺 Xəritə</button>
          </div>

          <div class="sort-box" v-if="view === 'list'">
            <label>Sıralama:</label>
            <select v-model="filters.sort">
              <option value="rating-desc">Reytinq — ən yüksək</option>
              <option value="price-asc">Qiymət — ucuzdan bahaya</option>
              <option value="price-desc">Qiymət — bahadan ucuza</option>
            </select>
          </div>
        </div>
      </div>

      <VenueMap
        v-if="view === 'map'"
        :filters="mapFilters"
        @select="selectVenue"
        @count="totalCount = $event"
      />

      <template v-else>
      <div v-if="!isLoading && venues.length === 0" class="no-result">
        <h3>Axtarışınıza uyğun heç bir saray tapılmadı.</h3>
        <p>Filtrləri dəyişərək yenidən yoxlaya bilərsiniz.</p>
        <button @click="resetFilters" class="btn-reset-empty">Filtrləri sıfırla</button>
      </div>

      <div v-else class="venues-grid">
        <VenueCard
          v-for="venue in venues"
          :key="venue.id"
          :venue="venue"
          :is-favorite="favoriteIds.has(venue.id)"
          :nearest-date="nearestDates[venue.id]"
          @select="selectVenue"
          @toggle-favorite="onToggleFavorite"
        />
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
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import VenueCard from '@/components/VenueCard.vue'
import VenueMap from '@/components/VenueMap.vue'
import {
  searchVenues,
  getFilterOptions,
  getNearestFreeDate,
  buildBusyMap,
} from '@/services/venueService'
import { getMyFavoriteIds, toggleFavorite } from '@/services/favoriteService'
import { trackPage } from '@/services/visitService'
import { useAuthStore } from '@/store/auth'

const PAGE_SIZE = 12

// «list» və ya «map» — seçim səhifə yenilənəndə sıfırlanır
const view = ref('list')

// Tez seçim üçün tipik qonaq sayları (bazadakı tutumlar 150-800 arasındadır)
const capacityOptions = [150, 250, 400, 600]

// Reytinq həddi seçimləri
const ratingOptions = [4.5, 4]

const router = useRouter()
const auth = useAuthStore()

const favoriteIds = ref(new Set())

const venues = ref([])
const totalCount = ref(0)
const page = ref(1)
const hasMore = ref(false)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const nearestDates = ref({})
const busyMap = ref({})
const sentinel = ref(null)

// Filtr seçimləri (şəhərlər, özəlliklər, qiymət aralığı) bazadan gəlir
const options = ref({ cities: [], features: [], minPrice: 30, maxPrice: 100 })

const filters = reactive({
  searchQuery: '',
  city: '',
  capacity: null,
  budget: null,
  minRating: null,
  priceRange: [30, 100],
  features: [],
  sort: 'rating-desc'
})

// Qiymət aralığı toxunulmayıbsa serverə göndərilmir
const isFullPriceRange = () =>
  filters.priceRange[0] <= options.value.minPrice && filters.priceRange[1] >= options.value.maxPrice

// Büdcə qonaq sayı ilə birlikdə işləyir — istifadəçiyə nə demək olduğunu izah edirik
const budgetHint = computed(() => {
  if (!filters.budget) return 'Qonaq sayı ilə birlikdə işləyir'
  if (!filters.capacity) return 'Qonaq sayını yazsanız daha dəqiq olar'
  return `≈ ${Math.floor(filters.budget / filters.capacity)} ₼ / nəfər`
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.searchQuery) count++
  if (filters.city) count++
  if (filters.capacity) count++
  if (filters.budget) count++
  if (filters.minRating) count++
  if (!isFullPriceRange()) count++
  count += filters.features.length
  return count
})

const hasActiveFilters = computed(() => activeFilterCount.value > 0)

// Filtrləri backend-in gözlədiyi query parametrlərinə çevirir
const buildParams = (pageNumber) => ({
  q: filters.searchQuery || undefined,
  city: filters.city || undefined,
  capacity: filters.capacity || undefined,
  budget: filters.budget || undefined,
  minRating: filters.minRating || undefined,
  minPrice: isFullPriceRange() ? undefined : filters.priceRange[0],
  maxPrice: isFullPriceRange() ? undefined : filters.priceRange[1],
  features: filters.features.length ? filters.features : undefined,
  sort: filters.sort,
  page: pageNumber,
  pageSize: PAGE_SIZE,
})

// Xəritə eyni süzgəcləri işlədir, sadəcə səhifələmə və sıralama olmadan
const mapFilters = computed(() => {
  const { page, pageSize, sort, ...rest } = buildParams(1)
  return rest
})

const toggleFeature = (name) => {
  const index = filters.features.indexOf(name)
  index === -1 ? filters.features.push(name) : filters.features.splice(index, 1)
}

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

// Filtr dəyişəndə sorğunu bir az gecikdiririk ki, hər hərf üçün sorğu getməsin.
// Eyni anda ziyarətçinin nə axtardığını da qeyd edirik.
// Boş süzgəcləri atırıq ki, statistikada «q=undefined&city=undefined» kimi
// mənasız yollar yığılmasın — yalnız həqiqətən seçilmiş filtrlər qalsın.
const cleanParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  )

let filterTimer = null
watch(filters, () => {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    loadFirstPage()
    trackPage({
      pageType: 'search',
      path: '/?' + new URLSearchParams(cleanParams(buildParams(1))).toString(),
      title: 'Axtarış',
    })
  }, 350)
})

// Siyahının sonundakı element ekrana girəndə növbəti səhifə yüklənir
let observer = null
onMounted(async () => {
  // Filtr seçimlərini bazadan alıb qiymət sürgüsünü real aralığa uyğunlaşdırırıq
  options.value = await getFilterOptions()
  filters.priceRange = [options.value.minPrice, options.value.maxPrice]

  // Giriş edilibsə hansı sarayların ürəyi dolu olacağını öyrənirik
  if (auth.isAuth) favoriteIds.value = await getMyFavoriteIds()

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

const resetFilters = () => {
  filters.searchQuery = ''
  filters.city = ''
  filters.capacity = null
  filters.budget = null
  filters.minRating = null
  filters.features = []
  filters.priceRange = [options.value.minPrice, options.value.maxPrice]
  filters.sort = 'rating-desc'
}

// Ürəyə basanda: giriş yoxdursa login-ə yönləndirir, varsa backend-də əlavə edir/silir
const onToggleFavorite = async (venue) => {
  if (!auth.isAuth) {
    ElNotification({
      title: 'Giriş tələb olunur',
      message: 'Seçilmişlərə əlavə etmək üçün daxil olun.',
      type: 'info',
      zIndex: 99999,
    })
    router.push('/login')
    return
  }

  try {
    const { isFavorite } = await toggleFavorite(venue.id)
    const updated = new Set(favoriteIds.value)
    isFavorite ? updated.add(venue.id) : updated.delete(venue.id)
    favoriteIds.value = updated
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  }
}

// Kart seçiləndə sarayın detal səhifəsinə keçid edir
const selectVenue = (venue) => {
  router.push({ name: 'venue-detail', params: { id: venue.id } })
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

.search-main {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  transition: all 0.2s;
}

.search-main:focus-within {
  border-color: #dfb15b;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(223, 177, 91, 0.15);
}

.search-icon {
  font-size: 1rem;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: #212529;
  outline: none;
}

.search-clear {
  border: none;
  background: #e9ecef;
  color: #6c757d;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.7rem;
  line-height: 1;
}

.search-clear:hover {
  background: #dee2e6;
  color: #212529;
}

.search-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr 1fr 1.4fr;
  gap: 18px;
  align-items: start;
}

.mini-chips {
  display: flex;
  gap: 5px;
  margin-top: 6px;
}

.mini-chip {
  flex: 1;
  border: 1px solid #e9ecef;
  background: #fff;
  color: #6c757d;
  padding: 4px 0;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.mini-chip:hover {
  border-color: #dfb15b;
  color: #212529;
}

.mini-chip[aria-pressed="true"] {
  background: #721438;
  border-color: #721438;
  color: #fff;
}

.input-suffix {
  position: relative;
}

.input-suffix input {
  padding-right: 30px;
}

.input-suffix span {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #adb5bd;
  font-weight: 700;
  font-size: 0.85rem;
  pointer-events: none;
}

.field-hint {
  display: block;
  margin-top: 5px;
  font-size: 0.72rem;
  color: #adb5bd;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #e9ecef;
  align-items: center;
}

.divider-label {
  margin-left: 10px;
  padding-left: 14px;
  border-left: 1px solid #e9ecef;
}

.chip-star[aria-pressed="true"] {
  background: #b07d2b;
  border-color: #b07d2b;
}

.field-wide {
  min-width: 0;
}

.range-val {
  float: right;
  color: #721438;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0;
}

.price-slider {
  margin: 0 6px;
}

.price-slider :deep(.el-slider__bar) {
  background-color: #721438;
}

.price-slider :deep(.el-slider__button) {
  border-color: #721438;
}

.chip em {
  font-style: normal;
  opacity: 0.55;
  font-size: 0.72rem;
  margin-left: 3px;
}

.clear-link {
  margin-left: auto;
  background: none;
  border: none;
  color: #dc3545;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.clear-link:hover {
  text-decoration: underline;
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

.header-tools {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

/* Siyahı / Xəritə keçidi */
.view-switch {
  display: flex;
  background: #f4eff1;
  border-radius: 10px;
  padding: 3px;
}

.view-switch button {
  border: none;
  background: none;
  padding: 7px 15px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.15s;
}

.view-switch button.active {
  background: #fff;
  color: #721438;
  box-shadow: 0 2px 6px rgba(26, 17, 24, 0.1);
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
