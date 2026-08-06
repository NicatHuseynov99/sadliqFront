<template>
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
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import {
  getUsers,
  getUserDetail,
  changeUserRole,
  setUserActive,
  resetUserPassword,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
} from '@/services/adminService'
import { formatDateFull } from '@/utils/date'

const auth = useAuthStore()

const users = ref([])
const roleFilter = ref('')
const statusFilter = ref('')
const search = ref('')

const detailOpen = ref(false)
const detail = ref(null)
const passwordOpen = ref(false)
const passwordTarget = ref(null)
const newPassword = ref('')

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
  users.value = await getUsers(currentQuery())
}

const setRoleFilter = async (value) => {
  roleFilter.value = value
  await load()
}

const setStatusFilter = async (value) => {
  statusFilter.value = value
  await load()
}

// Hər hərfdə sorğu getməsin deyə yazmaq bitəndən sonra axtarırıq
let searchTimer = null
const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 350)
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
    notifyError(e)
    await load()
  }
}

onMounted(load)
</script>

<style scoped>
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
  color: var(--muted);
}

.form-grid label.wide {
  grid-column: 1 / -1;
}

/* Axtarış və süzgəc sətri */
.search-box {
  flex: 1;
  min-width: 240px;
  max-width: 380px;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 0.85rem;
  color: var(--ink);
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.search-box:focus {
  border-color: var(--gold);
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
  border: 1px solid var(--line-2);
  color: #6c757d;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: var(--gold);
}

.chip.active {
  background: var(--brand);
  border-color: var(--brand);
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
  border-bottom: 1px solid var(--bg);
  color: var(--ink);
}

.user-table .muted {
  color: var(--muted);
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
  color: var(--brand);
  border-bottom-color: var(--brand);
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
  color: var(--ink-2);
  padding: 5px 11px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.mini-btn:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--ink);
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
  color: var(--muted-2);
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
  color: var(--brand);
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
  color: var(--muted);
  font-size: 0.8rem;
}

.detail-list dd {
  margin: 0;
  color: var(--ink);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: right;
}

.dialog-sub {
  margin: 0 0 12px;
  color: var(--muted);
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
  border-color: var(--gold);
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

.role-select.owner { border-color: #e8cdd8; color: var(--brand); }
.role-select.superadmin { border-color: var(--ink); color: var(--ink); }
.role-select.venueadmin { border-color: #f0dfbe; color: #8a6220; }
.role-select.support { border-color: #cfe3d4; color: #1e7e34; }
</style>
