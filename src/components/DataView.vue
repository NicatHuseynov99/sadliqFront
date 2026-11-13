<template>
  <div class="data" v-loading="isLoading">
    <div class="layout">
      <!-- Cədvəl siyahısı -->
      <aside class="side">
        <h3 class="side-title">Cədvəllər</h3>
        <ul class="table-list">
          <li v-for="t in tables" :key="t.name">
            <button class="table-btn" :class="{ active: table === t.name }" @click="selectTable(t.name)">
              <span class="table-label">{{ t.label }}</span>
              <em class="table-count">{{ t.rowCount }}</em>
            </button>
          </li>
        </ul>
      </aside>

      <!-- Sətirlər -->
      <section class="block">
        <div class="block-head">
          <h3 class="block-title">
            {{ currentLabel }}
            <em>{{ total }}</em>
          </h3>
          <div class="head-tools">
            <input
              v-model="q"
              class="search-box"
              type="search"
              placeholder="Mətn sütunlarında axtar…"
              @input="onSearchInput"
            />
            <label class="switch">
              <input type="checkbox" v-model="includeDeleted" @change="reload" />
              Silinmişləri göstər
            </label>
            <button class="add-btn" @click="openCreate">+ Yeni sətir</button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="grid">
            <thead>
              <tr>
                <th v-for="c in visibleColumns" :key="c.name" @click="setSort(c.name)">
                  {{ c.name }}
                  <span v-if="sort === c.name" class="arrow">{{ desc ? '▾' : '▴' }}</span>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in rows" :key="i" :class="{ removed: row.IsDeleted }">
                <td v-for="c in visibleColumns" :key="c.name" :title="display(row[c.name])">
                  {{ display(row[c.name]) }}
                </td>
                <td class="row-actions">
                  <button class="mini-btn" @click="openEdit(row)">Redaktə</button>
                  <button v-if="row.IsDeleted" class="mini-btn ok" @click="restore(row)">Geri qaytar</button>
                  <button v-else class="mini-btn danger" @click="remove(row)">Sil</button>
                </td>
              </tr>
              <tr v-if="!rows.length">
                <td :colspan="visibleColumns.length + 1" class="empty-row">Sətir yoxdur.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pager :page="page" :page-size="pageSize" :total="total" @change="goPage" />

        <p class="hint">
          Silinən sətir bazadan getmir — «silinmiş» kimi işarələnir, saytda görünmür və
          istənilən vaxt geri qaytarılır. Saray silinəndə onun zalları, menyuları,
          şəkilləri və rəyləri də eyni cür işarələnir.
        </p>
      </section>
    </div>

    <!-- Sətirin formu -->
    <el-dialog
      v-model="formOpen"
      :title="formMode === 'create' ? `${currentLabel} — yeni sətir` : `${currentLabel} — redaktə`"
      width="560px"
    >
      <div class="form-grid">
        <label v-for="c in formColumns" :key="c.name" :class="{ wide: c.type === 'text' }">
          {{ c.name }}
          <span v-if="c.isRequired" class="req">*</span>

          <select v-if="c.type === 'bool'" v-model="form[c.name]" class="value-box">
            <option :value="true">Bəli</option>
            <option :value="false">Xeyr</option>
          </select>
          <input
            v-else
            v-model="form[c.name]"
            class="value-box"
            :type="c.type === 'number' || c.type === 'decimal' ? 'number' : 'text'"
            :step="c.type === 'decimal' ? '0.01' : undefined"
            :placeholder="placeholder(c)"
          />
        </label>
      </div>
      <template #footer>
        <button class="mini-btn" @click="formOpen = false">İmtina</button>
        <button class="mini-btn ok" @click="submitForm">
          {{ formMode === 'create' ? 'Əlavə et' : 'Yadda saxla' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Pager from '@/components/Pager.vue'
import { ElMessageBox } from 'element-plus'
import { toast } from '@/utils/toast'
import {
  getTables,
  getRows,
  createRow,
  updateRow,
  deleteRow,
  restoreRow,
} from '@/services/dataService'

const isLoading = ref(false)
const tables = ref([])
const table = ref('Users')
const columns = ref([])
const rows = ref([])
const keyColumn = ref('Id')
const total = ref(0)

const q = ref('')
const page = ref(1)
const pageSize = ref(25)
const sort = ref(null)
const desc = ref(true)
const includeDeleted = ref(false)

const formOpen = ref(false)
const formMode = ref('create')
const formTarget = ref(null)
const form = reactive({})

const lastPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const currentLabel = computed(
  () => tables.value.find((t) => t.name === table.value)?.label ?? table.value,
)

// DeletedAt cədvəldə yer tutmasın — vəziyyət onsuz da sətirin rəngindən görünür
const visibleColumns = computed(() => columns.value.filter((c) => c.name !== 'DeletedAt'))

// Baza özü doldurduğu sütunlar formada göstərilmir
const formColumns = computed(() =>
  columns.value.filter((c) => !c.isGenerated && c.name !== 'DeletedAt'),
)

const placeholder = (column) =>
  ({ date: 'GG.AA.İİİİ', datetime: 'İİİİ-AA-GG SS:DD', decimal: '0.00' })[column.type] ?? ''

// Uzun mətnləri və tarixləri cədvəldə oxunaqlı göstəririk
const display = (value) => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'bəli' : 'xeyr'

  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const d = new Date(text)
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return text.length > 60 ? `${text.slice(0, 60)}…` : text
}

const loadRows = async () => {
  const result = await getRows(table.value, {
    q: q.value || undefined,
    page: page.value,
    pageSize: pageSize.value,
    sort: sort.value || undefined,
    desc: desc.value,
    includeDeleted: includeDeleted.value,
  })
  columns.value = result.columns
  rows.value = result.rows
  keyColumn.value = result.keyColumn
  total.value = result.totalCount
}

const refresh = async () => {
  isLoading.value = true
  try {
    await loadRows()
    tables.value = await getTables()
  } finally {
    isLoading.value = false
  }
}

const reload = async () => {
  page.value = 1
  isLoading.value = true
  try {
    await loadRows()
  } finally {
    isLoading.value = false
  }
}

const goPage = async (value) => {
  page.value = value
  isLoading.value = true
  try {
    await loadRows()
  } finally {
    isLoading.value = false
  }
}

const selectTable = async (name) => {
  table.value = name
  q.value = ''
  sort.value = null
  desc.value = true
  await reload()
}

const setSort = async (column) => {
  if (sort.value === column) desc.value = !desc.value
  else {
    sort.value = column
    desc.value = false
  }
  await reload()
}

// Hər hərfdə sorğu getməsin deyə yazmaq bitəndən sonra axtarırıq
let searchTimer = null
const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(reload, 350)
}

