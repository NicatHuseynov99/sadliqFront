<template>
  <div ref="root" class="bell-wrap">
    <button
      class="bell"
      :class="{ active: isOpen }"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :aria-label="unread > 0 ? `Bildirişlər, ${unread} oxunmamış` : 'Bildirişlər'"
      @click="toggle"
    >
      <IcoBell class="ico" />
      <span v-if="unread > 0" class="dot">{{ unread > 99 ? '99+' : unread }}</span>
    </button>

    <div v-if="isOpen" class="panel" role="menu">
      <header class="panel-head">
        <b>Bildirişlər</b>
        <button v-if="unread > 0" class="link-btn" @click="readAll">Hamısını oxundu et</button>
      </header>

      <div v-loading="isLoading" class="panel-body">
        <p v-if="!items.length && !isLoading" class="empty">Hələ bildiriş yoxdur.</p>

        <article
          v-for="n in items"
          :key="n.id"
          class="item"
          :class="{ unread: !n.isRead }"
          @click="open(n)"
        >
          <span class="icon">{{ icon(n.type) }}</span>

          <div class="text">
            <div class="row">
              <b>{{ n.title }}</b>
              <span class="time">{{ ago(n.createdAt) }}</span>
            </div>
            <p>{{ n.body }}</p>
            <span class="tag">{{ n.typeLabel }}</span>
          </div>

          <button class="del" title="Sil" aria-label="Bildirişi sil" @click.stop="remove(n)"><IcoX class="ico" /></button>
        </article>
      </div>

      <footer v-if="hasMore" class="panel-foot">
        <button class="link-btn" @click="loadMore">Daha çox göstər</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  deleteNotification,
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  registerClick,
} from '@/services/notificationService'

const router = useRouter()

const root = ref(null)
const isOpen = ref(false)
const isLoading = ref(false)
const items = ref([])
const unread = ref(0)
const page = ref(1)
const hasMore = ref(false)

let timer = null

// Zəngin rəqəmi arxa fonda yenilənir — ağır sorğu deyil, yalnız say gəlir
const refreshCount = async () => {
  try {
    unread.value = await getUnreadCount()
  } catch {
    // Sessiya bitibsə səssiz keç
  }
}

const load = async (reset = true) => {
  isLoading.value = true

  try {
    if (reset) page.value = 1

    const feed = await getMyNotifications({ page: page.value, pageSize: 8 })

    items.value = reset ? feed.items : [...items.value, ...feed.items]
    unread.value = feed.unreadCount
    hasMore.value = feed.hasMore
  } finally {
    isLoading.value = false
  }
}

const loadMore = () => {
  page.value += 1
  load(false)
}

const toggle = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) load()
}

const close = () => {
  isOpen.value = false
}

// Kənara klik pəncərəni bağlayır
const onDocumentClick = (event) => {
  if (isOpen.value && root.value && !root.value.contains(event.target)) close()
}

// Esc ilə də bağlanır — klaviatura ilə açılan pəncərəni əl ilə bağlamaq lazım olmasın
const onKeydown = (event) => {
  if (event.key === 'Escape' && isOpen.value) close()
}

// Bildirişə klik: oxundu sayılır və linkinə keçilir
const open = async (n) => {
  await registerClick(n.id)
  n.isRead = true
  unread.value = Math.max(0, unread.value - 1)

  if (n.link) {
    close()
    router.push(n.link)
  }
}

const readAll = async () => {
  await markAllRead()
  items.value.forEach((n) => (n.isRead = true))
  unread.value = 0
}

const remove = async (n) => {
  await deleteNotification(n.id)
  items.value = items.value.filter((x) => x.id !== n.id)
  if (!n.isRead) unread.value = Math.max(0, unread.value - 1)
}

const icon = (type) =>
  ({
    0: '📣',
    1: '📩',
    2: '✅',
    3: '🚫',
    4: '⏰',
    5: '⌛',
    6: '🏛',
    7: '⚠️',
    8: '⭐',
  })[type] ?? '🔔'

