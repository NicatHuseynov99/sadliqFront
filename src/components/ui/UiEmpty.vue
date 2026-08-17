<template>
  <div class="ui-empty">
    <span class="ui-empty-icon">{{ icon }}</span>
    <h3>{{ title }}</h3>
    <p v-if="text">{{ text }}</p>
    <slot />
  </div>
</template>

<script setup>
// Boş hallar hər səhifədə eyni quruluşda: işarə, bir cümlə, bir addım
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
})
</script>

<style scoped>
/* Boş vəziyyət səhifəni doldurur. Əvvəl yuxarıda alçaq bir zolaq idi və
   altında yüzlərlə piksel boş ekran qalırdı — səhifə bitmiş yox, yarımçıq
   görünürdü. İndi qalan yerin ortasına oturur. */
.ui-empty {
  background: var(--surface);
  border: 1px dashed #eadfe3;
  border-radius: var(--r-lg);
  padding: 56px 24px;
  text-align: center;

  /* 42vh seçilib: səhifə boş qalanda ekranı doldurmağa bəs edir, amma
     panelin içindəki kiçik siyahılarda da yersiz uzun görünmür. */
  min-height: 42vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* İşarə brend rəngli dairənin içindədir: emoji tək qalanda səhifəyə
   düşmüş kimi görünür, çərçivə onu tərtibatın bir hissəsi edir. */
.ui-empty-icon {
  font-size: 2.1rem;
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  margin-bottom: 18px;
  border-radius: 50%;
  background: var(--brand-soft);
  line-height: 1;
}

.ui-empty h3 {
  margin: 0 0 6px;
  font-size: var(--fs-lg);
  color: var(--ink);
}

.ui-empty p {
  margin: 0 auto 18px;
  max-width: 420px;
  font-size: var(--fs-sm);
  color: var(--muted);
  line-height: 1.65;
}
</style>
