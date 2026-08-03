# Şadlıq Sarayları — inkişaf planı

Bu sənəd layihənin bugünkü vəziyyətini və növbəti addımları toplayır.
Tarix: 31.07.2026

---

## 1. Bugünkü vəziyyət

### Hazır olanlar

| Sahə | Vəziyyət |
|---|---|
| Hesablar | Qeydiyyat, giriş, parol bərpası, 5 rol, blok/aktiv, yumşaq silmə |
| Saraylar | CRUD, təsdiq axını, zallar, menyular, şəkillər, özəlliklər |
| Rezerv | Sorğu, status axını, zal təqvimi ilə sinxron, e-poçt bildirişi |
| Rəylər | Yazma, redaktə, şikayət, moderasiya, gizlətmə, düzəliş tarixçəsi |
| Admin panel | 8 bölmə: İcmal, Saraylar, Rezervlər, Rəylər, Ziyarətçilər, Jurnal, Parametrlər, Baza |
| Statistika | Səhifə baxışları, qonaq/istifadəçi ayrımı, 90 günlük saxlama |
| Jurnal | Hər yazma sorğusu, aktyor, IP, müddət, payload |
| Kitabçalar | Şəhər və özəllik cədvəlləri, interfeys mətnləri bazada |

### Zəif nöqtələr

1. **EF miqrasiyaları yoxdur.** Bütün sxem dəyişiklikləri əl ilə SQL ilə tətbiq olunub.
   Bazanı sıfırdan qurmaq mümkün deyil. — *ən yüksək risk*
2. **Şəkillər Unsplash linkləridir.** Fayl yükləmə yoxdur, sahib öz sarayının
   real şəklini qoya bilmir.
3. **Koordinatlar var, xəritə yoxdur.** 40 sarayın 39-unda `Latitude`/`Longitude`
   doludur, amma heç yerdə istifadə olunmur.
4. **Axtarış zəifdir.** «Zumrud» yazanda «Zümrüd Saray» tapılmır (diakritika),
   zal və menyu adlarında axtarış yoxdur.
5. **Parkinq məlumatı yoxdur.** Özəllik kimi «Parkinq» var, amma neçə avtomobil
   tutduğu bilinmir.
6. **Test yoxdur.** Nə vahid, nə inteqrasiya testi.
7. **Anonim endpoint qorunmayıb.** `Visits/Track` limitsizdir — bot dəqiqədə
   minlərlə sətir yaza bilər.
8. **Refresh token yoxdur.** Token 7 gün yaşayır, çıxış serverdə ləğv olunmur.

---

## 2. Faza 6 — Xəritə (ən vacib yeni funksiya)

### Niyə
Toy məkanı seçimində **yer** birinci amildir: qonaqların yaşadığı rayona yaxınlıq,
yol, parkinq. Hazırda müştəri yalnız ünvan mətnini oxuyur.

### Texniki seçim
- **Leaflet + OpenStreetMap** — pulsuz, açar tələb etmir, Azərbaycan üzrə
  örtüyü kifayətdir. (Google Maps açar və ödəniş tələb edir.)
- Marker qruplaşdırma üçün `leaflet.markercluster`.
- Geokodlaşdırma (ünvan → koordinat) üçün **Nominatim** — pulsuz, saniyədə
  1 sorğu limiti var, ona görə yalnız admin paneldə, əl ilə çağırılır.

### Backend işləri
1. `GET /Venues/MapSearch` — mövcud süzgəclərlə eyni, amma **yüngül DTO**:
   `id, name, city, lat, lng, coverImageUrl, minPrice, rating, reviewCount`.
   Səhifələmə yoxdur, əvəzinə **bbox** (xəritənin görünən sahəsi) süzgəci:
   `?north=&south=&east=&west=`.
2. `Venue.Latitude/Longitude` üçün indeks; bbox sorğusu sadə `BETWEEN` ilə gedir.
3. **Məsafə üzrə sıralama**: `?nearLat=&nearLng=&sort=distance`.
   Haversine düsturu SQL-də hesablanır, ilk 50 nəticə qaytarılır.
4. Koordinatı olmayan saray xəritədə görünmür — admin panelə
   «koordinatı təyin et» axını əlavə olunur (aşağıda).

### Frontend işləri
1. **Ana səhifədə iki rejim**: «Siyahı / Xəritə» keçidi. Xəritə rejimində
   mövcud süzgəclər işləməyə davam edir.
2. **Marker**: qiymət etiketi ilə (məsələn «50 ₼»). Üstünə gələndə kiçik kart
   (şəkil, ad, reytinq, «Ətraflı» düyməsi).
3. **Xəritə hərəkət edəndə** siyahı yenilənir — «bu ərazidə axtar» düyməsi
   (avtomatik yenilənmə sorğu selinə səbəb olur).
4. **«Mənə yaxın»** düyməsi — brauzerin geolokasiyası, icazə verilməsə şəhər
   seçimi təklif olunur. İcazə istənilməsi səbəbi ilə birlikdə izah edilir.
