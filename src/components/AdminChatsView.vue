<template>
  <!-- Müştəri ilə saray arasındakı yazışmalara adminin nəzarəti.
       Mübahisə olanda tərəflərin nə danışdığını burada oxumaq olur.
       Yalnız oxumaq üçündür — admin yazışmaya müdaxilə edə bilmir. -->
  <section class="block">
    <div class="block-head">
      <div>
        <h2 class="block-title">Yazışmalar <em v-if="total">{{ total }}</em></h2>
        <p class="block-sub">
          Müştəri təklifi təsdiqləyəndən sonra açılan söhbətlər. Baxışınız jurnala düşür.
        </p>
      </div>
      <input
        v-model="search"
        class="search-box"
        type="search"
        placeholder="Saray, müştəri və ya mesaj mətni…"
        @input="onSearchInput"
      />
    </div>

    <div class="chat-layout">
      <!-- Söhbətlərin siyahısı -->
      <div class="chat-list" v-loading="isLoading">
        <button
          v-for="c in chats"
          :key="rowKey(c)"
          class="chat-row"
          :class="{ active: activeId === rowKey(c) }"
          @click="open(c)"
        >
          <div class="cr-top">
            <b class="cr-venue">{{ c.venueName }}</b>
            <span class="cr-time">{{ shortTime(c.lastMessageAt ?? c.chatOpenedAt) }}</span>
          </div>

          <span class="cr-customer">
            {{ c.customerName }}
            <!-- Lentin kökü: təklifsiz, birbaşa edilmiş rezerv ayrıca işarələnir -->
            <em v-if="c.threadKind === 'Reservation'" class="cr-kind">birbaşa rezerv</em>
          </span>

          <p class="cr-preview">
            <span v-if="c.lastMessagePreview" class="cr-who">
              {{ c.lastMessageFromCustomer ? 'Müştəri:' : 'Saray:' }}
            </span>
            {{ c.lastMessagePreview || 'Hələ mesaj yazılmayıb' }}
          </p>

          <div class="cr-foot">
            <span class="cr-chip">{{ c.messageCount }} mesaj</span>
            <span class="cr-chip">{{ formatDateFull(c.eventDate?.slice(0, 10)) }}</span>
            <span class="cr-chip">{{ c.guestCount }} qonaq</span>
          </div>
        </button>

        <UiEmpty
          v-if="!isLoading && !chats.length"
          icon="💬"
          title="Yazışma tapılmadı."
          :text="search ? 'Axtarışa uyğun söhbət yoxdur.' : 'Hələ heç bir təklif üzrə söhbət açılmayıb.'"
        />

        <Pager :page="page" :page-size="pageSize" :total="total" @change="goPage" />
      </div>

      <!-- Seçilmiş söhbətin tam mətni -->
      <div class="chat-detail" v-loading="isLoadingDetail">
        <template v-if="detail">
          <header class="cd-head">
            <div>
              <b>{{ detail.venueName }}</b>
              <span class="cd-sub">
                {{ detail.customerName }} ↔ {{ detail.ownerName }}
              </span>
            </div>
            <span class="cd-status">{{ detail.offerStatus }}</span>
          </header>

          <div class="cd-facts">
            <span><i>Tarix</i>{{ formatDateFull(detail.eventDate?.slice(0, 10)) }}</span>
            <span><i>Qonaq</i>{{ detail.guestCount }}</span>
            <span><i>Nəfər başı</i>{{ detail.pricePerPerson }} ₼</span>
            <span><i>Açılıb</i>{{ shortTime(detail.chatOpenedAt) }}</span>
          </div>

          <div class="cd-body">
            <p v-if="!detail.messages.length" class="cd-empty">
              Söhbət açılıb, amma hələ mesaj yazılmayıb.
            </p>

            <!-- Admin kənar müşahidəçidir: müştəri solda, saray sağda -->
            <div
              v-for="m in detail.messages"
              :key="m.id"
              class="msg"
              :class="{ venue: !m.isFromCustomer }"
            >
              <span class="who">
                {{ m.senderName }} · {{ m.isFromCustomer ? 'müştəri' : 'saray' }}
              </span>
              <div class="bubble" :class="{ hidden: m.isHidden }">
                <p>{{ m.body }}</p>

                <!-- Gizlədilmiş mesaj tərəflərə görünmür, admin görür -->
                <p v-if="m.isHidden" class="hidden-note">
                  🚫 Gizlədilib{{ m.hiddenReason ? `: ${m.hiddenReason}` : '' }}
                </p>

                <span class="time">
                  {{ shortTime(m.createdAt) }}
                  <template v-if="m.isRead"> · oxunub</template>
                </span>
              </div>

              <button class="hide-btn" @click="askHide(m)">
                {{ m.isHidden ? 'Yenidən göstər' : 'Gizlət' }}
              </button>
            </div>
          </div>
        </template>

        <UiEmpty
          v-else-if="!isLoadingDetail"
          icon="👈"
          title="Söhbət seçin"
          text="Soldakı siyahıdan bir yazışma seçin — bütün mesajlar burada görünəcək."
        />
      </div>
    </div>

    <!-- Mesajın gizlədilməsi: silinmir, yalnız tərəflərdən gizlədilir -->
    <ReasonDialog
      v-if="hideTarget"
      caption="Moderasiya"
      title="Mesajı gizlət"
      text="Bu mesaj müştəriyə və saraya görünməyəcək. Mesajın özü silinmir — siz onu səbəbi ilə birlikdə görməkdə davam edəcəksiniz."
      label="Gizlətmə səbəbi"
      placeholder="Məsələn: təhqiredici məzmun."
      confirm-text="Gizlət"
      tone="danger"
      :is-sending="isHiding"
      @close="hideTarget = null"
      @submit="(reason) => applyHide(hideTarget, true, reason)"
    />
  </section>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { toast } from '@/utils/toast'
