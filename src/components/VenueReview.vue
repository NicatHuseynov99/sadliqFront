<template>
  <!-- Müraciətin yoxlanışı. Sahibkarın doldurduğu anketin eyni quruluşu:
       admin nəyi necə göndərdiyini görür və elə orada düzəldir. -->
  <el-dialog
    :model-value="true"
    width="820px"
    class="review-dialog"
    :show-close="false"
    @close="$emit('close')"
  >
    <template #header>
      <div class="rv-head">
        <img :src="form.coverImageUrl" alt="" @error="onImgError" />
        <div class="rv-shade"></div>
        <button class="rv-close" @click="closeDialog">✕</button>

        <div class="rv-title">
          <span class="rv-caption">Müraciətin yoxlanışı</span>
          <b>{{ form.name || 'Adsız saray' }}</b>
          <span class="rv-sub">
            {{ venue.ownerName }}
            <i v-if="venue.isApproved" class="badge ok">təsdiqlənib</i>
            <i v-else class="badge wait">təsdiq gözləyir</i>
          </span>
        </div>
      </div>
    </template>

    <div v-loading="isLoading" class="rv-body">
      <!-- Anketdəki addımların eynisi -->
      <ol class="steps">
        <li
          v-for="s in steps"
          :key="s.key"
          :class="{ active: step === s.key, filled: isFilled(s.key) }"
          @click="step = s.key"
        >
          <span>{{ isFilled(s.key) ? '✓' : s.icon }}</span>
          {{ s.title }}
        </li>
      </ol>

      <!-- Saray haqqında -->
      <section v-if="step === 'venue'" class="pane">
        <div class="grid">
          <label>Sarayın adı<input v-model="form.name" /></label>
          <label>Şəhər<input v-model="form.city" /></label>
          <label>Əlaqə nömrəsi<input v-model="form.phone" /></label>
          <label class="two">Ünvan<input v-model="form.address" /></label>
          <label class="wide">Təsvir<textarea v-model="form.description" rows="2"></textarea></label>
          <label>Parkinq<input v-model.number="form.parkingCapacity" type="number" min="0" /></label>
          <label class="check">
            <input v-model="form.hasValetParking" type="checkbox" /> Valet xidməti
          </label>
          <div class="wide">
            <span class="pane-label">Özəlliklər <em>uyğun olanları seçin</em></span>
            <div class="chips">
              <button
                v-for="f in featureOptions"
                :key="f.name"
                type="button"
                class="chip"
                :class="{ active: form.features.includes(f.name) }"
                @click="toggleFeature(f.name)"
              >
                {{ f.name }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Yer -->
      <section v-else-if="step === 'location'" class="pane">
        <p v-if="!form.latitude" class="warn-line">
          Koordinat göstərilməyib — saray xəritədə görünməyəcək.
        </p>
        <CoordinatePicker
          :latitude="form.latitude"
          :longitude="form.longitude"
          :address="`${form.address}, ${form.city}, Azərbaycan`"
          @update="onCoordinates"
        />
      </section>

      <!-- Şəkil və video -->
      <section v-else-if="step === 'media'" class="pane">
        <div class="media-row">
          <div>
            <span class="pane-label">Fon şəkli</span>
            <MediaUpload v-model="form.coverImageUrl" small label="Fon şəklini dəyişin" />
          </div>
          <div>
            <span class="pane-label">Video</span>
            <MediaUpload v-model="form.videoUrl" video small label="Video seçin" />
          </div>
        </div>

        <span class="pane-label">Sahibkarın əlavə etdiyi şəkillər <em>{{ images.length }}</em></span>
        <div v-if="images.length" class="shot-grid">
          <img v-for="(img, i) in images" :key="i" :src="img.url" alt="" @error="onImgError" />
        </div>
        <p v-else class="empty">Şəkil əlavə edilməyib.</p>
      </section>

      <!-- Zallar -->
      <section v-else-if="step === 'halls'" class="pane">
        <div v-for="h in halls" :key="h.id" class="sub-card">
          <div class="sub-head">
            <b>{{ h.name }}</b>
            <span class="sub-meta">👥 {{ h.capacity }} nəfər · {{ h.minPrice }} ₼-dən</span>
          </div>
          <p class="sub-desc">{{ h.description || 'Təsvir yazılmayıb' }}</p>
        </div>
        <p v-if="!halls.length" class="empty">
          Zal əlavə edilməyib. Təsdiqdən sonra sahibkar özü əlavə edə bilər.
        </p>
      </section>

      <!-- Menyular -->
      <section v-else-if="step === 'menus'" class="pane">
        <div v-for="m in menus" :key="m.id" class="sub-card">
          <div class="sub-head">
            <b>{{ m.name }}</b>
            <span class="sub-meta">{{ m.pricePerPerson }} ₼ / nəfər</span>
          </div>
          <p class="sub-desc">{{ m.description || 'Təsvir yazılmayıb' }}</p>
        </div>
        <p v-if="!menus.length" class="empty">Menyu əlavə edilməyib.</p>
      </section>

      <!-- Yekun -->
      <section v-else class="pane">
        <dl class="summary">
          <div><dt>Sahibkar</dt><dd>{{ venue.ownerName }} · {{ venue.ownerEmail }}</dd></div>
          <div><dt>Şəhər / ünvan</dt><dd>{{ form.city || '—' }}, {{ form.address || '—' }}</dd></div>
          <div><dt>Telefon</dt><dd>{{ form.phone || '—' }}</dd></div>
          <div><dt>Zallar</dt><dd>{{ halls.length }}</dd></div>
          <div><dt>Menyular</dt><dd>{{ menus.length }}</dd></div>
          <div><dt>Şəkillər</dt><dd>{{ images.length }}</dd></div>
          <div><dt>Xəritədə yer</dt><dd>{{ form.latitude ? 'var' : 'yoxdur' }}</dd></div>
          <div><dt>Video</dt><dd>{{ form.videoUrl ? 'var' : 'yoxdur' }}</dd></div>
          <div><dt>Müraciət tarixi</dt><dd>{{ formatDate(venue.createdAt) }}</dd></div>
        </dl>

        <p v-if="gaps.length" class="warn-line">
          Çatışmayanlar: <b>{{ gaps.join(', ') }}</b>
        </p>
        <p v-else class="ok-line">Bütün əsas məlumatlar doldurulub.</p>
      </section>
    </div>

    <template #footer>
      <a class="ghost-btn" :href="`/venue/${venue.id}`" target="_blank">Saytda aç ↗</a>
      <span class="spacer"></span>
      <button class="ghost-btn" :disabled="isSaving" @click="closeDialog">
        {{ isSaving ? 'Saxlanılır…' : isDirty ? 'Saxla və bağla' : 'Bağla' }}
      </button>
      <button v-if="!venue.isApproved" class="approve-btn" :disabled="isSaving" @click="approve">
        ✓ Təsdiqlə
      </button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import CoordinatePicker from '@/components/CoordinatePicker.vue'
import MediaUpload from '@/components/MediaUpload.vue'
import { getVenueById } from '@/services/venueService'
import { updateVenue } from '@/services/ownerService'
import { setVenueApproved } from '@/services/adminService'
import { getFeatures } from '@/services/platformService'

const props = defineProps({
  venue: { type: Object, required: true },
})

const emit = defineEmits(['close', 'changed'])

const steps = [
  { key: 'venue', title: 'Saray haqqında', icon: '🏛' },
  { key: 'location', title: 'Yer', icon: '📍' },
  { key: 'media', title: 'Şəkil və video', icon: '🖼' },
  { key: 'halls', title: 'Zallar', icon: '🚪' },
  { key: 'menus', title: 'Menyular', icon: '🍽' },
  { key: 'review', title: 'Yekun', icon: '✅' },
]

const step = ref('venue')
const isLoading = ref(false)
const isSaving = ref(false)

const halls = ref([])
const menus = ref([])
const images = ref([])
const featureOptions = ref([])

const toggleFeature = (name) => {
  const index = form.features.indexOf(name)
  index === -1 ? form.features.push(name) : form.features.splice(index, 1)
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=60'

const onImgError = (event) => {
  event.target.src = FALLBACK_IMAGE
}

const form = reactive({
  name: '',
  city: '',
  address: '',
  phone: '',
  description: '',
  coverImageUrl: '',
  videoUrl: '',
  parkingCapacity: null,
  hasValetParking: false,
  latitude: null,
  longitude: null,
  features: [],
})

// Yüklənən ilkin hal — nəyinsə dəyişdiyini bilmək üçün
const snapshot = ref('')
const isDirty = computed(() => snapshot.value && JSON.stringify(form) !== snapshot.value)

const formatDate = (value) => {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const isFilled = (key) => {
  switch (key) {
    case 'venue':
      return Boolean(form.name && form.city && form.address && form.phone)
    case 'location':
      return form.latitude != null
    case 'media':
      return Boolean(form.coverImageUrl || form.videoUrl || images.value.length)
    case 'halls':
      return halls.value.length > 0
    case 'menus':
      return menus.value.length > 0
    default:
      return false
  }
}

// Təsdiqdən əvvəl adminə göstərilən çatışmazlıqlar
const gaps = computed(() => {
  const list = []
  if (!form.city || !form.address) list.push('şəhər/ünvan')
  if (!form.phone) list.push('telefon')
  if (!form.coverImageUrl) list.push('fon şəkli')
  if (!halls.value.length) list.push('zallar')
  if (!menus.value.length) list.push('menyular')
  if (!form.latitude) list.push('xəritədə yer')
  return list
})

const onCoordinates = ({ latitude, longitude }) => {
  form.latitude = latitude
  form.longitude = longitude
}

const load = async () => {
  isLoading.value = true
  try {
    const full = await getVenueById(props.venue.id)

    Object.assign(form, {
      name: full.name ?? '',
      city: full.city ?? '',
      address: full.address ?? '',
      phone: full.phone ?? '',
      description: full.description ?? '',
      coverImageUrl: full.coverImageUrl ?? '',
      videoUrl: full.videoUrl ?? '',
      parkingCapacity: full.parkingCapacity ?? null,
      hasValetParking: full.hasValetParking ?? false,
      latitude: full.latitude ?? null,
      longitude: full.longitude ?? null,
      features: full.features ?? [],
    })

    halls.value = full.halls ?? []
    menus.value = full.menus ?? []
    images.value = (full.images ?? []).map((url) => ({ url }))

    snapshot.value = JSON.stringify(form)

    featureOptions.value = await getFeatures()
  } catch (e) {
    ElMessage.error(e?.userMessage ?? e?.message ?? 'Məlumat yüklənmədi')
  } finally {
    isLoading.value = false
  }
}

const save = async () => {
  isSaving.value = true
  try {
    const message = await updateVenue(props.venue.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      coverImageUrl: form.coverImageUrl.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
      parkingCapacity: form.parkingCapacity || null,
      hasValetParking: form.hasValetParking,
      latitude: form.latitude,
      longitude: form.longitude,
      features: form.features,
    })

    ElMessage.success(message)
    snapshot.value = JSON.stringify(form)
    emit('changed')
  } catch (e) {
    ElMessage.error(e?.userMessage ?? e?.message ?? 'Yadda saxlanmadı')
  } finally {
    isSaving.value = false
  }
}

// Ayrıca "saxla" düyməsi yoxdur: bağlayarkən dəyişiklik varsa özü saxlanılır
const closeDialog = async () => {
  if (isDirty.value) await save()
  emit('close')
}

// Təsdiqdən əvvəl düzəlişlər də saxlanılır — admin iki dəfə düymə basmasın
const approve = async () => {
  isSaving.value = true
  try {
    await save()

    const result = await setVenueApproved(props.venue.id, true)
    if (!result.success) return ElMessage.error(result.message)

    ElMessage.success(result.message)
    emit('changed')
    emit('close')
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
:deep(.review-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.review-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

/* Pəncərə ekrana sığmalıdır — səhifə scroll olmasın deyə
   yalnız məzmun sahəsi lazım gələndə sürüşür */
:deep(.review-dialog) {
  margin-top: 3vh !important;
  margin-bottom: 3vh !important;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

:deep(.review-dialog .el-dialog__body) {
  padding: 10px 20px 2px;
  overflow-y: auto;
  flex: 1;
}

:deep(.review-dialog .el-dialog__footer) {
  padding: 10px 22px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Başlıq */
.rv-head {
  position: relative;
  height: 70px;
  margin: -20px -20px 0;
  overflow: hidden;
}

.rv-head img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.rv-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(26, 17, 24, 0.92), rgba(26, 17, 24, 0.25));
}

.rv-title {
  position: absolute;
  left: 22px;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rv-caption {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #dfb15b;
  font-weight: 700;
}

.rv-title b {
  font-size: 1.2rem;
  color: #fff;
}

.rv-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.78);
}

.badge {
  font-style: normal;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 20px;
}

.badge.ok {
  background: rgba(126, 217, 158, 0.22);
  color: #8fe0ab;
}

.badge.wait {
  background: rgba(223, 177, 91, 0.22);
  color: #dfb15b;
}

.rv-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
}

/* Addımlar */
.steps {
  display: flex;
  gap: 6px;
  margin: 0 0 9px;
  padding: 0;
  list-style: none;
  flex-wrap: wrap;
}

.steps li {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #fff;
  border: 1px solid #f0eaec;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  color: #a6969c;
  cursor: pointer;
  transition: all 0.15s;
}

.steps li:hover {
  border-color: #dfb15b;
}

.steps li.filled {
  color: #217a41;
  border-color: #d7ecdf;
}

.steps li.active {
  background: #721438;
  border-color: #721438;
  color: #fff;
  font-weight: 600;
}

/* Bölmələr */
.pane {
  min-height: 118px;
}

/* Xəritə pəncərəyə sığsın deyə burada bir az alçaqdır */
.pane :deep(.picker-map) {
  height: 140px;
}

/* Şəkil və video yan-yana — hündürlüyə qənaət */
.media-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

/* Özəllik siyahısı uzun ola bilər — üç sətirdən sonra öz içində sürüşür,
   yoxsa bütün pəncərəni uzadır */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-height: 62px;
  overflow-y: auto;
}

.chip {
  background: #fff;
  border: 1px solid #f0eaec;
  color: #6c757d;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.76rem;
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

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px 10px;
}

.grid .two {
  grid-column: span 2;
}

label,
.wide {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.72rem;
  color: #868e96;
}

label.wide,
.grid .wide {
  grid-column: 1 / -1;
}

label em {
  font-style: normal;
  color: #c9bcc1;
}

input,
textarea {
  border: 1px solid #f0eaec;
  border-radius: 9px;
  padding: 5px 10px;
  font-size: 0.8rem;
  color: #1a1118;
  outline: none;
  font-family: inherit;
}

input:focus,
textarea:focus {
  border-color: #dfb15b;
}

label.check {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding-top: 14px;
  color: #4a3f44;
}

.pane-label {
  display: block;
  font-size: 0.76rem;
  color: #868e96;
  margin: 8px 0 5px;
}

.pane-label em {
  font-style: normal;
  background: #f6e9ee;
  color: #721438;
  padding: 1px 8px;
  border-radius: 20px;
  margin-left: 5px;
}

.shot-row img {
  width: 100%;
  height: 170px;
  object-fit: cover;
  border-radius: 10px;
  margin: 8px 0 4px;
}

.shot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
}

.shot-grid img {
  width: 100%;
  height: 56px;
  object-fit: cover;
  border-radius: 9px;
}

.sub-card {
  border: 1px solid #f4eff1;
  border-radius: 11px;
  padding: 12px 14px;
  margin-bottom: 10px;
}

.sub-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.9rem;
  color: #1a1118;
  margin-bottom: 4px;
}

