<template>
  <div class="staff-block" v-loading="isLoadingStaff">
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
            <el-option v-for="v in props.venues" :key="v.id" :value="v.id" :label="v.name" />
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
import { onMounted, reactive, ref } from 'vue'
import { toast } from '@/utils/toast'
import {
  getMyStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  setStaffActive,
  setStaffHalls,
  resetStaffPassword,
  getVenueHalls,
} from '@/services/ownerService'

const props = defineProps({
  venues: { type: Array, required: true },
})

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
    toast.success(message)
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
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
    toast.success(message)
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
    toast.success(message)
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
    toast.success(message, 'Silindi')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

// Administratorun girişini bağlayır və ya yenidən açır
const toggleStaff = async (member) => {
  try {
    const message = await setStaffActive(member.id, !member.isActive)
    await loadStaff()
    toast.success(message, 'Yeniləndi')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
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
    toast.success(message)
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

onMounted(() => {
  if (!staff.value.length) loadStaff()
})
</script>

<style scoped>
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
  color: var(--ink);
}

.block-sub {
  margin: 0 0 16px;
  font-size: 0.83rem;
  color: var(--muted);
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
  border-left: 4px solid var(--gold);
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
  color: var(--ink);
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
  color: var(--ink);
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
  background: var(--brand-soft);
  border-color: #e8cdd8;
  color: var(--brand);
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
  border-color: var(--brand);
  color: var(--brand);
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
  border: 1px solid var(--line-2);
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
  border-color: var(--brand);
  color: var(--brand);
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
  border: 1px solid var(--line-2);
  border-radius: 12px;
  padding: 10px 14px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.hall-option:hover {
  border-color: var(--gold);
}

.hall-option.selected {
  border-color: var(--brand);
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
  background: var(--brand);
  border-color: var(--brand);
}

.ho-text {
  display: flex;
  flex-direction: column;
}

.ho-text b {
  font-size: 0.9rem;
  color: var(--ink);
}

.ho-text em {
  font-style: normal;
  font-size: 0.75rem;
  color: #adb5bd;
}

.picker-summary {
  margin: 14px 0 0;
  font-size: 0.8rem;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 10px;
}

.link-clear {
  background: none;
  border: none;
  color: var(--brand);
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
  background: linear-gradient(135deg, var(--brand), #b07d2b);
  flex-shrink: 0;
  font-size: 0.9rem;
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
  color: var(--muted);
  line-height: 1.5;
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
  color: var(--muted);
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

.empty-box {
  background: #fff;
  border-radius: 14px;
  padding: 40px 20px;
  text-align: center;
  color: var(--muted);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

@media (max-width: 980px) {
  .staff-block {
    grid-template-columns: 1fr;
  }
}
</style>
