<template>
  <div class="gallery">
    <div class="main-image">
      <!-- Video seçiləndə şəkil əvəzinə oynadıcı açılır -->
      <template v-if="showVideo">
        <iframe
          v-if="embedUrl"
          :src="embedUrl"
          class="video-frame"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          allowfullscreen
        ></iframe>
        <video v-else class="video-frame" :src="venue.videoUrl" controls autoplay></video>
      </template>

      <img
        v-else
        :src="activeImage || FALLBACK_IMAGE"
        :alt="venue.name"
        class="zoomable"
        @error="onImgError"
        @click="openLightbox"
      />
      <span class="city-badge">{{ venue.city }}</span>

      <!-- Qalereyanı çevirmək üçün oxlar. Bir slayd varsa göstərilmir. -->
      <template v-if="slides.length > 1">
        <button class="nav-arrow left" title="Əvvəlki" @click="prevSlide">‹</button>
        <button class="nav-arrow right" title="Növbəti" @click="nextSlide">›</button>
        <span class="slide-count">{{ slideIndex + 1 }} / {{ slides.length }}</span>
      </template>

      <button v-if="!showVideo" class="zoom-hint" title="Böyüt" aria-label="Şəkli böyüt" @click="openLightbox">⤢</button>
    </div>

    <!-- Kiçik şəkillər əsas qalereya ilə eyni sırada gedir -->
    <div class="thumbs" v-if="slides.length > 1">
      <template v-for="(slide, i) in slides" :key="i">
        <button
          v-if="slide.type === 'video'"
          class="thumb-video"
          :class="{ active: slideIndex === i }"
          @click="slideIndex = i"
        >
          <img :src="videoPoster || FALLBACK_IMAGE" alt="" @error="onImgError" />
          <span class="play">▶</span>
          <span class="video-label">Video</span>
        </button>

        <img
          v-else
          :src="slide.url || FALLBACK_IMAGE"
          :class="{ active: slideIndex === i }"
          @click="slideIndex = i"
          @error="onImgError"
        />
      </template>
    </div>

    <!-- Şəkli tam ekranda böyütmək: klik, ← → oxları, Esc ilə bağlanır -->
    <Teleport to="body">
      <div v-if="isLightboxOpen" class="lightbox" @click.self="closeLightbox">
        <button class="lb-close" title="Bağla (Esc)" aria-label="Bağla" @click="closeLightbox"><IcoX class="ico" /></button>

        <button v-if="slides.length > 1" class="lb-arrow left" title="Əvvəlki (←)" aria-label="Əvvəlki şəkil" @click="prevSlide">‹</button>

        <img :src="activeImage" :alt="venue.name" class="lb-image" />

        <button v-if="slides.length > 1" class="lb-arrow right" title="Növbəti (→)" aria-label="Növbəti şəkil" @click="nextSlide">›</button>

        <span v-if="slides.length > 1" class="lb-count">{{ slideIndex + 1 }} / {{ slides.length }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { FALLBACK_IMAGE, onImgError } from '@/utils/imageFallback'

const props = defineProps({
  venue: { type: Object, required: true },
})

const activeImage = ref(props.venue.coverImageUrl)

// Qalereya slaydları. Sıra: əsas (fon) şəkil → video → qalan şəkillər.
// Səhifə açılanda sarayın öz şəkli görünməlidir; video ondan sonra gəlir.
const slides = computed(() => {
  const cover = props.venue.coverImageUrl
  const images = props.venue.images ?? []

  const list = []
  if (cover) list.push({ type: 'image', url: cover })
  if (props.venue.videoUrl) list.push({ type: 'video' })

  images.filter((url) => url !== cover).forEach((url) => list.push({ type: 'image', url }))

  return list
})

const slideIndex = ref(0)

const showVideo = computed(() => slides.value[slideIndex.value]?.type === 'video')

// Sona çatanda əvvələ qayıdır — istifadəçi dayanmadan baxa bilsin
const nextSlide = () => {
  slideIndex.value = (slideIndex.value + 1) % slides.value.length
}

const prevSlide = () => {
  slideIndex.value = (slideIndex.value - 1 + slides.value.length) % slides.value.length
}

// ————— tam ekranda böyütmə —————

const isLightboxOpen = ref(false)

const openLightbox = () => {
  isLightboxOpen.value = true
}

const closeLightbox = () => {
  isLightboxOpen.value = false
}

// Açıq ikən ← → ilə gəzmək, Esc ilə bağlamaq
const onLightboxKeydown = (event) => {
  if (!isLightboxOpen.value) return

  if (event.key === 'Escape') closeLightbox()
  else if (event.key === 'ArrowRight') nextSlide()
  else if (event.key === 'ArrowLeft') prevSlide()
}

// Slayd dəyişəndə əsas şəkil də dəyişir
watch(slideIndex, (index) => {
  const slide = slides.value[index]
  if (slide?.type === 'image') activeImage.value = slide.url
})

// Sarayın id-si dəyişəndə (başqa saraya keçid) qalereya sıfırlanır
watch(
  () => props.venue.id,
  () => {
    activeImage.value = props.venue.coverImageUrl
    slideIndex.value = 0
  },
)

// Videonun altındakı kiçik şəkil — sarayın öz şəklindən istifadə edirik
const videoPoster = computed(() => props.venue.coverImageUrl || activeImage.value)

// YouTube və Vimeo linkləri birbaşa oynadılmır, embed formasına çevrilməlidir.
// Digər linklər (mp4 və s.) adi <video> ilə açılır.
const embedUrl = computed(() => {
  const url = props.venue.videoUrl
  if (!url) return null

  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}?autoplay=1&rel=0`

  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`

  return null
})