const openCreate = () => {
  formMode.value = 'create'
  formTarget.value = null
  Object.keys(form).forEach((k) => delete form[k])
  formColumns.value.forEach((c) => {
    form[c.name] = c.type === 'bool' ? false : ''
  })
  formOpen.value = true
}

const openEdit = (row) => {
  formMode.value = 'edit'
  formTarget.value = row
  Object.keys(form).forEach((k) => delete form[k])
  formColumns.value.forEach((c) => {
    const value = row[c.name]
    form[c.name] = value === null || value === undefined ? '' : value
  })
  formOpen.value = true
}

const submitForm = async () => {
  const values = {}
  formColumns.value.forEach((c) => {
    const value = form[c.name]
    // Boş mətn məcburi olmayan sütunda «dəyər yoxdur» deməkdir
    if (value === '' && !c.isRequired) values[c.name] = null
    else if (value !== '') values[c.name] = value
  })

  const result =
    formMode.value === 'create'
      ? await createRow(table.value, values)
      : await updateRow(table.value, formTarget.value[keyColumn.value], values)

  if (!result.success) return toast.error(result.message)

  formOpen.value = false
  toast.success(result.message)
  await refresh()
}

const remove = async (row) => {
  try {
    await ElMessageBox.confirm(
      'Sətir «silinmiş» kimi işarələnəcək: saytda görünməyəcək, amma bazada qalacaq və geri qaytarıla biləcək.',
      'Sətri sil',
      { confirmButtonText: 'Sil', cancelButtonText: 'İmtina', type: 'warning' },
    )
  } catch {
    return
  }

  const result = await deleteRow(table.value, row[keyColumn.value])
  if (!result.success) return toast.error(result.message)

  toast.success(result.message)
  await refresh()
}

