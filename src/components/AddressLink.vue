<template>
  <el-dropdown trigger="click" @command="openMap">
    <span class="address-link" :class="{ compact }">
      <span class="pin"><IcoMapPin class="ico" /></span>
      <span class="text">{{ label }}</span>
      <span class="hint" v-if="!compact">— xəritədə aç</span>
    </span>

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="google"><IcoMap class="ico" /> Google Maps-də aç</el-dropdown-item>
        <el-dropdown-item command="waze"><IcoCar class="ico" /> Waze ilə yol göstər</el-dropdown-item>
        <el-dropdown-item command="copy" divided><IcoClipboardList class="ico" /> Ünvanı kopyala</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { toast } from '@/utils/toast'

const props = defineProps({
  address: { type: String, required: true },
  city: { type: String, default: '' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  compact: { type: Boolean, default: false },
})

const label = computed(() =>
  props.city ? `${props.address}, ${props.city}` : props.address,
)

// Koordinat varsa dəqiq nöqtə, yoxdursa ünvan mətni ilə axtarış linki qurulur
const buildUrl = (provider) => {
  const hasCoords = props.latitude != null && props.longitude != null

  if (provider === 'waze') {
    return hasCoords
      ? `https://waze.com/ul?ll=${props.latitude},${props.longitude}&navigate=yes`
      : `https://waze.com/ul?q=${encodeURIComponent(label.value)}&navigate=yes`
  }

  return hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${props.latitude},${props.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label.value)}`
}

// Seçilən xəritə tətbiqini yeni pəncərədə açır, "copy" seçimində ünvanı buferə kopyalayır
const openMap = async (command) => {
  if (command === 'copy') {
    try {
      await navigator.clipboard.writeText(label.value)
      toast.success(label.value, 'Kopyalandı')
    } catch {
      toast.error('Kopyalamaq mümkün olmadı.')
    }
    return
  }

  window.open(buildUrl(command), '_blank', 'noopener')
}
</script>

<style scoped>
.address-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #6c757d;
  font-size: 0.92rem;
  transition: color 0.2s;
  outline: none;
}

.address-link:hover {
  color: var(--brand);
}

.address-link:hover .text {
  text-decoration: underline;
}

.address-link.compact {
  font-size: 0.85rem;
}

.hint {
  font-size: 0.78rem;
  color: #adb5bd;
}
</style>
