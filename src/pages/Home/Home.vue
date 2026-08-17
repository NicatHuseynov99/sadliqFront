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
              placeholder="Saray, zal, menyu və ya ünvan yazın..."
              @input="onSuggestInput"
              @focus="suggestOpen = true"
              @blur="closeSuggest"
            />
            <button class="search-clear" v-if="filters.searchQuery" @click="clearSearch">✕</button>

            <!-- Yazdıqca çıxan təkliflər -->
            <ul v-if="suggestOpen && suggestions.length" class="suggest-list">
              <li
                v-for="s in suggestions"
                :key="`${s.type}-${s.venueId ?? s.text}`"
                @mousedown.prevent="pickSuggestion(s)"
              >
                <template v-if="s.type === 'venue'">
                  <img :src="s.imageUrl" alt="" @error="onImgError" />
                  <span class="sug-text">
                    <b>{{ s.text }}</b>
                    <em>{{ s.city }}</em>
                  </span>
                  <span class="sug-type">saray</span>
                </template>
                <template v-else>
                  <span class="sug-city-icon">📍</span>
                  <span class="sug-text"><b>{{ s.text }}</b><em>{{ s.count }} saray</em></span>
                  <span class="sug-type">şəhər</span>
                </template>
              </li>
            </ul>
          </div>

          <!-- Görünən hissədə yalnız üç şey: şəhər, qonaq sayı və çekmecə açarı.
               Qalan şərtlər divar kimi yer tutmasın deyə yandan açılır. -->
          <div class="search-row">
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

            <button class="filter-btn" @click="isFilterOpen = true">
              🔍 Ətraflı axtarış
              <em v-if="activeFilterCount">{{ activeFilterCount }}</em>
            </button>

            <button v-if="hasActiveFilters" class="clear-link" @click="resetFilters">
              Təmizlə ✕
            </button>
          </div>

          <span v-if="parkingHint" class="field-hint row-hint">{{ parkingHint }}</span>
        </div>
      </div>
    </section>

    <!-- Axtarış çekmecəsi: büdcə, qiymət aralığı, reytinq, parkinq və özəlliklər -->
    <el-drawer v-model="isFilterOpen" title="Ətraflı axtarış" size="390px" class="filter-drawer">
      <div class="drawer-body">
        <div class="field">
          <label>Ümumi büdcəniz</label>
          <div class="input-suffix">
            <input v-model.number="filters.budget" type="number" min="0" step="500" placeholder="məs. 12000" />
            <span>₼</span>
          </div>
          <span class="field-hint">{{ budgetHint }}</span>
        </div>

        <div class="field">
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

        <div class="drawer-group">
          <span class="chips-label">Reytinq</span>
          <div class="chip-wrap">
            <button
              v-for="r in ratingOptions"
              :key="r"
              class="chip chip-star"
              :aria-pressed="filters.minRating === r"
              @click="filters.minRating = filters.minRating === r ? null : r"
            >
              ★ {{ r }}+
            </button>
          </div>
        </div>

        <div class="drawer-group">
          <span class="chips-label">Parkinq</span>
          <div class="chip-wrap">
            <button
              v-for="p in parkingOptions"
              :key="p.value"
              class="chip chip-parking"
              :aria-pressed="filters.minParking === p.value"
              @click="filters.minParking = filters.minParking === p.value ? null : p.value"
            >
              🅿️ {{ p.label }}
            </button>
          </div>
        </div>

        <div class="drawer-group">
          <span class="chips-label">Özəlliklər</span>
          <div class="chip-wrap">
            <button
              v-for="f in options.features"
              :key="f.name"
              class="chip"
              :aria-pressed="filters.features.includes(f.name)"
              @click="toggleFeature(f.name)"
            >
              {{ f.name }} <em>{{ f.count }}</em>
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="drawer-foot">
          <button class="clear-link" @click="resetFilters">Hamısını təmizlə</button>
          <button class="apply-btn" @click="isFilterOpen = false">
            {{ totalCount }} sarayı göstər
          </button>
        </div>
      </template>
    </el-drawer>

    <!-- Tərs axtarış: axtarmaq əvəzinə elan qoymaq.
         Qonağa da, giriş etmiş müştəriyə də göstərilir — sahibkara yox. -->
    <section v-if="!auth.isAuth || auth.isCustomer" class="reverse-banner">
      <div class="rb-inner">
        <div class="rb-text">
          <span class="rb-badge">Yeni</span>
          <h2>Axtarmaq əvəzinə elan qoyun</h2>
          <p>
            «Oktyabrda toy edirəm, 250 nəfər, nəfər başına 70 ₼» — bir dəfə yazın.
            Uyğun saraylar <b>sizə təklif göndərsin</b>: tarix, zal, menyu və qiymətlə.
            Təklifi təsdiqləyəndən sonra sarayla <b>birbaşa yazışırsınız</b> —
            10 yerə zəng etmək lazım deyil.
          </p>

          <ol class="rb-steps">
            <li><span>1</span> Şərtlərinizi yazın</li>
            <li><span>2</span> Saraylar təklif göndərir</li>
            <li><span>3</span> Təsdiqləyib yazışırsınız</li>
            <li><span>4</span> Bəyəndiyinizi seçirsiniz</li>
          </ol>
        </div>

        <div class="rb-action">
          <router-link :to="auth.isAuth ? '/sorgularim' : '/login'">
            <button class="rb-btn">
              {{ auth.isAuth ? 'Sorğu paylaş' : 'Daxil ol və sorğu paylaş' }}
            </button>
          </router-link>
          <span class="rb-note">Pulsuzdur · sorğu 7 gün açıq qalır</span>
        </div>
      </div>
    </section>

    <!-- Restoranlar Siyahısı -->
    <section class="venues-container">
      <div class="results-header">
        <!-- Xəritə rejimində say xəritənin öz sətrində göstərilir —
             burada təkrarlansa, koordinatı olmayan saraylara görə iki
             fərqli rəqəm görünür və çaşdırır -->
        <h2 v-if="view === 'list'">Mövcud Saraylar <span>({{ totalCount }})</span></h2>
        <span v-else></span>

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
      <!-- İlk yükləmə: kartların öz formasında boz bloklar -->
      <div v-if="isLoading && !venues.length" class="venues-grid">
        <UiCardSkeleton v-for="n in 6" :key="n" />
      </div>

      <UiEmpty
        v-else-if="!isLoading && venues.length === 0"
        title="Axtarışınıza uyğun heç bir saray tapılmadı."
        text="Filtrləri dəyişərək yenidən yoxlaya bilərsiniz."
      >
        <UiButton variant="ghost" @click="resetFilters">Filtrləri sıfırla</UiButton>
      </UiEmpty>

      <div v-else class="venues-grid">
        <VenueCard
          v-for="venue in venues"
          :key="venue.id"
          :venue="venue"
          :is-favorite="favoriteIds.has(venue.id)"
          :is-compared="isCompared(venue.id)"
          :nearest-date="nearestDates[venue.id]"
          @select="selectVenue"
          @toggle-favorite="onToggleFavorite"
          @toggle-compare="toggleCompare"
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
    <!-- Müqayisə üçün seçilənlər: səhifənin altında üzən sətir -->
    <div v-if="compareMap.size" class="cmp-bar">
      <span class="cmp-count">{{ compareMap.size }} saray seçildi</span>

      <div class="cmp-names">
        <span v-for="v in compareVenues" :key="v.id" class="cmp-name">
          {{ v.name }}
          <button @click="toggleCompare(v)">✕</button>
        </span>
      </div>

      <button class="cmp-clear" @click="clearCompare">Təmizlə</button>
      <button class="cmp-open" :disabled="compareMap.size < 2" @click="compareOpen = true">
        Müqayisə et
      </button>
    </div>

    <VenueCompare
      v-if="compareOpen && compareVenues.length"
      :venues="compareVenues"
      @close="compareOpen = false"
      @remove="toggleCompare"
      @open="selectVenue"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '@/utils/toast'
