<template>
  <div class="panel-page" v-loading="isLoading">
    <div class="panel-inner">
      <header class="page-head">
        <div>
          <h1 class="page-title">İdarəetmə paneli</h1>
          <p class="page-sub">Saraylarınıza gələn rezerv sorğularını buradan idarə edin</p>
        </div>
        <span class="owner-tag"><IcoSettings v-if="auth.isSuperAdmin" class="ico" /><IcoLandmark v-else class="ico" /> {{ auth.user?.fullName }}</span>
      </header>

      <!-- Ümumi göstəricilər -->
      <div class="stat-row">
        <div class="stat-card accent">
          <span class="stat-value">{{ pendingDisplay }}</span>
          <span class="stat-label">Cavab gözləyir</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ confirmedDisplay }}</span>
          <span class="stat-label">Təsdiqlənmiş</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ venuesDisplay }}</span>
          <span class="stat-label">Sarayınız</span>
        </div>
        <!-- Gəlir göstəricisi hesabat sayılır — administrator onu görmür -->
        <div class="stat-card" v-if="auth.canEditVenues">
          <span class="stat-value">{{ incomeDisplay.toLocaleString() }} ₼</span>
          <span class="stat-label">Təsdiqlənmiş gəlir</span>
        </div>
      </div>

      <!-- Bölmə seçimi — administratorda yalnız rezervlər və zallar görünür -->
      <SectionNav v-model="section" :tabs="sectionTabs" />

      <UiEmpty
        v-if="!isLoading && venues.length === 0"
        icon="🏛"
        title="Hələ sarayınız yoxdur."
        text="Saray əlavə olunduqdan sonra rezerv sorğuları burada görünəcək."
      />

      <!-- Sahibkarın hesabatı -->
      <OwnerStats v-else-if="section === 'stats'" />

      <!-- Müştəri sorğuları: təklif göndərmək imkanı -->
      <OpenRequests v-else-if="section === 'requests'" />

      <!-- Göndərilmiş təkliflər və yazışmalar -->
      <MyOffers v-else-if="section === 'offers'" />

      <!-- Saraylarım bölməsi -->
      <VenueManager
        v-else-if="section === 'venues'"
        :venues="venues"
        :can-edit="auth.canEditVenues"
        @changed="load"
      />

      <!-- Administratorlar bölməsi -->
      <OwnerStaffManager v-else-if="section === 'staff'" :venues="venues" />
      <OwnerReviews v-else-if="section === 'reviews'" />
      <OwnerActivityLog v-else-if="section === 'activity'" />

      <div v-else class="panel-body">
        <!-- Saray seçimi -->
        <aside class="venue-list" :class="{ 'is-open': venueSheet, single: venues.length < 2 }">
          <!-- Telefonda siyahı yoxdur: hazırkı saray bir düymədir, basanda
               siyahı aşağıdan vərəq kimi açılır -->
          <button type="button" class="venue-current" @click="venueSheet = true">
            <img :src="selectedVenue?.coverImageUrl || FALLBACK_IMAGE" :alt="selectedVenue?.name" @error="onImgError" />
            <span class="vi-text">
              <small>Saray</small>
              <b>{{ selectedVenue?.name }}</b>
            </span>
            <span v-if="otherPending" class="vi-badge">{{ otherPending }}</span>
            <span class="vc-change">Dəyiş <IcoChevronDown class="ico" /></span>
          </button>

          <div class="venue-pick" @click.self="venueSheet = false">
            <div class="venue-pick-inner">
              <div class="vp-head">
                <span class="side-label">Saraylarım <em>{{ venues.length }}</em></span>
                <button type="button" class="vp-close" aria-label="Bağla" @click="venueSheet = false">
                  <IcoX class="ico" />
                </button>
              </div>

              <!-- Az sarayda axtarış artıqdır; admin bütün sarayları görür -->
              <label v-if="venues.length > 6" class="vp-search">
                <IcoSearch class="ico" />
                <input v-model="venueQuery" type="search" placeholder="Saray və ya şəhər axtar" />
              </label>

              <div class="vp-scroll">
                <button
                  v-for="v in filteredVenues"
                  :key="v.id"
                  type="button"
                  class="venue-item"
                  :class="{ active: v.id === selectedVenueId }"
                  @click="pickVenue(v.id)"
                >
                  <img :src="v.coverImageUrl || FALLBACK_IMAGE" :alt="v.name" loading="lazy" @error="onImgError" />
                  <span class="vi-text">
                    <b>{{ v.name }}</b>
                    <em>{{ v.city }} · {{ v.hallCount }} zal</em>
                  </span>
                  <span v-if="pendingByVenue[v.id]" class="vi-badge">{{ pendingByVenue[v.id] }}</span>
                </button>
                <p v-if="!filteredVenues.length" class="vp-empty">Bu axtarışa uyğun saray tapılmadı.</p>
              </div>
            </div>
          </div>
        </aside>

        <!-- Rezerv sorğuları -->
        <section class="reservations" v-loading="isLoadingReservations">
          <div class="res-head">
            <h2>{{ selectedVenue?.name }} — rezerv sorğuları</h2>
            <div class="tabs">
              <button
                v-for="tab in tabs"
                :key="tab.value"
                class="tab"
                :class="{ active: activeTab === tab.value }"
                @click="activeTab = tab.value"
              >
                {{ tab.label }}
                <em v-if="counts[tab.value]">{{ counts[tab.value] }}</em>
              </button>
            </div>
          </div>

          <UiEmpty
            v-if="!isLoadingReservations && visible.length === 0"
            icon="📭"
            title="Bu bölmədə sorğu yoxdur."
          />

          <article v-for="r in visible" :key="r.id" class="res-card" :class="statusClass(r.status)">
            <div class="res-top">
              <div>
                <h3>{{ r.customerName }}</h3>
                <span class="res-meta">{{ r.customerEmail }} · <IcoPhone class="ico" /> {{ r.contactPhone }}</span>
              </div>
              <span class="status-tag" :class="statusClass(r.status)">{{ statusText(r.status) }}</span>
            </div>

            <div class="res-facts">
              <div class="fact">
                <span class="fact-label">Tədbir tarixi</span>
                <b>{{ formatDateFull(r.eventDate) }}</b>
              </div>
              <div class="fact">
                <span class="fact-label">Zal</span>
                <b>{{ r.hallName }}</b>
                <em>{{ r.guestCount }} / {{ r.hallCapacity }} qonaq</em>
              </div>
              <div class="fact">
                <span class="fact-label">Menyu</span>
                <b>{{ r.menuName }}</b>
                <em>{{ r.pricePerPerson }} ₼ / nəfər</em>
              </div>
              <div class="fact fact-total">
                <span class="fact-label">Məbləğ</span>
                <b>{{ (r.pricePerPerson * r.guestCount).toLocaleString() }} ₼</b>
              </div>
            </div>

            <p class="res-note" v-if="r.note"><IcoMessageCircle class="ico" /> {{ r.note }}</p>

            <!-- Ləğv səbəbi: tarix boşalıbsa niyə boşaldığını bilmək lazımdır -->
            <p class="cancel-note" v-if="r.cancellationReason">
              <IcoBan class="ico" /> Ləğv səbəbi: {{ r.cancellationReason }}
            </p>

            <!-- Cavabı kim verdi: sarayda bir neçə administrator işləyə bilər -->
            <p class="answered-by" v-if="r.respondedByName">
              <IcoPenLine class="ico" /> Cavabı verdi: <b>{{ r.respondedByName }}</b>
              <span v-if="r.respondedAt"> · {{ formatDateFull(r.respondedAt.slice(0, 10)) }}</span>
            </p>

            <!-- Göndərilmiş, cavab gözləyən əks-təklif -->
            <div v-if="r.counterOffer" class="offer-box">
              <b>Əks-təklif göndərilib — müştəri cavab verməyib</b>
              <span>{{ offerSummary(r) }}</span>
              <em>{{ r.counterOffer.message }}</em>
            </div>

            <!-- Müştərinin öz təklifi: danışıq iki tərəflidir -->
            <div v-if="r.customerOffer" class="offer-box customer">
              <b>Müştəri şərt təklif edir</b>
              <ul class="cust-offer-list">
                <li v-if="r.customerOffer.eventDate">
                  Tarix: <s>{{ formatDateFull(r.eventDate.slice(0, 10)) }}</s>
                  → <b>{{ formatDateFull(r.customerOffer.eventDate.slice(0, 10)) }}</b>
                </li>
                <li v-if="r.customerOffer.pricePerPerson">
                  Təklif etdiyi qiymət: <b>{{ r.customerOffer.pricePerPerson }} ₼ / nəfər</b>
                  <s>{{ r.pricePerPerson }} ₼</s>
                </li>
              </ul>
              <em>{{ r.customerOffer.message }}</em>

              <div class="cust-offer-actions">
                <el-popconfirm
                  title="Müştərinin təklifi rədd edilsin? Sorğu açıq qalacaq."
                  confirm-button-text="Bəli, rədd et"
                  cancel-button-text="Xeyr"
                  @confirm="respondToCustomerOffer(r, false)"
                >
                  <template #reference>
                    <button class="reject-btn">Rədd et</button>
                  </template>
                </el-popconfirm>
                <button class="confirm-btn" @click="respondToCustomerOffer(r, true)">
                  Qəbul et və təsdiqlə
                </button>
              </div>
            </div>

            <footer class="res-foot">
              <span class="res-date">Sorğu tarixi: {{ formatDateFull(r.createdAt.slice(0, 10)) }}</span>

              <!-- Problemli müştəri barədə platformaya bildirmək -->
              <button class="complain-btn" @click="disputeTarget = r">Şikayət et</button>

              <div class="res-actions" v-if="r.status === 0 || r.status === 5">
                <el-popconfirm
                  title="Bu sorğunu rədd etmək istəyirsiniz?"
                  confirm-button-text="Bəli, rədd et"
                  cancel-button-text="Xeyr"
                  @confirm="setStatus(r, 2)"
                >
                  <template #reference>
                    <button class="reject-btn">Rədd et</button>
                  </template>
                </el-popconfirm>
                <button class="offer-btn" @click="openOffer(r)">Başqa şərt təklif et</button>
                <button class="confirm-btn" @click="setStatus(r, 1)">Təsdiqlə</button>
              </div>
            </footer>
          </article>
        </section>
      </div>
    </div>
  </div>

  <!-- Əks-təklif pəncərəsi -->
  <CounterOfferDialog
    v-if="offerReservation"
    :reservation="offerReservation"
    :halls="selectedVenue?.halls ?? []"
    :menus="selectedVenue?.menus ?? []"
    @close="offerReservation = null"
    @sent="onOfferSent"
  />

  <!-- Şikayət: problemli müştəri barədə platformaya müraciət -->
  <DisputeCreateDialog
    v-if="disputeTarget"
    :reservation-id="disputeTarget.id"
    :context-label="`${disputeTarget.customerName} — ${formatDateFull(disputeTarget.eventDate?.slice(0, 10))}`"
    :is-customer="false"
    @close="disputeTarget = null"
    @created="$router.push('/sikayetlerim')"
  />
