import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useToast } from '../../components/toast/useToast'
import { resetAllData } from '../../db'
import './ResetScreen.css'

const CONFIRM_PHRASE = '초기화'

export function ResetScreen() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const canReset = input === CONFIRM_PHRASE

  async function handleReset() {
    if (!canReset) return
    setBusy(true)
    try {
      await resetAllData()
      showToast({ message: '모든 데이터가 초기화되었습니다.' })
      navigate('/')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <ScreenHeader title="전체 초기화" />
      <div className="reset-screen__body">
        <p className="reset-screen__warning">
          모든 거래, 분류, 예산, 설정이 영구적으로 삭제되고 기본 상태로 되돌아갑니다. 이 작업은
          되돌릴 수 없습니다. 초기화 전에 백업을 먼저 진행하는 것을 권장합니다.
        </p>
        <label className="reset-screen__field">
          계속하려면 아래에 <strong>{CONFIRM_PHRASE}</strong>를 입력하세요.
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={CONFIRM_PHRASE}
          />
        </label>
        <button
          type="button"
          className="reset-screen__button"
          disabled={!canReset || busy}
          onClick={handleReset}
        >
          전체 초기화
        </button>
      </div>
    </div>
  )
}
