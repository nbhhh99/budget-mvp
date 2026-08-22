import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 프로젝트 사이트는 /<repo-name>/ 하위 경로로 서빙되므로,
// 프로덕션 빌드에서만 base를 바꾼다 (개발 서버는 그대로 루트에서 동작).
const isBuild = process.env.NODE_ENV === 'production'

// https://vite.dev/config/
export default defineConfig({
  base: isBuild ? '/budget-mvp/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: '가계부',
        short_name: '가계부',
        description: '수입·지출을 빠르게 기록하고 월별 계획과 실제를 비교하는 개인용 가계부',
        lang: 'ko',
        theme_color: '#FBF7EC',
        background_color: '#FBF7EC',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
