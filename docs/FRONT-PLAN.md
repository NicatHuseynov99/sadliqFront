# Frontend gediş planı

Bu sənəd kodun ölçülməsi əsasında yazılıb. Məqsəd: görünüşü səliqəyə salmaq,
uzun scroll-ları qırmaq və müştəri axınını (xüsusən elan paylaşmağı) rahatlaşdırmaq.

---

## 1. İndiki vəziyyət — ölçülmüş faktlar

| Ölçü | Rəqəm | Nə deməkdir |
|---|---|---|
| `#721438` rəngi kodda | **202 dəfə** | Vahid rəng sistemi yoxdur |
| `#dfb15b` / `#1a1118` / `#a02c4a` | 112 / 141 / 44 | Rəngi dəyişmək = 500 yerdə əl gəzdirmək |
| «Segoe UI» yazısı | 10 faylda təkrar | Şrift bir yerdən idarə olunmur |
| `VenueDetail.vue` | **2051 sətir** | Bir faylda şablon + kod + ~900 sətir CSS |
| `OwnerPanel.vue` / `Home.vue` | 1733 / 1682 | Eyni problem |
| Skeleton yükləmə | **0** | Yalnız fırlanan spinner var |
| Səhifə başına media query | əsasən **1** | Mobil görünüş zəif |

**Ən görünən nəticə:** hər yeni komponent öz düyməsini yenidən yazır —
`gold-btn`, `ghost-btn`, `primary-btn`, `confirm-btn`, `rb-btn`, `fs-btn`,
`open-btn`, `detail-btn`, `accept-btn`… Hamısı oxşardır, amma heç biri eyni deyil.

**Scroll problemi olan üç səhifə:**
1. **Ana səhifə** — nəhəng hero + həmişə açıq süzgəc paneli; saraylar ekranın çox aşağısında başlayır.
2. **Saray səhifəsi** — qalereya, zallar (hər birinin təqvimi ilə), menyular, rəylər — hamısı alt-alta, 3-4 ekran scroll.
3. **Sorğularım** — forma həmişə açıq, altında sorğular, onların altında bütün təkliflər açıq halda.

---

## 2. Sprint A — Təməl (2–3 gün)

Bunsuz qalan işlər yenə dağınıq olacaq.

**A1. Dizayn nişanları (`src/assets/tokens.css`)**
Rəng, kölgə, künc radiusu, boşluq və şrift bir faylda dəyişən kimi:
`--brand`, `--brand-dark`, `--gold`, `--ink`, `--muted`, `--bg`, `--radius`, `--shadow-1`…
Sonra rənglər tədricən dəyişənlərə köçürülür (bir dəfəyə yox — səhifə-səhifə).

**A2. Ortaq UI dəsti (`src/components/ui/`)**
`UiButton` (primary / ghost / danger / small), `UiCard`, `UiTag`, `UiEmpty`, `UiSkeleton`.
Yeni yazılan hər şey bunlardan istifadə edir; köhnələr yavaş-yavaş keçirilir.

**A3. Skeleton yükləmə**
Spinner örtüyü əvəzinə kartın öz formasında boz bloklar. Səhifə «donmuş» görünmür.

**A4. Header və mobil**
Müştəridə 6 link + zəng + ad var — daralır. 900 px-dən aşağıda burger menyu,
telefonda isə aşağıda 4 ikonlu sabit sətir (Ana səhifə · Seçilmişlər · Sorğularım · Profil).

---

## 3. Sprint B — Müştəri axını, scroll qırılması (3–4 gün)

**B1. Ana səhifə: süzgəc çekmecəsi**
Hero kiçilir (yarı hündürlük), süzgəcdən yalnız **axtarış + şəhər + qonaq sayı**
görünən sətirdə qalır, qalanı **«Ətraflı süzgəc»** düyməsi ilə yandan açılan panelə keçir.
Səhifə açılan kimi saraylar görünür — indi isə əvvəlcə süzgəc divarını keçmək lazımdır.
Scroll edəndə süzgəc sətri yuxarıda yapışıq qalır.

