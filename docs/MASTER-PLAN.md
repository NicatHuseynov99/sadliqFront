# TOYUN (toyun.az) — buraxılış planı (web + backend + iOS + Android)

Tarix: 2026-11-13. Kodun oxunması əsasında yazılıb (SadliqApi `dc82728`, sadliqFront `faba88b`).
Bu sənəd əvvəlki planları (`PLAN.md`, `ROADMAP.md`, `FRONT-PLAN.md`, `ANALIZ.md`) əvəz etmir —
onların üstünə **«mağazalara qədər yol»** qoyur.

---

## 1. Bugünkü vəziyyət

| | Backend (SadliqApi) | Frontend (sadliqFront) |
|---|---|---|
| Stack | .NET 8, EF Core + PostgreSQL, JWT, 4 qat (Core/Entities/DataAccess/Business) | Vue 3, Vite 8, Pinia, Element Plus, Leaflet |
| Ölçü | ~18 000 sətir, 25 controller, ~162 endpoint, 30 miqrasiya | ~34 000 sətir, 14 səhifə, 45 komponent |
| Hazır | 5 rol, saray/zal/menyu, rezerv + tutulma müddəti, əks-təklif, sorğu→təklif bazarı, yazışma, rəy + moderasiya, şikayət, bildiriş + kampaniya, audit, statistika, rate limit, fayl yükləmə (imza yoxlanışı ilə) | Bütün bu axınların ekranları, 3 breakpoint-də responsiv, alt naviqasiya, xəritə, müqayisə |
| Test | `tests/e2e` (bash, ~100 endpoint; SuperAdmin/Dəstək hissəsi yoxlanmır) | Yoxdur |
| Git | origin ilə sinxron | sinxron, `vite.config.js` commit olunmayıb |

**Nəticə:** funksional olaraq məhsul hazırdır. Çatmayan — **istehsal mühiti, mobil qabıq və mağaza tələbləri**.
Yeni funksiya yazmırıq, mövcud olanı buraxırıq.

---

## 2. Buraxılışı bloklayan tapıntılar

### Backend

| # | Tapıntı | Harada | Niyə bloklayır |
|---|---|---|---|
| B1 | JWT imza açarı və baza parolu `appsettings.json`-dadır və git-də izlənir | `SadliqApi/appsettings.json` | Açarı görən özünə admin token-i imzalayır. Açar **dəyişdirilməlidir** (git tarixçəsində qalır) |
| B2 | CORS yalnız `http://localhost:3000` | `Program.cs` | İstehsal domeni və mobil tətbiq (`capacitor://localhost`, `https://localhost`) bloklanır |
| B3 | Fayllar serverin diskinə yazılır | `FilesController.cs` | Konteyner hostinqində hər deploy-da şəkillər silinir |
| B4 | Fayl linki `Request.Scheme/Host`-dan qurulur, `UseForwardedHeaders` yoxdur | `FilesController.cs`, `Program.cs` | Proxy arxasında linklər `http://daxili-host` olur; rate limit bütün istifadəçiləri bir IP sayır |
| B5 | Hesabı silmə endpoint-i yoxdur | — | **App Store 5.1.1(v) və Google Play məcburi tələbidir** |
| B6 | Refresh token yoxdur, token 7 gün | `JwtHelper.cs` | Mobil istifadəçi hər həftə yenidən giriş edir; oğurlanan token ləğv olunmur |
| B7 | Push bildiriş yoxdur (cihaz token-i cədvəli, kanal) | `NotificationChannels.cs` | Mobil tətbiqin əsas dəyəri; Apple-ın «sadəcə sayt qabığı» rəddinə (4.2) qarşı əsas arqument |
| B8 | SMTP boşdur, SMS kanalı yalnız log yazır | `appsettings.json`, `SmsNotificationChannel` | Parol bərpası istehsalda işləmir |
| B9 | Miqrasiya avtomatik tətbiq olunmur, health endpoint, Dockerfile, CI yoxdur | — | Deploy əl işidir |
| B10 | Token vaxtı `DateTime.Now` ilə | `JwtHelper.cs` | Server UTC-də olanda sürüşmə; `UtcNow` olmalıdır |

Yaxşı xəbər: bildirişlər `INotificationChannel` üzərində qurulub — push **yeni bir sinifdir**, mövcud koda toxunmur.

### Frontend

