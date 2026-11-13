<template>
  <!-- «Rədd et» əvəzinə şərt təklif etmək: tarix, zal, menyu və ya qiymət. -->
  <el-dialog :model-value="true" width="560px" class="co-dialog" :show-close="false" @close="$emit('close')">
    <template #header>
      <div class="co-head">
        <div>
          <span class="co-caption">{{ isCustomer ? 'Şərt təklif et' : 'Əks-təklif' }}</span>
          <b>{{ isCustomer ? reservation.venueName : reservation.customerName }}</b>
        </div>
        <button class="co-close" @click="$emit('close')"><IcoX class="ico" /></button>
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

      <label v-if="!isCustomer">
        Zal <em>boş = dəyişmir</em>
        <select v-model="form.hallId">
          <option :value="null">Dəyişmir</option>
          <option v-for="h in halls" :key="h.id" :value="h.id">
            {{ h.name }} · {{ h.capacity }} nəfər
          </option>
        </select>
      </label>

      <label v-if="!isCustomer">
        Menyu <em>boş = dəyişmir</em>
        <select v-model="form.menuId">
          <option :value="null">Dəyişmir</option>
          <option v-for="m in menus" :key="m.id" :value="m.id">
            {{ m.name }} · {{ m.pricePerPerson }} ₼
          </option>
        </select>
      </label>

      <label>
        {{ isCustomer ? 'Təklif etdiyiniz qiymət' : 'Razılaşdırılmış qiymət' }}
        <em>nəfər başına, istəyə bağlı</em>
        <input v-model.number="form.pricePerPerson" type="number" min="0" step="1" />
      </label>

      <label class="wide">
        {{ isCustomer ? 'Saraya izah' : 'Müştəriyə izah' }}
        <textarea
          v-model="form.message"
          rows="3"
          maxlength="500"
          :placeholder="isCustomer
            ? 'Məsələn: Tarix uyğundur, amma nəfər başı 55 ₼ bizim üçün yüksəkdir — 48 ₼ olar?'
            : 'Məsələn: O gün doludur, amma 19 oktyabr boşdur — eyni zal, eyni qiymət.'"
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
import { createCustomerCounterOffer } from '@/services/reservationService'

const props = defineProps({
  reservation: { type: Object, required: true },
  halls: { type: Array, default: () => [] },
  menus: { type: Array, default: () => [] },

  // Danışıq iki tərəflidir: eyni forma həm sarayın, həm müştərinin
  // təklifi üçün işlədilir. Müştəri zal/menyu siyahısına malik olmadığı
  // üçün ona yalnız tarix, qiymət və izah göstərilir.
  mode: { type: String, default: 'owner' }, // owner | customer
})

const isCustomer = computed(() => props.mode === 'customer')

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
    toast.warning(isCustomer.value ? 'Saraya qısa izah yazın.' : 'Müştəriyə qısa izah yazın.')
    return
  }

  isSending.value = true

  try {
    const payload = {
      reservationId: props.reservation.id,
      eventDate: form.eventDate || null,
      hallId: form.hallId,
      menuId: form.menuId,
      pricePerPerson: form.pricePerPerson || null,
      message: form.message.trim(),
    }

    const message = isCustomer.value
      ? await createCustomerCounterOffer(payload)
      : await createCounterOffer(payload)

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
  background: linear-gradient(135deg, var(--brand), var(--accent));
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
  color: var(--muted);
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
  color: var(--muted);
}

label.wide {
  grid-column: 1 / -1;
}

label em {
  font-style: normal;
  color: var(--faint);
}

input,
select,
textarea {
  border: 1px solid var(--line-2);
  border-radius: 9px;
  padding: 7px 11px;
  font-size: 0.82rem;
  color: var(--ink);
  outline: none;
  font-family: inherit;
  background: #fff;
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--gold);
}

.summary {
  margin: 12px 0 0;
  font-size: 0.78rem;
  color: var(--ok);
  background: #f2faf5;
  border-radius: 9px;
  padding: 8px 12px;
}

.summary.warn {
  color: var(--warn);
  background: var(--warn-soft);
}

.ghost-btn {
  background: #fff;
  border: 1px solid var(--line);
  color: var(--brand);
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.gold-btn {
  background: linear-gradient(135deg, var(--brand), var(--accent));
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