</template>

<script setup>
import { ChartColumn, Inbox, Landmark, Megaphone, ScrollText, Send, Star, Users } from 'lucide-vue-next'
import SectionNav from '@/components/SectionNav.vue'
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useCountUp } from '@/composables/useCountUp'
import { toast } from '@/utils/toast'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import { useAuthStore } from '@/store/auth'
import CounterOfferDialog from '@/components/CounterOfferDialog.vue'
import DisputeCreateDialog from '@/components/DisputeCreateDialog.vue'

// Bölmələr tənbəl yüklənir: sahib bir anda tək bölməyə baxır
const VenueManager = defineAsyncComponent(() => import('@/components/VenueManager.vue'))
const OpenRequests = defineAsyncComponent(() => import('@/components/OpenRequests.vue'))
const MyOffers = defineAsyncComponent(() => import('@/components/MyOffers.vue'))
const OwnerStats = defineAsyncComponent(() => import('@/components/OwnerStats.vue'))
const OwnerStaffManager = defineAsyncComponent(() => import('@/components/OwnerStaffManager.vue'))
const OwnerActivityLog = defineAsyncComponent(() => import('@/components/OwnerActivityLog.vue'))
const OwnerReviews = defineAsyncComponent(() => import('@/components/OwnerReviews.vue'))
import {
  getMyVenues,
  getOwnerReservations,
  getVenueReservations,
  markReservationSeen,
  updateReservationStatus,
  acceptCustomerOffer,
  declineCustomerOffer,
} from '@/services/ownerService'
import { formatDateFull } from '@/utils/date'
import { FALLBACK_IMAGE, onImgError } from '@/utils/imageFallback'

