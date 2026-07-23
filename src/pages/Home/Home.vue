<template>
  <div class="home-page">
    <!-- Yuxarı axtarış zolağı -->
    <div class="search-bar">
      <div class="search-bar-inner">
        <el-input
          v-model="filters.city"
          placeholder="Şəhər (məs: Bakı)"
          clearable
          class="search-city"
          @keyup.enter="search"
        />
        <el-date-picker
          v-model="filters.date"
          type="date"
          placeholder="Tarix seçin"
          format="DD.MM.YYYY"
          value-format="YYYY-MM-DD"
          class="search-date"
        />
        <el-input-number
          v-model="filters.capacity"
          :min="1"
          :step="50"
          placeholder="Qonaq sayı"
          class="search-capacity"
          controls-position="right"
        />
        <el-button type="primary" class="gold-btn search-btn" @click="search">Axtar</el-button>
      </div>
    </div>

    <div class="content">
      <!-- Sol filter paneli -->
      <aside class="filters">
        <h3 class="filters-title">Filterlər</h3>

        <div class="filter-group">
          <div class="filter-label">Şəhər</div>
          <el-radio-group v-model="filters.city" class="city-list">
            <el-radio v-for="c in cities" :key="c" :value="c">{{ c }}</el-radio>
          </el-radio-group>
        </div>

        <div class="filter-group">
          <div class="filter-label">Qiymət (₼/nəfər)</div>
          <el-slider v-model="priceRange" range :max="200" />
          <div class="price-labels">₼{{ priceRange[0] }} — ₼{{ priceRange[1] }}</div>
        </div>

        <div class="filter-group">
          <div class="filter-label">Minimum tutum</div>
          <el-select v-model="filters.capacity" placeholder="Seçin" clearable>
            <el-option :value="100" label="100+ qonaq" />
            <el-option :value="200" label="200+ qonaq" />
            <el-option :value="300" label="300+ qonaq" />
            <el-option :value="500" label="500+ qonaq" />
          </el-select>
        </div>

        <div class="filter-group">
          <div class="filter-label">Tarix</div>
          <el-date-picker
            v-model="filters.date"
            type="date"
            placeholder="Tarix seçin"
            format="DD.MM.YYYY"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </div>

        <el-button type="primary" class="gold-btn filter-btn" @click="search">Filtrlə</el-button>
        <el-button text class="reset-btn" @click="reset">Təmizlə</el-button>
      </aside>

      <!-- Nəticələr -->
      <section class="results" v-loading="isLoading">
        <p class="result-count">{{ venues.length }} saray tapıldı</p>

        <div v-for="v in venues" :key="v.id" class="venue-card">
          <div class="venue-img">
            <img v-if="v.coverImageUrl" :src="v.coverImageUrl" :alt="v.name" />
            <div v-else class="img-placeholder">🏰</div>
          </div>

          <div class="venue-info">
            <h3 class="venue-name">{{ v.name }}</h3>
            <p class="venue-loc">📍 {{ v.city }}<span v-if="v.address">, {{ v.address }}</span></p>
            <p class="venue-cap" v-if="capacityText(v)">👥 {{ capacityText(v) }}</p>
            <p class="venue-desc" v-if="v.description">{{ v.description }}</p>
          </div>

          <div class="venue-side">
            <div class="venue-price" v-if="priceText(v)">{{ priceText(v) }}</div>
            <el-button type="primary" class="gold-btn" @click="goDetail(v)">Bax →</el-button>
          </div>
        </div>

        <el-empty v-if="!isLoading && !venues.length" description="Heç bir saray tapılmadı" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const venues = ref([])
const allVenues = ref([])
const isLoading = ref(false)

const filters = reactive({ city: '', date: null, capacity: null })
const priceRange = ref([0, 200])

// Filter panelindəki şəhər siyahısı mövcud sarayların şəhərlərindən yığılır
const cities = computed(() => [...new Set(allVenues.value.map((v) => v.city).filter(Boolean))])

// Bütün təsdiqlənmiş sarayları yükləyir
const loadAll = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get('/Venues/GetAll')
    venues.value = data.data ?? []
    allVenues.value = venues.value
  } finally {
    isLoading.value = false
  }
}

