<template>
  <div class="req-page" v-loading="isLoading">
    <div class="req-inner">
      <header class="page-head">
        <div>
          <h1 class="page-title">Sorğularım</h1>
          <p class="page-sub">
            Şərtlərinizi bir dəfə yazın — uyğun saraylar sizə təklif göndərsin.
            10 yerə zəng etmək əvəzinə təklifləri yan-yana müqayisə edin.
          </p>
        </div>
      </header>

      <!-- Elan qutusu: bağlı halda bir sətir, klikləyəndə forma açılır -->
      <section v-if="!hasOpenRequest && !isComposerOpen" class="composer" @click="isComposerOpen = true">
        <span class="composer-avatar">📣</span>
        <span class="composer-text">Toyunuz üçün nə axtarırsınız?</span>
        <span class="composer-btn">Elan yaz</span>
      </section>

      <!-- Yeni sorğu -->
      <section v-else-if="!hasOpenRequest" class="form-card">
        <header class="form-head">
          <h2 class="card-title">Şərtlərinizi yazın</h2>
          <button class="close-x" title="Bağla" @click="isComposerOpen = false">✕</button>
        </header>

        <!-- Yazdıqca elanın necə görünəcəyi -->
        <p class="preview-line">
          <b>{{ previewText }}</b>
          <em>— uyğun saraylar bunu görəcək</em>
        </p>

        <div class="form-grid">
          <label>
            Şəhər
            <select v-model="form.city">
              <option value="">Seçin</option>
              <option v-for="c in cities" :key="c.id ?? c.name" :value="c.name">{{ c.name }}</option>
            </select>
          </label>

          <label>
            Qonaq sayı
            <input v-model.number="form.guestCount" type="number" min="10" max="2000" />
          </label>

          <label>
            Nəfər başına büdcə <em>istəyə bağlı</em>
            <input v-model.number="form.budgetPerPerson" type="number" min="0" placeholder="₼" />
          </label>

          <label :class="{ off: form.isDateFlexible }">
            Tarix
            <input v-model="form.eventDate" type="date" :min="tomorrow" :disabled="form.isDateFlexible" />
          </label>

          <label class="check">
            <input v-model="form.isDateFlexible" type="checkbox" />
            Tarixim çevikdir — saray özü təklif etsin
          </label>

          <label class="check">
            <input v-model="form.needsParking" type="checkbox" />
            Parkinq vacibdir
          </label>

          <label class="wide">
            Əlavə istəklər <em>istəyə bağlı</em>
            <textarea
              v-model="form.note"
              rows="2"
              maxlength="500"
              placeholder="Məsələn: canlı musiqi, uşaq güşəsi, açıq hava terası"
            ></textarea>
          </label>
        </div>

        <div class="form-foot">
          <span class="foot-hint">Sorğu 7 gün açıq qalır və istədiyiniz an bağlaya bilərsiniz.</span>
          <button class="gold-btn" :disabled="isSending || !isValid" @click="submit">
            {{ isSending ? 'Göndərilir…' : 'Sorğunu paylaş' }}
          </button>
        </div>
      </section>

      <p v-else class="open-note">
        Açıq sorğunuz var. Yenisini göndərmək üçün əvvəlkini bağlayın.
      </p>

      <!-- Sorğular -->
      <section v-for="r in requests" :key="r.id" class="req-card" :class="requestStatusClass(r.status)">
        <header class="req-head">
          <div>
            <b>{{ r.city }} · {{ r.guestCount }} qonaq</b>
            <span class="req-meta">
              {{ r.isDateFlexible ? 'tarix çevikdir' : formatDate(r.eventDate) }}
              <template v-if="r.budgetPerPerson"> · {{ r.budgetPerPerson }} ₼ / nəfər</template>
              <template v-if="r.needsParking"> · parkinq lazımdır</template>
            </span>
          </div>

          <div class="head-right">
            <span class="req-status" :class="requestStatusClass(r.status)">{{ r.statusLabel }}</span>
            <button v-if="r.status === REQUEST_STATUS.open" class="ghost-btn small" @click="close(r)">
              Bağla
            </button>
          </div>
        </header>

        <p v-if="r.note" class="req-note">💬 {{ r.note }}</p>

        <!-- Təkliflər -->
        <div v-if="!r.offers.length && r.status === REQUEST_STATUS.open" class="waiting-box">
          <span class="waiting-icon">⏳</span>
          <div>
            <b>Təkliflər gözlənilir</b>
            <span>Uyğun saraylara göndərildi — gələn kimi bildiriş alacaqsınız.</span>
            <span class="waiting-time">{{ postedAgo(r) }} · {{ timeLeftText(r) }}</span>
          </div>
        </div>

        <p v-else-if="!r.offers.length" class="waiting">Bu sorğuya təklif gəlməyib.</p>

        <template v-else>
          <!-- Sıralama: qərar müqayisə ilə verilir, ona görə açar rəqəmlər üzrə -->
          <div class="sort-row">
            <span>Sırala:</span>
            <button
              v-for="s in sortOptions"
              :key="s.value"
              class="sort-chip"
              :class="{ on: sortBy === s.value }"
              @click="sortBy = s.value"
            >
              {{ s.label }}
            </button>
            <em class="sort-count">{{ r.offers.length }} təklif</em>
          </div>

          <!-- Yığcam sətirlər: bir ekranda 6 təklif görünür, detallar açılır -->
          <div class="offer-list">
            <article
              v-for="(o, i) in sortedOffers(r)"
              :key="o.id"
              class="offer-row"
              :class="{ accepted: o.status === 1, declined: o.status === 2, open: openOfferId === o.id }"
            >
              <img :src="o.venueImageUrl" :alt="o.venueName" loading="lazy" @error="onImgError" />

              <div class="row-main" @click="toggleOffer(o.id)">
                <div class="row-top">
                  <b>{{ o.venueName }}</b>
                  <span v-if="i === 0 && sortBy === 'price' && o.status === 0" class="best-tag">
                    ən sərfəli
                  </span>
                  <span v-if="o.rating" class="rating">★ {{ o.rating }}</span>
                  <span v-if="o.isChatOpen" class="chat-dot" title="Yazışma açıqdır">💬</span>
                </div>

                <span class="row-meta">
                  {{ formatDate(o.eventDate) }} · {{ o.hallName }} · {{ o.menuName }}
                </span>
              </div>

              <div class="row-price">
                <b>{{ o.pricePerPerson }} ₼</b>
                <span>{{ o.totalPrice.toLocaleString() }} ₼ cəmi</span>
              </div>

              <button class="row-toggle" @click="toggleOffer(o.id)">
                {{ openOfferId === o.id ? '▲' : '▼' }}
              </button>

              <!-- Detallar yalnız istəyəndə açılır -->
              <div v-if="openOfferId === o.id" class="row-detail">
                <dl class="offer-facts">
                  <div><dt>Şəhər</dt><dd>{{ o.city }}</dd></div>
                  <div><dt>Zal tutumu</dt><dd>{{ o.hallCapacity }} nəfər</dd></div>
                  <div v-if="o.parkingCapacity"><dt>Parkinq</dt><dd>{{ o.parkingCapacity }} avtomobil</dd></div>
                  <div v-if="o.reviewCount"><dt>Rəy sayı</dt><dd>{{ o.reviewCount }}</dd></div>
                </dl>

                <p class="offer-message">{{ o.message }}</p>
                <p v-if="o.lastMessage" class="last-msg">💬 {{ o.lastMessage }}</p>

                <div v-if="o.status === 0 && r.status === REQUEST_STATUS.open" class="offer-actions">
                  <template v-if="o.isChatOpen">
                    <button class="ghost-btn small" @click="openChat(o, r)">
                      Yazış<em v-if="o.unreadCount" class="badge">{{ o.unreadCount }}</em>
                    </button>
                    <button class="gold-btn small" @click="accept(o)">Bunu seçirəm</button>
                  </template>

                  <template v-else>
                    <button class="ghost-btn small" @click="decline(o)">Uyğun deyil</button>
                    <button class="ghost-btn small" @click="approve(o)">Təsdiqlə və yazış</button>
                    <button class="gold-btn small" @click="accept(o)">Bunu seçirəm</button>
                  </template>
                </div>

                <span v-else-if="o.status === 1" class="offer-tag ok">✓ Seçdiniz</span>
                <span v-else-if="o.status === 2" class="offer-tag">Siyahıdan çıxarıldı</span>
              </div>
            </article>
          </div>
        </template>
      </section>

      <div v-if="!isLoading && !requests.length && hasOpenRequest === false" class="empty-box">
        Hələ sorğu göndərməmisiniz.
      </div>
    </div>

    <OfferChat
      v-if="chat"
      :offer-id="chat.offerId"
      :is-customer="true"
      :title="chat.title"
      :subtitle="chat.subtitle"
      @close="closeChat"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { toast } from '@/utils/toast'
