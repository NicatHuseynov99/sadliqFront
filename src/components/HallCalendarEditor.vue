<template>
  <div class="editor" v-loading="isLoading">
    <div class="cal-head">
      <button class="nav-btn" :disabled="!canGoBack" @click="shiftMonth(-1)">‹</button>
      <span class="cal-title">{{ monthLabel }}</span>
      <button class="nav-btn" @click="shiftMonth(1)">›</button>
    </div>

    <div class="week-days">
      <span v-for="(d, i) in weekDays" :key="d" :class="{ weekend: i >= 5 }">{{ d }}</span>
    </div>

    <div class="days">
      <span v-for="n in leadingBlanks" :key="`b${n}`" class="day blank"></span>
      <button
        v-for="d in days"
        :key="d.key"
        class="day"
        :class="[d.state, { weekend: d.isWeekend }]"
        :disabled="d.state === 'past' || d.state === 'held'"
        :title="dayTitle(d)"
        @click="toggleDay(d)"
      >
        {{ d.number }}
      </button>
    </div>

    <div class="legend">
      <span><i class="dot free"></i> Açıq</span>
      <span><i class="dot blocked"></i> Bağlı</span>
      <span><i class="dot held"></i> Rezerv</span>
    </div>

    <p class="hint">
      Boş günə klikləyib bağlaya, bağlı günə klikləyib yenidən aça bilərsiniz.
      Rezervlə tutulmuş günlər buradan dəyişdirilmir — sorğunu rədd etmək lazımdır.
    </p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { toast } from '@/utils/toast'
import { toDateKey } from '@/services/venueService'
import { setHallDayStatus } from '@/services/ownerService'
import { WEEKDAYS_SHORT, formatMonthTitle, formatDateFull } from '@/utils/date'
import api from '@/services/api'

const props = defineProps({
  hallId: { type: Number, required: true },
})

const weekDays = WEEKDAYS_SHORT
const isLoading = ref(false)

// Status: 0 = Boş, 1 = Sahib tərəfindən bağlı, 2 = Rezervlə tutulub
const statuses = ref({})

const today = new Date()
today.setHours(0, 0, 0, 0)

const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

// Zalın bütün gün statuslarını yükləyir
const load = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get(`/Halls/GetAvailability/${props.hallId}`)
    statuses.value = Object.fromEntries((data.data ?? []).map((a) => [a.date, a.status]))
  } finally {
    isLoading.value = false
  }
}

watch(() => props.hallId, load, { immediate: true })

const monthLabel = computed(() => formatMonthTitle(viewYear.value, viewMonth.value))

const canGoBack = computed(
  () => viewYear.value > today.getFullYear() ||
    (viewYear.value === today.getFullYear() && viewMonth.value > today.getMonth()),
)

const shiftMonth = (step) => {
  const d = new Date(viewYear.value, viewMonth.value + step, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

const leadingBlanks = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  return (firstDay + 6) % 7
})

const days = computed(() => {
  const total = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const result = []

  for (let n = 1; n <= total; n++) {
    const date = new Date(viewYear.value, viewMonth.value, n)
    const key = toDateKey(date)
    const weekday = date.getDay()
    const status = statuses.value[key] ?? 0

    let state = 'free'
    if (date <= today) state = 'past'
    else if (status === 1) state = 'blocked'
    else if (status === 2) state = 'held'

    result.push({
      number: n,
      key,
      state,
      isWeekend: weekday === 0 || weekday === 6,
    })
  }

  return result
})

// Açıq günü bağlayır, bağlı günü yenidən açır
const toggleDay = async (day) => {
  const newStatus = day.state === 'blocked' ? 0 : 1

  isLoading.value = true
  try {
    await setHallDayStatus(props.hallId, day.key, newStatus)
    statuses.value = { ...statuses.value, [day.key]: newStatus }
    toast.success(formatDateFull(day.key), newStatus === 1 ? 'Gün bağlandı' : 'Gün açıldı')
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  } finally {
    isLoading.value = false
  }
}

const dayTitle = (d) =>
  ({
    free: `${formatDateFull(d.key)} — açıqdır, bağlamaq üçün klikləyin`,
    blocked: `${formatDateFull(d.key)} — bağlıdır, açmaq üçün klikləyin`,
    held: `${formatDateFull(d.key)} — rezervlə tutulub`,
    past: 'Keçmiş tarix',
  })[d.state]
</script>

<style scoped>
.editor {
  background: #fff;
  border: 1px solid #efe9eb;
  border-radius: 14px;
  padding: 16px 18px 14px;
}

.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.cal-title {
  font-weight: 700;
  color: var(--ink);
  text-transform: capitalize;
}

.nav-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #f0e6ea;
  background: #fff;
  color: var(--brand);
  font-size: 1.1rem;
  cursor: pointer;
  line-height: 1;
}

.nav-btn:hover:not(:disabled) {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.nav-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.week-days,
.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.week-days {
  margin-bottom: 7px;
}

.week-days span {
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: #ced4da;
  text-transform: uppercase;
}

.week-days span.weekend {
  color: #b07d2b;
}

.day {
  aspect-ratio: 1;
  border: 1px solid transparent;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  display: grid;
  place-items: center;
  cursor: pointer;
  background: #fff;
  transition: all 0.15s;
}

.day.blank {
  background: transparent;
  cursor: default;
}

.day.free {
  border-color: var(--line-2);
  color: var(--ink);
}

.day.free:hover {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}

.day.free.weekend {
  background: #fdf6e9;
  border-color: #f2e3c6;
  color: #8a6220;
}

.day.blocked {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}

.day.blocked:hover {
  background: #3a2430;
}

.day.held {
  background: var(--brand-soft);
  border-color: #e8cdd8;
  color: var(--brand);
  cursor: not-allowed;
}

.day.past {
  color: #e9ecef;
  cursor: default;
}

.legend {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f5f1f2;
  font-size: 0.75rem;
  color: var(--muted);
}

.legend span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 11px;
  height: 11px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid transparent;
}

.dot.free { background: #fff; border-color: #e5dcdf; }
.dot.blocked { background: var(--ink); }
.dot.held { background: var(--brand-soft); border-color: #e8cdd8; }

.hint {
  margin: 10px 0 0;
  font-size: 0.75rem;
  color: #adb5bd;
  line-height: 1.5;
}
</style>
