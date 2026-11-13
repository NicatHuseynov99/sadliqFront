<template>
  <!-- Toy kabineti: təsdiqlənmiş tədbir üçün geri sayım və hazırlıq siyahısı.
       Təsdiqdən sonra müştəri üçün bir şey qalmırdı — indi qalır. -->
  <section class="board">
    <div class="board-main">
      <img class="board-bg" :src="reservation.venueImage || FALLBACK_IMAGE" alt="" @error="onImgError" />
      <div class="board-shade"></div>

      <div class="board-text">
        <span class="board-caption">Yaxınlaşan tədbiriniz</span>
        <h2>{{ reservation.venueName }}</h2>
        <span class="board-meta">
          {{ formatDateFull(reservation.eventDate) }} · {{ reservation.hallName }} ·
          {{ reservation.guestCount }} qonaq
        </span>
      </div>

      <div class="countdown">
        <b>{{ daysLeft }}</b>
        <span>{{ daysLabel }}</span>
      </div>
    </div>

    <!-- Hazırlıq siyahısı: tarixə görə özü işarələnir -->
    <div class="board-side">
      <span class="side-title">Hazırlıq yolu</span>

      <ol class="steps">
        <li v-for="s in steps" :key="s.key" :class="{ done: s.done, now: s.now }">
          <i>{{ s.done ? '✓' : s.now ? '•' : '' }}</i>
          <div>
            <b>{{ s.title }}</b>
            <span>{{ s.hint }}</span>
          </div>
        </li>
      </ol>

      <div class="side-foot">
        <a class="side-btn" :href="`tel:${(reservation.venuePhone || '').replace(/\s/g, '')}`">
          <IcoPhone class="ico" /> Sarayla əlaqə
        </a>
        <router-link class="side-btn ghost" :to="`/venue/${reservation.venueId}`">
          Sarayın səhifəsi
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateFull } from '@/utils/date'
import { FALLBACK_IMAGE, onImgError } from '@/utils/imageFallback'

const props = defineProps({
  reservation: { type: Object, required: true },
})

const daysLeft = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((new Date(props.reservation.eventDate) - today) / 86400000))
})

const daysLabel = computed(() => (daysLeft.value === 0 ? 'bu gün!' : 'gün qaldı'))

// Toy hazırlığının adi gedişi. «Now» — indi diqqət tələb edən addım.
const steps = computed(() => {
  const left = daysLeft.value

  const raw = [
    {
      key: 'booked',
      title: 'Tarix təsdiqləndi',
      hint: 'Zal sizin adınıza bağlandı',
      doneWhen: true,
    },
    {
      key: 'guests',
      title: 'Qonaq sayını dəqiqləşdirin',
      hint: '30 gün qalmış saraya son rəqəmi bildirin',
      doneWhen: left <= 20,
      nowWhen: left <= 40 && left > 20,
    },
    {
      key: 'menu',
      title: 'Menyunu son dəfə yoxlayın',
      hint: 'Xüsusi pəhriz və uşaq menyusu varsa indi deyin',
      doneWhen: left <= 10,
      nowWhen: left <= 20 && left > 10,
    },
    {
      key: 'details',
      title: 'Detalları razılaşdırın',
      hint: 'Musiqi, bəzək, oturma planı, giriş saatı',
      doneWhen: left <= 3,
      nowWhen: left <= 10 && left > 3,
    },
    {
      key: 'event',
      title: 'Tədbir günü',
      hint: 'Yaxşı keçsin — sonra rəy yazmağı unutmayın',
      doneWhen: left === 0,
      nowWhen: left <= 3,
    },
  ]

  return raw.map((s) => ({
    key: s.key,
    title: s.title,
    hint: s.hint,
    done: s.doneWhen,
    now: !s.doneWhen && Boolean(s.nowWhen),
  }))
})
</script>

<style scoped>
.board {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}

/* Sol tərəf: şəkil, ad, geri sayım */
.board-main {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  min-height: 210px;
  display: flex;
  align-items: flex-end;
  padding: 22px 24px;
  color: #fff;
}

.board-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.board-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(26, 17, 24, 0.93) 10%, rgba(26, 17, 24, 0.3));
}

.board-text {
  position: relative;
  z-index: 1;
  flex: 1;
}

.board-caption {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gold);
  margin-bottom: 5px;
}

.board-text h2 {
  margin: 0 0 5px;
  font-size: 1.5rem;
  color: #fff;
}

.board-meta {
  font-size: 0.84rem;
  color: #e0d2d7;
}

.countdown {
  position: relative;
  z-index: 1;
  text-align: center;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(3px);
  border-radius: 14px;
  padding: 12px 18px;
  min-width: 96px;
}

.countdown b {
  display: block;
  font-size: 2.1rem;
  line-height: 1;
  color: var(--gold);
}

.countdown span {
  font-size: 0.74rem;
  color: #e0d2d7;
}

/* Sağ tərəf: hazırlıq addımları */
.board-side {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
}

.side-title {
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 12px;
}

.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
}

.steps li {
  display: flex;
  gap: 10px;
  padding: 7px 0;
  opacity: 0.5;
}

.steps li.done,
.steps li.now {
  opacity: 1;
}

.steps i {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #e6dade;
  font-style: normal;
  font-size: 0.62rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  color: #fff;
}

.steps li.done i {
  background: var(--ok);
  border-color: var(--ok);
}

.steps li.now i {
  background: var(--gold);
  border-color: var(--gold);
}

.steps b {
  display: block;
  font-size: 0.82rem;
  color: var(--ink);
}

.steps span {
  font-size: 0.74rem;
  color: var(--muted);
  line-height: 1.45;
}

.side-foot {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.side-btn {
  flex: 1;
  text-align: center;
  text-decoration: none;
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.side-btn.ghost {
  background: #fff;
  border: 1px solid var(--line);
  color: var(--brand);
}

@media (max-width: 860px) {
  .board {
    grid-template-columns: 1fr;
  }
}
</style>
