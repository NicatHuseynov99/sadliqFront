<template>
  <div class="picker">
    <div class="picker-head">
      <button class="find-btn" :disabled="isSearching || !address" @click="findByAddress">
        {{ isSearching ? 'Axtarılır…' : '🔍 Ünvana görə tap' }}
      </button>
      <span class="picker-hint">və ya xəritədə nişanı sürüşdürün</span>
    </div>

    <div ref="mapEl" class="picker-map"></div>

    <div class="coord-row">
      <label>
        En dairəsi
        <input v-model.number="lat" class="value-box" type="number" step="0.0001" @change="apply" />
      </label>
      <label>
        Uzunluq dairəsi
        <input v-model.number="lng" class="value-box" type="number" step="0.0001" @change="apply" />
      </label>
      <button v-if="lat || lng" class="clear-btn" title="Koordinatı sil" @click="clear">✕</button>
    </div>

    <p v-if="message" class="picker-msg" :class="{ bad: isBad }">{{ message }}</p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DEFAULT_CENTER } from '@/services/mapService'

const props = defineProps({
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  // Ünvana görə axtarış üçün (şəhər + ünvan birlikdə)
  address: { type: String, default: '' },
})

const emit = defineEmits(['update'])

const mapEl = ref(null)
const map = shallowRef(null)
const marker = shallowRef(null)

const lat = ref(props.latitude)
const lng = ref(props.longitude)
const isSearching = ref(false)
const message = ref('')
const isBad = ref(false)

const setMarker = (position, moveView = true) => {
  if (!map.value) return

  if (!marker.value) {
    marker.value = L.marker(position, { draggable: true }).addTo(map.value)
    marker.value.on('dragend', () => {
      const p = marker.value.getLatLng()
      lat.value = Number(p.lat.toFixed(6))
      lng.value = Number(p.lng.toFixed(6))
      apply()
    })
  } else {
    marker.value.setLatLng(position)
  }

  if (moveView) map.value.setView(position, 16)
}

const apply = () => {
  if (lat.value && lng.value) setMarker([lat.value, lng.value])
  emit('update', { latitude: lat.value || null, longitude: lng.value || null })
}

const clear = () => {
  lat.value = null
  lng.value = null

  if (marker.value) {
    map.value.removeLayer(marker.value)
    marker.value = null
  }

  message.value = 'Koordinat silindi — saray xəritədə görünməyəcək.'
  isBad.value = true
  emit('update', { latitude: null, longitude: null })
}

// Ünvan → koordinat. Nominatim pulsuzdur, amma saniyədə bir sorğu limiti var,
// ona görə yalnız düymə basılanda çağırılır, avtomatik yox.
const findByAddress = async () => {
  isSearching.value = true
  message.value = ''

  try {
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=az&q=' +
      encodeURIComponent(props.address)

    const response = await fetch(url, { headers: { 'Accept-Language': 'az' } })
    const found = await response.json()

    if (!found.length) {
      message.value = 'Bu ünvan tapılmadı. Nişanı əl ilə yerləşdirin.'
      isBad.value = true
      return
    }

    lat.value = Number(Number(found[0].lat).toFixed(6))
    lng.value = Number(Number(found[0].lon).toFixed(6))
    apply()

    message.value = `Tapıldı: ${found[0].display_name}`
    isBad.value = false
  } catch {
    message.value = 'Axtarış alınmadı — internet bağlantısını yoxlayın.'
    isBad.value = true
  } finally {
    isSearching.value = false
  }
}

onMounted(() => {
  const start = lat.value && lng.value ? [lat.value, lng.value] : DEFAULT_CENTER

  map.value = L.map(mapEl.value, { attributionControl: false })
    .setView(start, lat.value ? 16 : 11)

  L.control.attribution({ prefix: false }).addTo(map.value)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map.value)

  // Xəritəyə klik nişanı ora qoyur
  map.value.on('click', (event) => {
    lat.value = Number(event.latlng.lat.toFixed(6))
    lng.value = Number(event.latlng.lng.toFixed(6))
    setMarker([lat.value, lng.value], false)
    apply()
  })

  if (lat.value && lng.value) setMarker([lat.value, lng.value])
})

onBeforeUnmount(() => map.value?.remove())

watch(
  () => [props.latitude, props.longitude],
  ([newLat, newLng]) => {
    lat.value = newLat
    lng.value = newLng
    if (newLat && newLng) setMarker([newLat, newLng])
  },
)
</script>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.find-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: #721438;
  padding: 7px 14px;
  border-radius: 9px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.find-btn:hover:not(:disabled) {
  border-color: #dfb15b;
}

.find-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.picker-hint {
  font-size: 0.74rem;
  color: #a6969c;
}

.picker-map {
  height: 220px;
  border-radius: 10px;
  overflow: hidden;
  z-index: 0;
}

.coord-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.coord-row label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.72rem;
  color: #868e96;
}

.value-box {
  border: 1px solid #f0eaec;
  border-radius: 9px;
  padding: 7px 11px;
  font-size: 0.8rem;
  outline: none;
  width: 100%;
}

.value-box:focus {
  border-color: #dfb15b;
}

.clear-btn {
  border: 1px solid #f3dbe1;
  background: #fff;
  color: #a02c4a;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  cursor: pointer;
}

.picker-msg {
  margin: 0;
  font-size: 0.74rem;
  color: #217a41;
  line-height: 1.4;
}

.picker-msg.bad {
  color: #b06a2b;
}
</style>
