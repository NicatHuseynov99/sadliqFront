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

      <AuditLogView v-if="section === 'audit'" />
      <VisitorsView v-else-if="section === 'visitors'" />
      <ReviewsView v-else-if="section === 'reviews'" />
      <ReservationsView v-else-if="section === 'bookings'" />
      <SettingsView v-else-if="section === 'settings'" />
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
          <span class="stat-value">{{ stats.users ?? 0 }}</span>
          <span class="stat-label">İstifadəçi</span>
          <span class="stat-sub">{{ stats.customers ?? 0 }} müştəri · {{ stats.owners ?? 0 }} sahib</span>
        </div>
        <button class="stat-card" @click="section = 'venues'">
          <span class="stat-value">{{ stats.venues ?? 0 }}</span>
          <span class="stat-label">Saray</span>
          <span class="stat-sub" :class="{ warn: stats.pendingVenues }">
            {{ stats.pendingVenues ?? 0 }} təsdiq gözləyir
          </span>
        </button>
        <button class="stat-card" @click="section = 'bookings'">
          <span class="stat-value">{{ stats.reservations ?? 0 }}</span>
          <span class="stat-label">Rezerv</span>
          <span class="stat-sub" :class="{ warn: stats.pendingReservations }">
            {{ stats.pendingReservations ?? 0 }} cavabsız
          </span>
        </button>
        <button class="stat-card" @click="section = 'reviews'">
          <span class="stat-value">{{ stats.reviews ?? 0 }}</span>
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
      <section class="block">
        <div class="block-head">
          <h2 class="block-title">İstifadəçilər <em>{{ users.length }}</em></h2>
          <div class="head-tools">
            <input
              v-model="search"
              class="search-box"
              type="search"
              placeholder="Ad, e-poçt və ya telefon üzrə axtar…"
              @input="onSearchInput"
            />
            <button class="approve-btn" @click="openCreate">+ Yeni hesab</button>
          </div>
        </div>

        <div class="filter-row">
          <div class="filter-chips">
            <button
              v-for="f in roleFilters"
              :key="f.value"
              class="chip"
              :class="{ active: roleFilter === f.value }"
              @click="setRoleFilter(f.value)"
            >
              {{ f.label }}
            </button>
          </div>
          <div class="filter-chips">
            <button
              v-for="s in statusFilters"
              :key="s.value"
              class="chip status"
              :class="{ active: statusFilter === s.value }"
              @click="setStatusFilter(s.value)"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="user-table">
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>E-poçt</th>
                <th>Telefon</th>
                <th>Saray</th>
                <th>Qeydiyyat</th>
                <th>Status</th>
                <th>Rol</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="u in users"
                :key="u.id"
                :class="{ blocked: !u.isActive && !u.isDeleted, removed: u.isDeleted }"
              >
                <td>
                  <b class="name-link" @click="openDetail(u)">{{ u.fullName }}</b>
                  <em v-if="u.id === auth.user?.id" class="you-tag">siz</em>
                </td>
                <td class="muted">{{ u.email }}</td>
                <td class="muted">{{ u.phone }}</td>
                <td class="muted">{{ u.venueCount || '—' }}</td>
                <td class="muted">{{ formatDateFull(u.createdAt.slice(0, 10)) }}</td>
                <td>
                  <span v-if="u.isDeleted" class="status-badge off">Silinib</span>
                  <span v-else class="status-badge" :class="u.isActive ? 'ok' : 'off'">
                    {{ u.isActive ? 'Aktiv' : 'Bloklanıb' }}
                  </span>
                </td>
                <td>
                  <select
                    class="role-select"
                    :class="u.role.toLowerCase()"
                    :value="u.role"
                    :disabled="u.id === auth.user?.id"
                    @change="onRoleChange(u, $event.target.value)"
                  >
                    <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
                  </select>
                </td>
                <td v-if="u.isDeleted" class="row-actions">
                  <button class="mini-btn" @click="openDetail(u)">Ətraflı</button>
                  <button class="mini-btn ok" @click="restore(u)">Geri qaytar</button>
                </td>
                <td v-else class="row-actions">
                  <button class="mini-btn" @click="openDetail(u)">Ətraflı</button>
                  <button class="mini-btn" @click="openEdit(u)">Redaktə</button>
                  <button class="mini-btn" @click="openPassword(u)">Parol</button>
                  <button
                    class="mini-btn"
                    :class="u.isActive ? 'danger' : 'ok'"
                    :disabled="u.id === auth.user?.id"
                    @click="toggleActive(u)"
                  >
                    {{ u.isActive ? 'Blokla' : 'Bloku aç' }}
                  </button>
                  <button
                    class="mini-btn danger"
                    :disabled="u.id === auth.user?.id"
                    @click="removeUser(u)"
                  >
                    Sil
                  </button>
                </td>
              </tr>
              <tr v-if="!users.length">
                <td colspan="8" class="empty-row">Bu şərtlərə uyğun istifadəçi tapılmadı.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      </template>

      <!-- İstifadəçi kartı -->
      <el-dialog v-model="detailOpen" :title="detail?.user?.fullName || 'İstifadəçi'" width="520px">
        <div v-if="detail" class="detail">
          <div class="detail-head">
            <span class="status-badge" :class="detail.user.isActive ? 'ok' : 'off'">
              {{ detail.user.isActive ? 'Aktiv' : 'Bloklanıb' }}
            </span>
            <span class="detail-role">{{ roleLabel(detail.user.role) }}</span>
          </div>
          <dl class="detail-list">
            <div><dt>E-poçt</dt><dd>{{ detail.user.email }}</dd></div>
            <div><dt>Telefon</dt><dd>{{ detail.user.phone || '—' }}</dd></div>
            <div><dt>Qeydiyyat</dt><dd>{{ formatDateFull(detail.user.createdAt.slice(0, 10)) }}</dd></div>
            <div><dt>Rezervlər</dt><dd>{{ detail.reservationCount }} ({{ detail.pendingReservationCount }} cavabsız)</dd></div>
            <div><dt>Rəylər</dt><dd>{{ detail.reviewCount }}</dd></div>
            <div>
              <dt>Son rezerv</dt>
              <dd>{{ detail.lastReservationAt ? formatDateFull(detail.lastReservationAt.slice(0, 10)) : '—' }}</dd>
            </div>
            <div v-if="detail.venues.length">
              <dt>Saraylar</dt>
              <dd>{{ detail.venues.join(', ') }}</dd>
            </div>
          </dl>
        </div>
      </el-dialog>

      <!-- Müraciətin yoxlanışı — sahibkarın anketi ilə eyni quruluşda -->
      <VenueReview
        v-if="reviewVenue"
        :venue="reviewVenue"
        @close="reviewVenue = null"
        @changed="load"
      />

      <!-- Yeni hesab / redaktə -->
      <el-dialog
        v-model="formOpen"
        :title="formMode === 'create' ? 'Yeni hesab' : 'Hesabın məlumatları'"
        width="480px"
      >
        <div class="form-grid">
          <label>Ad<input v-model="form.firstName" class="dialog-input" /></label>
          <label>Soyad<input v-model="form.lastName" class="dialog-input" /></label>
          <label class="wide">E-poçt<input v-model="form.email" class="dialog-input" type="email" /></label>
          <label class="wide">Telefon<input v-model="form.phone" class="dialog-input" /></label>
          <template v-if="formMode === 'create'">
            <label class="wide">
              Parol
              <input v-model="form.password" class="dialog-input" placeholder="Ən azı 6 simvol" />
            </label>
            <label class="wide">
              Rol
              <select v-model="form.role" class="dialog-input">
                <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
            </label>
          </template>
        </div>
        <template #footer>
          <button class="mini-btn" @click="formOpen = false">İmtina</button>
          <button class="mini-btn ok" @click="submitForm">
            {{ formMode === 'create' ? 'Yarat' : 'Yadda saxla' }}
          </button>
        </template>
      </el-dialog>

      <!-- Parolun sıfırlanması -->
      <el-dialog v-model="passwordOpen" title="Yeni parol təyin et" width="420px">
        <p class="dialog-sub">{{ passwordTarget?.fullName }} üçün yeni parol.</p>
        <input v-model="newPassword" class="dialog-input" type="text" placeholder="Ən azı 6 simvol" />
        <template #footer>
          <button class="mini-btn" @click="passwordOpen = false">İmtina</button>
          <button class="mini-btn ok" @click="submitPassword">Təyin et</button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import AuditLogView from '@/components/AuditLogView.vue'
