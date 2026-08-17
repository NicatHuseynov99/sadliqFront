<template>
  <div class="vm" v-loading="isLoading">
    <!-- Saray siyahısı -->
    <section class="vm-list">
      <div class="vm-head">
        <h2 class="block-title">
          {{ canEdit ? 'Saraylarım' : 'Zallarım' }}
          <em v-if="venues.length">{{ venues.length }}</em>
        </h2>
        <UiButton v-if="canEdit" size="sm" @click="openVenueForm(null)">+ Yeni saray</UiButton>
      </div>

      <p v-if="!canEdit" class="vm-note">
        Sizə təyin olunmuş zalların məlumatlarını dəyişə və təqvimini idarə edə bilərsiniz.
        Yeni zal açmaq, sarayın özünü redaktə etmək və menyular rəhbərliyə aiddir.
      </p>

      <div v-if="!venues.length && !isLoading" class="empty-box">
        {{ canEdit ? 'Hələ sarayınız yoxdur — "Yeni saray" düyməsi ilə əlavə edin.' : 'Sizə hələ zal təyin olunmayıb.' }}
      </div>

      <div v-for="v in venues" :key="v.id" class="vm-card" :class="{ pending: !v.isApproved }">
        <img :src="v.coverImageUrl || FALLBACK_IMAGE" :alt="v.name" @error="onImgError" />

        <div class="vm-text">
          <b>
            {{ v.name }}
            <span v-if="!v.isApproved" class="wait-badge">⏳ Təsdiq gözləyir</span>
          </b>
          <span>📍 {{ v.city }} · {{ v.address }}</span>
          <em>{{ v.halls?.length ?? 0 }} zal · {{ v.menus?.length ?? 0 }} menyu</em>

          <!-- Rədd edilib: səbəb göstərilir və düzəliş açılır -->
          <span v-if="isRejected(v)" class="reject-note">
            <b>Saray saytda görünmür</b>
            {{ v.rejectionReason }}
            <em>Düzəlişi edin və yenidən yoxlamağa göndərin.</em>
          </span>

          <!-- Yoxlama gedir: bu müddətdə data dondurulur -->
          <span v-else-if="!v.isApproved" class="wait-note">
            Müraciətiniz yoxlanılır. Bu müddətdə məlumatlar dəyişdirilə bilmir və
            saray müştərilərə görünmür.
          </span>
        </div>

        <!-- Rədd edilmiş sarayda redaktə açıqdır — düzəlmək üçün lazımdır -->
        <div v-if="isRejected(v)" class="vm-actions">
          <button v-if="canEdit" class="mini-btn" @click="openVenueForm(v)">Redaktə</button>
          <button class="mini-btn" @click="openHalls(v)">Zallar</button>
          <UiButton size="sm" :is-loading="isResubmitting === v.id" @click="resubmit(v)">
            Yenidən göndər
          </UiButton>
        </div>
        <div v-else-if="!v.isApproved" class="vm-actions">
          <button class="mini-btn" @click="openHalls(v)">Zallara bax</button>
        </div>
        <div v-else class="vm-actions">
          <button v-if="canEdit" class="mini-btn" @click="openVenueForm(v)">Redaktə</button>
          <button class="mini-btn" @click="openHalls(v)">Zallar</button>
          <button v-if="canEdit" class="mini-btn" @click="openMenus(v)">Menyular</button>
          <el-popconfirm
            v-if="canEdit"
            title="Saray və bütün zalları silinəcək. Əminsiniz?"
            confirm-button-text="Bəli, sil"
            cancel-button-text="Xeyr"
            @confirm="removeVenue(v)"
          >
            <template #reference>
              <button class="mini-btn danger">Sil</button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </section>

    <!-- Saray forması -->
    <el-dialog v-model="venueDialog" :title="venueForm.id ? 'Sarayı redaktə et' : 'Yeni saray'" width="620px">
      <el-form label-position="top" @submit.prevent>
        <div class="form-row">
          <el-form-item label="Sarayın adı">
            <el-input v-model="venueForm.name" placeholder="Gülüstan Sarayı" />
          </el-form-item>
          <el-form-item label="Şəhər">
            <el-input v-model="venueForm.city" placeholder="Bakı" />
          </el-form-item>
        </div>

        <el-form-item label="Ünvan">
          <el-input v-model="venueForm.address" placeholder="Nizami küç. 10" />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="Telefon">
            <el-input v-model="venueForm.phone" placeholder="+994 12 000 00 00" />
          </el-form-item>
          <el-form-item label="Kapak şəkli (link)">
            <el-input v-model="venueForm.coverImageUrl" placeholder="https://..." />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="Enlik (latitude)">
            <el-input v-model.number="venueForm.latitude" placeholder="40.3608" />
          </el-form-item>
          <el-form-item label="Uzunluq (longitude)">
            <el-input v-model.number="venueForm.longitude" placeholder="49.8352" />
          </el-form-item>
        </div>

        <el-form-item label="Təsvir">
          <el-input v-model="venueForm.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="Özəlliklər">
          <div class="feature-picker">
            <button
              v-for="f in featureOptions"
              :key="f"
              class="feature-chip"
              :class="{ active: venueForm.features.includes(f) }"
              @click="toggleFeature(f)"
            >
              {{ f }}
            </button>
          </div>
        </el-form-item>

        <p v-if="formError" class="form-error">{{ formError }}</p>
      </el-form>

      <template #footer>
        <el-button @click="venueDialog = false">İmtina</el-button>
        <UiButton :is-loading="isSaving" @click="saveVenue">Yadda saxla</UiButton>
      </template>
    </el-dialog>

    <!-- Zallar -->
    <el-dialog v-model="hallDialog" :title="`${activeVenue?.name} — zallar`" width="760px">
      <div class="hall-head">
        <span class="hall-count">{{ halls.length }} zal</span>
        <UiButton v-if="canEdit && isActiveApproved" size="sm" @click="openHallForm(null)">+ Yeni zal</UiButton>
      </div>

      <!-- Təsdiqə qədər zallar yalnız baxış üçündür -->
      <p v-if="!isActiveApproved" class="wait-strip">
        ⏳ Saray təsdiq gözləyir — zalları yalnız görə bilərsiniz.
      </p>

      <div class="hall-grid">
        <article v-for="h in halls" :key="h.id" class="hall-card">
          <div class="hc-image">
            <img :src="h.imageUrl || FALLBACK_IMAGE" :alt="h.name" @error="onImgError" />
            <span class="hc-price">{{ h.minPrice }} ₼-dən</span>
          </div>

          <div class="hc-body">
            <h4>{{ h.name }}</h4>
            <span class="hc-capacity">👥 {{ h.capacity }} qonaq</span>
            <p class="hc-desc">{{ h.description || 'Təsvir yazılmayıb' }}</p>

            <div v-if="isActiveApproved" class="hc-actions">
              <button class="act-btn" @click="openCalendar(h)"><span>📅</span> Təqvim</button>
              <button class="act-btn" @click="openHallForm(h)"><span>✏️</span> Redaktə</button>
              <el-popconfirm
                v-if="canEdit"
                title="Zal silinsin?"
                confirm-button-text="Bəli, sil"
                cancel-button-text="Xeyr"
                @confirm="removeHall(h)"
              >
                <template #reference>
                  <button class="act-btn danger"><span>🗑</span> Sil</button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </article>

        <div v-if="!halls.length" class="empty-box">Bu sarayda hələ zal yoxdur.</div>
      </div>
    </el-dialog>

    <!-- Zalın forması -->
    <el-dialog
      v-model="hallFormDialog"
      :title="hallForm.id ? `${hallForm.name || 'Zal'} — redaktə` : 'Yeni zal'"
      width="640px"
    >
      <div class="hf-grid">
        <!-- Şəkil önizləməsi -->
        <div class="hf-preview">
          <img v-if="hallForm.imageUrl" :src="hallForm.imageUrl || FALLBACK_IMAGE" alt="" @error="onImgError" />
          <div v-else class="hf-placeholder">🏛<span>Şəkil linki əlavə edin</span></div>
        </div>

        <el-form label-position="top" class="hf-fields" @submit.prevent>
          <el-form-item label="Zalın adı">
            <el-input v-model="hallForm.name" placeholder="Böyük Zal" />
          </el-form-item>

          <div class="form-row">
            <el-form-item label="Tutum (qonaq)">
              <el-input v-model.number="hallForm.capacity" type="number" min="1" />
            </el-form-item>
            <el-form-item label="Minimum qiymət (₼)">
              <el-input v-model.number="hallForm.minPrice" type="number" min="0" />
            </el-form-item>
          </div>

          <el-form-item label="Şəkil (link)">
            <el-input v-model="hallForm.imageUrl" placeholder="https://..." />
          </el-form-item>
        </el-form>
      </div>

      <el-form label-position="top" @submit.prevent>
        <el-form-item label="Təsvir">
          <el-input
            v-model="hallForm.description"
            type="textarea"
            :rows="3"
            maxlength="300"
            show-word-limit
            placeholder="Zalın xüsusiyyətləri: səhnə, rəqs meydançası, işıqlandırma..."
          />
        </el-form-item>
      </el-form>

      <p v-if="formError" class="form-error">{{ formError }}</p>

      <template #footer>
        <el-button @click="closeHallForm">İmtina</el-button>
        <UiButton :is-loading="isSaving" @click="saveHall">
          {{ hallForm.id ? 'Yadda saxla' : 'Zal əlavə et' }}
        </UiButton>
      </template>
    </el-dialog>

    <!-- Zalın təqvimi -->
    <el-dialog v-model="calendarDialog" :title="`${calendarHall?.name} — təqvim`" width="460px">
      <HallCalendarEditor v-if="calendarHall" :hall-id="calendarHall.id" />
    </el-dialog>

    <!-- Menyular -->
    <el-dialog v-model="menuDialog" :title="`${activeVenue?.name} — menyular`" width="720px">
      <div class="sub-list">
        <div v-for="m in menus" :key="m.id" class="sub-card">
          <img :src="m.imageUrl || FALLBACK_IMAGE" :alt="m.name" @error="onImgError" />
          <div class="sub-text">
            <b>{{ m.name }}</b>
            <span>{{ m.pricePerPerson }} ₼ / nəfər · {{ m.items?.length ?? 0 }} yemək</span>
            <em>{{ m.description }}</em>
          </div>
          <div class="sub-actions">
            <button class="mini-btn" @click="editMenu(m)">Redaktə</button>
            <el-popconfirm title="Menyu silinsin?" confirm-button-text="Bəli" cancel-button-text="Xeyr" @confirm="removeMenu(m)">
              <template #reference>
                <button class="mini-btn danger">Sil</button>
              </template>
            </el-popconfirm>
          </div>
        </div>
        <div v-if="!menus.length" class="empty-box">Bu sarayda hələ menyu yoxdur.</div>
      </div>

      <div class="sub-form">
        <h4>{{ menuForm.id ? 'Menyunu redaktə et' : 'Yeni menyu' }}</h4>
        <div class="form-row">
          <el-form-item label="Ad"><el-input v-model="menuForm.name" placeholder="Premium" /></el-form-item>
          <el-form-item label="Qiymət (₼ / nəfər)"><el-input v-model.number="menuForm.pricePerPerson" type="number" /></el-form-item>
        </div>
        <el-form-item label="Süfrə şəkli (link)"><el-input v-model="menuForm.imageUrl" placeholder="https://..." /></el-form-item>
        <el-form-item label="Təsvir"><el-input v-model="menuForm.description" type="textarea" :rows="2" /></el-form-item>

        <!-- Yeməklər yalnız yeni menyuda əlavə olunur -->
        <template v-if="!menuForm.id">
          <span class="items-label">Süfrənin tərkibi</span>
          <div v-for="(item, i) in menuForm.items" :key="i" class="item-row">
            <el-input v-model="item.name" placeholder="Yeməyin adı" />
            <el-select v-model="item.category" placeholder="Kateqoriya" style="width: 150px">
              <el-option v-for="c in categories" :key="c" :value="c" :label="c" />
            </el-select>
            <el-input v-model="item.imageUrl" placeholder="Şəkil linki" />
            <button class="mini-btn danger" @click="menuForm.items.splice(i, 1)">✕</button>
          </div>
          <button class="mini-btn" @click="menuForm.items.push({ name: '', category: 'İsti', imageUrl: '' })">
            + Yemək əlavə et
          </button>
        </template>

        <p v-if="formError" class="form-error">{{ formError }}</p>

        <div class="sub-form-foot">
          <UiButton size="sm" :is-loading="isSaving" @click="saveMenu">
            {{ menuForm.id ? 'Yenilə' : 'Menyu əlavə et' }}
          </UiButton>
          <button v-if="menuForm.id" class="mini-btn" @click="resetMenuForm">İmtina</button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { toast } from '@/utils/toast'
