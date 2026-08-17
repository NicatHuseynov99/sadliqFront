// Şəkil yüklənməyəndə göstərilən ehtiyat görüntü.
//
// Əvvəl hər faylın öz ehtiyatı vardı və hamısı xarici sayta (picsum.photos,
// unsplash.com) gedirdi. Həmin saytlar əlçatan olmayanda ehtiyat şəklin
// özü də yüklənmirdi və brauzer sınıq-şəkil ikonu göstərirdi — istifadəçi
// üçün bu, saytın xarab olması kimi görünür.
//
// İndi ehtiyat görüntü sənədin içindədir: şəbəkə sorğusu yoxdur, ona görə
// heç vaxt uğursuz ola bilmir. Brend rəngləri ilə çəkilib ki, boşluq
// yamaq kimi yox, saytın bir hissəsi kimi görünsün.

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6e9ee"/>
      <stop offset="1" stop-color="#ece0e5"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#g)"/>
  <g fill="none" stroke="#c9a8b5" stroke-width="6" stroke-linejoin="round">
    <path d="M120 190v-60l40-34 40 34v60z"/>
    <path d="M200 190v-44l40-30 40 30v44z"/>
  </g>
  <rect x="104" y="188" width="192" height="8" rx="4" fill="#c9a8b5"/>
  <circle cx="160" cy="104" r="9" fill="#dfb15b"/>
</svg>`

// encodeURIComponent seçilib: base64-dən qısadır və faylda oxunaqlı qalır
export const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SVG.replace(/\n\s*/g, ' '))

// Ehtiyat şəkil də səhv versə hadisə yenidən işə düşür və sonsuz dövrə
// yaranır. Bir dəfə əvəz olunandan sonra nişanlanır və ikinci dəfə
// toxunulmur.
export const onImgError = (event) => {
  const el = event?.target
  if (!el || el.dataset.fallbackApplied) return

  el.dataset.fallbackApplied = '1'
  el.src = FALLBACK_IMAGE
}
