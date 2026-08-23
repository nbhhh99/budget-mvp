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
      includeAssets: ['icons/favicon-32.png', 'icons/apple-touch-icon.png'],
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
      // data/briefings/*.json도 정적 파일로 함께 프리캐시한다 — 재무 브리핑은
      // GitHub Actions가 만들어 커밋한 정적 JSON이라 build 시점에 dist/에 존재하고,
      // 새 브리핑이 배포될 때마다 서비스워커 버전도 함께 갱신되므로 별도 런타임
      // 캐싱 규칙 없이도 오프라인에서 마지막으로 배포된 브리핑을 읽을 수 있다
      // (§6·§8 오프라인 저장본 요구사항).
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
