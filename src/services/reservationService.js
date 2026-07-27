// Rezervasiya üçün MOCK servis qatı — data localStorage-da saxlanılır.
// Status kodları backend ReservationStatus enum-u ilə eynidir:
// 0 = Pending (Gözləyir), 1 = Confirmed (Təsdiqlənib), 2 = Rejected (Rədd edilib), 3 = Cancelled (Ləğv edilib)

const STORAGE_KEY = 'mock_reservations'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// localStorage-dan bütün rezervləri oxuyur; ilk dəfə boşdursa nümunə datalar yazır
const readAll = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) return JSON.parse(raw)

  // Səhifə boş görünməsin deyə nümunə rezervlər (statusların görünüşünü göstərir)
  const seed = [
    {
      id: 1,
      venueId: 1,
      venueName: 'Gülüstan Sarayı',
      hallId: 102,
      hallName: 'Kiçik Zal',
      menuId: 12,
      menuName: 'Premium',
      pricePerPerson: 70,
      eventDate: '2026-09-18',
      guestCount: 180,
      contactPhone: '+994 50 123 45 67',
      note: 'Nişan mərasimi, səhnə bəzədilməsi istəyirik.',
      status: 1,
      createdAt: '2026-07-10T14:20:00Z',
    },
    {
      id: 2,
      venueId: 4,
      venueName: 'Neapol Şadlıq Sarayı',
      hallId: 401,
      hallName: 'Neapol Əsas Zal',
      menuId: 42,
      menuName: 'Bol Menyulu',
      pricePerPerson: 50,
      eventDate: '2026-08-30',
      guestCount: 250,
      contactPhone: '+994 50 123 45 67',
      note: null,
      status: 0,
      createdAt: '2026-07-22T09:05:00Z',
    },
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
}

const writeAll = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list))

// Zalın aktiv (ləğv/rədd olunmamış) rezerv günlərini qaytarır — təqvimdə bağlamaq üçün
export const getActiveReservationDates = (hallId) => {
  return readAll()
    .filter((r) => r.hallId === hallId && (r.status === 0 || r.status === 1))
    .map((r) => r.eventDate)
}

// Real: POST /Reservations/Create — eyni günə ikiqat rezervə icazə vermir
export const createReservation = async (dto) => {
  await delay()

  const taken = getActiveReservationDates(dto.hallId).includes(dto.eventDate)
  if (taken) {
    const err = new Error('Bu zal seçdiyiniz tarixdə artıq doludur.')
    err.userMessage = err.message
    throw err
  }

  const list = readAll()
  const reservation = {
    id: list.length ? Math.max(...list.map((r) => r.id)) + 1 : 1,
    ...dto,
    status: 0,
    createdAt: new Date().toISOString(),
  }
  list.push(reservation)
  writeAll(list)
  return { data: reservation, message: 'Rezerv sorğusu göndərildi.' }
}

// Real: GET /Reservations/GetMine — müştərinin öz rezervləri (yenilər yuxarıda)
export const getMyReservations = async () => {
  await delay()
  return [...readAll()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

// Real: PUT /Reservations/Cancel/{id} — rezervi ləğv edir, günü yenidən boşaldır
export const cancelReservation = async (id) => {
  await delay()
  const list = readAll()
  const reservation = list.find((r) => r.id === id)
  if (!reservation) {
    const err = new Error('Rezerv tapılmadı.')
    err.userMessage = err.message
    throw err
  }
  reservation.status = 3
  writeAll(list)
  return { message: 'Rezerv ləğv edildi.' }
}
