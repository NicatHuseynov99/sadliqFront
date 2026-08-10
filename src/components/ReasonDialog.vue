<template>
  <!-- Səbəb soruşan pəncərə. Element Plus-un standart prompt-u öz input
       çərçivəsini gətirir və saytın üslubuna uymur — ona görə ayrıca
       komponent. Ləğv, moderasiya, təsdiqin geri alınması kimi hallarda
       eyni görünüş işlədilir. -->
  <el-dialog
    :model-value="true"
    width="480px"
    class="rd-dialog"
    :show-close="false"
    @close="$emit('close')"
  >
    <template #header>
      <div class="rd-head" :class="tone">
        <div>
          <span class="rd-caption">{{ caption }}</span>
          <b>{{ title }}</b>
        </div>
        <button class="rd-close" @click="$emit('close')">✕</button>
      </div>
    </template>

    <p v-if="text" class="rd-text">{{ text }}</p>

    <label class="rd-field">
      {{ label }}
      <textarea
        ref="inputEl"
        v-model="reason"
        rows="4"
        :maxlength="maxLength"
        :placeholder="placeholder"
      ></textarea>
      <em :class="{ warn: touched && !isValid }">
        <template v-if="touched && !isValid">Səbəbi yazın</template>
        <template v-else>{{ reason.length }} / {{ maxLength }}</template>
      </em>
    </label>

    <template #footer>
      <UiButton variant="ghost" @click="$emit('close')">İmtina</UiButton>
      <UiButton
        :variant="tone === 'danger' ? 'danger' : 'primary'"
        :is-loading="isSending"
        @click="submit"
      >
        {{ confirmText }}
      </UiButton>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'

const props = defineProps({
  caption: { type: String, default: 'Səbəb' },
  title: { type: String, required: true },
  text: { type: String, default: '' },

  label: { type: String, default: 'Səbəb' },
  placeholder: { type: String, default: 'Qısa izah yazın…' },
  confirmText: { type: String, default: 'Təsdiqlə' },

  // danger — geri alınmayan və ya zərərli əməliyyat
  tone: { type: String, default: 'brand' },

  maxLength: { type: Number, default: 500 },

  // Səbəb məcburidirmi
  required: { type: Boolean, default: true },

  isSending: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'submit'])

const reason = ref('')
const touched = ref(false)
const inputEl = ref(null)

const isValid = computed(() => !props.required || reason.value.trim().length > 0)

const submit = () => {
  touched.value = true
  if (!isValid.value) return

  emit('submit', reason.value.trim())
}

// Pəncərə açılan kimi yazmağa hazır olsun
onMounted(async () => {
  await nextTick()
  inputEl.value?.focus()
})
</script>

<style scoped>
:deep(.rd-dialog) {
  border-radius: 16px;
}

:deep(.rd-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:deep(.rd-dialog .el-dialog__body) {
  padding: 18px 20px 4px;
}

:deep(.rd-dialog .el-dialog__footer) {
  padding: 12px 20px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.rd-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff;
  padding: 14px 20px;
  border-radius: 16px 16px 0 0;
}

.rd-head.danger {
  background: linear-gradient(135deg, #8d1f38, var(--danger));
}

.rd-caption {
  display: block;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #f0d7de;
}

.rd-head b {
  display: block;
  font-size: 0.98rem;
  margin-top: 2px;
}

.rd-close {
  background: rgba(255, 255, 255, 0.16);
  border: none;
  color: #fff;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.72rem;
  flex-shrink: 0;
}

.rd-close:hover {
  background: rgba(255, 255, 255, 0.26);
}

.rd-text {
  margin: 0 0 14px;
  font-size: 0.83rem;
  color: var(--ink-2);
  line-height: 1.6;
}

.rd-field {
  display: block;
  font-size: 0.8rem;
  color: var(--ink-2);
  font-weight: 600;
}

.rd-field textarea {
  display: block;
  width: 100%;
  margin-top: 6px;
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  padding: 10px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  font-weight: 400;
  color: var(--ink);
  line-height: 1.55;
  outline: none;
  resize: vertical;
  transition: border-color var(--t-fast);
}

.rd-field textarea:focus {
  border-color: var(--gold);
}

.rd-field em {
  display: block;
  margin-top: 5px;
  font-style: normal;
  font-size: 0.71rem;
  color: var(--muted-2);
  font-weight: 400;
  text-align: right;
}

.rd-field em.warn {
  color: var(--danger);
  text-align: left;
}
</style>
