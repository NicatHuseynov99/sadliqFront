# Şadlıq Sarayları — dərin analiz (avqust 2026)

Bu sənəd kodun oxunması əsasında yazılıb: problemlər, görüləcək işlər və
sahibkar–müştəri münasibəti üzrə təkliflər.

---

## 1. Kritik problemlər

### 1.1. Təqvimi bir sorğu ilə bağlamaq olur

`ReservationManager.CreateAsync` sorğu düşən kimi günü `Held` edir. Amma:

- `Held` vəziyyətinin müddəti yoxdur — sahib cavab verməsə tarix əbədi bağlı qalır;
- bir müştəri neçə sorğu göndərə bilər — limit yoxdur;
- telefon təsdiqi yoxdur — saxta hesabla onlarla tarix bağlamaq olar.

Yəni rəqib bir saatda bir sarayın bütün toy mövsümünü bağlaya bilər.

**Həll:** `Held` üçün son tarix sahəsi (`HoldExpiresAt`, 48 saat) + fon xidməti
onu avtomatik boşaltsın; bir müştəriyə eyni anda ən çox 3 açıq sorğu; sahibə
24 saatdan sonra xatırlatma.

### 1.2. Fayl yükləmə tamamilə açıqdır

`FilesController.Upload` `[AllowAnonymous]`, 100 MB-a qədər. Bu, hər kəsə
pulsuz fayl saxlama xidməti deməkdir — diski doldurmaq və ya kənar məzmun
yaymaq üçün istifadə oluna bilər.

**Həll:** IP üzrə saatlıq limit; faylın ilk baytlarının (magic bytes) yoxlanışı —
uzantı kifayət deyil; şəkillərin serverdə webp-ə sıxılması; 24 saat ərzində
heç bir saraya bağlanmayan faylların silinməsi.

### 1.3. Sorğu tezliyi məhdudlaşdırılmır

Nə girişdə, nə rəydə, nə də yükləmədə rate limit var. Parol sınaqları və rəy
spamı üçün açıq qapıdır. .NET 8-in `AddRateLimiter`-i ilə bir gündə bağlanır.

### 1.4. Rəy heç nəyə bağlı deyil

`ReviewManager.CreateAsync` yalnız sarayın mövcudluğunu yoxlayır. Ora getməmiş
adam da, sarayın öz işçisi də rəy yaza bilər. Reytinqin dəyəri sıfıra enir.

**Həll:** rəy yalnız `Confirmed` rezervi olan və tədbir tarixi keçmiş müştəriyə;
belə rəylərə **«Təsdiqlənmiş qonaq»** nişanı. Qalanı yazsın, amma ayrıca bölmədə
və reytinqə təsir etmədən.

---

## 2. Ciddi, amma kritik olmayan problemlər

| Problem | Nəticə |
|---|---|
| Müştəri rezervi ləğv edəndə sahibə bildiriş getmir (`CancelAsync`) | Sahib boş qalan tarixi bilmir |
| Təsdiqlənmiş rezerv istənilən vaxt, cərimə/xəbərdarlıq olmadan ləğv edilir | Sahib üçün risk, platformaya inamsızlıq |
| Bildiriş yalnız e-poçtdur (`SmtpEmailService`) | Toy müştərisi e-poçt oxumur — SMS lazımdır |
| Qiymət modeli tək ölçülüdür: menyu × nəfər | Real qiymət fərqli çıxır, inam itir |
| SPA-dır, SEO yoxdur | Google-dan gələn axtarış itir — ən ucuz müştəri kanalı |
| Test layihəsi yoxdur | Hər dəyişiklik əl ilə yoxlanır |
| Rəy reytinqi hər sorğuda hesablanır | Saray sayı artdıqca yavaşlayacaq |
| Rus dili yoxdur | Bakıda ciddi auditoriya itir |

---

## 3. Qiymət modeli — ən çox diqqət tələb edən yer

Bugünkü model: `menyu.PricePerPerson × qonaq sayı`. Real bazarda isə:

- cümə–şənbə axşamı bahalıdır, çərşənbə ucuzdur;
- minimum qonaq sayı var (200 nəfərdən az qəbul etmirlər);
- xidmət haqqı, musiqi, tort, içki paketi ayrıca;
- mövsüm fərqi (sentyabr–oktyabr pik, qış ucuz).

Müştəri saytda «60 ₼» görüb, zəng edəndə «85 ₼» eşidəndə platformaya inam bir
dəfəlik itir. Bu, texniki yox, biznes problemidir və ən tez həll ediləsidir.

**Təklif:** `Menu`-ya `MinGuestCount`, `WeekendSurcharge`, `SeasonMultiplier`
əlavə etmək və saytda **«Yekun hesab»** göstərmək: seçilən tarix + qonaq sayına
görə tam məbləğ, açıqlamalı sətirlərlə. «Qiymət kalkulyatoru» deyil — **dəqiq
hesab**.

