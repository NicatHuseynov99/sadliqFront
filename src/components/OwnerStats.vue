<template>
  <!-- Sahibkarın hesabatı: baxışdan rezervə qədər olan yol və məsləhətlər -->
  <div class="stats" v-loading="isLoading">
    <div class="period-row">
      <span class="period-label">Dövr</span>
      <button
        v-for="p in periods"
        :key="p.value"
        class="period-btn"
        :class="{ active: days === p.value }"
        @click="setPeriod(p.value)"
      >
        {{ p.label }}
      </button>
    </div>

    <p v-if="!isLoading && !items.length" class="empty-box">Hələ məlumat yoxdur.</p>

    <section v-for="s in items" :key="s.venueId" class="venue-block">
      <header class="vb-head">
        <b>{{ s.venueName }}</b>
        <span v-if="s.rating" class="rating">★ {{ s.rating }} · {{ s.reviewCount }} rəy</span>
      </header>

      <!-- Baxışdan rezervə: yol boyu hər addım -->
      <div class="funnel">
        <div class="step">
          <span class="step-value">{{ s.views }}</span>
          <span class="step-label">baxış</span>
          <span class="step-extra" :class="changeClass(s.viewsChangePercent)">
            {{ changeText(s.viewsChangePercent) }}
          </span>
        </div>

        <span class="arrow">→</span>

        <div class="step">
          <span class="step-value">{{ s.requests }}</span>
          <span class="step-label">sorğu</span>
          <span class="step-extra">baxışların {{ s.viewToRequestPercent }}%-i</span>
        </div>

        <span class="arrow">→</span>

        <div class="step">
          <span class="step-value">{{ s.confirmed }}</span>
          <span class="step-label">təsdiq</span>
          <span class="step-extra">sorğuların {{ s.confirmPercent }}%-i</span>
        </div>
      </div>

      <!-- Rəqəmlər -->
      <div class="tile-row">
        <div class="tile">
          <span class="tile-value">{{ s.uniqueVisitors }}</span>
          <span class="tile-label">fərqli ziyarətçi</span>
        </div>
        <div class="tile">
          <span class="tile-value">{{ s.favorites }}</span>
          <span class="tile-label">seçilmişlərə əlavə</span>
        </div>
        <div class="tile">
          <span class="tile-value">
            {{ s.averageResponseHours === null ? '—' : `${s.averageResponseHours} saat` }}
          </span>
          <span class="tile-label">orta cavab müddəti</span>
        </div>
        <div class="tile">
          <span class="tile-value">{{ s.pending }}</span>
          <span class="tile-label">cavab gözləyir</span>
        </div>
        <div class="tile good">
          <span class="tile-value">{{ s.expectedIncome.toLocaleString() }} ₼</span>
          <span class="tile-label">gələcək tədbirlərdən</span>
        </div>
        <div class="tile" :class="{ bad: s.lostIncome > 0 }">
          <span class="tile-value">{{ s.lostIncome.toLocaleString() }} ₼</span>
          <span class="tile-label">cavabsızlıqdan itirilib</span>
        </div>
      </div>

      <div v-if="s.offersSent" class="offers-line">
        Sorğu bazarında <b>{{ s.offersSent }}</b> təklif göndərmisiniz,
        <b>{{ s.offersAccepted }}</b>-i qəbul edilib.
      </div>

      <!-- Nə etməli -->
      <div v-if="s.advice.length" class="advice">
        <span class="advice-title">Nəyi düzəltsəniz daha çox rezerv alarsınız</span>
        <ul>
          <li v-for="(a, i) in s.advice" :key="i">{{ a }}</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getOwnerStats } from '@/services/ownerService'

const periods = [
  { value: 7, label: '7 gün' },
  { value: 30, label: '30 gün' },
  { value: 90, label: '3 ay' },
  { value: 365, label: '1 il' },
]

const isLoading = ref(false)
const items = ref([])
const days = ref(30)

const load = async () => {
  isLoading.value = true
  try {
    items.value = await getOwnerStats(days.value)
  } finally {
    isLoading.value = false
  }
}

const setPeriod = (value) => {
  days.value = value
  load()
}

// Əvvəlki dövrlə müqayisə
const changeText = (percent) => {
  if (!percent) return 'dəyişməyib'
  return percent > 0 ? `▲ ${percent}%` : `▼ ${Math.abs(percent)}%`
}

const changeClass = (percent) => (percent > 0 ? 'up' : percent < 0 ? 'down' : '')

onMounted(load)
</script>

<style scoped>
.stats {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 140px;
}

.period-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.period-label {
  font-size: 0.78rem;
  color: var(--muted);
  margin-right: 4px;
}

.period-btn {
  background: #fff;
  border: 1px solid var(--line-2);
  color: #6c757d;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
}

.period-btn:hover {
  border-color: var(--gold);
}

.period-btn.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.venue-block {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 15px;
  padding: 18px 22px 20px;
}

.vb-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.vb-head b {
  font-size: 1.02rem;
  color: var(--ink);
}

.rating {
  font-size: 0.8rem;
  color: var(--warn);
}

/* Baxış → sorğu → təsdiq */
.funnel {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #fbf7f8, #fdf9f2);
  border-radius: 13px;
  padding: 16px 20px;
  flex-wrap: wrap;
}

.step {
  display: flex;
  flex-direction: column;
  min-width: 96px;
}

.step-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--brand);
  line-height: 1.1;
}

.step-label {
  font-size: 0.78rem;
  color: #6c757d;
}

.step-extra {
  font-size: 0.72rem;
  color: var(--muted-2);
  margin-top: 2px;
}

.step-extra.up {
  color: var(--ok);
}

.step-extra.down {
  color: var(--accent);
}

.arrow {
  color: #d8c6cc;
  font-size: 1.2rem;
}

/* Rəqəm kartları */
.tile-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 9px;
  margin-top: 12px;
}

.tile {
  background: #fbf8f9;
  border-radius: 11px;
  padding: 11px 14px;
}

.tile.good {
  background: #f2faf5;
}

.tile.bad {
  background: #fdf1f3;
}

.tile-value {
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ink);
}

.tile.good .tile-value {
  color: var(--ok);
}

.tile.bad .tile-value {
  color: var(--accent);
}

.tile-label {
  font-size: 0.73rem;
  color: var(--muted);
}

.offers-line {
  margin-top: 12px;
  font-size: 0.8rem;
  color: #6c757d;
}

.offers-line b {
  color: var(--info);
}

/* Məsləhətlər */
.advice {
  margin-top: 14px;
  background: #fffaf2;
  border: 1px solid #f5e6c8;
  border-radius: 12px;
  padding: 13px 16px;
}

.advice-title {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--warn);
  margin-bottom: 7px;
}

.advice ul {
  margin: 0;
  padding-left: 18px;
}

.advice li {
  font-size: 0.79rem;
  color: #6c757d;
  line-height: 1.7;
}

.empty-box {
  background: #fff;
  border: 1px dashed #eadfe3;
  border-radius: 14px;
  padding: 30px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted-2);
}
</style>