const auth = useAuthStore()

const venues = ref([])
const selectedVenueId = ref(null)
const reservations = ref([])
const allReservations = ref({})
const isLoading = ref(false)
const isLoadingReservations = ref(false)
const activeTab = ref(0)

// Panelin bölmələri: rezervlər / administratorlar
const section = ref('reservations')

// Administratorda yalnız rezervlər, zallar və rəylər görünür; jurnal yalnız
// sahibədir — administrator öz üzərindəki nəzarəti görməməlidir
const sectionTabs = computed(() => [
  { value: 'reservations', label: 'Rezerv sorğuları', icon: Inbox },
  { value: 'stats', label: 'Statistika', icon: ChartColumn },
  { value: 'requests', label: 'Açıq sorğular', icon: Megaphone },
  { value: 'offers', label: 'Təkliflərim', icon: Send },
  { value: 'venues', label: auth.canEditVenues ? 'Saraylarım' : 'Zallarım', icon: Landmark, count: venues.value.length },
  ...(auth.canEditVenues ? [{ value: 'staff', label: 'Administratorlar', icon: Users }] : []),
  { value: 'reviews', label: 'Rəylər', icon: Star },
  ...(auth.canEditVenues ? [{ value: 'activity', label: 'Jurnal', icon: ScrollText }] : []),
])

