// Telefonda sınaq üçün Android APK yığır.
//
//   npm run apk                    — Wi-Fi ünvanını özü tapır
//   npm run apk -- --host=10.0.0.7 — ünvanı əl ilə ver
//   npm run apk -- --live          — canlı rejim (səhifələr dev serverdən)
//
// Nəticə: releases/toyun.apk və releases/version.json. Dev server
// (npm run dev) bunları /app-update altında paylayır; quraşdırılmış
// tətbiq oradakı version.json-a baxıb yeniləmə təklif edir.
//
// APK kompüterin şəbəkə ünvanına bağlıdır: ünvan dəyişəndə yenidən yığın.

import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir, networkInterfaces } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]

// Wi-Fi/Ethernet ünvanı; virtual adapterlər (Hyper-V, WSL, Docker) keçilir
const findHost = () => {
  const candidates = []
  for (const [name, list] of Object.entries(networkInterfaces())) {
    if (/vEthernet|WSL|Docker|VirtualBox|VMware|Loopback/i.test(name)) continue
    for (const net of list ?? []) {
      if (net.family === 'IPv4' && !net.internal) candidates.push({ name, address: net.address })
    }
  }
  const wifi = candidates.find((c) => /wi-?fi|wlan|wireless/i.test(c.name))
  return (wifi ?? candidates[0])?.address
}

const host = arg('host') ?? findHost()
if (!host) {
  console.error('Şəbəkə ünvanı tapılmadı. --host=192.168.x.x ilə verin.')
  process.exit(1)
}
const port = arg('port') ?? '3000'
const base = `http://${host}:${port}`

// Yığım nömrəsi: 2026-01-01-dən keçən dəqiqələr — həmişə artır, Android
// versionCode həddinə (2.1 mlrd) sığır
const now = new Date()
const build = Math.floor((now.getTime() - Date.UTC(2026, 0, 1)) / 60000)
const pad = (n) => String(n).padStart(2, '0')
const label = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`

const env = {
  ...process.env,
  JAVA_HOME: process.env.JAVA_HOME || path.join(homedir(), 'dev-tools', 'jdk-21'),
  ANDROID_HOME: process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk'),
  VITE_API_URL: `${base}/api`,
  VITE_UPDATE_URL: `${base}/app-update`,
  VITE_APP_BUILD: String(build),
  VITE_APP_LABEL: label,
}

const run = (command, cwd = root) => {
  console.log(`\n> ${command}`)
  execSync(command, { cwd, env, stdio: 'inherit' })
}

run('npx vite build')
run('npx cap sync android')

// Canlı rejim (--live): tətbiq səhifələri APK-nın içindən yox, birbaşa
// dev serverdən oxuyur — kod dəyişən kimi telefonda özü yenilənir.
// Kompüter sönülü və ya başqa şəbəkədədirsə tətbiq açılmır.
// Mağaza yığımında istifadə olunmur.
const live = process.argv.includes('--live')
if (live) {
  const nativeConfig = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'capacitor.config.json')
  const config = JSON.parse(readFileSync(nativeConfig, 'utf8'))
  config.server = { ...config.server, url: base, cleartext: true }
  writeFileSync(nativeConfig, JSON.stringify(config, null, 2))
  console.log(`\nCanlı rejim: tətbiq ${base} ünvanından yüklənəcək`)
}

const gradlew = path.join(root, 'android', 'gradlew.bat')
run(`"${gradlew}" assembleDebug -PappVersionCode=${build} -PappVersionName=${label} --console=plain -q`, path.join(root, 'android'))

const built = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
if (!existsSync(built)) {
  console.error('APK tapılmadı: ' + built)
  process.exit(1)
}

let notes = ''
try {
  notes = execSync('git log -1 --pretty=%s', { cwd: root }).toString().trim().slice(0, 140)
} catch { /* git yoxdursa qeyd boş qalır */ }
if (live) notes = 'Canlı rejim — bundan sonra dəyişikliklər özü görünəcək, yenidən quraşdırmaq lazım deyil'

const out = path.join(root, 'releases')
mkdirSync(out, { recursive: true })
copyFileSync(built, path.join(out, 'toyun.apk'))
writeFileSync(
  path.join(out, 'version.json'),
  JSON.stringify({ build, label, file: 'toyun.apk', notes, builtAt: now.toISOString() }, null, 2),
)

const mb = (statSync(path.join(out, 'toyun.apk')).size / 1024 / 1024).toFixed(1)
console.log(`\nHazırdır: versiya ${label} (yığım ${build}), ${mb} MB`)
console.log(`API ünvanı:      ${base}/api`)
console.log(`Telefonda açın:  ${base}/app-update/toyun.apk`)
