import './IndicatorCardSkeleton.css'

export function IndicatorCardSkeleton() {
  return (
    <div className="indicator-card-skeleton" aria-hidden="true">
      <div className="indicator-card-skeleton__line indicator-card-skeleton__line--name" />
      <div className="indicator-card-skeleton__line indicator-card-skeleton__line--value" />
      <div className="indicator-card-skeleton__line indicator-card-skeleton__line--change" />
    </div>
  )
}
