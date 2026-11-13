<template>
  <div class="fav-page" v-loading="isLoading">
    <div class="fav-inner">
      <header class="page-head">
        <div>
          <h1 class="page-title">Seçilmiş saraylar</h1>
          <p class="page-sub">
            {{ venues.length ? `${venues.length} saray seçilmişlərdədir` : 'Bəyəndiyiniz sarayları burada toplayın' }}
          </p>
        </div>
        <!-- Siyahı boşdursa bu keçid gizlənir: boş vəziyyətin öz düyməsi
             onsuz da eyni yerə aparır, ikisi yan-yana təkrar olurdu. -->
        <router-link v-if="venues.length" to="/" class="new-link">Saraylara bax</router-link>
      </header>

      <!-- Seçilmişlərin xülasəsi: qərar vermək üçün lazım olan üç rəqəm -->
      <div v-if="venues.length" class="fav-summary">
        <div class="fs-item">
          <span class="fs-value">{{ priceRange }}</span>
          <span class="fs-label">qiymət aralığı, nəfər başına</span>
        </div>
        <div class="fs-item">
          <span class="fs-value">{{ capacityRange }}</span>
          <span class="fs-label">tutum aralığı</span>
        </div>
        <div class="fs-item" :class="{ warn: withoutFreeDate > 0 }">
          <span class="fs-value">{{ withoutFreeDate }}</span>
          <span class="fs-label">sarayda yaxın 4 ayda boş tarix yoxdur</span>
        </div>

        <button class="fs-btn" :disabled="venues.length < 2" @click="compareAll">
          Hamısını müqayisə et
        </button>
      </div>

      <UiEmpty
        v-if="!isLoading && venues.length === 0"
        icon="🤍"
        title="Hələ seçilmiş sarayınız yoxdur."
        text="Bəyəndiyiniz sarayın şəklindəki ürək düyməsinə klikləyin — burada toplanacaq."
      >
        <UiButton to="/">Saraylara bax</UiButton>
      </UiEmpty>

      <div v-else class="venues-grid">
        <VenueCard
          v-for="venue in venues"
          :key="venue.id"
          :venue="venue"
          :is-favorite="true"
          :is-compared="compareMap.has(venue.id)"
          :nearest-date="nearestDates[venue.id]"
          @select="selectVenue"
          @toggle-favorite="onRemove"
          @toggle-compare="toggleCompare"
        />
      </div>
    </div>

    <VenueCompare
      v-if="compareOpen && compareVenues.length > 1"
      :venues="compareVenues"
      @close="compareOpen = false"
      @remove="toggleCompare"
      @open="selectVenue"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '@/utils/toast'
import VenueCard from '@/components/VenueCard.vue'
import VenueCompare from '@/components/VenueCompare.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import { getMyFavorites, toggleFavorite } from '@/services/favoriteService'
import { getNearestFreeDate } from '@/services/venueService'

const router = useRouter()

const venues = ref([])
const nearestDates = ref({})
const isLoading = ref(false)

// ————— müqayisə —————

const compareMap = reactive(new Map())
const compareOpen = ref(false)

const compareVenues = computed(() => [...compareMap.values()])

const toggleCompare = (venue) => {
  if (compareMap.has(venue.id)) {
    compareMap.delete(venue.id)
    if (compareMap.size < 2) compareOpen.value = false
    return
  }

  if (compareMap.size >= 3) {
    toast.warning('Eyni anda ən çox 3 sarayı müqayisə etmək olar.')
    return
  }

  compareMap.set(venue.id, venue)
  if (compareMap.size >= 2) compareOpen.value = true
}

// Seçilmişlərin hamısını (ilk üçünü) bir kliklə müqayisə edir
const compareAll = () => {
  compareMap.clear()
  venues.value.slice(0, 3).forEach((v) => compareMap.set(v.id, v))
  compareOpen.value = true
}

// ————— xülasə —————

const minPriceOf = (v) => {
  const menus = v.menus ?? []
  return menus.length ? Math.min(...menus.map((m) => m.pricePerPerson)) : 0
}

const maxCapacityOf = (v) => {
  const halls = v.halls ?? []
  return halls.length ? Math.max(...halls.map((h) => h.capacity)) : 0
}

const priceRange = computed(() => {
  const prices = venues.value.map(minPriceOf).filter(Boolean)
  if (!prices.length) return '—'

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? `${min} ₼` : `${min}–${max} ₼`
})

const capacityRange = computed(() => {
  const sizes = venues.value.map(maxCapacityOf).filter(Boolean)
  if (!sizes.length) return '—'

  const min = Math.min(...sizes)
  const max = Math.max(...sizes)
  return min === max ? `${min} nəfər` : `${min}–${max} nəfər`
})

// Boş tarixi olmayanlar: seçilmişlərdə qalmağın mənası azdır
const withoutFreeDate = computed(
  () => venues.value.filter((v) => !nearestDates.value[v.id]).length,
)

// Seçilmiş sarayları yükləyir və hər biri üçün ən yaxın boş tarixi hesablayır
const load = async () => {
  isLoading.value = true
  try {
    venues.value = await getMyFavorites()
    nearestDates.value = Object.fromEntries(
      venues.value.map((v) => [v.id, getNearestFreeDate(v)]),
    )
  } finally {
    isLoading.value = false
  }
}

// Bu səhifədə ürəyə basmaq sarayı siyahıdan çıxarır
const onRemove = async (venue) => {
  try {
    await toggleFavorite(venue.id)
    venues.value = venues.value.filter((v) => v.id !== venue.id)
    compareMap.delete(venue.id)
    toast.success(`${venue.name} seçilmişlərdən çıxarıldı.`, 'Silindi')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

const selectVenue = (venue) => {
  router.push({ name: 'venue-detail', params: { id: venue.id } })
}

onMounted(load)
</script>

<style scoped>
.fav-page {
  min-height: calc(100vh - 61px);
  background: var(--bg);
  padding: 30px 40px 60px;
  font-family: var(--font);
}

.fav-inner {
  max-width: var(--page-w);
  margin: 0 auto;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 4px;
  color: var(--ink);
  font-size: 1.7rem;
}

.page-sub {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.new-link {
  background: var(--brand);
  color: #fff;
  text-decoration: none;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 0.87rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s;
}

.new-link:hover {
  background: var(--brand-dark);
}

/* Seçilmişlərin xülasə sətri */
.fav-summary {
  display: flex;
  align-items: center;
  gap: 26px;
  background: #fff;
  border-radius: 14px;
  padding: 16px 22px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}

.fs-item {
  display: flex;
  flex-direction: column;
}

.fs-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--brand);
  line-height: 1.2;
}

.fs-label {
  font-size: 0.74rem;
  color: var(--muted);
}

.fs-item.warn .fs-value {
  color: var(--accent);
}

.fs-btn {
  margin-left: auto;
  background: var(--info);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.fs-btn:hover:not(:disabled) {
  background: #24507f;
}

.fs-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.venues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: 24px;
}

@media (max-width: 700px) {
  .fav-page {
    padding: 22px 14px 50px;
  }

  .fav-summary {
    gap: 14px;
  }

  .fs-btn {
    margin-left: 0;
    width: 100%;
  }

  .page-head {
    flex-direction: column;
  }
}

/* Ana səhifə ilə eyni: telefonda iki sütun. Eyni kart komponentidir,
   bir siyahıda iki, digərində bir sütun olsa görkəm parçalanardı.
   Sərhəd 600px-dir — kartın yığcam ölçüləri də orada işə düşür. */
@media (max-width: 600px) {
  .venues-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
}
</style>
