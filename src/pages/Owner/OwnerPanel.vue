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
              <el-select
                v-model="staffForm.venueId"
                placeholder="Saray seçin"
                style="width: 100%"
                @change="onStaffVenueChange"
              >
                <el-option v-for="v in venues" :key="v.id" :value="v.id" :label="v.name" />
              </el-select>
            </el-form-item>

            <el-form-item label="Hansı zallarda işləyəcək?">
              <el-select
                v-model="staffForm.hallIds"
                multiple
                collapse-tags
                placeholder="Boş buraxsanız bütün zallar"
                style="width: 100%"
                :disabled="!staffForm.venueId"
              >
                <el-option v-for="h in staffVenueHalls" :key="h.id" :value="h.id" :label="h.name" />
              </el-select>
              <span class="field-hint">Seçim etməsəniz sarayın bütün zallarına icazəsi olacaq.</span>
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

          <article v-for="s in staff" :key="s.id" class="staff-card" :class="{ off: !s.isActive }">
            <header class="sc-head">
              <div class="staff-avatar">{{ initials(s.fullName) }}</div>

              <div class="sc-title">
                <b>{{ s.fullName }}</b>
                <span>{{ s.email }}</span>
              </div>

              <span class="staff-status" :class="{ on: s.isActive }">
                <i class="dot"></i> {{ s.isActive ? 'Aktiv' : 'Bağlı' }}
              </span>
            </header>

            <div class="sc-info">
              <div class="sc-row">
                <span class="sc-label">Saray</span>
                <b>{{ s.venueName }}</b>
              </div>
              <div class="sc-row">
                <span class="sc-label">Telefon</span>
                <b>{{ s.phone || '—' }}</b>
              </div>
            </div>

            <div class="sc-halls">
              <span class="sc-label">İcazəli zallar</span>
              <div class="hall-chips">
                <template v-if="s.hallNames?.length">
                  <span v-for="h in s.hallNames" :key="h" class="hall-chip">{{ h }}</span>
                </template>
                <span v-else class="hall-chip all">Bütün zallar</span>
                <button class="chip-edit" title="Zalları dəyiş" @click="openHallPicker(s)">✎</button>
              </div>
            </div>

            <footer class="sc-actions">
              <button class="act-btn" @click="editStaff(s)">
                <span>✏️</span> Redaktə
              </button>
              <button class="act-btn" @click="askResetPassword(s)">
                <span>🔑</span> Parol
              </button>
              <button class="act-btn" :class="{ warn: s.isActive }" @click="toggleStaff(s)">
                <span>{{ s.isActive ? '⏸' : '▶' }}</span> {{ s.isActive ? 'Girişi bağla' : 'Aktivləşdir' }}
              </button>
              <el-popconfirm
                title="Administrator siyahıdan silinsin?"
                confirm-button-text="Bəli, sil"
                cancel-button-text="Xeyr"
                @confirm="removeStaff(s)"
              >
                <template #reference>
                  <button class="act-btn danger"><span>🗑</span> Sil</button>
                </template>
              </el-popconfirm>
            </footer>
          </article>
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

    <!-- Administratorun zal icazələri -->
    <el-dialog v-model="hallPickerDialog" :title="`${hallPickerStaff?.fullName} — zal icazələri`" width="480px">
      <p class="dialog-note">
        Seçilmiş zallarda administrator rezervləri görür, təsdiqləyir və təqvimi dəyişir.
        Heç nə seçilməsə sarayın bütün zallarına icazəsi olur.
      </p>

      <div class="hall-picker">
        <button
          v-for="h in hallPickerOptions"
          :key="h.id"
          class="hall-option"
          :class="{ selected: hallPickerSelection.includes(h.id) }"
          @click="toggleHallSelection(h.id)"
        >
          <span class="ho-check">{{ hallPickerSelection.includes(h.id) ? '✓' : '' }}</span>
          <span class="ho-text">
            <b>{{ h.name }}</b>
            <em>👥 {{ h.capacity }} qonaq · {{ h.minPrice }} ₼-dən</em>
          </span>
        </button>
      </div>

      <p class="picker-summary">
        {{ hallPickerSelection.length
          ? `${hallPickerSelection.length} zal seçildi`
          : 'Seçim yoxdur — bütün zallara icazə veriləcək' }}
        <button v-if="hallPickerSelection.length" class="link-clear" @click="hallPickerSelection = []">
          Seçimi təmizlə
        </button>
      </p>

      <template #footer>
        <el-button @click="hallPickerDialog = false">İmtina</el-button>
        <button class="confirm-btn" :disabled="isSavingStaff" @click="saveStaffHalls">Yadda saxla</button>
      </template>
    </el-dialog>

    <!-- Administratorun məlumatları -->
    <el-dialog v-model="editDialog" :title="`${editingStaff?.fullName} — məlumatlar`" width="440px">
      <el-form label-position="top" @submit.prevent>
        <div class="form-row">
          <el-form-item label="Ad">
            <el-input v-model="editForm.firstName" placeholder="Ad" />
          </el-form-item>
          <el-form-item label="Soyad">
            <el-input v-model="editForm.lastName" placeholder="Soyad" />
          </el-form-item>
        </div>

        <el-form-item label="Telefon">
          <el-input v-model="editForm.phone" placeholder="+994 xx xxx xx xx" />
        </el-form-item>

        <el-form-item label="E-poçt">
          <el-input :model-value="editingStaff?.email" disabled />
          <span class="field-hint">E-poçt hesabın açarıdır, dəyişdirilmir.</span>
        </el-form-item>

        <p v-if="staffError" class="form-error">{{ staffError }}</p>
      </el-form>

      <template #footer>
        <el-button @click="editDialog = false">İmtina</el-button>
        <button class="confirm-btn" :disabled="isSavingStaff" @click="saveStaffInfo">Yadda saxla</button>
      </template>
    </el-dialog>

    <!-- Parolun sıfırlanması -->
    <el-dialog v-model="passwordDialog" :title="`${editingStaff?.fullName} — parol`" width="400px">
      <p class="dialog-note">
        Yeni parolu administratora özünüz çatdırın — sistem ona bildiriş göndərmir.
      </p>

      <el-form label-position="top" @submit.prevent>
        <el-form-item label="Yeni parol">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="Ən azı 6 simvol" />
        </el-form-item>
        <el-form-item label="Təkrar">
          <el-input v-model="passwordForm.repeat" type="password" show-password placeholder="Parolu təkrarlayın" />
        </el-form-item>

        <p v-if="staffError" class="form-error">{{ staffError }}</p>
      </el-form>

      <template #footer>
        <el-button @click="passwordDialog = false">İmtina</el-button>
        <button class="confirm-btn" :disabled="isSavingStaff" @click="savePassword">Parolu yenilə</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElNotification } from 'element-plus'
