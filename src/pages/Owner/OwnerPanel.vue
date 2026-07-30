<template>
  <div class="panel-page" v-loading="isLoading">
    <div class="panel-inner">
      <header class="page-head">
        <div>
          <h1 class="page-title">İdarəetmə paneli</h1>
          <p class="page-sub">Saraylarınıza gələn rezerv sorğularını buradan idarə edin</p>
        </div>
        <span class="owner-tag">{{ auth.isSuperAdmin ? '⚙️' : '🏛' }} {{ auth.user?.fullName }}</span>
      </header>

      <!-- Ümumi göstəricilər -->
      <div class="stat-row">
        <div class="stat-card accent">
          <span class="stat-value">{{ pendingCount }}</span>
          <span class="stat-label">Cavab gözləyir</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ confirmedCount }}</span>
          <span class="stat-label">Təsdiqlənmiş</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ venues.length }}</span>
          <span class="stat-label">Sarayınız</span>
        </div>
        <!-- Gəlir göstəricisi hesabat sayılır — administrator onu görmür -->
        <div class="stat-card" v-if="auth.canEditVenues">
          <span class="stat-value">{{ expectedIncome.toLocaleString() }} ₼</span>
          <span class="stat-label">Təsdiqlənmiş gəlir</span>
        </div>
      </div>

      <!-- Bölmə seçimi (yalnız rəhbərlikdə administratorlar bölməsi var) -->
      <div class="section-tabs" v-if="auth.canEditVenues">
        <button class="section-tab" :class="{ active: section === 'reservations' }" @click="section = 'reservations'">
          Rezerv sorğuları
        </button>
        <button class="section-tab" :class="{ active: section === 'venues' }" @click="section = 'venues'">
          Saraylarım <em>{{ venues.length }}</em>
        </button>
        <button class="section-tab" :class="{ active: section === 'staff' }" @click="openStaff">
          Administratorlar <em v-if="staff.length">{{ staff.length }}</em>
        </button>
      </div>

      <div v-if="!isLoading && venues.length === 0" class="no-result">
        <div class="empty-icon">🏛</div>
        <h3>Hələ sarayınız yoxdur.</h3>
        <p>Saray əlavə olunduqdan sonra rezerv sorğuları burada görünəcək.</p>
      </div>

      <!-- Saraylarım bölməsi -->
      <VenueManager v-else-if="section === 'venues'" :venues="venues" @changed="load" />

      <!-- Administratorlar bölməsi -->
      <div v-else-if="section === 'staff'" class="staff-block" v-loading="isLoadingStaff">
        <section class="staff-form">
          <h2 class="block-title">Yeni administrator</h2>
          <p class="block-sub">
            Administrator yalnız seçdiyiniz sarayın rezervlərini görür və təsdiqləyir.
            Hesabat və istifadəçi idarəetməsi ona bağlıdır.
          </p>

          <el-form label-position="top" @submit.prevent>
            <el-form-item label="Saray">
              <el-select v-model="staffForm.venueId" placeholder="Saray seçin" style="width: 100%">
                <el-option v-for="v in venues" :key="v.id" :value="v.id" :label="v.name" />
              </el-select>
            </el-form-item>

            <div class="form-row">
              <el-form-item label="Ad">
                <el-input v-model="staffForm.firstName" placeholder="Ad" />
              </el-form-item>
              <el-form-item label="Soyad">
                <el-input v-model="staffForm.lastName" placeholder="Soyad" />
              </el-form-item>
            </div>

            <el-form-item label="E-poçt">
              <el-input v-model="staffForm.email" placeholder="admin@saray.az" />
            </el-form-item>

            <div class="form-row">
              <el-form-item label="Telefon">
                <el-input v-model="staffForm.phone" placeholder="+994 xx xxx xx xx" />
              </el-form-item>
              <el-form-item label="Parol">
                <el-input v-model="staffForm.password" type="password" show-password placeholder="Ən azı 6 simvol" />
              </el-form-item>
            </div>

            <p v-if="staffError" class="form-error">{{ staffError }}</p>

            <button class="confirm-btn wide" :disabled="isSavingStaff" @click="submitStaff">
              {{ isSavingStaff ? 'Yaradılır...' : 'Administrator əlavə et' }}
            </button>
          </el-form>
        </section>

        <section class="staff-list">
          <h2 class="block-title">Mövcud administratorlar</h2>

          <div v-if="!staff.length" class="empty-box">Hələ administrator təyin etməmisiniz.</div>

          <div v-for="s in staff" :key="s.id" class="staff-card" :class="{ off: !s.isActive }">
            <div class="staff-avatar">{{ initials(s.fullName) }}</div>
            <div class="staff-text">
              <b>{{ s.fullName }}</b>
              <span>{{ s.email }} · {{ s.phone || '—' }}</span>
              <em>🏛 {{ s.venueName }}</em>
            </div>
            <div class="staff-actions">
              <span class="staff-status" :class="{ on: s.isActive }">
                {{ s.isActive ? 'Aktiv' : 'Bağlı' }}
              </span>
              <button class="mini-btn" @click="editStaff(s)">Redaktə</button>
              <button class="mini-btn" @click="toggleStaff(s)">
                {{ s.isActive ? 'Girişi bağla' : 'Aktivləşdir' }}
              </button>
              <button class="mini-btn" @click="askResetPassword(s)">Parolu sıfırla</button>
              <el-popconfirm
                title="Administrator siyahıdan silinsin?"
                confirm-button-text="Bəli, sil"
                cancel-button-text="Xeyr"
                @confirm="removeStaff(s)"
              >
                <template #reference>
                  <button class="mini-btn danger">Sil</button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </section>
      </div>

      <div v-else class="panel-body">
        <!-- Saray seçimi -->
        <aside class="venue-list">
          <span class="side-label">Saraylarım</span>
          <button
            v-for="v in venues"
            :key="v.id"
            class="venue-item"
            :class="{ active: v.id === selectedVenueId }"
            @click="selectVenue(v.id)"
          >
            <img :src="v.coverImageUrl" :alt="v.name" @error="onImgError" />
            <span class="vi-text">
              <b>{{ v.name }}</b>
              <em>{{ v.city }} · {{ v.hallCount }} zal</em>
            </span>
            <span v-if="pendingByVenue[v.id]" class="vi-badge">{{ pendingByVenue[v.id] }}</span>
          </button>
        </aside>

        <!-- Rezerv sorğuları -->
        <section class="reservations" v-loading="isLoadingReservations">
          <div class="res-head">
            <h2>{{ selectedVenue?.name }} — rezerv sorğuları</h2>
            <div class="tabs">
              <button
                v-for="tab in tabs"
                :key="tab.value"
                class="tab"
                :class="{ active: activeTab === tab.value }"
                @click="activeTab = tab.value"
              >
                {{ tab.label }}
                <em v-if="counts[tab.value]">{{ counts[tab.value] }}</em>
              </button>
            </div>
          </div>

          <div v-if="!isLoadingReservations && visible.length === 0" class="empty-box">
            Bu bölmədə sorğu yoxdur.
          </div>

          <article v-for="r in visible" :key="r.id" class="res-card" :class="statusClass(r.status)">
            <div class="res-top">
              <div>
                <h3>{{ r.customerName }}</h3>
                <span class="res-meta">{{ r.customerEmail }} · 📞 {{ r.contactPhone }}</span>
              </div>
              <span class="status-tag" :class="statusClass(r.status)">{{ statusText(r.status) }}</span>
            </div>

            <div class="res-facts">
              <div class="fact">
                <span class="fact-label">Tədbir tarixi</span>
                <b>{{ formatDateFull(r.eventDate) }}</b>
              </div>
              <div class="fact">
                <span class="fact-label">Zal</span>
                <b>{{ r.hallName }}</b>
                <em>{{ r.guestCount }} / {{ r.hallCapacity }} qonaq</em>
              </div>
              <div class="fact">
                <span class="fact-label">Menyu</span>
                <b>{{ r.menuName }}</b>
                <em>{{ r.pricePerPerson }} ₼ / nəfər</em>
              </div>
              <div class="fact fact-total">
                <span class="fact-label">Məbləğ</span>
                <b>{{ (r.pricePerPerson * r.guestCount).toLocaleString() }} ₼</b>
              </div>
            </div>

            <p class="res-note" v-if="r.note">💬 {{ r.note }}</p>

            <footer class="res-foot">
              <span class="res-date">Sorğu tarixi: {{ formatDateFull(r.createdAt.slice(0, 10)) }}</span>

              <div class="res-actions" v-if="r.status === 0">
                <el-popconfirm
                  title="Bu sorğunu rədd etmək istəyirsiniz?"
                  confirm-button-text="Bəli, rədd et"
                  cancel-button-text="Xeyr"
                  @confirm="setStatus(r, 2)"
                >
                  <template #reference>
                    <button class="reject-btn">Rədd et</button>
                  </template>
                </el-popconfirm>
                <button class="confirm-btn" @click="setStatus(r, 1)">Təsdiqlə</button>
              </div>
            </footer>
          </article>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElNotification } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { ElMessageBox } from 'element-plus'
