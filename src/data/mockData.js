// Backend API-nin qaytardığı formaya uyğun mock data.
// Real API qoşulanda bu fayl silinəcək, servislər həqiqi endpoint-lərə yönələcək.
// Sahə adları backend DTO-ları ilə eynidir: venue { id, name, city, address, phone,
// description, coverImageUrl, latitude, longitude, halls[], menus[] } və s.

export const venues = [
  {
    id: 1,
    name: 'Gülüstan Sarayı',
    description:
      'Paytaxtın mərkəzində yerləşən, möhtəşəm dizaynlı və geniş imkanlara malik ən prestijli saray. 1982-ci ildən fəaliyyət göstərən Gülüstan Sarayı dövlət səviyyəli tədbirlərin və minlərlə toyun ünvanı olub. Panoramik şəhər mənzərəsi, klassik interyer və peşəkar xidmət komandası.',
    city: 'Bakı',
    address: 'Nizami küç. 10, Səbail rayonu',
    latitude: 40.3608,
    longitude: 49.8352,
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
        coverImageUrl:
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
        description: 'Klassik toy süfrəsi — bütün əsas yeməklər daxildir.',
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar (8 çeşid)', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Sac içi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Plov (qovurma ilə)', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Şirniyyat masası', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Meyvə vazası', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80' },
          { id: 6, name: 'Sərinləşdirici içkilər', category: 'İçki', imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=500&q=80' },
        ],
      },
      {
        id: 12,
        name: 'Premium',
        pricePerPerson: 70,
        coverImageUrl:
          'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
        description: 'Zəngin çeşid, balıq və kabab assortisi ilə.',
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar (12 çeşid)', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Qızıl balıq', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Kabab çeşidi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Şah plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Toy tortu', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=500&q=80' },
          { id: 6, name: 'Limitsiz içkilər', category: 'İçki', imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=500&q=80' },
        ],
      },
      {
        id: 13,
        name: 'Lüks',
        pricePerPerson: 90,
        coverImageUrl:
          'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80',
        description: 'Ən yüksək səviyyə — dəniz məhsulları və premium içki paketi.',
        items: [
          { id: 1, name: 'Dəniz məhsulları masası', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Quzu buğlama', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Nərə balığı kababı', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Şah plov (zəfəranlı)', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Fransız desert masası', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80' },
          { id: 6, name: 'Premium içki paketi', category: 'İçki', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=500&q=80' },
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
    address: 'Bayıl, Dənizkənarı bulvar 1',
    latitude: 40.3444,
    longitude: 49.8447,
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
        coverImageUrl:
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
        description: 'Balıq assortisi və kabab ilə tarazlı süfrə.',
        items: [
          { id: 1, name: 'Soyuq masa (10 çeşid)', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Balıq assortisi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Tikə kabab', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Desert masası', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80' },
        ],
      },
      {
        id: 22,
        name: 'VIP',
        pricePerPerson: 85,
        coverImageUrl:
          'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
        description: 'Dəniz məhsulları, steyk və premium içkilər.',
        items: [
          { id: 1, name: 'Dəniz məhsulları masası', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Steyk çeşidi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Şah plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'İtalyan desertləri', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Premium içki paketi', category: 'İçki', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=500&q=80' },
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
    latitude: 40.4553,
    longitude: 49.7563,
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
        coverImageUrl:
          'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
        description: 'Sərfəli qiymətə tam milli süfrə.',
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Dolma çeşidi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Lülə kabab', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Meyvə və şirniyyat', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80' },
        ],
      },
      {
        id: 32,
        name: 'Deluxe',
        pricePerPerson: 55,
        coverImageUrl:
          'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=800&q=80',
        description: 'Balıq ləvəngi və kabab assortisi ilə genişləndirilmiş menyu.',
        items: [
          { id: 1, name: 'Zəngin soyuq masa', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Balıq ləvəngi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Kabab assortisi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Şah plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Toy tortu', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=500&q=80' },
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
    latitude: 40.5892,
    longitude: 49.6683,
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
        coverImageUrl:
          'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
        description: 'Büdcəyə uyğun, amma dolğun süfrə.',
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Toyuq soté', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Lülə kabab', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Şirniyyat', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80' },
        ],
      },
      {
        id: 42,
        name: 'Bol Menyulu',
        pricePerPerson: 50,
        coverImageUrl:
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
        description: 'Balıq və kabab çeşidi ilə genişləndirilmiş variant.',
        items: [
          { id: 1, name: 'Genişləndirilmiş soyuq masa', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Balıq qızartması', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Kabab çeşidi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Şah plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Tort və desertlər', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=500&q=80' },
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
    address: 'Böyükşor şosesi 3, Narimanov rayonu',
    latitude: 40.4093,
    longitude: 49.8671,
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
        coverImageUrl:
          'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
        description: 'Nərə balığı və quzu kababı daxil olmaqla zəngin süfrə.',
        items: [
          { id: 1, name: 'Qızıl standart soyuq masa', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Nərə balığı', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Quzu kababı', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Şah plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Desert bar', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80' },
        ],
      },
      {
        id: 52,
        name: 'Platinum',
        pricePerPerson: 80,
        coverImageUrl:
          'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80',
        description: 'Eksklüziv dəniz məhsulları və fransız şirniyyatları.',
        items: [
          { id: 1, name: 'Eksklüziv dəniz məhsulları', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Quzu buğlama', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Kabab dəsti', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Zəfəranlı plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Fransız şirniyyatları', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80' },
          { id: 6, name: 'Premium içkilər', category: 'İçki', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=500&q=80' },
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
    address: 'Baksol yolu 8, Binəqədi rayonu',
    latitude: 40.4341,
    longitude: 49.8062,
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
        coverImageUrl:
          'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
        description: 'Sərfəli qiymətə klassik toy süfrəsi.',
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Toyuq qızartması', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Lülə kabab', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Şirniyyat masası', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80' },
        ],
      },
      {
        id: 62,
        name: 'Şahənşah',
        pricePerPerson: 60,
        coverImageUrl:
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
        description: 'Balıq assortisi və toy tortu daxil zəngin variant.',
        items: [
          { id: 1, name: 'Zəngin soyuq masa', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Balıq assortisi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Kabab çeşidi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Şah plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Toy tortu', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=500&q=80' },
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
    latitude: 40.6828,
    longitude: 46.3606,
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
        coverImageUrl:
          'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=800&q=80',
        description: 'Gəncə mətbəxinin klassik yeməkləri.',
        items: [
          { id: 1, name: 'Soyuq qəlyanaltılar', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Gəncə paxlavası', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Tikə kabab', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Meyvə masası', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80' },
        ],
      },
      {
        id: 72,
        name: 'Xan Menyusu',
        pricePerPerson: 52,
        coverImageUrl:
          'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
        description: 'Balıq ləvəngi və quzu kababı ilə xan süfrəsi.',
        items: [
          { id: 1, name: 'Zəngin soyuq masa', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Balıq ləvəngi', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Quzu kababı', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Şah plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Milli şirniyyatlar', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80' },
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
    latitude: 41.3608,
    longitude: 48.5133,
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
        coverImageUrl:
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
        description: 'Kənd sacı və manqal kababı — təbiət qoynunda.',
        items: [
          { id: 1, name: 'Kənd sacı', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Quba alması ilə salatlar', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Manqal kababı', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f46f1e1b1b1a?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Quba paxlavası', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80' },
        ],
      },
      {
        id: 82,
        name: 'Dağ Ziyafəti',
        pricePerPerson: 58,
        coverImageUrl:
          'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=800&q=80',
        description: 'Forel balığı və quzu buğlama ilə dağ süfrəsi.',
        items: [
          { id: 1, name: 'Zəngin kənd masası', category: 'Soyuq', imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=500&q=80' },
          { id: 2, name: 'Forel balığı', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80' },
          { id: 3, name: 'Quzu buğlama', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80' },
          { id: 4, name: 'Şah plov', category: 'İsti', imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80' },
          { id: 5, name: 'Milli şirniyyat dəsti', category: 'Desert', imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80' },
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