import { useAuthStore } from '@/store/auth'
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
  setStaffHalls,
  resetStaffPassword,
  getVenueHalls,
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
  hallIds: [],
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
})

// Formada seçilmiş sarayın zalları
const staffVenueHalls = ref([])

// Mövcud administratorun zal icazələrini dəyişmək üçün
const hallPickerDialog = ref(false)
const hallPickerStaff = ref(null)
const hallPickerOptions = ref([])
const hallPickerSelection = ref([])

// Məlumat və parol dialoqları
const editDialog = ref(false)
const passwordDialog = ref(false)
const editingStaff = ref(null)
const editForm = reactive({ firstName: '', lastName: '', phone: '' })
const passwordForm = reactive({ newPassword: '', repeat: '' })

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

// Saray dəyişəndə həmin sarayın zalları yüklənir
const onStaffVenueChange = async (venueId) => {
  staffForm.hallIds = []
  staffVenueHalls.value = venueId ? await getVenueHalls(venueId) : []
}

// Mövcud administratorun zal icazələrini açır
const openHallPicker = async (member) => {
  hallPickerStaff.value = member
  hallPickerSelection.value = [...(member.hallIds ?? [])]
  hallPickerOptions.value = await getVenueHalls(member.venueId)
  hallPickerDialog.value = true
}

const saveStaffHalls = async () => {
  isSavingStaff.value = true
  try {
    const message = await setStaffHalls(hallPickerStaff.value.id, hallPickerSelection.value)
    hallPickerDialog.value = false
    await loadStaff()
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  } finally {
    isSavingStaff.value = false
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
    Object.assign(staffForm, {
      hallIds: [], firstName: '', lastName: '', email: '', phone: '', password: '',
    })
    await loadStaff()
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    staffError.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isSavingStaff.value = false
  }
}

// Administratorun məlumatlarını redaktə dialoqunda açır
const editStaff = (member) => {
  editingStaff.value = member
  const [firstName = '', ...rest] = (member.fullName ?? '').split(' ')
  Object.assign(editForm, {
    firstName,
    lastName: rest.join(' '),
    phone: member.phone ?? '',
  })
  staffError.value = ''
  editDialog.value = true
}

const saveStaffInfo = async () => {
  if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
    staffError.value = 'Ad və soyad boş ola bilməz.'
    return
  }

  isSavingStaff.value = true
  staffError.value = ''
  try {
    const message = await updateStaff(editingStaff.value.id, { ...editForm })
    editDialog.value = false
    await loadStaff()
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    staffError.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isSavingStaff.value = false
  }
}

