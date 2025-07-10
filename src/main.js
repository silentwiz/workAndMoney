import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'


// V-Calendar를 가져옵니다.
import VCalendar from 'v-calendar';
import 'v-calendar/style.css'; // V-Calendar의 기본 CSS를 가져옵니다.

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
// 앱에 V-Calendar를 등록합니다.
app.use(VCalendar, {})

app.mount('#app')