import VenueManager from '@/components/VenueManager.vue'
import {
  getMyVenues,
  getOwnerReservations,
  getVenueReservations,
  updateReservationStatus,
  getMyStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  setStaffActive,
  resetStaffPassword,
} from '@/services/ownerService'
import { formatDateFull } from '@/utils/date'

const auth = useAuthStore()

const venues = ref([])
const selectedVenueId = ref(null)
const reservations = ref([])
const allReservations = ref({})
const isLoading = ref(false)
const isLoadingReservations = ref(false)
const activeTab = ref(0)

// Panelin bölmələri: rezervlər / administratorlar
const section = ref('reservations')
const staff = ref([])
const isLoadingStaff = ref(false)
const isSavingStaff = ref(false)
const staffError = ref('')
const staffForm = reactive({
  venueId: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
})

const tabs = [
  { value: 0, label: 'Gözləyir' },
  { value: 1, label: 'Təsdiqlənmiş' },
  { value: 2, label: 'Rədd edilmiş' },
  { value: 'all', label: 'Hamısı' },
]

// Sahibin saraylarını və hər birinin rezervlərini yükləyir
const load = async () => {
  isLoading.value = true
  try {
    // İki sorğu: saraylar və bütün rezervlər (rezervlər saray Id-sinə görə qruplaşdırılmış gəlir)
    const [myVenues, grouped] = await Promise.all([getMyVenues(), getOwnerReservations()])
    venues.value = myVenues
    allReservations.value = grouped

    if (!venues.value.length) return

    // Cavab gözləyən sorğusu olan ilk saray seçilir
    const withPending = venues.value.find((v) => pendingByVenue.value[v.id] > 0)
    selectVenue((withPending ?? venues.value[0]).id)
  } finally {
    isLoading.value = false
  }
}