const tabs = [
  { value: 0, label: 'Gözləyir' },
  { value: 1, label: 'Təsdiqlənmiş' },
  { value: 2, label: 'Rədd edilmiş' },
  { value: 'all', label: 'Hamısı' },
]

// Sahibin saraylarını və hər birinin rezervlərini yükləyir
const load = async () => {
  isLoading.value = true
  try {
    // İki sorğu: saraylar və bütün rezervlər (rezervlər saray Id-sinə görə qruplaşdırılmış gəlir)
    const [myVenues, grouped] = await Promise.all([getMyVenues(), getOwnerReservations()])
    venues.value = myVenues
    allReservations.value = grouped

    if (!venues.value.length) return

    // Cavab gözləyən sorğusu olan ilk saray seçilir
    const withPending = venues.value.find((v) => pendingByVenue.value[v.id] > 0)
    selectVenue((withPending ?? venues.value[0]).id)
  } finally {
    isLoading.value = false
  }
}

const selectVenue = (venueId) => {
  selectedVenueId.value = venueId
  reservations.value = allReservations.value[venueId] ?? []
}

const selectedVenue = computed(() => venues.value.find((v) => v.id === selectedVenueId.value))

// ————— saray seçimi: axtarış, sıralama, telefonda vərəq —————
const venueQuery = ref('')
const venueSheet = ref(false)

const normalize = (text) => (text ?? '').toLocaleLowerCase('az')

// Cavab gözləyən sorğusu olan saraylar yuxarıda: iş orada gözləyir
const filteredVenues = computed(() => {
  const q = normalize(venueQuery.value.trim())
  const list = q
    ? venues.value.filter((v) => normalize(v.name).includes(q) || normalize(v.city).includes(q))
    : venues.value
  return [...list].sort((a, b) => (pendingByVenue.value[b.id] || 0) - (pendingByVenue.value[a.id] || 0))
})

// Düymədə yalnız BAŞQA saraylarda gözləyən sorğuların cəmi görünür
const otherPending = computed(() =>
  Object.entries(pendingByVenue.value).reduce(
    (sum, [id, count]) => sum + (Number(id) === selectedVenueId.value ? 0 : count),
    0,
  ),
)

const pickVenue = (venueId) => {
  selectVenue(venueId)
  venueSheet.value = false
}

