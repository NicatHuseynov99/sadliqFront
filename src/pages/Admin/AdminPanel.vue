<template>
  <div class="admin-page" v-loading="isLoading">
    <div class="admin-inner">
      <header class="page-head">
        <div>
          <h1 class="page-title">Platforma idarəetməsi</h1>
          <p class="page-sub">Bütün istifadəçilər, saraylar və göstəricilər</p>
        </div>
        <span class="admin-tag" :class="{ support: auth.isSupport }">
          {{ auth.isSupport ? '🛟 Dəstək' : '⚙️ SuperAdmin' }} · {{ auth.user?.fullName }}
        </span>
      </header>

      <!-- Bölmələr -->
      <div class="section-tabs">
        <button
          v-if="auth.isSuperAdmin"
          class="section-tab"
          :class="{ active: section === 'overview' }"
          @click="section = 'overview'"
        >
          İcmal
        </button>
        <button class="section-tab" :class="{ active: section === 'audit' }" @click="section = 'audit'">
          Fəaliyyət jurnalı
        </button>
      </div>

      <AuditLogView v-if="section === 'audit'" />

      <template v-else>

      <!-- Göstəricilər -->
      <div class="stat-row">
        <div class="stat-card dark">
          <span class="stat-value">{{ stats.users ?? 0 }}</span>
          <span class="stat-label">İstifadəçi</span>
          <span class="stat-sub">{{ stats.customers ?? 0 }} müştəri · {{ stats.owners ?? 0 }} sahib</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.venues ?? 0 }}</span>
          <span class="stat-label">Saray</span>
          <span class="stat-sub" :class="{ warn: stats.pendingVenues }">
            {{ stats.pendingVenues ?? 0 }} təsdiq gözləyir
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.reservations ?? 0 }}</span>
          <span class="stat-label">Rezerv</span>
          <span class="stat-sub" :class="{ warn: stats.pendingReservations }">
            {{ stats.pendingReservations ?? 0 }} cavabsız
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.reviews ?? 0 }}</span>
          <span class="stat-label">Rəy</span>
        </div>
      </div>

      <!-- Təsdiq gözləyən saraylar -->
      <section class="block" v-if="pendingVenues.length">
        <h2 class="block-title">Təsdiq gözləyən saraylar <em>{{ pendingVenues.length }}</em></h2>
        <div class="pending-list">
          <div v-for="v in pendingVenues" :key="v.id" class="pending-card">
            <img :src="v.coverImageUrl" :alt="v.name" @error="onImgError" />
            <div class="pending-text">
              <b>{{ v.name }}</b>
              <span>{{ v.city }} · {{ v.address }}</span>
              <em>{{ v.phone }}</em>
            </div>
            <button class="approve-btn" @click="approve(v)">Təsdiqlə</button>
          </div>
        </div>
      </section>

      <!-- İstifadəçilər -->
      <section class="block">
        <div class="block-head">
          <h2 class="block-title">İstifadəçilər</h2>
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
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td>
                  <b>{{ u.fullName }}</b>
                  <em v-if="u.id === auth.user?.id" class="you-tag">siz</em>
                </td>
                <td class="muted">{{ u.email }}</td>
                <td class="muted">{{ u.phone }}</td>
                <td class="muted">{{ u.venueCount || '—' }}</td>
                <td class="muted">{{ formatDateFull(u.createdAt.slice(0, 10)) }}</td>
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
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElNotification } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import AuditLogView from '@/components/AuditLogView.vue'
import {
  getPlatformStats,
  getUsers,
  changeUserRole,
  getPendingVenues,
  approveVenue,
} from '@/services/adminService'
import { formatDateFull } from '@/utils/date'

const auth = useAuthStore()

const stats = ref({})
const users = ref([])
const pendingVenues = ref([])
const roleFilter = ref('')
const isLoading = ref(false)

// Dəstək admini yalnız jurnalı görür, icmal SuperAdmin üçündür
const section = ref(auth.isSuperAdmin ? 'overview' : 'audit')

const roleFilters = [
  { value: '', label: 'Hamısı' },
  { value: 'Customer', label: 'Müştərilər' },
  { value: 'Owner', label: 'Saray rəhbərliyi' },
  { value: 'VenueAdmin', label: 'Saray administratorları' },
  { value: 'Support', label: 'Dəstək' },
  { value: 'SuperAdmin', label: 'SuperAdmin' },
]

const roles = [
  { value: 'Customer', label: 'Müştəri' },
  { value: 'Owner', label: 'Saray rəhbərliyi' },
  { value: 'VenueAdmin', label: 'Saray administratoru' },
  { value: 'Support', label: 'Dəstək admini' },
  { value: 'SuperAdmin', label: 'SuperAdmin' },
]

const load = async () => {
  // İcmal məlumatları yalnız SuperAdmin-ə açıqdır
  if (!auth.isSuperAdmin) return

  isLoading.value = true
  try {
    const [platformStats, userList, pending] = await Promise.all([
      getPlatformStats(),
      getUsers(roleFilter.value),
      getPendingVenues(),
    ])
    stats.value = platformStats
    users.value = userList
    pendingVenues.value = pending
  } finally {
    isLoading.value = false
  }
}

const setRoleFilter = async (value) => {
  roleFilter.value = value
  users.value = await getUsers(value)
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

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 22px;
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

.admin-tag {
  background: #1a1118;
  color: #dfb15b;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 20px;
  white-space: nowrap;
}

.admin-tag.support {
  background: #e3f6e8;
  color: #1e7e34;
}

/* Bölmə seçimi */
.section-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.section-tab {
  background: #fff;
  border: 1px solid #f0eaec;
  color: #6c757d;
  padding: 9px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.section-tab:hover {
  border-color: #dfb15b;
}

.section-tab.active {
  background: #721438;
  border-color: #721438;
  color: #fff;
}

/* Göstəricilər */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 26px;
}

.stat-card {
  background: #fff;
  border: 1px solid #f2ecee;
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
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
