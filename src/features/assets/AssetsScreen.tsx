import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { InlineAmountField } from '../../components/InlineAmountField'
import { assetValuationsRepo, categoriesRepo, transactionsRepo } from '../../db'
import type { AssetValuation, Category, Transaction } from '../../types/models'
import { computeAssetOverview } from '../../domain'
import { formatWon } from '../../utils/date'
import { formatPercent, formatSignedWon } from '../../utils/format'
import './AssetsScreen.css'

export function AssetsScreen() {
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [valuations, setValuations] = useState<AssetValuation[]>([])
  const [loaded, setLoaded] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [allCategories, allTransactions, allValuations] = await Promise.all([
        categoriesRepo.getAllCategories(),
        transactionsRepo.getAllTransactions(),
        assetValuationsRepo.getAllAssetValuations(),
      ])
      if (cancelled) return
      setCategories(allCategories)
      setTransactions(allTransactions)
      setValuations(allValuations)
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const overview = computeAssetOverview(categories, transactions, valuations)

  async function handleValuationCommit(categoryId: string, amount: number) {
    await assetValuationsRepo.setCurrentValue(categoryId, amount)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="assets-screen">
      <ScreenHeader title="자산 관리" />

      <div className="assets-screen__body">
        <section className="assets-screen__total-card">
          <div className="assets-screen__total-row">
            <span className="assets-screen__label">원금 누적</span>
            <span>{formatWon(overview.totalPrincipal)}</span>
          </div>
          <div className="assets-screen__total-row">
            <span className="assets-screen__label">평가금액</span>
            <strong>{formatWon(overview.totalCurrentValue)}</strong>
          </div>
          <div className="assets-screen__total-row">
            <span className="assets-screen__label">평가손익</span>
            <span className={gainClass(overview.totalGain)}>
              {formatSignedWon(overview.totalGain)} ({formatPercent(overview.totalGainRate)})
            </span>
          </div>
        </section>

        {loaded && overview.categories.length === 0 && (
          <p className="assets-screen__empty">
            아직 저축·투자 내역이 없어요. 거래 입력에서 "저축·투자" 유형으로 기록해 보세요.
          </p>
        )}

        <ul className="assets-screen__list">
          {overview.categories.map((c) => (
            <li key={c.categoryId} className="assets-screen__row">
              <div className="assets-screen__row-header">
                <span className="assets-screen__dot" style={{ backgroundColor: c.color }} />
                <span className="assets-screen__name">
                  {c.name}
                  {c.hidden && <span className="assets-screen__hidden-tag">숨김</span>}
                </span>
                <span className={`assets-screen__gain ${gainClass(c.gain)}`}>
                  {formatSignedWon(c.gain)} ({formatPercent(c.gainRate)})
                </span>
              </div>
              <div className="assets-screen__row-fields">
                <div className="assets-screen__field">
                  <span className="assets-screen__label">원금</span>
                  <span>{formatWon(c.principal)}</span>
                </div>
                <div className="assets-screen__field">
                  <span className="assets-screen__label">평가금액</span>
                  <InlineAmountField
                    key={`${c.categoryId}-${refreshKey}`}
                    value={c.currentValue}
                    onCommit={(amount) => handleValuationCommit(c.categoryId, amount)}
                    placeholder="직접 입력"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link className="assets-screen__manage-link" to="/settings/categories?group=saving">
          저축·투자 분류 관리 ›
        </Link>
      </div>
    </div>
  )
}

function gainClass(gain: number): string {
  if (gain > 0) return 'assets-screen__gain--positive'
  if (gain < 0) return 'assets-screen__gain--negative'
  return ''
}