// Vərəq açıq olanda arxadakı səhifə sürüşməsin
watch(venueSheet, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

// Hər saray üçün cavab gözləyən sorğu sayı (yan siyahıdakı nişan)
const pendingByVenue = computed(() => {
  const result = {}
  for (const [venueId, list] of Object.entries(allReservations.value)) {
    result[venueId] = list.filter((r) => r.status === 0).length
  }
  return result
})

const flatReservations = computed(() => Object.values(allReservations.value).flat())

const pendingCount = computed(() => flatReservations.value.filter((r) => r.status === 0).length)
const confirmedCount = computed(() => flatReservations.value.filter((r) => r.status === 1).length)

// Göstərici kartları rəqəmi sıçramadan, sayaraq dəyişir
const pendingDisplay = useCountUp(() => pendingCount.value)
const confirmedDisplay = useCountUp(() => confirmedCount.value)
const venuesDisplay = useCountUp(() => venues.value.length)

// Təsdiqlənmiş rezervlərdən gözlənilən ümumi gəlir
const expectedIncome = computed(() =>
  flatReservations.value
    .filter((r) => r.status === 1)
    .reduce((sum, r) => sum + r.pricePerPerson * r.guestCount, 0),
)

const incomeDisplay = useCountUp(() => expectedIncome.value)

const counts = computed(() => {
  const result = { all: reservations.value.length }
  for (const r of reservations.value) result[r.status] = (result[r.status] ?? 0) + 1
  return result
})

const visible = computed(() =>
  activeTab.value === 'all'
    ? reservations.value
    : reservations.value.filter((r) => r.status === activeTab.value),
)

const statusText = (s) =>
  ({
    0: 'Gözləyir',
    1: 'Təsdiqlənib',
    2: 'Rədd edilib',
    3: 'Müştəri ləğv edib',
    4: 'Vaxtı keçib',
    5: 'Təklif göndərilib',
  })[s] ?? '—'

const statusClass = (s) =>
  ({ 0: 'pending', 1: 'confirmed', 2: 'rejected', 3: 'cancelled', 4: 'expired', 5: 'offered' })[s] ?? ''

// ————— əks-təklif —————

const offerReservation = ref(null)

// Barəsində şikayət açılan rezerv
const disputeTarget = ref(null)

const openOffer = async (reservation) => {
  offerReservation.value = reservation

  // Sahib sorğunu açdı — müştəri «baxıldı» görsün
  if (!reservation.seenAt) {
    try {
      await markReservationSeen(reservation.id)
      reservation.seenAt = new Date().toISOString()
    } catch {
      // «baxıldı» qeydi kritik deyil, xəta axını dayandırmasın
    }
  }
}

// Göndərilmiş təklifin nəyi dəyişdiyini bir sətirdə yazır
const offerSummary = (reservation) => {
  const offer = reservation.counterOffer
  if (!offer) return ''

  const parts = []
  if (offer.eventDate) parts.push(`tarix → ${formatDateFull(offer.eventDate)}`)
  if (offer.hall?.name) parts.push(`zal → ${offer.hall.name}`)
  if (offer.menu?.name) parts.push(`menyu → ${offer.menu.name}`)
  if (offer.pricePerPerson) parts.push(`qiymət → ${offer.pricePerPerson} ₼`)

  return parts.join(' · ')
}

const onOfferSent = async () => {
  allReservations.value[selectedVenueId.value] = await getVenueReservations(selectedVenueId.value)
  reservations.value = allReservations.value[selectedVenueId.value]
}

// Müştərinin təklifinə cavab: qəbul edəndə şərtlər rezervə köçürülür
// və rezerv təsdiqlənir; rədd edəndə sorğu açıq qalır
const respondToCustomerOffer = async (reservation, accept) => {
  isLoadingReservations.value = true
  try {
    const message = accept
      ? await acceptCustomerOffer(reservation.customerOffer.id)
      : await declineCustomerOffer(reservation.customerOffer.id)

    allReservations.value[selectedVenueId.value] = await getVenueReservations(selectedVenueId.value)
    reservations.value = allReservations.value[selectedVenueId.value]
    toast.success(message)
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  } finally {
    isLoadingReservations.value = false
  }
}

// Sorğunu təsdiqləyir və ya rədd edir, sonra siyahını yeniləyir
const setStatus = async (reservation, status) => {
  isLoadingReservations.value = true
  try {
    const message = await updateReservationStatus(reservation.id, status)
    allReservations.value[selectedVenueId.value] = await getVenueReservations(selectedVenueId.value)
    reservations.value = allReservations.value[selectedVenueId.value]
    toast.success(message)
  } catch (e) {
    toast.error(e?.userMessage ?? e?.message ?? 'Xəta baş verdi')
  } finally {
    isLoadingReservations.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.panel-page {
  min-height: calc(100vh - 61px);
  background: var(--bg);
  padding: 30px 40px 60px;
  font-family: var(--font);
}

.panel-inner {
  max-width: var(--page-w);
  margin: 0 auto;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 4px;
  color: var(--ink);
  font-size: 1.7rem;
}

.page-sub {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.owner-tag {
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.85rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 20px;
  white-space: nowrap;
}

/* Göstəricilər */
.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

.stat-card.accent {
  background: linear-gradient(135deg, var(--brand), #9c2350);
  border-color: transparent;
}

.stat-card.accent .stat-value,
.stat-card.accent .stat-label {
  color: #fff;
}

.stat-card.accent .stat-label {
  opacity: 0.85;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.1;
}

.stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-2);
  font-weight: 700;
}

/* Bölmə seçimi — admin panelindəki ilə eyni davranış: sığmayanda sıra
   qırılmır, üfüqi sürüşür. Hazırda 8 bölmə var və rahat sığır, amma
   yenisi əlavə olunanda düymələr sıxılıb əzilməsin. */
.section-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent);
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent);
  padding-bottom: 6px;
}

