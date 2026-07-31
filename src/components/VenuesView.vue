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

      <ul v-if="rows.length" class="venue-list">
        <li v-for="v in rows" :key="v.id" class="venue-item" :class="{ pending: !v.isApproved }">
          <img class="cover" :src="v.coverImageUrl" :alt="v.name" @error="onImgError" />

          <div class="venue-main">
            <div class="venue-head">
              <b class="venue-name">{{ v.name }}</b>
              <span class="status-badge" :class="v.isApproved ? 'ok' : 'wait'">
                {{ v.isApproved ? 'Saytda' : 'Təsdiq gözləyir' }}
              </span>
              <span v-if="v.rating" class="rating">★ {{ v.rating }}</span>
            </div>

            <span class="venue-sub">{{ v.city }} · {{ v.address }} · {{ v.phone }}</span>

            <div class="chips-line">
              <span class="mini-chip">{{ v.hallCount }} zal</span>
              <span class="mini-chip">{{ v.menuCount }} menyu</span>
              <span class="mini-chip">{{ v.imageCount }} şəkil</span>
              <span class="mini-chip">{{ v.featureCount }} özəllik</span>
              <span class="mini-chip">{{ v.reviewCount }} rəy</span>
              <span class="mini-chip" :class="{ warn: v.pendingReservationCount }">
                {{ v.reservationCount }} rezerv<template v-if="v.pendingReservationCount">
                  · {{ v.pendingReservationCount }} cavabsız</template>
              </span>
            </div>

            <span class="owner-line">
              Sahib: <b>{{ v.ownerName }}</b>
              <em v-if="v.ownerEmail">{{ v.ownerEmail }}</em>
            </span>
          </div>

          <div class="venue-actions">
            <button
              class="mini-btn"
              :class="v.isApproved ? 'danger' : 'ok'"
              @click="toggleApproved(v)"
            >
              {{ v.isApproved ? 'Təsdiqi geri al' : 'Təsdiqlə' }}
            </button>
            <button class="mini-btn" @click="openEdit(v)">Redaktə</button>
            <button class="mini-btn" @click="openOwner(v)">Sahibi dəyiş</button>
            <a class="mini-btn link" :href="`/venue/${v.id}`" target="_blank">Səhifəyə bax</a>
            <!-- Zal, menyu və şəkillər sahib panelində idarə olunur; admin oraya tam çıxışlıdır -->
            <a class="mini-btn link" href="/panel" target="_blank">Zal / menyu</a>
            <button class="mini-btn danger" @click="remove(v)">Sil</button>
          </div>
        </li>
      </ul>
      <p v-else class="empty">Bu şərtlərə uyğun saray tapılmadı.</p>

      <div v-if="total > filters.pageSize" class="pager">
        <button class="mini-btn" :disabled="filters.page === 1" @click="goPage(filters.page - 1)">
          Əvvəlki
        </button>
        <span class="pager-info">{{ filters.page }} / {{ lastPage }}</span>
        <button class="mini-btn" :disabled="filters.page >= lastPage" @click="goPage(filters.page + 1)">
          Sonrakı
        </button>
      </div>
    </section>

    <!-- Redaktə -->
    <el-dialog v-model="editOpen" title="Sarayın məlumatları" width="540px">
      <div class="form-grid">
        <label>Ad<input v-model="form.name" class="value-box" /></label>
        <label>Şəhər<input v-model="form.city" class="value-box" /></label>
        <label class="wide">Ünvan<input v-model="form.address" class="value-box" /></label>
        <label>Telefon<input v-model="form.phone" class="value-box" /></label>
        <label>Şəkil linki<input v-model="form.coverImageUrl" class="value-box" /></label>
        <label class="wide">
          Təsvir
          <textarea v-model="form.description" class="value-box area" rows="3"></textarea>
        </label>
        <label class="wide">
          Özəlliklər (vergüllə ayırın)
          <input v-model="form.features" class="value-box" />
        </label>
      </div>
      <template #footer>
        <button class="mini-btn" @click="editOpen = false">İmtina</button>
        <button class="mini-btn ok" :disabled="!form.name.trim()" @click="submitEdit">Yadda saxla</button>
      </template>
    </el-dialog>

    <!-- Sahib dəyişmə -->
    <el-dialog v-model="ownerOpen" title="Sarayın sahibini dəyiş" width="440px">
      <p class="hint">
        «{{ ownerTarget?.name }}» seçdiyiniz istifadəçiyə keçəcək. Müştəri hesabı seçsəniz
        rolu avtomatik «Saray sahibi» olacaq.
      </p>
      <select v-model="newOwnerId" class="value-box full">
        <option :value="null" disabled>İstifadəçi seçin</option>
        <option v-for="u in ownerCandidates" :key="u.id" :value="u.id">
          {{ u.fullName }} — {{ u.email }} ({{ roleLabel(u.role) }})
        </option>
      </select>
      <template #footer>
        <button class="mini-btn" @click="ownerOpen = false">İmtina</button>
        <button class="mini-btn ok" :disabled="!newOwnerId" @click="submitOwner">Keçir</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  searchVenues,
  setVenueApproved,
  changeVenueOwner,
  deleteVenue,
  getUsers,
} from '@/services/adminService'
import { updateVenue } from '@/services/ownerService'
import { getCities } from '@/services/platformService'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=60'

