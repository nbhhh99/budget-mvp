import { useNavigate } from 'react-router-dom'
import './ScreenHeader.css'

export function ScreenHeader({ title }: { title: string }) {
  const navigate = useNavigate()
  return (
    <header className="screen-header">
      <button className="screen-header__back" onClick={() => navigate(-1)} aria-label="뒤로 가기">
        ←
      </button>
      <h1 className="screen-header__title">{title}</h1>
      <span className="screen-header__spacer" />
    </header>
  )
}