**B2. Saray səhifəsi: sekmələr + yapışıq rezerv paneli**
Məzmun dörd sekmeyə bölünür: **Zallar · Menyular · Rəylər · Yer**.
Sağda ekranla birgə hərəkət edən panel: zal seçimi, menyu seçimi, qonaq sayı və
**canlı yekun məbləğ** — «250 × 70 ₼ = 17 500 ₼». Rezerv düyməsi həmişə əldə olur.
2000 px scroll → bir ekran.

**B3. Qalereya**
Şəkillər lightbox-da açılır, klaviatura oxları ilə gəzilir.

---

## 4. Sprint C — «Elan paylaş» hissəsi (2–3 gün)

Bu bölmə platformanın ən yeni və ən dəyərli hissəsidir, amma görünüşcə ən sadədir.

**C1. Elan yazma qutusu**
Sosial şəbəkədəki paylaşım qutusu kimi: bir sətir —
**«Toyunuz üçün nə axtarırsınız?»**. Klikləyəndə açılır və 3 addımlı,
lakin **eyni ekranda** doldurulan formaya çevrilir:
`Şəhər + qonaq` → `Tarix (və ya çevik)` → `Büdcə + istəklər`.
Yuxarıda canlı önizləmə: *«Bakı · 250 qonaq · oktyabr · 70 ₼»*.
Formanın hazırkı halı 7 xanadır və hamısı birdən görünür — yeni halda ekran boş qalmır.

**C2. Sorğu + təkliflər: iki sütun**
Solda sorğunun kartı (yapışıq): şərtlər, qalan vaxt, «Bağla» düyməsi.
Sağda təkliflər. Uzun siyahı əvəzinə **sıralama**: ən ucuz · ən yüksək reytinq · ən yaxın tarix.
Ən sərfəlisinə **«ən uyğun»** nişanı.

**C3. Təklif kartı yığcamlaşır**
İndi hər kartda şəkil + 4 sətir cədvəl + mesaj + 3 düymə var — 3 təklif ekranı doldurur.
Yeni halda: şəkil + ad + qiymət + reytinq görünür, qalan detallar **«Ətraflı»** ilə açılır.
Beləliklə 6 təklif bir ekranda müqayisə olunur.

**C4. Boş hal**
«Təkliflər gözlənilir» quru yazısı əvəzinə: neçə saraya göndərildiyi, orta cavab
vaxtı və nə vaxta qədər açıq qalacağı.

---

## 5. Sprint D — Cila (2 gün)

- **Boş hallar**: hər səhifədə eyni quruluş — işarə, bir cümlə izah, bir düymə.
- **Mikro-hərəkət**: kart üzərinə gələndə yumşaq qalxma, rəqəmlərin sayılaraq artması,
  yeni bildiriş gələndə zəngin yüngül titrəməsi.
- **Toast vahidliyi**: hazırda `ElMessage` və `ElNotification` qarışıq işlənir — biri seçilir.
- **Fokus halqaları və aria**: ikon düymələrində (♥, ⇄, ✕) klaviatura ilə gəzmək.
- **Şəkil yükləmə**: `loading="lazy"` və ölçü nisbəti — səhifə sıçramır.

---

## 6. Təklif olunan sıra

```
A (təməl) → B (müştəri axını) → C (elan bölməsi) → D (cila)
```

A-sız B və C yenə köhnə üsulla yazılacaq. Amma **C tək başına da edilə bilər** —
əgər elan bölməsini tez görmək istəyirsinizsə, C-dən başlayıb sonra A-ya qayıtmaq olar.

---

## 7. Ölçü meyarları

- Ana səhifədə ilk sarayın göründüyü nöqtə: **1 ekrandan aşağı olmasın**
- Saray səhifəsində rezervə qədər scroll: **0** (yapışıq panel)
- Sorğularım səhifəsində bir ekranda görünən təklif sayı: **2 → 6**
- Rənglərin `tokens.css`-dən gəlmə faizi: **0% → 80%+**
- Telefonda naviqasiyanın işləkliyi: burger + alt sətir
