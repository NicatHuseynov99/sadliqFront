<template>
  <section class="sender">
    <!-- Sol tərəf: mesaj və auditoriya. Sağ tərəf: kimə gedəcəyi və göndəriş. -->
    <div class="grid">
      <div class="card">
        <h4>Mesaj</h4>

        <label>
          Başlıq
          <input v-model="form.title" maxlength="120" placeholder="Məsələn: Payız endirimləri başladı" />
          <em>{{ form.title.length }}/120</em>
        </label>

        <label>
          Mətn
          <textarea
            v-model="form.body"
            rows="5"
            maxlength="2000"
            placeholder="Bildirişin mətni. Qısa və aydın yazın — uzun mətn oxunmur."
          ></textarea>
          <em>{{ form.body.length }}/2000</em>
        </label>

        <label>
          Link <em>istəyə bağlı</em>
          <input v-model="form.link" placeholder="/venues?city=Bakı" />
        </label>

        <p class="hint">🔔 Bildiriş saytda, zəng siyahısında görünəcək. E-poçt və SMS hələ işlədilmir.</p>
      </div>

      <div class="card">
        <h4>Kimə gedəcək</h4>

        <span class="field-label">Rollar <em>boş = hamısı</em></span>
        <div class="chips">
          <button
            v-for="r in ROLES"
            :key="r.value"
            type="button"
            class="chip"
            :class="{ active: form.audience.roles.includes(r.value) }"
            @click="toggleRole(r.value)"
          >
            {{ r.label }}
          </button>
        </div>

        <span class="field-label">Şəhərlər <em>boş = hamısı</em></span>
        <div class="chips">
          <button
            v-for="c in cities"
            :key="c.id ?? c.name"
            type="button"
            class="chip"
            :class="{ active: form.audience.cities.includes(c.name) }"
            @click="toggleCity(c.name)"
          >
            {{ c.name }}
          </button>
        </div>

        <label>
          Davranış
          <select v-model.number="form.audience.behavior">
            <option v-for="b in BEHAVIORS" :key="b.value" :value="b.value">
              {{ b.label }}
            </option>
          </select>
          <em>{{ behaviorHint }}</em>
        </label>

        <label v-if="form.audience.behavior !== 0">
          Dövr (gün)
          <input v-model.number="form.audience.behaviorDays" type="number" min="1" max="365" />
        </label>

        <label>
          Göndəriş vaxtı <em>boş = dərhal</em>
          <input v-model="form.scheduledAt" type="datetime-local" />
        </label>
      </div>
    </div>

    <!-- Göndərmədən əvvəl nəticə -->
    <div class="bar">
      <div class="preview">
        <button class="ghost-btn" :disabled="isChecking" @click="check">
          {{ isChecking ? 'Hesablanır…' : 'Kimə gedəcək?' }}
        </button>

        <template v-if="preview">
          <b class="count">{{ preview.count }} nəfər</b>
          <span class="summary">{{ preview.summary }}</span>
        </template>
      </div>

      <div class="actions">
        <button class="ghost-btn" :disabled="isSending" @click="test">Özümə sınaq göndər</button>
        <button class="gold-btn" :disabled="isSending || !isValid" @click="send">
          {{ isSending ? 'Göndərilir…' : form.scheduledAt ? 'Planlaşdır' : 'Göndər' }}
        </button>
      </div>
    </div>

    <p v-if="preview?.sample?.length" class="sample">
      Nümunə: {{ preview.sample.join(' · ') }}
    </p>

    <!-- Göndərilmişlərin tarixçəsi -->
    <div class="history">
      <header class="history-head">
        <h4>Göndərilmiş bildirişlər</h4>
        <select v-model="statusFilter" @change="loadHistory">
          <option v-for="s in CAMPAIGN_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </header>

      <div v-loading="isLoadingHistory" class="rows">
        <p v-if="!campaigns.length && !isLoadingHistory" class="empty">Hələ bildiriş göndərilməyib.</p>

        <article v-for="c in campaigns" :key="c.id" class="row">
          <div class="row-main">
            <div class="row-top">
              <b>{{ c.title }}</b>
              <span class="status" :class="statusClass(c.status)">{{ c.statusLabel }}</span>
            </div>
            <p class="row-body">{{ c.body }}</p>
            <span class="row-meta">
              {{ c.audienceSummary }} · {{ c.createdByName }}
              · {{ formatDate(c.sentAt ?? c.scheduledAt ?? c.createdAt) }}
            </span>
            <p v-if="c.error" class="row-error">{{ c.error }}</p>
          </div>

          <div class="row-stats">
            <div><b>{{ c.recipientCount }}</b><span>getdi</span></div>
            <div><b>{{ c.readPercent }}%</b><span>oxudu</span></div>
            <div v-if="c.link"><b>{{ c.clickPercent }}%</b><span>keçdi</span></div>
          </div>

          <button
            v-if="c.status === 1"
            class="ghost-btn small"
            @click="cancel(c)"
          >
            Ləğv et
          </button>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { toast } from '@/utils/toast'
