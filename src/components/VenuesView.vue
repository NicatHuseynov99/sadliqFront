<template>
  <div class="venues" v-loading="isLoading">
    <!-- Siyahı -->
    <section class="block">
      <div class="block-head">
        <h3 class="block-title">Saraylar <em>{{ total }}</em></h3>
        <input
          v-model="filters.q"
          class="search-box"
          type="search"
          placeholder="Ad, şəhər, ünvan və ya telefon üzrə axtar…"
          @input="onSearchInput"
        />
      </div>

      <div class="filter-row">
        <div class="filter-chips">
          <button
            v-for="s in STATUS_FILTERS"
            :key="s.value"
            class="chip"
            :class="{ active: filters.status === s.value }"
            @click="setStatus(s.value)"
          >
            {{ s.label }}
          </button>
        </div>
        <select v-model="filters.city" class="select" @change="reload">
          <option value="">Bütün şəhərlər</option>
          <option v-for="c in cities" :key="c.name" :value="c.name">
            {{ c.name }} ({{ c.venueCount }})
          </option>
        </select>
        <select v-model="filters.sort" class="select" @change="reload">
          <option value="newest">Əvvəlcə yenilər</option>
          <option value="name">Ad üzrə</option>
          <option value="rating">Reytinq üzrə</option>
        </select>
      </div>

      <ul v-if="rows.length" class="venue-grid">
        <li
          v-for="v in rows"
          :key="v.id"
          class="venue-card"
          :class="{ pending: !v.isApproved && !v.isDeleted, removed: v.isDeleted }"
        >
          <div class="cover-wrap">
            <img class="cover" :src="v.coverImageUrl" :alt="v.name" @error="onImgError" />
            <span v-if="v.isDeleted" class="status-badge off">Silinib</span>
            <span v-else class="status-badge" :class="v.isApproved ? 'ok' : 'wait'">
              {{ v.isApproved ? 'Saytda' : 'Təsdiq gözləyir' }}
            </span>
            <span v-if="v.rating" class="rating">★ {{ v.rating }}</span>
            <div class="cover-shade">
              <b class="venue-name">{{ v.name }}</b>
              <span class="venue-sub">{{ v.city }} · {{ v.address }}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="chips-line">
              <span class="mini-chip">🏛 {{ v.hallCount }} zal</span>
              <span class="mini-chip">🍽 {{ v.menuCount }} menyu</span>
              <span class="mini-chip">🖼 {{ v.imageCount }} şəkil</span>
              <span class="mini-chip">⭐ {{ v.reviewCount }} rəy</span>
              <span class="mini-chip" :class="{ warn: v.pendingReservationCount }">
                📅 {{ v.reservationCount }} rezerv<template v-if="v.pendingReservationCount">
                  · {{ v.pendingReservationCount }} cavabsız</template>
              </span>
            </div>

            <span class="owner-line">
              Sahib: <b>{{ v.ownerName }}</b>
              <em v-if="v.ownerEmail">{{ v.ownerEmail }}</em>
            </span>
          </div>

          <!-- Silinmiş saray üçün yeganə mənalı əməliyyat geri qaytarmaqdır -->
          <div v-if="v.isDeleted" class="venue-actions single">
            <button class="act ok" @click="restore(v)">Geri qaytar</button>
            <button class="act" @click="openPreview(v)">Məlumatına bax</button>
          </div>
          <div v-else class="venue-actions">
            <button
              class="act"
              :class="v.isApproved ? 'danger' : 'ok'"
              @click="toggleApproved(v)"
            >
              {{ v.isApproved ? 'Təsdiqi geri al' : 'Təsdiqlə' }}
            </button>
            <button class="act" @click="openEdit(v)">Redaktə</button>
            <button class="act" @click="openOwner(v)">Sahibi dəyiş</button>
            <button class="act" @click="openPreview(v)">Səhifəyə bax</button>
            <button class="act" @click="openContent(v)">Zal / menyu</button>
            <button class="act danger" @click="remove(v)">Sil</button>
          </div>
        </li>
      </ul>
      <p v-else class="empty">Bu şərtlərə uyğun saray tapılmadı.</p>

      <Pager :page="filters.page" :page-size="filters.pageSize" :total="total" @change="goPage" />
    </section>

    <!-- Sarayın önizləməsi -->
    <el-dialog v-model="previewOpen" width="640px" class="venue-dialog" :show-close="false">
      <template #header>
        <DialogHead v-if="previewTarget" :venue="previewTarget" caption="Sarayın məlumatı" @close="previewOpen = false" />
      </template>

      <div v-if="previewTarget" class="preview">
        <div class="stat-strip">
          <div><b>{{ previewTarget.hallCount }}</b><span>zal</span></div>
          <div><b>{{ previewTarget.menuCount }}</b><span>menyu</span></div>
          <div><b>{{ previewTarget.imageCount }}</b><span>şəkil</span></div>
          <div><b>{{ previewTarget.reviewCount }}</b><span>rəy</span></div>
          <div><b>{{ previewTarget.rating || '—' }}</b><span>reytinq</span></div>
        </div>

        <p class="preview-text">{{ previewTarget.description || 'Təsvir yazılmayıb.' }}</p>

        <dl class="preview-list">
          <div><dt>Şəhər</dt><dd>{{ previewTarget.city }}</dd></div>
          <div><dt>Ünvan</dt><dd>{{ previewTarget.address }}</dd></div>
          <div><dt>Telefon</dt><dd>{{ previewTarget.phone }}</dd></div>
          <div><dt>Sahib</dt><dd>{{ previewTarget.ownerName }} · {{ previewTarget.ownerEmail }}</dd></div>
          <div><dt>Əlavə olunub</dt><dd>{{ formatDate(previewTarget.createdAt) }}</dd></div>
          <div><dt>Rezervlər</dt><dd>{{ previewTarget.reservationCount }} ({{ previewTarget.pendingReservationCount }} cavabsız)</dd></div>
        </dl>

        <div v-if="previewTarget.features?.length" class="feature-chips">
          <span v-for="f in previewTarget.features" :key="f" class="mini-chip">{{ f }}</span>
        </div>
      </div>

      <template #footer>
        <a class="ghost-btn" :href="`/venue/${previewTarget?.id}`" target="_blank">Saytda aç ↗</a>
        <button class="ghost-btn" @click="previewOpen = false">Bağla</button>
      </template>
    </el-dialog>

    <!-- Zallar və menyular -->
    <el-dialog v-model="contentOpen" width="640px" class="venue-dialog" :show-close="false">
      <template #header>
        <DialogHead v-if="contentTarget" :venue="contentTarget" caption="Zallar və menyular" @close="contentOpen = false" />
      </template>

      <div v-loading="contentLoading" class="content-wrap">
        <h4 class="sub-title">Zallar <em>{{ halls.length }}</em></h4>
        <ul v-if="halls.length" class="inner-list">
          <li v-for="h in halls" :key="h.id">
            <span class="inner-icon">🏛</span>
            <b>{{ h.name }}</b>
            <span class="inner-sub">{{ h.capacity }} nəfər</span>
          </li>
        </ul>
        <p v-else class="empty">Zal əlavə olunmayıb.</p>

        <h4 class="sub-title">Menyular <em>{{ menus.length }}</em></h4>
        <ul v-if="menus.length" class="inner-list">
          <li v-for="m in menus" :key="m.id">
            <span class="inner-icon">🍽</span>
            <b>{{ m.name }}</b>
            <span class="inner-sub">{{ m.pricePerPerson }} ₼ / nəfər</span>
          </li>
        </ul>
        <p v-else class="empty">Menyu əlavə olunmayıb.</p>

        <p class="note-box">
          Zal və menyuların tərkibini dəyişmək üçün sahib panelindən istifadə edin —
          admin bütün saraylara oradan tam çıxışa malikdir.
        </p>
      </div>

      <template #footer>
        <a class="ghost-btn" href="/panel" target="_blank">Sahib panelində aç ↗</a>
        <button class="ghost-btn" @click="contentOpen = false">Bağla</button>
      </template>
    </el-dialog>

    <!-- Redaktə -->
    <el-dialog v-model="editOpen" width="640px" class="venue-dialog" :show-close="false">
      <template #header>
        <DialogHead v-if="editTarget" :venue="editTarget" caption="Məlumatları redaktə et" @close="editOpen = false" />
      </template>

      <div class="edit-body">
        <!-- Şəkil linki yazıldıqca nəticə dərhal görünür -->
        <div class="cover-preview">
          <img :src="form.coverImageUrl || FALLBACK_IMAGE" alt="" @error="onImgError" />
          <span>Şəkil önizləməsi</span>
        </div>

        <div class="form-grid">
          <label>Ad<input v-model="form.name" class="value-box" /></label>
          <label>Şəhər<input v-model="form.city" class="value-box" /></label>
          <label class="wide">Ünvan<input v-model="form.address" class="value-box" /></label>
          <label>Telefon<input v-model="form.phone" class="value-box" /></label>
          <label>Şəkil linki<input v-model="form.coverImageUrl" class="value-box" /></label>
          <label class="wide">
            Video linki <em class="label-hint">YouTube, Vimeo və ya birbaşa fayl</em>
            <input v-model="form.videoUrl" class="value-box" placeholder="https://youtube.com/watch?v=…" />
          </label>
          <label>
            Parkinq <em class="label-hint">avtomobil sayı</em>
            <input v-model.number="form.parkingCapacity" class="value-box" type="number" min="0" />
          </label>
          <label class="check-label">
            <input v-model="form.hasValetParking" type="checkbox" />
            Valet xidməti var
          </label>
          <label class="wide">
            Təsvir
            <textarea v-model="form.description" class="value-box area" rows="2"></textarea>
          </label>
          <label class="wide">
            Özəlliklər <em class="label-hint">vergüllə ayırın</em>
            <input v-model="form.features" class="value-box" />
          </label>
        </div>

        <!-- Koordinat olmadan saray xəritədə görünmür -->
        <div class="coord-block">
          <div class="coord-title">
            Xəritədəki yeri
            <em v-if="!form.latitude || !form.longitude" class="warn-tag">təyin edilməyib</em>
          </div>
          <CoordinatePicker
            v-if="editOpen"
            :latitude="form.latitude"
            :longitude="form.longitude"
            :address="`${form.address}, ${form.city}, Azərbaycan`"
            @update="onCoordinates"
          />
        </div>
      </div>

      <template #footer>
        <button class="ghost-btn" @click="editOpen = false">İmtina</button>
        <button class="primary-btn" :disabled="!form.name.trim()" @click="submitEdit">Yadda saxla</button>
      </template>
    </el-dialog>

    <!-- Sahib dəyişmə -->
    <el-dialog v-model="ownerOpen" width="520px" class="venue-dialog" :show-close="false">
      <template #header>
        <DialogHead v-if="ownerTarget" :venue="ownerTarget" caption="Sahibi dəyiş" @close="ownerOpen = false" />
      </template>

      <p class="note-box">
        Saray seçdiyiniz istifadəçiyə keçəcək. Müştəri hesabı seçsəniz rolu avtomatik
        «Saray sahibi» olacaq.
      </p>

      <input v-model="ownerQuery" class="value-box full" placeholder="Ad və ya e-poçt üzrə axtar…" />

      <ul class="owner-list">
        <li
          v-for="u in filteredOwners"
          :key="u.id"
          :class="{ active: newOwnerId === u.id, current: u.id === ownerTarget?.ownerId }"
          @click="newOwnerId = u.id"
        >
          <span class="avatar">{{ initials(u.fullName) }}</span>
          <span class="owner-text">
            <b>{{ u.fullName }}</b>
            <em>{{ u.email }}</em>
          </span>
          <span class="role-chip">{{ roleLabel(u.role) }}</span>
          <span v-if="u.id === ownerTarget?.ownerId" class="now">indiki</span>
          <span v-else-if="newOwnerId === u.id" class="tick">✓</span>
        </li>
        <li v-if="!filteredOwners.length" class="empty-line">İstifadəçi tapılmadı.</li>
      </ul>

      <template #footer>
        <button class="ghost-btn" @click="ownerOpen = false">İmtina</button>
        <button class="primary-btn" :disabled="!newOwnerId" @click="submitOwner">Keçir</button>
      </template>
    </el-dialog>

    <!-- Təsdiq pəncərəsi: təsdiqi geri almaq və silmək üçün -->
    <el-dialog v-model="confirmOpen" width="440px" class="venue-dialog confirm" :show-close="false">
      <div class="confirm-body">
        <span class="confirm-icon" :class="confirm.tone">{{ confirm.tone === 'danger' ? '🗑' : '⚠️' }}</span>
        <h3>{{ confirm.title }}</h3>
        <p>{{ confirm.text }}</p>
      </div>

      <template #footer>
        <button class="ghost-btn" @click="confirmOpen = false">İmtina</button>
        <button class="primary-btn" :class="confirm.tone" @click="runConfirm">{{ confirm.action }}</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Pager from '@/components/Pager.vue'
