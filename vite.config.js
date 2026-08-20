import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  return defineConfig({
    plugins: [vue()],
    server: {
      host: process.env.VITE_HOST,
      port: Number(process.env.VITE_PORT),

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
