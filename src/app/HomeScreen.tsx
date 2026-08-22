import { Link } from 'react-router-dom'
import './HomeScreen.css'

export function HomeScreen() {
  return (
    <div className="home-screen">
      <div className="home-screen__brand">가계부</div>
      <div className="home-screen__actions">
        <Link to="/transactions/new" className="home-screen__button home-screen__button--expense">
          <span className="home-screen__button-icon">＋</span>
          <span>수입·지출 입력</span>
        </Link>
        <Link to="/stats" className="home-screen__button home-screen__button--stats">
          <span className="home-screen__button-icon">📊</span>
          <span>통계 보기</span>
        </Link>
      </div>
    </div>
  )
}