import DialogHead from '@/components/DialogHead.vue'
import CoordinatePicker from '@/components/CoordinatePicker.vue'
import { toast } from '@/utils/toast'
import {
  searchVenues,
  setVenueApproved,
  changeVenueOwner,
  deleteVenue,
  restoreVenue,
  getUsers,
} from '@/services/adminService'
import { updateVenue, getVenueHalls, getVenueMenus } from '@/services/ownerService'
import { getCities } from '@/services/platformService'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=60'

const STATUS_FILTERS = [
  { value: '', label: 'Hamısı' },
  { value: 'pending', label: 'Təsdiq gözləyən' },
  { value: 'approved', label: 'Saytda olan' },
  { value: 'deleted', label: 'Silinmiş' },
]

const props = defineProps({
  // İcmaldan «Redaktə et» ilə gələn saray — açılan kimi pəncərəsi açılır
  editVenueId: { type: Number, default: null },
})

const emit = defineEmits(['changed', 'edit-opened'])

const isLoading = ref(false)
const rows = ref([])
const total = ref(0)
const cities = ref([])
const users = ref([])

const filters = reactive({
  q: '',
  status: '',
  city: '',
  sort: 'newest',
  page: 1,
  pageSize: 20,
})

const lastPage = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)))

const editOpen = ref(false)
const editTarget = ref(null)
const form = reactive({
  name: '',
  city: '',
  address: '',
  phone: '',
  coverImageUrl: '',
  videoUrl: '',
  description: '',
  features: '',
  parkingCapacity: null,
  hasValetParking: false,
  latitude: null,
  longitude: null,
})

