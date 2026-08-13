import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { configure } from 'vue-gtag'

import App from './App.vue'
import router from './router'

import './assets/main.css'
import 'vfonts/Lato.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

try {
  configure({
    tagId: 'G-FB5YHYF0ST',
    pageTracker: {
      router,
    }
  })
} catch (e) {
  console.warn('gtag init failed:\n', e)
}

app.mount('#app')