import VenueCard from '@/components/VenueCard.vue'
import VenueMap from '@/components/VenueMap.vue'
import {
  searchVenues,
  getFilterOptions,
  getNearestFreeDate,
  getSuggestions,
  buildBusyMap,
} from '@/services/venueService'
import { getMyFavoriteIds, toggleFavorite } from '@/services/favoriteService'
import { trackPage } from '@/services/visitService'
import { useAuthStore } from '@/store/auth'
import VenueCompare from "@/components/VenueCompare.vue"
import UiCardSkeleton from "@/components/ui/UiCardSkeleton.vue"
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiButton from '@/components/ui/UiButton.vue'

const PAGE_SIZE = 12

// Müqayisəyə seçilənlər. Sarayın özü saxlanılır, təkcə nömrəsi yox:
// süzgəc dəyişib saray siyahıdan çıxsa da, seçim yerində qalır.
const compareMap = reactive(new Map())
const compareOpen = ref(false)

// Ətraflı süzgəc çekmecəsi
const isFilterOpen = ref(false)

const compareVenues = computed(() => [...compareMap.values()])

const isCompared = (id) => compareMap.has(id)

const toggleCompare = (venue) => {
  if (compareMap.has(venue.id)) {
    compareMap.delete(venue.id)
    if (compareMap.size < 2) compareOpen.value = false
    return
  }

  // Üçdən çox saray yan-yana oxunmur
  if (compareMap.size >= 3) {
    toast.warning('Eyni anda ən çox 3 sarayı müqayisə etmək olar.')
    return
  }

  compareMap.set(venue.id, venue)
}

