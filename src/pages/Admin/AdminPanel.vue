<template>
  <div class="admin-page" v-loading="isLoading">
    <div class="admin-inner">
      <!-- Başlıq: kim olduğun və nəyin gözlədiyi bir baxışda görünsün -->
      <header class="hero">
        <div class="hero-text">
          <span class="hero-eyebrow">{{ auth.isSupport ? 'Dəstək paneli' : 'Platforma sahibi paneli' }}</span>
          <h1 class="page-title">Salam, {{ firstName }}</h1>
          <p class="page-sub">
            <template v-if="todoCount">
              {{ todoCount }} iş sizi gözləyir — {{ todoText }}
            </template>
            <template v-else>Gözləyən iş yoxdur, hər şey qaydasındadır.</template>
          </p>
        </div>

        <div class="hero-side">
          <span class="admin-tag" :class="{ support: auth.isSupport }">
            {{ auth.isSupport ? '🛟 Dəstək admini' : '⚙️ SuperAdmin' }}
          </span>
          <span class="hero-name">{{ auth.user?.fullName }}</span>
        </div>
      </header>

      <!-- Bölmələr -->
      <div class="section-tabs">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="section-tab"
          :class="{ active: section === t.value }"
          @click="section = t.value"
        >
          <i class="tab-icon">{{ t.icon }}</i>
          {{ t.label }}
          <em v-if="t.badge" class="tab-badge">{{ t.badge }}</em>
        </button>
      </div>

      <AdminChatsView v-if="section === 'chats'" />
      <AuditLogView v-else-if="section === 'audit'" />
      <VisitorsView v-else-if="section === 'visitors'" />
      <ReviewsView v-else-if="section === 'reviews'" />
      <ReservationsView v-else-if="section === 'bookings'" />
      <SettingsView v-else-if="section === 'settings'" />
      <NotificationSender v-else-if="section === 'notify'" />
      <VenuesView
        v-else-if="section === 'venues'"
        :edit-venue-id="editVenueId"
        @changed="loadStats"
        @edit-opened="editVenueId = null"
      />
      <DataView v-else-if="section === 'data' && auth.isSuperAdmin" />

      <template v-else>

      <!-- Göstəricilər: hər kart öz bölməsinə aparır -->
      <div class="stat-row">
        <div class="stat-card dark">
          <span class="stat-value">{{ usersDisplay }}</span>
          <span class="stat-label">İstifadəçi</span>
          <span class="stat-sub">{{ stats.customers ?? 0 }} müştəri · {{ stats.owners ?? 0 }} sahib</span>
        </div>
        <button class="stat-card" @click="section = 'venues'">
          <span class="stat-value">{{ venuesDisplay }}</span>
          <span class="stat-label">Saray</span>
          <span class="stat-sub" :class="{ warn: stats.pendingVenues }">
            {{ stats.pendingVenues ?? 0 }} təsdiq gözləyir
          </span>
        </button>
        <button class="stat-card" @click="section = 'bookings'">
          <span class="stat-value">{{ reservationsDisplay }}</span>
          <span class="stat-label">Rezerv</span>
          <span class="stat-sub" :class="{ warn: stats.pendingReservations }">
            {{ stats.pendingReservations ?? 0 }} cavabsız
          </span>
        </button>
        <button class="stat-card" @click="section = 'reviews'">
          <span class="stat-value">{{ reviewsDisplay }}</span>
          <span class="stat-label">Rəy</span>
          <span class="stat-sub" :class="{ warn: stats.blockedUsers }">
            {{ stats.blockedUsers ?? 0 }} bloklanmış hesab
          </span>
        </button>
      </div>

      <!-- Təsdiq gözləyən saraylar -->
      <section class="block" v-if="pendingVenues.length">
        <div class="block-head">
          <h2 class="block-title">Təsdiq gözləyən saraylar <em>{{ pendingVenues.length }}</em></h2>
          <button class="mini-btn" @click="section = 'venues'">Bütün saraylar</button>
        </div>
        <div class="pending-list">
          <div v-for="v in pendingVenues" :key="v.id" class="pending-card">
            <img :src="v.coverImageUrl" :alt="v.name" @error="onImgError" />
            <div class="pending-text">
              <b>{{ v.name }}</b>
              <span>{{ v.city }} · {{ v.address }}</span>
              <em>{{ v.phone }}</em>
            </div>
            <!-- «Bax» müraciətin tam yoxlanış ekranını açır: baxmaq da,
                 düzəltmək də, təsdiqləmək də orada olur -->
            <div class="pending-actions">
              <button class="mini-btn" @click="reviewVenue = v">Bax</button>
              <button class="approve-btn" @click="approve(v)">Təsdiqlə</button>
            </div>
          </div>
        </div>
      </section>

      <!-- İstifadəçilər -->
      <AdminUserManager />
      </template>

      <!-- Müraciətin yoxlanışı — sahibkarın anketi ilə eyni quruluşda -->
      <VenueReview
        v-if="reviewVenue"
        :venue="reviewVenue"
        @close="reviewVenue = null"
        @changed="load"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useCountUp } from '@/composables/useCountUp'
