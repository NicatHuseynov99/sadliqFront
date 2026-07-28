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
        <router-link to="/" class="new-link">Saraylara bax</router-link>
      </header>

      <div v-if="!isLoading && venues.length === 0" class="no-result">
        <div class="empty-icon">🤍</div>
        <h3>Hələ seçilmiş sarayınız yoxdur.</h3>
        <p>Bəyəndiyiniz sarayın şəklindəki ürək düyməsinə klikləyin — burada toplanacaq.</p>
        <router-link to="/"><button class="primary-btn">Saraylara bax</button></router-link>
      </div>

      <div v-else class="venues-grid">
        <VenueCard
          v-for="venue in venues"
          :key="venue.id"
          :venue="venue"
          :is-favorite="true"
          :nearest-date="nearestDates[venue.id]"
          @select="selectVenue"
          @toggle-favorite="onRemove"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import VenueCard from '@/components/VenueCard.vue'
import { getMyFavorites, toggleFavorite } from '@/services/favoriteService'
import { getNearestFreeDate } from '@/services/venueService'

const router = useRouter()

const venues = ref([])
const nearestDates = ref({})
const isLoading = ref(false)

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
    ElNotification({
      title: 'Silindi',
      message: `${venue.name} seçilmişlərdən çıxarıldı.`,
      type: 'success',
      zIndex: 99999,
    })
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
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
  background: #f4f6f8;
  padding: 30px 40px 60px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.fav-inner {
  max-width: 1360px;
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
  color: #1a1118;
  font-size: 1.7rem;
}

.page-sub {
  margin: 0;
  color: #6c757d;
  font-size: 0.92rem;
}

.new-link {
  background: #721438;
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
  background: #590f2b;
}

.venues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.no-result {
  text-align: center;
  padding: 54px 20px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 2.8rem;
  margin-bottom: 10px;
}

.no-result h3 {
  color: #333;
  margin: 0 0 8px;
}

.no-result p {
  color: #666;
  margin: 0 0 20px;
}

.primary-btn {
  background: #721438;
  color: white;
  border: none;
  padding: 9px 22px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.primary-btn:hover {
  background: #590f2b;
}

@media (max-width: 600px) {
  .fav-page {
    padding: 24px 16px 50px;
  }
  .venues-grid {
    grid-template-columns: 1fr;
  }
}
</style>
