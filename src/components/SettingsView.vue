<template>
  <div class="settings" v-loading="isLoading">
    <p v-if="!canEdit" class="readonly-note">
      Bu bölmə yalnız baxış üçün açıqdır — parametrləri və kitabçaları platforma sahibi dəyişir.
    </p>

    <!-- Parametrlər -->
    <section class="block">
      <h3 class="block-title">Platforma parametrləri</h3>
      <p class="hint block-hint">
        Bu dəyərlər saytın davranışını dəyişir. Hər biri kodda deyil, burada saxlanılır —
        yeni dəyər dərhal qüvvəyə minir.
      </p>

      <div class="setting-grid">
        <article
          v-for="s in settings"
          :key="s.key"
          class="setting-card"
          :class="{ dirty: String(drafts[s.key]) !== s.value }"
        >
          <div class="setting-top">
            <span class="setting-icon">{{ SETTING_ICONS[s.key] ?? '⚙️' }}</span>
            <b class="setting-name">{{ s.label }}</b>
          </div>

          <p class="setting-desc">{{ s.description }}</p>

          <div class="setting-edit">
            <input
              v-model="drafts[s.key]"
              class="value-box"
              :type="s.type === 'number' ? 'number' : 'text'"
              min="0"
              :disabled="!canEdit"
            />
            <span v-if="SETTING_UNITS[s.key]" class="unit">{{ SETTING_UNITS[s.key] }}</span>
            <button
              class="save-btn"
              :disabled="!canEdit || String(drafts[s.key]) === s.value"
              @click="save(s)"
            >
              Yadda saxla
            </button>
          </div>

          <span v-if="s.updatedAt" class="setting-foot">
            son dəyişiklik: {{ formatDate(s.updatedAt) }}
          </span>
          <span v-else class="setting-foot muted">ilkin dəyər</span>
        </article>
      </div>
    </section>

    <div class="two-col">
      <!-- Şəhərlər -->
      <section class="block">
        <div class="block-head">
          <h3 class="block-title">Şəhərlər <em>{{ cities.length }}</em></h3>
          <div class="head-tools">
            <input v-model="cityQuery" class="mini-search" type="search" placeholder="Axtar…" />
            <label class="switch">
              <input type="checkbox" v-model="showDeleted" @change="loadAll" />
              silinmişlər
            </label>
            <button v-if="canEdit" class="add-btn" @click="startCreate('city')">+ Yeni</button>
          </div>
        </div>
        <p class="hint block-hint">
          Şəhər siyahısı ayrıca saxlanılır. Adı dəyişəndə həmin şəhərdəki bütün saraylar
          da yenilənir; sarayı olan şəhəri silmək olmur.
        </p>
        <ul class="ref-list">
          <li v-for="c in filteredCities" :key="c.id" :class="{ removed: c.isDeleted }">
            <span class="bar" :style="{ width: share(c.venueCount, maxCity) }"></span>
            <span class="ref-name">{{ c.name }}</span>
            <span class="ref-count">{{ c.venueCount }} saray</span>
            <template v-if="canEdit">
              <button v-if="c.isDeleted" class="mini-btn ok" @click="restore('city', c)">Geri qaytar</button>
              <template v-else>
                <button class="mini-btn" @click="startEdit('city', c)">Redaktə</button>
                <button class="mini-btn danger" @click="remove('city', c)">Sil</button>
              </template>
            </template>
          </li>
          <li v-if="!filteredCities.length" class="empty-line">Uyğun şəhər tapılmadı.</li>
        </ul>
      </section>

      <!-- Özəlliklər -->
      <section class="block">
        <div class="block-head">
          <h3 class="block-title">Özəlliklər <em>{{ features.length }}</em></h3>
          <div class="head-tools">
            <input v-model="featureQuery" class="mini-search" type="search" placeholder="Axtar…" />
            <button v-if="canEdit" class="add-btn" @click="startCreate('feature')">+ Yeni</button>
          </div>
        </div>
        <p class="hint block-hint">
          Az sarayda olan özəlliklər axtarış filtrində görünmür — narıncı rəqəm ona işarədir.
          Silinən özəllik sarayların siyahısından da çıxarılır.
        </p>
        <ul class="ref-list">
          <li
            v-for="f in filteredFeatures"
            :key="f.id"
            :class="{ rare: f.venueCount < 3 && !f.isDeleted, removed: f.isDeleted }"
          >
            <span class="bar" :style="{ width: share(f.venueCount, maxFeature) }"></span>
            <span v-if="f.icon" class="ref-icon">{{ f.icon }}</span>
            <span class="ref-name">{{ f.name }}</span>
            <span class="ref-count">{{ f.venueCount }} saray</span>
            <template v-if="canEdit">
              <button v-if="f.isDeleted" class="mini-btn ok" @click="restore('feature', f)">Geri qaytar</button>
              <template v-else>
                <button class="mini-btn" @click="startEdit('feature', f)">Redaktə</button>
                <button class="mini-btn danger" @click="remove('feature', f)">Sil</button>
              </template>
            </template>
          </li>
          <li v-if="!filteredFeatures.length" class="empty-line">Uyğun özəllik tapılmadı.</li>
        </ul>
      </section>
    </div>

    <!-- İnterfeys mətnləri -->
    <section class="block">
      <div class="block-head">
        <h3 class="block-title">
          İnterfeys mətnləri
          <em>{{ texts.length }}</em>
        </h3>
        <div class="head-tools">
          <input v-model="textQuery" class="mini-search wide" type="search" placeholder="Açar və ya mətn üzrə axtar…" @input="onTextSearch" />
          <button v-if="canEdit" class="add-btn" @click="startTextCreate">+ Yeni mətn</button>
        </div>
      </div>

      <p class="hint block-hint">
        Saytda görünən sabit sözlər burada saxlanılır — kodda yalnız açar qalır.
        Dəyişiklik dərhal qüvvəyə minir.
      </p>

      <div class="filter-chips">
        <button
          v-for="c in textCategories"
          :key="c.name"
          class="chip"
          :class="{ active: textCategory === c.name }"
          :title="c.description"
          @click="selectCategory(c.name)"
        >
          {{ c.label }} <em>{{ c.count }}</em>
        </button>
      </div>

      <p v-if="currentCategory" class="hint category-note">{{ currentCategory.description }}</p>

      <div class="table-wrap">
        <table class="text-table">
          <thead>
            <tr>
              <th>Açar</th>
              <th>Mətn</th>
              <th v-if="currentCategory?.usesExtra">Əməliyyat kodu</th>
              <th v-if="canEdit"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in texts" :key="t.id">
              <td class="key-cell">{{ t.key }}</td>
              <td>{{ t.value }}</td>
              <td v-if="currentCategory?.usesExtra" class="key-cell muted">{{ t.extra ?? '—' }}</td>
              <td v-if="canEdit" class="row-actions">
                <button class="mini-btn" @click="startTextEdit(t)">Redaktə</button>
                <button class="mini-btn danger" @click="removeText(t)">Sil</button>
              </td>
            </tr>
            <tr v-if="!texts.length">
              <td :colspan="4" class="empty-line">Mətn tapılmadı.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Mətn formu -->
    <el-dialog
      v-model="textFormOpen"
      :title="textFormMode === 'create' ? 'Yeni mətn' : 'Mətni düzəlt'"
      width="460px"
    >
      <label class="form-label">Kateqoriya</label>
      <select v-model="textForm.category" class="value-box full" :disabled="textFormMode === 'edit'">
        <option v-for="c in textCategories" :key="c.name" :value="c.name">{{ c.label }}</option>
      </select>

      <label class="form-label">Açar</label>
      <input v-model="textForm.key" class="value-box full mono" placeholder="UserLoggedIn" />
      <p class="hint small">Açar kodda işlənir — mövcud sətirdə onu dəyişmək tövsiyə olunmur.</p>

      <label class="form-label">Mətn</label>
      <input v-model="textForm.value" class="value-box full" placeholder="Sistemə giriş" />

      <template v-if="usesExtra(textForm.category)">
        <label class="form-label">Əməliyyat kodu</label>
        <input v-model="textForm.extra" class="value-box full mono" placeholder="UserLoggedIn" />
        <p class="hint small">Jurnalda bu sorğunun hansı əməliyyat kimi yazılacağını bildirir.</p>
      </template>

      <template #footer>
        <button class="mini-btn" @click="textFormOpen = false">İmtina</button>
        <button
          class="mini-btn ok"
          :disabled="!textForm.key.trim() || !textForm.value.trim()"
          @click="submitText"
        >
          {{ textFormMode === 'create' ? 'Əlavə et' : 'Yadda saxla' }}
        </button>
      </template>
    </el-dialog>

    <!-- Yeni / redaktə -->
    <el-dialog v-model="formOpen" :title="formTitle" width="420px">
      <p v-if="formMode === 'edit' && formTarget?.venueCount" class="hint">
        <template v-if="formKind === 'city'">
          Ad dəyişsə «{{ formTarget.name }}» yazılan {{ formTarget.venueCount }} saray da yenilənəcək.
        </template>
        <template v-else>
          Ad dəyişsə {{ formTarget.venueCount }} sarayda bu özəllik yenilənəcək.
          Mövcud adı yazsanız özəlliklər birləşəcək.
        </template>
      </p>

      <label class="form-label">Ad</label>
      <input v-model="form.name" class="value-box full" placeholder="Məsələn: Şəki" />

      <template v-if="formKind === 'feature'">
        <label class="form-label">İşarə (məcburi deyil)</label>
        <input v-model="form.icon" class="value-box full" placeholder="🅿️" />
      </template>

      <label class="form-label">Sıra nömrəsi</label>
      <input v-model.number="form.sortOrder" class="value-box full" type="number" min="0" />
      <p class="hint small">Kiçik rəqəm siyahıda daha öndə göstərilir.</p>

      <template #footer>
        <button class="mini-btn" @click="formOpen = false">İmtina</button>
        <button class="mini-btn ok" :disabled="!form.name.trim()" @click="submitForm">
          {{ formMode === 'create' ? 'Əlavə et' : 'Yadda saxla' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import {
  getSettings,
  updateSetting,
  cityApi,
  featureApi,
  getTextCategories,
  getTexts,
  createText,
  updateText,
  deleteText,
} from '@/services/platformService'

const auth = useAuthStore()

// Dəstək admini bölməni görür, amma dəyişə bilmir — server də eyni cür yoxlayır
const canEdit = computed(() => auth.user?.role === 'SuperAdmin')

// Hər parametrin nə haqda olduğu ikonadan da bilinsin
const SETTING_ICONS = {
  visit_retention_days: '🗓',
  feature_filter_min_count: '🔎',
  stale_pending_days: '⏳',
  review_auto_hide_reports: '🚩',
}

const SETTING_UNITS = {
  visit_retention_days: 'gün',
  feature_filter_min_count: 'saray',
  stale_pending_days: 'gün',
  review_auto_hide_reports: 'şikayət',
}

const formatDate = (value) => {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const isLoading = ref(false)
const settings = ref([])
const cities = ref([])
const features = ref([])
const drafts = reactive({})

const cityQuery = ref('')
const featureQuery = ref('')

const match = (list, term) =>
  term.trim()
    ? list.filter((i) => i.name.toLowerCase().includes(term.trim().toLowerCase()))
    : list

const filteredCities = computed(() => match(cities.value, cityQuery.value))
const filteredFeatures = computed(() => match(features.value, featureQuery.value))

const maxCity = computed(() => Math.max(1, ...cities.value.map((c) => c.venueCount)))
const maxFeature = computed(() => Math.max(1, ...features.value.map((f) => f.venueCount)))

// Sətrin arxasındakı zolaq — hansı adın nə qədər işləndiyi gözlə görünsün
const share = (count, max) => `${Math.round((count / max) * 100)}%`

// İnterfeys mətnləri
const textCategories = ref([])
const textCategory = ref('audit_action')
const texts = ref([])
const textQuery = ref('')

const currentCategory = computed(() =>
  textCategories.value.find((c) => c.name === textCategory.value),
)

const usesExtra = (name) => textCategories.value.find((c) => c.name === name)?.usesExtra ?? false

const textFormOpen = ref(false)
const textFormMode = ref('create')
const textFormTarget = ref(null)
const textForm = reactive({ category: 'audit_action', key: '', value: '', extra: '' })

const loadTexts = async () => {
  texts.value = await getTexts(textCategory.value, textQuery.value)
}

const selectCategory = async (name) => {
  textCategory.value = name
  textQuery.value = ''
  await loadTexts()
}

// Hər hərfdə sorğu getməsin deyə yazmaq bitəndən sonra axtarırıq
let textTimer = null
const onTextSearch = () => {
  clearTimeout(textTimer)
  textTimer = setTimeout(loadTexts, 350)
}

const startTextCreate = () => {
  textFormMode.value = 'create'
  textFormTarget.value = null
  Object.assign(textForm, { category: textCategory.value, key: '', value: '', extra: '' })
  textFormOpen.value = true
}

const startTextEdit = (text) => {
  textFormMode.value = 'edit'
  textFormTarget.value = text
  Object.assign(textForm, {
    category: text.category,
    key: text.key,
    value: text.value,
    extra: text.extra ?? '',
  })
  textFormOpen.value = true
}

const submitText = async () => {
  const payload = {
    category: textForm.category,
    key: textForm.key.trim(),
    value: textForm.value.trim(),
    extra: textForm.extra?.trim() || null,
  }

  const result =
    textFormMode.value === 'create'
      ? await createText(payload)
      : await updateText(textFormTarget.value.id, payload)

  if (!result.success) return ElMessage.error(result.message)

  textFormOpen.value = false
  ElMessage.success(result.message)
  await Promise.all([loadTexts(), refreshCategories()])
}

// Mətn silinsə kod açarın özünü göstərəcək — ona görə xəbərdarlıq edirik
const removeText = async (text) => {
  try {
    await ElMessageBox.confirm(
      `«${text.key}» açarının mətni silinəcək və saytda açarın özü görünəcək.`,
      'Mətni sil',
      { confirmButtonText: 'Sil', cancelButtonText: 'İmtina', type: 'warning' },
    )
  } catch {
    return
  }

  const result = await deleteText(text.id)
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  await Promise.all([loadTexts(), refreshCategories()])
}

const refreshCategories = async () => {
  textCategories.value = await getTextCategories()
}

const showDeleted = ref(false)

const formOpen = ref(false)
const formMode = ref('create')
const formKind = ref('city')
const formTarget = ref(null)
const form = reactive({ name: '', icon: '', sortOrder: 0 })

// Hər iki kitabça eyni cür işlədiyi üçün servis obyektini növə görə seçirik
const apiOf = (kind) => (kind === 'city' ? cityApi : featureApi)
const wordOf = (kind) => (kind === 'city' ? 'Şəhər' : 'Özəllik')

const formTitle = computed(
  () => `${wordOf(formKind.value)} — ${formMode.value === 'create' ? 'yeni' : 'redaktə'}`,
)

const loadAll = async () => {
  isLoading.value = true
  try {
    const [s, c, f] = await Promise.all([
      getSettings(),
      cityApi.list(showDeleted.value),
      featureApi.list(showDeleted.value),
      refreshCategories(),
      loadTexts(),
    ])
    settings.value = s
    cities.value = c
    features.value = f
    s.forEach((item) => {
      drafts[item.key] = item.value
    })
  } finally {
    isLoading.value = false
  }
}

const save = async (setting) => {
  const result = await updateSetting(setting.key, drafts[setting.key])
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  settings.value = await getSettings()
}

const startCreate = (kind) => {
  formKind.value = kind
  formMode.value = 'create'
  formTarget.value = null
  Object.assign(form, { name: '', icon: '', sortOrder: 0 })
  formOpen.value = true
}

const startEdit = (kind, item) => {
  formKind.value = kind
  formMode.value = 'edit'
  formTarget.value = item
  Object.assign(form, { name: item.name, icon: item.icon ?? '', sortOrder: item.sortOrder ?? 0 })
  formOpen.value = true
}

const submitForm = async () => {
  const api = apiOf(formKind.value)
  const payload = {
    name: form.name.trim(),
    icon: form.icon?.trim() || null,
    sortOrder: Number(form.sortOrder) || 0,
  }

  const result =
    formMode.value === 'create'
      ? await api.create(payload)
      : await api.update(formTarget.value.id, payload)

  if (!result.success) return ElMessage.error(result.message)

  formOpen.value = false
  ElMessage.success(result.message)
  await loadAll()
}

const remove = async (kind, item) => {
  const note =
    kind === 'city'
      ? 'Şəhər siyahıdan çıxarılacaq. Sarayı olan şəhəri silmək olmur.'
      : `«${item.name}» ${item.venueCount} saraydan da çıxarılacaq. Siyahıya geri qaytarmaq olar, ` +
        'amma saraylara əl ilə yenidən əlavə etmək lazım gələcək.'

  try {
    await ElMessageBox.confirm(note, `${wordOf(kind)} sil`, {
      confirmButtonText: 'Sil',
      cancelButtonText: 'İmtina',
      type: 'warning',
    })
  } catch {
    return
  }

  const result = await apiOf(kind).remove(item.id)
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  await loadAll()
}

const restore = async (kind, item) => {
  const result = await apiOf(kind).restore(item.id)
  if (!result.success) return ElMessage.error(result.message)

  ElMessage.success(result.message)
  await loadAll()
}

onMounted(loadAll)
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.readonly-note {
  margin: 0;
  background: #fdf6e6;
  border: 1px solid #f3e4c0;
  color: #8a6a25;
  font-size: 0.82rem;
  padding: 11px 16px;
  border-radius: 12px;
}

.block {
  background: #fff;
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(26, 17, 24, 0.06);
}

.block-title {
  margin: 0 0 14px;
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

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
}

.hint {
  font-size: 0.76rem;
  color: #868e96;
  line-height: 1.5;
}

.block-hint {
  margin: -6px 0 14px;
}

/* Parametr kartları */
.setting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.setting-card {
  border: 1px solid #f4eff1;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.setting-card:hover {
  box-shadow: 0 8px 20px rgba(26, 17, 24, 0.06);
}

/* Saxlanılmamış dəyişiklik gözə çarpsın */
.setting-card.dirty {
  border-color: #dfb15b;
  background: #fffdf7;
}

.setting-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-icon {
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 10px;
  background: #f6e9ee;
  display: grid;
  place-items: center;
  font-size: 1rem;
}

.setting-name {
  font-size: 0.87rem;
  color: #1a1118;
  line-height: 1.3;
}

.setting-desc {
  margin: 0;
  font-size: 0.76rem;
  color: #868e96;
  line-height: 1.5;
  flex: 1;
}

.setting-edit {
  display: flex;
  gap: 8px;
  align-items: center;
}

.unit {
  font-size: 0.76rem;
  color: #a6969c;
}

.save-btn {
  margin-left: auto;
  background: #721438;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 9px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.save-btn:hover:not(:disabled) {
  background: #5c1029;
}

.save-btn:disabled {
  background: #ece5e8;
  color: #b8a3ab;
  cursor: not-allowed;
}

.setting-foot {
  font-size: 0.7rem;
  color: #a6969c;
}

.setting-foot.muted {
  color: #c9bcc1;
}

.value-box {
  border: 1px solid #f0eaec;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: #1a1118;
  background: #fff;
  outline: none;
  width: 110px;
  transition: border-color 0.15s;
}

.value-box.full {
  width: 100%;
  margin-top: 10px;
}

.value-box:focus {
  border-color: #dfb15b;
}

.value-box:disabled {
  background: #faf8f9;
  color: #a6969c;
}

/* Kitabçalar */
.ref-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 420px;
  overflow-y: auto;
}

.ref-list li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  padding: 8px 10px;
  border-radius: 9px;
  overflow: hidden;
  transition: background 0.15s;
}

.ref-list li:hover {
  background: #fbf7f8;
}

/* İşlənmə payını göstərən arxa zolaq */
.bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(to right, #f9eef2, #fdf9fa);
  z-index: 0;
}

.ref-list li > *:not(.bar) {
  position: relative;
  z-index: 1;
}

.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.block-head .block-title {
  margin: 0;
}

.mini-search {
  border: 1px solid #f0eaec;
  border-radius: 9px;
  padding: 6px 11px;
  font-size: 0.78rem;
  outline: none;
  width: 130px;
  transition: border-color 0.15s;
}

.mini-search:focus {
  border-color: #dfb15b;
}

.empty-line {
  color: #a6969c;
  font-size: 0.8rem;
  padding: 12px 0;
  justify-content: center;
}

.head-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.switch {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  color: #868e96;
  cursor: pointer;
}

.add-btn {
  background: #721438;
  color: #fff;
  border: none;
  padding: 6px 13px;
  border-radius: 9px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.add-btn:hover {
  background: #5c1029;
}

.ref-icon {
  font-size: 0.9rem;
}

/* Silinmiş sətir sönük göstərilir */
.ref-list li.removed .ref-name {
  color: #b8a3ab;
  text-decoration: line-through;
}

.form-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #b8a3ab;
  font-weight: 700;
  margin: 12px 0 5px;
}

.hint.small {
  margin: 6px 0 0;
  font-size: 0.72rem;
}

/* İnterfeys mətnləri */
.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
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

.chip em {
  font-style: normal;
  color: #b8a3ab;
  margin-left: 4px;
}

.chip:hover {
  border-color: #dfb15b;
}

.chip.active {
  background: #721438;
  border-color: #721438;
  color: #fff;
}

.chip.active em {
  color: rgba(255, 255, 255, 0.7);
}

.category-note {
  margin: -4px 0 12px;
}

.table-wrap {
  overflow-x: auto;
}

.text-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.text-table th {
  text-align: left;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #b8a3ab;
  padding: 8px 10px;
  border-bottom: 1px solid #f2ecee;
  white-space: nowrap;
}

.text-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #faf7f8;
  color: #1a1118;
}

.text-table tr:hover td {
  background: #fbf7f8;
}

/* Açar kodda işlənir — monospace yazı onu mətndən ayırır */
.key-cell,
.value-box.mono {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.78rem;
}

.key-cell {
  color: #721438;
  white-space: nowrap;
}

.key-cell.muted {
  color: #a6969c;
}

.row-actions {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.mini-search.wide {
  width: 210px;
}

.ref-name {
  flex: 1;
  color: #1a1118;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ref-count {
  font-size: 0.75rem;
  color: #868e96;
  white-space: nowrap;
}

/* Nadir özəlliklər gözə çarpsın — birləşdirmək lazım ola bilər */
.ref-list li.rare .ref-count {
  color: #b06a2b;
}

.mini-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: #4a3f44;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
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
</style>
