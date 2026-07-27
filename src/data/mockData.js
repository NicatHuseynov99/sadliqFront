// Backend API-nin qaytardığı formaya uyğun mock data.
// Real API qoşulanda bu fayl silinəcək, servislər həqiqi endpoint-lərə yönələcək.
// Sahə adları backend DTO-ları ilə eynidir: venue { id, name, city, address, phone,
// description, coverImageUrl, halls[], menus[] } və s.

export const venues = [
  {
    id: 1,
    name: 'Gülüstan Sarayı',
    description:
      'Paytaxtın mərkəzində yerləşən, möhtəşəm dizaynlı və geniş imkanlara malik ən prestijli saray. 1982-ci ildən fəaliyyət göstərən Gülüstan Sarayı dövlət səviyyəli tədbirlərin və minlərlə toyun ünvanı olub. Panoramik şəhər mənzərəsi, klassik interyer və peşəkar xidmət komandası.',
    city: 'Bakı',
    address: 'Nizami küç. 10',
    phone: '+994 12 492 34 56',
    rating: 4.9,
    reviewCount: 214,
    features: ['Parkinq', 'Gəlin otağı', 'Canlı musiqi', 'Açıq teras', 'Fişəng şousu'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80',
    ],
    halls: [
      {
        id: 101,
        venueId: 1,
        name: 'Böyük Zal',
        capacity: 600,
        minPrice: 50,
        description: 'Sarayın əsas zalı — 600 nəfərlik, hündür tavanlı, kristal çilçıraqlı.',
        imageUrl:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=700&q=80',
      },
      {
        id: 102,
        venueId: 1,
        name: 'Kiçik Zal',
        capacity: 200,
        minPrice: 45,
        description: 'Nişan, xına və ailəvi məclislər üçün rahat, işıqlı zal.',
        imageUrl:
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=80',
      },
    ],
    menus: [
      {
        id: 11,
        name: 'Standart',
        pricePerPerson: 50,
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar (8 çeşid)' },
          { id: 2, name: 'Sac içi' },
          { id: 3, name: 'Plov (qovurma ilə)' },
          { id: 4, name: 'Şirniyyat masası' },
          { id: 5, name: 'Meyvə vazası' },
          { id: 6, name: 'Sərinləşdirici içkilər' },
        ],
      },
      {
        id: 12,
        name: 'Premium',
        pricePerPerson: 70,
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar (12 çeşid)' },
          { id: 2, name: 'Qızıl balıq' },
          { id: 3, name: 'Kabab çeşidi' },
          { id: 4, name: 'Şah plov' },
          { id: 5, name: 'Toy tortu' },
          { id: 6, name: 'Limitsiz içkilər' },
        ],
      },
      {
        id: 13,
        name: 'Lüks',
        pricePerPerson: 90,
        items: [
          { id: 1, name: 'Xüsusi dəniz məhsulları masası' },
          { id: 2, name: 'Quzu buğlama' },
          { id: 3, name: 'Nərə balığı kababı' },
          { id: 4, name: 'Şah plov (zəfəranlı)' },
          { id: 5, name: 'Fransız desert masası' },
          { id: 6, name: 'Premium içki paketi' },
        ],
      },
    ],
    reviews: [
      { id: 1, author: 'Aynur M.', rating: 5, date: '2026-06-14', text: 'Toyumuzu burada etdik, hər şey mükəmməl idi. Xidmət heyəti çox diqqətli, yeməklər dadlı.' },
      { id: 2, author: 'Elvin Q.', rating: 5, date: '2026-05-02', text: 'Zal çox möhtəşəmdir, qonaqlarımız hələ də danışır. Qiymətə tam dəyər.' },
      { id: 3, author: 'Səbinə H.', rating: 4, date: '2026-03-21', text: 'Hər şey yaxşı idi, sadəcə parkinq axşam saatlarında sıx olur.' },
    ],
  },
  {
    id: 2,
    name: 'Baku Crystal Hall',
    description:
      'Müasir üslubda tikilmiş, dəniz mənzərəli və böyük tədbirlər üçün ideal məkan. LED işıqlandırma sistemi, professional səs akustikası və dənizə açılan şüşə fasad ilə toyunuz unudulmaz olacaq.',
    city: 'Bakı',
    address: 'Bayıl, Dənizkənarı bulvar',
    phone: '+994 12 505 77 88',
    rating: 4.8,
    reviewCount: 168,
    features: ['Dəniz mənzərəsi', 'LED şou', 'Parkinq', 'VIP giriş'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80',
    ],
    halls: [
      {
        id: 201,
        venueId: 2,
        name: 'Kristal Zal',
        capacity: 800,
        minPrice: 60,
        description: '800 nəfərlik nəhəng zal — böyük toylar və korporativ tədbirlər üçün.',
        imageUrl:
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80',
      },
    ],
    menus: [
      {
        id: 21,
        name: 'Klassik',
        pricePerPerson: 60,
        items: [
          { id: 1, name: 'Soyuq masa (10 çeşid)' },
          { id: 2, name: 'Balıq assortisi' },
          { id: 3, name: 'Tikə kabab' },
          { id: 4, name: 'Plov' },
          { id: 5, name: 'Desert masası' },
        ],
      },
      {
        id: 22,
        name: 'VIP',
        pricePerPerson: 85,
        items: [
          { id: 1, name: 'Dəniz məhsulları masası' },
          { id: 2, name: 'Steyk çeşidi' },
          { id: 3, name: 'Şah plov' },
          { id: 4, name: 'İtalyan desertləri' },
          { id: 5, name: 'Premium içki paketi' },
        ],
      },
    ],
    reviews: [
      { id: 1, author: 'Nigar A.', rating: 5, date: '2026-07-01', text: 'Dəniz mənzərəsi axşam işıqlarında möhtəşəm görünür. Qonaqlar çox bəyəndi.' },
      { id: 2, author: 'Tural İ.', rating: 4, date: '2026-04-18', text: 'Zal və xidmət əla, qiymətlər bir az yüksəkdir amma dəyər.' },
    ],
  },
  {
    id: 3,
    name: 'Şahənşah Şadlıq Sarayı',
    description:
      'Şərq və Avropa memarlığının sintezi olan, hər cür tədbirlər üçün yüksək səviyyəli xidmət. İki müstəqil zal, geniş həyət və uşaqlar üçün oyun guşəsi ilə ailəvi tədbirlərin ideal ünvanı.',
    city: 'Xırdalan',
    address: 'Heydər Əliyev prospekti 45',
    phone: '+994 51 820 44 20',
    rating: 4.6,
    reviewCount: 96,
    features: ['Parkinq', 'Uşaq guşəsi', 'Gəlin otağı', 'Həyət sahəsi'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80',
    ],
    halls: [
      {
        id: 301,
        venueId: 3,
        name: 'Zəfər Zalı',
        capacity: 400,
        minPrice: 40,
        description: 'Qızılı dekorlu əsas zal, səhnə və rəqs meydançası ilə.',
        imageUrl:
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80',
      },
      {
        id: 302,
        venueId: 3,
        name: 'Buta Zalı',
        capacity: 250,
        minPrice: 38,
        description: 'Milli üslubda bəzədilmiş orta ölçülü zal.',
        imageUrl:
          'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=700&q=80',
      },
    ],
    menus: [
      {
        id: 31,
        name: 'Standart',
        pricePerPerson: 40,
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar' },
          { id: 2, name: 'Dolma çeşidi' },
          { id: 3, name: 'Lülə kabab' },
          { id: 4, name: 'Plov' },
          { id: 5, name: 'Meyvə və şirniyyat' },
        ],
      },
      {
        id: 32,
        name: 'Deluxe',
        pricePerPerson: 55,
        items: [
          { id: 1, name: 'Zəngin soyuq masa' },
          { id: 2, name: 'Balıq ləvəngi' },
          { id: 3, name: 'Kabab assortisi' },
          { id: 4, name: 'Şah plov' },
          { id: 5, name: 'Toy tortu' },
        ],
      },
    ],
    reviews: [
      { id: 1, author: 'Rəşad B.', rating: 5, date: '2026-06-28', text: 'Qiymət-keyfiyyət nisbəti əladır. Uşaq guşəsi valideynlər üçün böyük rahatlıqdır.' },
      { id: 2, author: 'Günel S.', rating: 4, date: '2026-02-10', text: 'Nişan mərasimimizi etdik, hər şey səliqəli təşkil olundu.' },
    ],
  },
  {
    id: 4,
    name: 'Neapol Şadlıq Sarayı',
    description:
      'Ailəvi məclislər, nişan və toy axşamları üçün unudulmaz abu-hava. Sumqayıtın ən sevilən sarayı — sərfəli qiymətlər, bol menyu və mehriban kollektiv.',
    city: 'Sumqayıt',
    address: 'Səməd İsmayılov küç. 12',
    phone: '+994 18 642 11 33',
    rating: 4.5,
    reviewCount: 73,
    features: ['Parkinq', 'Gəlin otağı', 'Canlı musiqi'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=900&q=80',
    ],
    halls: [
      {
        id: 401,
        venueId: 4,
        name: 'Neapol Əsas Zal',
        capacity: 350,
        minPrice: 35,
        description: 'İşıqlı, geniş pəncərəli zal — 350 qonağa qədər.',
        imageUrl:
          'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=700&q=80',
      },
    ],
    menus: [
      {
        id: 41,
        name: 'Sadə',
        pricePerPerson: 35,
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar' },
          { id: 2, name: 'Toyuq soté' },
          { id: 3, name: 'Lülə kabab' },
          { id: 4, name: 'Plov' },
          { id: 5, name: 'Şirniyyat' },
        ],
      },
      {
        id: 42,
        name: 'Bol Menyulu',
        pricePerPerson: 50,
        items: [
          { id: 1, name: 'Genişləndirilmiş soyuq masa' },
          { id: 2, name: 'Balıq qızartması' },
          { id: 3, name: 'Kabab çeşidi' },
          { id: 4, name: 'Şah plov' },
          { id: 5, name: 'Tort və desertlər' },
        ],
      },
    ],
    reviews: [
      { id: 1, author: 'Kamran V.', rating: 5, date: '2026-05-30', text: 'Sumqayıtda bu qiymətə bundan yaxşı yer yoxdur. Yeməklər çox dadlı idi.' },
    ],
  },
  {
    id: 5,
    name: 'Altun Saray',
    description:
      'Lüks interyeri, peşəkar xidmət heyəti və dadlı mətbəxi ilə seçilən məkan. İki mərtəbəli saray, panoramik lift və eksklüziv VIP lounge zonası.',
    city: 'Bakı',
    address: 'Böyükşor şosesi 3',
    phone: '+994 12 566 90 12',
    rating: 4.7,
    reviewCount: 141,
    features: ['VIP lounge', 'Parkinq', 'Gəlin otağı', 'Fişəng şousu', 'Panoramik lift'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=900&q=80',
    ],
    halls: [
      {
        id: 501,
        venueId: 5,
        name: 'İmperator Zalı',
        capacity: 500,
        minPrice: 65,
        description: 'Barokko üslubunda bəzədilmiş təmtəraqlı əsas zal.',
        imageUrl:
          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=80',
      },
      {
        id: 502,
        venueId: 5,
        name: 'Royal Zal',
        capacity: 300,
        minPrice: 60,
        description: 'İkinci mərtəbədə şəhər mənzərəli zərif zal.',
        imageUrl:
          'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=700&q=80',
      },
    ],
    menus: [
      {
        id: 51,
        name: 'Gold',
        pricePerPerson: 65,
        items: [
          { id: 1, name: 'Qızıl standart soyuq masa' },
          { id: 2, name: 'Nərə balığı' },
          { id: 3, name: 'Quzu kababı' },
          { id: 4, name: 'Şah plov' },
          { id: 5, name: 'Desert bar' },
        ],
      },
      {
        id: 52,
        name: 'Platinum',
        pricePerPerson: 80,
        items: [
          { id: 1, name: 'Eksklüziv dəniz məhsulları' },
          { id: 2, name: 'Quzu buğlama' },
          { id: 3, name: 'Kabab dəsti' },
          { id: 4, name: 'Zəfəranlı plov' },
          { id: 5, name: 'Fransız şirniyyatları' },
          { id: 6, name: 'Premium içkilər' },
        ],
      },
    ],
    reviews: [
      { id: 1, author: 'Ləman R.', rating: 5, date: '2026-07-12', text: 'VIP lounge zonası qonaqlarımız üçün əsl sürpriz oldu. Təşəkkürlər!' },
      { id: 2, author: 'Orxan M.', rating: 4, date: '2026-06-05', text: 'İnteryer çox gözəldir, yeməklər vaxtında və isti gəldi.' },
    ],
  },
  {
    id: 6,
    name: 'Carçıoğlu Şadlıq Sarayı',
    description:
      'Geniş parkinqi, səliqəli zalları və sərfəli qiymətləri ilə qonaqların sevimli ünvanı. 20 illik təcrübə, minlərlə uğurlu tədbir.',
    city: 'Bakı',
    address: 'Baksol yolu 8',
    phone: '+994 12 434 55 66',
    rating: 4.4,
    reviewCount: 88,
    features: ['Geniş parkinq', 'Gəlin otağı', 'Canlı musiqi'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80',
    ],
    halls: [
      {
        id: 601,
        venueId: 6,
        name: 'Ağ Saray Zalı',
        capacity: 450,
        minPrice: 45,
        description: 'Ağ-qızılı tonlarda geniş zal, böyük rəqs meydançası.',
        imageUrl:
          'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=700&q=80',
      },
    ],
    menus: [
      {
        id: 61,
        name: 'İqtisadi',
        pricePerPerson: 45,
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar' },
          { id: 2, name: 'Toyuq qızartması' },
          { id: 3, name: 'Lülə kabab' },
          { id: 4, name: 'Plov' },
          { id: 5, name: 'Şirniyyat masası' },
        ],
      },
      {
        id: 62,
        name: 'Şahənşah',
        pricePerPerson: 60,
        items: [
          { id: 1, name: 'Zəngin soyuq masa' },
          { id: 2, name: 'Balıq assortisi' },
          { id: 3, name: 'Kabab çeşidi' },
          { id: 4, name: 'Şah plov' },
          { id: 5, name: 'Toy tortu' },
        ],
      },
    ],
    reviews: [
      { id: 1, author: 'Vüsal H.', rating: 4, date: '2026-04-22', text: 'Parkinq problemi olmadı, zal təmiz və səliqəli idi.' },
    ],
  },
  {
    id: 7,
    name: 'Xan Sarayı',
    description:
      'Gəncənin tarixi ruhunu daşıyan, milli memarlıq elementləri ilə bəzədilmiş şadlıq sarayı. Qərb bölgəsinin ən böyük toy məkanı.',
    city: 'Gəncə',
    address: 'Cavadxan küç. 22',
    phone: '+994 22 256 78 90',
    rating: 4.6,
    reviewCount: 64,
    features: ['Parkinq', 'Gəlin otağı', 'Həyət sahəsi', 'Milli interyer'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=900&q=80',
    ],
    halls: [
      {
        id: 701,
        venueId: 7,
        name: 'Xan Zalı',
        capacity: 500,
        minPrice: 38,
        description: 'Milli naxışlı, geniş səhnəli əsas zal.',
        imageUrl:
          'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=700&q=80',
      },
      {
        id: 702,
        venueId: 7,
        name: 'Nizami Zalı',
        capacity: 220,
        minPrice: 35,
        description: 'Kiçik məclislər üçün rahat zal.',
        imageUrl:
          'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=700&q=80',
      },
    ],
    menus: [
      {
        id: 71,
        name: 'Gəncə Standart',
        pricePerPerson: 38,
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar' },
          { id: 2, name: 'Gəncə paxlavası' },
          { id: 3, name: 'Tikə kabab' },
          { id: 4, name: 'Plov' },
          { id: 5, name: 'Meyvə masası' },
        ],
      },
      {
        id: 72,
        name: 'Xan Menyusu',
        pricePerPerson: 52,
        items: [
          { id: 1, name: 'Zəngin soyuq masa' },
          { id: 2, name: 'Balıq ləvəngi' },
          { id: 3, name: 'Quzu kababı' },
          { id: 4, name: 'Şah plov' },
          { id: 5, name: 'Milli şirniyyatlar' },
        ],
      },
    ],
    reviews: [
      { id: 1, author: 'Fərid N.', rating: 5, date: '2026-06-19', text: 'Gəncədə ən yaxşı seçimdir. Milli interyer qonaqları valeh etdi.' },
    ],
  },
  {
    id: 8,
    name: 'Qafqaz İncisi',
    description:
      'Qubanın dağ mənzərəli guşəsində, təbiət qoynunda açıq hava tədbirləri üçün ideal məkan. Yay toyları və şəhərdənkənar məclislər üçün mükəmməl seçim.',
    city: 'Quba',
    address: 'Qəçrəş yolu 5',
    phone: '+994 23 335 21 40',
    rating: 4.8,
    reviewCount: 52,
    features: ['Dağ mənzərəsi', 'Açıq hava zonası', 'Parkinq', 'Kottec icarəsi'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80',
    ],
    halls: [
      {
        id: 801,
        venueId: 8,
        name: 'Açıq Hava Terası',
        capacity: 300,
        minPrice: 42,
        description: 'Dağ mənzərəli açıq teras — yay ayları üçün.',
        imageUrl:
          'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=700&q=80',
      },
      {
        id: 802,
        venueId: 8,
        name: 'Qapalı Zal',
        capacity: 250,
        minPrice: 40,
        description: 'Panoramik pəncərəli isti qapalı zal.',
        imageUrl:
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=700&q=80',
      },
    ],
    menus: [
      {
        id: 81,
        name: 'Təbiət Menyusu',
        pricePerPerson: 42,
        items: [
          { id: 1, name: 'Kənd sacı' },
          { id: 2, name: 'Quba alması ilə salatlar' },
          { id: 3, name: 'Manqal kababı' },
          { id: 4, name: 'Plov' },
          { id: 5, name: 'Quba paxlavası' },
        ],
      },
      {
        id: 82,
        name: 'Dağ Ziyafəti',
        pricePerPerson: 58,
        items: [
          { id: 1, name: 'Zəngin kənd masası' },
          { id: 2, name: 'Forel balığı' },
          { id: 3, name: 'Quzu buğlama' },
          { id: 4, name: 'Şah plov' },
          { id: 5, name: 'Milli şirniyyat dəsti' },
        ],
      },
    ],
    reviews: [
      { id: 1, author: 'Aysel K.', rating: 5, date: '2026-07-08', text: 'Açıq havada toy arzumuz var idi, bundan gözəl yer tapa bilməzdik!' },
      { id: 2, author: 'Emil T.', rating: 5, date: '2026-06-25', text: 'Dağ mənzərəsi, təmiz hava, dadlı yeməklər. Qonaqlar Bakıdan gəlməyə dəyər dedi.' },
    ],
  },
]

// Hər zalın öncədən dolu/tutulmuş günləri (GET /Halls/GetAvailability cavabına uyğun).
// Rezerv ediləndə bunların üstünə localStorage-dakı aktiv rezervlər də əlavə olunur.
export const busyDates = {
  101: ['2026-08-01', '2026-08-08', '2026-08-15', '2026-09-05', '2026-09-12'],
  102: ['2026-08-02', '2026-08-22'],
  201: ['2026-08-07', '2026-08-08', '2026-08-14', '2026-08-29', '2026-09-19'],
  301: ['2026-08-09', '2026-08-16'],
  302: ['2026-08-01'],
  401: ['2026-08-08', '2026-08-15', '2026-08-30'],
  501: ['2026-08-01', '2026-08-02', '2026-08-08', '2026-09-06'],
  502: ['2026-08-14'],
  601: ['2026-08-21', '2026-09-04'],
  701: ['2026-08-06', '2026-08-13', '2026-08-20'],
  702: [],
  801: ['2026-08-07', '2026-08-08', '2026-08-09', '2026-08-15'],
  802: ['2026-08-22'],
}
