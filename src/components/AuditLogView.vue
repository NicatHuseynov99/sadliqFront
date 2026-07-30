<template>
  <div class="audit" v-loading="isLoading">
    <!-- Süzgəclər -->
    <div class="filters">
      <div class="filter-row">
        <div class="field">
          <label>Axtarış</label>
          <input v-model="filters.q" type="text" placeholder="İzah və ya istifadəçi adı..." />
        </div>

        <div class="field">
          <label>Rol</label>
          <select v-model="filters.role">
            <option value="">Bütün rollar</option>
            <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>

        <div class="field">
          <label>Əməliyyat</label>
          <select v-model="filters.action">
            <option value="">Hamısı</option>
            <option v-for="a in options.actions" :key="a.code" :value="a.code">
              {{ a.label }} ({{ a.count }})
            </option>
          </select>
        </div>

        <div class="field">
          <label>Başlanğıc</label>
          <input v-model="filters.from" type="date" />
        </div>

        <div class="field">
          <label>Son</label>
          <input v-model="filters.to" type="date" />
        </div>
      </div>

      <div class="filter-foot">
        <label class="checkbox">
          <input v-model="filters.onlyFailed" type="checkbox" />
          Yalnız uğursuz əməliyyatlar
        </label>

        <span class="result-count">{{ totalCount }} qeyd</span>

        <button v-if="hasFilters" class="clear-link" @click="resetFilters">Süzgəcləri təmizlə ✕</button>
      </div>
    </div>

    <!-- Jurnal siyahısı -->
    <div v-if="!isLoading && !logs.length" class="empty-box">
      Bu şərtlərə uyğun qeyd tapılmadı.
    </div>

    <div class="log-list">
      <div v-for="log in logs" :key="log.id" class="log-row" :class="{ failed: !log.isSuccess }">
        <div class="log-main" @click="toggle(log.id)">
          <span class="log-time">
            <b>{{ timeOf(log.createdAt) }}</b>
            <em>{{ dateOf(log.createdAt) }}</em>
          </span>

          <span class="log-badge" :class="actionTone(log.action)">{{ labelOf(log.action) }}</span>

          <span class="log-text">
            {{ log.description }}
            <em v-if="!log.isSuccess" class="fail-tag">uğursuz · {{ log.statusCode }}</em>
          </span>

          <span class="log-user">
            <b>{{ log.userName }}</b>
            <em class="role-tag" :class="(log.role ?? '').toLowerCase()">{{ log.roleLabel }}</em>
          </span>

          <span class="log-toggle">{{ opened.has(log.id) ? '▲' : '▼' }}</span>
        </div>

        <!-- Detallar -->
        <div v-if="opened.has(log.id)" class="log-details">
          <div class="detail-grid">
            <div><span>Endpoint</span><b>{{ log.method }} {{ log.path }}</b></div>
            <div><span>Nəticə</span><b>{{ log.statusCode }} · {{ log.durationMs }} ms</b></div>
            <div><span>Obyekt</span><b>{{ log.entityType ?? '—' }}{{ log.entityId ? ` #${log.entityId}` : '' }}</b></div>
            <div><span>Saray</span><b>{{ log.venueId ?? '—' }}</b></div>
            <div><span>IP</span><b>{{ log.ip ?? '—' }}</b></div>
            <div><span>Əməliyyat kodu</span><b>{{ log.action }}</b></div>
          </div>

          <div v-if="log.errorMessage" class="detail-error">⚠️ {{ log.errorMessage }}</div>

          <div v-if="log.payload" class="detail-payload">
            <span class="detail-label">Göndərilən məlumat</span>
            <pre>{{ prettyPayload(log.payload) }}</pre>
          </div>

          <div class="detail-agent" v-if="log.userAgent">{{ log.userAgent }}</div>
        </div>
      </div>
    </div>

    <!-- Səhifələmə -->
    <div class="pager" v-if="hasMore || page > 1">
      <button class="page-btn" :disabled="page === 1" @click="changePage(page - 1)">‹ Əvvəlki</button>
      <span class="page-info">Səhifə {{ page }}</span>
      <button class="page-btn" :disabled="!hasMore" @click="changePage(page + 1)">Növbəti ›</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { searchAuditLogs, getAuditFilterOptions, actionTone, ROLE_LABELS } from '@/services/auditService'
import { formatDateFull } from '@/utils/date'

const logs = ref([])
const options = ref({ actions: [] })
const opened = ref(new Set())
const totalCount = ref(0)
const page = ref(1)
const hasMore = ref(false)
const isLoading = ref(false)

const filters = reactive({ q: '', role: '', action: '', from: '', to: '', onlyFailed: false })

const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))

const hasFilters = computed(
  () => Boolean(filters.q || filters.role || filters.action || filters.from || filters.to || filters.onlyFailed),
)

const labelOf = (action) =>
  options.value.actions.find((a) => a.code === action)?.label ?? action

const load = async () => {
  isLoading.value = true
  try {
    const result = await searchAuditLogs({
      q: filters.q || undefined,
      role: filters.role || undefined,
      action: filters.action || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      onlyFailed: filters.onlyFailed || undefined,
      page: page.value,
      pageSize: 30,
    })

    logs.value = result.items
    totalCount.value = result.totalCount
    hasMore.value = result.hasMore
  } finally {
    isLoading.value = false
  }
}