// Şəkil yüklənməsə ehtiyat şəkil qoyur
onMounted(() => {
  document.addEventListener('keydown', onLightboxKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onLightboxKeydown)
})
</script>

<style scoped>
.gallery {
  margin-bottom: 20px;
}

.main-image {
  position: relative;
  height: 440px;
  border-radius: 14px;
  overflow: hidden;
}

.zoomable {
  cursor: zoom-in;
}

.zoom-hint {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(26, 17, 24, 0.55);
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.15s;
}

.zoom-hint:hover {
  background: rgba(26, 17, 24, 0.8);
}

/* Tam ekran şəkil */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(10, 6, 9, 0.94);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.lb-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.lb-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
}

.lb-close:hover {
  background: rgba(255, 255, 255, 0.22);
}

.lb-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.6rem;
  cursor: pointer;
}

.lb-arrow:hover {
  background: rgba(255, 255, 255, 0.22);
}

.lb-arrow.left {
  left: 18px;
}

.lb-arrow.right {
  right: 18px;
}

.lb-count {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: #e6d8dd;
  font-size: 0.82rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

@media (max-width: 600px) {
  .lightbox {
    padding: 16px;
  }

  .lb-arrow {
    width: 40px;
    height: 40px;
    font-size: 1.3rem;
  }
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.city-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 5px 12px;
  font-size: 12px;
  border-radius: 5px;
  font-weight: 600;
}

.thumbs {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.thumbs img {
  width: 110px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.7;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.thumbs img:hover {
  opacity: 1;
}

.thumbs img.active {
  opacity: 1;
  border-color: var(--brand);
}

/* Qalereya oxları — şəklin üstündə, kənarlarda */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: var(--ink);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
  transition: all 0.15s;
  z-index: 3;
}

.nav-arrow:hover {
  background: #fff;
  transform: translateY(-50%) scale(1.08);
}

.nav-arrow.left {
  left: 14px;
}

.nav-arrow.right {
  right: 14px;
}

.slide-count {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 3;
  background: rgba(26, 17, 24, 0.7);
  color: #fff;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 4px 11px;
  border-radius: 20px;
}

/* Video oynadıcısı əsas şəklin yerini tutur */
.video-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: #000;
}

/* Video kiçik şəkli — üzərində oynatma nişanı */
.thumb-video {
  position: relative;
  width: 110px;
  height: 72px;
  flex: none;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #000;
  transition: all 0.2s;
}

.thumb-video img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.55;
  border-radius: 0;
  border: none;
}

.thumb-video:hover img {
  opacity: 0.75;
}

.thumb-video.active {
  border-color: var(--brand);
}

.thumb-video.active img {
  opacity: 0.8;
}

.thumb-video .play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 1.4rem;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.thumb-video .video-label {
  position: absolute;
  left: 6px;
  bottom: 5px;
  font-size: 0.66rem;
  font-weight: 700;
  color: #fff;
  background: rgba(114, 20, 56, 0.85);
  padding: 2px 8px;
  border-radius: 20px;
  pointer-events: none;
}

@media (max-width: 600px) {
  .main-image {
    height: 230px;
  }
}
</style>
