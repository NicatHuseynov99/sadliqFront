<template>
  <div class="detail-page" v-loading="isLoading">
    <div v-if="venue" class="detail-inner">
      <el-button text class="back-btn" @click="$router.back()">← Geri</el-button>

      <div class="hero">
        <img v-if="venue.coverImageUrl" :src="venue.coverImageUrl" :alt="venue.name" />
        <div v-else class="img-placeholder">🏰</div>
      </div>

      <h1 class="venue-name">{{ venue.name }}</h1>
      <p class="venue-loc">📍 {{ venue.city }}<span v-if="venue.address">, {{ venue.address }}</span></p>
      <p class="venue-phone" v-if="venue.phone">📞 {{ venue.phone }}</p>
      <p class="venue-desc" v-if="venue.description">{{ venue.description }}</p>

      <h2 class="section-title">Zallar</h2>
      <div class="hall-list" v-if="venue.halls?.length">
        <div v-for="h in venue.halls" :key="h.id" class="hall-card">
          <h3>{{ h.name }}</h3>
          <p>👥 {{ h.capacity }} qonaq</p>
          <p v-if="h.minPrice" class="price">₼{{ h.minPrice }}-dən başlayaraq</p>
          <p v-if="h.description" class="hall-desc">{{ h.description }}</p>
        </div>
      </div>
      <el-empty v-else description="Zal əlavə olunmayıb" />

      <h2 class="section-title">Menyular</h2>
      <div class="menu-list" v-if="venue.menus?.length">
        <div v-for="m in venue.menus" :key="m.id" class="menu-card">
          <div class="menu-head">
            <h3>{{ m.name }}</h3>
            <span class="price">₼{{ m.pricePerPerson }}/nəfər</span>
          </div>
          <ul v-if="m.items?.length">
            <li v-for="i in m.items" :key="i.id">{{ i.name }}</li>
          </ul>
        </div>
      </div>
      <el-empty v-else description="Menyu əlavə olunmayıb" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const venue = ref(null)
const isLoading = ref(false)

// Sarayın bütün detallarını (zallar, menyular) backend-dən yükləyir
const loadVenue = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get(`/Venues/GetById/${route.params.id}`)
    venue.value = data.data
  } finally {
    isLoading.value = false
  }
}

onMounted(loadVenue)
</script>

<style scoped>
.detail-page {
  min-height: calc(100vh - 61px);
  background: #f7f5f0;
  padding: 24px 32px;
}

.detail-inner {
  max-width: 900px;
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 12px;
}

.hero {
  height: 320px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
}

.hero img {
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
  font-size: 90px;
  background: linear-gradient(135deg, #fdf6e3, #f3e2c7);
}

.venue-name {
  margin: 0 0 6px;
  color: #08060d;
}

.venue-loc,
.venue-phone {
  margin: 0 0 4px;
  color: #666;
}

.venue-desc {
  margin: 12px 0 0;
  color: #555;
  line-height: 1.6;
}

.section-title {
  margin: 32px 0 14px;
  font-size: 20px;
  color: #08060d;
}

.hall-list,
.menu-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.hall-card,
.menu-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.hall-card h3,
.menu-card h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.hall-card p {
  margin: 0 0 4px;
  font-size: 14px;
  color: #666;
}

.hall-desc {
  font-size: 13px !important;
  color: #888 !important;
}

.menu-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-card ul {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 14px;
  color: #666;
}

.price {
  color: #b8860b;
  font-weight: 700;
}
</style>
