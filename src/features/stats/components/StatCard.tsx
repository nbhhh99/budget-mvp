import type { ReactNode } from 'react'
import './StatCard.css'

export function StatCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="stat-card">
      <h2 className="stat-card__title">{title}</h2>
      {children}
    </section>
  )
}

export function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card__line">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
    </div>
  )
}

export function StatEmpty({ message }: { message: string }) {
  return <p className="stat-card__empty">{message}</p>
}
