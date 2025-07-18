import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite' // ✨ loadEnv 추가
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import dotenvExpand from 'dotenv-expand' // ✨ dotenv-expand 추가

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // ✨ 함수 형태로 변경
  // 개발 모드일 때만 환경 변수를 로드하고 확장합니다.
  if (mode === 'development') {
    const env = loadEnv(mode, process.cwd(), '')
    dotenvExpand.expand({ parsed: env })
  }

  // 기존 설정을 그대로 return 문 안에 유지합니다.
  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true, // <-- 이것만 추가해 주면 됩니다!
      port: 3000, // 포트 충돌 나면 3001로 자동 변경됨
    },
  }
})
