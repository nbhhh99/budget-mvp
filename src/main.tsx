import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './pwa/registerServiceWorker'
import { initDatabase } from './db'

registerServiceWorker()

const INIT_TIMEOUT_MS = 8000

function renderBootError() {
  const root = document.getElementById('root')!
  root.innerHTML = ''
  const wrap = document.createElement('div')
  wrap.style.cssText =
    'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center;gap:12px;'
  wrap.innerHTML = `
    <p style="font-size:1rem;font-weight:700;">데이터를 불러올 수 없습니다</p>
    <p style="font-size:0.85rem;color:#7a7468;">브라우저의 저장 공간(IndexedDB) 접근이 차단되어 있을 수 있습니다.
      시크릿/프라이빗 모드가 아닌 창에서 다시 시도해 주세요.</p>
    <button id="boot-retry" style="min-height:48px;padding:0 24px;border:none;border-radius:14px;background-color:#f5a65b;color:white;font-weight:700;">다시 시도</button>
  `
  root.appendChild(wrap)
  document.getElementById('boot-retry')!.addEventListener('click', () => window.location.reload())
}

async function bootstrap() {
  try {
    await Promise.race([
      initDatabase(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('initDatabase timed out')), INIT_TIMEOUT_MS),
      ),
    ])
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (err) {
    console.error('Failed to initialize database', err)
    renderBootError()
  }
}

bootstrap()