import VisitorsView from '@/components/VisitorsView.vue'
import ReviewsView from '@/components/ReviewsView.vue'
import ReservationsView from '@/components/ReservationsView.vue'
import SettingsView from '@/components/SettingsView.vue'
import VenuesView from '@/components/VenuesView.vue'
import DataView from '@/components/DataView.vue'
import VenueReview from '@/components/VenueReview.vue'
import {
  getPlatformStats,
  getUsers,
  getUserDetail,
  changeUserRole,
  setUserActive,
  resetUserPassword,
  getPendingVenues,
  approveVenue,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
} from '@/services/adminService'
import { formatDateFull } from '@/utils/date'

const auth = useAuthStore()

const stats = ref({})
const users = ref([])
const pendingVenues = ref([])
const roleFilter = ref('')
const statusFilter = ref('')
const search = ref('')
const isLoading = ref(false)

const detailOpen = ref(false)
const detail = ref(null)
const passwordOpen = ref(false)
const passwordTarget = ref(null)
const newPassword = ref('')

const section = ref('overview')

// İcmaldan «Redaktə et» basılanda hansı sarayın açılacağı
const editVenueId = ref(null)

// İcmalda «Bax» basılan müraciət — yoxlanış ekranı üçün
const reviewVenue = ref(null)

