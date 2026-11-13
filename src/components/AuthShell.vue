<template>
  <!-- Giriş, qeydiyyat və parol bərpası səhifələrinin ortaq qabığı.
       Əvvəl bu səhifələrdə nə başlıq, nə loqo keçidi vardı: bura düşən
       qonaq ana səhifəyə qayıda bilmirdi. İndi hər səhifədə loqo (ana
       səhifəyə aparır) və «Ana səhifə» keçidi var. -->
  <div class="auth-shell" :class="{ wide, compact }">
    <!-- Sol tərəf: yalnız geniş ekranda. Telefonda onun yerini yuxarıdakı
         şərab rəngli zolaq tutur. -->
    <!-- Naxışın tərifi ayrıca dayanır: sol panel telefonda gizlənir və
         gizli elementin içindəki tərif işləmir -->
    <svg class="auth-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <pattern :id="patternId" width="64" height="64" patternUnits="userSpaceOnUse">
          <path :d="STAR" transform="translate(16 16)" fill="none" stroke="currentColor" stroke-width="1" />
          <path d="M0 26 6 32 0 38M64 26 58 32 64 38M26 0 32 6 38 0M26 64 32 58 38 64" fill="none" stroke="currentColor" stroke-width="1" />
        </pattern>
      </defs>
    </svg>

    <aside class="auth-art">
      <svg class="auth-pattern" aria-hidden="true">
        <rect width="100%" height="100%" :fill="`url(#${patternId})`" />
      </svg>

      <div class="auth-art-inner">
        <BrandMark :size="44" class="auth-art-mark" />
        <h2>Toyunuzun ən gözəl günü<br />düzgün məkandan başlayır</h2>
        <p class="auth-art-lead">
          Sarayları, zalları və menyuları bir yerdə müqayisə edin, boş tarixi görün və birbaşa
          sarayla yazışın.
        </p>

        <ul class="auth-points">
          <li>
            <span><Search :size="18" /></span>
            Şəhər, qonaq sayı və büdcəyə görə axtarış
          </li>
          <li>
            <span><CalendarCheck :size="18" /></span>
            Boş günlər əvvəlcədən görünür
          </li>
          <li>
            <span><MessagesSquare :size="18" /></span>
            Sorğu paylaşın — saraylar özü təklif göndərsin
          </li>
        </ul>
      </div>
    </aside>

    <main class="auth-main">
      <header class="auth-top">
        <svg class="auth-pattern" aria-hidden="true">
          <rect width="100%" height="100%" :fill="`url(#${patternId})`" />
        </svg>

        <router-link to="/" class="auth-logo" aria-label="TOYUN — ana səhifə">
          <BrandMark :size="26" />
          <span>TOY<b>UN</b></span>
        </router-link>

        <router-link to="/" class="auth-home">
          <ArrowLeft :size="16" />
          Ana səhifə
        </router-link>

        <!-- Yalnız telefonda: sol panelin şüarı burada, qısa şəkildə -->
        <p class="auth-top-tag">Toyunuzun ən gözəl günü<br />düzgün məkandan başlayır</p>
      </header>

      <section class="auth-body">
        <div class="auth-panel">
          <button v-if="back" type="button" class="auth-back" @click="$emit('back')">
            <ArrowLeft :size="15" />
            Geri
          </button>

          <h1>{{ title }}</h1>
          <p v-if="subtitle" class="auth-sub">{{ subtitle }}</p>

          <slot />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ArrowLeft, CalendarCheck, MessagesSquare, Search } from 'lucide-vue-next'
import BrandMark, { starPath } from '@/components/BrandMark.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  // Seçim ekranı kimi enli məzmun üçün
  wide: { type: Boolean, default: false },
  // Çox sahəli forma: telefonda şüar gizlənir və aralar sıxılır ki,
  // bütün forma sürüşdürmədən ekrana sığsın
  compact: { type: Boolean, default: false },
  // Səhifənin öz daxili «Geri» addımı varsa
  back: { type: Boolean, default: false },
})

defineEmits(['back'])

const STAR = starPath(13)
const patternId = 'toyun-lattice'
</script>

<style>
/* Qəsdən «scoped» deyil: içəridəki formalar səhifələrdən slot ilə gəlir və
   hamısı eyni görünməlidir. Bütün qaydalar .auth-shell altındadır. */

.auth-shell {
  --auth-wine: #5a0f2c;
  --auth-wine-deep: #2b0714;
  --auth-ivory: #fbf7f1;
  --auth-gold-ink: #8f6410;

  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(380px, 5fr) 7fr;
  background: var(--auth-ivory);
  font-family: var(--font);
  color: var(--ink);
}