| # | Tapıntı | Harada | Qeyd |
|---|---|---|---|
| F1 | 401-də `window.location.href = '/login'` | `services/api.js` | Mobil qabıqda tam yenidən yüklənmə; router ilə əvəzlənir + refresh axını |
| F2 | Token `localStorage`-da | `store/auth.js` | Mobildə təhlükəsiz saxlama (Keychain/Keystore) |
| F3 | `favicon.svg` 0 baytdır, tətbiq ikonu/splash yoxdur | `public/` | Mağaza üçün 1024×1024 ikon lazımdır |
| F4 | Məxfilik siyasəti, istifadə şərtləri, dəstək səhifəsi yoxdur | router | Hər iki mağaza URL tələb edir |
| F5 | Yazışma/bildiriş 15 san. sorğu ilə | 2 `setInterval` | Mobildə arxa fonda dayandırılmalıdır (batareya) |
| F6 | «Yoxlama borcu»: axınların çoxu brauzerdə əl ilə sınanmayıb | `FRONT-PLAN.md` §6.2 | Mağazaya getməzdən əvvəl bağlanmalıdır |
| F7 | Admin paneli mobil tətbiqə daxil olmamalıdır | router | Ölçü + Apple baxışı; web-də qalır |

---

## 3. Əsas qərarlar (tövsiyəmlə)

| Qərar | Tövsiyə | Səbəb |
|---|---|---|
| Mobil texnologiya | **Capacitor** (mövcud Vue kodu) | Sayt artıq telefona uyğundur, alt naviqasiya var. Flutter/RN = hər şeyi yenidən yazmaq |
| iOS yığımı | **Codemagic** (bulud Mac) | Bu kompüter Windows-dur, Xcode yalnız macOS-da işləyir. Mac almağa ehtiyac yoxdur |
| Hostinq | API + PostgreSQL → **Railway**; web → **Cloudflare Pages**; fayllar → **Cloudflare R2** | Əvvəlki planınızla eynidir, Docker artıq quraşdırılıb |
| Push | **Firebase Cloud Messaging** (iOS üçün APNs açarı FCM-ə bağlanır) | Bir backend inteqrasiyası, iki platforma |
| Beh/ödəniş | Bu buraxılışa **daxil deyil** | Fiziki xidmət olduğu üçün Apple IAP tələb olunmur, sonra kənar ödənişlə əlavə etmək olar |

---

## 4. Mərhələlər

### Mərhələ 0 — Hesablar (siz, **bu gün başlayın** — gözləmə uzundur)

| Hesab | Qiymət | Gözləmə |
|---|---|---|
| Apple Developer Program | 99 $/il | 1–3 gün (fərdi); təşkilat üçün D-U-N-S, həftələr |
| Google Play Console | 25 $ bir dəfə | Şəxsiyyət təsdiqi 2–7 gün. **Yeni fərdi hesab: istehsala çıxmaq üçün 12 nəfərlə 14 gün qapalı test məcburidir** |
| Domen (`.az` və ya `.com`) | ~10–40 $/il | — |
| Railway, Cloudflare, Firebase, Codemagic | pulsuz başlanğıc | — |
| SMTP (Resend/Brevo) | pulsuz limit | domen DNS təsdiqi |

Play-in 14 günlük testi ümumi müddətin ən uzun hissəsidir — ona görə Android qapalı testi mümkün qədər erkən açılır.

### Mərhələ 1 — Backend-i istehsala hazırla (3–4 gün)

1. Sirlər koddan çıxır (mühit dəyişənləri / user-secrets), JWT açarı və baza parolu **dəyişdirilir** (B1)
2. CORS konfiqurasiyadan oxunur (B2); `UseForwardedHeaders` (B4); `UtcNow` (B10)
3. Açılışda avtomatik miqrasiya, `/health`, Dockerfile (B9)
4. `IFileStorage` abstraksiyası: lokal disk (dev) / R2 (prod) (B3)
5. Refresh token + serverdə çıxış (B6)
6. `DELETE /Auth/DeleteAccount` — parol təsdiqi, şəxsi məlumatın anonimləşdirilməsi, aktiv rezervlərin ləğvi (B5)
7. `DeviceTokens` cədvəli + `PushNotificationChannel` (FCM) (B7)
8. İstifadəçini bloklama (yazışmada) — Apple 1.2 istifadəçi məzmunu tələbi; şikayət mexanizmi artıq var
9. SMTP qoşulur (B8); SMS provayderi sonraya
10. `tests/e2e` yeni endpoint-lərlə genişlənir və tam keçir

### Mərhələ 2 — Deploy (2 gün)

Railway-də API + baza, R2 bucket, Cloudflare Pages-də web, domen + HTTPS, mövcud bazanın köçürülməsi,
GitHub Actions: push → build → e2e → deploy. Nəticə: `https://api.<domen>` və `https://<domen>` işləyir.

### Mərhələ 3 — Web cilası və yoxlama borcu (3–4 gün)