import HallCalendarEditor from '@/components/HallCalendarEditor.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { FALLBACK_IMAGE, onImgError } from '@/utils/imageFallback'
import {
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueHalls,
  createHall,
  updateHall,
  deleteHall,
  getVenueMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  resubmitVenue,
} from '@/services/ownerService'

const props = defineProps({
  venues: { type: Array, default: () => [] },

  // Administrator sarayın özünü və menyuları redaktə edə bilmir, yalnız zalları
  canEdit: { type: Boolean, default: true },
})

const emit = defineEmits(['changed'])

const featureOptions = [
  'Parkinq', 'Gəlin otağı', 'Canlı musiqi', 'Açıq teras',
  'Fişəng şousu', 'Uşaq guşəsi', 'VIP zona', 'Həyət sahəsi',
]

const categories = ['Soyuq', 'İsti', 'Desert', 'İçki']

const isLoading = ref(false)
const isSaving = ref(false)
const formError = ref('')

const venueDialog = ref(false)
const hallDialog = ref(false)
const hallFormDialog = ref(false)
const menuDialog = ref(false)
const calendarDialog = ref(false)
const calendarHall = ref(null)
const activeVenue = ref(null)

// Açıq pəncərədəki saray təsdiqlənibmi — təsdiqsizdə heç bir düymə göstərilmir
const isActiveApproved = computed(() => activeVenue.value?.isApproved !== false)