.auth-defs {
  position: absolute;
  color: var(--gold);
}

.auth-pattern {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--gold);
  opacity: 0.13;
  pointer-events: none;
}

/* ————— sol panel ————— */

.auth-art {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  padding: 56px 52px;
  color: #fff;
  background:
    radial-gradient(120% 80% at 0% 100%, rgba(223, 177, 91, 0.22), transparent 60%),
    linear-gradient(160deg, var(--auth-wine-deep) 0%, var(--auth-wine) 62%, #7b1a3f 100%);
}

.auth-art-inner {
  position: relative;
  max-width: 440px;
}

.auth-art-mark {
  color: var(--gold);
  margin-bottom: 26px;
}

.auth-art h2 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.7rem, 2.5vw, 2.35rem);
  line-height: 1.16;
  letter-spacing: -0.01em;
  margin: 0 0 16px;
}

.auth-art-lead {
  margin: 0 0 30px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.98rem;
  line-height: 1.65;
}

.auth-points {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}

.auth-points li {
  display: flex;
  align-items: center;
  gap: 13px;
  font-size: 0.93rem;
  color: rgba(255, 255, 255, 0.9);
}

.auth-points span {
  flex: none;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: var(--gold);
  background: rgba(223, 177, 91, 0.13);
  border: 1px solid rgba(223, 177, 91, 0.28);
}

/* ————— sağ tərəf ————— */

.auth-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.auth-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 36px;
}

.auth-top .auth-pattern,
.auth-top-tag {
  display: none;
}

.auth-logo {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  color: var(--brand);
  text-decoration: none;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.35rem;
  letter-spacing: 0.04em;
}

.auth-logo .brand-mark {
  color: var(--gold);
}

.auth-logo b {
  font-weight: 600;
  color: var(--auth-gold-ink);
}

.auth-home {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 40px;
  padding: 0 15px;
  border-radius: var(--r-pill);
  border: 1px solid #e6dccd;
  background: #fff;
  color: var(--ink-2);
  font-size: 0.86rem;
  font-weight: 600;
  text-decoration: none;
  transition: border-color var(--t), color var(--t);
}

.auth-home:hover {
  border-color: var(--brand);
  color: var(--brand);
}

.auth-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 12px 24px 44px;
}

.auth-panel {
  width: 100%;
  max-width: 420px;
}

.auth-shell.wide .auth-panel {
  max-width: 640px;
}

.auth-panel h1 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.75rem, 3.2vw, 2.2rem);
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: var(--ink);
  margin: 0 0 8px;
}

.auth-sub {
  margin: 0 0 28px;
  color: var(--ink-2);
  font-size: 0.95rem;
  line-height: 1.55;
}

.auth-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  margin: 0 0 14px -2px;
  padding: 0;
  background: none;
  border: none;
  color: var(--muted);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.auth-back:hover {
  color: var(--brand);
}

/* ————— forma elementləri ————— */

.auth-shell .auth-field {
  display: block;
  margin-bottom: 16px;
}

.auth-shell .auth-label {
  display: block;
  margin-bottom: 7px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-2);
}

.auth-shell .auth-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.auth-shell .el-form-item {
  margin-bottom: 0;
}

.auth-shell .el-input__wrapper {
  min-height: 50px;
  padding: 0 14px;
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 0 0 1px #e3d9cb inset;
  transition: box-shadow var(--t);
}

.auth-shell .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px #cdbfaa inset;
}

.auth-shell .el-input__wrapper.is-focus {
  box-shadow:
    0 0 0 1.5px var(--brand) inset,
    0 0 0 4px rgba(114, 20, 56, 0.1);
}

.auth-shell .el-input__inner {
  height: 48px;
  font-family: var(--font);
  font-size: 1rem;
  color: var(--ink);
}

.auth-shell .el-input__inner::placeholder {
  color: #b3a79a;
}

.auth-shell .el-input__prefix {
  color: #a8998a;
  margin-right: 4px;
}

.auth-shell .el-input__wrapper.is-focus .el-input__prefix {
  color: var(--brand);
}

/* Brauzerin avtomatik doldurması sahəni göy-sarı boyamasın */
.auth-shell .el-input__inner:-webkit-autofill,
.auth-shell .el-input__inner:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--ink);
  box-shadow: 0 0 0 1000px #fff inset;
  transition: background-color 9999s ease-out;
}

.auth-shell .auth-submit {
  width: 100%;
  min-height: 52px;
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: none;
  border-radius: 13px;
  background: var(--brand);
  color: #fff;
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(114, 20, 56, 0.24);
  transition: background var(--t), transform var(--t-fast), box-shadow var(--t);
}