const formOpen = ref(false)
const formMode = ref('create')
const formTarget = ref(null)
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: 'Customer',
})

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
  { value: 'audit', label: 'Jurnal', icon: '📜' },
  { value: 'settings', label: 'Parametrlər', icon: '⚙️' },

  // Baza bölməsi bütün cədvəllərə birbaşa çıxış verir — yalnız platforma sahibinə
  ...(auth.isSuperAdmin ? [{ value: 'data', label: 'Baza', icon: '🗄' }] : []),
])

// Dəstək admini SuperAdmin hesablarını görmür — həm süzgəcdən, həm də
// rol seçimindən bu variant çıxarılır
const roleFilters = computed(() => [
  { value: '', label: 'Hamısı' },
  { value: 'Customer', label: 'Müştərilər' },
  { value: 'Owner', label: 'Saray rəhbərliyi' },
  { value: 'VenueAdmin', label: 'Saray administratorları' },
  { value: 'Support', label: 'Dəstək' },
  ...(auth.isSuperAdmin ? [{ value: 'SuperAdmin', label: 'SuperAdmin' }] : []),
])

const roles = computed(() => [
  { value: 'Customer', label: 'Müştəri' },
  { value: 'Owner', label: 'Saray rəhbərliyi' },
  { value: 'VenueAdmin', label: 'Saray administratoru' },
  { value: 'Support', label: 'Dəstək admini' },
  ...(auth.isSuperAdmin ? [{ value: 'SuperAdmin', label: 'SuperAdmin' }] : []),
])

const statusFilters = [
  { value: '', label: 'Hamısı' },
  { value: 'active', label: 'Aktiv' },
  { value: 'blocked', label: 'Bloklanmış' },
  { value: 'deleted', label: 'Silinmiş' },
]

const roleLabel = (value) => roles.value.find((r) => r.value === value)?.label ?? value

const currentQuery = () => ({
  role: roleFilter.value,
  q: search.value,
  status: statusFilter.value,
})

const load = async () => {
  isLoading.value = true
  try {
    const [platformStats, userList, pending] = await Promise.all([
      getPlatformStats(),
      getUsers(currentQuery()),
      getPendingVenues(),
    ])
    stats.value = platformStats
    users.value = userList
    pendingVenues.value = pending
  } finally {
    isLoading.value = false
  }
}

const reloadUsers = async () => {
  users.value = await getUsers(currentQuery())
}

// Saray bölməsində dəyişiklik olanda başlıqdakı saylar da yenilənməlidir
const loadStats = async () => {
  stats.value = await getPlatformStats()
  pendingVenues.value = await getPendingVenues()
}

const setRoleFilter = async (value) => {
  roleFilter.value = value
  await reloadUsers()
}

const setStatusFilter = async (value) => {
  statusFilter.value = value
  await reloadUsers()
}

// Hər hərfdə sorğu getməsin deyə yazmaq bitəndən sonra axtarırıq
let searchTimer = null
const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(reloadUsers, 350)
}

const notifyError = (e) =>
  ElNotification({
    title: 'Xəta',
    message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
    type: 'error',
    zIndex: 99999,
  })

const openDetail = async (user) => {
  detail.value = null
  detailOpen.value = true
  try {
    detail.value = await getUserDetail(user.id)
  } catch (e) {
    detailOpen.value = false
    notifyError(e)
  }
}