const onCoordinates = ({ latitude, longitude }) => {
  form.latitude = latitude
  form.longitude = longitude
}

const ownerOpen = ref(false)
const ownerTarget = ref(null)
const newOwnerId = ref(null)
const ownerQuery = ref('')

// Təsdiq pəncərəsi: mətn və icra ediləcək əməliyyat buradan verilir
const confirmOpen = ref(false)
const confirm = reactive({ title: '', text: '', action: '', tone: 'warn', run: null })

const askConfirm = ({ title, text, action, tone, run }) => {
  Object.assign(confirm, { title, text, action, tone, run })
  confirmOpen.value = true
}

const runConfirm = async () => {
  const action = confirm.run
  confirmOpen.value = false
  if (action) await action()
}

const initials = (name) =>
  (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

const previewOpen = ref(false)
const previewTarget = ref(null)

const contentOpen = ref(false)
const contentTarget = ref(null)
const contentLoading = ref(false)
const halls = ref([])
const menus = ref([])

const formatDate = (value) => {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const openPreview = (venue) => {
  previewTarget.value = venue
  previewOpen.value = true
}

const openContent = async (venue) => {
  contentTarget.value = venue
  halls.value = []
  menus.value = []
  contentOpen.value = true
  contentLoading.value = true
  try {
    const [hallList, menuList] = await Promise.all([
      getVenueHalls(venue.id),
      getVenueMenus(venue.id),
    ])
    halls.value = hallList
    menus.value = menuList
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Məlumat yüklənmədi')
  } finally {
    contentLoading.value = false
  }
}

// Müştəri də seçilə bilər — sistem onu avtomatik sahibə çevirir
const ownerCandidates = computed(() =>
  users.value.filter((u) => ['Owner', 'Customer', 'VenueAdmin'].includes(u.role)),
)

const filteredOwners = computed(() => {
  const term = ownerQuery.value.trim().toLowerCase()
  if (!term) return ownerCandidates.value

  return ownerCandidates.value.filter(
    (u) => u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
  )
})

const roleLabel = (role) =>
  ({ Customer: 'Müştəri', Owner: 'Sahib', VenueAdmin: 'Administrator' })[role] ?? role

const onImgError = (event) => {
  event.target.src = FALLBACK_IMAGE
}

const loadRows = async () => {
  const result = await searchVenues({
    q: filters.q || undefined,
    status: filters.status || undefined,
    city: filters.city || undefined,
    sort: filters.sort,
    page: filters.page,
    pageSize: filters.pageSize,
  })
  rows.value = result.items
  total.value = result.totalCount
}

const refresh = async () => {
  isLoading.value = true
  try {
    await loadRows()
  } finally {
    isLoading.value = false
  }
  emit('changed')
}

const reload = async () => {
  filters.page = 1
  await refresh()
}

const goPage = async (page) => {
  filters.page = page
  await refresh()
}

const setStatus = (value) => {
  filters.status = value
  reload()
}

// Hər hərfdə sorğu getməsin deyə yazmaq bitəndən sonra axtarırıq
let searchTimer = null
const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(reload, 350)
}

// Təsdiqi geri almaq sarayı saytdan yığışdırır — ona görə ayrıca soruşuruq
const toggleApproved = async (venue) => {
  if (!venue.isApproved) {
    const result = await setVenueApproved(venue.id, true)
    if (!result.success) return toast.error(result.message)

    toast.success(result.message)
    return refresh()
  }

  askConfirm({
    title: 'Təsdiqi geri al',
    text: `«${venue.name}» saytdan yığışdırılacaq: axtarışda görünməyəcək və yeni rezerv qəbul etməyəcək. İstənilən vaxt yenidən təsdiqləmək olar.`,
    action: 'Geri al',
    tone: 'warn',
    run: async () => {
      const result = await setVenueApproved(venue.id, false)
      if (!result.success) return toast.error(result.message)

      toast.success(result.message)
      await refresh()
    },
  })
}

const openEdit = (venue) => {
  editTarget.value = venue
  form.name = venue.name
  form.city = venue.city
  form.address = venue.address
  form.phone = venue.phone
  form.coverImageUrl = venue.coverImageUrl ?? ''
  form.videoUrl = venue.videoUrl ?? ''
  form.description = venue.description ?? ''
  form.features = (venue.features ?? []).join(', ')
  form.parkingCapacity = venue.parkingCapacity ?? null
  form.hasValetParking = venue.hasValetParking ?? false
  form.latitude = venue.latitude ?? null
  form.longitude = venue.longitude ?? null
  editOpen.value = true
}

const submitEdit = async () => {
  try {
    const message = await updateVenue(editTarget.value.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      parkingCapacity: form.parkingCapacity || null,
      hasValetParking: form.hasValetParking,
      latitude: form.latitude,
      longitude: form.longitude,
      coverImageUrl: form.coverImageUrl.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
      // Boş qoyulsa mövcud özəlliklər saxlanılır
      features: form.features.trim()
        ? form.features.split(',').map((f) => f.trim()).filter(Boolean)
        : null,
    })
    editOpen.value = false
    toast.success(message)
    await refresh()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

const openOwner = async (venue) => {
  ownerTarget.value = venue
  newOwnerId.value = null
  ownerQuery.value = ''
  if (!users.value.length) users.value = await getUsers({})
  ownerOpen.value = true
}

const submitOwner = async () => {
  const result = await changeVenueOwner(ownerTarget.value.id, newOwnerId.value)
  if (!result.success) return toast.error(result.message)

  ownerOpen.value = false
  toast.success(result.message)
  await refresh()
}

// Silinmiş sarayı zalları və menyuları ilə birlikdə geri qaytarır
const restore = async (venue) => {
  const result = await restoreVenue(venue.id)
  if (!result.success) return toast.error(result.message)

  toast.success(result.message)
  await refresh()
}

// Silmək məlumatı bazadan aparmır — «Silinmiş» süzgəcindən geri qaytarmaq olar
const remove = (venue) => {
  askConfirm({
    title: 'Sarayı sil',
    text:
      `«${venue.name}» və ona bağlı ${venue.hallCount} zal, ${venue.menuCount} menyu silinmiş kimi ` +
      'işarələnəcək: saytda görünməyəcək, amma «Silinmiş» süzgəcindən geri qaytarmaq olacaq.',
    action: 'Sil',
    tone: 'danger',
    run: async () => {
      const result = await deleteVenue(venue.id)
      if (!result.success) return toast.error(result.message)

      toast.success(result.message)
      await refresh()
    },
  })
}

// İcmaldan gələn saray siyahının cari səhifəsində olmaya bilər —
// təsdiq gözləyənlərə keçib tapırıq
const openRequestedVenue = async () => {
  if (!props.editVenueId) return

  let venue = rows.value.find((v) => v.id === props.editVenueId)

  if (!venue) {
    filters.status = 'pending'
    filters.page = 1
    await loadRows()
    venue = rows.value.find((v) => v.id === props.editVenueId)
  }

  if (venue) openEdit(venue)
  emit('edit-opened')
}

onMounted(async () => {
  isLoading.value = true
  try {
    const [, cityList] = await Promise.all([loadRows(), getCities()])
    cities.value = cityList
    await openRequestedVenue()
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.venues {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.block {
  background: #fff;
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(26, 17, 24, 0.06);
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
  font-size: 1rem;
  color: #1a1118;
}

.block-title em {
  font-style: normal;
  background: #f6e9ee;
  color: #721438;
  font-size: 0.78rem;
  padding: 2px 9px;
  border-radius: 20px;
  margin-left: 6px;
}

/* Süzgəclər */
.search-box,
.select,
.value-box {
  border: 1px solid #f0eaec;
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.82rem;
  color: #1a1118;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.search-box {
  flex: 1;
  min-width: 220px;
  max-width: 340px;
}

.search-box:focus,
.select:focus,
.value-box:focus {
  border-color: #dfb15b;
}

.filter-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 16px;
}

.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  background: #fff;
  border: 1px solid #f0eaec;
  color: #6c757d;
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 0.76rem;
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

/* Saray kartları — şəkil əsas yeri tutur */
.venue-grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 18px;
}

.venue-card {
  display: flex;
  flex-direction: column;
  border: 1px solid #f4eff1;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.18s, transform 0.18s;
}

.venue-card:hover {
  box-shadow: 0 14px 30px rgba(26, 17, 24, 0.11);
  transform: translateY(-2px);
}

.venue-card.pending {
  border-color: #f0d5a8;
}

/* Silinmiş saray sönük göstərilir — qarışdırmaq olmasın */
.venue-card.removed {
  border-color: #f0e0e4;
  background: #fdfafb;
}

.venue-card.removed .cover {
  filter: grayscale(1);
  opacity: 0.65;
}

.status-badge.off {
  background: #f8e3e8;
  color: #a02c4a;
}

.venue-actions.single {
  grid-template-columns: repeat(2, 1fr);
}

.cover-wrap {
  position: relative;
  height: 178px;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #f6f1f3;
}

/* Adın oxunması üçün şəklin altına tünd keçid */
.cover-shade {
  position: absolute;
  inset: auto 0 0 0;
  padding: 26px 14px 12px;
  background: linear-gradient(to top, rgba(26, 17, 24, 0.85), transparent);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.venue-name {
  color: #fff;
  font-size: 1rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.venue-sub {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-wrap .status-badge {
  position: absolute;
  top: 10px;
  left: 10px;
}

.rating {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(26, 17, 24, 0.7);
  color: #dfb15b;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
}

.card-body {
  padding: 12px 14px 4px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
}

.chips-line {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.mini-chip {
  font-size: 0.7rem;
  background: #f6f1f3;
  color: #6c757d;
  padding: 2px 9px;
  border-radius: 20px;
}

.mini-chip.warn {
  background: #fdf0e3;
  color: #b06a2b;
}

.owner-line {
  font-size: 0.76rem;
  color: #868e96;
  margin-top: 2px;
}

.owner-line b {
  color: #4a3f44;
}

.owner-line em {
  font-style: normal;
  margin-left: 6px;
  color: #b8a3ab;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.status-badge.ok {
  background: #e6f4ea;
  color: #217a41;
}

.status-badge.wait {
  background: #fdf0e3;
  color: #b06a2b;
}

/* Əməliyyatlar kartın altında bərabər paylanır */
.venue-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: #f4eff1;
  border-top: 1px solid #f4eff1;
  margin-top: 10px;
}

.act {
  background: #fff;
  border: none;
  color: #6c757d;
  padding: 9px 6px;
  font-size: 0.73rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.act:hover {
  background: #fbf7f8;
  color: #721438;
}

.act.ok {
  color: #217a41;
}

.act.danger {
  color: #a02c4a;
}

/* ---------- Pəncərələr ---------- */
/* Element Plus-un öz qabığını yumşaldırıq: yuvarlaq künc, dərin kölgə */
:deep(.venue-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(26, 17, 24, 0.28);
}

:deep(.venue-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:deep(.venue-dialog .el-dialog__body) {
  padding: 20px 22px 4px;
}

:deep(.venue-dialog .el-dialog__footer) {
  padding: 14px 22px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Rəqəm zolağı — sarayın ölçüsü bir baxışda */
.stat-strip {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.stat-strip div {
  background: #fbf7f8;
  border-radius: 11px;
  padding: 10px 6px;
  text-align: center;
}

.stat-strip b {
  display: block;
  font-size: 1.05rem;
  color: #721438;
}

.stat-strip span {
  font-size: 0.68rem;
  color: #a6969c;
}

.feature-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 14px 0 4px;
}

.preview-text {
  margin: 0 0 14px;
  font-size: 0.86rem;
  line-height: 1.6;
  color: #4a3f44;
}

.preview-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-list > div {
  display: flex;
  gap: 12px;
  font-size: 0.84rem;
  border-bottom: 1px solid #faf7f8;
  padding-bottom: 7px;
}

.preview-list dt {
  width: 110px;
  flex: none;
  color: #a6969c;
  font-size: 0.76rem;
}

.preview-list dd {
  margin: 0;
  color: #1a1118;
}

.sub-title {
  margin: 0 0 10px;
  font-size: 0.88rem;
  color: #1a1118;
}

.sub-title em {
  font-style: normal;
  background: #f6e9ee;
  color: #721438;
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 20px;
  margin-left: 6px;
}

.inner-list {
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.inner-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.84rem;
  padding: 8px 12px;
  background: #fbf9fa;
  border-radius: 9px;
}

.inner-sub {
  color: #868e96;
  font-size: 0.78rem;
  margin-left: auto;
}

.inner-icon {
  font-size: 0.9rem;
}

.inner-list li {
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
}

/* Qeyd qutusu */
.note-box {
  margin: 14px 0 0;
  background: #fbf7f8;
  border-left: 3px solid #dfb15b;
  border-radius: 0 10px 10px 0;
  padding: 10px 13px;
  font-size: 0.79rem;
  color: #6c757d;
  line-height: 1.55;
}

/* Redaktə: şəkil önizləməsi + sahələr */
.edit-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Redaktə pəncərəsi kiçik ekranda da tam sığsın deyə alçaq saxlanılır */
.cover-preview {
  position: relative;
  height: 78px;
  border-radius: 10px;
  overflow: hidden;
  background: #f6f1f3;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-preview span {
  position: absolute;
  left: 10px;
  bottom: 8px;
  font-size: 0.68rem;
  color: #fff;
  background: rgba(26, 17, 24, 0.6);
  padding: 3px 9px;
  border-radius: 20px;
}

.label-hint {
  font-style: normal;
  color: #c9bcc1;
  margin-left: 5px;
}

/* Koordinat bloku */
.coord-block {
  border-top: 1px solid #f4eff1;
  padding-top: 12px;
}

.coord-title {
  font-size: 0.73rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #b8a3ab;
  font-weight: 700;
  margin-bottom: 8px;
}

.warn-tag {
  font-style: normal;
  text-transform: none;
  letter-spacing: 0;
  background: #fdf0e3;
  color: #b06a2b;
  padding: 2px 8px;
  border-radius: 20px;
  margin-left: 6px;
}

/* Sahib seçimi */
.owner-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 280px;
  overflow-y: auto;
}

.owner-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 11px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.owner-list li:hover {
  background: #fbf7f8;
}

.owner-list li.active {
  background: #fdf6f8;
  border-color: #721438;
}

.owner-list li.current {
  opacity: 0.6;
  cursor: default;
}

.avatar {
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #721438, #a8446a);
}

.owner-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.owner-text b {
  font-size: 0.84rem;
  color: #1a1118;
}

.owner-text em {
  font-style: normal;
  font-size: 0.72rem;
  color: #a6969c;
}

.role-chip {
  font-size: 0.68rem;
  background: #f6f1f3;
  color: #6c757d;
  padding: 2px 9px;
  border-radius: 20px;
  white-space: nowrap;
}

.now {
  font-size: 0.68rem;
  color: #b8a3ab;
}

.tick {
  color: #217a41;
  font-weight: 700;
}

.empty-line {
  justify-content: center;
  color: #a6969c;
  font-size: 0.8rem;
  cursor: default;
}

/* Təsdiq pəncərəsi */
.confirm-body {
  text-align: center;
  padding: 12px 8px 4px;
}

.confirm-icon {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  font-size: 1.5rem;
  margin-bottom: 12px;
}

.confirm-icon.warn {
  background: #fdf0e3;
}

.confirm-icon.danger {
  background: #f8e3e8;
}

.confirm-body h3 {
  margin: 0 0 8px;
  font-size: 1.05rem;
  color: #1a1118;
}

.confirm-body p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #6c757d;
}

:deep(.venue-dialog.confirm .el-dialog__header) {
  display: none;
}

/* Pəncərə düymələri */
.ghost-btn,
.primary-btn {
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
  display: inline-block;
}

.ghost-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: #4a3f44;
}

.ghost-btn:hover {
  border-color: #dfb15b;
  color: #721438;
}

.primary-btn {
  background: #721438;
  border: 1px solid #721438;
  color: #fff;
}

.primary-btn:hover:not(:disabled) {
  background: #5c1029;
}

.primary-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.primary-btn.danger {
  background: #a02c4a;
  border-color: #a02c4a;
}

.primary-btn.danger:hover {
  background: #86243d;
}

.primary-btn.warn {
  background: #b06a2b;
  border-color: #b06a2b;
}

.primary-btn.warn:hover {
  background: #935722;
}

/* Форма */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px 12px;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.73rem;
  color: #868e96;
}

.form-grid .value-box {
  padding: 7px 11px;
}

/* Qeyd qutusu sahə kimi yox, sətir kimi düzülür */
.check-label {
  flex-direction: row !important;
  align-items: center;
  gap: 7px !important;
  font-size: 0.8rem !important;
  color: #4a3f44 !important;
  padding-top: 16px;
}

.form-grid label.wide {
  grid-column: 1 / -1;
}

.value-box.area {
  resize: vertical;
  font-family: inherit;
}

.value-box.full {
  width: 100%;
}

.hint {
  font-size: 0.8rem;
  color: #868e96;
  line-height: 1.5;
  margin: 0 0 12px;
}

/* Düymələr */
.mini-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: #4a3f44;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  text-align: center;
  text-decoration: none;
}

.mini-btn:hover:not(:disabled) {
  border-color: #dfb15b;
}

.mini-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mini-btn.danger {
  color: #a02c4a;
  border-color: #f3dbe1;
}

.mini-btn.ok {
  color: #217a41;
  border-color: #d7ecdf;
}

.mini-btn.link {
  color: #1c5cab;
  border-color: #dce8f7;
}

.empty {
  color: #a6969c;
  font-size: 0.83rem;
  text-align: center;
  padding: 22px 10px;
  margin: 0;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 14px;
}

.pager-info {
  font-size: 0.8rem;
  color: #868e96;
}

@media (max-width: 720px) {
  .venue-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
