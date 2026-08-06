<template>
  <!-- Təklif üzrə yazışma. Hər iki tərəf eyni komponentdən istifadə edir —
       fərq yalnız mesajın hansı tərəfə düzülməsindədir. -->
  <el-dialog :model-value="true" width="540px" class="chat-dialog" :show-close="false" @close="$emit('close')">
    <template #header>
      <div class="ch-head">
        <div>
          <span class="ch-caption">Yazışma</span>
          <b>{{ title }}</b>
          <span class="ch-sub">{{ subtitle }}</span>
        </div>
        <button class="ch-close" @click="$emit('close')">✕</button>
      </div>
    </template>

    <div ref="listEl" v-loading="isLoading" class="ch-body">
      <p v-if="!messages.length && !isLoading" class="ch-empty">
        Hələ mesaj yoxdur. İlk sualı siz yazın — qiymətə nə daxildir, tarix dəyişə bilərmi…
      </p>

      <div
        v-for="m in messages"
        :key="m.id"
        class="msg"
        :class="{ mine: m.isFromCustomer === isCustomer }"
      >
        <div class="bubble">
          <p>{{ m.body }}</p>
          <span class="time">{{ time(m.createdAt) }}</span>
        </div>
        <span class="who">{{ m.senderName }}</span>
      </div>
    </div>

    <template #footer>
      <textarea
        v-model="draft"
        rows="2"
        maxlength="1000"
        placeholder="Mesajınızı yazın…"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <button class="gold-btn" :disabled="isSending || !draft.trim()" @click="send">
        {{ isSending ? '…' : 'Göndər' }}
      </button>
    </template>
  </el-dialog>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { toast } from '@/utils/toast'
import { getMessages, sendMessage } from '@/services/venueRequestService'

const props = defineProps({
  offerId: { type: Number, required: true },
  // Yazışmanı müştəri açıb, yoxsa saray tərəfi
  isCustomer: { type: Boolean, default: false },
  title: { type: String, default: 'Söhbət' },
  subtitle: { type: String, default: '' },
})

defineEmits(['close'])

const messages = ref([])
const draft = ref('')
const isLoading = ref(false)
const isSending = ref(false)
const listEl = ref(null)

let timer = null

const scrollDown = async () => {
  await nextTick()
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
}

const load = async (silent = false) => {
  if (!silent) isLoading.value = true

  try {
    const data = await getMessages(props.offerId)

    // Yeni mesaj gəlibsə siyahını yenilə və aşağı sürüşdür
    if (data.length !== messages.value.length) {
      messages.value = data
      await scrollDown()
    } else {
      messages.value = data
    }
  } catch (e) {
    if (!silent) toast.error(e?.userMessage ?? e?.message ?? 'Yazışma açılmadı')
  } finally {
    isLoading.value = false
  }
}

const send = async () => {
  const body = draft.value.trim()
  if (!body) return

  isSending.value = true

  try {
    const message = await sendMessage(props.offerId, body)
    messages.value.push(message)
    draft.value = ''
    await scrollDown()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Mesaj göndərilmədi')
  } finally {
    isSending.value = false
  }
}

const time = (value) => {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  const today = new Date().toDateString() === d.toDateString()

  return today
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  load()
  // Söhbət açıq olduqca yeni mesajlar özü gəlir
  timer = setInterval(() => load(true), 15000)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
:deep(.chat-dialog) {
  border-radius: 16px;
}

:deep(.chat-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:deep(.chat-dialog .el-dialog__body) {
  padding: 0;
}

:deep(.chat-dialog .el-dialog__footer) {
  padding: 12px 18px 16px;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  border-top: 1px solid #f4eef0;
}

.ch-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff;
  padding: 14px 20px;
  border-radius: 16px 16px 0 0;
}

.ch-caption {
  display: block;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #f0d7de;
}

.ch-head b {
  display: block;
  font-size: 0.98rem;
  margin-top: 2px;
}

.ch-sub {
  display: block;
  font-size: 0.74rem;
  color: #eccdd6;
  margin-top: 2px;
}

.ch-close {
  background: rgba(255, 255, 255, 0.16);
  border: none;
  color: #fff;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.72rem;
}

.ch-body {
  height: 340px;
  overflow-y: auto;
  padding: 16px 18px;
  background: #fbf8f9;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ch-empty {
  margin: auto;
  text-align: center;
  font-size: 0.8rem;
  color: var(--muted-2);
  line-height: 1.6;
  max-width: 320px;
}

.msg {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 78%;
}

.msg.mine {
  align-self: flex-end;
  align-items: flex-end;
}

.bubble {
  background: #fff;
  border: 1px solid var(--line-2);
  border-radius: 12px 12px 12px 4px;
  padding: 8px 12px;
}

.msg.mine .bubble {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
  border-radius: 12px 12px 4px 12px;
}

.bubble p {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.5;
  white-space: pre-line;
  word-break: break-word;
}

.time {
  display: block;
  font-size: 0.66rem;
  color: #b0a2a8;
  margin-top: 3px;
  text-align: right;
}

.msg.mine .time {
  color: #e3c9d2;
}

.who {
  font-size: 0.68rem;
  color: #b0a2a8;
  margin-top: 3px;
}

textarea {
  flex: 1;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 0.84rem;
  font-family: inherit;
  outline: none;
  resize: none;
}

textarea:focus {
  border-color: var(--gold);
}

.gold-btn {
  background: linear-gradient(135deg, var(--brand), var(--accent));
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.83rem;
  font-weight: 700;
  cursor: pointer;
}

.gold-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
