import { onBeforeUnmount, ref, watch } from 'vue'

// Statistika rəqəmi dəyişəndə sıçramaq əvəzinə sayaraq dəyişir.
// Kiçik detaldır, amma panelin «canlı» hiss olunmasına kömək edir.
//
// İstifadə: const display = useCountUp(() => stats.value.users)
//           <span>{{ display }}</span>
export function useCountUp(getter, duration = 500) {
  const display = ref(0)
  let frame = null

  const animate = (from, to) => {
    if (frame) cancelAnimationFrame(frame)

    // Fərq yoxdursa animasiyaya ehtiyac yoxdur
    if (from === to) {
      display.value = to
      return
    }

    const start = performance.now()

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      // Yavaş-yavaş dayanan əyri — sonda sərt dayanmır
      const eased = 1 - Math.pow(1 - progress, 3)

      display.value = Math.round(from + (to - from) * eased)

      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
  }

  watch(
    () => Number(getter() ?? 0),
    (next, prev) => animate(prev ?? 0, next),
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame)
  })

  return display
}