.section-tabs::-webkit-scrollbar {
  display: none;
}

.section-tab {
  flex: 0 0 auto;
  white-space: nowrap;
  background: #fff;
  border: 1px solid var(--line-2);
  color: var(--muted);
  padding: 9px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.section-tab em {
  font-style: normal;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.72rem;
  padding: 1px 8px;
  border-radius: 20px;
  margin-left: 6px;
}

.section-tab:hover {
  border-color: var(--gold);
}

.section-tab.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.section-tab.active em {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Əsas hissə */
.panel-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  align-items: start;
}

/* Saray siyahısı səhifə ilə birlikdə yuxarı qaçmır: başlığın altında
   yapışıb qalır və ekranın hündürlüyünü tutur. Əvvəl sabit 640px qutu idi —
   həm öz içində, həm səhifədə sürüşürdü və hər ikisi brauzerin kobud
   zolağı ilə. İndi səhifənin bir sürüşməsi var, siyahı isə yalnız özünə
   sığmayanda, incə zolaqla sürüşür. */
.venue-list {
  position: sticky;
  top: calc(var(--header-h) + 16px);
  max-height: calc(100vh - var(--header-h) - 32px);
  max-height: calc(100dvh - var(--header-h) - 32px);
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 14px 6px 8px 12px;
  box-shadow: var(--shadow-1);
}

.venue-current,
.vp-close {
  display: none;
}

.venue-pick,
.venue-pick-inner {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.vp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}

.vp-head .side-label em {
  font-style: normal;
  margin-left: 4px;
  color: var(--muted);
}

.vp-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  flex: none;
  margin: 0 8px 10px 0;
  padding: 0 12px;
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--muted);
}

.vp-search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: none;
  font-size: 0.88rem;
  color: var(--ink);
}

.vp-search:focus-within {
  box-shadow: 0 0 0 1.5px var(--brand) inset;
  color: var(--brand);
}

.vp-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 6px;
}

.vp-empty {
  margin: 18px 4px;
  font-size: 0.85rem;
  color: var(--muted);
}

.side-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted-2);
  margin-bottom: 10px;
  padding-left: 4px;
}

.venue-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  text-align: left;
  margin-bottom: 4px;
  transition: all 0.15s;
}

.venue-item:hover {
  background: var(--bg);
}

.venue-item.active {
  background: var(--brand-soft);
  border-color: #e8cdd8;
}

.venue-item img {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.vi-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-grow: 1;
}

.vi-text b {
  font-size: 0.87rem;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vi-text em {
  font-style: normal;
  font-size: 0.73rem;
  color: var(--muted-2);
}

.vi-badge {
  background: var(--brand);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  min-width: 20px;
  height: 20px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  padding: 0 6px;
}

/* Rezervlər */
.reservations {
  min-height: 200px;
}

.res-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.res-head h2 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--ink);
}

