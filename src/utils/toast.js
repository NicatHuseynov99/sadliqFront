// Tətbiqin bütün bildiriş mesajları bir yerdən keçir. Əvvəllər ElMessage
// (12 fayl) və ElNotification (11 fayl) qarışıq işlədilirdi — bəzi
// səhifələrdə hər ikisi eyni anda var idi. Görünüş fərqli idi: biri
// yuxarı-ortada kiçik zolaq, digəri sağ yuxarıda başlıqlı kart.
//
// ElNotification seçildi, çünki başlıq dəstəkləyir və xəta/uğur
// mesajlarını fərqləndirmək asandır.
import { ElNotification } from 'element-plus'

const DEFAULT_TITLES = {
  success: 'Uğurlu',
  error: 'Xəta',
  warning: 'Diqqət',
  info: 'Məlumat',
}

const show = (type, message, title) => {
  ElNotification({
    title: title ?? DEFAULT_TITLES[type],
    message,
    type,
    zIndex: 99999,
  })
}

export const toast = {
  success: (message, title) => show('success', message, title),
  error: (message, title) => show('error', message, title),
  warning: (message, title) => show('warning', message, title),
  info: (message, title) => show('info', message, title),
}