const toggleHallSelection = (hallId) => {
  const index = hallPickerSelection.value.indexOf(hallId)
  index === -1
    ? hallPickerSelection.value.push(hallId)
    : hallPickerSelection.value.splice(index, 1)
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
const askResetPassword = (member) => {
  editingStaff.value = member
  Object.assign(passwordForm, { newPassword: '', repeat: '' })
  staffError.value = ''
  passwordDialog.value = true
}

const savePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.repeat) {
    staffError.value = 'Parollar üst-üstə düşmür.'
    return
  }

  isSavingStaff.value = true
  staffError.value = ''
  try {
    const message = await resetStaffPassword(editingStaff.value.id, passwordForm.newPassword)
    passwordDialog.value = false
    ElNotification({ title: 'Uğurlu', message, type: 'success', zIndex: 99999 })
  } catch (e) {
    staffError.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
  } finally {
    isSavingStaff.value = false
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
  border: 1px solid #f2ecee;
  border-left: 4px solid #dfb15b;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
  transition: all 0.18s;
  background: #fff;
}

.staff-card:hover {
  box-shadow: 0 6px 18px rgba(114, 20, 56, 0.08);
}

.staff-card.off {
  background: #faf9fa;
  border-left-color: #ced4da;
}

.staff-card.off .staff-avatar {
  filter: grayscale(1);
}

/* Başlıq */
.sc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.sc-title {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-grow: 1;
}

.sc-title b {
  font-size: 0.98rem;
  color: #1a1118;
}

.sc-title span {
  font-size: 0.78rem;
  color: #adb5bd;
}

/* Məlumat sətirləri */
.sc-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid #f8f5f6;
  border-bottom: 1px solid #f8f5f6;
}

.sc-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.sc-label {
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #c2b2b8;
  font-weight: 700;
}

.sc-row b {
  font-size: 0.85rem;
  color: #1a1118;
}

/* Zal çipləri */
.sc-halls {
  padding: 10px 0 12px;
}

.hall-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  align-items: center;
}

.hall-chip {
  background: #fdf6e9;
  border: 1px solid #f0dfbe;
  color: #8a6220;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 3px 11px;
  border-radius: 20px;
}

.hall-chip.all {
  background: #f6e9ee;
  border-color: #e8cdd8;
  color: #721438;
}

.chip-edit {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px dashed #e0d5d9;
  background: #fff;
  color: #a08a92;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1;
  transition: all 0.15s;
}

.chip-edit:hover {
  border-style: solid;
  border-color: #721438;
  color: #721438;
}

/* Əməliyyat düymələri */
.sc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #fff;
  border: 1px solid #f0eaec;
  color: #6c757d;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.act-btn span {
  font-size: 0.8rem;
}

.act-btn:hover {
  border-color: #721438;
  color: #721438;
  background: #fdfbfc;
}

.act-btn.warn:hover {
  border-color: #b07d2b;
  color: #b07d2b;
}

.act-btn.danger:hover {
  border-color: #c0392b;
  color: #c0392b;
  background: #fdf4f3;
}

/* Zal seçimi dialoqu */
.hall-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hall-option {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #f0eaec;
  border-radius: 12px;
  padding: 10px 14px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.hall-option:hover {
  border-color: #dfb15b;
}

.hall-option.selected {
  border-color: #721438;
  background: #fdf7f9;
}

.ho-check {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid #e0d5d9;
  display: grid;
  place-items: center;
  font-size: 0.8rem;
  color: #fff;
  flex-shrink: 0;
}

.hall-option.selected .ho-check {
  background: #721438;
  border-color: #721438;
}

.ho-text {
  display: flex;
  flex-direction: column;
}

.ho-text b {
  font-size: 0.9rem;
  color: #1a1118;
}

.ho-text em {
  font-style: normal;
  font-size: 0.75rem;
  color: #adb5bd;
}

.picker-summary {
  margin: 14px 0 0;
  font-size: 0.8rem;
  color: #868e96;
  display: flex;
  align-items: center;
  gap: 10px;
}

.link-clear {
  background: none;
  border: none;
  color: #721438;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.link-clear:hover {
  text-decoration: underline;
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

.halls-line {
  color: #8a6220 !important;
}

.field-hint {
  display: block;
  font-size: 0.72rem;
  color: #adb5bd;
  line-height: 1.4;
}

.dialog-note {
  margin: 0 0 14px;
  font-size: 0.83rem;
  color: #868e96;
  line-height: 1.5;
}

.staff-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.staff-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 11px;
  border-radius: 20px;
  background: #f1f3f5;
  color: #868e96;
  white-space: nowrap;
}

.staff-status .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ced4da;
  display: inline-block;
}

.staff-status.on {
  background: #e3f6e8;
  color: #1e7e34;
}

.staff-status.on .dot {
  background: #1e7e34;
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