const clearCompare = () => {
  compareMap.clear()
  compareOpen.value = false
}

// «list» və ya «map» — seçim səhifə yenilənəndə sıfırlanır
const view = ref('list')

// Tez seçim üçün tipik qonaq sayları (bazadakı tutumlar 150-800 arasındadır)
const capacityOptions = [150, 250, 400, 600]

// Reytinq həddi seçimləri
const ratingOptions = [4.5, 4]

// Parkinq həddi seçimləri. «Var» — tutumu göstərilmiş bütün saraylar.
const parkingOptions = [
  { value: 1, label: 'var' },
  { value: 50, label: '50+' },
  { value: 100, label: '100+' },
  { value: 200, label: '200+' },
]

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
  minParking: null,
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

// Axtarış təklifləri
const suggestions = ref([])
const suggestOpen = ref(false)

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=200&q=60'

const onImgError = (event) => {
  event.target.src = FALLBACK_IMAGE
}

// Hər hərfdə sorğu getməsin deyə yazmaq bitəndən sonra soruşuruq
let suggestTimer = null
const onSuggestInput = () => {
  suggestOpen.value = true
  clearTimeout(suggestTimer)

  suggestTimer = setTimeout(async () => {
    suggestions.value = await getSuggestions(filters.searchQuery)
  }, 250)
}

// Siyahıdakı elementə klik blur-dan sonra işləsin deyə bir az gözləyirik
const closeSuggest = () => setTimeout(() => (suggestOpen.value = false), 150)

const pickSuggestion = (item) => {
  suggestOpen.value = false
  suggestions.value = []

  // Saray seçilibsə birbaşa səhifəsinə keçirik, şəhər seçilibsə süzgəcə salırıq
  if (item.type === 'venue') {
    router.push(`/venue/${item.venueId}`)
    return
  }

  filters.searchQuery = ''
  filters.city = item.text
}

const clearSearch = () => {
  filters.searchQuery = ''
  suggestions.value = []
}

// Ortalama 4 qonaq bir avtomobillə gəlir — bu, toy məkanlarında işlənən adi hesabdır
const GUESTS_PER_CAR = 4

