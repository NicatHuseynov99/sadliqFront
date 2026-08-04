<template>
  <div class="register-page">
    <div class="register-inner">
      <!-- Uğurlu göndərişdən sonra forma əvəzinə nəticə göstərilir -->
      <div v-if="submitted" class="done-box">
        <span class="done-icon">🎉</span>
        <h1>Müraciətiniz göndərildi</h1>
        <p class="done-text">
          <b>{{ submitted.venueName }}</b> yoxlanışa göndərildi.
          Komandamız məlumatları nəzərdən keçirəcək və təsdiqdən sonra saray saytda görünəcək.
        </p>

        <div v-if="submitted.missing?.length" class="missing-box">
          <b>Təsdiqi sürətləndirmək üçün bunları da əlavə edin:</b>
          <ul>
            <li v-for="m in submitted.missing" :key="m">{{ m }}</li>
          </ul>
          <span class="missing-note">Bunları panelinizdən istənilən vaxt doldura bilərsiniz.</span>
        </div>

        <div class="done-actions">
          <button class="primary-btn" @click="$router.push('/panel')">Panelə keç</button>
          <button class="ghost-btn" @click="$router.push('/')">Ana səhifə</button>
        </div>
      </div>

      <template v-else>
        <header class="hero">
          <div class="hero-text">
            <span class="hero-eyebrow">Sahibkarlar üçün</span>
            <h1>Sarayınızı platformaya əlavə edin</h1>
            <p>
              Yalnız <b>ulduzlu</b> sahələr məcburidir — ad, e-poçt, parol və sarayın adı.
              Qalanını indi doldurmasanız da olar. Addımlar arasında sərbəst keçin,
              yazdıqlarınız özü saxlanılır.
            </p>
          </div>

          <ul class="hero-points">
            <li><b>Pulsuz</b> yerləşdirmə</li>
            <li><b>1 gün</b> ərzində yoxlanış</li>
            <li><b>Birbaşa</b> rezerv sorğuları</li>
          </ul>
        </header>

        <!-- Doldurulma faizi: uzun anketdə irəliləyişi görmək motivasiya verir -->
        <div class="progress">
          <div class="progress-bar"><span :style="{ width: `${progress}%` }"></span></div>
          <span class="progress-text">{{ progress }}% tamamlanıb</span>
        </div>

        <!-- Addım göstəricisi. İstənilən addıma keçmək olar —
             sahibkar əvvəlcə əlindəki məlumatı doldurub qalanına sonra qayıda bilsin. -->
        <ol class="steps">
          <li
            v-for="(s, i) in visibleSteps"
            :key="s.key"
            :class="{ active: i === stepIndex, filled: isStepFilled(s.key) }"
            @click="stepIndex = i"
          >
            <span class="step-icon">{{ isStepFilled(s.key) ? '✓' : s.icon }}</span>
            <span class="step-title">{{ s.title }}</span>
          </li>
        </ol>

        <p class="saved-note">
          💾 Yazdıqlarınız avtomatik saxlanılır — səhifəni bağlasanız da itmir.
          <button class="reset-link" @click="resetDraft">Hamısını təmizlə</button>
        </p>

        <section class="card">
          <!-- 1. Hesab -->
          <div v-if="current.key === 'account'">
            <h2>Hesab məlumatları</h2>
            <p class="hint">Sarayı bu hesabla idarə edəcəksiniz.</p>

            <div class="grid">
              <label>Ad <i>*</i><input v-model="form.applicant.firstName" /></label>
              <label>Soyad<input v-model="form.applicant.lastName" /></label>
              <label class="wide">E-poçt <i>*</i><input v-model="form.applicant.email" type="email" /></label>
              <label>Telefon<input v-model="form.applicant.phone" placeholder="+994 50 000 00 00" /></label>
              <label>Parol <i>*</i><input v-model="form.applicant.password" type="password" placeholder="ən azı 6 simvol" /></label>
            </div>
          </div>

          <!-- 2. Saray haqqında -->
          <div v-else-if="current.key === 'venue'">
            <h2>Saray haqqında</h2>

            <div class="grid">
              <label class="wide">Sarayın adı <i>*</i><input v-model="form.venue.name" /></label>

              <label>
                Şəhər
                <input v-model="form.venue.city" list="city-list" placeholder="Bakı" />
                <datalist id="city-list">
                  <option v-for="c in cities" :key="c.name" :value="c.name" />
                </datalist>
              </label>

              <label>Əlaqə nömrəsi<input v-model="form.venue.phone" /></label>
              <label class="wide">Ünvan<input v-model="form.venue.address" /></label>

              <label class="wide">
                Təsvir <em>sonra da yaza bilərsiniz</em>
                <textarea v-model="form.venue.description" rows="3"></textarea>
              </label>

              <label>
                Parkinq tutumu <em>avtomobil sayı</em>
                <input v-model.number="form.venue.parkingCapacity" type="number" min="0" />
              </label>

              <label class="check">
                <input v-model="form.venue.hasValetParking" type="checkbox" />
                Valet xidməti var
              </label>

              <div class="wide">
                <span class="label-text">Özəlliklər <em>uyğun olanları seçin</em></span>
                <div class="chips">
                  <button
                    v-for="f in features"
                    :key="f.name"
                    type="button"
                    class="chip"
                    :class="{ active: form.venue.features.includes(f.name) }"
                    @click="toggleFeature(f.name)"
                  >
                    {{ f.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Yer -->
          <div v-else-if="current.key === 'location'">
            <h2>Xəritədəki yer</h2>
            <p class="hint">
              Müştərilər sarayı xəritədə görsün. Hazırkı yerinizi götürə, ünvana görə
              tapa və ya nişanı əl ilə yerləşdirə bilərsiniz.
              <em>Bu addımı keçib sonra da doldurmaq olar.</em>
            </p>

            <!-- Yer avtomatik götürülür, amma təsdiq olmadan yazılmır:
                 sahibkar evdən doldurursa saray başqa yerdədir -->
            <div v-if="askLocation" class="ask-box">
              <b>📍 Bura sarayın yeridir?</b>
              <p>Cihazınızın göstərdiyi yeri xəritədə işarələdik. Doğrudursa təsdiqləyin.</p>
              <div class="ask-actions">
                <button class="primary-btn" @click="confirmLocation">Bəli, bura saraydır</button>
                <button class="ghost-btn" @click="rejectLocation">Xeyr, başqa yerdədir</button>
              </div>
            </div>

            <button v-else class="ghost-btn" :disabled="isLocating" @click="useMyLocation">
              {{ isLocating ? 'Tapılır…' : '📍 Hazırkı yerimi götür' }}
            </button>

            <div class="picker-box">
              <CoordinatePicker
                :latitude="form.venue.latitude"
                :longitude="form.venue.longitude"
                :address="`${form.venue.address}, ${form.venue.city}, Azərbaycan`"
                @update="onCoordinates"
              />
            </div>
          </div>

          <!-- 4. Şəkil və video -->
          <div v-else-if="current.key === 'media'">
            <h2>Şəkil və video</h2>
            <p class="hint">
              Fon şəkli saray kartında və axtarışda görünür — ən yaxşı şəklinizi seçin.
              <em>Hamısını sonra da əlavə edə bilərsiniz.</em>
            </p>

            <span class="label-text">Fon şəkli</span>
            <MediaUpload v-model="form.venue.coverImageUrl" label="Fon şəklini seçin" />

            <span class="label-text">Video <em>məcburi deyil</em></span>
            <MediaUpload v-model="form.venue.videoUrl" video label="Video seçin" />

            <span class="label-text">Əlavə şəkillər</span>
            <div class="shot-grid">
              <MediaUpload
                v-for="(img, i) in form.venue.imageUrls"
                :key="i"
                v-model="form.venue.imageUrls[i]"
                small
                label="Şəkil seçin"
              />
              <MediaUpload v-model="newImage" small label="Şəkil əlavə et" />
            </div>
          </div>

          <!-- 5. Zallar -->
          <div v-else-if="current.key === 'halls'">
            <h2>Zallar</h2>
            <p class="hint">
              Rezervlər zal üzrə aparılır. <em>İndi doldurmasanız da olar — təsdiqdən
              sonra panelinizdən əlavə edərsiniz.</em>
            </p>

            <div v-for="(hall, i) in form.halls" :key="i" class="sub-card">
              <div class="sub-head">
                <b>{{ hall.name || `Zal ${i + 1}` }}</b>
                <button v-if="form.halls.length > 1" class="del-btn" type="button" @click="form.halls.splice(i, 1)">✕</button>
              </div>

              <div class="grid">
                <label>Zalın adı <i>*</i><input v-model="hall.name" /></label>
                <label>Qonaq tutumu <i>*</i><input v-model.number="hall.capacity" type="number" min="1" /></label>
                <label>
                  Ən aşağı qiymət <em>nəfərbaşı, ₼</em>
                  <input v-model.number="hall.minPrice" type="number" min="0" />
                </label>
                <label class="wide">
                  Təsvir <em>məcburi deyil</em>
                  <textarea v-model="hall.description" rows="2"></textarea>
                </label>
                <div class="wide">
                  <span class="label-text">Zalın şəkli</span>
                  <MediaUpload v-model="hall.imageUrls[0]" small label="Zalın şəklini seçin" />
                </div>
              </div>
            </div>

            <button class="add-link" type="button" @click="addHall">+ Zal əlavə et</button>
          </div>

          <!-- 6. Menyular -->
          <div v-else-if="current.key === 'menus'">
            <h2>Menyular</h2>
            <p class="hint">
              Menyu qiymətləri müştərinin büdcə hesablamasında işlənir.
              <em>Bu addımı keçib menyuları sonra da əlavə edə bilərsiniz.</em>
            </p>

            <div v-for="(menu, i) in form.menus" :key="i" class="sub-card">
              <div class="sub-head">
                <b>{{ menu.name || `Menyu ${i + 1}` }}</b>
                <button class="del-btn" type="button" @click="form.menus.splice(i, 1)">✕</button>
              </div>

              <div class="grid">
                <label>Menyunun adı <i>*</i><input v-model="menu.name" /></label>
                <label>Nəfərbaşı qiymət <i>*</i><input v-model.number="menu.pricePerPerson" type="number" min="0" /></label>
                <div class="wide">
                  <span class="label-text">Menyunun şəkli</span>
                  <MediaUpload v-model="menu.imageUrl" small label="Süfrə şəklini seçin" />
                </div>
                <label class="wide">
                  Tərkibi <em>qısa təsvir</em>
                  <textarea v-model="menu.description" rows="2"></textarea>
                </label>
              </div>
            </div>

            <button class="add-link" type="button" @click="addMenu">+ Menyu əlavə et</button>
          </div>

          <!-- 7. Yekun -->
          <div v-else>
            <h2>Yekun baxış</h2>
            <p class="hint">Göndərdikdən sonra komandamız yoxlayacaq və sizinlə əlaqə saxlayacaq.</p>

            <dl class="summary">
              <div><dt>Saray</dt><dd>{{ form.venue.name || '—' }}</dd></div>
              <div><dt>Şəhər / ünvan</dt><dd>{{ form.venue.city }}, {{ form.venue.address }}</dd></div>
              <div><dt>Telefon</dt><dd>{{ form.venue.phone }}</dd></div>
              <div><dt>Zallar</dt><dd>{{ form.halls.length }}</dd></div>
              <div><dt>Menyular</dt><dd>{{ form.menus.length || 'əlavə edilməyib' }}</dd></div>
              <div><dt>Xəritədə yer</dt><dd>{{ form.venue.latitude ? 'təyin edilib' : 'təyin edilməyib' }}</dd></div>
              <div><dt>Fon şəkli</dt><dd>{{ form.venue.coverImageUrl ? 'var' : 'yoxdur' }}</dd></div>
              <div><dt>Video</dt><dd>{{ form.venue.videoUrl ? 'var' : 'yoxdur' }}</dd></div>
            </dl>

            <p v-if="willMiss.length" class="note-box">
              Bunlar boşdur: <b>{{ willMiss.join(', ') }}</b>.
              Müraciəti indi də göndərə bilərsiniz — sonra paneldən tamamlayarsınız.
            </p>
          </div>

          <p v-if="error" class="error-box">{{ error }}</p>

          <div class="actions">
            <button v-if="stepIndex > 0" class="ghost-btn" @click="stepIndex--">← Geri</button>
            <span class="spacer"></span>
            <!-- Addımı boş qoyub keçmək olar: məcburi sahələr yalnız göndərişdə yoxlanılır -->
            <button v-if="!isLast" class="primary-btn" @click="next">Növbəti →</button>
            <button v-if="!isLast" class="ghost-btn" @click="stepIndex = visibleSteps.length - 1">
              Yekuna keç
            </button>
            <button v-else class="primary-btn" :disabled="isSending || !canSubmit" @click="submit">
              {{ isSending ? 'Göndərilir…' : 'Müraciəti göndər' }}
            </button>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import CoordinatePicker from '@/components/CoordinatePicker.vue'
import MediaUpload from '@/components/MediaUpload.vue'
import { submitVenueApplication, STEPS } from '@/services/venueApplicationService'
import { getFilterOptions } from '@/services/venueService'
import { getMyLocation } from '@/services/mapService'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()

const stepIndex = ref(0)
const isSending = ref(false)
const isLocating = ref(false)

// Cihazın yeri götürülüb, sahibkarın təsdiqini gözləyirik
const askLocation = ref(false)
const locationAsked = ref(false)

// «Şəkil əlavə et» sahəsinə fayl düşən kimi siyahıya keçir
const newImage = ref('')
const error = ref('')
const submitted = ref(null)

const cities = ref([])
const features = ref([])

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=60'

const onImgError = (event) => {
  event.target.src = FALLBACK_IMAGE
}

const form = reactive({
  applicant: { firstName: '', lastName: '', email: '', phone: '', password: '' },
  venue: {
    name: '',
    city: '',
    address: '',
    phone: '',
    description: '',
    latitude: null,
    longitude: null,
    parkingCapacity: null,
    hasValetParking: false,
    coverImageUrl: '',
    videoUrl: '',
    imageUrls: [],
    features: [],
  },
  halls: [{ name: '', capacity: null, minPrice: null, description: '', imageUrls: [''] }],
  menus: [],
})

// Daxil olmuş istifadəçidən hesab məlumatı istənmir
const visibleSteps = computed(() => (auth.isAuth ? STEPS.filter((s) => s.key !== 'account') : STEPS))

const current = computed(() => visibleSteps.value[stepIndex.value])
const isLast = computed(() => stepIndex.value === visibleSteps.value.length - 1)


// Göndərmək üçün minimum: hesab + sarayın adı
const canSubmit = computed(() => {
  const a = form.applicant
  const accountReady =
    auth.isAuth || (a.firstName.trim() && a.email.includes('@') && a.password.trim().length >= 6)

  return accountReady && form.venue.name.trim().length > 0
})

// Neçə addım doldurulub — yuxarıdakı zolaq üçün
const progress = computed(() => {
  const total = visibleSteps.value.filter((s) => s.key !== 'review').length
  const done = visibleSteps.value.filter((s) => s.key !== 'review' && isStepFilled(s.key)).length
  return Math.round((done / total) * 100)
})

// Addımın doldurulub-doldurulmadığını göstərir — nişanı üçün
const isStepFilled = (key) => {
  const v = form.venue

  switch (key) {
    case 'account':
      return Boolean(form.applicant.firstName.trim() && form.applicant.email.includes('@'))
    case 'venue':
      return Boolean(v.name.trim())
    case 'location':
      return v.latitude != null
    case 'media':
      return Boolean(v.coverImageUrl || v.videoUrl || v.imageUrls.some((u) => u.trim()))
    case 'halls':
      return form.halls.some((h) => h.name.trim())
    case 'menus':
      return form.menus.some((m) => m.name.trim())
    default:
      return false
  }
}

// Yekun səhifədə xatırlatmaq üçün — bunlar müraciəti bloklamır
const willMiss = computed(() => {
  const v = form.venue
  const missing = []

  if (!v.coverImageUrl) missing.push('fon şəkli')
  if (!v.videoUrl) missing.push('video')
  if (!v.latitude) missing.push('xəritədə yer')
  if (!form.menus.length) missing.push('menyular')
  if (!v.parkingCapacity) missing.push('parkinq')

  return missing
})

const next = () => {
  error.value = ''
  if (stepIndex.value < visibleSteps.value.length - 1) stepIndex.value++
}

const toggleFeature = (name) => {
  const index = form.venue.features.indexOf(name)
  index === -1 ? form.venue.features.push(name) : form.venue.features.splice(index, 1)
}

// Yeni şəkil yüklənən kimi siyahıya əlavə olunur, sahə isə boşalır
watch(newImage, (url) => {
  if (!url) return
  form.venue.imageUrls.push(url)
  newImage.value = ''
})

const addHall = () =>
  form.halls.push({ name: '', capacity: null, minPrice: null, description: '', imageUrls: [''] })

const addMenu = () => form.menus.push({ name: '', pricePerPerson: null, description: '', imageUrl: '' })

const onCoordinates = ({ latitude, longitude }) => {
  form.venue.latitude = latitude
  form.venue.longitude = longitude
}

const useMyLocation = async () => {
  isLocating.value = true
  try {
    const position = await getMyLocation()
    if (position) {
      onCoordinates({ latitude: position[0], longitude: position[1] })
      askLocation.value = true
    } else {
      error.value = 'Yeriniz tapılmadı — nişanı xəritədə əl ilə yerləşdirin.'
    }
  } finally {
    isLocating.value = false
  }
}

const confirmLocation = () => {
  askLocation.value = false
  locationAsked.value = true
}

// Yer düz deyilsə nişanı götürürük ki, səhv koordinat yazılmasın
const rejectLocation = () => {
  askLocation.value = false
  locationAsked.value = true
  onCoordinates({ latitude: null, longitude: null })
  error.value = 'Nişanı xəritədə sarayın olduğu yerə qoyun və ya ünvana görə tapın.'
}

// «Yer» addımı ilk dəfə açılanda cihazın yerini özümüz soruşuruq
watch(
  () => current.value.key,
  (key) => {
    if (key === 'location' && !locationAsked.value && !form.venue.latitude) {
      locationAsked.value = true
      useMyLocation()
    }
  },
)

const submit = async () => {
  isSending.value = true
  error.value = ''

  try {
    const payload = {
      applicant: auth.isAuth ? null : form.applicant,
      venue: {
        ...form.venue,
        imageUrls: form.venue.imageUrls.filter((u) => u.trim()),
      },
      halls: form.halls.map((h) => ({
        ...h,
        minPrice: h.minPrice || 0,
        imageUrls: h.imageUrls.filter((u) => u?.trim()),
      })),
      menus: form.menus,
    }

    const result = await submitVenueApplication(payload)

    if (!result.success) {
      error.value = result.message
      return
    }

    // Yeni hesab yaradılıbsa dərhal daxil edirik — sahibkar panelə keçə bilsin
    if (result.data?.token) await auth.applyToken(result.data.token)

    // Müraciət getdi — qaralama artıq lazım deyil
    localStorage.removeItem(DRAFT_KEY)
    submitted.value = result.data
  } catch (e) {
    error.value = e?.userMessage ?? e?.message ?? 'Müraciət göndərilmədi'
  } finally {
    isSending.value = false
  }
}

// Anket uzundur — yazılanlar brauzerdə saxlanılır ki, səhifə bağlansa da itməsin.
// Parol saxlanılmır: yaddaşda açıq parol qalması təhlükəsiz deyil.
const DRAFT_KEY = 'sadliq_venue_draft'

const saveDraft = () => {
  const draft = {
    applicant: { ...form.applicant, password: '' },
    venue: form.venue,
    halls: form.halls,
    menus: form.menus,
    stepIndex: stepIndex.value,
  }

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

const loadDraft = () => {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return

  try {
    const draft = JSON.parse(raw)
    Object.assign(form.applicant, draft.applicant ?? {})
    Object.assign(form.venue, draft.venue ?? {})
    if (draft.halls?.length) form.halls = draft.halls
    if (draft.menus?.length) form.menus = draft.menus
    if (typeof draft.stepIndex === 'number') stepIndex.value = draft.stepIndex
  } catch {
    // Qeyd korlanıbsa sadəcə boş formadan başlayırıq
    localStorage.removeItem(DRAFT_KEY)
  }
}

const resetDraft = () => {
  localStorage.removeItem(DRAFT_KEY)
  window.location.reload()
}

// Hər dəyişiklik dərhal yaddaşa yazılır
watch([form, stepIndex], saveDraft, { deep: true })

onMounted(async () => {
  loadDraft()

  // Saxlanmış addım nömrəsi siyahıdan kənarda qalmasın
  if (stepIndex.value >= visibleSteps.value.length) stepIndex.value = 0

  const options = await getFilterOptions()
  cities.value = options.cities ?? []
  features.value = options.features ?? []
})
</script>

<style scoped>
.register-page {
  min-height: calc(100vh - 61px);
  background: #f4f6f8;
  padding: 30px 20px 60px;
}

.register-inner {
  max-width: 780px;
  margin: 0 auto;
}

/* Başlıq: tünd fon üzərində qızılı vurğu — panelin dili ilə eyni */
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  background: linear-gradient(120deg, #2a0f1c 0%, #4a0d24 55%, #721438 100%);
  border-radius: 18px;
  padding: 26px 30px;
  margin-bottom: 18px;
}

.hero::after {
  content: '';
  position: absolute;
  right: -70px;
  top: -90px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(223, 177, 91, 0.25), transparent 65%);
  pointer-events: none;
}

.hero-text {
  position: relative;
  z-index: 1;
  max-width: 460px;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #dfb15b;
  font-weight: 700;
  margin-bottom: 6px;
}

.hero h1 {
  margin: 0 0 8px;
  font-size: 1.65rem;
  color: #fff;
  letter-spacing: -0.01em;
}

.hero p {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.88rem;
  line-height: 1.65;
}

.hero p b {
  color: #dfb15b;
}

.hero-points {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hero-points li {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 7px 15px;
  border-radius: 20px;
  white-space: nowrap;
}

.hero-points b {
  color: #dfb15b;
}

/* İrəliləyiş zolağı */
.progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.progress-bar {
  flex: 1;
  height: 7px;
  background: #ece5e8;
  border-radius: 20px;
  overflow: hidden;
}

.progress-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #721438, #dfb15b);
  border-radius: 20px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.76rem;
  color: #a6969c;
  white-space: nowrap;
}

/* Addım göstəricisi */
.steps {
  display: flex;
  gap: 6px;
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
  flex-wrap: wrap;
}

.steps li {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid #f0eaec;
  padding: 7px 13px;
  border-radius: 20px;
  font-size: 0.78rem;
  color: #a6969c;
}

.steps li {
  cursor: pointer;
}

.steps li:hover {
  border-color: #dfb15b;
}

/* Doldurulmuş addım yaşıl nişan alır */
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

.step-icon {
  font-size: 0.9rem;
}

.saved-note {
  margin: -8px 0 16px;
  font-size: 0.76rem;
  color: #a6969c;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.reset-link {
  background: none;
  border: none;
  color: #a02c4a;
  font-size: 0.76rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

/* Forma kartı */
.card {
  background: #fff;
  border-radius: 16px;
  padding: 26px 28px;
  box-shadow: 0 4px 20px rgba(26, 17, 24, 0.06);
}

.card h2 {
  margin: 0 0 6px;
  font-size: 1.2rem;
  color: #1a1118;
}

.hint {
  margin: 0 0 18px;
  font-size: 0.84rem;
  color: #868e96;
  line-height: 1.6;
}

.hint em,
label em {
  font-style: normal;
  color: #b8a3ab;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

label,
.wide {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.8rem;
  color: #6c757d;
}

label.wide,
.grid .wide {
  grid-column: 1 / -1;
}

/* Məcburi sahə nişanı */
label i {
  font-style: normal;
  color: #a02c4a;
  font-weight: 700;
}

input,
textarea,
select {
  border: 1px solid #f0eaec;
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.88rem;
  color: #1a1118;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}

input:focus,
textarea:focus {
  border-color: #dfb15b;
}

label.check {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding-top: 22px;
}

.label-text {
  display: block;
  font-size: 0.8rem;
  color: #6c757d;
  margin: 16px 0 8px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  background: #fff;
  border: 1px solid #f0eaec;
  color: #6c757d;
  padding: 6px 13px;
  border-radius: 20px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
}

.chip.active {
  background: #721438;
  border-color: #721438;
  color: #fff;
}

/* Zal və menyu blokları */
.sub-card {
  border: 1px solid #f4eff1;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
}

.sub-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: #1a1118;
}

.row-input {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.row-input input {
  flex: 1;
}

.del-btn {
  border: 1px solid #f3dbe1;
  background: #fff;
  color: #a02c4a;
  width: 34px;
  border-radius: 9px;
  cursor: pointer;
}

.add-link {
  background: none;
  border: 1px dashed #dfb15b;
  color: #721438;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.add-link:hover {
  background: #fffaf2;
}

.preview img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 10px 0;
}

.picker-box {
  margin-top: 14px;
}

/* Cihazın yerini təsdiqləmə qutusu */
.ask-box {
  background: #fffaf2;
  border: 1px solid #f0e0bd;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 6px;
}

.ask-box b {
  font-size: 0.92rem;
  color: #1a1118;
}

.ask-box p {
  margin: 6px 0 12px;
  font-size: 0.82rem;
  color: #6c757d;
  line-height: 1.55;
}

.ask-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Şəkil yükləmə sahələri şəbəkə şəklində */
.shot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 8px;
}

/* Yekun */
.summary {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary > div {
  display: flex;
  gap: 14px;
  font-size: 0.86rem;
  border-bottom: 1px solid #faf7f8;
  padding-bottom: 8px;
}

.summary dt {
  width: 140px;
  flex: none;
  color: #a6969c;
  font-size: 0.78rem;
}

.summary dd {
  margin: 0;
  color: #1a1118;
}

.note-box {
  margin-top: 16px;
  background: #fffaf2;
  border-left: 3px solid #dfb15b;
  border-radius: 0 10px 10px 0;
  padding: 11px 14px;
  font-size: 0.83rem;
  color: #6c757d;
  line-height: 1.6;
}

.error-box {
  margin-top: 16px;
  background: #fdf4f6;
  border: 1px solid #f5dbe2;
  color: #a02c4a;
  padding: 11px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid #f8f5f6;
}

.spacer {
  flex: 1;
}

.primary-btn,
.ghost-btn {
  padding: 10px 22px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
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

.ghost-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: #4a3f44;
}

.ghost-btn:hover:not(:disabled) {
  border-color: #dfb15b;
}

/* Nəticə ekranı */
.done-box {
  background: #fff;
  border-radius: 16px;
  padding: 44px 32px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(26, 17, 24, 0.06);
}

.done-icon {
  font-size: 2.6rem;
}

.done-box h1 {
  margin: 12px 0 8px;
  font-size: 1.5rem;
  color: #1a1118;
}

.done-text {
  margin: 0 auto 20px;
  max-width: 460px;
  color: #6c757d;
  line-height: 1.7;
}

.missing-box {
  display: inline-block;
  text-align: left;
  background: #fffaf2;
  border: 1px solid #f3e4c0;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 22px;
  font-size: 0.85rem;
  color: #8a6a25;
}

.missing-box ul {
  margin: 8px 0;
  padding-left: 20px;
}

.missing-note {
  font-size: 0.78rem;
  color: #a6969c;
}

.done-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 20px 18px;
  }
}
</style>
