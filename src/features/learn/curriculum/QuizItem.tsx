import { useState } from 'react'
import type { QuizContent } from '../../../types/models'
import './QuizItem.css'

interface QuizItemProps {
  quiz: QuizContent
  completed: boolean
  onComplete: () => void
}

// §6/§9: 정답 여부와 관계없이 해설까지 확인하면 완료로 인정한다. 이미 완료된
// 항목을 다시 열어도 최초 완료 처리를 다시 하지 않고 복습만 가능하게 한다.
export function QuizItem({ quiz, completed, onComplete }: QuizItemProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)

  const hasAnswered = selectedIndex !== null || completed

  function handleSelect(index: number) {
    if (hasAnswered) return
    setSelectedIndex(index)
  }

  function handleAcknowledge() {
    setAcknowledged(true)
    onComplete()
  }

  return (
    <div className="quiz-item">
      <p className="quiz-item__question">{quiz.question}</p>
      <ul className="quiz-item__choices">
        {quiz.choices.map((choice, i) => {
          const isSelected = selectedIndex === i
          const isCorrect = i === quiz.correctIndex
          const reveal = hasAnswered
          return (
            <li key={i}>
              <button
                type="button"
                className={`quiz-item__choice${isSelected ? ' quiz-item__choice--selected' : ''}${
                  reveal && isCorrect ? ' quiz-item__choice--correct' : ''
                }${reveal && isSelected && !isCorrect ? ' quiz-item__choice--incorrect' : ''}`}
                onClick={() => handleSelect(i)}
                disabled={hasAnswered}
                aria-pressed={isSelected}
              >
                {choice}
                {reveal && isCorrect && <span className="quiz-item__mark" aria-hidden="true">✓</span>}
              </button>
            </li>
          )
        })}
      </ul>

      {hasAnswered && (
        <div className="quiz-item__feedback">
          <p className="quiz-item__result">
            {selectedIndex === quiz.correctIndex || completed ? '정답이에요' : '아쉬워요, 정답이 아니에요'}
          </p>
          <p className="quiz-item__explanation">{quiz.explanation}</p>
          {!completed && !acknowledged ? (
            <button type="button" className="quiz-item__ack-button" onClick={handleAcknowledge}>
              확인했어요
            </button>
          ) : (
            <p className="quiz-item__done">✓ 확인했어요</p>
          )}
        </div>
      )}
    </div>
  )
}
