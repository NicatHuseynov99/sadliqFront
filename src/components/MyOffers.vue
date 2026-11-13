<template>
  <!-- Sahibin göndərdiyi təkliflər və müştəri ilə yazışmalar. -->
  <div class="my-offers" v-loading="isLoading">
    <UiEmpty v-if="!isLoading && !offers.length" icon="📨" title="Hələ təklif göndərməmisiniz. «Açıq sorğular» bölməsindən başlayın." />

    <article v-for="o in offers" :key="o.id" class="offer" :class="statusClass(o.status)">
      <div class="main">
        <div class="top">
          <b>{{ o.venueName }}</b>
          <span class="status" :class="statusClass(o.status)">{{ o.statusLabel }}</span>
          <span v-if="o.isChatOpen" class="chat-tag">yazışma açıqdır</span>
        </div>

        <span class="meta">
          {{ o.customerName }} · {{ o.city }} · {{ o.guestCount }} qonaq ·
          {{ formatDate(o.eventDate) }}
        </span>

        <p v-if="o.lastMessage" class="last"><IcoMessageCircle class="ico" /> {{ o.lastMessage }}</p>
      </div>

      <div class="price">
        <b>{{ o.pricePerPerson }} ₼</b>
        <span>/ nəfər</span>
        <em>{{ o.totalPrice.toLocaleString() }} ₼</em>
      </div>

      <button
        v-if="o.isChatOpen"
        class="chat-btn"
        @click="openChat(o)"
      >
        Yazış<i v-if="o.unreadCount" class="badge">{{ o.unreadCount }}</i>
      </button>

      <span v-else class="waiting">müştərinin təsdiqi gözlənilir</span>
    </article>

    <OfferChat
      v-if="chat"
      :offer-id="chat.offerId"
      :is-customer="false"
      :title="chat.title"
      :subtitle="chat.subtitle"
      @close="closeChat"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import OfferChat from '@/components/OfferChat.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import { getMyOffers } from '@/services/venueRequestService'

const isLoading = ref(false)
const offers = ref([])
const chat = ref(null)

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const statusClass = (status) =>
  ({ 0: 'sent', 1: 'accepted', 2: 'declined', 3: 'withdrawn' })[status] ?? 'sent'

const load = async () => {
  isLoading.value = true
  try {
    offers.value = await getMyOffers()
  } finally {
    isLoading.value = false
  }
}

const openChat = (offer) => {
  chat.value = {
    offerId: offer.id,
    title: offer.customerName,
    subtitle: `${formatDate(offer.eventDate)} · ${offer.guestCount} qonaq · ${offer.pricePerPerson} ₼ / nəfər`,
  }
}

const closeChat = async () => {
  chat.value = null
  await load()
}

onMounted(load)
</script>

<style scoped>
.my-offers {
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-height: 120px;
}

.offer {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border: 1px solid var(--line);
  border-left: 4px solid #cfdcec;
  border-radius: 12px;
  padding: 13px 17px;
}

.offer.accepted {
  border-left-color: var(--ok);
}

.offer.declined,
.offer.withdrawn {
  border-left-color: var(--faint);
  opacity: 0.7;
}

.main {
  flex: 1;
  min-width: 0;
}

.top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.top b {
  font-size: 0.88rem;
  color: var(--ink);
}

.status {
  font-size: 0.68rem;
  padding: 2px 9px;
  border-radius: 20px;
  background: #eaf1fa;
  color: var(--info);
}

.status.accepted {
  background: #e5f4ea;
  color: var(--ok);
}

.status.declined,
.status.withdrawn {
  background: var(--surface-2);
  color: var(--muted);
}

.chat-tag {
  font-size: 0.68rem;
  color: var(--ok);
}

.meta {
  display: block;
  font-size: 0.77rem;
  color: var(--muted);
  margin-top: 3px;
}

.last {
  margin: 5px 0 0;
  font-size: 0.75rem;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 420px;
}

.price {
  text-align: right;
  flex-shrink: 0;
}

.price b {
  font-size: 1rem;
  color: var(--brand);
}

.price span {
  font-size: 0.7rem;
  color: var(--muted-2);
}

.price em {
  display: block;
  font-style: normal;
  font-size: 0.73rem;
  color: var(--muted);
}

.chat-btn {
  background: #fff;
  border: 1px solid #cfdcec;
  color: var(--info);
  padding: 7px 16px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.chat-btn:hover {
  background: #f4f8fd;
  border-color: var(--info);
}

.badge {
  display: inline-block;
  margin-left: 6px;
  background: var(--accent);
  color: #fff;
  font-style: normal;
  font-size: 0.66rem;
  padding: 0 6px;
  border-radius: 20px;
}

.waiting {
  font-size: 0.74rem;
  color: var(--muted-2);
  flex-shrink: 0;
}

.empty-box {
  background: #fff;
  border: 1px dashed var(--line);
  border-radius: 14px;
  padding: 30px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted-2);
}
</style>
