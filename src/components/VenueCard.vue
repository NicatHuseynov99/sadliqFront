<template>
  <div class="venue-card">
    <div class="image-wrapper">
      <img
        :src="venue.coverImageUrl"
        :alt="venue.name"
        class="venue-img"
        loading="lazy"
        decoding="async"
        @error="onImgError"
      />
      <span class="badge">{{ venue.city }}</span>

      <!-- Müqayisə seçimi: müştəri 2-3 sarayı yan-yana qoya bilir -->
      <button
        class="cmp-btn"
        :class="{ on: isCompared }"
        :aria-pressed="isCompared"
        :aria-label="isCompared ? 'Müqayisədən çıxar' : 'Müqayisəyə əlavə et'"
        :title="isCompared ? 'Müqayisədən çıxar' : 'Müqayisəyə əlavə et'"
        @click.stop="$emit('toggle-compare', venue)"
      >
        ⇄
      </button>

      <button
        class="fav-btn"
        :aria-pressed="isFavorite"
        :aria-label="isFavorite ? 'Seçilmişlərdən sil' : 'Seçilmişlərə əlavə et'"
        :title="isFavorite ? 'Seçilmişlərdən sil' : 'Seçilmişlərə əlavə et'"
        @click.stop="$emit('toggle-favorite', venue)"
      >
        ♥
      </button>

      <div class="card-price-tag">
        <strong>Min. {{ minPrice }} ₼</strong>
        <span>1 nəfər üçün</span>
      </div>
    </div>

    <div class="venue-info">
      <div class="title-row">
        <h3>{{ venue.name }}</h3>
        <span class="rating-pill">★ {{ venue.rating }}</span>
      </div>

      <div class="avail-row" v-if="nearestDate !== undefined">
        <span v-if="nearestDate" class="avail-badge free">
          ✅ Ən yaxın boş tarix: <b>{{ formatDate(nearestDate) }}</b>
        </span>
        <span v-else class="avail-badge busy">⛔ Yaxın 4 ayda boş tarix yoxdur</span>
      </div>

      <div class="address-row">
        <AddressLink
          compact
          :address="venue.address"
          :city="venue.city"
          :latitude="venue.latitude"
          :longitude="venue.longitude"
        />
        <span class="rev-count">· {{ venue.reviewCount }} rəy</span>
        <!-- Parkinq tutumu ünvanın yanında verilir: yer seçimində ikinci ən vacib məlumatdır -->
        <span v-if="venue.parkingCapacity" class="parking-tag" :title="venue.hasValetParking ? 'Valet xidməti var' : ''">
          🅿️ {{ venue.parkingCapacity }}{{ venue.hasValetParking ? ' · valet' : '' }}
        </span>
      </div>

      <p class="description">{{ venue.description }}</p>

      <div class="halls-preview">
        <span v-for="hall in venue.halls" :key="hall.id" class="hall-tag">
          {{ hall.name }} (Max: {{ hall.capacity }} nəfər)
        </span>
      </div>

      <div class="menu-preview">
        <span class="menu-preview-label">Menyular</span>
        <div class="menu-chips">
          <div v-for="m in venue.menus" :key="m.id" class="menu-chip" @click="$emit('select', venue)">
            <img :src="m.coverImageUrl" :alt="m.name" @error="onImgError" />
            <div class="menu-chip-text">
              <strong>{{ m.name }}</strong>
              <span>{{ m.pricePerPerson }} ₼</span>
            </div>
          </div>
        </div>
      </div>

      <div class="venue-footer">
        <div class="menus-summary">
          <small>{{ venue.halls.length }} zal · {{ venue.menus.length }} menyu</small>
        </div>
        <button @click="$emit('select', venue)" class="detail-btn">Seç / Bax</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AddressLink from '@/components/AddressLink.vue'
import { formatDate } from '@/utils/date'
import { onImgError } from '@/utils/imageFallback'

const props = defineProps({
  venue: { type: Object, required: true },
  isFavorite: { type: Boolean, default: false },
  isCompared: { type: Boolean, default: false },
  nearestDate: { type: [String, null], default: undefined },
})

defineEmits(["select", "toggle-favorite", "toggle-compare"])

// Kartda göstərilən minimum menyu qiyməti
const minPrice = computed(() => {
  const menus = props.venue.menus ?? []
  return menus.length ? Math.min(...menus.map((m) => m.pricePerPerson)) : 0
})

// Şəkil yüklənməsə ehtiyat şəkil qoyur ki, kart boş görünməsin
</script>

<style scoped>
.venue-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #eaeaea;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.venue-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.image-wrapper {
  position: relative;
  height: 220px;
}

.venue-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 4px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

/* Müqayisə düyməsi ürəyin altında durur */
.cmp-btn {
  position: absolute;
  top: 52px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: grid;
  place-items: center;
  font-size: 1rem;
  color: #adb5bd;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  z-index: 2;
}

.cmp-btn:hover {
  color: var(--info);
  transform: scale(1.08);
}

.cmp-btn.on {
  background: var(--info);
  color: #fff;
}

.fav-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  color: #adb5bd;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.fav-btn:hover {
  transform: scale(1.12);
  color: var(--brand);
}

.fav-btn[aria-pressed="true"] {
  background: var(--brand);
  color: #fff;
}

.card-price-tag {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.card-price-tag strong {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.1;
}

.card-price-tag span {
  font-size: 0.65rem;
  text-transform: uppercase;
  opacity: 0.8;
}

.venue-info {
  padding: 18px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.title-row h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--ink);
}

.rating-pill {
  background: #fdf3e0;
  color: #b07d2b;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 3px 9px;
  border-radius: 20px;
  white-space: nowrap;
}

.avail-row {
  margin-bottom: 8px;
}

.avail-badge {
  display: inline-block;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.avail-badge.free {
  background: #e8f6ec;
  color: #1e7e34;
}

.avail-badge.busy {
  background: var(--danger-soft);
  color: #c0392b;
}

.address-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.rev-count {
  color: #adb5bd;
  font-size: 0.8rem;
}

.parking-tag {
  margin-left: auto;
  background: var(--info-soft);
  color: #1c5cab;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 20px;
  white-space: nowrap;
}

.description {
  font-size: 0.88rem;
  color: #495057;
  margin-bottom: 14px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.halls-preview {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hall-tag {
  background: #f1f3f5;
  color: #495057;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.menu-preview {
  margin-bottom: 14px;
}

.menu-preview-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #adb5bd;
  margin-bottom: 7px;
}

.menu-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.menu-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f9fa;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 5px 10px 5px 5px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.menu-chip:hover {
  border-color: var(--gold);
  background: #fffaf0;
}

.menu-chip img {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
}

.menu-chip-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.menu-chip-text strong {
  font-size: 0.8rem;
  color: var(--ink);
}

.menu-chip-text span {
  font-size: 0.72rem;
  color: var(--brand);
  font-weight: 600;
}

.venue-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f3f5;
  padding-top: 12px;
  margin-top: auto;
  gap: 10px;
}

.menus-summary small {
  color: #6c757d;
  font-size: 0.75rem;
  display: block;
  max-width: 170px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-btn {
  background: var(--brand);
  color: white;
  border: none;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  transition: background 0.2s;
  white-space: nowrap;
}

.detail-btn:hover {
  background: var(--brand-dark);
}
</style>
