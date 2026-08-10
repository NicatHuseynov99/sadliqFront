<template>
  <!-- Şikayət işinin tam görünüşü. Tərəflər və dəstək eyni komponentdən
       istifadə edir — fərq yalnız dəstəyin əlavə imkanlarındadır:
       işi götürmək, daxili qeyd yazmaq və qərar vermək. -->
  <div class="thread" v-loading="isLoading">
    <template v-if="dispute">
      <header class="th-head">
        <div>
          <b>{{ dispute.subject }}</b>
          <span class="th-sub">
            {{ dispute.categoryLabel }}
            <template v-if="dispute.venueName"> · {{ dispute.venueName }}</template>
            <template v-if="dispute.reservationId"> · rezerv #{{ dispute.reservationId }}</template>
          </span>
        </div>
        <span class="th-status" :class="statusClass(dispute.status)">{{ dispute.statusLabel }}</span>
      </header>

      <div class="th-facts">
        <span>
          <i>Açıb</i>
          {{ dispute.openedByName }} ({{ dispute.openedByCustomer ? 'müştəri' : 'saray' }})
        </span>
        <span v-if="isStaff && dispute.counterpartName">
          <i>Qarşı tərəf</i>{{ dispute.counterpartName }}
        </span>
        <span><i>Açılıb</i>{{ shortTime(dispute.createdAt) }}</span>
        <span v-if="dispute.assignedToName"><i>Baxır</i>{{ dispute.assignedToName }}</span>
      </div>

      <!-- İlk izah — işin özü -->
      <div class="th-desc">{{ dispute.description }}</div>

      <!-- Qərar verilibsə hər şeydən yuxarıda görünməlidir -->
      <div v-if="dispute.resolution" class="th-resolution">
        <b>{{ dispute.status === 2 ? '✓ Qərar' : '✕ İş bağlandı' }}</b>
        <p>{{ dispute.resolution }}</p>
        <span v-if="dispute.resolvedAt">{{ shortTime(dispute.resolvedAt) }}</span>
      </div>

      <!-- Yazışma -->
      <div class="th-messages">
        <p v-if="!dispute.messages.length" class="th-empty">Hələ mesaj yoxdur.</p>

        <div
          v-for="m in dispute.messages"
          :key="m.id"
          class="msg"
          :class="{ staff: m.isFromStaff, note: m.isInternalNote }"
        >
          <span class="who">
            {{ m.senderName }}
            <em v-if="m.isFromStaff">dəstək</em>
            <em v-if="m.isInternalNote" class="note-tag">daxili qeyd</em>
          </span>
          <div class="bubble">
            <p>{{ m.body }}</p>
            <span class="time">{{ shortTime(m.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Cavab qutusu — iş bağlanıbsa gizlənir -->
      <div v-if="!isClosed" class="th-reply">
        <textarea
          v-model="draft"
          rows="3"
          maxlength="2000"
          :placeholder="isStaff ? 'Tərəflərə cavab yazın…' : 'Dəstəyə mesaj yazın…'"
        ></textarea>

        <div class="th-reply-foot">
          <label v-if="isStaff" class="note-check">
            <input v-model="asInternalNote" type="checkbox" />
            Daxili qeyd (tərəflər görmür)
          </label>
          <span v-else></span>

          <UiButton size="sm" :is-loading="isSending" @click="send">Göndər</UiButton>
        </div>
      </div>

      <!-- Dəstəyin iş idarəsi -->
      <div v-if="isStaff && !isClosed" class="th-staff">
        <UiButton
          v-if="!dispute.assignedToName"
          variant="ghost"
          size="sm"
          @click="assign"
        >
          İşi öz üzərimə götürürəm
        </UiButton>

        <UiButton variant="ghost" size="sm" @click="askResolve(3)">Əsassız — bağla</UiButton>
        <UiButton size="sm" @click="askResolve(2)">Qərar ver və bağla</UiButton>
      </div>
    </template>

    <UiEmpty
      v-else-if="!isLoading"
      icon="⚖️"
      title="İş seçin"
      text="Siyahıdan bir şikayət seçin — tam yazışma burada görünəcək."
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { toast } from '@/utils/toast'
import UiButton from '@/components/ui/UiButton.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import {
  getDispute,
  sendDisputeMessage,
  assignDispute,
  resolveDispute,
  statusClass,
} from '@/services/disputeService'

const props = defineProps({
  disputeId: { type: Number, default: null },

  // Dəstək rejimində əlavə imkanlar açılır
  isStaff: { type: Boolean, default: false },
})

const emit = defineEmits(['changed'])

const dispute = ref(null)
const isLoading = ref(false)

const draft = ref('')
const asInternalNote = ref(false)
const isSending = ref(false)

// Həll edilmiş (2) və bağlanmış (3) işdə yazışma bağlanır
const isClosed = computed(() => dispute.value?.status === 2 || dispute.value?.status === 3)

const load = async () => {
  if (!props.disputeId) {
    dispute.value = null
    return
  }

  isLoading.value = true
  try {
    dispute.value = await getDispute(props.disputeId)
  } catch (e) {
    dispute.value = null
    toast.error(e?.userMessage ?? e?.message ?? 'Şikayət açılmadı')
  } finally {
    isLoading.value = false
  }
}

watch(() => props.disputeId, load, { immediate: true })

const send = async () => {
  const body = draft.value.trim()
  if (!body) return toast.warning('Mesaj boş ola bilməz.')

  isSending.value = true
  try {
    const message = await sendDisputeMessage(props.disputeId, body, asInternalNote.value)
    toast.success(message)
    draft.value = ''
    asInternalNote.value = false
    await load()
    emit('changed')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Mesaj göndərilmədi')
  } finally {
    isSending.value = false
  }
}

const assign = async () => {
  try {
    const message = await assignDispute(props.disputeId)
    toast.success(message)
    await load()
    emit('changed')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Əməliyyat alınmadı')
  }
}

// Qərarın izahı məcburidir — tərəflər onu görəcək
const askResolve = async (status) => {
  const isResolve = status === 2

  let resolution
  try {
    const { value } = await ElMessageBox.prompt(
      isResolve
        ? 'Qərarınızı yazın. Hər iki tərəf bunu görəcək və bildiriş alacaq.'
        : 'İşi nəyə görə əsassız sayırsınız? Tərəflər izahı görəcək.',
      isResolve ? 'Qərar ver' : 'İşi bağla',
      {
        confirmButtonText: isResolve ? 'Qərarı təsdiqlə' : 'Bağla',
        cancelButtonText: 'İmtina',
        inputType: 'textarea',
        inputPlaceholder: 'İzah (məcburi)',
        inputValidator: (v) => (v?.trim() ? true : 'İzahı yazın'),
      },
    )
    resolution = value.trim()
  } catch {
    return
  }

  try {
    const message = await resolveDispute(props.disputeId, status, resolution)
    toast.success(message)
    await load()
    emit('changed')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Əməliyyat alınmadı')
  }
}

const shortTime = (value) => {
  if (!value) return '—'

  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  const today = new Date().toDateString() === d.toDateString()

  return today
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.thread {
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  min-height: 420px;
  display: flex;
  flex-direction: column;
}

.th-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
}

.th-head b {
  display: block;
  font-size: 0.94rem;
  color: var(--ink);
}

.th-sub {
  display: block;
  font-size: 0.74rem;
  color: var(--muted);
  margin-top: 2px;
}

.th-status {
  border-radius: var(--r-pill);
  padding: 3px 11px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.th-status.open {
  background: var(--warn-soft);
  color: var(--warn);
}

.th-status.review {
  background: var(--info-soft);
  color: var(--info);
}

.th-status.resolved {
  background: var(--ok-soft);
  color: var(--ok);
}

.th-status.closed {
  background: var(--line);
  color: var(--muted);
}

.th-facts {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
}

.th-facts span {
  font-size: 0.78rem;
  color: var(--ink-2);
}

.th-facts i {
  display: block;
  font-style: normal;
  font-size: 0.66rem;
  color: var(--muted-2);
}

.th-desc {
  padding: 13px 16px;
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--ink-2);
  white-space: pre-line;
  border-bottom: 1px solid var(--line);
}

/* Qərar — işin nəticəsi, ən görünən yerdə */
.th-resolution {
  margin: 13px 16px 0;
  padding: 11px 14px;
  background: var(--ok-soft);
  border-left: 3px solid var(--ok);
  border-radius: 0 var(--r) var(--r) 0;
}

.th-resolution b {
  font-size: 0.8rem;
  color: var(--ok);
}

.th-resolution p {
  margin: 4px 0 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--ink-2);
  white-space: pre-line;
}

.th-resolution span {
  font-size: 0.68rem;
  color: var(--muted-2);
}

.th-messages {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.th-empty {
  margin: auto;
  font-size: 0.8rem;
  color: var(--muted-2);
}

.msg {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 76%;
}

/* Dəstəyin mesajı sağda — tərəflərinkindən fərqlənsin */
.msg.staff {
  align-self: flex-end;
  align-items: flex-end;
}

.who {
  font-size: 0.67rem;
  color: var(--muted-2);
  margin-bottom: 3px;
}

.who em {
  font-style: normal;
  background: var(--brand-soft);
  color: var(--brand);
  border-radius: var(--r-pill);
  padding: 1px 7px;
  margin-left: 4px;
}

.note-tag {
  background: var(--warn-soft) !important;
  color: var(--warn) !important;
}

.bubble {
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: 12px 12px 12px 4px;
  padding: 8px 12px;
}

.msg.staff .bubble {
  border-radius: 12px 12px 4px 12px;
  background: var(--brand-soft);
  border-color: #f0dde4;
}

/* Daxili qeyd — vizual olaraq dərhal seçilməlidir */
.msg.note .bubble {
  background: var(--warn-soft);
  border-color: #f0dfba;
  border-style: dashed;
}

.bubble p {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.5;
  white-space: pre-line;
  word-break: break-word;
  color: var(--ink);
}

.time {
  display: block;
  font-size: 0.65rem;
  color: var(--muted-2);
  margin-top: 4px;
  text-align: right;
}

.th-reply {
  padding: 12px 16px;
  border-top: 1px solid var(--line);
}

.th-reply textarea {
  width: 100%;
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  padding: 9px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  resize: vertical;
}

.th-reply textarea:focus {
  border-color: var(--gold);
}

.th-reply-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}

.note-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: var(--muted);
  cursor: pointer;
}

.th-staff {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
  padding: 0 16px 14px;
}
</style>