// Hesabı bloklayır və ya blokunu götürür — məlumat silinmir
const toggleActive = async (user) => {
  try {
    const message = await setUserActive(user.id, !user.isActive)
    ElNotification({ title: 'Hazırdır', message, type: 'success', zIndex: 99999 })
    await load()
  } catch (e) {
    notifyError(e)
  }
}

const openCreate = () => {
  formMode.value = 'create'
  formTarget.value = null
  Object.assign(form, {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'Customer',
  })
  formOpen.value = true
}

const openEdit = (user) => {
  formMode.value = 'edit'
  formTarget.value = user
  Object.assign(form, {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? '',
    password: '',
    role: user.role,
  })
  formOpen.value = true
}

const submitForm = async () => {
  try {
    const result =
      formMode.value === 'create'
        ? await createUser({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            password: form.password,
            role: form.role,
          })
        : await updateUser(formTarget.value.id, {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
          })

    if (!result.success) return notifyError({ userMessage: result.message })

    formOpen.value = false
    ElNotification({ title: 'Hazırdır', message: result.message, type: 'success', zIndex: 99999 })
    await load()
  } catch (e) {
    notifyError(e)
  }
}

// Silinmiş hesabı geri qaytarır
const restore = async (user) => {
  try {
    const result = await restoreUser(user.id)
    if (!result.success) return notifyError({ userMessage: result.message })

    ElNotification({ title: 'Hazırdır', message: result.message, type: 'success', zIndex: 99999 })
    await load()
  } catch (e) {
    notifyError(e)
  }
}

// Silmək yalnız «təmiz» hesablar üçün işləyir — server sarayı və rezervi yoxlayır
const removeUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `${user.fullName} hesabı silinmiş kimi işarələnəcək — «Silinmiş» süzgəcindən geri qaytarmaq olar.`,
      'Hesabı sil',
      { confirmButtonText: 'Sil', cancelButtonText: 'İmtina', type: 'warning' },
    )
  } catch {
    return
  }

  try {
    const result = await deleteUser(user.id)
    if (!result.success) return notifyError({ userMessage: result.message })

    ElNotification({ title: 'Silindi', message: result.message, type: 'success', zIndex: 99999 })
    await load()
  } catch (e) {
    notifyError(e)
  }
}

const openPassword = (user) => {
  passwordTarget.value = user
  newPassword.value = ''
  passwordOpen.value = true
}

const submitPassword = async () => {
  try {
    const message = await resetUserPassword(passwordTarget.value.id, newPassword.value)
    ElNotification({ title: 'Hazırdır', message, type: 'success', zIndex: 99999 })
    passwordOpen.value = false
  } catch (e) {
    notifyError(e)
  }
}

// İstifadəçinin rolunu dəyişir və siyahını yeniləyir
const onRoleChange = async (user, role) => {
  try {
    const message = await changeUserRole(user.id, role)
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
    await load()
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
    await load()
  }
}

