<template>
  <!-- Panel bölmələri arasında keçid.

       Geniş ekranda adi düymə sırasıdır. Telefonda isə sıra işləmir:
       admin panelində 11 bölmə 358px ekrana 1452px en tuturdu — istifadəçi
       dörd ekran yana sürüşdürməli, harada olduğunu və nələrin qaldığını
       yadda saxlamalı idi. Telefonda bir düymə var: hazırkı bölməni göstərir,
       basanda bütün bölmələr aşağıdan açılan vərəqdə bir baxışda görünür. -->
  <nav class="snav" aria-label="Bölmələr">
    <div class="snav-row">
      <button
        v-for="t in tabs"
        :key="t.value"
        type="button"
        class="snav-tab"
        :class="{ active: modelValue === t.value }"
        @click="pick(t.value)"
      >
        <component :is="t.icon" v-if="t.icon" :size="16" />
        {{ t.label }}
        <em v-if="t.badge" class="snav-badge">{{ t.badge }}</em>
        <em v-else-if="t.count != null" class="snav-count">{{ t.count }}</em>
      </button>
    </div>

    <button type="button" class="snav-current" :aria-expanded="open" @click="open = true">
      <span class="snav-cur-icon">
        <component :is="current?.icon" v-if="current?.icon" :size="20" />
      </span>
      <span class="snav-cur-text">
        <small>Bölmə</small>
        <b>{{ current?.label }}</b>
      </span>
      <span class="snav-all">
        <em v-if="otherBadges" class="snav-badge">{{ otherBadges }}</em>
        <LayoutGrid :size="17" />
        Hamısı
      </span>
    </button>

    <teleport to="body">
      <transition name="snav-fade">
        <div v-if="open" class="snav-overlay" @click.self="open = false">
          <div class="snav-sheet" role="dialog" aria-label="Bölmələr">
            <span class="snav-grab" aria-hidden="true"></span>

            <div class="snav-sheet-head">
              <h3>Bölmələr</h3>
              <button type="button" class="snav-close" aria-label="Bağla" @click="open = false">
                <X :size="18" />
              </button>
            </div>

            <div class="snav-grid">
              <button
                v-for="t in tabs"
                :key="t.value"
                type="button"
                class="snav-tile"
                :class="{ active: modelValue === t.value }"
                @click="pick(t.value)"
              >
                <span class="snav-tile-icon">
                  <component :is="t.icon" v-if="t.icon" :size="22" />
                  <em v-if="t.badge" class="snav-badge">{{ t.badge }}</em>
                </span>
                {{ t.label }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </nav>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { LayoutGrid, X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: [String, Number], required: true },
  // { value, label, icon (komponent), badge (diqqət tələb edən say), count (neytral say) }
  tabs: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)

const current = computed(() => props.tabs.find((t) => t.value === props.modelValue) ?? props.tabs[0])

// Düymədə yalnız BAŞQA bölmələrdə gözləyən işlərin cəmi görünür —
// hazırkı bölmənin sayı onsuz da səhifənin özündədir
const otherBadges = computed(() =>
  props.tabs.reduce((sum, t) => sum + (t.value !== props.modelValue ? Number(t.badge) || 0 : 0), 0),
)

const pick = (value) => {
  emit('update:modelValue', value)
  open.value = false
}

// Vərəq açıq olanda arxadakı səhifə sürüşməsin
watch(open, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.snav {
  margin-bottom: 20px;
}

/* ————— geniş ekran: düymə sırası ————— */

.snav-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.snav-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color var(--t), color var(--t), background var(--t);
}

.snav-tab:hover {
  border-color: var(--brand);
  color: var(--brand);
}

.snav-tab.active {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}

.snav-tab.active svg {
  color: var(--gold);
}

.snav-badge,
.snav-count {
  font-style: normal;
  min-width: 19px;
  height: 19px;
  padding: 0 6px;
  display: inline-grid;
  place-items: center;
  border-radius: var(--r-pill);
  font-size: 0.68rem;
  font-weight: 700;
}

.snav-badge {
  background: var(--gold);
  color: #3a2a05;
}

.snav-count {
  background: var(--surface-2);
  color: var(--muted);
}

.snav-tab.active .snav-count {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.snav-current {
  display: none;
}

/* ————— telefon: bir düymə + vərəq ————— */

@media (max-width: 700px) {
  /* Bölmə düyməsi sürüşəndə başlığın altında yapışıb qalır: uzun siyahıda
     aşağı enən istifadəçi bölməni dəyişmək üçün yuxarı qayıtmır */
  .snav {
    position: sticky;
    top: var(--header-h);
    z-index: 40;
    margin: 0 -4px 16px;
    padding: 8px 4px;
    background: linear-gradient(var(--bg) 82%, transparent);
  }

  .snav-row {
    display: none;
  }

  .snav-current {
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

  .snav-cur-icon {
    flex: none;
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: var(--ink);
    color: var(--gold);
  }

  .snav-cur-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .snav-cur-text small {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-2);
  }

  .snav-cur-text b {
    font-size: 1.02rem;
    font-weight: 600;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .snav-all {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 12px;
    border-radius: var(--r-pill);
    background: var(--surface-2);
    color: var(--ink-2);
    font-size: 0.8rem;
    font-weight: 600;
  }
}

/* ————— vərəq ————— */

.snav-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: flex-end;
  background: rgba(27, 18, 22, 0.5);
}

.snav-sheet {
  width: 100%;
  max-height: 86dvh;
  overflow-y: auto;
  padding: 10px 16px calc(18px + env(safe-area-inset-bottom, 0px));
  border-radius: 24px 24px 0 0;
  background: var(--surface);
  box-shadow: 0 -18px 50px rgba(27, 18, 22, 0.3);
}

.snav-grab {
  display: block;
  width: 40px;
  height: 4px;
  margin: 0 auto 12px;
  border-radius: 4px;
  background: var(--faint);
}

.snav-sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.snav-sheet-head h3 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.3rem;
  color: var(--ink);
}

.snav-close {
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

.snav-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.snav-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 6px 12px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  cursor: pointer;
}

.snav-tile-icon {
  position: relative;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--surface-2);
  color: var(--ink);
}

.snav-tile-icon .snav-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  box-shadow: 0 0 0 2px var(--surface);
}

.snav-tile.active {
  border-color: var(--ink);
  color: var(--ink);
}

.snav-tile.active .snav-tile-icon {
  background: var(--ink);
  color: var(--gold);
}

.snav-fade-enter-active,
.snav-fade-leave-active {
  transition: opacity 0.2s ease;
}

.snav-fade-enter-active .snav-sheet,
.snav-fade-leave-active .snav-sheet {
  transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.snav-fade-enter-from,
.snav-fade-leave-to {
  opacity: 0;
}

.snav-fade-enter-from .snav-sheet,
.snav-fade-leave-to .snav-sheet {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .snav-fade-enter-active .snav-sheet,
  .snav-fade-leave-active .snav-sheet {
    transition: none;
  }
}
</style>