const selectVenue = (venueId) => {
  selectedVenueId.value = venueId
  reservations.value = allReservations.value[venueId] ?? []
}

const selectedVenue = computed(() => venues.value.find((v) => v.id === selectedVenueId.value))

// Hər saray üçün cavab gözləyən sorğu sayı (yan siyahıdakı nişan)
const pendingByVenue = computed(() => {
  const result = {}
  for (const [venueId, list] of Object.entries(allReservations.value)) {
    result[venueId] = list.filter((r) => r.status === 0).length
  }
  return result
})

const flatReservations = computed(() => Object.values(allReservations.value).flat())

const pendingCount = computed(() => flatReservations.value.filter((r) => r.status === 0).length)
const confirmedCount = computed(() => flatReservations.value.filter((r) => r.status === 1).length)

// Təsdiqlənmiş rezervlərdən gözlənilən ümumi gəlir
const expectedIncome = computed(() =>
  flatReservations.value
    .filter((r) => r.status === 1)
    .reduce((sum, r) => sum + r.pricePerPerson * r.guestCount, 0),
)

const counts = computed(() => {
  const result = { all: reservations.value.length }
  for (const r of reservations.value) result[r.status] = (result[r.status] ?? 0) + 1
  return result
})

const visible = computed(() =>
  activeTab.value === 'all'
    ? reservations.value
    : reservations.value.filter((r) => r.status === activeTab.value),
)

const statusText = (s) =>
  ({ 0: 'Gözləyir', 1: 'Təsdiqlənib', 2: 'Rədd edilib', 3: 'Müştəri ləğv edib' })[s] ?? '—'

const statusClass = (s) =>
  ({ 0: 'pending', 1: 'confirmed', 2: 'rejected', 3: 'cancelled' })[s] ?? ''

// Sorğunu təsdiqləyir və ya rədd edir, sonra siyahını yeniləyir
const setStatus = async (reservation, status) => {
  isLoadingReservations.value = true
  try {
    const message = await updateReservationStatus(reservation.id, status)
    allReservations.value[selectedVenueId.value] = await getVenueReservations(selectedVenueId.value)
    reservations.value = allReservations.value[selectedVenueId.value]
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  } finally {
    isLoadingReservations.value = false
  }
}

// ============ Administratorlar ============

const openStaff = async () => {
  section.value = 'staff'
  if (!staff.value.length) await loadStaff()
}

const loadStaff = async () => {
  isLoadingStaff.value = true
  try {
    staff.value = await getMyStaff()
  } finally {
    isLoadingStaff.value = false
  }
}

