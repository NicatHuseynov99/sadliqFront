<template>
  <!-- «Rədd et» əvəzinə şərt təklif etmək: tarix, zal, menyu və ya qiymət. -->
  <el-dialog :model-value="true" width="560px" class="co-dialog" :show-close="false" @close="$emit('close')">
    <template #header>
      <div class="co-head">
        <div>
          <span class="co-caption">Əks-təklif</span>
          <b>{{ reservation.customerName }}</b>
        </div>
        <button class="co-close" @click="$emit('close')">✕</button>
      </div>
    </template>

    <p class="current">
      İndiki sorğu: <b>{{ formatDate(reservation.eventDate) }}</b> ·
      {{ reservation.hallName }} · {{ reservation.menuName }} ·
      {{ reservation.guestCount }} nəfər
    </p>

    <div class="fields">
      <label>
        Yeni tarix <em>boş = dəyişmir</em>
        <input v-model="form.eventDate" type="date" :min="tomorrow" />
      </label>

      <label>
        Zal <em>boş = dəyişmir</em>
        <select v-model="form.hallId">
          <option :value="null">Dəyişmir</option>
          <option v-for="h in halls" :key="h.id" :value="h.id">
            {{ h.name }} · {{ h.capacity }} nəfər
          </option>
        </select>
      </label>

      <label>
        Menyu <em>boş = dəyişmir</em>
        <select v-model="form.menuId">
          <option :value="null">Dəyişmir</option>
          <option v-for="m in menus" :key="m.id" :value="m.id">
            {{ m.name }} · {{ m.pricePerPerson }} ₼
          </option>
        </select>
      </label>

      <label>
        Razılaşdırılmış qiymət <em>nəfər başına, istəyə bağlı</em>
        <input v-model.number="form.pricePerPerson" type="number" min="0" step="1" />
      </label>

      <label class="wide">
        Müştəriyə izah
        <textarea
          v-model="form.message"
          rows="3"
          maxlength="500"
          placeholder="Məsələn: O gün doludur, amma 19 oktyabr boşdur — eyni zal, eyni qiymət."
        ></textarea>
      </label>
    </div>

    <p v-if="changeSummary" class="summary">{{ changeSummary }}</p>
    <p v-else class="summary warn">Ən azı bir şərt dəyişməlidir.</p>

    <template #footer>
      <button class="ghost-btn" @click="$emit('close')">Bağla</button>
      <button class="gold-btn" :disabled="isSending || !changeSummary" @click="send">
        {{ isSending ? 'Göndərilir…' : 'Təklifi göndər' }}
      </button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { toast } from '@/utils/toast'
import { createCounterOffer } from '@/services/ownerService'

const props = defineProps({
  reservation: { type: Object, required: true },
  halls: { type: Array, default: () => [] },
  menus: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'sent'])

const isSending = ref(false)

const form = reactive({
  eventDate: '',
  hallId: null,
  menuId: null,
  pricePerPerson: null,
  message: '',
})

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

const formatDate = (value) => {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

// Nəyin dəyişdiyini göndərməzdən əvvəl göstəririk
const changeSummary = computed(() => {
  const parts = []

  if (form.eventDate && form.eventDate !== String(props.reservation.eventDate).slice(0, 10))
    parts.push(`tarix → ${formatDate(form.eventDate)}`)

  if (form.hallId && form.hallId !== props.reservation.hallId) {
    const hall = props.halls.find((h) => h.id === form.hallId)
    parts.push(`zal → ${hall?.name}`)
  }

  if (form.menuId && form.menuId !== props.reservation.menuId) {
    const menu = props.menus.find((m) => m.id === form.menuId)
    parts.push(`menyu → ${menu?.name}`)
  }

  if (form.pricePerPerson > 0) parts.push(`qiymət → ${form.pricePerPerson} ₼`)

  return parts.length ? `Təklif: ${parts.join(' · ')}` : ''
})

const send = async () => {
  if (form.message.trim().length < 5) {
    toast.warning('Müştəriyə qısa izah yazın.')
    return
  }

  isSending.value = true

  try {
    const message = await createCounterOffer({
      reservationId: props.reservation.id,
      eventDate: form.eventDate || null,
      hallId: form.hallId,
      menuId: form.menuId,
      pricePerPerson: form.pricePerPerson || null,
      message: form.message.trim(),
    })

    toast.success(message)
    emit('sent')
    emit('close')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Təklif göndərilmədi')
  } finally {
    isSending.value = false
  }
}
</script>

<style scoped>
:deep(.co-dialog) {
  border-radius: 16px;
}

:deep(.co-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:deep(.co-dialog .el-dialog__body) {
  padding: 14px 22px 4px;
}

:deep(.co-dialog .el-dialog__footer) {
  padding: 12px 22px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.co-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(135deg, #721438, #a02c4a);
  color: #fff;
  padding: 16px 22px;
  border-radius: 16px 16px 0 0;
}

.co-caption {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #f0d7de;
  margin-bottom: 3px;
}

.co-head b {
  font-size: 1.02rem;
}

.co-close {
  background: rgba(255, 255, 255, 0.16);
  border: none;
  color: #fff;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.72rem;
}

.current {
  margin: 0 0 14px;
  font-size: 0.78rem;
  color: #6c757d;
  background: #fbf7f8;
  border-radius: 10px;
  padding: 9px 12px;
}

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.73rem;
  color: #868e96;
}

label.wide {
  grid-column: 1 / -1;
}

label em {
  font-style: normal;
  color: #c1b3b8;
}

input,
select,
textarea {
  border: 1px solid #f0eaec;
  border-radius: 9px;
  padding: 7px 11px;
  font-size: 0.82rem;
  color: #1a1118;
  outline: none;
  font-family: inherit;
  background: #fff;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #dfb15b;
}

.summary {
  margin: 12px 0 0;
  font-size: 0.78rem;
  color: #217a41;
  background: #f2faf5;
  border-radius: 9px;
  padding: 8px 12px;
}

.summary.warn {
  color: #b06a2b;
  background: #fdf6ec;
}

.ghost-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: #721438;
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.gold-btn {
  background: linear-gradient(135deg, #721438, #a02c4a);
  border: none;
  color: #fff;
  padding: 9px 20px;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.gold-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .fields {
    grid-template-columns: 1fr;
  }
}
</style>