const parkingHint = computed(() => {
  if (!filters.capacity) return ''

  const needed = Math.ceil(filters.capacity / GUESTS_PER_CAR)
  return `${filters.capacity} qonaq üçün təxminən ${needed} avtomobil yeri lazımdır`
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.searchQuery) count++
  if (filters.city) count++
  if (filters.capacity) count++
  if (filters.budget) count++
  if (filters.minRating) count++
  if (filters.minParking) count++
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
  minParking: filters.minParking || undefined,
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
    toast.info('Seçilmişlərə əlavə etmək üçün daxil olun.', 'Giriş tələb olunur')
    router.push('/login')
    return
  }

  try {
    const { isFavorite } = await toggleFavorite(venue.id)
    const updated = new Set(favoriteIds.value)
    isFavorite ? updated.add(venue.id) : updated.delete(venue.id)
    favoriteIds.value = updated
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

// Kart seçiləndə sarayın detal səhifəsinə keçid edir
const selectVenue = (venue) => {
  router.push({ name: 'venue-detail', params: { id: venue.id } })
}
</script>

<style scoped>

/* Müqayisə sətri — səhifənin altında üzür */
.cmp-bar {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--ink);
  color: #fff;
  border-radius: 14px;
  padding: 11px 16px;
  box-shadow: 0 14px 36px rgba(26, 17, 24, 0.35);
  max-width: calc(100% - 32px);
  flex-wrap: wrap;
}

.cmp-count {
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}

.cmp-names {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.cmp-name {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 0.76rem;
}

.cmp-name button {
  background: none;
  border: none;
  color: #d8c6cc;
  cursor: pointer;
  font-size: 0.68rem;
  padding: 0;
}

.cmp-name button:hover {
  color: #fff;
}

.cmp-clear {
  background: none;
  border: none;
  color: #bda9b1;
  font-size: 0.78rem;
  cursor: pointer;
}

.cmp-clear:hover {
  color: #fff;
}

.cmp-open {
  background: var(--gold);
  color: var(--ink);
  border: none;
  padding: 9px 20px;
  border-radius: 10px;
  font-size: 0.83rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.cmp-open:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Tərs axtarış banneri */
.reverse-banner {
  max-width: var(--page-w);
  margin: 26px auto 0;
  padding: 0 20px;
}

.rb-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  background: linear-gradient(135deg, var(--ink) 0%, #4a1026 55%, var(--brand) 100%);
  border-radius: 20px;
  padding: 26px 32px;
  color: #fff;
  flex-wrap: wrap;
}

.rb-badge {
  display: inline-block;
  background: var(--gold);
  color: var(--ink);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 9px;
}

.rb-text h2 {
  margin: 0 0 8px;
  font-size: 1.42rem;
  color: #fff;
}

.rb-text p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.7;
  color: #e6d8dd;
  max-width: 620px;
}

.rb-text p b {
  color: #f3dfa8;
  font-weight: 600;
}

.rb-steps {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 16px 0 0;
  padding: 0;
}

.rb-steps li {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.79rem;
  color: #d8c6cc;
}

.rb-steps span {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(223, 177, 91, 0.2);
  color: var(--gold);
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rb-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rb-btn {
  background: var(--gold);
  color: var(--ink);
  border: none;
  padding: 14px 30px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s;
}

.rb-btn:hover {
  background: #ecc272;
  transform: translateY(-1px);
}

.rb-note {
  font-size: 0.72rem;
  color: #bda9b1;
}

@media (max-width: 820px) {
  .rb-inner {
    padding: 22px;
  }

  .rb-action {
    width: 100%;
  }

  .rb-btn {
    width: 100%;
  }
}
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
  color: var(--gold);
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
  position: relative;
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

/* Axtarış təklifləri */
.suggest-list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 40;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: #fff;
  border: 1px solid var(--line-2);
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(26, 17, 24, 0.16);
  max-height: 340px;
  overflow-y: auto;
}

.suggest-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.12s;
}

.suggest-list li:hover {
  background: #fbf7f8;
}

.suggest-list img {
  width: 42px;
  height: 32px;
  object-fit: cover;
  border-radius: 7px;
  background: #f6f1f3;
}

