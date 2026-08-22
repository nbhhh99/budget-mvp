import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/toast/ToastProvider'
import { AppLayout } from './app/AppLayout'
import { HomeScreen } from './app/HomeScreen'
import { TransactionFormScreen } from './features/transactions/TransactionFormScreen'
import { MonthlyListScreen } from './features/transactions/MonthlyListScreen'
import { BudgetScreen } from './features/budgets/BudgetScreen'
import { MonthlySummaryScreen } from './features/summary/MonthlySummaryScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { CategoryManagementScreen } from './features/categories/CategoryManagementScreen'
import { BackupScreen } from './features/backup/BackupScreen'
import { CsvScreen } from './features/backup/CsvScreen'
import { ResetScreen } from './features/backup/ResetScreen'

// 통계 화면은 Recharts를 포함해 번들이 커서, 실제로 방문할 때만 불러오도록 지연 로드한다.
const StatsScreen = lazy(() =>
  import('./features/stats/StatsScreen').then((m) => ({ default: m.StatsScreen })),
)

function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomeScreen />} />
            <Route path="transactions/new" element={<TransactionFormScreen />} />
            <Route path="transactions/:id/edit" element={<TransactionFormScreen />} />
            <Route path="transactions" element={<MonthlyListScreen />} />
            <Route path="budgets" element={<BudgetScreen />} />
            <Route path="summary" element={<MonthlySummaryScreen />} />
            <Route path="closing" element={<MonthlySummaryScreen />} />
            <Route
              path="stats"
              element={
                <Suspense fallback={<div className="route-loading">불러오는 중…</div>}>
                  <StatsScreen />
                </Suspense>
              }
            />
            <Route path="settings" element={<SettingsScreen />} />
            <Route path="settings/categories" element={<CategoryManagementScreen />} />
            <Route path="settings/backup" element={<BackupScreen />} />
            <Route path="settings/csv" element={<CsvScreen />} />
            <Route path="settings/reset" element={<ResetScreen />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  )
}

export default App
