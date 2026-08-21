<template>
  <!-- Seçilmiş sarayları yan-yana qoyur. Ən yaxşı dəyər sətir-sətir işarələnir
       ki, müştəri cədvəli oxumaqla yox, baxmaqla qərar verə bilsin. -->
  <el-dialog :model-value="true" width="900px" class="cmp-dialog" :show-close="false" @close="$emit('close')">
    <template #header>
      <div class="cmp-head">
        <div>
          <span class="cmp-caption">Müqayisə</span>
          <b>{{ venues.length }} saray yan-yana</b>
        </div>
        <button class="cmp-close" @click="$emit('close')">✕</button>
      </div>
    </template>

    <div class="table-wrap">
      <table class="cmp-table">
        <thead>
          <tr>
            <th class="row-label"></th>
            <th v-for="v in venues" :key="v.id">
              <img :src="v.coverImageUrl || FALLBACK_IMAGE" :alt="v.name" @error="onImgError" />
              <b>{{ v.name }}</b>
              <span>{{ v.city }}</span>
              <button class="drop-btn" @click="$emit('remove', v)">Siyahıdan çıxar</button>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.key">
            <td class="row-label">{{ row.label }}</td>
            <td
              v-for="v in venues"
              :key="v.id"
              :class="{ best: row.best === v.id && venues.length > 1 }"
            >
              {{ row.value(v) }}
            </td>
          </tr>

          <tr>
            <td class="row-label">Özəlliklər</td>
            <td v-for="v in venues" :key="v.id" class="features-cell">
              <span v-for="f in v.features ?? []" :key="f" class="mini-chip">{{ f }}</span>
              <em v-if="!(v.features ?? []).length">—</em>
            </td>
          </tr>

          <tr>
            <td class="row-label"></td>
            <td v-for="v in venues" :key="v.id">
              <button class="open-btn" @click="$emit('open', v)">Ətraflı bax</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { FALLBACK_IMAGE, onImgError } from '@/utils/imageFallback'

const props = defineProps({
  venues: { type: Array, required: true },
})

defineEmits(['close', 'remove', 'open'])

// el-dialog yalnız <body>-i kilidləyir, <html> özü hələ scroll ola bilir —
// telefonda arxa səhifə çekmecə açıq ikən sürüşürdü. Açılanda html-i də kilidləyirik.
onMounted(() => {
  document.documentElement.classList.add('cmp-lock')
})
onUnmounted(() => {
  document.documentElement.classList.remove('cmp-lock')
})

const minPrice = (v) => {
  const menus = v.menus ?? []
  return menus.length ? Math.min(...menus.map((m) => m.pricePerPerson)) : 0
}

const maxCapacity = (v) => {
  const halls = v.halls ?? []
  return halls.length ? Math.max(...halls.map((h) => h.capacity)) : 0
}

// Hər sətirdə hansı sarayın daha yaxşı olduğunu tapır.
// «Yaxşı» sətirdən asılıdır: qiymətdə az, tutumda çox.
const bestBy = (pick, direction = 'max') => {
  const values = props.venues.map((v) => ({ id: v.id, value: pick(v) })).filter((x) => x.value > 0)
  if (values.length < 2) return null

  const winner =
    direction === 'max'
      ? values.reduce((a, b) => (b.value > a.value ? b : a))
      : values.reduce((a, b) => (b.value < a.value ? b : a))

  // Bərabərdirsə heç kim qalib sayılmır
  const same = values.filter((x) => x.value === winner.value)
  return same.length === values.length ? null : winner.id
}

const rows = computed(() => [
  {
    key: 'price',
    label: 'Ən ucuz menyu',
    value: (v) => (minPrice(v) ? `${minPrice(v)} ₼ / nəfər` : '—'),
    best: bestBy(minPrice, 'min'),
  },
  {
    key: 'capacity',
    label: 'Ən böyük zal',
    value: (v) => (maxCapacity(v) ? `${maxCapacity(v)} nəfər` : '—'),
    best: bestBy(maxCapacity),
  },
  {
    key: 'rating',
    label: 'Reytinq',
    value: (v) => (v.reviewCount ? `★ ${v.rating} (${v.reviewCount} rəy)` : 'rəy yoxdur'),
    best: bestBy((v) => (v.reviewCount ? v.rating : 0)),
  },
  {
    key: 'parking',
    label: 'Parkinq',
    value: (v) =>
      v.parkingCapacity
        ? `${v.parkingCapacity} avtomobil${v.hasValetParking ? ' · valet' : ''}`
        : 'göstərilməyib',
    best: bestBy((v) => v.parkingCapacity ?? 0),
  },
  {
    key: 'halls',
    label: 'Zal sayı',
    value: (v) => `${(v.halls ?? []).length}`,
    best: bestBy((v) => (v.halls ?? []).length),
  },
  {
    key: 'menus',
    label: 'Menyu sayı',
    value: (v) => `${(v.menus ?? []).length}`,
    best: bestBy((v) => (v.menus ?? []).length),
  },
])
</script>

<style scoped>
:deep(.cmp-dialog) {
  border-radius: 16px;
  max-width: calc(100% - 32px);
}