const halls = ref([])
const menus = ref([])

const venueForm = reactive({
  id: null, name: '', city: '', address: '', phone: '',
  coverImageUrl: '', latitude: null, longitude: null, description: '', features: [],
})

const hallForm = reactive({ id: null, name: '', capacity: 200, minPrice: 40, description: '', imageUrl: '' })
const menuForm = reactive({ id: null, name: '', pricePerPerson: 50, description: '', imageUrl: '', items: [] })

const notify = (message, type = 'success') => toast[type](message)

// Rədd edilib və hələ yenidən göndərilməyib — bu halda redaktə açıqdır
const isRejected = (venue) => !venue.isApproved && !!venue.rejectionReason && !venue.resubmittedAt

const isResubmitting = ref(null)

const resubmit = async (venue) => {
  isResubmitting.value = venue.id
  try {
    const message = await resubmitVenue(venue.id)
    notify(message)
    await load()
  } catch (e) {
    notify(e?.userMessage ?? e?.message ?? 'Göndərilmədi', 'error')
  } finally {
    isResubmitting.value = null
  }
}

const handleError = (e) => {
  formError.value = e?.userMessage ?? e?.message ?? 'Xəta baş verdi'
}

// ============ Saray ============

const openVenueForm = (venue) => {
  formError.value = ''
  Object.assign(venueForm, {
    id: venue?.id ?? null,
    name: venue?.name ?? '',
    city: venue?.city ?? '',
    address: venue?.address ?? '',
    phone: venue?.phone ?? '',
    coverImageUrl: venue?.coverImageUrl ?? '',
    latitude: venue?.latitude ?? null,
    longitude: venue?.longitude ?? null,
    description: venue?.description ?? '',
    features: (venue?.features ?? []).map((f) => (typeof f === 'string' ? f : f.name)),
  })
  venueDialog.value = true
}