const STATUS_FILTERS = [
  { value: '', label: 'Hamısı' },
  { value: 'pending', label: 'Təsdiq gözləyən' },
  { value: 'approved', label: 'Saytda olan' },
]

const emit = defineEmits(['changed'])

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
  description: '',
  features: '',
})

const ownerOpen = ref(false)
const ownerTarget = ref(null)
const newOwnerId = ref(null)

// Müştəri də seçilə bilər — sistem onu avtomatik sahibə çevirir
const ownerCandidates = computed(() =>
  users.value.filter((u) => ['Owner', 'Customer', 'VenueAdmin'].includes(u.role)),
)

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
  if (venue.isApproved) {
    try {
      await ElMessageBox.confirm(
        `«${venue.name}» saytdan yığışdırılacaq: axtarışda görünməyəcək və yeni rezerv qəbul etməyəcək.`,
        'Təsdiqi geri al',
        { confirmButtonText: 'Geri al', cancelButtonText: 'İmtina', type: 'warning' },
      )
    } catch {
      return
    }
  }

  const result = await setVenueApproved(venue.id, !venue.isApproved)
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  await refresh()
}

const openEdit = (venue) => {
  editTarget.value = venue
  form.name = venue.name
  form.city = venue.city
  form.address = venue.address
  form.phone = venue.phone
  form.coverImageUrl = venue.coverImageUrl ?? ''
  form.description = venue.description ?? ''
  form.features = (venue.features ?? []).join(', ')
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
      coverImageUrl: form.coverImageUrl.trim() || null,
      // Boş qoyulsa mövcud özəlliklər saxlanılır
      features: form.features.trim()
        ? form.features.split(',').map((f) => f.trim()).filter(Boolean)
        : null,
    })
    editOpen.value = false
    ElMessage.success(message)
    await refresh()
  } catch (e) {
    ElMessage.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

const openOwner = async (venue) => {
  ownerTarget.value = venue
  newOwnerId.value = null
  if (!users.value.length) users.value = await getUsers({})
  ownerOpen.value = true
}

const submitOwner = async () => {
  const result = await changeVenueOwner(ownerTarget.value.id, newOwnerId.value)
  if (!result.success) return ElMessage.error(result.message)

  ownerOpen.value = false
  ElMessage.success(result.message)
  await refresh()
}

// Silmək saray, zal, menyu və şəkilləri birdəfəlik aparır
const remove = async (venue) => {
  try {
    await ElMessageBox.confirm(
      `«${venue.name}» və ona bağlı ${venue.hallCount} zal, ${venue.menuCount} menyu silinəcək. ` +
        'Bu əməliyyat geri qaytarıla bilmir — saytdan yığışdırmaq üçün təsdiqi geri almaq daha təhlükəsizdir.',
      'Sarayı sil',
      { confirmButtonText: 'Sil', cancelButtonText: 'İmtina', type: 'warning' },
    )
  } catch {
    return
  }

  const result = await deleteVenue(venue.id)
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  await refresh()
}

onMounted(async () => {
  isLoading.value = true
  try {
    const [, cityList] = await Promise.all([loadRows(), getCities()])
    cities.value = cityList
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

/* Saray sətirləri */
.venue-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.venue-item {
  display: flex;
  gap: 14px;
  border: 1px solid #f4eff1;
  border-radius: 12px;
  padding: 12px 14px;
  align-items: flex-start;
}

.venue-item.pending {
  background: #fffaf2;
  border-color: #f5e4c8;
}

.cover {
  width: 92px;
  height: 68px;
  flex: none;
  object-fit: cover;
  border-radius: 10px;
  background: #f6f1f3;
}

.venue-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.venue-head {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.venue-name {
  font-size: 0.95rem;
  color: #1a1118;
}

.rating {
  font-size: 0.78rem;
  color: #b07d2b;
}

.venue-sub {
  font-size: 0.78rem;
  color: #868e96;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chips-line {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;
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

.venue-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: none;
}

/* Форма */
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
  .venue-item {
    flex-wrap: wrap;
  }

  .venue-actions {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
