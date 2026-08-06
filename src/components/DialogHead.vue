<template>
  <!-- Pəncərənin başlığı: sarayın şəkli fon kimi, üstündə ad və vəziyyət -->
  <div class="dialog-head">
    <img :src="venue.coverImageUrl" :alt="venue.name" @error="onImgError" />
    <div class="shade"></div>

    <button class="close" title="Bağla" @click="$emit('close')">✕</button>

    <div class="text">
      <span class="caption">{{ caption }}</span>
      <b class="name">{{ venue.name }}</b>
      <span class="sub">
        {{ venue.city }}
        <i v-if="venue.isDeleted" class="badge off">silinib</i>
        <i v-else-if="venue.isApproved" class="badge ok">saytda</i>
        <i v-else class="badge wait">təsdiq gözləyir</i>
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  venue: { type: Object, required: true },
  caption: { type: String, default: '' },
})

defineEmits(['close'])

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=60'

const onImgError = (event) => {
  event.target.src = FALLBACK_IMAGE
}
</script>

<style scoped>
.dialog-head {
  position: relative;
  height: 106px;
  margin: -20px -20px 0;
  border-radius: 14px 14px 0 0;
  overflow: hidden;
}

.dialog-head img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(26, 17, 24, 0.92) 10%, rgba(26, 17, 24, 0.35) 60%, rgba(26, 17, 24, 0.15));
}

.text {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.caption {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gold);
  font-weight: 700;
}

.name {
  font-size: 1.15rem;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.sub {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.78);
}

.badge {
  font-style: normal;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 20px;
}

.badge.ok {
  background: rgba(126, 217, 158, 0.22);
  color: #8fe0ab;
}

.badge.wait {
  background: rgba(223, 177, 91, 0.22);
  color: var(--gold);
}

.badge.off {
  background: rgba(224, 122, 148, 0.22);
  color: #f0a3b8;
}

.close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.15s;
}

.close:hover {
  background: rgba(255, 255, 255, 0.32);
}
</style>