5. **Saray səhifəsində kiçik xəritə** — ünvan bloku altında, «Yol tap» düyməsi
   (Google/Apple Maps-a keçid).
6. Admin/sahib panelində **koordinat seçici**: xəritədə marker sürüşdürülür və
   ya ünvana görə avtomatik tapılır (Nominatim), sonra yadda saxlanılır.

### Qiymətləndirmə
Backend ~1 gün, frontend ~2 gün, admin koordinat seçici ~0.5 gün.

---

## 3. Parkinq tutumu

### Baza
`Venues` cədvəlinə iki sahə:

| Sahə | Tip | İzah |
|---|---|---|
| `ParkingCapacity` | `int?` | Neçə avtomobil yerləşir. Boş = məlumat yoxdur |
| `HasValetParking` | `bool` | Valet xidməti var/yox |

`Parkinq` özəlliyi kitabçada qalır (ümumi işarə kimi), amma **tutum ayrıca
sahədir** — çünki «parkinq var» ilə «120 avtomobil yeri var» fərqli məlumatdır.

### Süzgəc
- Ana səhifədə **«Parkinq: 50+ / 100+ / 200+ avtomobil»** çipləri.
- `VenueSearchDto.MinParking` — `v.ParkingCapacity >= dto.MinParking`.
- Saray kartında və detal səhifəsində «🅿️ 120 avtomobil» sətri.
- Sahib panelində və admin redaktə pəncərəsində sahələr.

### Ağıllı əlavə
Qonaq sayı seçiləndə **avtomatik xəbərdarlıq**: «300 qonaq üçün təxminən
75–100 avtomobil yeri lazımdır, bu sarayda 40 yer var» — 4 nəfər/avtomobil
hesabı ilə. Belə şey rəqiblərdə yoxdur və real problemi həll edir.

---

## 4. Axtarışın gücləndirilməsi

1. **Diakritikadan asılı olmayan axtarış** — PostgreSQL `unaccent` genişlənməsi:
   `CREATE EXTENSION unaccent;` və sorğuda `unaccent(v."Name") ILIKE unaccent(@q)`.
   «Zumrud» → «Zümrüd», «Genclik» → «Gənclik» tapılacaq.
2. **Genişlənmiş sahə** — ad və ünvanla yanaşı **zal adı, menyu adı və özəllik**
   üzrə də axtarış.
3. **Təkliflər (autocomplete)** — yazdıqca 5 saray adı + 3 şəhər göstərilir,
   `GET /Venues/Suggest?q=`. Cavab yüngül olmalıdır (id + ad + şəhər).
4. **Axtarış tarixçəsi** — son 5 axtarış localStorage-də saxlanılır və
   axtarış qutusu fokuslananda göstərilir.
5. ~~Nəticəsiz axtarışda alternativ təklif~~ — istənilmir, edilməyəcək.

---

## 5. Rollar arası işlər

### Rol matrisi (bugünkü)

| İmkan | Müştəri | Sahib | Saray admini | Dəstək | Platforma sahibi |
|---|:--:|:--:|:--:|:--:|:--:|
| Saray axtarışı, rezerv | ✅ | – | – | – | – |
| Öz sarayını idarə | – | ✅ | yalnız təyin olunan zallar | ✅ hamısı | ✅ hamısı |
| Rezervə cavab | – | ✅ | ✅ | ✅ | ✅ |
| Rəy moderasiyası | – | – | – | ✅ | ✅ |
| İstifadəçi idarəsi | – | – | – | ✅ | ✅ |
| Platforma parametrləri | – | – | – | ✅ | ✅ |
| Baza bölməsi | – | – | – | – | ✅ |
| Rəy düzəliş tarixçəsi | – | – | – | – | ✅ |

### Boşluqlar və təkliflər

**Saray sahibi üçün — ən çox dəyər verən istiqamət**
1. **Öz statistikası**: sarayın səhifəsinə neçə baxış olub, neçəsi rezervə
   çevrilib (konversiya), hansı günlər çox baxılır.
   *Məlumat artıq `PageViews`-də var — yalnız sahibə açmaq lazımdır.*
2. **Rəyə cavab yazmaq** — `ReviewReply` cədvəli. Sahibin cavabı rəyin altında
   görünür. Bu, reputasiya idarəçiliyinin əsasıdır.
3. **Təqvim görünüşü** — aylıq təqvimdə hansı zal hansı gün doludur, rəngli.
4. **Qiymət tənzimi** — mövsümə görə (yay/qış, həftəsonu) fərqli qiymət.

**Saray administratoru**
5. Hazırda təyinat zal səviyyəsindədir, amma **iş bölgüsü yoxdur**:
   «bu rezervə mən baxıram» kimi sahiblənmə. Sadə `AssignedToUserId` sahəsi
   komanda işini xeyli asanlaşdırar.