import { formatDateFull } from '@/utils/date'
import Pager from '@/components/Pager.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import ReasonDialog from '@/components/ReasonDialog.vue'
import { searchChats, getChat, setMessageHidden } from '@/services/adminChatService'

const chats = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

const search = ref('')
const isLoading = ref(false)

const activeId = ref(null)

// Açıq lentin özü saxlanılır: gizlətmədən sonra onu yenidən yükləmək üçün
// həm nömrə, həm də növ lazımdır — tək nömrə kifayət etmir.
const activeChat = ref(null)
const detail = ref(null)
const isLoadingDetail = ref(false)

const load = async () => {
  isLoading.value = true
  try {
    const result = await searchChats({
      search: search.value.trim() || undefined,
      page: page.value,
      pageSize,
    })
    chats.value = result.items
    total.value = result.totalCount
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Yazışmalar yüklənmədi')
  } finally {
    isLoading.value = false
  }
}

// Hər hərfdə sorğu getməsin deyə yazmaq bitəndən sonra axtarırıq
let searchTimer = null
const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
}

const goPage = (value) => {
  page.value = value
  load()
}

// Təklif və rezerv nömrələri ayrı-ayrı sıralardır — 31 nömrəli təklif ilə
// 31 nömrəli rezerv toqquşmasın deyə açar növlə birlikdə qurulur.
const rowKey = (c) => `${c.threadKind}:${c.threadId}`

const open = async (chat) => {
  activeId.value = rowKey(chat)
  activeChat.value = chat
  isLoadingDetail.value = true
  try {
    detail.value = await getChat(chat.threadId, chat.threadKind)
  } catch (e) {
    detail.value = null
    activeId.value = null
    activeChat.value = null
    toast.error(e?.userMessage ?? e?.message ?? 'Yazışma açılmadı')
  } finally {
    isLoadingDetail.value = false
  }
}

// Gizlədəndə səbəb məcburidir — nəyə görə çıxarıldığı qeyd olunmalıdır.
// Yenidən göstərəndə səbəb soruşulmur.
const hideTarget = ref(null)
const isHiding = ref(false)

// Gizlətmək üçün səbəb soruşulur; yenidən göstərmək üçün soruşulmur
const askHide = async (message) => {
  if (message.isHidden) return applyHide(message, false, null)

  hideTarget.value = message
}

const applyHide = async (message, isHidden, reason) => {
  isHiding.value = true
  try {
    const text = await setMessageHidden(message.id, isHidden, reason)
    toast.success(text)
    hideTarget.value = null
    if (activeChat.value) await open(activeChat.value)
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Əməliyyat alınmadı')
  } finally {
    isHiding.value = false
  }
}

const shortTime = (value) => {
  if (!value) return '—'

  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  const today = new Date().toDateString() === d.toDateString()

  return today
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onBeforeUnmount(() => clearTimeout(searchTimer))

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
}