:deep(.cmp-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:deep(.cmp-dialog .el-dialog__body) {
  padding: 0;
}

.cmp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff;
  padding: 10px 22px;
  border-radius: 16px 16px 0 0;
}

.cmp-caption {
  display: block;
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #f0d7de;
}

.cmp-head b {
  font-size: 1rem;
}

.cmp-close {
  background: rgba(255, 255, 255, 0.16);
  border: none;
  color: #fff;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.72rem;
}

.table-wrap {
  overflow-x: auto;
}

@media (min-width: 601px) {
  .table-wrap {
    max-height: calc(80vh - 60px);
    overflow-y: auto;
  }

  .cmp-table th {
    padding: 8px 12px;
  }

  .cmp-table th img {
    height: 60px;
  }

  .cmp-table td {
    padding: 6px 12px;
  }
}

.cmp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
}

.cmp-table th {
  padding: 14px 12px;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
  text-align: center;
  min-width: 180px;
}

.cmp-table th img {
  width: 100%;
  height: 84px;
  object-fit: cover;
  border-radius: 9px;
  margin-bottom: 7px;
}

.cmp-table th b {
  display: block;
  font-size: 0.9rem;
  color: var(--ink);
}

.cmp-table th span {
  display: block;
  font-size: 0.74rem;
  color: var(--muted-2);
  font-weight: 400;
}

.drop-btn {
  margin-top: 6px;
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.72rem;
  cursor: pointer;
}

.drop-btn:hover {
  text-decoration: underline;
}

.cmp-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f8f3f5;
  text-align: center;
  color: var(--ink-2);
}

.row-label {
  text-align: left !important;
  color: var(--muted) !important;
  font-size: 0.78rem;
  white-space: nowrap;
  background: #fbf8f9;
  position: sticky;
  left: 0;
}

/* Sətirdə ən yaxşı dəyər */
.cmp-table td.best {
  background: #f2faf5;
  color: var(--ok);
  font-weight: 700;
  position: relative;
}

.cmp-table td.best::after {
  content: '✓';
  margin-left: 5px;
  font-size: 0.75rem;
}

.features-cell {
  text-align: left !important;
}

.mini-chip {
  display: inline-block;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.71rem;
  padding: 2px 8px;
  border-radius: 20px;
  margin: 2px 3px 2px 0;
}

.features-cell em {
  font-style: normal;
  color: var(--faint);
}

.open-btn {
  background: linear-gradient(135deg, var(--brand), var(--accent));
  border: none;
  color: #fff;
  padding: 8px 18px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

/* ————— Telefon —————
   Müqayisə ən çox iki saraya icazə verir, ona görə telefonda cədvəli
   sürüşdürməyə ehtiyaç yoxdur: hər iki sütun ekrana tam sığır və qərar
   bir baxışda verilir.

   «table-layout: fixed» olmadan sütunların eni məzmuna görə hesablanır —
   uzun ünvan bir sütunu şişirdib digərini əzirdi. Sabit tərtibatda
   etiket sütunu 88px, qalan yer iki saray arasında bərabər bölünür. */
@media (max-width: 600px) {
  .table-wrap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .cmp-head {
    border-radius: 16px 16px 0 0;
    flex-shrink: 0;
  }

  .cmp-table {
    table-layout: fixed;
    width: 100%;
    font-size: 0.76rem;
  }

  .row-label {
    width: 88px;
    font-size: 0.68rem;
    padding: 9px 6px 9px 10px !important;
    white-space: normal;
    line-height: 1.3;
  }

  .cmp-table th {
    min-width: 0;
    padding: 10px 7px;
  }

  .cmp-table td {
    padding: 9px 7px;
    word-break: break-word;
  }

  .cmp-table th img {
    height: 72px;
  }

  .cmp-table th b {
    font-size: 0.78rem;
    line-height: 1.25;
  }

  .cmp-table th span {
    font-size: 0.68rem;
  }

  /* «Siyahıdan çıxar» və «Ətraflı bax» dar sütunda bir sətrə sığmırdı */
  .drop-btn {
    font-size: 0.68rem;
  }

  .open-btn {
    width: 100%;
    padding: 8px 6px;
    font-size: 0.72rem;
  }

  /* Özəllik nişanları dar sütunda yan-yana durmur — alt-alta düzülür */
  .features-cell {
    gap: 4px;
  }

  .features-cell span,
  .mini-chip {
    font-size: 0.66rem;
    padding: 2px 7px;
  }
}
</style>

<!-- el-dialog Teleport ilə <body>-yə köçürülür, scoped stil ona çatmır —
     ona görə telefon üçün tam-ekran override ayrı, scope olunmamış blokdadır. -->
<style>
html.cmp-lock,
html.cmp-lock body {
  overflow: hidden !important;
  height: 100% !important;
}

@media (max-width: 600px) {
  .cmp-dialog.el-dialog {
    position: fixed !important;
    top: 6dvh !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    margin: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: 94dvh !important;
    max-height: 94dvh !important;
    border-radius: 16px 16px 0 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .cmp-dialog.el-dialog .el-dialog__body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}
</style>
