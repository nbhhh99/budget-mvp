import { useState } from 'react'
import './IllustrationImage.css'

interface IllustrationImageProps {
  src: string
  fallbackIcon: string
  label: string
  className?: string
}

// public/illustrations/*.png는 아직 없을 수도 있는 장식 이미지라 alt=""로 두고,
// 기능명은 호출부에서 항상 별도 텍스트로 제공한다(§3, §12). 로딩 실패 시에는
// 기능에 맞는 단순 아이콘 + 배경색 블록으로 대체한다.
export function IllustrationImage({ src, fallbackIcon, label, className }: IllustrationImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`illustration-fallback ${className ?? ''}`} role="img" aria-label={label}>
        <span aria-hidden="true">{fallbackIcon}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`illustration-image ${className ?? ''}`}
    />
  )
}
