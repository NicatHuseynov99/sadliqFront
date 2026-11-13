import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@fontsource-variable/onest'
import '@fontsource-variable/fraunces'
import './assets/tokens.css'
import './style.css'

import App from './App.vue'
import router from './router'
import { startUpdateWatcher } from './mobile/updateCheck'
import icons from './icons'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(icons)

app.mount('#app')

// Mobil tətbiqdə yeni APK çıxıbsa xəbər verir; brauzerdə heç nə etmir
startUpdateWatcher()
