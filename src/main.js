import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useHolidayService } from './services/holidayService'


// V-Calendar를 가져옵니다.
import VCalendar from 'v-calendar';
import 'v-calendar/style.css'; // V-Calendar의 기본 CSS를 가져옵니다.

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
// 앱에 V-Calendar를 등록합니다.
app.use(VCalendar, {})

// 공휴일 데이터를 앱 시작 시점에 로드합니다.
const { fetchHolidays } = useHolidayService()
fetchHolidays()

app.mount('#app')
