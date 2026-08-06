<template>
  <section class="ui-card" :class="{ flat, pad }">
    <header v-if="title || $slots.head" class="ui-card-head">
      <slot name="head">
        <div>
          <h3>{{ title }}</h3>
          <p v-if="sub">{{ sub }}</p>
        </div>
      </slot>

      <slot name="action" />
    </header>

    <slot />
  </section>
</template>

<script setup>
// Bütün ağ bloklar eyni künc, kölgə və boşluqla görünsün deyə
defineProps({
  title: { type: String, default: '' },
  sub: { type: String, default: '' },
  flat: { type: Boolean, default: false },
  pad: { type: Boolean, default: true },
})
</script>

<style scoped>
.ui-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-1);
}

.ui-card.flat {
  box-shadow: none;
}

.ui-card.pad {
  padding: var(--sp-5);
}

.ui-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
}

.ui-card-head h3 {
  margin: 0;
  font-size: var(--fs-md);
  color: var(--ink);
}

.ui-card-head p {
  margin: 3px 0 0;
  font-size: var(--fs-xs);
  color: var(--muted);
  line-height: 1.55;
}
</style>