- Bütün rol axınları real brauzerdə keçilir (5 rol × əsas ssenarilər) — tapılan qüsurlar düzəldilir (F6)
- Məxfilik siyasəti, şərtlər, dəstək/əlaqə səhifələri (AZ) (F4)
- Profildə «Hesabı sil»; 401/refresh axını (F1)
- Favicon, brend ikonu, Open Graph (F3)
- Sprint H: tənbəl yükləmə, şəkil `aspect-ratio`

### Mərhələ 4 — Mobil tətbiq (7–10 gün)

1. Alətlər: JDK 21, Android Studio + SDK + emulyator (bu kompüterdə heç biri yoxdur — mən quraşdırıram)
2. Capacitor əlavə olunur (eyni repo, `android/` və `ios/` qovluqları), API ünvanı mütləq olur
3. Native hiss: safe-area, Android «geri» düyməsi, status bar, splash, klaviatura davranışı, şəbəkə yoxdursa ekran
4. Native imkanlar: push, təhlükəsiz token saxlama, kamera/qalereyadan şəkil, geolokasiya («Mənə yaxın»), paylaşma
5. Dərin keçidlər: `https://<domen>/venue/12` tətbiqdə açılır (App Links / Universal Links); bildirişə toxunanda düzgün ekran
6. Admin paneli mobil yığımdan çıxarılır (F7); fonda sorğu dayandırılır (F5)
7. İkon + splash generasiyası, tətbiq adı, paket identifikatoru (`az.<ad>.app`)
8. Android: imzalama açarı (**ehtiyat nüsxəsi sizdə qalır — itərsə tətbiq yenilənmir**), AAB yığımı
9. iOS: Codemagic iş axını, sertifikat/profil, TestFlight
10. Real cihazlarda test (Android — USB ilə; iPhone — TestFlight)

### Mərhələ 5 — Mağazalar (hazırlıq 3–4 gün + baxış)

**Hər ikisi üçün:** ad, qısa/tam təsvir (AZ, sonra RU/EN), 1024 ikon, ekran görüntüləri, məxfilik siyasəti URL-i,
dəstək URL-i, **baxışçı üçün demo hesablar** (müştəri + sahib), yaş reytinqi anketi.

**Google Play:** Data safety forması, hədəf API səviyyəsi, məzmun reytinqi, qapalı test (12 nəfər × 14 gün) → istehsal müraciəti.

**App Store:** App Privacy etiketləri, 6.9" iPhone ekran görüntüləri, icazə mətnləri (kamera, yer, bildiriş — AZ dilində səbəbi ilə),
ixrac uyğunluğu, baxış qeydləri. Rədd riskləri və cavabımız:

| Qayda | Risk | Cavab |
|---|---|---|
| 4.2 minimum funksionallıq | «sayt qabığı» | push, kamera, yer, dərin keçid, native naviqasiya |
| 5.1.1(v) | hesab silmə yoxdur | Mərhələ 1.6 |
| 1.2 istifadəçi məzmunu | rəy və yazışma | şikayət + bloklama + moderasiya + şərtlər |
| 2.1 | baxışçı girə bilmir | demo hesablar, canlı backend |

### Mərhələ 6 — Buraxılışdan sonra

SMS provayderi · SignalR (canlı yazışma) · rus dili · SEO (prerender/sitemap) · beh ödənişi · `PLAN.md`-dəki 5–7-ci bəndlər.

---

## 5. Təqvim

| Həftə | İş |
|---|---|
| 1 | Mərhələ 0 (hesablar, paralel) + Mərhələ 1 |
| 2 | Mərhələ 2 + 3 |
| 3 | Mərhələ 4 → Android qapalı test başlayır, TestFlight |
| 4 | Mərhələ 5 hazırlığı, App Store-a göndəriş |
| 5–6 | Play-in 14 günü bitir → istehsal müraciəti |

Real hədəf: **App Store ~4–5 həftə, Google Play ~5–6 həftə.** Hesablar gecikərsə hər şey o qədər sürüşür.

---

## 6. Kim nə edir

**Yalnız siz edə bilərsiniz:** ödənişlər, Apple/Google şəxsiyyət təsdiqi, 2FA kodları, domen alışı,
12 test iştirakçısının tapılması, hüquqi mətnlərin (məxfilik/şərtlər) təsdiqi, mağazada «Göndər» qərarı.

**Mən edirəm:** bütün kod, konfiqurasiya, deploy, alətlərin quraşdırılması, yığımlar, mağaza mətnləri və formaların
doldurulması (brauzer idarəsi ilə — siz baxırsınız, son düyməni təsdiqləyirsiniz).
