<template>
  <!-- Müştərilərin paylaşdığı sorğular: boş qalan tarixi satmaq imkanı. -->
  <div class="open-requests" v-loading="isLoading">
    <UiEmpty v-if="!isLoading && !requests.length" icon="📣" title="Hazırda saraylarınıza uyğun açıq sorğu yoxdur.
      Yeni sorğu düşəndə bildiriş alacaqsınız." />

    <article v-for="r in requests" :key="r.id" class="req">
      <header class="req-head">
        <div>
          <b>{{ r.city }} · {{ r.guestCount }} qonaq</b>
          <span class="meta">
            {{ r.isDateFlexible ? '📅 tarix çevikdir' : `📅 ${formatDate(r.eventDate)}` }}
            <template v-if="r.budgetPerPerson"> · 💰 {{ r.budgetPerPerson }} ₼ / nəfər</template>
            <template v-if="r.needsParking"> · 🅿 parkinq lazımdır</template>
          </span>
        </div>

        <div class="head-right">
          <span class="rivals" :class="{ hot: r.offerCount >= 3 }">
            {{ r.offerCount }} təklif var
          </span>
          <span class="left-days">{{ daysLeft(r.expiresAt) }}</span>
        </div>
      </header>

      <p v-if="r.note" class="note">💬 {{ r.note }}</p>

      <!-- Artıq təklif göndərilmiş saraylar ayrıca göstərilir -->
      <div class="venues">
        <div v-for="v in r.matchingVenues" :key="v.venueId" class="venue-row">
          <div class="venue-name">
            <b>{{ v.venueName }}</b>
            <span v-if="r.offeredVenueIds.includes(v.venueId)" class="sent-tag">təklif göndərilib</span>
          </div>

          <button class="offer-btn" @click="open(r, v)">
            {{ r.offeredVenueIds.includes(v.venueId) ? 'Təklifi dəyiş' : 'Təklif göndər' }}
          </button>
        </div>
      </div>
    </article>

    <!-- Təklif pəncərəsi -->
    <el-dialog v-model="isDialogOpen" width="520px" class="offer-dialog" :show-close="false">
      <template #header>
        <div class="dlg-head">
          <div>
            <span class="dlg-caption">Təklif göndərilir</span>
            <b>{{ current.venue?.venueName }}</b>
          </div>
          <button class="dlg-close" @click="isDialogOpen = false">✕</button>
        </div>
      </template>

      <p class="dlg-req">
        {{ current.request?.city }} · {{ current.request?.guestCount }} qonaq ·
        {{ current.request?.isDateFlexible ? 'tarix çevikdir' : formatDate(current.request?.eventDate) }}
        <template v-if="current.request?.budgetPerPerson">
          · büdcə {{ current.request.budgetPerPerson }} ₼ / nəfər
        </template>
      </p>

      <div class="dlg-grid">
        <label>
          Zal
          <select v-model.number="offer.hallId">
            <option v-for="h in current.venue?.halls ?? []" :key="h.id" :value="h.id">
              {{ h.name }} · {{ h.capacity }} nəfər
            </option>
          </select>
        </label>

        <label>
          Menyu
          <select v-model.number="offer.menuId" @change="syncPrice">
            <option v-for="m in current.venue?.menus ?? []" :key="m.id" :value="m.id">
              {{ m.name }} · {{ m.pricePerPerson }} ₼
            </option>
          </select>
        </label>

        <label>
          Tarix
          <input
            v-model="offer.eventDate"
            type="date"
            :min="tomorrow"
            :disabled="!current.request?.isDateFlexible"
          />
          <em v-if="!current.request?.isDateFlexible">müştəri konkret tarix göstərib</em>
        </label>

        <label>
          Nəfər başına qiymət
          <input v-model.number="offer.pricePerPerson" type="number" min="1" />
          <em v-if="total">cəmi {{ total.toLocaleString() }} ₼</em>
        </label>

        <label class="wide">
          Müştəriyə təqdimat
          <textarea
            v-model="offer.message"
            rows="3"
            maxlength="500"
            placeholder="Niyə məhz sizin saray? Nə daxildir — musiqi, tort, bəzək, parkinq…"
          ></textarea>
        </label>
      </div>

      <p v-if="budgetWarning" class="warn">{{ budgetWarning }}</p>

      <template #footer>
        <button class="ghost-btn" @click="isDialogOpen = false">Bağla</button>
        <button class="gold-btn" :disabled="isSending || !isValid" @click="send">
          {{ isSending ? 'Göndərilir…' : 'Təklifi göndər' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from '@/utils/toast'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import { getOpenRequests, sendOffer } from '@/services/venueRequestService'

const isLoading = ref(false)
const isSending = ref(false)
const isDialogOpen = ref(false)
const requests = ref([])

const current = reactive({ request: null, venue: null })

const offer = reactive({
  hallId: null,
  menuId: null,
  eventDate: '',
  pricePerPerson: null,
  message: '',
})

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const daysLeft = (expiresAt) => {
  const hours = Math.round((new Date(expiresAt) - Date.now()) / 3600000)
  if (hours <= 0) return 'vaxtı bitib'
  if (hours < 24) return `${hours} saat qaldı`
  return `${Math.round(hours / 24)} gün qaldı`
}

const total = computed(() =>
  offer.pricePerPerson && current.request ? offer.pricePerPerson * current.request.guestCount : 0,
)

// Büdcədən yuxarı təklif göndərmək olar, amma sahib bunu bilməlidir
const budgetWarning = computed(() => {
  const budget = current.request?.budgetPerPerson
  if (!budget || !offer.pricePerPerson) return ''

  if (offer.pricePerPerson > budget)
    return `Müştərinin büdcəsi ${budget} ₼-dır — təklifiniz ondan bahadır.`

  return ''
})

const isValid = computed(
  () =>
    offer.hallId &&
    offer.menuId &&
    offer.eventDate &&
    offer.pricePerPerson > 0 &&
    offer.message.trim().length >= 10,
)

const load = async () => {
  isLoading.value = true
  try {
    requests.value = await getOpenRequests()
  } finally {
    isLoading.value = false
  }
}

const open = (request, venue) => {
  current.request = request
  current.venue = venue

  offer.hallId = venue.halls[0]?.id ?? null
  offer.menuId = venue.menus[0]?.id ?? null
  offer.eventDate = request.isDateFlexible ? '' : String(request.eventDate).slice(0, 10)
  offer.message = ''
  syncPrice()

  isDialogOpen.value = true
}

// Menyu seçiləndə qiymət ondan götürülür — sahib istəsə dəyişir
const syncPrice = () => {
  const menu = current.venue?.menus?.find((m) => m.id === offer.menuId)
  offer.pricePerPerson = menu?.pricePerPerson ?? null
}

const send = async () => {
  isSending.value = true

  try {
    const message = await sendOffer({
      requestId: current.request.id,
      venueId: current.venue.venueId,
      hallId: offer.hallId,
      menuId: offer.menuId,
      eventDate: offer.eventDate,
      pricePerPerson: offer.pricePerPerson,
      message: offer.message.trim(),
    })

    toast.success(message)
    isDialogOpen.value = false
    await load()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Təklif göndərilmədi')
  } finally {
    isSending.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.open-requests {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}

.req {
  background: #fff;
  border: 1px solid var(--line);
  border-left: 4px solid var(--gold);
  border-radius: 13px;
  padding: 15px 18px 16px;
}

.req-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.req-head b {
  font-size: 0.95rem;
  color: var(--ink);
}

.meta {
  display: block;
  font-size: 0.79rem;
  color: var(--muted);
  margin-top: 3px;
}

.head-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rivals {
  font-size: 0.72rem;
  background: #f1f3f5;
  color: #6c757d;
  padding: 3px 11px;
  border-radius: 20px;
}

/* Rəqabət artdıqca tez cavab vermək lazımdır */
.rivals.hot {
  background: #fdecec;
  color: var(--accent);
}

.left-days {
  font-size: 0.72rem;
  color: var(--warn);
}

.note {
  margin: 9px 0 0;
  font-size: 0.8rem;
  color: #6c757d;
}

.venues {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.venue-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #fbf8f9;
  border-radius: 10px;
  padding: 9px 13px;
}

.venue-name b {
  font-size: 0.84rem;
  color: var(--ink);
}

.sent-tag {
  margin-left: 8px;
  font-size: 0.7rem;
  background: #e5f4ea;
  color: var(--ok);
  padding: 2px 9px;
  border-radius: 20px;
}

.offer-btn {
  background: #fff;
  border: 1px solid #cfdcec;
  color: var(--info);
  padding: 6px 15px;
  border-radius: 8px;
  font-size: 0.79rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.offer-btn:hover {
  background: #f4f8fd;
  border-color: var(--info);
}

.empty-box {
  background: #fff;
  border: 1px dashed #eadfe3;
  border-radius: 14px;
  padding: 30px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted-2);
  line-height: 1.6;
}

/* Pəncərə */
:deep(.offer-dialog) {
  border-radius: 16px;
}

:deep(.offer-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:deep(.offer-dialog .el-dialog__body) {
  padding: 14px 22px 4px;
}

:deep(.offer-dialog .el-dialog__footer) {
  padding: 12px 22px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dlg-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff;
  padding: 15px 22px;
  border-radius: 16px 16px 0 0;
}

.dlg-caption {
  display: block;
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #f0d7de;
  margin-bottom: 3px;
}

.dlg-head b {
  font-size: 1rem;
}

.dlg-close {
  background: rgba(255, 255, 255, 0.16);
  border: none;
  color: #fff;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.72rem;
}

.dlg-req {
  margin: 0 0 13px;
  font-size: 0.79rem;
  color: #6c757d;
  background: #fbf7f8;
  border-radius: 10px;
  padding: 9px 12px;
}

.dlg-grid {
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
  color: var(--muted-2);
  font-size: 0.71rem;
}

input,
select,
textarea {
  border: 1px solid var(--line-2);
  border-radius: 9px;
  padding: 7px 11px;
  font-size: 0.83rem;
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

input:disabled {
  background: #f8f5f6;
  color: var(--muted);
}

.warn {
  margin: 11px 0 0;
  font-size: 0.78rem;
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: 9px;
  padding: 8px 12px;
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
  .dlg-grid {
    grid-template-columns: 1fr;
  }
}
</style>