// Yeni administrator hesabı yaradır və seçilmiş saraya təyin edir
const submitStaff = async () => {
  if (!staffForm.venueId || !staffForm.firstName || !staffForm.lastName || !staffForm.email) {
    staffError.value = 'Saray, ad, soyad və e-poçt mütləqdir.'
    return
  }

  isSavingStaff.value = true
  staffError.value = ''
  try {
    const { message } = await createStaff({ ...staffForm })
    Object.assign(staffForm, { firstName: '', lastName: '', email: '', phone: '', password: '' })
    await loadStaff()
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    staffError.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isSavingStaff.value = false
  }
}

// Administratorun ad, soyad və telefonunu redaktə edir
const editStaff = async (member) => {
  try {
    const { value } = await ElMessageBox.prompt(
      'Ad, soyad və telefonu vergüllə yazın: Ad, Soyad, Telefon',
      `${member.fullName} — redaktə`,
      {
        confirmButtonText: 'Yadda saxla',
        cancelButtonText: 'İmtina',
        inputValue: `${member.fullName}, ${member.phone ?? ''}`,
      },
    )

    const parts = value.split(',').map((p) => p.trim())
    const message = await updateStaff(member.id, {
      firstName: parts[0] ?? '',
      lastName: parts[1] ?? '',
      phone: parts[2] ?? '',
    })

    await loadStaff()
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    if (e === 'cancel' || e === 'close') return

    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  }
}