.sug-city-icon {
  width: 42px;
  text-align: center;
  font-size: 1rem;
}

.sug-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.sug-text b {
  font-size: 0.88rem;
  color: var(--ink);
}

.sug-text em {
  font-style: normal;
  font-size: 0.74rem;
  color: var(--muted-2);
}

.sug-type {
  font-size: 0.68rem;
  color: #b8a3ab;
  background: #f6f1f3;
  padding: 2px 8px;
  border-radius: 20px;
}

.search-main:focus-within {
  border-color: var(--gold);
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

/* Görünən süzgəc sətri: şəhər, qonaq sayı və çekmecə açarı */
.search-row {
  display: grid;
  grid-template-columns: 1.1fr 1.2fr auto auto;
  gap: 14px;
  align-items: end;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--surface);
  border: 1px solid var(--line-2);
  color: var(--brand);
  padding: 11px 18px;
  border-radius: var(--r);
  font-size: var(--fs-sm);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color var(--t-fast);
}

.filter-btn:hover {
  border-color: var(--gold);
}

.filter-btn em {
  font-style: normal;
  background: var(--brand);
  color: #fff;
  font-size: 0.68rem;
  min-width: 18px;
  height: 18px;
  border-radius: var(--r-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.row-hint {
  display: block;
  margin-top: 8px;
}

/* Çekmecə */
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-x: hidden;
}

/* Çekmecənin içindəki sahələr kənara çıxmasın */
.drawer-body :deep(.el-slider) {
  padding: 0 6px;
}

.drawer-body .field,
.drawer-body input,
.drawer-body .input-suffix {
  max-width: 100%;
}

:deep(.filter-drawer .el-drawer__body) {
  overflow-x: hidden;
}

.drawer-group .chips-label {
  display: block;
  margin-bottom: 8px;
}

.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.drawer-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.apply-btn {
  background: linear-gradient(135deg, var(--brand), var(--accent));
  border: none;
  color: #fff;
  padding: 11px 22px;
  border-radius: var(--r);
  font-size: var(--fs-sm);
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 700px) {
  .hero-section {
    padding: 34px 14px;
  }

  .hero-content h1 {
    font-size: 1.5rem;
  }

  .venues-container {
    padding: 20px 14px 50px;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .cmp-bar {
    bottom: 68px;
  }
}

@media (max-width: 820px) {
  .search-row {
    grid-template-columns: 1fr 1fr;
  }

  .filter-btn {
    grid-column: 1 / -1;
    justify-content: center;
  }
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
  border-color: var(--gold);
  color: #212529;
}

.mini-chip[aria-pressed="true"] {
  background: var(--brand);
  border-color: var(--brand);
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
  color: var(--brand);
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0;
}

.price-slider {
  margin: 0 6px;
}

.price-slider :deep(.el-slider__bar) {
  background-color: var(--brand);
}

.price-slider :deep(.el-slider__button) {
  border-color: var(--brand);
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
  border-color: var(--gold);
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
  accent-color: var(--brand);
}

.budget-val {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--brand);
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
  border-color: var(--gold);
  color: #212529;
}

.chip[aria-pressed="true"] {
  background: var(--ink);
  border-color: var(--ink);
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
  border-top-color: var(--brand);
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
  max-width: var(--page-w);
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
  color: var(--ink);
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
  color: var(--brand);
  box-shadow: 0 2px 6px rgba(26, 17, 24, 0.1);
}

.results-header h2 span {
  color: var(--brand);
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

.venues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
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
  color: var(--brand);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: transform 0.2s;
}

.fav-btn:hover {
  transform: scale(1.1);
}

.fav-btn[aria-pressed="true"] {
  background: var(--brand);
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
  color: var(--ink);
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
  background: var(--danger-soft);
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
  border-color: var(--gold);
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
  color: var(--ink);
}

.menu-chip-text span {
  font-size: 0.72rem;
  color: var(--brand);
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
  background: var(--brand);
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
  background: var(--brand-dark);
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