.sub-meta {
  font-size: 0.78rem;
  color: #868e96;
}

.sub-desc {
  margin: 0;
  font-size: 0.82rem;
  color: #6c757d;
}

/* Yekun */
.summary {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.summary > div {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  border-bottom: 1px solid #faf7f8;
  padding-bottom: 7px;
}

.summary dt {
  width: 140px;
  flex: none;
  color: #a6969c;
  font-size: 0.77rem;
}

.summary dd {
  margin: 0;
  color: #1a1118;
}

.warn-line {
  margin: 14px 0 0;
  background: #fdf0e3;
  border-left: 3px solid #dfb15b;
  padding: 10px 13px;
  border-radius: 0 9px 9px 0;
  font-size: 0.82rem;
  color: #8a6a25;
}

.ok-line {
  margin: 14px 0 0;
  color: #217a41;
  font-size: 0.85rem;
}

.empty {
  color: #a6969c;
  font-size: 0.84rem;
  text-align: center;
  padding: 30px 10px;
}

.spacer {
  flex: 1;
}

.ghost-btn,
.approve-btn {
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.ghost-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: #4a3f44;
}

.ghost-btn:hover:not(:disabled) {
  border-color: #dfb15b;
}

.approve-btn {
  background: #1e7e34;
  border: 1px solid #1e7e34;
  color: #fff;
}

.approve-btn:hover:not(:disabled) {
  background: #17692b;
}

.approve-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .grid .two,
  .media-row {
    grid-column: auto;
    grid-template-columns: 1fr;
  }
}
</style>