// Administratoru siyahıdan silir (hesabın özü qalır)
const removeStaff = async (member) => {
  try {
    const message = await deleteStaff(member.id)
    await loadStaff()
    ElNotification({ title: 'Silindi', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  }
}

// Administratorun girişini bağlayır və ya yenidən açır
const toggleStaff = async (member) => {
  try {
    const message = await setStaffActive(member.id, !member.isActive)
    await loadStaff()
    ElNotification({ title: 'Yeniləndi', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  }
}

// Administrator parolunu unudubsa, rəhbərlik onu sıfırlaya bilər
const askResetPassword = async (member) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `${member.fullName} üçün yeni parol (ən azı 6 simvol)`,
      'Parolu sıfırla',
      { confirmButtonText: 'Yenilə', cancelButtonText: 'İmtina', inputType: 'password' },
    )

    const message = await resetStaffPassword(member.id, value)
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    // İstifadəçi imtina edibsə heç nə etmirik
    if (e === 'cancel' || e === 'close') return

    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  }
}

const initials = (fullName) =>
  (fullName ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase('az'))
    .join('')

const onImgError = (e) => {
  e.target.src = 'https://picsum.photos/seed/sadliq/200/200'
}

onMounted(load)
</script>

<style scoped>
.panel-page {
  min-height: calc(100vh - 61px);
  background: #f4f6f8;
  padding: 30px 40px 60px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.panel-inner {
  max-width: 1360px;
  margin: 0 auto;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
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

.owner-tag {
  background: #f6e9ee;
  color: #721438;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 20px;
  white-space: nowrap;
}

/* Göstəricilər */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
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

.stat-card.accent {
  background: linear-gradient(135deg, #721438, #9c2350);
  border-color: transparent;
}

.stat-card.accent .stat-value,
.stat-card.accent .stat-label {
  color: #fff;
}

.stat-card.accent .stat-label {
  opacity: 0.85;
}

.stat-value {
  font-size: 1.6rem;
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

.section-tab em {
  font-style: normal;
  background: #f6e9ee;
  color: #721438;
  font-size: 0.72rem;
  padding: 1px 8px;
  border-radius: 20px;
  margin-left: 6px;
}

.section-tab:hover {
  border-color: #dfb15b;
}

.section-tab.active {
  background: #721438;
  border-color: #721438;
  color: #fff;
}

.section-tab.active em {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Administratorlar bölməsi */
.staff-block {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  align-items: start;
}

.staff-form,
.staff-list {
  background: #fff;
  border: 1px solid #f2ecee;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

.block-title {
  margin: 0 0 4px;
  font-size: 1.1rem;
  color: #1a1118;
}

.block-sub {
  margin: 0 0 16px;
  font-size: 0.83rem;
  color: #868e96;
  line-height: 1.5;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.confirm-btn.wide {
  width: 100%;
  padding: 11px;
  margin-top: 4px;
}

.form-error {
  margin: 0 0 10px;
  color: #d93025;
  font-size: 13px;
}

.staff-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #f2ecee;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  transition: all 0.15s;
}

.staff-card.off {
  background: #faf9fa;
  opacity: 0.75;
}

.staff-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #721438, #b07d2b);
  flex-shrink: 0;
  font-size: 0.9rem;
}

.staff-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-grow: 1;
}

.staff-text b {
  font-size: 0.92rem;
  color: #1a1118;
}

.staff-text span,
.staff-text em {
  font-style: normal;
  font-size: 0.77rem;
  color: #adb5bd;
}

.staff-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.staff-status {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  background: #f1f3f5;
  color: #868e96;
}

.staff-status.on {
  background: #e3f6e8;
  color: #1e7e34;
}

.mini-btn {
  background: #fff;
  border: 1px solid #eaeaea;
  color: #6c757d;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.mini-btn:hover {
  border-color: #721438;
  color: #721438;
}

/* Əsas hissə */
.panel-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  align-items: start;
}

.venue-list {
  background: #fff;
  border: 1px solid #f2ecee;
  border-radius: 14px;
  padding: 14px;
  max-height: 640px;
  overflow-y: auto;
}

.side-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #b8a3ab;
  margin-bottom: 10px;
  padding-left: 4px;
}

.venue-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  text-align: left;
  margin-bottom: 4px;
  transition: all 0.15s;
}

.venue-item:hover {
  background: #faf7f8;
}

.venue-item.active {
  background: #f6e9ee;
  border-color: #e8cdd8;
}

.venue-item img {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.vi-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-grow: 1;
}

.vi-text b {
  font-size: 0.87rem;
  color: #1a1118;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vi-text em {
  font-style: normal;
  font-size: 0.73rem;
  color: #adb5bd;
}

.vi-badge {
  background: #721438;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  min-width: 20px;
  height: 20px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  padding: 0 6px;
}

/* Rezervlər */
.reservations {
  min-height: 200px;
}

.res-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.res-head h2 {
  margin: 0;
  font-size: 1.15rem;
  color: #1a1118;
}

.tabs {
  display: flex;
  gap: 6px;
}

.tab {
  background: #fff;
  border: 1px solid #f0eaec;
  color: #6c757d;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.tab em {
  font-style: normal;
  opacity: 0.6;
  margin-left: 3px;
}

.tab:hover {
  border-color: #dfb15b;
}

.tab.active {
  background: #721438;
  border-color: #721438;
  color: #fff;
}

.res-card {
  background: #fff;
  border: 1px solid #eaeaea;
  border-left: 4px solid #eaeaea;
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 14px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

.res-card.pending { border-left-color: #dfb15b; }
.res-card.confirmed { border-left-color: #1e7e34; }
.res-card.rejected { border-left-color: #c0392b; }
.res-card.cancelled { border-left-color: #ced4da; }

.res-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.res-top h3 {
  margin: 0 0 2px;
  font-size: 1.05rem;
  color: #1a1118;
}

.res-meta {
  font-size: 0.8rem;
  color: #adb5bd;
}

.status-tag {
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.status-tag.pending { background: #fff6e0; color: #b07d2b; }
.status-tag.confirmed { background: #e3f6e8; color: #1e7e34; }
.status-tag.rejected { background: #fdeaea; color: #c0392b; }
.status-tag.cancelled { background: #f1f3f5; color: #868e96; }

.res-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid #f5f1f2;
  border-bottom: 1px solid #f5f1f2;
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fact-label {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #b8a3ab;
  font-weight: 700;
}

.fact b {
  font-size: 0.9rem;
  color: #1a1118;
}

.fact em {
  font-style: normal;
  font-size: 0.75rem;
  color: #868e96;
}

.fact-total b {
  color: #721438;
  font-size: 1.1rem;
  font-weight: 800;
}

.res-note {
  margin: 12px 0 0;
  font-size: 0.83rem;
  color: #868e96;
  font-style: italic;
}

.res-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.res-date {
  font-size: 0.78rem;
  color: #adb5bd;
}

.res-actions {
  display: flex;
  gap: 10px;
}

.confirm-btn {
  background: #1e7e34;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 0.87rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-btn:hover {
  background: #17692b;
}

.reject-btn {
  background: #fff;
  color: #c0392b;
  border: 1px solid #e5b4ae;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.87rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reject-btn:hover {
  background: #c0392b;
  border-color: #c0392b;
  color: #fff;
}

.empty-box,
.no-result {
  background: #fff;
  border-radius: 14px;
  padding: 40px 20px;
  text-align: center;
  color: #868e96;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.empty-icon {
  font-size: 2.6rem;
  margin-bottom: 10px;
}

.no-result h3 {
  color: #333;
  margin: 0 0 8px;
}

@media (max-width: 980px) {
  .panel-body,
  .staff-block {
    grid-template-columns: 1fr;
  }
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .panel-page {
    padding: 24px 16px 50px;
  }
}
</style>
