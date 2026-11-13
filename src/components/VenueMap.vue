<template>
  <div class="map-wrap">
    <div ref="mapEl" class="map"></div>

    <div class="map-tools">
      <button class="tool" :class="{ busy: isLocating }" title="Mənə yaxın" @click="goToMe">
        {{ isLocating ? '…' : '📍' }}
      </button>
      <button class="tool" title="Bütün sarayları göstər" @click="fitAll"><IcoMap class="ico" /></button>
    </div>

    <div class="map-info">
      <b>{{ items.length }}</b> saray göstərilir
      <template v-if="withoutCoordinates">
        · <span class="muted" :title="'Bu sarayların ünvanı xəritəyə bağlanmayıb'">
          {{ withoutCoordinates }} xəritədə yoxdur
        </span>
      </template>
    </div>

    <div v-if="isLoading" class="map-loading">Yüklənir…</div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { searchOnMap, getMyLocation, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/services/mapService'
import { toast } from '@/utils/toast'
import { FALLBACK_IMAGE } from '@/utils/imageFallback'

const props = defineProps({
  // Ana səhifədəki süzgəclər — xəritə eyni şərtlərlə axtarır
  filters: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['select', 'count'])

const mapEl = ref(null)
const map = shallowRef(null)
const markerLayer = shallowRef(null)
const meMarker = shallowRef(null)

const items = ref([])
const withoutCoordinates = ref(0)
const isLoading = ref(false)
const isLocating = ref(false)

// Markerdə əsas yeri sarayın adı tutur, qiymət isə yanında kiçik yazılır —
// müştəri əvvəlcə məkanı tanıyır, sonra qiymətə baxır
const venueIcon = (venue) =>
  L.divIcon({
    className: 'venue-pin-wrap',
    html: `<span class="venue-pin">
             <b>${escapeHtml(venue.name)}</b>
             ${venue.minPrice ? `<i>${venue.minPrice} ₼</i>` : ''}
           </span>`,
    // Ölçü mətnə görə dəyişir, ona görə sabit vermirik
    iconSize: null,
    iconAnchor: [0, 34],
  })

// Saray adı bazadan gəlir — HTML kimi şərh olunmasın deyə təmizləyirik
const escapeHtml = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )

const popupHtml = (v) => `
  <div class="pin-card">
    <img src="${v.coverImageUrl || FALLBACK_IMAGE}" alt="" onerror="this.src='${FALLBACK_IMAGE}'" />
    <div class="pin-body">
      <b>${v.name}</b>
      <span class="pin-sub">${v.city} · ${v.address}</span>
      <span class="pin-meta">
        ${v.rating ? `★ ${v.rating}` : 'rəy yoxdur'}
        ${v.maxCapacity ? ` · ${v.maxCapacity} nəfər` : ''}
        ${v.parkingCapacity ? ` · 🅿️ ${v.parkingCapacity}` : ''}
        ${v.distanceKm != null ? ` · ${v.distanceKm} km` : ''}
      </span>
      <button class="pin-btn" data-venue="${v.id}">Ətraflı bax</button>
    </div>
  </div>`

// Bütün saraylar bir dəfə yüklənir və xəritədə qalır. Bazada yüzlərlə deyil,
// onlarla saray var — hamısını göndərmək xəritəni hərəkət etdirdikcə
// təkrar sorğu göndərməkdən həm sadə, həm sürətlidir.
const load = async () => {
  isLoading.value = true
  try {
    const result = await searchOnMap({ ...props.filters, limit: 500 })
    items.value = result.items
    withoutCoordinates.value = result.withoutCoordinates
    emit('count', result.totalMatched)
    draw()
  } finally {
    isLoading.value = false
  }
}

const draw = () => {
  markerLayer.value.clearLayers()

  items.value.forEach((v) => {
    const marker = L.marker([v.latitude, v.longitude], { icon: venueIcon(v) })
      .bindPopup(popupHtml(v), { closeButton: true, maxWidth: 260 })

    markerLayer.value.addLayer(marker)
  })
}

// Yüklənmiş bütün markerlər ekrana sığdırılır — yeni sorğu göndərilmir
const fitAll = () => {
  if (!items.value.length) return

  const group = L.latLngBounds(items.value.map((v) => [v.latitude, v.longitude]))
  map.value.fitBounds(group, { padding: [40, 40] })
}

const showMe = (position) => {
  map.value.setView(position, DEFAULT_ZOOM)

  if (meMarker.value) map.value.removeLayer(meMarker.value)
  meMarker.value = L.circleMarker(position, {
    radius: 8,
    color: '#1c5cab',
    fillColor: '#3b82f6',
    fillOpacity: 0.9,
    weight: 3,
  })
    .addTo(map.value)
    .bindPopup('Siz buradasınız')
}

// Yeri tapmaq bir neçə saniyə çəkə bilər, ona görə xəritə açılanda avtomatik
// soruşulmur — istifadəçi düyməyə basanda işə düşür.
// Markerlər onsuz da yerindədir, sadəcə xəritə istifadəçinin üstünə gətirilir.
const goToMe = async () => {
  isLocating.value = true
  try {
    const { coords, error } = await getMyLocation()

    // Səssiz uğursuzluq ən pis haldır: düymə basılır, heç nə olmur və
    // istifadəçi saytı xarab sayır. Səbəb açıq deyilir.
    if (error) return toast.info(error)

    showMe(coords)
  } finally {
    isLocating.value = false
  }
}

// Popup-dakı «Ətraflı bax» düyməsi Vue-dan kənarda qurulur, ona görə
// kliki xəritə konteynerində tuturuq.
// Siyahı rejimi ilə eyni olsun deyə hadisə ilə sarayın özü göndərilir —
// rəqəm göndərsək qəbul edən tərəf `venue.id` tapmır.
const onMapClick = (event) => {
  const id = event.target?.closest?.('[data-venue]')?.dataset?.venue
  if (!id) return

  const venue = items.value.find((v) => v.id === Number(id))
  emit('select', venue ?? { id: Number(id) })
}

onMounted(async () => {
  // «Leaflet» yazısı kitabxananın öz reklamıdır — götürürük.
  // «© OpenStreetMap» isə lisenziya tələbidir və qalmalıdır.
  map.value = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false,
  }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)

  L.control.attribution({ prefix: false, position: 'bottomleft' }).addTo(map.value)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map.value)

  L.control.zoom({ position: 'bottomright' }).addTo(map.value)

  markerLayer.value = L.layerGroup().addTo(map.value)

  mapEl.value.addEventListener('click', onMapClick)

  // Açılan kimi bütün saraylar yüklənir — gecikmə yaradan heç nə gözlənilmir
  await load()
})

