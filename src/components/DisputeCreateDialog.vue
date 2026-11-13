<template>
  <!-- Şikayət açma. Rezervdən çağırılırsa saray avtomatik təyin olunur. -->
  <el-dialog :model-value="true" width="520px" class="dc-dialog" :show-close="false" @close="$emit('close')">
    <template #header>
      <div class="dc-head">
        <div>
          <span class="dc-caption">Şikayət</span>
          <b>{{ contextLabel }}</b>
        </div>
        <button class="dc-close" @click="$emit('close')"><IcoX class="ico" /></button>
      </div>
    </template>

    <p class="dc-note">
      Şikayət platformanın dəstək xidmətinə gedir. Hər iki tərəf işi görür və
      izahını yaza bilir — qərarı dəstək verir və səbəbi yazılı qalır.
    </p>

    <label class="dc-field">
      Mövzu nədir?
      <div class="dc-chips">
        <button
          v-for="c in DISPUTE_CATEGORIES"
          :key="c.value"
          class="dc-chip"
          :class="{ active: form.category === c.value }"
          @click="form.category = c.value"
        >
          {{ c.label }}
        </button>
      </div>
    </label>

    <label class="dc-field">
      Başlıq
      <input v-model="form.subject" maxlength="120" placeholder="Qısa: nə baş verib?" />
    </label>

    <label class="dc-field">
      Ətraflı izah
      <textarea
        v-model="form.description"
        rows="5"
        maxlength="2000"
        placeholder="Nə vaxt, nə baş verdi, nə gözləyirdiniz? Dəstək qərar verə bilmək üçün detala ehtiyac duyur."
      ></textarea>
      <em :class="{ warn: form.description.trim().length < 20 }">
        {{ form.description.trim().length }} / ən azı 20 simvol
      </em>
    </label>

    <template #footer>
      <UiButton variant="ghost" @click="$emit('close')">İmtina</UiButton>
      <UiButton :is-loading="isSending" :disabled="!canSend" @click="send">
        Şikayəti göndər
      </UiButton>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { toast } from '@/utils/toast'
import UiButton from '@/components/ui/UiButton.vue'
import { createDispute, DISPUTE_CATEGORIES } from '@/services/disputeService'

const props = defineProps({
  // Rezerv üzrə şikayət — saray ondan çıxarılır
  reservationId: { type: Number, default: null },

  // Və ya birbaşa saray üzrə
  venueId: { type: Number, default: null },

  // Başlıqda göstərilən kontekst
  contextLabel: { type: String, default: 'Yeni şikayət' },

  // Şikayəti kim açır — kateqoriyanın ilkin seçimi buna görə dəyişir
  isCustomer: { type: Boolean, default: true },
})

const emit = defineEmits(['close', 'created'])

const isSending = ref(false)

const form = reactive({
  // Müştəri adətən saraydan, saray müştəridən şikayət edir
  category: props.reservationId ? 0 : props.isCustomer ? 1 : 2,
  subject: '',
  description: '',
})

const canSend = computed(
  () => form.subject.trim().length > 0 && form.description.trim().length >= 20,
)

const send = async () => {
  if (!canSend.value) return

  isSending.value = true
  try {
    const { message } = await createDispute({
      category: form.category,
      subject: form.subject.trim(),
      description: form.description.trim(),
      reservationId: props.reservationId,
      venueId: props.venueId,
    })

    toast.success(message)
    emit('created')
    emit('close')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Şikayət göndərilmədi')
  } finally {
    isSending.value = false
  }
}
</script>

<!-- EP-nin daxili sinifləri: scoped deyil, yalnız .dc-dialog ilə məhdud.
     .el-dialog-un padding: 16px-i sıfırlanır ki, başlıq tam enə yayılsın. -->
<style>
.dc-dialog {
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
}

.dc-dialog .el-dialog__header {
  padding: 0;
  margin: 0;
}

.dc-dialog .el-dialog__body {
  padding: 18px 20px 6px;
}

.dc-dialog .el-dialog__footer {
  padding: 8px 20px 18px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
</style>

<style scoped>

.dc-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff;
  padding: 14px 20px;
  border-radius: 16px 16px 0 0;
}

.dc-caption {
  display: block;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #f0d7de;
}

.dc-head b {
  display: block;
  font-size: 0.96rem;
  margin-top: 2px;
}

.dc-close {
  background: rgba(255, 255, 255, 0.16);
  border: none;
  color: #fff;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.72rem;
}

.dc-note {
  margin: 0 0 16px;
  font-size: 0.79rem;
  color: var(--muted);
  line-height: 1.6;
}

.dc-field {
  display: block;
  margin-bottom: 14px;
  font-size: 0.8rem;
  color: var(--ink-2);
  font-weight: 600;
}

.dc-field input,
.dc-field textarea {
  width: 100%;
  margin-top: 5px;
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  padding: 9px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  font-weight: 400;
  outline: none;
  resize: vertical;
}

.dc-field input:focus,
.dc-field textarea:focus {
  border-color: var(--gold);
}

.dc-field em {
  display: block;
  margin-top: 4px;
  font-style: normal;
  font-size: 0.7rem;
  color: var(--muted-2);
  font-weight: 400;
}

.dc-field em.warn {
  color: var(--warn);
}

.dc-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.dc-chip {
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--r-pill);
  padding: 5px 13px;
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--ink-2);
  cursor: pointer;
  transition: all var(--t-fast);
}

.dc-chip:hover {
  border-color: var(--gold);
}

.dc-chip.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}
</style>
