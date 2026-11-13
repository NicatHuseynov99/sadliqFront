<template>
  <!-- Saray tərəfinin rəyləri. Cavabsızlar yuxarıdadır — sahibin görməli
       olduğu iş elə odur. Əvvəl cavab yazmaq üçün hər sarayın ictimai
       səhifəsinə keçmək lazım gəlirdi. -->
  <section class="block" v-loading="isLoading">
    <div class="block-head">
      <div>
        <h2 class="block-title">Rəylər <em v-if="reviews.length">{{ reviews.length }}</em></h2>
        <p class="block-sub">
          <template v-if="unansweredCount">
            {{ unansweredCount }} rəy cavabsızdır — cavab yazmaq sarayın xeyrinədir,
            oxuyan yalnız bir tərəfin sözünü görür.
          </template>
          <template v-else-if="reviews.length">Bütün rəylərə cavab verilib.</template>
        </p>
      </div>

      <div class="filter-chips" v-if="reviews.length">
        <button class="chip" :class="{ active: filter === 'all' }" @click="filter = 'all'">
          Hamısı
        </button>
        <button class="chip" :class="{ active: filter === 'open' }" @click="filter = 'open'">
          Cavabsız <em v-if="unansweredCount">{{ unansweredCount }}</em>
        </button>
      </div>
    </div>

    <UiEmpty
      v-if="!isLoading && !visible.length"
      icon="⭐"
      :title="filter === 'open' ? 'Cavabsız rəy yoxdur.' : 'Hələ rəy yoxdur.'"
      :text="filter === 'open'
        ? 'Bütün rəylərə cavab verilib.'
        : 'Tədbir keçən qonaqlar rəy yazdıqca burada görünəcək.'"
    />

    <div v-else class="rev-list">
      <article v-for="r in visible" :key="r.id" class="rev-card" :class="{ open: !r.ownerReply }">
        <header class="rc-head">
          <div>
            <b>{{ r.author }}</b>
            <em v-if="r.isVerifiedGuest" class="verified"><IcoCheck class="ico" /> təsdiqlənmiş qonaq</em>
          </div>
          <span class="rc-stars">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
        </header>

        <span class="rc-meta">{{ r.venueName }} · {{ formatDateFull(r.date) }}</span>

        <p class="rc-text">{{ r.text }}</p>

        <!-- Mövcud cavab -->
        <div v-if="r.ownerReply && editingId !== r.id" class="rc-reply">
          <div class="rr-head">
            <b>Cavabınız</b>
            <span v-if="r.ownerRepliedAt">{{ formatDateFull(r.ownerRepliedAt.slice(0, 10)) }}</span>
          </div>
          <p>{{ r.ownerReply }}</p>
          <div class="rr-actions">
            <button class="link-btn" @click="startEdit(r)">Dəyiş</button>
            <el-popconfirm
              title="Cavabı silmək istəyirsiniz?"
              confirm-button-text="Bəli, sil"
              cancel-button-text="Xeyr"
              @confirm="removeReply(r)"
            >
              <template #reference>
                <button class="link-btn danger">Sil</button>
              </template>
            </el-popconfirm>
          </div>
        </div>

        <!-- Cavab yazma -->
        <div v-if="editingId === r.id" class="rc-form">
          <textarea
            v-model="draft"
            rows="3"
            maxlength="1000"
            placeholder="Cavabınız — bunu bütün ziyarətçilər görəcək…"
          ></textarea>
          <div class="rc-form-foot">
            <UiButton size="sm" :is-loading="isSaving" @click="submit(r)">
              {{ r.ownerReply ? 'Cavabı yenilə' : 'Cavab yaz' }}
            </UiButton>
            <button class="link-btn" @click="cancelEdit">İmtina</button>
          </div>
        </div>

        <UiButton
          v-else-if="!r.ownerReply"
          variant="ghost"
          size="sm"
          class="rc-answer"
          @click="startEdit(r)"
        >
          Cavab yaz
        </UiButton>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { toast } from '@/utils/toast'
import { formatDateFull } from '@/utils/date'
import UiButton from '@/components/ui/UiButton.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import { getOwnerReviews, replyToReview, deleteReviewReply } from '@/services/reviewService'