.tabs {
  display: flex;
  gap: 6px;
  /* Cipler setri qirmir: «Redd edilmis» iki setre dusende butun
     cipler onun hundurluyune (44px) uzanirdi ve zolaq eyri gorunurdu.
     Sigmayanda ufuqi surusur — panelin qalan lentleri ile eyni davranis. */
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 3px;
  mask-image: linear-gradient(to right, #000 calc(100% - 22px), transparent);
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 22px), transparent);
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  flex: 0 0 auto;
  white-space: nowrap;
  background: #fff;
  border: 1px solid var(--line-2);
  color: var(--muted);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.tab em {
  font-style: normal;
  opacity: 0.6;
  margin-left: 3px;
}

.tab:hover {
  border-color: var(--gold);
}

.tab.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.res-card {
  background: #fff;
  border: 1px solid var(--line);
  border-left: 4px solid var(--line);
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 14px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

.res-card.pending { border-left-color: var(--gold); }
.res-card.confirmed { border-left-color: var(--ok); }
.res-card.rejected { border-left-color: var(--danger); }
.res-card.cancelled { border-left-color: var(--faint); }
.res-card.expired { border-left-color: #d8c39a; }
.res-card.offered { border-left-color: #7ba1d0; }

.res-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.res-top h3 {
  margin: 0 0 2px;
  font-size: 1.05rem;
  color: var(--ink);
}

.res-meta {
  font-size: 0.8rem;
  color: var(--muted-2);
}

.status-tag {
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.status-tag.pending { background: #fff6e0; color: var(--gold-ink); }
.status-tag.confirmed { background: #e3f6e8; color: var(--ok); }
.status-tag.rejected { background: var(--danger-soft); color: var(--danger); }
.status-tag.cancelled { background: var(--surface-2); color: var(--muted); }
.status-tag.expired { background: #f4efe6; color: #8a6d3b; }
.status-tag.offered { background: #eaf1fa; color: var(--info); }

.res-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid #f5f1f2;
  border-bottom: 1px solid #f5f1f2;
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fact-label {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-2);
  font-weight: 700;
}

.fact b {
  font-size: 0.9rem;
  color: var(--ink);
}

.fact em {
  font-style: normal;
  font-size: 0.75rem;
  color: var(--muted);
}

.fact-total b {
  color: var(--brand);
  font-size: 1.1rem;
  font-weight: 800;
}

.res-note {
  margin: 12px 0 0;
  font-size: 0.83rem;
  color: var(--muted);
  font-style: italic;
}

.res-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.res-date {
  font-size: 0.78rem;
  color: var(--muted-2);
}

.res-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* «Rədd» ilə «Təsdiq» arasındakı üçüncü yol */
.offer-btn {
  background: #fff;
  color: var(--info);
  border: 1px solid #cfdcec;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.87rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.offer-btn:hover {
  background: #f4f8fd;
  border-color: var(--info);
}

/* Göndərilmiş, cavab gözləyən təklif */
.offer-box {
  background: #f4f8fd;
  border: 1px solid #dde8f4;
  border-radius: 10px;
  padding: 10px 13px;
  margin-bottom: 12px;
}

.offer-box b {
  display: block;
  font-size: 0.8rem;
  color: var(--info);
  margin-bottom: 3px;
}

.offer-box span {
  display: block;
  font-size: 0.78rem;
  color: #4a5b70;
}

.offer-box em {
  display: block;
  font-style: normal;
  font-size: 0.76rem;
  color: var(--muted);
  margin-top: 4px;
}

/* Müştərinin təklifi — bizimkindən fərqlənsin, cavab tələb edir */
.offer-box.customer {
  background: var(--gold-soft);
  border-color: #f0dfba;
}

.offer-box.customer b {
  color: var(--warn);
}

.cust-offer-list {
  margin: 4px 0 0;
  padding-left: 16px;
  font-size: 0.78rem;
  color: #4a5b70;
  line-height: 1.6;
}

.cust-offer-list s {
  color: var(--muted-2);
  margin-left: 5px;
}

.cust-offer-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}

.cancel-note {
  margin: 0 0 10px;
  padding: 8px 11px;
  background: var(--danger-soft);
  border-radius: var(--r-sm);
  font-size: 0.78rem;
  color: var(--danger);
  line-height: 1.5;
}

/* Məlumat sətridir, xəbərdarlıq deyil — ona görə solğun saxlanılır */
.answered-by {
  margin: 0 0 10px;
  font-size: 0.75rem;
  color: var(--muted);
}

.answered-by b {
  color: var(--ink-2);
  font-weight: 600;
}

/* Şikayət — sönük saxlanılır, son çarədir.
   Toxunma sahəsi: yazı 14px hündürlükdə idi, barmaq üçün çox darıdır. */
.complain-btn {
  background: none;
  border: none;
  color: var(--muted-2);
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 9px 2px;
  margin: -9px -2px;
  margin-left: 10px;
}

.complain-btn:hover {
  color: var(--danger);
}

.confirm-btn {
  background: var(--ok);
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 0.87rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-btn:hover {
  background: var(--ok);
}

.reject-btn {
  background: #fff;
  color: var(--danger);
  border: 1px solid #e5b4ae;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.87rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reject-btn:hover {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}

.empty-box {
  background: #fff;
  border-radius: 14px;
  padding: 40px 20px;
  text-align: center;
  color: var(--muted);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

@media (max-width: 980px) {
  .panel-body {
    grid-template-columns: 1fr;
  }

  /* Telefon və planşet: siyahı səhifədə yer tutmur. Hazırkı saray bir
     düymədir; siyahı basanda aşağıdan vərəq kimi açılır. Bir sarayı olan
     sahibə seçim lazım deyil — düymə ümumiyyətlə görünmür. */
  .venue-list {
    position: static;
    max-height: none;
    padding: 0;
    border: none;
    background: none;
    box-shadow: none;
  }

  .venue-list.single {
    display: none;
  }

  .venue-current {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px 10px 10px;
    border-radius: 16px;
    border: 1px solid var(--line);
    background: var(--surface);
    box-shadow: var(--shadow-1);
    text-align: left;
    cursor: pointer;
  }

  .venue-current img {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    object-fit: cover;
    flex: none;
  }

  .venue-current small {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-2);
  }

  .venue-current b {
    font-size: 1rem;
  }

  .vc-change {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    padding: 0 12px;
    border-radius: var(--r-pill);
    background: var(--surface-2);
    color: var(--ink-2);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .venue-pick {
    display: none;
  }

  .venue-list.is-open .venue-pick {
    position: fixed;
    inset: 0;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background: rgba(27, 18, 22, 0.5);
  }

  .venue-pick-inner {
    flex: none;
    max-height: 82vh;
    max-height: 82dvh;
    padding: 16px 10px calc(12px + env(safe-area-inset-bottom, 0px)) 16px;
    border-radius: 24px 24px 0 0;
    background: var(--surface);
    box-shadow: 0 -18px 50px rgba(27, 18, 22, 0.3);
  }

  .vp-close {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 50%;
    background: var(--surface-2);
    color: var(--ink-2);
    cursor: pointer;
  }

  .vp-head {
    margin-bottom: 8px;
  }

  .vp-head .side-label {
    margin: 0;
    font-size: 0.8rem;
  }

  .venue-item {
    padding: 10px 8px;
  }
}

@media (max-width: 980px) {

  /* Grid sütununun ilkin «min-width: auto» dəyəri sütunun məzmundan
     kiçilməsinə imkan vermir: saray adları sətri qırmadığına görə
     sütun 390px ekranda 412px-ə uzanırdı. Səhifə «overflow-x: clip»
     olduğuna görə bu sürüşmə kimi yox, KƏSİLMƏ kimi çıxırdı —
     filtr zolağının sonuncu çipi («Hamısı») ekrana heç düşmürdü. */
  .panel-body > * {
    min-width: 0;
  }

  .section-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }

  .section-tab {
    white-space: nowrap;
  }
  .panel-page {
    padding: 24px 16px 50px;
  }
}

/* Telefon: ad onsuz da yuxarıdakı başlıqda var — burada başlığı sıxışdırırdı */
@media (max-width: 600px) {
  .owner-tag {
    display: none;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