// Sarayı təsdiqləyir — bundan sonra ictimai siyahıda görünür
const approve = async (venue) => {
  try {
    const message = await approveVenue(venue.id)
    ElNotification({ title: 'Təsdiqləndi', message, type: 'success', zIndex: 99999 })
    await load()
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
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
  background: linear-gradient(120deg, #2a0f1c 0%, #4a0d24 55%, #721438 100%);
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
  color: #dfb15b;
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
  color: #dfb15b;
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
  border: 1px solid #f0eaec;
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
  background: #b06a2b;
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
  border-color: #dfb15b;
  transform: translateY(-1px);
}

.section-tab.active {
  background: #721438;
  border-color: #721438;
  color: #fff;
  box-shadow: 0 6px 16px rgba(114, 20, 56, 0.25);
}

.section-tab.active .tab-badge {
  background: #dfb15b;
  color: #4a0d24;
}

/* Göstəricilər */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  background: linear-gradient(135deg, #1a1118, #3a2430);
  border-color: transparent;
}

.stat-card.dark .stat-value { color: #dfb15b; }
.stat-card.dark .stat-label,
.stat-card.dark .stat-sub { color: rgba(255, 255, 255, 0.75); }

.stat-value {
  font-size: 1.7rem;
  font-weight: 800;
  color: #1a1118;
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
  color: #1a1118;
}

.block-title em {
  font-style: normal;
  background: #f6e9ee;
  color: #721438;
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
  color: #1a1118;
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

.head-tools {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

/* Dialoq formaları */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.76rem;
  color: #868e96;
}

.form-grid label.wide {
  grid-column: 1 / -1;
}

.mini-btn.link {
  color: #1c5cab;
  border-color: #dce8f7;
  text-decoration: none;
  display: inline-block;
}

/* Axtarış və süzgəc sətri */
.search-box {
  flex: 1;
  min-width: 240px;
  max-width: 380px;
  border: 1px solid #f0eaec;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 0.85rem;
  color: #1a1118;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.search-box:focus {
  border-color: #dfb15b;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

/* Filtr çipləri */
.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  background: #fff;
  border: 1px solid #f0eaec;
  color: #6c757d;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: #dfb15b;
}

.chip.active {
  background: #721438;
  border-color: #721438;
  color: #fff;
}

/* İstifadəçi cədvəli */
.table-wrap {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.user-table th {
  text-align: left;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #b8a3ab;
  padding: 8px 10px;
  border-bottom: 1px solid #f2ecee;
  white-space: nowrap;
}

.user-table td {
  padding: 10px;
  border-bottom: 1px solid #faf7f8;
  color: #1a1118;
}

.user-table .muted {
  color: #868e96;
  font-size: 0.83rem;
}

/* Bloklanmış sətir solğun görünür */
.user-table tr.blocked td {
  background: #fdf6f7;
  opacity: 0.75;
}

/* Silinmiş hesab sönük və üstündən xətli — amma yerində qalır */
.user-table tr.removed td {
  background: #fbf8f9;
  color: #b8a3ab;
}

.user-table tr.removed td:not(.row-actions) {
  text-decoration: line-through;
}

.name-link {
  cursor: pointer;
  border-bottom: 1px dashed #d8c3cb;
}

.name-link:hover {
  color: #721438;
  border-bottom-color: #721438;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.status-badge.ok {
  background: #e8f6ec;
  color: #1a7f37;
}

.status-badge.off {
  background: #fdecec;
  color: #b3261e;
}

.row-actions {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.mini-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: #4a3f44;
  padding: 5px 11px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.mini-btn:hover:not(:disabled) {
  border-color: #dfb15b;
  color: #1a1118;
}

.mini-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mini-btn.danger:hover:not(:disabled) {
  background: #fdecec;
  border-color: #b3261e;
  color: #b3261e;
}

.mini-btn.ok {
  background: #1a7f37;
  border-color: #1a7f37;
  color: #fff;
}

.mini-btn.ok:hover:not(:disabled) {
  background: #17692b;
  color: #fff;
}

.empty-row {
  text-align: center;
  color: #a6969c;
  padding: 26px 10px !important;
  font-size: 0.85rem;
}

/* İstifadəçi kartı pəncərəsi */
.detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.detail-role {
  font-size: 0.8rem;
  color: #721438;
  font-weight: 600;
}

.detail-list {
  margin: 0;
  display: grid;
  gap: 1px;
  background: #f2ecee;
  border: 1px solid #f2ecee;
  border-radius: 10px;
  overflow: hidden;
}

.detail-list > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  background: #fff;
  padding: 10px 14px;
}

.detail-list dt {
  color: #868e96;
  font-size: 0.8rem;
}

.detail-list dd {
  margin: 0;
  color: #1a1118;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: right;
}

.dialog-sub {
  margin: 0 0 12px;
  color: #868e96;
  font-size: 0.85rem;
}

.dialog-input {
  width: 100%;
  border: 1px solid #ece5e8;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.9rem;
  outline: none;
}

.dialog-input:focus {
  border-color: #dfb15b;
}

.you-tag {
  background: #fdf3e0;
  color: #b07d2b;
  font-style: normal;
  font-size: 0.66rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
  margin-left: 6px;
}

.role-select {
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 0.82rem;
  font-weight: 600;
  background: #fff;
  cursor: pointer;
  color: #495057;
}

.role-select:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.role-select.owner { border-color: #e8cdd8; color: #721438; }
.role-select.superadmin { border-color: #1a1118; color: #1a1118; }
.role-select.venueadmin { border-color: #f0dfbe; color: #8a6220; }
.role-select.support { border-color: #cfe3d4; color: #1e7e34; }

@media (max-width: 980px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .admin-page {
    padding: 24px 16px 50px;
  }
}
</style>
