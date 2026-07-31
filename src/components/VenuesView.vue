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
    <el-dialog v-model="previewOpen" :title="previewTarget?.name" width="620px" class="venue-dialog">
      <div v-if="previewTarget" class="preview">
        <img class="preview-cover" :src="previewTarget.coverImageUrl" :alt="previewTarget.name" @error="onImgError" />

        <div class="preview-badges">
          <span class="status-badge" :class="previewTarget.isApproved ? 'ok' : 'wait'">
            {{ previewTarget.isApproved ? 'Saytda görünür' : 'Təsdiq gözləyir' }}
          </span>
          <span v-if="previewTarget.rating" class="mini-chip">★ {{ previewTarget.rating }}</span>
          <span class="mini-chip">{{ previewTarget.reviewCount }} rəy</span>
        </div>

        <p class="preview-text">{{ previewTarget.description || 'Təsvir yazılmayıb.' }}</p>

        <dl class="preview-list">
          <div><dt>Şəhər</dt><dd>{{ previewTarget.city }}</dd></div>
          <div><dt>Ünvan</dt><dd>{{ previewTarget.address }}</dd></div>
          <div><dt>Telefon</dt><dd>{{ previewTarget.phone }}</dd></div>
          <div><dt>Sahib</dt><dd>{{ previewTarget.ownerName }} · {{ previewTarget.ownerEmail }}</dd></div>
          <div><dt>Əlavə olunub</dt><dd>{{ formatDate(previewTarget.createdAt) }}</dd></div>
          <div v-if="previewTarget.features?.length">
            <dt>Özəlliklər</dt><dd>{{ previewTarget.features.join(', ') }}</dd>
          </div>
        </dl>
      </div>
      <template #footer>
        <a class="mini-btn link" :href="`/venue/${previewTarget?.id}`" target="_blank">Saytda aç</a>
        <button class="mini-btn" @click="previewOpen = false">Bağla</button>
      </template>
    </el-dialog>

    <!-- Zallar və menyular -->
    <el-dialog
      v-model="contentOpen"
      :title="`${contentTarget?.name} — zallar və menyular`"
      width="620px"
      class="venue-dialog"
    >
      <div v-loading="contentLoading" class="content-wrap">
        <h4 class="sub-title">Zallar <em>{{ halls.length }}</em></h4>
        <ul v-if="halls.length" class="inner-list">
          <li v-for="h in halls" :key="h.id">
            <b>{{ h.name }}</b>
            <span class="inner-sub">{{ h.capacity }} nəfər</span>
          </li>
        </ul>
        <p v-else class="empty">Zal əlavə olunmayıb.</p>

        <h4 class="sub-title">Menyular <em>{{ menus.length }}</em></h4>
        <ul v-if="menus.length" class="inner-list">
          <li v-for="m in menus" :key="m.id">
            <b>{{ m.name }}</b>
            <span class="inner-sub">{{ m.pricePerPerson }} ₼ / nəfər</span>
          </li>
        </ul>
        <p v-else class="empty">Menyu əlavə olunmayıb.</p>

        <p class="hint">
          Zal və menyuların tərkibini dəyişmək üçün sahib panelindən istifadə edin —
          admin bütün saraylara oradan tam çıxışa malikdir.
        </p>
      </div>
      <template #footer>
        <a class="mini-btn link" href="/panel" target="_blank">Sahib panelində aç</a>
        <button class="mini-btn" @click="contentOpen = false">Bağla</button>
      </template>
    </el-dialog>

    <!-- Redaktə -->
    <el-dialog v-model="editOpen" title="Sarayın məlumatları" width="540px" class="venue-dialog">
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
    <el-dialog v-model="ownerOpen" title="Sarayın sahibini dəyiş" width="440px" class="venue-dialog">
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
import Pager from '@/components/Pager.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
    ElMessage.error(e?.userMessage ?? e?.message ?? 'Məlumat yüklənmədi')
  } finally {
    contentLoading.value = false
  }
}

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

// Silinmiş sarayı zalları və menyuları ilə birlikdə geri qaytarır
const restore = async (venue) => {
  const result = await restoreVenue(venue.id)
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  await refresh()
}

// Silmək məlumatı bazadan aparmır — «Silinmiş» süzgəcindən geri qaytarmaq olar
const remove = async (venue) => {
  try {
    await ElMessageBox.confirm(
      `«${venue.name}» və ona bağlı ${venue.hallCount} zal, ${venue.menuCount} menyu silinmiş kimi ` +
        'işarələnəcək: saytda görünməyəcək, amma «Silinmiş» süzgəcindən geri qaytarmaq olacaq.',
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

/* Pəncərələr */
.preview-cover {
  width: 100%;
  height: 230px;
  object-fit: cover;
  border-radius: 12px;
  background: #f6f1f3;
}

.preview-badges {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 14px 0 10px;
  flex-wrap: wrap;
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
  .venue-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
