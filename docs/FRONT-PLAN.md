# Frontend gediş planı — yenilənmə (2-ci mərhələ)

Bu sənəd birinci planın (Sprint A/B1/B2/C1/C2) icrasından sonra yazılıb.
Mobil tətbiq mövzusu kənara qoyulub — bütün güc **web** üzərinədir.

---

## 1. İndiyə qədər bitənlər (yoxlanılıb, push edilib)

| Sprint | Nə edildi |
|---|---|
| A | `tokens.css`, `UiButton/UiCard/UiTag/UiSkeleton/UiEmpty/UiCardSkeleton`, header burger + alt naviqasiya, ana səhifədə skeleton |
| B1 | Ana səhifədə süzgəc çekmecəsi («Ətraflı axtarış») |
| B2 | Saray səhifəsi 4 sekməyə bölündü (Zallar/Menyular/Rəylər/Yer) |
| C1 | Təkliflər sıralana bilir, yığcam sətir görünüşü |
| C2 | Elan yazma qutusu + canlı önizləmə |
| — | Bütün səhifələrdə responsivlik (bu sessiyada) |
| G | **Bitdi** — qalereya lightbox, «Təkliflər gözlənilir» boş hal, mikro-hərəkətlər (say animasiyası), klaviatura/fokus/aria keçidi |
| F | **Bitdi** — `VenueDetail.vue` (2307→1312 sətir, `VenueGallery.vue`+`VenueReviews.vue` ayrıldı), `OwnerPanel.vue` (1750→907, `OwnerStaffManager.vue`), `AdminPanel.vue` (1330→598, `AdminUserManager.vue`) |
| E (qismən) | Rənglər → tokens.css: 44 fayl bitdi. UiButton köçürməsi: 7 fayl bitdi (MyProfile, VenueReviews, MyFavorites, SettingsView, MyReservations və s.). Qalan fayllar (VenueManager, VenuesView, OwnerPanel, VenueRegister, VenueDetail, OwnerStaffManager) davam edir — çoxlu dialoq/formada təkrarlanan düymə klasları var, diqqətli miqrasiya tələb edir. Auth səhifələri (Login/Register/ForgotPassword/ResetPassword) bilərəkdən toxunulmayıb — özəl qızılı brend rəngi var. |

---

## 2. Təzə audit — konkret rəqəmlər

Kod yenidən ölçüldü:

| Ölçü | Rəqəm | Nəticə |
|---|---|---|
| `tokens.css` dəyişənini işlədən fayl | **10 / 50** | Yeni yazılan yerlərdə var, köhnə 40 faylda yoxdur |
| `UiButton` / `UiCard` istifadəsi | **0** | Sprint A-da qurulan komponentlər hələ heç yerdə işlədilmir |
| Hələ `#721438` və s. sabit rəng yazan fayl | **40 / 50** | Əsas iş qalıb |
| Boş hal (`empty-box`/`no-result`) olan yer | 10 | Format hələ hər yerdə fərqlidir |
| `AdminPanel.vue` | 1320 sətir | Bölünməyib |
| `OwnerPanel.vue` | 1740 sətir | Bölünməyib |
| `VenueDetail.vue` | 2146 sətir | Sekmələnib, amma fayl özü hələ bir bloklu |
| Toast sistemi | `ElMessage` 12 fayl, `ElNotification` 11 fayl | Qarışıqlıq davam edir |

**Əsas nəticə:** təməl (tokens, UI dəsti) quruldu, amma **köhnə səhifələrə köçürülmədi**.
İkinci mərhələnin böyük hissəsi elə bunun üzərinədir — yeni komponentlərin
qurulması deyil, mövcud olanın hər yerdə işlədilməsidir.

---

## 3. Sprint E — UI dəstinin köçürülməsi (3–4 gün)

Ən çox görünən, ən az riskli iş. Hər dəyişiklik ayrı-ayrı commit olunur.

**E1. Düymələr → `UiButton`**
40 fayldakı `.gold-btn`, `.ghost-btn`, `.primary-btn`, `.confirm-btn`, `.reserve-btn`,
`.accept-btn`, `.cancel-btn` və s. bir-bir `UiButton`-a keçir. Səhifə-səhifə:
əvvəl ən çox işlədilən üç səhifə (Ana səhifə, Saray səhifəsi, Sorğularım — artıq
qismən toxunulub), sonra panellər.

**E2. Rənglər → `tokens.css`**
`sed`/qrep ilə tapılıb bir-bir dəyişənə keçir: `#721438` → `var(--brand)` və s.
Riskli deyil — vizual nəticə eynidir, sadəcə bir yerdən idarə olunur.

**E3. Boş hallar → `UiEmpty`**
10 yerdəki fərqli görünüşlü boş hal mesajı bir komponentə keçir.

**E4. Kartlar → `UiCard`**
`.form-card`, `.staff-card`, `.venue-block` kimi ağ bloklar `UiCard`-a keçir.

---

## 4. Sprint F — Böyük səhifələrin bölünməsi (1 həftə)

Fayllar öz mənasında düzgün işləyir, amma ölçüləri saxlanmanı çətinləşdirir.

