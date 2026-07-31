<template>
  <div class="settings" v-loading="isLoading">
    <p v-if="!canEdit" class="readonly-note">
      Bu bölmə yalnız baxış üçün açıqdır — parametrləri və kitabçaları platforma sahibi dəyişir.
    </p>

    <!-- Parametrlər -->
    <section class="block">
      <h3 class="block-title">Platforma parametrləri</h3>
      <ul class="setting-list">
        <li v-for="s in settings" :key="s.key" class="setting-item">
          <div class="setting-text">
            <b>{{ s.label }}</b>
            <span class="hint">{{ s.description }}</span>
          </div>
          <div class="setting-edit">
            <input
              v-model="drafts[s.key]"
              class="value-box"
              :type="s.type === 'number' ? 'number' : 'text'"
              min="0"
              :disabled="!canEdit"
            />
            <button
              class="mini-btn"
              :disabled="!canEdit || String(drafts[s.key]) === s.value"
              @click="save(s)"
            >
              Yadda saxla
            </button>
          </div>
        </li>
      </ul>
    </section>

    <div class="two-col">
      <!-- Şəhərlər -->
      <section class="block">
        <h3 class="block-title">Şəhərlər <em>{{ cities.length }}</em></h3>
        <p class="hint block-hint">
          Şəhər adı sarayın öz məlumatında saxlanılır. Adı dəyişəndə həmin şəhərdəki
          bütün saraylar yenilənir; mövcud adı yazsanız iki siyahı birləşir.
        </p>
        <ul class="ref-list">
          <li v-for="c in cities" :key="c.name">
            <span class="ref-name">{{ c.name }}</span>
            <span class="ref-count">{{ c.venueCount }} saray</span>
            <button v-if="canEdit" class="mini-btn" @click="startRename('city', c)">Adı dəyiş</button>
          </li>
        </ul>
      </section>

      <!-- Özəlliklər -->
      <section class="block">
        <h3 class="block-title">Özəlliklər <em>{{ features.length }}</em></h3>
        <p class="hint block-hint">
          Az sarayda olan özəlliklər axtarış filtrində görünmür. Səhv yazılışları
          düzəltmək və ya oxşarları birləşdirmək üçün adı dəyişin.
        </p>
        <ul class="ref-list">
          <li v-for="f in features" :key="f.name" :class="{ rare: f.venueCount < 3 }">
            <span class="ref-name">{{ f.name }}</span>
            <span class="ref-count">{{ f.venueCount }} saray</span>
            <template v-if="canEdit">
              <button class="mini-btn" @click="startRename('feature', f)">Adı dəyiş</button>
              <button class="mini-btn danger" @click="removeFeature(f)">Sil</button>
            </template>
          </li>
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

const isLoading = ref(false)
const settings = ref([])
const cities = ref([])
const features = ref([])
const drafts = reactive({})

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

/* Parametrlər */
.setting-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid #faf7f8;
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-text {
  flex: 1;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-text b {
  font-size: 0.86rem;
  color: #1a1118;
}

.setting-edit {
  display: flex;
  gap: 8px;
  align-items: center;
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
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  padding: 6px 0;
  border-bottom: 1px solid #faf7f8;
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
