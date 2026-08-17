<template>
  <div class="upload">
    <!-- Yüklənmiş fayl varsa önizləmə göstərilir -->
    <div v-if="modelValue" class="preview" :class="{ small }">
      <video v-if="isVideo" :src="modelValue" controls></video>
      <img v-else :src="modelValue || FALLBACK_IMAGE" alt="" @error="onImgError" />

      <button class="remove" title="Sil" @click="$emit('update:modelValue', '')">✕</button>
    </div>

    <!-- Boşdursa: fayl seçmə sahəsi -->
    <label
      v-else
      class="drop"
      :class="{ busy: isUploading, dragging: isDragging, small }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input type="file" :accept="accept" hidden @change="onPick" />

      <span class="drop-icon">{{ isUploading ? '⏳' : video ? '🎬' : '🖼' }}</span>
      <b>{{ isUploading ? `Yüklənir… ${percent}%` : label }}</b>
      <span class="drop-hint">{{ hint }}</span>

      <span v-if="isUploading" class="bar"><i :style="{ width: `${percent}%` }"></i></span>
    </label>

    <p v-if="error" class="err">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { uploadFile } from '@/services/fileService'
import { FALLBACK_IMAGE, onImgError } from '@/utils/imageFallback'

const props = defineProps({
  modelValue: { type: String, default: '' },

  // Video rejimində fayl növü və izahlar dəyişir
  video: { type: Boolean, default: false },
  small: { type: Boolean, default: false },
  label: { type: String, default: 'Şəkil seçin və ya bura atın' },
})

const emit = defineEmits(['update:modelValue'])

const isUploading = ref(false)
const isDragging = ref(false)
const percent = ref(0)
const error = ref('')

const accept = computed(() => (props.video ? 'video/*' : 'image/*'))

const hint = computed(() =>
  props.video ? 'mp4, webm, mov — ən çox 100 MB' : 'jpg, png, webp — ən çox 8 MB',
)

// Video linki YouTube ola bilər — onda <video> yox, önizləmə şəkli göstərilməlidir
const isVideo = computed(() => /\.(mp4|webm|mov)$/i.test(props.modelValue))

const send = async (file) => {
  if (!file) return

  isUploading.value = true
  percent.value = 0
  error.value = ''

  try {
    const url = await uploadFile(file, (value) => (percent.value = value))
    emit('update:modelValue', url)
  } catch (e) {
    error.value = e?.userMessage ?? e?.message ?? 'Fayl yüklənmədi'
  } finally {
    isUploading.value = false
  }
}

const onPick = (event) => send(event.target.files?.[0])

const onDrop = (event) => {
  isDragging.value = false
  send(event.dataTransfer?.files?.[0])
}
</script>

<style scoped>
.upload {
  width: 100%;
}

/* Fayl seçmə sahəsi */
.drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 130px;
  border: 2px dashed #e6dade;
  border-radius: 12px;
  background: #fbf9fa;
  cursor: pointer;
  padding: 16px;
  text-align: center;
  transition: all 0.15s;
}

.drop.small {
  min-height: 92px;
}

.drop:hover,
.drop.dragging {
  border-color: var(--gold);
  background: #fffdf7;
}

.drop.busy {
  cursor: progress;
}

.drop-icon {
  font-size: 1.5rem;
}

.drop b {
  font-size: 0.84rem;
  color: var(--ink-2);
}

.drop-hint {
  font-size: 0.72rem;
  color: var(--muted-2);
}

.bar {
  width: 70%;
  height: 5px;
  background: #ece5e8;
  border-radius: 20px;
  overflow: hidden;
  margin-top: 6px;
}

.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--brand), var(--gold));
  transition: width 0.2s;
}

/* Önizləmə */
.preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f6f1f3;
}

.preview img,
.preview video {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.preview.small img,
.preview.small video {
  height: 110px;
}

.remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(26, 17, 24, 0.65);
  color: #fff;
  cursor: pointer;
  font-size: 0.8rem;
}

.remove:hover {
  background: rgba(160, 44, 74, 0.9);
}

.err {
  margin: 6px 0 0;
  font-size: 0.76rem;
  color: var(--accent);
}
</style>