**Dəstək admini**
6. **İş növbəsi**: «mənə təyin olunmuş şikayətlər» siyahısı.
7. **Gecikən rezervlərə avtomatik xatırlatma** — sahibə e-poçt: «3 gündür
   cavabsız sorğunuz var». Parametr onsuz da mövcuddur (`stale_pending_days`).

**Platforma sahibi**
8. **Rol dəyişikliyi tarixçəsi** — kim kimə hansı rolu nə vaxt verdi
   (jurnalda var, amma ayrıca ekran yoxdur).
9. **İki mərhələli giriş (2FA)** — ən azı SuperAdmin üçün.

**Müştəri**
10. **Bildiriş mərkəzi** — saytda zəng ikonu: rezervin statusu dəyişdi,
    rəyinizə cavab yazıldı.

---

## 6. Müştəri təcrübəsi — yeni funksiyalar

Prioritet sırası ilə:

1. **Müqayisə** — 3 sarayı yan-yana: qiymət, tutum, parkinq, reytinq, özəlliklər.
   Toy seçimi həmişə müqayisə ilə olur.
2. **Qiymət kalkulyatoru** — qonaq sayı × menyu qiyməti, üstəlik seçimlər
   (fişəng, DJ, tort). Müştəri dəqiq rəqəmi rezervdən əvvəl görür.
3. **Sual-cavab** — saray səhifəsində açıq suallar; sahib cavab yazır.
   Eyni suallar təkrarlanmır, dəstəyə yük düşmür.
4. **Rəyə şəkil** — real toy şəkilləri ən güclü sosial sübutdur.
5. **Boş tarix bildirişi** — «bu saray 15 iyun üçün boşalanda mənə bildir».
6. **Beh (depozit) ödənişi** — rezervi ciddiləşdirir. Ödəniş inteqrasiyası
   ayrıca araşdırma tələb edir (Azərbaycanda: Kapital, PashaPay, Epoint).
7. **Dəvətnamə linki** — rezerv təsdiqlənəndə müştəriyə paylaşıla bilən
   səhifə (tarix, ünvan, xəritə). Sayta pulsuz trafik gətirir.

---

## 7. Texniki borc (arxa planda, amma vacib)

| # | İş | Niyə |
|---|---|---|
| 1 | **EF miqrasiyaları** | Bazanı sıfırdan qurmaq mümkün deyil |
| 2 | **Şəkil yükləmə** | Sahiblər real şəkil qoya bilmir |
| 3 | **SMTP** | Bildirişlər hazırda log-a yazılır |
| 4 | **Rate limiting** | `Visits/Track` və `Auth/Login` açıqdır |
| 5 | **Refresh token + çıxış** | Oğurlanan token 7 gün işləyir |
| 6 | **Testlər** | Ən azı rezerv və icazə məntiqi üçün |
| 7 | **Jurnal təmizliyi** | `AuditLogs` sonsuz böyüyür (ziyarətlərdə var) |
| 8 | **Şəkil optimallaşdırması** | Unsplash-dan tam ölçülü şəkil yüklənir |

---

## 8. Təklif olunan sıra

### Sprint 1 — «Təməli bərkit» (1 həftə)
- EF miqrasiyaları (bütün əl ilə tətbiq olunmuş sxem daxil)
- Şəkil yükləmə (server tərəfdə fayl saxlama + sahib panelində forma)
- Rate limiting

### Sprint 2 — «Xəritə» (1 həftə)
- MapSearch endpoint + bbox + məsafə
- Ana səhifədə xəritə rejimi
- Saray səhifəsində xəritə və «Yol tap»
- Admin koordinat seçici

### Sprint 3 — «Axtarış və parkinq» (4–5 gün)
- Parkinq tutumu + süzgəc + xəbərdarlıq
- unaccent axtarışı, genişlənmiş sahələr, təkliflər

### Sprint 4 — «Sahib üçün dəyər» (1 həftə)
- Sahibin statistikası (baxış → rezerv konversiyası)
- Rəyə cavab
- Təqvim görünüşü

### Sprint 5 — «Müştəri təcrübəsi» (1 həftə)
- Müqayisə
- Qiymət kalkulyatoru
- Bildiriş mərkəzi

Sonrakılar: sual-cavab, rəyə şəkil, boş tarix bildirişi, beh ödənişi, 2FA.

---

## 9. Ölçü meyarları

Hər sprintdən sonra baxılacaq rəqəmlər:
- Axtarışdan saray səhifəsinə keçid faizi
- Saray səhifəsindən rezerv sorğusuna çevrilmə faizi
- Cavabsız rezervlərin orta gözləmə müddəti
- Qonaq ziyarətçilərin qeydiyyata çevrilmə faizi

Bu göstəricilərin hamısı üçün lazım olan məlumat artıq `PageViews`,
`Reservations` və `AuditLogs` cədvəllərində toplanır — yalnız hesabat ekranı
qurulmalıdır.