const toggleFeature = (name) => {
  const index = venueForm.features.indexOf(name)
  index === -1 ? venueForm.features.push(name) : venueForm.features.splice(index, 1)
}

const saveVenue = async () => {
  if (!venueForm.name || !venueForm.city || !venueForm.address) {
    formError.value = 'Ad, şəhər və ünvan mütləqdir.'
    return
  }

  isSaving.value = true
  formError.value = ''
  try {
    const payload = { ...venueForm }
    delete payload.id

    const message = venueForm.id
      ? await updateVenue(venueForm.id, payload)
      : (await createVenue(payload)).message

    venueDialog.value = false
    notify(message)
    emit('changed')
  } catch (e) {
    handleError(e)
  } finally {
    isSaving.value = false
  }
}

const removeVenue = async (venue) => {
  try {
    notify(await deleteVenue(venue.id))
    emit('changed')
  } catch (e) {
    notify(e?.userMessage ?? 'Xəta baş verdi', 'error')
  }
}

// ============ Zallar ============

const openHalls = async (venue) => {
  activeVenue.value = venue
  resetHallForm()
  hallDialog.value = true
  isLoading.value = true
  try {
    halls.value = await getVenueHalls(venue.id)
  } finally {
    isLoading.value = false
  }
}

const resetHallForm = () => {
  Object.assign(hallForm, { id: null, name: '', capacity: 200, minPrice: 40, description: '', imageUrl: '' })
  formError.value = ''
}

