import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

// Yığılmış APK-nı və version.json-u telefona paylayır: /app-update/...
// Fayllar releases/ qovluğundadır (npm run apk yaradır). Quraşdırılmış
// tətbiq version.json-a baxıb «yeni versiya var» deyir.
const appUpdate = () => {
  const types = {
    '.json': 'application/json; charset=utf-8',
    '.apk': 'application/vnd.android.package-archive',
  }

  const handler = (req, res, next) => {
    // Sınaq APK-sı kompüteri şəbəkədə bu ünvanla tapır: 3000 portunda başqa
    // cihaz da ola bilər, cavab bizim server olduğunu təsdiqləyir
    if ((req.url || '').split('?')[0] === '/ping') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.end('{"app":"toyun"}')
    }

    // basename — qovluqdan kənara çıxmağın qarşısını alır
    const name = path.basename(decodeURIComponent((req.url || '').split('?')[0]))
    const type = types[path.extname(name)]
    const file = path.join(__dirname, 'releases', name)

    if (!type || !fs.existsSync(file)) return next()

    res.setHeader('Content-Type', type)
    res.setHeader('Content-Length', fs.statSync(file).size)
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (name.endsWith('.apk')) res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
    fs.createReadStream(file).pipe(res)
  }

  return {
    name: 'app-update',
    configureServer: (server) => { server.middlewares.use('/app-update', handler) },
    configurePreviewServer: (server) => { server.middlewares.use('/app-update', handler) },
  }
}

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  return defineConfig({
    plugins: [vue(), appUpdate()],
    server: {
      host: process.env.VITE_HOST,
      port: Number(process.env.VITE_PORT),

      // Telefon kompüterə adı ilə də qoşula bilir (kompüter-adı.local) —
      // Vite tanımadığı host adını təhlükəsizlik üçün rədd edir
      allowedHosts: ['.local'],

      // APK yığılanda android/ və releases/ içində yüzlərlə fayl dəyişir —
      // dev server bunları izləyib açıq səhifələri boş yerə yeniləməsin
      watch: {
        ignored: ['**/android/**', '**/releases/**', '**/AAAA/**'],
      },

      // Telefondan yoxlamaq üçün. Telefon `/api/...` ünvanına öz
      // qoşulduğu host üzərindən müraciət edir, Vite isə sorğunu bu
      // kompüterdəki backend-ə ötürür.
      //
      // Bu, iki problemi birdən həll edir:
      //  · «localhost» telefonun özünü göstərirdi, backend-i yox
      //  · backend öz-imzalı HTTPS sertifikatı işlədir və telefon onu
      //    qəbul etmir — proxy ilə telefon Vite-a sadə HTTP danışır
      //
      // secure: false — öz-imzalı sertifikat yoxlanılmır. Bu yalnız
      // inkişaf serveridir, istehsalda VITE_API_URL tam ünvan olur.
      proxy: {
        '/api': {
          target: process.env.VITE_API_TARGET || 'https://localhost:7277',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  })
}
