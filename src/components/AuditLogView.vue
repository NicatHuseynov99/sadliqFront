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

        <button v-if="hasFilters" class="clear-link" @click="resetFilters">Süzgəcləri təmizlə <IcoX class="ico" /></button>
      </div>
    </div>

    <!-- Jurnal siyahısı -->
    <UiEmpty v-if="!isLoading && !logs.length" icon="🗒" title="Bu şərtlərə uyğun qeyd tapılmadı." />

    <div v-for="group in grouped" :key="group.key" class="day-group">
      <div class="day-head">
        <span class="day-name">{{ group.title }}</span>
        <span class="day-line"></span>
        <span class="day-count">{{ group.items.length }} qeyd</span>
      </div>

      <div class="log-list">
      <div v-for="log in group.items" :key="log.id" class="log-row" :class="{ failed: !log.isSuccess }">
        <div class="log-main" @click="toggle(log.id)">
          <span class="log-time">
            <b>{{ timeOf(log.createdAt) }}</b>
            <em>{{ dateOf(log.createdAt) }}</em>
          </span>

          <!-- Kimin etdiyi baş hərflərlə dərhal görünür -->
          <span class="avatar" :class="(log.role ?? '').toLowerCase()">{{ initials(log.userName) }}</span>

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

          <div v-if="log.errorMessage" class="detail-error"><IcoTriangleAlert class="ico" /> {{ log.errorMessage }}</div>

          <div v-if="log.payload" class="detail-payload">
            <span class="detail-label">Göndərilən məlumat</span>
            <pre>{{ prettyPayload(log.payload) }}</pre>
          </div>

          <div class="detail-agent" v-if="log.userAgent">{{ log.userAgent }}</div>
        </div>
      </div>
      </div>
    </div>

    <!-- Səhifələmə -->
    <Pager :page="page" :page-size="30" :total="totalCount" @change="changePage" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Pager from '@/components/Pager.vue'
import { searchAuditLogs, getAuditFilterOptions, actionTone, ROLE_LABELS } from '@/services/auditService'
import { formatDateFull } from '@/utils/date'
import UiEmpty from '@/components/ui/UiEmpty.vue'

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

// Adın baş hərfləri — sətirdə kimin etdiyini tez seçmək üçün
const initials = (name) =>
  (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

// Qeydlər günlərə bölünür: «Bu gün», «Dünən», sonra tarix
const grouped = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dayTitle = (value) => {
    const d = new Date(value)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((today - d) / 86400000)

    if (diff === 0) return 'Bu gün'
    if (diff === 1) return 'Dünən'
    return formatDateFull(value.slice(0, 10))
  }

  const groups = []
  logs.value.forEach((log) => {
    const key = log.createdAt.slice(0, 10)
    const last = groups[groups.length - 1]

    if (last && last.key === key) last.items.push(log)
    else groups.push({ key, title: dayTitle(log.createdAt), items: [log] })
  })

  return groups
})

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
  border: 1px solid var(--line-2);
  border-radius: 8px;
  font-size: 0.85rem;
  background: #fff;
  color: #212529;
}

.field input:focus,
.field select:focus {
  border-color: var(--gold);
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
  grid-template-columns: 62px 32px 150px 1fr 190px 24px;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
}

/* Günlərə bölgü */
.day-group {
  margin-bottom: 20px;
}

.day-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.day-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--brand);
  background: var(--brand-soft);
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.day-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, #efe6ea, transparent);
}

.day-count {
  font-size: 0.72rem;
  color: #b8a3ab;
  white-space: nowrap;
}

/* Kimin etdiyi — baş hərflər */
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
  background: #b8a3ab;
  letter-spacing: 0.02em;
}

.avatar.superadmin {
  background: linear-gradient(135deg, var(--brand), #4a0d24);
}

.avatar.support {
  background: linear-gradient(135deg, #2f8f52, #1e7e34);
}

.avatar.owner {
  background: linear-gradient(135deg, #c08a2e, #a8721c);
}

.avatar.venueadmin {
  background: linear-gradient(135deg, #3f7fc0, #2b5f95);
}

.avatar.customer {
  background: linear-gradient(135deg, #9a8f95, #7d7379);
}

.log-time {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.log-time b {
  font-size: 0.85rem;
  color: var(--ink);
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
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-badge.success { background: #e3f6e8; color: #1e7e34; }
.log-badge.warning { background: #fff6e0; color: #b07d2b; }
.log-badge.danger { background: var(--danger-soft); color: #c0392b; }
.log-badge.info { background: #eef2f7; color: #4a6fa5; }

.log-text {
  font-size: 0.87rem;
  color: var(--ink);
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
  color: var(--ink);
}

.role-tag {
  font-style: normal;
  font-size: 0.66rem;
  color: #b8a3ab;
}

.role-tag.superadmin { color: var(--ink); font-weight: 700; }
.role-tag.support { color: #1e7e34; }
.role-tag.owner { color: var(--brand); }
.role-tag.venueadmin { color: #8a6220; }

.log-toggle {
  color: #ced4da;
  font-size: 0.7rem;
  text-align: center;
}

/* Detallar */
.log-details {
  background: var(--bg);
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
  color: var(--ink);
  word-break: break-all;
}

.detail-error {
  margin-top: 12px;
  background: var(--danger-soft);
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
  border: 1px solid var(--line-2);
  color: #6c757d;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--brand);
  color: var(--brand);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.82rem;
  color: var(--muted);
}

.empty-box {
  background: #fff;
  border-radius: 12px;
  padding: 34px 20px;
  text-align: center;
  color: var(--muted);
  font-size: 0.88rem;
}

@media (max-width: 1100px) {
  .filter-row {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  }
  /* Əvvəl 5 sahə (vaxt, işarə, nişan, mətn, istifadəçi, ox) tək sütunda
     alt-alta 5 ayrı sətrə düşürdü — qruplaşma itirdi, oxumaq çətinləşirdi.
     İndi iki sıra: yuxarıda vaxt + nişan + ox eyni sətirdə, altında
     mətn və istifadəçi tam enində. */
  .log-main {
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      'time badge toggle'
      'text text text'
      'user user user';
    gap: 4px 10px;
  }
  .avatar {
    display: none;
  }
  .log-time {
    grid-area: time;
  }
  .log-badge {
    grid-area: badge;
    justify-self: start;
  }
  .log-toggle {
    grid-area: toggle;
  }
  .log-text {
    grid-area: text;
    text-align: left;
    white-space: normal;
  }
  .log-user {
    grid-area: user;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    text-align: left;
  }
  .role-tag {
    margin-left: 0 !important;
  }
}
</style>