// Zal forması: hall verilibsə redaktə, verilməyibsə yeni zal
const openHallForm = (hall) => {
  resetHallForm()

  if (hall) {
    Object.assign(hallForm, {
      id: hall.id,
      name: hall.name,
      capacity: hall.capacity,
      minPrice: hall.minPrice,
      description: hall.description ?? '',
      imageUrl: hall.imageUrl ?? '',
    })
  }

  hallFormDialog.value = true
}

const closeHallForm = () => {
  hallFormDialog.value = false
  resetHallForm()
}

const saveHall = async () => {
  if (!hallForm.name || !hallForm.capacity) {
    formError.value = 'Zalın adı və tutumu mütləqdir.'
    return
  }

  isSaving.value = true
  formError.value = ''
  try {
    const payload = {
      name: hallForm.name,
      capacity: hallForm.capacity,
      minPrice: hallForm.minPrice,
      description: hallForm.description,
      imageUrl: hallForm.imageUrl,
    }

    const message = hallForm.id
      ? await updateHall(hallForm.id, payload)
      : await createHall({ ...payload, venueId: activeVenue.value.id })

    halls.value = await getVenueHalls(activeVenue.value.id)
    closeHallForm()
    notify(message)
    emit('changed')
  } catch (e) {
    handleError(e)
  } finally {
    isSaving.value = false
  }
}

// Zalın günlərini əl ilə bağlamaq/açmaq üçün təqvimi açır
const openCalendar = (hall) => {
  calendarHall.value = hall
  calendarDialog.value = true
}

