<template>
  <!-- Sarayın yeri. Koordinat yoxdursa blok ümumiyyətlə göstərilmir. -->
  <div v-if="hasCoords" class="mini-map-block">
    <div class="mini-head">
      <h3>Məkanın yeri</h3>
      <span class="mini-sub">{{ address }}</span>
    </div>
    <div ref="mapEl" class="mini-map"></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  name: { type: String, default: '' },
  address: { type: String, default: '' },
})

const mapEl = ref(null)
const map = shallowRef(null)

const hasCoords = computed(() => props.latitude != null && props.longitude != null)

onMounted(() => {
  if (!hasCoords.value) return

  const position = [props.latitude, props.longitude]

  // Kiçik xəritədir — sürüşdürmə və təkərlə yaxınlaşdırma söndürülür ki,
  // səhifəni scroll edərkən xəritə «tutmasın»
  // «Leaflet» reklamı götürülür, «© OpenStreetMap» lisenziya tələbi kimi qalır
  map.value = L.map(mapEl.value, {
    zoomControl: true,
    scrollWheelZoom: false,
    dragging: true,
    attributionControl: false,
  }).setView(position, 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map.value)

  L.control.attribution({ prefix: false }).addTo(map.value)

  L.marker(position, {
    icon: L.divIcon({
      className: 'spot-pin-wrap',
      html: '<span class="spot-pin">📍</span>',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    }),
  })
    .addTo(map.value)
    .bindPopup(`<b>${props.name}</b><br>${props.address}`)
})

onBeforeUnmount(() => map.value?.remove())
</script>

<style scoped>
.mini-map-block {
  background: #fff;
  border-radius: 16px;
  padding: 20px 22px;
  margin-bottom: 22px;
  box-shadow: 0 2px 12px rgba(26, 17, 24, 0.06);
}

.mini-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.mini-head h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #1a1118;
}

.mini-sub {
  font-size: 0.83rem;
  color: #868e96;
}

.mini-map {
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  z-index: 0;
}

@media (max-width: 640px) {
  .mini-map {
    height: 220px;
  }
}
</style>

<style>
.spot-pin {
  font-size: 1.6rem;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
}
</style>