import {
  REQUEST_STATUS,
  acceptOffer,
  closeRequest,
  createRequest,
  declineOffer,
  getMyRequests,
  approveContact,
  requestStatusClass,
} from '@/services/venueRequestService'
import { getCities } from '@/services/platformService'
import OfferChat from '@/components/OfferChat.vue'

const isLoading = ref(false)
const isSending = ref(false)
const requests = ref([])
const cities = ref([])

const form = reactive({
  city: '',
  eventDate: '',
  isDateFlexible: false,
  guestCount: 200,
  budgetPerPerson: null,
  needsParking: false,
  note: '',
})

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

const hasOpenRequest = computed(() => requests.value.some((r) => r.status === REQUEST_STATUS.open))

const isValid = computed(
  () => form.city && form.guestCount >= 10 && (form.isDateFlexible || form.eventDate),
)

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=60'

const onImgError = (event) => {
  event.target.src = FALLBACK_IMAGE
}

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

// Sorğu nə vaxt paylaşılıb — quru «gözlənilir» yazısı əvəzinə nə baş verdiyini göstərir
const postedAgo = (r) => {
  const hours = Math.round((Date.now() - new Date(r.createdAt)) / 3600000)

  if (hours < 1) return 'bir az əvvəl paylaşıldı'
  if (hours < 24) return `${hours} saat əvvəl paylaşıldı`
  return `${Math.round(hours / 24)} gün əvvəl paylaşıldı`
}

