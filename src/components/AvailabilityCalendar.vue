<template>
  <div class="calendar">
    <div class="cal-head">
      <button class="nav-btn" :disabled="!canGoBack" @click="shiftMonth(-1)">‹</button>
      <span class="cal-title">{{ monthLabel }}</span>
      <button class="nav-btn" @click="shiftMonth(1)">›</button>
    </div>

    <!-- Ayın doluluq göstəricisi -->
    <div class="occupancy">
      <div class="occ-bar">
        <span class="occ-fill" :style="{ width: occupancy + '%' }"></span>
      </div>
      <span class="occ-text">
        <b>{{ freeCount }}</b> boş · <b>{{ busyCount }}</b> dolu
      </span>
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
        :class="[d.status, { weekend: d.isWeekend, today: d.isToday }]"
        :disabled="d.status !== 'free'"
        :title="dayTitle(d)"
        @click="$emit('select', d.key)"
      >
        {{ d.number }}
      </button>
    </div>

    <div class="legend">
      <span><i class="dot free"></i> Boş</span>
      <span><i class="dot weekend"></i> Həftə sonu</span>
      <span><i class="dot busy"></i> Dolu</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { toDateKey } from '@/services/venueService'
import { WEEKDAYS_SHORT, formatMonthTitle, formatDateFull } from '@/utils/date'

// Dolu günlər saray sorğusu ilə birlikdə gəlir — komponent özü sorğu göndərmir
const props = defineProps({
  busyDates: { type: Set, default: () => new Set() },
})

defineEmits(['select'])

const weekDays = WEEKDAYS_SHORT

const busy = computed(() => props.busyDates ?? new Set())

const today = new Date()
today.setHours(0, 0, 0, 0)
const todayKey = toDateKey(today)

const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

const monthLabel = computed(() => formatMonthTitle(viewYear.value, viewMonth.value))

// Cari aydan geriyə keçidə icazə verilmir — yalnız bu gündən sonrası maraqlıdır
const canGoBack = computed(
  () => viewYear.value > today.getFullYear() ||
    (viewYear.value === today.getFullYear() && viewMonth.value > today.getMonth()),
)

const shiftMonth = (step) => {
  const d = new Date(viewYear.value, viewMonth.value + step, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

// Ayın ilk gününün həftə içindəki yerinə görə boş xanaların sayı (həftə bazar ertəsindən başlayır)
const leadingBlanks = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  return (firstDay + 6) % 7
})

// Ayın hər günü üçün vəziyyət hesablayır: keçmiş / dolu / boş (+ həftə sonu, bu gün)
const days = computed(() => {
  const total = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const result = []

  for (let n = 1; n <= total; n++) {
    const date = new Date(viewYear.value, viewMonth.value, n)
    const key = toDateKey(date)
    const weekday = date.getDay()

    let status = 'free'
    if (date <= today) status = 'past'
    else if (busy.value.has(key)) status = 'busy'

    result.push({
      number: n,
      key,
      status,
      // Toylar əsasən həftə sonu olur — o günləri ayrıca vurğulayırıq
      isWeekend: weekday === 0 || weekday === 6,
      isToday: key === todayKey,
    })
  }

  return result
})

const freeCount = computed(() => days.value.filter((d) => d.status === 'free').length)
const busyCount = computed(() => days.value.filter((d) => d.status === 'busy').length)

// Gələcək günlərin neçə faizi doludur (keçmiş günlər hesaba alınmır)
const occupancy = computed(() => {
  const total = freeCount.value + busyCount.value
  return total === 0 ? 0 : Math.round((busyCount.value / total) * 100)
})

const dayTitle = (d) =>
  ({
    free: `${formatDateFull(d.key)} — boşdur, rezerv edə bilərsiniz`,
    busy: `${formatDateFull(d.key)} — doludur`,
    past: 'Keçmiş tarix',
  })[d.status]
</script>

<style scoped>
.calendar {
  background: #fff;
  border: 1px solid #efe9eb;
  border-radius: 14px;
  padding: 16px 18px 14px;
  box-shadow: 0 6px 20px rgba(114, 20, 56, 0.06);
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
  font-size: 1.02rem;
  letter-spacing: 0.01em;
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
  transition: all 0.18s;
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

/* Doluluq göstəricisi */
.occupancy {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.occ-bar {
  flex: 1;
  height: 5px;
  background: #f3f0f1;
  border-radius: 20px;
  overflow: hidden;
}

.occ-fill {
  display: block;
  height: 100%;
  border-radius: 20px;
  background: linear-gradient(90deg, var(--gold), var(--brand));
  transition: width 0.35s ease;
}

.occ-text {
  font-size: 0.72rem;
  color: #adb5bd;
  white-space: nowrap;
}

.occ-text b {
  color: var(--ink);
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
  cursor: default;
  background: transparent;
  transition: all 0.15s;
}

.day.blank {
  background: transparent;
}

/* Boş gün — sakit, dəvətedici */
.day.free {
  background: #fff;
  border-color: var(--line-2);
  color: var(--ink);
  cursor: pointer;
}

.day.free:hover {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(114, 20, 56, 0.25);
}

/* Həftə sonu — toy günləri, qızılı vurğu */
.day.free.weekend {
  background: #fdf6e9;
  border-color: #f2e3c6;
  color: #8a6220;
}

.day.free.weekend:hover {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

/* Dolu gün — həyəcan siqnalı deyil, sadəcə susdurulmuş */
.day.busy {
  background: #f6f7f8;
  color: #ced4da;
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}

.day.past {
  color: #e9ecef;
}

.day.today {
  box-shadow: inset 0 0 0 2px var(--gold);
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

.dot.free {
  background: #fff;
  border-color: #e5dcdf;
}

.dot.weekend {
  background: #fdf6e9;
  border-color: #e6cf9d;
}

.dot.busy {
  background: #f6f7f8;
  border-color: #e3e6e8;
}
</style>
