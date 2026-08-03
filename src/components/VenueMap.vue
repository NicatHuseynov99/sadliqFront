<template>
  <div class="map-wrap">
    <div ref="mapEl" class="map"></div>

    <!-- Xəritə tərpənəndə siyahı avtomatik yenilənmir: hər hərəkətdə sorğu
         göndərmək həm serverə yük, həm də istifadəçiyə narahatlıqdır -->
    <button v-if="movedSinceSearch" class="search-here" @click="searchHere">
      🔄 Bu ərazidə axtar
    </button>

    <div class="map-tools">
      <button class="tool" :class="{ busy: isLocating }" title="Mənə yaxın" @click="goToMe">
        {{ isLocating ? '…' : '📍' }}
      </button>
      <button class="tool" title="Bütün sarayları göstər" @click="fitAll">🗺</button>
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
const movedSinceSearch = ref(false)

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=60'

// Marker kimi qiymət etiketi göstəririk — müştəri xəritəyə baxan kimi
// büdcəsinə uyğun məkanı seçir
const priceIcon = (venue) =>
  L.divIcon({
    className: 'price-pin-wrap',
    html: `<span class="price-pin">${venue.minPrice ? `${venue.minPrice} ₼` : '—'}</span>`,
    iconSize: [54, 26],
    iconAnchor: [27, 26],
  })

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

const bounds = () => {
  const b = map.value.getBounds()
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  }
}

const load = async (extra = {}) => {
  isLoading.value = true
  try {
    const result = await searchOnMap({ ...props.filters, ...bounds(), ...extra })
    items.value = result.items
    withoutCoordinates.value = result.withoutCoordinates
    emit('count', result.totalMatched)
    draw()
    movedSinceSearch.value = false
  } finally {
    isLoading.value = false
  }
}

const draw = () => {
  markerLayer.value.clearLayers()

  items.value.forEach((v) => {
    const marker = L.marker([v.latitude, v.longitude], { icon: priceIcon(v) })
      .bindPopup(popupHtml(v), { closeButton: true, maxWidth: 260 })

    markerLayer.value.addLayer(marker)
  })
}

const searchHere = () => load()

const fitAll = async () => {
  // Süzgəcə uyğun bütün saraylar görünsün deyə əvvəlcə sahəsiz axtarırıq
  isLoading.value = true
  try {
    const result = await searchOnMap({ ...props.filters })
    items.value = result.items
    withoutCoordinates.value = result.withoutCoordinates
    emit('count', result.totalMatched)
    draw()

    if (result.items.length) {
      const group = L.latLngBounds(result.items.map((v) => [v.latitude, v.longitude]))
      map.value.fitBounds(group, { padding: [40, 40] })
    }
    movedSinceSearch.value = false
  } finally {
    isLoading.value = false
  }
}

const goToMe = async () => {
  isLocating.value = true
  try {
    const position = await getMyLocation()
    if (!position) {
      movedSinceSearch.value = true
      return
    }

    map.value.setView(position, 13)

    if (meMarker.value) map.value.removeLayer(meMarker.value)
    meMarker.value = L.circleMarker(position, {
      radius: 8,
      color: '#1c5cab',
      fillColor: '#3b82f6',
      fillOpacity: 0.9,
      weight: 3,
    }).addTo(map.value)

    await load({ nearLat: position[0], nearLng: position[1] })
  } finally {
    isLocating.value = false
  }
}

// Popup-dakı «Ətraflı bax» düyməsi Vue-dan kənarda qurulur, ona görə
// kliki xəritə konteynerində tuturuq
const onMapClick = (event) => {
  const id = event.target?.dataset?.venue
  if (id) emit('select', Number(id))
}

onMounted(async () => {
  map.value = L.map(mapEl.value, { zoomControl: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map.value)

  L.control.zoom({ position: 'bottomright' }).addTo(map.value)

  markerLayer.value = L.layerGroup().addTo(map.value)

  map.value.on('moveend', () => {
    movedSinceSearch.value = true
  })

  mapEl.value.addEventListener('click', onMapClick)

  await fitAll()
})

onBeforeUnmount(() => {
  mapEl.value?.removeEventListener('click', onMapClick)
  map.value?.remove()
})

// Süzgəc dəyişəndə xəritə də yenilənir
watch(
  () => props.filters,
  () => {
    if (map.value) fitAll()
  },
  { deep: true },
)
</script>

<style scoped>
.map-wrap {
  position: relative;
  height: 620px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(26, 17, 24, 0.08);
}

.map {
  width: 100%;
  height: 100%;
}

/* Xəritə tərpənəndən sonra çıxan düymə */
.search-here {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  background: #fff;
  border: 1px solid #ece5e8;
  color: #721438;
  padding: 9px 18px;
  border-radius: 20px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(26, 17, 24, 0.16);
}

.search-here:hover {
  background: #721438;
  color: #fff;
  border-color: #721438;
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
  color: #4a3f44;
  box-shadow: 0 3px 10px rgba(26, 17, 24, 0.12);
}

.map-info .muted {
  color: #a6969c;
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
  color: #721438;
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
.price-pin {
  display: inline-block;
  background: #721438;
  color: #fff;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
  box-shadow: 0 3px 8px rgba(26, 17, 24, 0.3);
  border: 2px solid #fff;
  transition: transform 0.12s;
}

.price-pin-wrap:hover .price-pin {
  transform: scale(1.12);
  background: #dfb15b;
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
  color: #1a1118;
}

.pin-sub {
  font-size: 0.74rem;
  color: #868e96;
}

.pin-meta {
  font-size: 0.74rem;
  color: #b07d2b;
}

.pin-btn {
  margin-top: 8px;
  background: #721438;
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
</style>
