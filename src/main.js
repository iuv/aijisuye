import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

import './styles/main.css'

console.log('[Main] Initializing Vue application...')

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

console.log('[Main] Mounting app to #app element...')

app.mount('#app')

console.log('[Main] App mounted successfully')
console.log('[Main] Current route:', window.location.pathname)
console.log('[Main] Environment:', import.meta.env.MODE)