const restore = async (row) => {
  const result = await restoreRow(table.value, row[keyColumn.value])
  if (!result.success) return toast.error(result.message)

  toast.success(result.message)
  await refresh()
}

onMounted(refresh)
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 18px;
  align-items: start;
}

/* Cədvəl siyahısı */
.side {
  background: #fff;
  border-radius: 14px;
  padding: 16px 14px;
  box-shadow: 0 1px 3px rgba(26, 17, 24, 0.06);
  position: sticky;
  top: 20px;
}

.side-title {
  margin: 0 0 10px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-2);
}

.table-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 70vh;
  overflow-y: auto;
}

.table-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 8px 10px;
  border-radius: 9px;
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}

.table-btn:hover {
  background: #fbf7f8;
}

.table-btn.active {
  background: var(--brand);
  color: #fff;
}

.table-count {
  font-style: normal;
  font-size: 0.7rem;
  color: var(--muted-2);
}

.table-btn.active .table-count {
  color: rgba(255, 255, 255, 0.7);
}

/* Sətirlər */
.block {
  background: #fff;
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(26, 17, 24, 0.06);
  min-width: 0;
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
  color: var(--ink);
}

.block-title em {
  font-style: normal;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.78rem;
  padding: 2px 9px;
  border-radius: 20px;
  margin-left: 6px;
}

.head-tools {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box,
.value-box {
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.82rem;
  color: var(--ink);
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.search-box {
  min-width: 200px;
}

.search-box:focus,
.value-box:focus {
  border-color: var(--gold);
}

.switch {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--muted);
  cursor: pointer;
}

.add-btn {
  background: var(--brand);
  color: #fff;
  border: none;
  padding: 9px 16px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.add-btn:hover {
  background: #5c1029;
}

.table-wrap {
  overflow-x: auto;
}

.grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.grid th {
  text-align: left;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-2);
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.grid th:hover {
  color: var(--brand);
}

.arrow {
  color: var(--brand);
}

.grid td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--bg);
  color: var(--ink);
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Silinmiş sətir üstündən xətlə göstərilir */
.grid tr.removed td {
  color: var(--muted-2);
  text-decoration: line-through;
}

.grid tr.removed .row-actions {
  text-decoration: none;
}

.row-actions {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.75rem;
  color: var(--muted);
}

.form-grid label.wide {
  grid-column: 1 / -1;
}

.req {
  color: var(--accent);
}

.mini-btn {
  background: #fff;
  border: 1px solid var(--line);
  color: var(--ink-2);
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.mini-btn:hover:not(:disabled) {
  border-color: var(--gold);
}

.mini-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mini-btn.danger {
  color: var(--accent);
  border-color: #f3dbe1;
}

.mini-btn.ok {
  color: var(--ok);
  border-color: #d7ecdf;
}

.empty-row {
  color: var(--muted-2);
  text-align: center;
  padding: 22px 10px;
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
  color: var(--muted);
}

.hint {
  margin: 16px 0 0;
  font-size: 0.76rem;
  color: var(--muted-2);
  line-height: 1.6;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .side {
    position: static;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