const removeHall = async (hall) => {
  try {
    notify(await deleteHall(hall.id))
    halls.value = await getVenueHalls(activeVenue.value.id)
    emit('changed')
  } catch (e) {
    notify(e?.userMessage ?? 'Xəta baş verdi', 'error')
  }
}

// ============ Menyular ============

const openMenus = async (venue) => {
  activeVenue.value = venue
  resetMenuForm()
  menuDialog.value = true
  isLoading.value = true
  try {
    menus.value = await getVenueMenus(venue.id)
  } finally {
    isLoading.value = false
  }
}

const resetMenuForm = () => {
  Object.assign(menuForm, { id: null, name: '', pricePerPerson: 50, description: '', imageUrl: '', items: [] })
  formError.value = ''
}

const editMenu = (menu) => {
  Object.assign(menuForm, {
    id: menu.id,
    name: menu.name,
    pricePerPerson: menu.pricePerPerson,
    description: menu.description ?? '',
    imageUrl: menu.imageUrl ?? '',
    items: [],
  })
}

const saveMenu = async () => {
  if (!menuForm.name || !menuForm.pricePerPerson) {
    formError.value = 'Menyunun adı və qiyməti mütləqdir.'
    return
  }

  isSaving.value = true
  formError.value = ''
  try {
    const message = menuForm.id
      ? await updateMenu(menuForm.id, {
          name: menuForm.name,
          pricePerPerson: menuForm.pricePerPerson,
          description: menuForm.description,
          imageUrl: menuForm.imageUrl,
        })
      : await createMenu({
          venueId: activeVenue.value.id,
          name: menuForm.name,
          pricePerPerson: menuForm.pricePerPerson,
          description: menuForm.description,
          imageUrl: menuForm.imageUrl,
          items: menuForm.items.filter((i) => i.name),
        })

    menus.value = await getVenueMenus(activeVenue.value.id)
    resetMenuForm()
    notify(message)
    emit('changed')
  } catch (e) {
    handleError(e)
  } finally {
    isSaving.value = false
  }
}

const removeMenu = async (menu) => {
  try {
    notify(await deleteMenu(menu.id))
    menus.value = await getVenueMenus(activeVenue.value.id)
    emit('changed')
  } catch (e) {
    notify(e?.userMessage ?? 'Xəta baş verdi', 'error')
  }
}

</script>

<style scoped>
.vm-list {
  background: #fff;
  border: 1px solid #f2ecee;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

.vm-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.vm-note {
  margin: 0 0 16px;
  padding: 10px 14px;
  background: #fdf6e9;
  border: 1px solid #f0dfbe;
  border-radius: 10px;
  font-size: 0.82rem;
  color: #8a6220;
  line-height: 1.5;
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

.vm-card {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #f2ecee;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

/* Təsdiq gözləyən saray kölgəli görünür — baxmaq olar, toxunmaq olmaz */
.vm-card.pending {
  background: #fbf9fa;
  border-color: #efe4e8;
  position: relative;
}

.vm-card.pending::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: repeating-linear-gradient(
    135deg,
    rgba(26, 17, 24, 0.03) 0 10px,
    transparent 10px 20px
  );
  pointer-events: none;
}

.vm-card.pending img {
  filter: grayscale(1);
  opacity: 0.6;
}

.vm-card.pending .vm-text b,
.vm-card.pending .vm-text span,
.vm-card.pending .vm-text em {
  color: var(--muted-2);
}

.wait-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--warn);
  background: #fdf0e3;
  padding: 2px 9px;
  border-radius: 20px;
  margin-left: 8px;
  white-space: nowrap;
}

.wait-note {
  font-size: 0.74rem !important;
  color: var(--warn) !important;
  line-height: 1.5;
  margin-top: 4px;
}

/* Rədd səbəbi — sahibkarın ilk oxuyacağı şey olmalıdır */
.reject-note {
  display: block !important;
  margin-top: 7px;
  padding: 9px 12px;
  background: var(--danger-soft);
  border-left: 3px solid var(--danger);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
  font-size: 0.78rem !important;
  color: var(--ink-2) !important;
  line-height: 1.55;
}

