import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import './AppLayout.css'

export function AppLayout() {
  const location = useLocation()
  const hideNav =
    location.pathname.startsWith('/transactions/new') ||
    /^\/transactions\/[^/]+\/edit$/.test(location.pathname)

  return (
    <div className="app-layout">
      <main className="app-layout__content">
        <Outlet />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
