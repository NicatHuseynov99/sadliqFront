<template>
  <!-- Saray kartının yüklənmə hali: siyahı boş qalmasın -->
  <div class="sk-card">
    <UiSkeleton shape="block" height="200px" />

    <div class="sk-body">
      <UiSkeleton shape="title" />
      <UiSkeleton width="80%" />
      <UiSkeleton width="60%" />

      <div class="sk-foot">
        <UiSkeleton width="90px" height="30px" />
        <UiSkeleton width="110px" height="30px" />
      </div>
    </div>
  </div>
</template>

<script setup>
import UiSkeleton from '@/components/ui/UiSkeleton.vue'
</script>

<style scoped>
.sk-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
}

.sk-body {
  padding: var(--sp-4);
}

.sk-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
}
</style>
