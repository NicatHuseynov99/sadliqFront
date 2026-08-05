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
              <img :src="v.coverImageUrl" :alt="v.name" @error="onImgError" />
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
import { computed } from 'vue'

const props = defineProps({
  venues: { type: Array, required: true },
})

defineEmits(['close', 'remove', 'open'])

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=60'

const onImgError = (event) => {
  event.target.src = FALLBACK_IMAGE
}

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
  {
    key: 'address',
    label: 'Ünvan',
    value: (v) => v.address || '—',
    best: null,
  },
  {
    key: 'phone',
    label: 'Telefon',
    value: (v) => v.phone || '—',
    best: null,
  },
])
</script>

<style scoped>
:deep(.cmp-dialog) {
  border-radius: 16px;
  max-width: calc(100vw - 32px);
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
  background: linear-gradient(135deg, #721438, #a02c4a);
  color: #fff;
  padding: 15px 22px;
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
  max-height: 74vh;
  overflow-y: auto;
}

.cmp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
}

.cmp-table th {
  padding: 14px 12px;
  border-bottom: 1px solid #f2ebee;
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
  color: #1a1118;
}

.cmp-table th span {
  display: block;
  font-size: 0.74rem;
  color: #a6969c;
  font-weight: 400;
}

.drop-btn {
  margin-top: 6px;
  background: none;
  border: none;
  color: #a02c4a;
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
  color: #4a3f44;
}

.row-label {
  text-align: left !important;
  color: #868e96 !important;
  font-size: 0.78rem;
  white-space: nowrap;
  background: #fbf8f9;
  position: sticky;
  left: 0;
}

/* Sətirdə ən yaxşı dəyər */
.cmp-table td.best {
  background: #f2faf5;
  color: #217a41;
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
  background: #f6e9ee;
  color: #721438;
  font-size: 0.71rem;
  padding: 2px 8px;
  border-radius: 20px;
  margin: 2px 3px 2px 0;
}

.features-cell em {
  font-style: normal;
  color: #c1b3b8;
}

.open-btn {
  background: linear-gradient(135deg, #721438, #a02c4a);
  border: none;
  color: #fff;
  padding: 8px 18px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
