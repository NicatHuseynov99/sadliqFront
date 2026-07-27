<template>
  <div class="res-page" v-loading="isLoading">
    <div class="res-inner">
      <h1 class="page-title">Rezervlərim</h1>
      <p class="page-sub">Göndərdiyiniz rezerv sorğuları və onların vəziyyəti</p>

      <div v-if="!isLoading && reservations.length === 0" class="no-result">
        <h3>Hələ heç bir rezerviniz yoxdur.</h3>
        <p>Ana səhifədən saray seçib rezerv sorğusu göndərə bilərsiniz.</p>
        <router-link to="/"><button class="primary-btn">Saraylara bax</button></router-link>
      </div>

      <div v-else class="res-list">
        <div v-for="r in reservations" :key="r.id" class="res-card">
          <div class="res-main">
            <div class="res-title-row">
              <h3>{{ r.venueName }}</h3>
              <span class="status-tag" :class="statusClass(r.status)">{{ statusText(r.status) }}</span>
            </div>
            <p class="res-line">🏛 {{ r.hallName }} · 🍽 {{ r.menuName }} (₼{{ r.pricePerPerson }}/nəfər)</p>
            <p class="res-line">📅 {{ formatDateFull(r.eventDate) }} · 👥 {{ r.guestCount }} qonaq</p>
            <p class="res-line total">Təxmini məbləğ: <b>₼{{ (r.pricePerPerson * r.guestCount).toLocaleString() }}</b></p>
            <p class="res-note" v-if="r.note">Qeyd: {{ r.note }}</p>
          </div>

          <div class="res-actions" v-if="r.status === 0 || r.status === 1">
            <el-popconfirm
              title="Rezervi ləğv etmək istədiyinizə əminsiniz?"
              confirm-button-text="Bəli, ləğv et"
              cancel-button-text="Xeyr"
              @confirm="cancel(r)"
            >
              <template #reference>
                <button class="cancel-btn">Ləğv et</button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElNotification } from 'element-plus'
import { getMyReservations, cancelReservation } from '@/services/reservationService'
import { formatDateFull } from '@/utils/date'

const reservations = ref([])
const isLoading = ref(false)

// Müştərinin öz rezervlərini yükləyir (mock servis)
const load = async () => {
  isLoading.value = true
  try {
    reservations.value = await getMyReservations()
  } finally {
    isLoading.value = false
  }
}

// Backend ReservationStatus enum-una uyğun status mətnləri
const statusText = (s) =>
  ({ 0: 'Gözləyir', 1: 'Təsdiqlənib', 2: 'Rədd edilib', 3: 'Ləğv edilib' })[s] ?? '—'

const statusClass = (s) =>
  ({ 0: 'pending', 1: 'confirmed', 2: 'rejected', 3: 'cancelled' })[s] ?? ''

// Rezervi ləğv edir və siyahını yeniləyir
const cancel = async (r) => {
  try {
    const result = await cancelReservation(r.id)
    ElNotification({ title: 'Uğurlu', message: result.message, type: 'success', zIndex: 99999 })
    await load()
  } catch (e) {
    ElNotification({
      title: 'Xəta',
      message: e?.userMessage ?? e?.message ?? 'Xəta baş verdi',
      type: 'error',
      zIndex: 99999,
    })
  }
}

onMounted(load)
</script>

<style scoped>
.res-page {
  min-height: calc(100vh - 61px);
  background: #f4f6f8;
  padding: 30px 40px 60px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.res-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 4px;
  color: #1a1118;
  font-size: 1.7rem;
}

.page-sub {
  margin: 0 0 24px;
  color: #6c757d;
  font-size: 0.92rem;
}

.no-result {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.no-result h3 {
  color: #333;
  margin: 0 0 8px;
}

.no-result p {
  color: #666;
  margin: 0 0 20px;
}

.primary-btn {
  background: #721438;
  color: white;
  border: none;
  padding: 9px 22px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.primary-btn:hover {
  background: #590f2b;
}

.res-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.res-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  border: 1px solid #eaeaea;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.res-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.res-title-row h3 {
  margin: 0;
  color: #1a1118;
  font-size: 1.1rem;
}

.status-tag {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 11px;
  border-radius: 20px;
}

.status-tag.pending {
  background: #fff6e0;
  color: #b07d2b;
}

.status-tag.confirmed {
  background: #e3f6e8;
  color: #1e7e34;
}

.status-tag.rejected {
  background: #fdeaea;
  color: #c0392b;
}

.status-tag.cancelled {
  background: #f1f3f5;
  color: #868e96;
}

.res-line {
  margin: 0 0 4px;
  font-size: 0.88rem;
  color: #495057;
}

.res-line.total b {
  color: #721438;
}

.res-note {
  margin: 6px 0 0;
  font-size: 0.82rem;
  color: #868e96;
  font-style: italic;
}

.cancel-btn {
  background: #fff;
  color: #c0392b;
  border: 1px solid #e5b4ae;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #fdeaea;
}

@media (max-width: 600px) {
  .res-card {
    flex-direction: column;
  }
}
</style>
