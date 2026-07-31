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
          <input v-model="cityQuery" class="mini-search" type="search" placeholder="Axtar…" />
        </div>
        <p class="hint block-hint">
          Şəhər adı sarayın öz məlumatında saxlanılır. Adı dəyişəndə həmin şəhərdəki
          bütün saraylar yenilənir; mövcud adı yazsanız iki siyahı birləşir.
        </p>
        <ul class="ref-list">
          <li v-for="c in filteredCities" :key="c.name">
            <span class="bar" :style="{ width: share(c.venueCount, maxCity) }"></span>
            <span class="ref-name">{{ c.name }}</span>
            <span class="ref-count">{{ c.venueCount }} saray</span>
            <button v-if="canEdit" class="mini-btn" @click="startRename('city', c)">Adı dəyiş</button>
          </li>
          <li v-if="!filteredCities.length" class="empty-line">Uyğun şəhər tapılmadı.</li>
        </ul>
      </section>

      <!-- Özəlliklər -->
      <section class="block">
        <div class="block-head">
          <h3 class="block-title">Özəlliklər <em>{{ features.length }}</em></h3>
          <input v-model="featureQuery" class="mini-search" type="search" placeholder="Axtar…" />
        </div>
        <p class="hint block-hint">
          Az sarayda olan özəlliklər axtarış filtrində görünmür — narıncı rəqəm ona işarədir.
          Səhv yazılışları düzəltmək və ya oxşarları birləşdirmək üçün adı dəyişin.
        </p>
        <ul class="ref-list">
          <li v-for="f in filteredFeatures" :key="f.name" :class="{ rare: f.venueCount < 3 }">
            <span class="bar" :style="{ width: share(f.venueCount, maxFeature) }"></span>
            <span class="ref-name">{{ f.name }}</span>
            <span class="ref-count">{{ f.venueCount }} saray</span>
            <template v-if="canEdit">
              <button class="mini-btn" @click="startRename('feature', f)">Adı dəyiş</button>
              <button class="mini-btn danger" @click="removeFeature(f)">Sil</button>
            </template>
          </li>
          <li v-if="!filteredFeatures.length" class="empty-line">Uyğun özəllik tapılmadı.</li>
        </ul>
      </section>
    </div>

    <!-- Ad dəyişmə -->
    <el-dialog v-model="renameOpen" :title="renameTitle" width="420px">
      <p class="hint">
        <template v-if="renameKind === 'city'">
          «{{ renameTarget?.name }}» yazılan {{ renameTarget?.venueCount }} saray yenilənəcək.
        </template>
        <template v-else>
          «{{ renameTarget?.name }}» {{ renameTarget?.venueCount }} sarayda dəyişəcək.
          Mövcud adı yazsanız özəlliklər birləşəcək.
        </template>
      </p>
      <input v-model="renameValue" class="value-box full" placeholder="Yeni ad" />
      <template #footer>
        <button class="mini-btn" @click="renameOpen = false">İmtina</button>
        <button
          class="mini-btn ok"
          :disabled="!renameValue.trim() || renameValue.trim() === renameTarget?.name"
          @click="confirmRename"
        >
          Dəyiş
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
  getCities,
  renameCity,
  getFeatures,
  renameFeature,
  deleteFeature,
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

const renameOpen = ref(false)
const renameKind = ref('city')
const renameTarget = ref(null)
const renameValue = ref('')

const renameTitle = computed(() =>
  renameKind.value === 'city' ? 'Şəhərin adını dəyiş' : 'Özəlliyin adını dəyiş',
)

const loadAll = async () => {
  isLoading.value = true
  try {
    const [s, c, f] = await Promise.all([getSettings(), getCities(), getFeatures()])
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

const startRename = (kind, item) => {
  renameKind.value = kind
  renameTarget.value = item
  renameValue.value = item.name
  renameOpen.value = true
}

const confirmRename = async () => {
  const action = renameKind.value === 'city' ? renameCity : renameFeature
  const result = await action(renameTarget.value.name, renameValue.value.trim())
  if (!result.success) return ElMessage.error(result.message)

  renameOpen.value = false
  ElMessage.success(result.message)
  await loadAll()
}

// Silmək bütün saraylardan çıxarır — geri qaytarmaq mümkün deyil
const removeFeature = async (feature) => {
  try {
    await ElMessageBox.confirm(
      `«${feature.name}» ${feature.venueCount} saraydan silinəcək və geri qaytarıla bilməyəcək.`,
      'Özəlliyi sil',
      { confirmButtonText: 'Sil', cancelButtonText: 'İmtina', type: 'warning' },
    )
  } catch {
    return
  }

  const result = await deleteFeature(feature.name)
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
