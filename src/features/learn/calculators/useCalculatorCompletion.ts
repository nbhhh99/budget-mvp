import { useEffect, useRef } from 'react'
import { curriculumProgressRepo } from '../../../db'
import type { CalculatorId } from '../../../types/models'

// §6: 계산기는 최소 한 번 유효한 값을 입력(=기본값에서 변경)하고 계산 결과를
// 확인했을 때 완료로 인정한다. 결과는 항상 즉시 계산되어 화면에 보이므로,
// "기본값에서 값이 바뀌었는가"만으로 상호작용 여부를 판단한다. 커리큘럼을 거치지
// 않고 "숫자로 이해하기" 메뉴에서 직접 써도 동일하게 기록된다(§13).
export function useCalculatorCompletion(calculatorId: CalculatorId, interacted: boolean) {
  const fired = useRef(false)

  useEffect(() => {
    if (interacted && !fired.current) {
      fired.current = true
      void curriculumProgressRepo.completeLearningItem(calculatorId, 'calculator')
    }
  }, [interacted, calculatorId])
}