.reject-note b {
  display: block;
  color: var(--danger);
  font-size: 0.78rem;
  margin-bottom: 2px;
}

.reject-note em {
  display: block;
  font-style: normal;
  color: var(--muted);
  font-size: 0.73rem;
  margin-top: 5px;
}

.wait-strip {
  margin: 0 0 14px;
  background: #fdf0e3;
  border-left: 3px solid var(--gold);
  border-radius: 0 10px 10px 0;
  padding: 10px 14px;
  font-size: 0.83rem;
  color: #8a6a25;
}

.vm-card img {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
}

.vm-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-grow: 1;
}

.vm-text b {
  font-size: 1rem;
  color: var(--ink);
}

.vm-text span,
.vm-text em {
  font-style: normal;
  font-size: 0.8rem;
  color: #adb5bd;
}

.vm-actions,
.sub-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
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
  border-color: var(--brand);
  color: var(--brand);
}

.mini-btn.danger:hover {
  border-color: #c0392b;
  color: #c0392b;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.feature-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-chip {
  background: #fff;
  border: 1px solid var(--line-2);
  color: #6c757d;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.feature-chip.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

/* Zallar */
.hall-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.hall-count {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #b8a3ab;
}

.hall-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.hall-card {
  border: 1px solid #f2ecee;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  transition: all 0.18s;
}

.hall-card:hover {
  box-shadow: 0 6px 18px rgba(114, 20, 56, 0.08);
}

.hc-image {
  position: relative;
  height: 130px;
}

.hc-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hc-price {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(114, 20, 56, 0.95);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
}

.hc-body {
  padding: 12px 14px 14px;
}

.hc-body h4 {
  margin: 0 0 4px;
  font-size: 1rem;
  color: var(--ink);
}

.hc-capacity {
  font-size: 0.78rem;
  color: var(--muted);
}

.hc-desc {
  margin: 8px 0 12px;
  font-size: 0.8rem;
  color: #adb5bd;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 34px;
}

.hc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-top: 1px solid #f8f5f6;
  padding-top: 10px;
}

.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #fff;
  border: 1px solid var(--line-2);
  color: #6c757d;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.act-btn:hover {
  border-color: var(--brand);
  color: var(--brand);
  background: #fdfbfc;
}

.act-btn.danger:hover {
  border-color: #c0392b;
  color: #c0392b;
  background: #fdf4f3;
}

/* Zal forması */
.hf-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 18px;
  align-items: start;
}

.hf-preview {
  height: 100%;
  min-height: 190px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg);
  border: 1px solid #f2ecee;
}

.hf-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hf-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 2rem;
  color: #d9cdd2;
}

.hf-placeholder span {
  font-size: 0.75rem;
  color: #b8a3ab;
}

@media (max-width: 640px) {
  .hf-grid {
    grid-template-columns: 1fr;
  }
  .hf-preview {
    min-height: 140px;
  }
}

/* Menyu siyahısı */
.sub-list {
  max-height: 260px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.sub-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #f2ecee;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 8px;
}

.sub-card img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.sub-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-grow: 1;
}

.sub-text b {
  font-size: 0.9rem;
  color: var(--ink);
}

.sub-text span,
.sub-text em {
  font-style: normal;
  font-size: 0.76rem;
  color: #adb5bd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-form {
  border-top: 1px dashed #eee;
  padding-top: 14px;
}

.sub-form h4 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: var(--ink);
}

.sub-form-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.items-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #b8a3ab;
  margin-bottom: 8px;
}

.item-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.empty-box {
  background: #faf9fa;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  color: var(--muted);
  font-size: 0.87rem;
}

.form-error {
  margin: 8px 0 0;
  color: #d93025;
  font-size: 13px;
}
</style>
