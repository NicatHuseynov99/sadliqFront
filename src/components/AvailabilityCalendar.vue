<template>
  <div class="calendar" v-loading="isLoading">
    <div class="cal-head">
      <button class="nav-btn" :disabled="!canGoBack" @click="shiftMonth(-1)">‹</button>
      <span class="cal-title">{{ monthLabel }}</span>
      <button class="nav-btn" @click="shiftMonth(1)">›</button>
    </div>

    <div class="week-days">
      <span v-for="d in weekDays" :key="d">{{ d }}</span>
    </div>

    <div class="days">
      <span v-for="n in leadingBlanks" :key="`b${n}`" class="day blank"></span>
      <button
        v-for="d in days"
        :key="d.key"
        class="day"
        :class="d.status"
        :disabled="d.status !== 'free'"
        :title="dayTitle(d)"
        @click="$emit('select', d.key)"
      >
        {{ d.number }}
      </button>
    </div>

    <div class="legend">
      <span><i class="box free"></i> Boş</span>
      <span><i class="box busy"></i> Dolu</span>
      <span><i class="box past"></i> Keçmiş</span>
    </div>

    <p class="summary" v-if="!isLoading">
      Bu ayda <b>{{ freeCount }}</b> boş, <b>{{ busyCount }}</b> dolu gün var.
    </p>
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
const isLoading = ref(false)

const today = new Date()
today.setHours(0, 0, 0, 0)

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

// Ayın hər günü üçün vəziyyət hesablayır: keçmiş / dolu / boş
const days = computed(() => {
  const total = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const result = []

  for (let n = 1; n <= total; n++) {
    const date = new Date(viewYear.value, viewMonth.value, n)
    const key = toDateKey(date)

    let status = 'free'
    if (date <= today) status = 'past'
    else if (busy.value.has(key)) status = 'busy'

    result.push({ number: n, key, status })
  }

  return result
})

const freeCount = computed(() => days.value.filter((d) => d.status === 'free').length)
const busyCount = computed(() => days.value.filter((d) => d.status === 'busy').length)

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
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.cal-title {
  font-weight: 700;
  color: #1a1118;
  text-transform: capitalize;
  font-size: 1rem;
}

.nav-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #eaeaea;
  background: #fff;
  color: #721438;
  font-size: 1.1rem;
  cursor: pointer;
  line-height: 1;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #721438;
  border-color: #721438;
  color: #fff;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.week-days,
.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.week-days {
  margin-bottom: 6px;
}

.week-days span {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #adb5bd;
  text-transform: uppercase;
}

.day {
  aspect-ratio: 1;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  display: grid;
  place-items: center;
  cursor: default;
}

.day.blank {
  background: transparent;
}

.day.free {
  background: #e8f6ec;
  color: #1e7e34;
  cursor: pointer;
  transition: all 0.15s;
}

.day.free:hover {
  background: #1e7e34;
  color: #fff;
  transform: scale(1.06);
}

.day.busy {
  background: #fdeaea;
  color: #c0392b;
  text-decoration: line-through;
}

.day.past {
  background: #f8f9fa;
  color: #ced4da;
}

.legend {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f1f3f5;
  font-size: 0.78rem;
  color: #6c757d;
}

.legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.box {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.box.free {
  background: #e8f6ec;
  border: 1px solid #1e7e34;
}

.box.busy {
  background: #fdeaea;
  border: 1px solid #c0392b;
}

.box.past {
  background: #f8f9fa;
  border: 1px solid #ced4da;
}

.summary {
  margin: 10px 0 0;
  font-size: 0.8rem;
  color: #868e96;
}

.summary b {
  color: #1a1118;
}
</style>