---

## 4. Sahibkar–müştəri münasibətinin analizi

### Bugünkü zəncir

```
müştəri saray tapır → sorğu göndərir → sahib e-poçt alır → təsdiq/rədd → əlaqə kəsilir
```

Platforma yalnız **tanışlıq** mərhələsindədir. Toyun planlaşdırılması isə
3–6 ay çəkir və bu müddətin hamısı platformadan kənarda, WhatsApp-da keçir.
Bu, biznes üçün əsas itkidir: nə komissiya, nə məlumat, nə nəzarət qalır.

### Hər tərəfin əsl ehtiyacı

**Müştəri:** «Büdcəm 8000 ₼, 250 nəfər, oktyabr. Kim məni qəbul edir?»
Bugünkü sayt bu sualı birbaşa cavablamır — istifadəçi özü süzgəcləri qurur.

**Sahibkar:** «Boş qalan tarixlərimi doldur.» Sahib üçün ən dəyərli şey
görünmək yox, **boş cümə axşamını satmaqdır**.

Bu iki ehtiyac bir-birini tam tamamlayır və platformanın əsl məhsulu buradadır.

### Təkliflər

**1. Tərs axtarış — «Sorğunu paylaş»**
Müştəri bir dəfə forma doldurur (tarix, qonaq sayı, büdcə, şəhər), sistem
uyğun saraylara göndərir, saraylar **təklif göndərir**. Müştəri 10 saraya zəng
etmək əvəzinə 5 təklifi müqayisə edir. Bu, platformanı kataloqdan bazara çevirir
və sahibkarı platformada saxlayır.

**2. «Son dəqiqə tarixləri»**
Sahib boş qalan tarixi endirimlə elan edir, müştəri xəritədə/siyahıda
«−15%» nişanı ilə görür. Sahib üçün boş gün gəlirdir, müştəri üçün fürsət,
platforma üçün gündəlik səbəb geri qayıtmağa.

**3. Toy hesablayıcısı və kabinet**
Rezervdən sonra müştəriyə səhifə açılsın: qalan günlərin sayı, ödəniş
qrafiki, qonaq siyahısı, sahibkarla yazışma. Söhbət WhatsApp-dan platformaya
keçir — bütün dəyər burada yaranır.

**4. Beh (depozit) sistemi**
Kiçik məbləğ (100–200 ₼) onlayn. Müştəri üçün tarix real olaraq bağlanır,
sahib üçün ciddiyyət göstəricisi, platforma üçün ilk gəlir modeli.
Həm də 1.1-dəki saxta sorğu problemini kökündən həll edir.

**5. Toydan sonra avtomatik rəy dəvəti**
Tədbirdən 2 gün sonra SMS: «Toyunuz necə keçdi?» — 3 sual, 30 saniyə.
Rəy sayı burada bir neçə dəfə artır və hamısı təsdiqlənmiş qonaqdandır.

**6. Sahibkar üçün statistika**
«Sarayına 340 nəfər baxdı, 12 sorğu gəldi, 7-si təsdiqləndi. Şəkil əlavə
etsən baxış 40% artır.» `PageView` məlumatı artıq yığılır — sadəcə sahibə
göstərilmir. Sahibi platformada saxlayan şey budur.

**7. Müqayisə və «uyğunluq faizi»**
2–3 sarayı yan-yana qoymaq; hər saray üçün «sizin şərtlərinizə 92% uyğundur»
göstəricisi (tutum, büdcə, məsafə, parkinq).

---

## 5. Təklif olunan sıra

**Sprint 1 — təməli bərkit (1 həftə)**
Held müddəti + avtomatik boşaltma · rate limit · fayl yükləməyə limit və
məzmun yoxlanışı · rəyi rezervə bağlamaq · ləğvdə sahibə bildiriş.

**Sprint 2 — inam (1 həftə)**
SMS bildirişləri · yekun hesab (weekend/mövsüm/minimum qonaq) ·
toydan sonra rəy dəvəti.

**Sprint 3 — sahibkar üçün dəyər (1 həftə)**
Sahibkar statistikası · son dəqiqə tarixləri.

**Sprint 4 — bazar (2 həftə)**
Sorğunu paylaş və təkliflər · beh sistemi.

**Sprint 5 — böyümə**
SEO (server tərəfdə meta + sitemap) · rus dili · müqayisə.

---

## 6. Ölçü meyarları

- Sorğuya cavab müddətinin medianı (hədəf: < 12 saat)
- Sorğu → təsdiq nisbəti (hədəf: > 45%)
- Təsdiqlənmiş qonaq rəylərinin payı (hədəf: > 70%)
- Boş tarixlərin son dəqiqə elanı ilə dolma faizi
- Google-dan gələn ziyarətin payı