import {
  BEHAVIORS,
  CAMPAIGN_STATUSES,
  CHANNELS,
  ROLES,
  cancelCampaign,
  previewAudience,
  searchCampaigns,
  sendCampaign,
  sendTestCampaign,
  statusClass,
} from '@/services/notificationService'
import { getCities } from '@/services/platformService'

const form = reactive({
  title: '',
  body: '',
  link: '',
  channels: CHANNELS.inApp,
  scheduledAt: '',
  audience: {
    roles: [],
    cities: [],
    behavior: 0,
    behaviorDays: 30,
  },
})

const cities = ref([])
const preview = ref(null)
const campaigns = ref([])
const statusFilter = ref('')

const isChecking = ref(false)
const isSending = ref(false)
const isLoadingHistory = ref(false)

const isValid = computed(() => form.title.trim().length >= 3 && form.body.trim().length >= 10)

const behaviorHint = computed(
  () => BEHAVIORS.find((b) => b.value === form.audience.behavior)?.hint ?? '',
)

const toggleRole = (value) => {
  const index = form.audience.roles.indexOf(value)
  index === -1 ? form.audience.roles.push(value) : form.audience.roles.splice(index, 1)
  preview.value = null
}

const toggleCity = (name) => {
  const index = form.audience.cities.indexOf(name)
  index === -1 ? form.audience.cities.push(name) : form.audience.cities.splice(index, 1)
  preview.value = null
}

const payload = () => ({
  title: form.title.trim(),
  body: form.body.trim(),
  link: form.link.trim() || null,
  channels: form.channels,
  scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
  audience: { ...form.audience, userIds: [] },
})

const check = async () => {
  isChecking.value = true

  try {
    preview.value = await previewAudience({ ...form.audience, userIds: [] })
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Auditoriya hesablanmadı')
  } finally {
    isChecking.value = false
  }
}

const send = async () => {
  // Göndəriş geri qaytarılmır — əvvəlcə neçə nəfərə gedəcəyi təsdiqlənir
  if (!preview.value) await check()

  try {
    await ElMessageBox.confirm(
      `${preview.value?.count ?? 0} nəfərə göndəriləcək. Davam edilsin?`,
      'Bildiriş göndərilsin?',
      { confirmButtonText: 'Bəli, göndər', cancelButtonText: 'Ləğv et' },
    )
  } catch {
    return
  }

  isSending.value = true

  try {
    const result = await sendCampaign(payload())
    toast.success(result.message)

    form.title = ''
    form.body = ''
    form.link = ''
    form.scheduledAt = ''
    preview.value = null

    await loadHistory()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Göndərilmədi')
  } finally {
    isSending.value = false
  }
}

const test = async () => {
  isSending.value = true

  try {
    const result = await sendTestCampaign(payload())
    toast.success(result.message)
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Sınaq göndərilmədi')
  } finally {
    isSending.value = false
  }
}

const cancel = async (campaign) => {
  const result = await cancelCampaign(campaign.id)
  toast.success(result.message)
  await loadHistory()
}