.auth-shell .auth-submit:hover:not(:disabled) {
  background: var(--brand-dark);
  box-shadow: 0 12px 26px rgba(114, 20, 56, 0.3);
}

.auth-shell .auth-submit:active:not(:disabled) {
  transform: translateY(1px);
}

.auth-shell .auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.auth-shell .auth-spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: auth-spin 0.7s linear infinite;
}

@keyframes auth-spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-shell .auth-error {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 0 0 14px;
  padding: 11px 13px;
  border-radius: 11px;
  background: var(--danger-soft);
  color: #8a1f39;
  font-size: 0.87rem;
  line-height: 1.45;
  white-space: pre-line;
}

.auth-shell .auth-error svg {
  flex: none;
  margin-top: 1px;
}

.auth-shell .auth-inline {
  display: flex;
  justify-content: flex-end;
  margin: -6px 0 12px;
}

.auth-shell .auth-link {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  color: var(--auth-gold-ink);
  font-weight: 600;
  font-size: 0.88rem;
  text-decoration: none;
}

.auth-shell .auth-link:hover {
  color: var(--brand);
  text-decoration: underline;
}

.auth-shell .auth-switch {
  margin: 22px 0 0;
  padding-top: 20px;
  border-top: 1px solid #ebe2d5;
  text-align: center;
  color: var(--ink-2);
  font-size: 0.92rem;
}

.auth-shell .auth-switch .auth-link {
  font-size: 0.92rem;
  margin-left: 4px;
}

.auth-shell .auth-note {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 26px 20px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #ebe2d5;
  text-align: center;
  color: var(--ink-2);
  line-height: 1.55;
}

.auth-shell .auth-note-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--gold-soft);
  color: var(--auth-gold-ink);
}

.auth-shell .auth-note p {
  margin: 0;
  color: var(--ink);
  font-weight: 500;
}

.auth-shell .auth-note small {
  color: var(--muted);
  font-size: 0.82rem;
}

/* ————— telefon və planşet ————— */

@media (max-width: 940px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-art {
    display: none;
  }

  /* Sol panelin yerinə: şərab rəngli zolaq, forma onun üstünə çıxır */
  .auth-top {
    padding: 14px 18px 62px;
    overflow: hidden;
    background: linear-gradient(150deg, var(--auth-wine-deep), var(--auth-wine) 70%, #7b1a3f);
  }

  .auth-top .auth-pattern {
    display: block;
  }

  .auth-logo {
    color: #fff;
  }

  .auth-logo b {
    color: var(--gold);
  }

  .auth-home {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.24);
    color: #fff;
  }

  .auth-home:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  /* Forma zolağın üstünə çıxır — zolaq «position: relative» olduğundan
     z-index verilməsə kartın başını örtürdü */
  .auth-body {
    position: relative;
    z-index: 1;
    justify-content: flex-start;
    padding: 0 14px 28px;
  }

  .auth-panel {
    margin-top: -40px;
    padding: 26px 20px 24px;
    border-radius: 22px;
    background: #fff;
    box-shadow: 0 14px 40px rgba(43, 7, 20, 0.14);
  }

  .auth-shell .el-input__wrapper {
    background: #fdfbf8;
  }

  .auth-shell .el-input__inner:-webkit-autofill,
  .auth-shell .el-input__inner:-webkit-autofill:focus {
    box-shadow: 0 0 0 1000px #fdfbf8 inset;
  }
}

/* Telefon: forma ekranın altına qədər uzanan vərəqdir. Əvvəl kart
   yuxarıda dayanırdı və ekranın alt yarısı boş qalırdı. İndi yuxarıda
   şüarlı zolaq, altında ekranı sona qədər dolduran ağ vərəq var; «hesabınız
   yoxdur?» keçidi vərəqin dibində, baş barmağın çatdığı yerdədir. */
@media (max-width: 600px) {
  .auth-top {
    flex-wrap: wrap;
    row-gap: 0;
    padding: 12px 18px 0;
  }

  .auth-top-tag {
    position: relative;
    display: block;
    flex-basis: 100%;
    margin: clamp(18px, 5.5dvh, 46px) 0 clamp(44px, 8dvh, 70px);
    color: #fff;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(1.35rem, 6.4vw, 1.7rem);
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .auth-body {
    padding: 0;
    align-items: stretch;
  }

  .auth-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: none;
    margin-top: -26px;
    padding: 28px 22px calc(22px + env(safe-area-inset-bottom, 0px));
    border-radius: 28px 28px 0 0;
    box-shadow: 0 -10px 30px rgba(43, 7, 20, 0.18);
  }

  .auth-shell.wide .auth-panel {
    max-width: none;
  }

  /* Seçim ekranında iki kart var — şüar az yer tutsun ki, hamısı sığsın */
  .auth-shell.wide .auth-top-tag {
    margin: 14px 0 46px;
    font-size: 1.25rem;
  }

  .auth-shell .auth-switch {
    margin-top: auto;
  }

  /* Vərəqin dibinə yapışan keçidlə forma arasında ən azı bu qədər ara */
  .auth-shell .auth-panel > .el-form,
  .auth-shell .auth-panel > .choices,
  .auth-shell .auth-panel > .auth-note {
    margin-bottom: 26px;
  }
}