// Seçilmiş filterlərlə backend-də axtarış edir
const search = async () => {
  isLoading.value = true
  try {
    const params = {}
    if (filters.city) params.city = filters.city
    if (filters.date) params.date = filters.date
    if (filters.capacity) params.capacity = filters.capacity
    if (priceRange.value[0] > 0) params.minPrice = priceRange.value[0]
    if (priceRange.value[1] < 200) params.maxPrice = priceRange.value[1]

    const { data } = await api.get('/Venues/Search', { params })
    venues.value = data.data ?? []
  } finally {
    isLoading.value = false
  }
}

// Filterləri sıfırlayıb tam siyahını qaytarır
const reset = async () => {
  filters.city = ''
  filters.date = null
  filters.capacity = null
  priceRange.value = [0, 200]
  await loadAll()
}

// Zalların tutumuna görə "min-max qonaq" mətni
const capacityText = (v) => {
  const caps = (v.halls ?? []).map((h) => h.capacity).filter(Boolean)
  if (!caps.length) return ''
  const min = Math.min(...caps)
  const max = Math.max(...caps)
  return min === max ? `${min} qonaq` : `${min}-${max} qonaq`
}

// Menyulardan ən aşağı qiyməti "₼X/nəfər" formatında göstərir
const priceText = (v) => {
  const prices = (v.menus ?? []).map((m) => m.pricePerPerson).filter(Boolean)
  if (!prices.length) return ''
  return `₼${Math.min(...prices)}/nəfər`
}

const goDetail = (v) => {
  router.push({ name: 'venue-detail', params: { id: v.id } })
}

onMounted(loadAll)
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 61px);
  background: #f7f5f0;
}

/* Yuxarı axtarış zolağı */
.search-bar {
  background: #b8860b;
  padding: 20px 32px;
}

.search-bar-inner {
  display: flex;
  gap: 10px;
  max-width: 1100px;
  margin: 0 auto;
}

.search-city {
  flex: 2;
}

.search-date,
.search-capacity {
  flex: 1;
}

.search-btn {
  background: #08060d;
  border-color: #08060d;
  padding: 0 28px;
}

.search-btn:hover {
  background: #2a2438;
  border-color: #2a2438;
}

/* Kontent: solda filter, sağda nəticələr */
.content {
  display: flex;
  gap: 24px;
  max-width: 1100px;
  margin: 24px auto;
  padding: 0 32px;
  align-items: flex-start;
}

.filters {
  width: 250px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 80px;
}

.filters-title {
  margin: 0 0 16px;
  font-size: 17px;
  color: #08060d;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.city-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.price-labels {
  font-size: 13px;
  color: #666;
  text-align: center;
}

.filter-btn {
  width: 100%;
}

.reset-btn {
  width: 100%;
  margin: 8px 0 0 !important;
}

/* Saray kartları */
.results {
  flex: 1;
  min-height: 200px;
}

.result-count {
  color: #666;
  font-size: 14px;
  margin: 0 0 12px;
}

.venue-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, transform 0.2s;
}

.venue-card:hover {
  box-shadow: 0 6px 24px rgba(184, 134, 11, 0.18);
  transform: translateY(-2px);
}

.venue-img {
  width: 220px;
  height: 170px;
  flex-shrink: 0;
}

.venue-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  background: linear-gradient(135deg, #fdf6e3, #f3e2c7);
}

.venue-info {
  flex: 1;
  padding: 16px 20px;
  min-width: 0;
}

.venue-name {
  margin: 0 0 6px;
  font-size: 19px;
  color: #08060d;
}

.venue-loc,
.venue-cap {
  margin: 0 0 4px;
  font-size: 14px;
  color: #666;
}

.venue-desc {
  margin: 8px 0 0;
  font-size: 13px;
  color: #888;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.venue-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  padding: 16px 20px;
  flex-shrink: 0;
}

.venue-price {
  font-weight: 700;
  font-size: 17px;
  color: #b8860b;
}

.gold-btn {
  background: #b8860b;
  border-color: #b8860b;
}

.gold-btn:hover {
  background: #a3760a;
  border-color: #a3760a;
}
</style>
