export function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path
        d="M4 11.5 12 4l8 7.5M6 9.5V19a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 4 0v5h3a1 1 0 0 0 1-1V9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// 상승 화살표·막대그래프 같은 "투자 앱" 이미지 대신, 여러 경제 흐름을 한 화면에
// 모아본다는 뜻의 중립적인 2x2 그리드(대시보드) 아이콘을 쓴다(§9 요구사항).
export function IndicatorsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path
        d="M12 6.5c-1.4-1-3.4-1.5-5.5-1.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 1 6.5 16c2.1 0 4.1.5 5.5 1.5m0-11c1.4-1 3.4-1.5 5.5-1.5A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 0-1.5-1.5c-2.1 0-4.1.5-5.5 1.5m0-11v11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.5v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6-1.4 1.4M6.9 17.1l-1.4 1.4m0-13 1.4 1.4M17.1 17.1l1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}