**F1. `AdminPanel.vue` (1320 sətir)**
Bölmələr artıq ayrı komponentlərdir (`ReservationsView`, `ReviewsView` və s.),
amma `AdminPanel.vue`-nun özü hələ göstərici kartları, bölmə keçidi və
inline stilləri özündə saxlayır. `AdminStatCards.vue` və ümumi `PanelTabs.vue`
ayrılır.

**F2. `OwnerPanel.vue` (1740 sətir)**
Eyni məntiq: rezerv siyahısı bölməsi öz komponentinə çıxarılır
(`OwnerReservationList.vue`), administrator idarəetməsi ayrı fayla keçir
(`StaffManager.vue`).

**F3. `VenueDetail.vue` (2146 sətir)**
Hər sekmə (`Halls`, `Menus`, `Reviews`, `Map`) öz komponentinə çıxarılır.
Səhifə özü yalnız qalereya, başlıq və sekmə keçidini saxlayır. Faylın 4-5 hissəyə
bölünməsi həm oxunmanı, həm gələcək dəyişiklikləri asanlaşdırır.

---

## 5. Sprint G — Qalan interfeys işləri (3–4 gün)

**G1. Qalereya lightbox** (əvvəlki planda B3 idi, hələ edilməyib)
Saray şəkilləri böyüdülüb tam ekranda açılsın, ← → düymələri və klaviatura
oxları ilə gəzilsin.

**G2. Boş hal — «Təkliflər gözlənilir»** (əvvəlki C4)
Quru cümlə əvəzinə: neçə saraya göndərildiyi, orta cavab müddəti, nə vaxta
qədər açıq qalacağı.

**G3. Toast vahidliyi**
`ElMessage` və `ElNotification` qarışıq işlənir (12 və 11 fayl). Biri seçilib
(`ElNotification` — mövqe və başlıq dəstəklədiyi üçün) və hamısı ona keçir.

**G4. Mikro-hərəkətlər**
Kart üzərinə gələndə yüngül qalxma, rəqəmlərin (statistika) sayılaraq
dəyişməsi, yeni bildiriş gələndə zəngin titrəməsi.

**G5. Klaviatura və fokus**
İkon düymələrində (♥, ⇄, ✕, 🔔) `aria-label`, tab sırası yoxlanışı.

---

## 6. Sprint H — Performans (2 gün)

- Böyük səhifələrin (Admin, Owner) tənbəl yüklənməsi (`defineAsyncComponent`
  və ya router-level lazy import) — indi hamısı ilkin bundle-a düşür
- Şəkillərdə ölçü nisbəti (`aspect-ratio`) — səhifə yüklənərkən sıçrayış olmasın
- Uzun siyahılarda (jurnal, ziyarətçilər) səhifələmə/virtual sürüşmə yoxlanışı

---

## 6.1 Qalan iş (yenilənmiş, aşağıdan-yuxarı icra sırası)

- **Toast vahidliyi** (əvvəlki G3): **Bitdi** — bütün xam `ElNotification` çağırışları (17 fayl) `src/utils/toast.js` vahid utilinə keçirildi. `ElMessageBox.confirm` (təsdiq dialoqları) toxunulmadı — o toast deyil.
- **`store/auth.js`**: **Bitdi** — logout `window.location.href` əvəzinə router-based (`router.push('/login')`) edildi
- **E1 (düymələr)**: **Demək olar bitdi** — VenueManager, VenuesView, VenueRegister, VenueDetail, OwnerStaffManager da daxil olmaqla bütün fayllar UiButton-a keçirildi. Qəsdən toxunulmayanlar: auth səhifələri (özəl qızılı brend), OwnerPanel-də yaşıl "Təsdiqlə" düyməsi, VenuesView-də dinamik ton (danger/warn) təsdiq düyməsi — bunların rəngi UiButton-un mövcud variantlarına uyğun gəlmir.
- **E-nin qalanı**: boş hallar → `UiEmpty` (E3), kartlar → `UiCard` (E4)
- **H**: performans (lazy-load, aspect-ratio, pagination/virtual scroll) — hələ toxunulmayıb

---

## 7. Təklif olunan sıra

```
E (köçürmə) → F (bölmə) → G (qalan iş) → H (performans)
```

**Səbəb:** E ən az riskli və ən çox görünən təsiri verir — bütün sayt bir gündə
vizual cəhətdən vahidləşir. F sonra gəlməlidir, çünki bölünmüş fayllarda E-ni
təkrar aparmaq lazım gəlməsin. G və H son ciladır.

---

## 8. Ölçü meyarları (yenilənmiş)

| Meyar | İndi | Hədəf |
|---|---|---|
| `tokens.css` istifadə edən fayl | 10 / 50 | 45+ / 50 |
| `UiButton`/`UiCard` istifadə edən yer | 0 | əsas düymələrin 80%-i |
| Toast sistemi | 2 qarışıq | 1 vahid |
| `AdminPanel.vue` / `OwnerPanel.vue` sətir sayı | 1320 / 1740 | 400–500 aralığında |
| Qalereya | sadə ox | lightbox + klaviatura |
