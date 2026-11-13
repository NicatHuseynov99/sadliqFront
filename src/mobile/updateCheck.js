// Mobil tətbiqdə yeniləmə yoxlaması.
//
// APK yığılanda içinə yığım nömrəsi yazılır (VITE_APP_BUILD). Tətbiq hər
// açılanda və arxa fondan qayıdanda serverdəki version.json-u oxuyur;
// oradakı nömrə böyükdürsə «Yeni versiya var» pəncərəsi çıxır və
// «Yüklə» düyməsi APK-nı telefonun brauzerində açır.
//
// Brauzerdə (sayt kimi açılanda) heç nə etmir.

import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { ElMessageBox } from 'element-plus'

const CURRENT_BUILD = Number(import.meta.env.VITE_APP_BUILD) || 0
const UPDATE_URL = import.meta.env.VITE_UPDATE_URL || ''

let dialogOpen = false
let lastCheck = 0

const fetchLatest = async () => {
  const response = await fetch(`${UPDATE_URL}/version.json?t=${Date.now()}`, { cache: 'no-store' })
  if (!response.ok) return null
  return response.json()
}

export const checkForUpdate = async () => {
  if (!Capacitor.isNativePlatform() || !UPDATE_URL || !CURRENT_BUILD) return
  if (dialogOpen) return

  // Tətbiqlər arası tez-tez keçiddə serveri hər dəfə yoxlamayaq
  const now = Date.now()
  if (now - lastCheck < 15000) return
  lastCheck = now

  let latest = null
  try {
    latest = await fetchLatest()
  } catch {
    // Kompüter sönülüdür və ya telefon başqa şəbəkədədir — səssiz keçirik
    return
  }

  if (!latest || Number(latest.build) <= CURRENT_BUILD) return

  dialogOpen = true
  try {
    await ElMessageBox.confirm(
      `Versiya ${latest.label} hazırdır.${latest.notes ? `\n\nSon dəyişiklik: ${latest.notes}` : ''}`,
      'Yeni versiyanı yüklə',
      {
        confirmButtonText: 'Yüklə',
        cancelButtonText: 'Sonra',
        type: 'info',
        closeOnClickModal: false,
        customStyle: { whiteSpace: 'pre-line', maxWidth: '90vw' },
      },
    )
    await Browser.open({ url: `${UPDATE_URL}/${latest.file}?v=${latest.build}` })
  } catch {
    // «Sonra» seçildi — tətbiq növbəti dəfə açılanda yenə soruşacaq
  } finally {
    dialogOpen = false
  }
}

export const startUpdateWatcher = () => {
  if (!Capacitor.isNativePlatform()) return

  checkForUpdate()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate()
  })
}

// Profil və ya altbilgidə göstərmək üçün
export const appVersionLabel = import.meta.env.VITE_APP_LABEL || ''