const reviews = ref([])
const isLoading = ref(false)
const filter = ref('all')

const editingId = ref(null)
const draft = ref('')
const isSaving = ref(false)

const unansweredCount = computed(() => reviews.value.filter((r) => !r.ownerReply).length)

const visible = computed(() =>
  filter.value === 'open' ? reviews.value.filter((r) => !r.ownerReply) : reviews.value,
)

const load = async () => {
  isLoading.value = true
  try {
    reviews.value = await getOwnerReviews()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Rəylər yüklənmədi')
  } finally {
    isLoading.value = false
  }
}

const startEdit = (review) => {
  editingId.value = review.id
  draft.value = review.ownerReply ?? ''
}

const cancelEdit = () => {
  editingId.value = null
  draft.value = ''
}

const submit = async (review) => {
  const text = draft.value.trim()
  if (!text) return toast.warning('Cavab mətni boş ola bilməz.')

  isSaving.value = true
  try {
    const message = await replyToReview(review.id, text)
    toast.success(message)
    cancelEdit()
    await load()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Cavab yazılmadı')
  } finally {
    isSaving.value = false
  }
}

const removeReply = async (review) => {
  try {
    const message = await deleteReviewReply(review.id)
    toast.success(message)
    await load()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Cavab silinmədi')
  }
}

load()
</script>

<style scoped>
.block {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 22px 24px;
  box-shadow: var(--shadow-1);
}

.block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.block-title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--ink);
}

.block-title em {
  font-style: normal;
  font-size: 0.78rem;
  color: var(--muted);
  margin-left: 6px;
}

.block-sub {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: var(--muted);
  max-width: 520px;
  line-height: 1.55;
}

.filter-chips {
  display: flex;
  gap: 6px;
}

.chip {
  background: var(--surface);
  border: 1px solid #ddccd3;
  border-radius: var(--r-pill);
  padding: 5px 14px;
  font-size: 0.77rem;
  color: var(--ink-2);
  cursor: pointer;
  transition: all var(--t-fast);
}

.chip:hover {
  border-color: var(--gold);
}

.chip.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.chip em {
  font-style: normal;
  margin-left: 4px;
  opacity: 0.85;
}

.rev-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rev-card {
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  padding: 13px 15px;
}

/* Cavabsız rəy gözə dəyməlidir — görüləsi iş odur */
.rev-card.open {
  border-left: 3px solid var(--warn);
}

.rc-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.rc-head b {
  font-size: 0.88rem;
  color: var(--ink);
}

.verified {
  font-style: normal;
  font-size: 0.67rem;
  color: var(--ok);
  background: var(--ok-soft);
  border-radius: var(--r-pill);
  padding: 2px 8px;
  margin-left: 6px;
}

.rc-stars {
  color: var(--gold);
  letter-spacing: 2px;
  white-space: nowrap;
}

.rc-meta {
  display: block;
  font-size: 0.72rem;
  color: var(--muted-2);
  margin-top: 2px;
}

.rc-text {
  margin: 8px 0 10px;
  font-size: 0.86rem;
  line-height: 1.55;
  color: var(--ink-2);
  white-space: pre-line;
}

.rc-reply {
  background: var(--brand-soft);
  border-left: 3px solid var(--brand);
  border-radius: 0 var(--r) var(--r) 0;
  padding: 9px 12px;
}

.rr-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.rr-head b {
  font-size: 0.77rem;
  color: var(--brand);
}

.rr-head span {
  font-size: 0.68rem;
  color: var(--muted-2);
}

.rc-reply p {
  margin: 3px 0 0;
  font-size: 0.83rem;
  line-height: 1.55;
  color: var(--ink-2);
  white-space: pre-line;
}

.rr-actions {
  display: flex;
  gap: 12px;
  margin-top: 7px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--brand);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.link-btn.danger {
  color: var(--danger);
}

.rc-form textarea {
  width: 100%;
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  padding: 9px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  resize: vertical;
}

.rc-form textarea:focus {
  border-color: var(--gold);
}

.rc-form-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 7px;
}
</style>