// «2 saat əvvəl» kimi qısa yazı
const ago = (value) => {
  const minutes = Math.floor((Date.now() - new Date(value)) / 60000)

  if (minutes < 1) return 'indicə'
  if (minutes < 60) return `${minutes} dəq`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} saat`
  if (minutes < 10080) return `${Math.floor(minutes / 1440)} gün`

  return new Date(value).toLocaleDateString('az-AZ')
}

onMounted(() => {
  refreshCount()
  timer = setInterval(refreshCount, 60000)
  document.addEventListener("click", onDocumentClick)
  document.addEventListener("keydown", onKeydown)
})

onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener("click", onDocumentClick)
  document.removeEventListener("keydown", onKeydown)
})
</script>

<style scoped>
.bell-wrap {
  position: relative;
}

.bell {
  background: transparent;
  border: none;
  font-size: 1.15rem;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 9px;
  position: relative;
  line-height: 1;
  transition: background 0.15s;
}

.bell:hover,
.bell.active {
  background: rgba(255, 255, 255, 0.09);
}

/* 0.62rem (9.9px) oxunmurdu -- reqem nisani ucun de asagi hedd var. */
.dot {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--accent);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel {
  position: absolute;
  top: 42px;
  right: 0;
  width: 370px;
  /* Panel «position: absolute»dır və mövqe atası zəngin özüdür (30-40px),
     ona görə «100%» buradan hesablanıb pəncərəni demək olar sıfır enə
     sıxırdı. Üfüqi sürüşmə artıq html/body səviyyəsində bağlı olduğu üçün
     «100vw» burada təhlükəsizdir — yenidən görünürdü qaytarırıq. */
  max-width: calc(100vw - 32px);
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 18px 44px rgba(26, 17, 24, 0.28);
  overflow: hidden;
  z-index: 200;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f4eef0;
}

.panel-head b {
  font-size: 0.9rem;
  color: var(--ink);
}

.link-btn {
  background: none;
  border: none;
  color: var(--brand);
  font-size: 0.76rem;
  cursor: pointer;
  font-weight: 600;
}

.link-btn:hover {
  text-decoration: underline;
}

.panel-body {
  max-height: 380px;
  overflow-y: auto;
}

.item {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #faf6f7;
  cursor: pointer;
  position: relative;
  transition: background 0.12s;
}

.item:hover {
  background: #fdfbfc;
}

.item.unread {
  background: #fdf7f2;
}

.item.unread::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 20px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold);
}

.icon {
  font-size: 1.05rem;
  flex-shrink: 0;
}

.text {
  flex: 1;
  min-width: 0;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.row b {
  font-size: 0.82rem;
  color: var(--ink);
}

.time {
  font-size: 0.68rem;
  color: #b8a9af;
  white-space: nowrap;
}

.text p {
  margin: 3px 0 5px;
  font-size: 0.76rem;
  color: var(--muted);
  line-height: 1.5;
  white-space: pre-line;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tag {
  font-size: 0.64rem;
  background: var(--brand-soft);
  color: var(--brand);
  padding: 2px 8px;
  border-radius: 20px;
}

.del {
  background: none;
  border: none;
  color: #d8cdd1;
  cursor: pointer;
  font-size: 0.72rem;
  align-self: flex-start;
}

.del:hover {
  color: var(--accent);
}

.empty {
  padding: 26px 16px;
  text-align: center;
  font-size: 0.8rem;
  color: var(--muted-2);
  margin: 0;
}

.panel-foot {
  padding: 9px 16px;
  text-align: center;
  border-top: 1px solid #f4eef0;
}

/* Zəng ikonu tünd başlıqda görünsün (emoji əvəzinə xətt ikonudur) */
.bell {
  color: var(--gold);
}

.bell .ico {
  width: 22px;
  height: 22px;
  display: block;
}
</style>