onBeforeUnmount(() => {
  mapEl.value?.removeEventListener('click', onMapClick)
  map.value?.remove()
})

// Süzgəc dəyişəndə markerlər yenidən yüklənir; xəritənin baxış yeri dəyişmir —
// istifadəçini baxdığı yerdən qoparmaq düzgün deyil
watch(
  () => props.filters,
  () => {
    if (map.value) load()
  },
  { deep: true },
)
</script>

<style scoped>
.map-wrap {
  position: relative;
  /* Leaflet öz laylarına 400–700 arası z-index verir. Öz yığın konteksti
     yaradırıq ki, xəritə scroll zamanı yuxarıdakı menyunun üstünə çıxmasın. */
  z-index: 0;
  isolation: isolate;
  height: 620px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(26, 17, 24, 0.08);
}

.map {
  width: 100%;
  height: 100%;
}

.map-tools {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 500;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool {
  width: 38px;
  height: 38px;
  border: 1px solid #ece5e8;
  background: #fff;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(26, 17, 24, 0.12);
  transition: background 0.15s;
}

.tool:hover {
  background: #fbf7f8;
}

.tool.busy {
  opacity: 0.6;
}

.map-info {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 500;
  background: rgba(255, 255, 255, 0.95);
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--ink-2);
  box-shadow: 0 3px 10px rgba(26, 17, 24, 0.12);
}

.map-info .muted {
  color: var(--muted-2);
  border-bottom: 1px dashed #d8c3cb;
  cursor: help;
}

.map-loading {
  position: absolute;
  inset: 0;
  z-index: 600;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.55);
  font-size: 0.9rem;
  color: var(--brand);
  pointer-events: none;
}

@media (max-width: 768px) {
  .map-wrap {
    height: 460px;
  }
}
</style>

<!-- Marker və popup Leaflet tərəfindən body-yə əlavə olunur, ona görə
     bu stillər scoped ola bilməz -->
<style>
/* Marker: sarayın adı böyük, qiymət kiçik və solğun */
.venue-pin-wrap {
  width: auto !important;
  height: auto !important;
}

.venue-pin {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  color: var(--ink);
  padding: 5px 11px;
  border-radius: 20px;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(26, 17, 24, 0.28);
  border: 2px solid var(--brand);
  transition: all 0.12s;
  transform: translateX(-50%);
}

.venue-pin b {
  font-size: 0.76rem;
  font-weight: 700;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.venue-pin i {
  font-style: normal;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--brand);
  background: var(--brand-soft);
  padding: 1px 7px;
  border-radius: 20px;
}

.venue-pin-wrap:hover {
  z-index: 1000 !important;
}

.venue-pin-wrap:hover .venue-pin {
  background: var(--brand);
  color: #fff;
  border-color: var(--gold);
}

.venue-pin-wrap:hover .venue-pin i {
  background: var(--gold);
  color: #4a0d24;
}

.leaflet-popup-content-wrapper {
  border-radius: 14px;
  padding: 0;
  overflow: hidden;
}

.leaflet-popup-content {
  margin: 0;
  width: 240px !important;
}

.pin-card img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  display: block;
}

.pin-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pin-body b {
  font-size: 0.9rem;
  color: var(--ink);
}

.pin-sub {
  font-size: 0.74rem;
  color: var(--muted);
}

.pin-meta {
  font-size: 0.74rem;
  color: #b07d2b;
}

.pin-btn {
  margin-top: 8px;
  background: var(--brand);
  color: #fff;
  border: none;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.pin-btn:hover {
  background: #5c1029;
}

/* Telefonda nişanlar xəritənin böyük hissəsini örtürdü: ad 150px-ə
   qədər uzanır, yan-yana düşən iki nişan bir-birini gizlədirdi.
   Kiçildilir və ad qısaldılır — nişana toxunanda tam adı onsuz da
   açılan pəncərədə görünür. */
@media (max-width: 600px) {
  .venue-pin {
    padding: 3px 8px;
    gap: 4px;
    border-width: 1.5px;
  }

  .venue-pin b {
    font-size: 0.66rem;
    max-width: 96px;
  }

  .venue-pin i {
    font-size: 0.62rem;
  }
}
</style>