.search-box {
  min-width: 260px;
  border: 1px solid var(--line-2);
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.83rem;
  font-family: inherit;
  outline: none;
}

.search-box:focus {
  border-color: var(--gold);
}

/* Solda siyahı, sağda söhbətin özü */
.chat-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 18px;
  align-items: start;
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 620px;
  overflow-y: auto;
  padding-right: 4px;
}

.chat-row {
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  padding: 11px 13px;
  cursor: pointer;
  transition: border-color var(--t-fast), transform var(--t-fast);
}

.chat-row:hover {
  border-color: var(--gold);
  transform: translateY(-1px);
}

.chat-row.active {
  border-color: var(--brand);
  background: var(--brand-soft);
}

.cr-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.cr-venue {
  font-size: 0.86rem;
  color: var(--ink);
}

.cr-time {
  font-size: 0.68rem;
  color: var(--muted-2);
  white-space: nowrap;
}

.cr-customer {
  display: block;
  font-size: 0.75rem;
  color: var(--muted);
  margin-top: 1px;
}

/* Lentin kökünü ayırd etmək üçün — sakit işarədir, xəbərdarlıq deyil */
.cr-kind {
  font-style: normal;
  font-size: 0.63rem;
  color: var(--info);
  background: var(--info-soft);
  border-radius: var(--r-pill);
  padding: 1px 7px;
  margin-left: 5px;
}

.cr-preview {
  margin: 6px 0 0;
  font-size: 0.77rem;
  color: var(--ink-2);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cr-who {
  color: var(--muted-2);
}

.cr-foot {
  display: flex;
  gap: 5px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.cr-chip {
  background: var(--line);
  color: var(--ink-2);
  border-radius: var(--r-pill);
  padding: 2px 8px;
  font-size: 0.66rem;
}

/* Söhbətin tam mətni */
.chat-detail {
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  min-height: 420px;
  display: flex;
  flex-direction: column;
}

.cd-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
}

.cd-head b {
  display: block;
  font-size: 0.92rem;
  color: var(--ink);
}

.cd-sub {
  display: block;
  font-size: 0.75rem;
  color: var(--muted);
  margin-top: 2px;
}

.cd-status {
  background: var(--brand-soft);
  color: var(--brand);
  border-radius: var(--r-pill);
  padding: 3px 11px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.cd-facts {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
}

.cd-facts span {
  font-size: 0.79rem;
  color: var(--ink-2);
}

.cd-facts i {
  display: block;
  font-style: normal;
  font-size: 0.66rem;
  color: var(--muted-2);
  margin-bottom: 1px;
}

.cd-body {
  flex: 1;
  overflow-y: auto;
  max-height: 480px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg);
}

.cd-empty {
  margin: auto;
  font-size: 0.8rem;
  color: var(--muted-2);
}

.msg {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 74%;
}

/* Saray tərəfi sağda */
.msg.venue {
  align-self: flex-end;
  align-items: flex-end;
}

.who {
  font-size: 0.67rem;
  color: var(--muted-2);
  margin-bottom: 3px;
}

.bubble {
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: 12px 12px 12px 4px;
  padding: 8px 12px;
}

.msg.venue .bubble {
  border-radius: 12px 12px 4px 12px;
  background: var(--brand-soft);
  border-color: #f0dde4;
}

.bubble p {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.5;
  white-space: pre-line;
  word-break: break-word;
  color: var(--ink);
}

.time {
  display: block;
  font-size: 0.65rem;
  color: var(--muted-2);
  margin-top: 4px;
  text-align: right;
}

/* Gizlədilmiş mesaj: tərəflər görmür, admin görür */
.bubble.hidden {
  opacity: 0.62;
  border-style: dashed;
  border-color: var(--danger);
}

.hidden-note {
  margin: 6px 0 0 !important;
  padding-top: 6px;
  border-top: 1px dashed var(--line-2);
  font-size: 0.7rem !important;
  color: var(--danger) !important;
}

.hide-btn {
  background: none;
  border: none;
  color: var(--muted-2);
  font-size: 0.67rem;
  cursor: pointer;
  padding: 3px 2px 0;
  text-decoration: underline;
}

.hide-btn:hover {
  color: var(--danger);
}

@media (max-width: 900px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }

  .chat-list {
    max-height: 340px;
  }
}
</style>