import { toast } from '@/utils/toast'
import { useAuthStore } from '@/store/auth'

// Bölmələr tənbəl yüklənir: admin bir anda tək bölməyə baxır, qalan 8-i
// ilkin yükləmədə lazım deyil. Bu, AdminPanel-in bundle ölçüsünü kəskin azaldır.
const AuditLogView = defineAsyncComponent(() => import('@/components/AuditLogView.vue'))
const VisitorsView = defineAsyncComponent(() => import('@/components/VisitorsView.vue'))
const ReviewsView = defineAsyncComponent(() => import('@/components/ReviewsView.vue'))
const ReservationsView = defineAsyncComponent(() => import('@/components/ReservationsView.vue'))
const SettingsView = defineAsyncComponent(() => import('@/components/SettingsView.vue'))
const NotificationSender = defineAsyncComponent(() => import('@/components/NotificationSender.vue'))
const VenuesView = defineAsyncComponent(() => import('@/components/VenuesView.vue'))
const DataView = defineAsyncComponent(() => import('@/components/DataView.vue'))
const VenueReview = defineAsyncComponent(() => import('@/components/VenueReview.vue'))
const AdminUserManager = defineAsyncComponent(() => import('@/components/AdminUserManager.vue'))
const AdminChatsView = defineAsyncComponent(() => import('@/components/AdminChatsView.vue'))
import { getPlatformStats, getPendingVenues, approveVenue } from '@/services/adminService'

const auth = useAuthStore()

const stats = ref({})

// Göstərici kartları rəqəmi sıçramadan, sayaraq dəyişir
const usersDisplay = useCountUp(() => stats.value.users)
const venuesDisplay = useCountUp(() => stats.value.venues)
const reservationsDisplay = useCountUp(() => stats.value.reservations)
const reviewsDisplay = useCountUp(() => stats.value.reviews)
const pendingVenues = ref([])
const isLoading = ref(false)

const section = ref('overview')

// İcmaldan «Redaktə et» basılanda hansı sarayın açılacağı
const editVenueId = ref(null)

// İcmalda «Bax» basılan müraciət — yoxlanış ekranı üçün
const reviewVenue = ref(null)

const firstName = computed(() => auth.user?.fullName?.split(' ')[0] ?? 'admin')

// Başlıqdakı «nə gözləyir» sətri — gündəlik işin xülasəsi
const todoCount = computed(
  () => (stats.value.pendingVenues ?? 0) + (stats.value.pendingReservations ?? 0),
)

const todoText = computed(() => {
  const parts = []
  if (stats.value.pendingVenues) parts.push(`${stats.value.pendingVenues} saray təsdiqi`)
  if (stats.value.pendingReservations) parts.push(`${stats.value.pendingReservations} cavabsız rezerv`)
  return parts.join(' və ')
})

const tabs = computed(() => [
  { value: 'overview', label: 'İcmal', icon: '📊' },
  { value: 'venues', label: 'Saraylar', icon: '🏛', badge: stats.value.pendingVenues || 0 },
  { value: 'bookings', label: 'Rezervlər', icon: '📅', badge: stats.value.pendingReservations || 0 },
  { value: 'reviews', label: 'Rəylər', icon: '⭐' },
  { value: 'visitors', label: 'Ziyarətçilər', icon: '👣' },
  { value: 'chats', label: 'Yazışmalar', icon: '💬' },
  { value: 'notify', label: 'Bildiriş göndər', icon: '📣' },
  { value: 'audit', label: 'Jurnal', icon: '📜' },
  { value: 'settings', label: 'Parametrlər', icon: '⚙️' },

  // Baza bölməsi bütün cədvəllərə birbaşa çıxış verir — yalnız platforma sahibinə
  ...(auth.isSuperAdmin ? [{ value: 'data', label: 'Baza', icon: '🗄' }] : []),
])

// Dəstək admini SuperAdmin hesablarını görmür — həm süzgəcdən, həm də
// rol seçimindən bu variant çıxarılır
const load = async () => {
  isLoading.value = true
  try {
    const [platformStats, pending] = await Promise.all([getPlatformStats(), getPendingVenues()])
    stats.value = platformStats
    pendingVenues.value = pending
  } finally {
    isLoading.value = false
  }
}

// Saray bölməsində dəyişiklik olanda başlıqdakı saylar da yenilənməlidir
const loadStats = async () => {
  stats.value = await getPlatformStats()
  pendingVenues.value = await getPendingVenues()
}