const loadHistory = async () => {
  isLoadingHistory.value = true

  try {
    const data = await searchCampaigns({ page: 1, pageSize: 20, status: statusFilter.value })
    campaigns.value = data.items
  } finally {
    isLoadingHistory.value = false
  }
}

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(async () => {
  cities.value = await getCities()
  await loadHistory()
})
</script>

<style scoped>
.sender {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.card {
  background: #fff;
  border: 1px solid #f4eef0;
  border-radius: 14px;
  padding: 18px 20px;
}

.card h4 {
  margin: 0 0 12px;
  font-size: 0.86rem;
  color: var(--ink);
}

.card h4:not(:first-child) {
  margin-top: 18px;
}

label,
.field-label {
  display: block;
  font-size: 0.74rem;
  color: var(--muted);
  margin-bottom: 12px;
}

.field-label {
  margin-bottom: 6px;
}

label em,
.field-label em {
  font-style: normal;
  color: var(--faint);
  margin-left: 5px;
}

input,
textarea,
select {
  display: block;
  width: 100%;
  margin-top: 4px;
  border: 1px solid var(--line-2);
  border-radius: 9px;
  padding: 8px 12px;
  font-size: 0.84rem;
  color: var(--ink);
  outline: none;
  font-family: inherit;
  background: #fff;
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--gold);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.chip {
  background: #fff;
  border: 1px solid var(--line-2);
  color: #6c757d;
  padding: 6px 13px;
  border-radius: 20px;
  font-size: 0.77rem;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: var(--gold);
}

.chip.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.hint {
  margin: 0;
  font-size: 0.73rem;
  color: var(--muted-2);
}

/* Göndəriş sətri */
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  background: #fff;
  border: 1px solid #f4eef0;
  border-radius: 14px;
  padding: 14px 20px;
}

.preview {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.count {
  font-size: 1.05rem;
  color: var(--brand);
}

.summary {
  font-size: 0.78rem;
  color: #6c757d;
}

.actions {
  display: flex;
  gap: 8px;
}

.sample {
  margin: -4px 4px 0;
  font-size: 0.73rem;
  color: var(--muted-2);
}

.ghost-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: var(--brand);
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.ghost-btn:hover:not(:disabled) {
  border-color: var(--gold);
}

.ghost-btn.small {
  padding: 5px 12px;
  font-size: 0.74rem;
  align-self: center;
}

.gold-btn {
  background: linear-gradient(135deg, var(--brand), var(--accent));
  border: none;
  color: #fff;
  padding: 9px 22px;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.gold-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tarixçə */
.history {
  background: #fff;
  border: 1px solid #f4eef0;
  border-radius: 14px;
  padding: 16px 20px 20px;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.history-head h4 {
  margin: 0;
  font-size: 0.86rem;
  color: var(--ink);
}

.history-head select {
  width: auto;
  margin: 0;
  font-size: 0.78rem;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 60px;
}

.row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  border: 1px solid #f6f0f2;
  border-radius: 11px;
  padding: 12px 14px;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-top b {
  font-size: 0.84rem;
  color: var(--ink);
}

.status {
  font-size: 0.68rem;
  padding: 2px 9px;
  border-radius: 20px;
  background: #f1f3f5;
  color: #6c757d;
}

.status.sent {
  background: #e5f4ea;
  color: var(--ok);
}

.status.scheduled {
  background: var(--gold-soft);
  color: var(--warn);
}

.status.failed {
  background: #f8e3e8;
  color: var(--accent);
}

.row-body {
  margin: 4px 0 5px;
  font-size: 0.77rem;
  color: #6c757d;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-meta {
  font-size: 0.7rem;
  color: #b0a2a8;
}

.row-error {
  margin: 5px 0 0;
  font-size: 0.72rem;
  color: var(--accent);
}

.row-stats {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.row-stats div {
  text-align: center;
}

.row-stats b {
  display: block;
  font-size: 0.9rem;
  color: var(--brand);
}

.row-stats span {
  font-size: 0.66rem;
  color: var(--muted-2);
}

.empty {
  text-align: center;
  font-size: 0.8rem;
  color: var(--muted-2);
  padding: 18px 0;
  margin: 0;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