/* Alçaq ekranlarda (kiçik telefon, açıq klaviatura) şüar yer tutmasın */
@media (max-width: 600px) and (max-height: 720px) {
  .auth-top-tag {
    display: none;
  }

  .auth-top {
    padding-bottom: 44px;
  }
}

/* Ən alçaq telefonlar (hündürlük 600-dən az, məs. 320×568) */
@media (max-width: 600px) and (max-height: 600px) {
  .auth-top {
    padding-bottom: 38px;
  }

  .auth-panel,
  .auth-shell.compact .auth-panel {
    padding-top: 14px;
    padding-bottom: 8px;
  }

  .auth-panel h1 {
    font-size: 1.5rem;
    margin-bottom: 14px;
  }

  .auth-sub {
    display: none;
  }

  .auth-shell .auth-field {
    margin-bottom: 10px;
  }

  .auth-shell .auth-label {
    margin-bottom: 4px;
  }

  .auth-shell .el-input__wrapper {
    min-height: 44px;
  }

  .auth-shell .el-input__inner {
    height: 42px;
  }

  .auth-shell .auth-inline {
    margin: -4px 0 4px;
  }

  .auth-shell .auth-submit {
    min-height: 46px;
    margin-top: 2px;
  }

  .auth-shell .auth-panel > .el-form,
  .auth-shell .auth-panel > .choices,
  .auth-shell .auth-panel > .auth-note {
    margin-bottom: 10px;
  }

  .auth-shell .auth-switch {
    padding-top: 8px;
    font-size: 0.86rem;
  }
}

/* Seçim ekranı orta hündürlükdə (700–820) şüarla birlikdə sığmır */
@media (max-width: 600px) and (max-height: 820px) {
  .auth-shell.wide .auth-top-tag {
    display: none;
  }

  .auth-shell.wide .auth-top {
    padding-bottom: 44px;
  }
}

/* Çox sahəli forma (qeydiyyat): hər şey bir ekrana sığmalıdır */
@media (max-width: 600px) {
  .auth-shell.compact .auth-top-tag {
    display: none;
  }

  .auth-shell.compact .auth-top {
    padding-bottom: 42px;
  }

  .auth-shell.compact .auth-panel {
    padding-top: 20px;
  }

  .auth-shell.compact .auth-back {
    margin-bottom: 4px;
  }

  .auth-shell.compact .auth-panel h1 {
    font-size: 1.6rem;
  }

  .auth-shell.compact .auth-sub {
    margin-bottom: 18px;
    font-size: 0.9rem;
  }

  .auth-shell.compact .auth-field {
    margin-bottom: 12px;
  }

  .auth-shell.compact .auth-label {
    margin-bottom: 5px;
  }

  .auth-shell.compact .auth-row {
    gap: 10px;
  }

  .auth-shell.compact .auth-panel > .el-form {
    margin-bottom: 16px;
  }

  .auth-shell.compact .auth-switch {
    padding-top: 14px;
  }
}

/* Alçaq telefon (hündürlük 700-dən az): daha da sıx */
@media (max-width: 600px) and (max-height: 700px) {
  .auth-shell.compact .auth-sub {
    display: none;
  }

  .auth-shell.compact .auth-panel h1 {
    font-size: 1.4rem;
    margin-bottom: 12px;
  }

  .auth-shell.compact .auth-panel {
    padding-top: 16px;
    padding-bottom: 12px;
  }

  .auth-shell.compact .el-input__wrapper {
    min-height: 44px;
  }

  .auth-shell.compact .el-input__inner {
    height: 42px;
  }

  .auth-shell.compact .auth-field {
    margin-bottom: 9px;
  }

  .auth-shell.compact .auth-label {
    margin-bottom: 3px;
    font-size: 0.76rem;
  }

  .auth-shell.compact .auth-submit {
    min-height: 46px;
    margin-top: 4px;
  }

  .auth-shell.compact .auth-panel > .el-form {
    margin-bottom: 10px;
  }

  .auth-shell.compact .auth-switch {
    padding-top: 8px;
    font-size: 0.86rem;
  }
}
</style>
