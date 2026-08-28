// 경제지표 화면의 "업데이트 주기 안내"에 쓰이는 정적 콘텐츠. 실제 수집
// 스케줄(GitHub Actions cron)이나 API 호출 로직과는 무관한 순수 표시용 데이터라
// 화면 컴포넌트에서 분리해 테스트 가능하게 한다.
//
// S&P 500·NASDAQ Composite·국제 금은 아직 정식 재배포가 가능한 데이터
// 공급원이 연동되지 않은 상태라(각 카드에 "데이터 연동 준비 중"으로 표시됨)
// 이 목록에는 올리지 않는다 — 정기적으로 갱신된다고 오해할 수 있기 때문이다.
export interface IndicatorScheduleGroup {
  title: string
  time: string
  targets: string
  note?: string
}

export const INDICATOR_UPDATE_SCHEDULE: IndicatorScheduleGroup[] = [
  {
    title: '국내 시장',
    time: '평일 오후 4시 30분',
    targets: '환율 · KOSPI · KOSDAQ · KRX 국내 금',
  },
  {
    title: '국내 기름값',
    time: '매일 오전 7시',
    targets: '전국 평균 휘발유 · 전국 평균 경유',
  },
  {
    title: '해외시장·국제유가',
    time: '평일 오전 9시',
    targets: 'WTI · Brent',
  },
  {
    title: '가상자산',
    time: '화면에 들어올 때 확인',
    targets: '비트코인 · 이더리움',
    note: '최근 조회 후 15분 동안은 저장된 시세를 사용해요.',
  },
  {
    title: '주요 거시경제 지표',
    time: '검수된 재무 브리핑이 업데이트될 때 반영',
    targets: '기준금리 등 주요 거시경제 지표',
  },
]

export const INDICATOR_SCHEDULE_TIMEZONE_NOTE = '모든 시각은 한국시간(KST) 기준이에요.'

// "예정 시각"과 "데이터 기준일"을 같은 의미로 쓰지 않도록 구분해서 안내한다.
// "실시간"이라는 표현이나 수동 새로고침이 가능하다는 문구, API 성공을 단정하는
// 표현은 쓰지 않는다.
export const INDICATOR_SCHEDULE_DISCLAIMER =
  '표시된 시간은 자동 수집 예정 시각이에요. GitHub Actions와 각 제공기관의 발표 일정에 따라 반영이 늦어질 수 있으며, 각 카드에는 실제 기준일과 조회 시각이 표시됩니다.'