// Sorğu nə vaxta qədər açıqdır — müştəri gözləməyin mənasını bilsin
const timeLeftText = (r) => {
  if (!r.expiresAt) return ''

  const hours = Math.round((new Date(r.expiresAt) - Date.now()) / 3600000)
  if (hours <= 0) return 'bağlanır'
  if (hours < 24) return `${hours} saat sonra bağlanacaq`
  return `${Math.round(hours / 24)} gün sonra bağlanacaq`
}

const load = async () => {
  isLoading.value = true
  try {
    requests.value = await getMyRequests()
  } finally {
    isLoading.value = false
  }
}

const submit = async () => {
  isSending.value = true

  try {
    const result = await createRequest({
      city: form.city,
      eventDate: form.isDateFlexible ? null : form.eventDate,
      isDateFlexible: form.isDateFlexible,
      guestCount: form.guestCount,
      budgetPerPerson: form.budgetPerPerson || null,
      needsParking: form.needsParking,
      note: form.note.trim() || null,
    })

    toast.success(result.message)
    form.note = ''
    isComposerOpen.value = false
    await load()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Sorğu göndərilmədi')
  } finally {
    isSending.value = false
  }
}

const close = async (request) => {
  try {
    const message = await closeRequest(request.id)
    toast.success(message)
    await load()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

// Təklifi seçmək rezerv yaradır — geri qaytarılmır, ona görə təsdiq soruşulur
const accept = async (offer) => {
  try {
    await ElMessageBox.confirm(
      `${offer.venueName} · ${formatDate(offer.eventDate)} · ${offer.totalPrice.toLocaleString()} ₼. ` +
        'Bu təklif seçiləcək və rezerv yaradılacaq.',
      'Təklifi seçirsiniz?',
      { confirmButtonText: 'Bəli, seçirəm', cancelButtonText: 'İmtina' },
    )
  } catch {
    return
  }

  try {
    const message = await acceptOffer(offer.id)
    toast.success(message)
    await load()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

// ————— təkliflərin sıralanması və açılışı —————

// Elan qutusu bağlı başlayır — səhifə forma divarı ilə açılmasın
const isComposerOpen = ref(false)

// Elanın canlı önizləməsi: müştəri nə yazdığını bir sətirdə görür
const previewText = computed(() => {
  const parts = [form.city || 'Şəhər seçin']

  parts.push(`${form.guestCount || 0} qonaq`)

  if (form.isDateFlexible) parts.push('tarix çevikdir')
  else if (form.eventDate) parts.push(formatDate(form.eventDate))

  if (form.budgetPerPerson) parts.push(`${form.budgetPerPerson} ₼ / nəfər`)
  if (form.needsParking) parts.push('parkinq lazımdır')

  return parts.join(' · ')
})

const sortOptions = [
  { value: 'price', label: 'Ən ucuz' },
  { value: 'rating', label: 'Ən yüksək reytinq' },
  { value: 'date', label: 'Ən yaxın tarix' },
]

const sortBy = ref('price')
const openOfferId = ref(null)

const toggleOffer = (id) => {
  openOfferId.value = openOfferId.value === id ? null : id
}

// Cavab verilmiş təkliflər aşağı düşür — qərar açıq olanlar arasında verilir
const sortedOffers = (request) => {
  const list = [...request.offers]

  return list.sort((a, b) => {
    if (a.status !== b.status) return a.status - b.status

    if (sortBy.value === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
    if (sortBy.value === 'date') return new Date(a.eventDate) - new Date(b.eventDate)

    return a.pricePerPerson - b.pricePerPerson
  })
}

// Təsdiq rezerv yaratmır — yalnız yazışmanı açır.
// Müştəri əvvəlcə danışır, sonra qərar verir.
const approve = async (offer) => {
  try {
    const message = await approveContact(offer.id)
    toast.success(message)
    await load()

    const request = requests.value.find((r) => r.offers.some((o) => o.id === offer.id))
    const fresh = request?.offers.find((o) => o.id === offer.id)
    if (fresh) openChat(fresh, request)
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

// Açıq yazışma
const chat = ref(null)

const openChat = (offer, request) => {
  chat.value = {
    offerId: offer.id,
    title: offer.venueName,
    subtitle: `${formatDate(offer.eventDate)} · ${request?.guestCount ?? ''} qonaq · ${offer.pricePerPerson} ₼ / nəfər`,
  }
}

const closeChat = async () => {
  chat.value = null
  await load()
}

const decline = async (offer) => {
  try {
    const message = await declineOffer(offer.id)
    toast.success(message)
    await load()
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  }
}

onMounted(async () => {
  cities.value = await getCities()
  await load()
})
</script>

<style scoped>
.req-page {
  background: var(--bg);
  min-height: 100vh;
  padding: 28px 20px 60px;
}

.req-inner {
  max-width: 1120px;
  margin: 0 auto;
}

.page-head {
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 5px;
  font-size: 1.5rem;
  color: var(--ink);
}

.page-sub {
  margin: 0;
  font-size: 0.86rem;
  color: #6c757d;
  line-height: 1.6;
  max-width: 640px;
}

/* Elan qutusu — bağlı hal */
.composer {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 14px 18px;
  margin-bottom: 18px;
  cursor: pointer;
  box-shadow: var(--shadow-1);
  transition: border-color var(--t-fast), box-shadow var(--t-fast);
}

.composer:hover {
  border-color: var(--gold);
  box-shadow: var(--shadow-2);
}

.composer-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--brand-soft);
  display: grid;
  place-items: center;
  font-size: 1.1rem;
}

.composer-text {
  flex: 1;
  color: var(--muted);
  font-size: var(--fs-md);
}

.composer-btn {
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff;
  padding: 9px 20px;
  border-radius: var(--r);
  font-size: var(--fs-sm);
  font-weight: 700;
  white-space: nowrap;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.close-x {
  background: none;
  border: none;
  color: var(--faint);
  font-size: 0.85rem;
  cursor: pointer;
}

.close-x:hover {
  color: var(--accent);
}

/* Canlı önizləmə */
.preview-line {
  margin: 0 0 14px;
  background: var(--gold-soft);
  border-radius: var(--r);
  padding: 10px 14px;
  font-size: var(--fs-sm);
}

.preview-line b {
  color: var(--ink);
}

.preview-line em {
  font-style: normal;
  color: var(--warn);
  margin-left: 6px;
}

/* Forma */
.form-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 20px 24px 18px;
  margin-bottom: 18px;
}

.card-title {
  margin: 0 0 14px;
  font-size: 0.95rem;
  color: var(--ink);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 12px 14px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--muted);
}

label.wide {
  grid-column: 1 / -1;
}

label.check {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding-top: 22px;
  color: var(--ink-2);
  font-size: 0.8rem;
}

label.off {
  opacity: 0.5;
}

label em {
  font-style: normal;
  color: var(--faint);
}

input,
select,
textarea {
  border: 1px solid var(--line-2);
  border-radius: 9px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: var(--ink);
  outline: none;
  font-family: inherit;
  background: #fff;
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--gold);
}

.form-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.foot-hint {
  font-size: 0.76rem;
  color: var(--muted-2);
}

.open-note {
  background: var(--warn-soft);
  border: 1px solid #f5e3c8;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 0.83rem;
  color: var(--warn);
  margin: 0 0 18px;
}

/* Sorğu kartı */
.req-card {
  background: #fff;
  border: 1px solid var(--line);
  border-left: 4px solid var(--gold);
  border-radius: 14px;
  padding: 16px 20px 18px;
  margin-bottom: 14px;
}

.req-card.done {
  border-left-color: #1e7e34;
}

.req-card.closed,
.req-card.expired {
  border-left-color: #ced4da;
  opacity: 0.75;
}

.req-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.req-head b {
  font-size: 0.95rem;
  color: var(--ink);
}

.req-meta {
  display: block;
  font-size: 0.78rem;
  color: var(--muted);
  margin-top: 3px;
}

.head-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.req-status {
  font-size: 0.7rem;
  padding: 3px 11px;
  border-radius: 20px;
  background: var(--gold-soft);
  color: var(--warn);
}

.req-status.done {
  background: #e5f4ea;
  color: var(--ok);
}

.req-status.closed,
.req-status.expired {
  background: #f1f3f5;
  color: var(--muted);
}

.req-note {
  margin: 10px 0 0;
  font-size: 0.8rem;
  color: #6c757d;
}

.waiting {
  margin: 14px 0 0;
  font-size: 0.82rem;
  color: var(--muted-2);
}

/* Cavab gözlənilən sorğu — nə baş verdiyi görünür, quru cümlə deyil */
.waiting-box {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: var(--info-soft, var(--info-soft));
  border-radius: var(--r, 11px);
  padding: 14px 16px;
  margin-top: 14px;
}

.waiting-icon {
  font-size: 1.3rem;
  animation: waiting-pulse 2s ease-in-out infinite;
}

@keyframes waiting-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.waiting-box b {
  display: block;
  font-size: 0.86rem;
  color: var(--ink, var(--ink));
  margin-bottom: 3px;
}

.waiting-box span {
  display: block;
  font-size: 0.78rem;
  color: var(--muted, #6c757d);
  line-height: 1.5;
}

.waiting-time {
  margin-top: 4px;
  color: var(--info, var(--info)) !important;
  font-weight: 600;
}

/* Təkliflər */
/* Sıralama sətri */
.sort-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 14px 0 10px;
  font-size: var(--fs-xs);
  color: var(--muted);
  flex-wrap: wrap;
}

.sort-chip {
  background: var(--surface);
  border: 1px solid var(--line-2);
  color: var(--muted);
  padding: 5px 12px;
  border-radius: var(--r-pill);
  font-size: var(--fs-xs);
  cursor: pointer;
  transition: all var(--t-fast);
}

.sort-chip:hover {
  border-color: var(--gold);
}

.sort-chip.on {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.sort-count {
  margin-left: auto;
  font-style: normal;
  color: var(--faint);
}

/* Yığcam təklif sətirləri */
.offer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.offer-row {
  display: grid;
  grid-template-columns: 64px 1fr auto auto;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r);
  padding: 9px 12px;
  transition: border-color var(--t-fast), box-shadow var(--t-fast);
}

.offer-row:hover {
  border-color: #e4d5db;
  box-shadow: var(--shadow-1);
}

.offer-row.open {
  border-color: var(--gold);
}

.offer-row.accepted {
  border-color: #b6ddc4;
  background: #fbfefc;
}

.offer-row.declined {
  opacity: 0.55;
}

.offer-row > img {
  width: 64px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--r-sm);
}

.row-main {
  min-width: 0;
  cursor: pointer;
}

.row-top {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.row-top b {
  font-size: var(--fs-md);
  color: var(--ink);
}

.best-tag {
  background: var(--ok-soft);
  color: var(--ok);
  font-size: 0.66rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--r-pill);
}

.chat-dot {
  font-size: 0.8rem;
}

.row-meta {
  display: block;
  font-size: var(--fs-xs);
  color: var(--muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-price {
  text-align: right;
  white-space: nowrap;
}

.row-price b {
  display: block;
  font-size: var(--fs-lg);
  color: var(--brand);
  line-height: 1.15;
}

.row-price span {
  font-size: 0.7rem;
  color: var(--muted-2);
}

.row-toggle {
  background: none;
  border: none;
  color: var(--faint);
  cursor: pointer;
  font-size: 0.7rem;
  padding: 6px;
}

.row-detail {
  grid-column: 1 / -1;
  border-top: 1px dashed var(--line);
  padding-top: 10px;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .offer-row {
    grid-template-columns: 52px 1fr auto;
  }

  .row-toggle {
    display: none;
  }
}

.offer {
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.offer.accepted {
  border-color: #b6ddc4;
}

.offer.declined {
  opacity: 0.55;
}

.offer img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.offer-body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.offer-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.offer-top b {
  font-size: 0.88rem;
  color: var(--ink);
}

.rating {
  font-size: 0.76rem;
  color: var(--warn);
  white-space: nowrap;
}

.rating em {
  font-style: normal;
  color: var(--faint);
}

.offer-city {
  font-size: 0.74rem;
  color: var(--muted-2);
  margin-top: 2px;
}

.offer-facts {
  margin: 10px 0 0;
  font-size: 0.76rem;
}

.offer-facts div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 3px 0;
  border-bottom: 1px dashed #f6f0f2;
}

.offer-facts dt {
  color: var(--muted-2);
}

.offer-facts dd {
  margin: 0;
  color: var(--ink-2);
  text-align: right;
}

.offer-message {
  margin: 10px 0 0;
  font-size: 0.78rem;
  color: #6c757d;
  line-height: 1.5;
  white-space: pre-line;
  flex: 1;
}

.offer-price {
  margin-top: 12px;
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.offer-price b {
  font-size: 1.1rem;
  color: var(--brand);
}

.offer-price span {
  font-size: 0.74rem;
  color: var(--muted-2);
}

.offer-price em {
  margin-left: auto;
  font-style: normal;
  font-size: 0.76rem;
  color: #6c757d;
}

.offer-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.last-msg {
  margin: 9px 0 0;
  font-size: 0.74rem;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: inline-block;
  margin-left: 5px;
  background: var(--accent);
  color: #fff;
  font-style: normal;
  font-size: 0.66rem;
  padding: 0 6px;
  border-radius: 20px;
}

.offer-tag {
  margin-top: 12px;
  font-size: 0.76rem;
  color: var(--muted);
}

.offer-tag.ok {
  color: var(--ok);
  font-weight: 600;
}

/* Düymələr */
.gold-btn {
  background: linear-gradient(135deg, var(--brand), var(--accent));
  border: none;
  color: #fff;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.gold-btn.small {
  padding: 7px 15px;
  font-size: 0.78rem;
  flex: 1;
}

.gold-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ghost-btn {
  background: #fff;
  border: 1px solid #ece5e8;
  color: var(--brand);
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.ghost-btn.small {
  padding: 6px 13px;
  font-size: 0.76rem;
  flex: 1;
}

.ghost-btn:hover {
  border-color: var(--gold);
}

.empty-box {
  background: #fff;
  border: 1px dashed #eadfe3;
  border-radius: 14px;
  padding: 30px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted-2);
}

@media (max-width: 780px) {
  .req-page {
    padding: 22px 14px 50px;
  }

  .composer {
    flex-wrap: wrap;
  }

  .composer-text {
    flex-basis: 100%;
    order: 3;
  }

  .req-head {
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  label.check {
    padding-top: 0;
  }
}
</style>
