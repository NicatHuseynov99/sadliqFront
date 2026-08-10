<template>
  <!-- Sarayın davranış göstəriciləri. Müştəri sorğu göndərməzdən əvvəl
       cavab alıb-almayacağını bilməlidir — bu rəqəmlər əvvəl yalnız
       sarayın öz hesabatında görünürdü.

       Məlumat azdırsa heç nə göstərmirik: yanıltıcı rəqəm heç nədən pisdir. -->
  <div v-if="hasSomethingToShow" class="trust">
    <span class="tr-title">Bu saray necə cavab verir</span>

    <div class="tr-items">
      <div v-if="trust.averageResponseHours != null" class="tr-item">
        <b>{{ responseText }}</b>
        <span>orta cavab müddəti</span>
      </div>

      <div v-if="trust.confirmPercent != null" class="tr-item">
        <b>{{ trust.confirmPercent }}%</b>
        <span>sorğuları təsdiqləyir</span>
      </div>

      <!-- Mənfi siqnallar yalnız real olduqda göstərilir -->
      <div v-if="trust.expiredCount > 0" class="tr-item warn">
        <b>{{ trust.expiredCount }}</b>
        <span>sorğunu cavabsız qoyub</span>
      </div>

      <div v-if="trust.cancelledAfterConfirmCount > 0" class="tr-item danger">
        <b>{{ trust.cancelledAfterConfirmCount }}</b>
        <span>təsdiqdən sonra ləğv edib</span>
      </div>
    </div>

    <span class="tr-note">
      Son 6 ayda {{ trust.basedOnRequests }} sorğu əsasında
    </span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getVenueTrust } from '@/services/venueService'

const props = defineProps({
  venueId: { type: Number, required: true },
})

const trust = ref({
  averageResponseHours: null,
  confirmPercent: null,
  expiredCount: 0,
  cancelledAfterConfirmCount: 0,
  basedOnRequests: 0,
  hasEnoughData: false,
})

// Göstəriləcək bir şey yoxdursa blok tamamilə gizlənir
const hasSomethingToShow = computed(
  () =>
    trust.value.averageResponseHours != null ||
    trust.value.confirmPercent != null ||
    trust.value.expiredCount > 0 ||
    trust.value.cancelledAfterConfirmCount > 0,
)

// Saatı insan dilinə çeviririk: «26 saat» yerine «1 gün»
const responseText = computed(() => {
  const hours = trust.value.averageResponseHours
  if (hours == null) return ''

  if (hours < 1) return 'bir saatdan az'
  if (hours < 24) return `${Math.round(hours)} saat`

  const days = Math.round(hours / 24)
  return days === 1 ? '1 gün' : `${days} gün`
})

const load = async () => {
  try {
    trust.value = await getVenueTrust(props.venueId)
  } catch {
    // Göstəricilər ikinci dərəcəlidir — alınmasa səhifə onsuz işləyir
  }
}

watch(() => props.venueId, load, { immediate: true })
</script>

<style scoped>
.trust {
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--r);
  padding: 13px 16px;
  margin-bottom: 16px;
}

.tr-title {
  display: block;
  font-size: 0.74rem;
  color: var(--muted-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 9px;
}

.tr-items {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.tr-item {
  display: flex;
  flex-direction: column;
}

.tr-item b {
  font-size: 1.02rem;
  color: var(--ok);
  line-height: 1.2;
}

.tr-item span {
  font-size: 0.73rem;
  color: var(--muted);
  margin-top: 2px;
}

/* Mənfi siqnallar seçilməlidir, amma qışqırmamalıdır */
.tr-item.warn b {
  color: var(--warn);
}

.tr-item.danger b {
  color: var(--danger);
}

.tr-note {
  display: block;
  font-size: 0.68rem;
  color: var(--faint);
  margin-top: 10px;
}

@media (max-width: 600px) {
  .tr-items {
    gap: 16px;
  }
}
</style>