// Süzgəc dəyişəndə həmişə birinci səhifədən başlanır
let timer = null
watch(filters, () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
})

const changePage = (value) => {
  page.value = value
  load()
}

const resetFilters = () => {
  Object.assign(filters, { q: '', role: '', action: '', from: '', to: '', onlyFailed: false })
}

const toggle = (id) => {
  const next = new Set(opened.value)
  next.has(id) ? next.delete(id) : next.add(id)
  opened.value = next
}

const dateOf = (value) => formatDateFull(value.slice(0, 10))

const timeOf = (value) => {
  const d = new Date(value)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const prettyPayload = (payload) => {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2)
  } catch {
    return payload
  }
}

onMounted(async () => {
  options.value = await getAuditFilterOptions()
  await load()
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<style scoped>
.audit {
  min-height: 200px;
}

/* Süzgəclər */
.filters {
  background: #fff;
  border: 1px solid #f2ecee;
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

.filter-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1.3fr 1fr 1fr;
  gap: 12px;
}

.field label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #b8a3ab;
  margin-bottom: 5px;
}

.field input,
.field select {
  width: 100%;
  padding: 8px 11px;
  border: 1px solid #f0eaec;
  border-radius: 8px;
  font-size: 0.85rem;
  background: #fff;
  color: #212529;
}

.field input:focus,
.field select:focus {
  border-color: #dfb15b;
  outline: none;
  box-shadow: 0 0 0 3px rgba(223, 177, 91, 0.15);
}

.filter-foot {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f8f5f6;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #6c757d;
  cursor: pointer;
}

.result-count {
  margin-left: auto;
  font-size: 0.78rem;
  color: #b8a3ab;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clear-link {
  background: none;
  border: none;
  color: #c0392b;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

/* Siyahı */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-row {
  background: #fff;
  border: 1px solid #f2ecee;
  border-left: 3px solid transparent;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.15s;
}

.log-row:hover {
  border-color: #eadfe3;
}

.log-row.failed {
  border-left-color: #c0392b;
  background: #fffbfb;
}

.log-main {
  display: grid;
  grid-template-columns: 74px 150px 1fr 200px 24px;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
}

.log-time {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.log-time b {
  font-size: 0.85rem;
  color: #1a1118;
}

.log-time em {
  font-style: normal;
  font-size: 0.68rem;
  color: #c2b2b8;
}

.log-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-align: center;
  background: #f1f3f5;
  color: #868e96;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-badge.success { background: #e3f6e8; color: #1e7e34; }
.log-badge.warning { background: #fff6e0; color: #b07d2b; }
.log-badge.danger { background: #fdeaea; color: #c0392b; }
.log-badge.info { background: #eef2f7; color: #4a6fa5; }

.log-text {
  font-size: 0.87rem;
  color: #1a1118;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fail-tag {
  font-style: normal;
  font-size: 0.7rem;
  color: #c0392b;
  margin-left: 8px;
}

.log-user {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  text-align: right;
}

.log-user b {
  font-size: 0.8rem;
  color: #1a1118;
}

.role-tag {
  font-style: normal;
  font-size: 0.66rem;
  color: #b8a3ab;
}

.role-tag.superadmin { color: #1a1118; font-weight: 700; }
.role-tag.support { color: #1e7e34; }
.role-tag.owner { color: #721438; }
.role-tag.venueadmin { color: #8a6220; }

.log-toggle {
  color: #ced4da;
  font-size: 0.7rem;
  text-align: center;
}

/* Detallar */
.log-details {
  background: #faf7f8;
  border-top: 1px solid #f2ecee;
  padding: 14px 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}

.detail-grid div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-grid span {
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #c2b2b8;
  font-weight: 700;
}

.detail-grid b {
  font-size: 0.82rem;
  color: #1a1118;
  word-break: break-all;
}

.detail-error {
  margin-top: 12px;
  background: #fdeaea;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.82rem;
  color: #c0392b;
}

.detail-payload {
  margin-top: 12px;
}

.detail-label {
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #c2b2b8;
  font-weight: 700;
}

.detail-payload pre {
  margin: 6px 0 0;
  background: #fff;
  border: 1px solid #f2ecee;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.75rem;
  color: #495057;
  max-height: 220px;
  overflow: auto;
}

.detail-agent {
  margin-top: 10px;
  font-size: 0.7rem;
  color: #c2b2b8;
  word-break: break-all;
}

/* Səhifələmə */
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 18px;
}

.page-btn {
  background: #fff;
  border: 1px solid #f0eaec;
  color: #6c757d;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
}

.page-btn:hover:not(:disabled) {
  border-color: #721438;
  color: #721438;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.82rem;
  color: #868e96;
}

.empty-box {
  background: #fff;
  border-radius: 12px;
  padding: 34px 20px;
  text-align: center;
  color: #868e96;
  font-size: 0.88rem;
}

@media (max-width: 1100px) {
  .filter-row {
    grid-template-columns: 1fr 1fr;
  }
  .log-main {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .log-user,
  .log-text {
    text-align: left;
    white-space: normal;
  }
}
</style>