// Sarayı təsdiqləyir — bundan sonra ictimai siyahıda görünür
const approve = async (venue) => {
  try {
    const message = await approveVenue(venue.id)
    toast.success(message, 'Təsdiqləndi')
    await load()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

const onImgError = (e) => {
  e.target.src = 'https://picsum.photos/seed/sadliq/200/200'
}

onMounted(load)
</script>

<style scoped>
.admin-page {
  min-height: calc(100vh - 61px);
  background: #f4f6f8;
  padding: 30px 40px 60px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.admin-inner {
  max-width: 1360px;
  margin: 0 auto;
}

/* Başlıq: tünd fon üzərində qızılı vurğu — panelin «rəsmi» hissəsi */
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
  background: linear-gradient(120deg, #2a0f1c 0%, #4a0d24 55%, var(--brand) 100%);
  border-radius: 18px;
  padding: 26px 30px;
  margin-bottom: 20px;
}

/* Fondakı zərif işıq ləkəsi */
.hero::after {
  content: '';
  position: absolute;
  right: -60px;
  top: -80px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(223, 177, 91, 0.25), transparent 65%);
  pointer-events: none;
}

.hero-text {
  position: relative;
  z-index: 1;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--gold);
  font-weight: 700;
  margin-bottom: 6px;
}

.page-title {
  margin: 0 0 6px;
  color: #fff;
  font-size: 1.75rem;
  letter-spacing: -0.01em;
}

.page-sub {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.92rem;
}

.hero-side {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.admin-tag {
  background: rgba(223, 177, 91, 0.15);
  border: 1px solid rgba(223, 177, 91, 0.4);
  color: var(--gold);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 7px 15px;
  border-radius: 20px;
  white-space: nowrap;
}

.admin-tag.support {
  background: rgba(126, 217, 158, 0.15);
  border-color: rgba(126, 217, 158, 0.4);
  color: #8fe0ab;
}

.hero-name {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Bölmə seçimi */
.section-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.section-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff;
  border: 1px solid var(--line-2);
  color: #6c757d;
  padding: 9px 17px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-icon {
  font-style: normal;
  font-size: 0.95rem;
  line-height: 1;
}

/* Gözləyən işin sayı bölmənin üstündə görünür */
.tab-badge {
  font-style: normal;
  background: var(--warn);
  color: #fff;
  font-size: 0.66rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 20px;
  display: grid;
  place-items: center;
}

.section-tab:hover {
  border-color: var(--gold);
  transform: translateY(-1px);
}

.section-tab.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
  box-shadow: 0 6px 16px rgba(114, 20, 56, 0.25);
}

.section-tab.active .tab-badge {
  background: var(--gold);
  color: #4a0d24;
}

/* Göstəricilər */
.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
  gap: 14px;
  margin-bottom: 26px;
}

.stat-card {
  position: relative;
  background: #fff;
  border: 1px solid #f2ecee;
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 3px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s, box-shadow 0.15s;
}

/* Kartlar düymədir — uyğun bölməyə aparır */
button.stat-card {
  cursor: pointer;
  font: inherit;
}

button.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(26, 17, 24, 0.09);
}

.stat-card.dark {
  background: linear-gradient(135deg, var(--ink), #3a2430);
  border-color: transparent;
}

.stat-card.dark .stat-value { color: var(--gold); }
.stat-card.dark .stat-label,
.stat-card.dark .stat-sub { color: rgba(255, 255, 255, 0.75); }

.stat-value {
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.1;
}

.stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #b8a3ab;
  font-weight: 700;
}

.stat-sub {
  font-size: 0.76rem;
  color: #adb5bd;
}

.stat-sub.warn {
  color: #b07d2b;
  font-weight: 600;
}

/* Bloklar */
.block {
  background: #fff;
  border: 1px solid #f2ecee;
  border-radius: 16px;
  padding: 20px 22px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.block-title {
  margin: 0;
  font-size: 1.15rem;
  color: var(--ink);
}

.block-title em {
  font-style: normal;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.8rem;
  padding: 2px 10px;
  border-radius: 20px;
  margin-left: 8px;
}

/* Təsdiq gözləyənlər */
.pending-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.pending-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fdf6e9;
  border: 1px solid #f0dfbe;
  border-radius: 12px;
  padding: 10px;
}

.pending-card img {
  width: 54px;
  height: 54px;
  border-radius: 10px;
  object-fit: cover;
}

.pending-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-grow: 1;
}

.pending-text b {
  font-size: 0.92rem;
  color: var(--ink);
}

.pending-text span,
.pending-text em {
  font-style: normal;
  font-size: 0.76rem;
  color: #a08a5b;
}

.approve-btn {
  background: #1e7e34;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.approve-btn:hover {
  background: #17692b;
}

.pending-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mini-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: var(--ink-2);
  padding: 5px 11px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.mini-btn:hover {
  border-color: var(--gold);
  color: var(--ink);
}

@media (max-width: 980px) {
  .admin-page {
    padding: 24px 16px 50px;
  }

  /* Bölmə sətri telefonda öz içində sürüşsün */
  .section-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }

  .section-tab {
    white-space: nowrap;
  }
}
</style>
