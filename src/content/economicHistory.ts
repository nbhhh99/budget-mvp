import type { CurriculumModule, LearningContent } from '../types/models'

export const ECONOMIC_HISTORY_VERSION = 'economic-history-v1'

// 16개 과정. id/order/title/description은 요청 원문 그대로 유지한다(순서를 바꿔도
// 진행 기록은 id 기준이라 깨지지 않는다 — domain/curriculum.ts 참고).
export const ECONOMIC_HISTORY_MODULES: CurriculumModule[] = [
  {
    id: 'history-origin-of-money',
    order: 1,
    title: '돈은 왜 생겼을까',
    description: '물물교환의 한계와 화폐가 신뢰를 얻게 된 과정을 알아봐요.',
    estimatedMinutes: 6,
    periodLabel: '선사~고대',
    itemIds: ['history-origin-of-money-body', 'history-origin-of-money-quiz'],
    conceptIds: ['money', 'medium-of-exchange', 'store-of-value', 'price', 'inflation-and-purchasing-power'],
    sourceIds: ['bok-economic-history'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-banks-interest',
    order: 2,
    title: '은행과 이자의 탄생',
    description: '돈을 맡기고 빌려주는 구조와 신용이 발전한 과정을 알아봐요.',
    estimatedMinutes: 6,
    periodLabel: '중세~근대',
    itemIds: ['history-banks-interest-body', 'history-banks-interest-quiz'],
    conceptIds: ['bank', 'deposit', 'loan', 'interest', 'credit'],
    sourceIds: ['bok-economic-history', 'fss-financial-history'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-joint-stock-market',
    order: 3,
    title: '주식회사와 주식시장의 등장',
    description: '큰 사업의 위험과 자본을 나누기 위해 주식회사가 발전한 과정을 알아봐요.',
    periodLabel: '근대',
    itemIds: [],
    conceptIds: ['stock', 'equity', 'dividend', 'stock-market', 'risk'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-industrial-revolution',
    order: 4,
    title: '산업혁명과 자본주의의 확대',
    description: '기계화와 대량생산이 노동과 생활을 바꾼 과정을 알아봐요.',
    periodLabel: '18~19세기',
    itemIds: [],
    conceptIds: ['capital', 'labor', 'productivity', 'wage', 'economic-growth-rate'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-gold-standard-central-bank',
    order: 5,
    title: '금본위제와 중앙은행',
    description: '화폐와 금의 관계, 금융안정을 위해 중앙은행이 발전한 배경을 알아봐요.',
    estimatedMinutes: 7,
    periodLabel: '19~20세기 초',
    itemIds: ['history-gold-standard-central-bank-body', 'history-gold-standard-central-bank-quiz'],
    conceptIds: ['gold-standard', 'central-bank', 'money-supply', 'reserve', 'financial-stability'],
    sourceIds: ['bok-economic-history'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-great-depression',
    order: 6,
    title: '대공황과 정부 역할의 변화',
    description: '금융 불안과 대량실업이 정부의 경제 역할을 바꾼 과정을 알아봐요.',
    estimatedMinutes: 7,
    periodLabel: '1929~1930년대',
    itemIds: ['history-great-depression-body', 'history-great-depression-quiz'],
    conceptIds: ['great-depression', 'recession', 'unemployment', 'fiscal-policy', 'aggregate-demand'],
    sourceIds: ['bok-economic-history'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-bretton-woods',
    order: 7,
    title: '브레턴우즈와 달러 중심 질서',
    description: '전후 국제통화질서와 달러 중심 금융체제가 만들어진 과정을 알아봐요.',
    periodLabel: '1944~1970년대',
    itemIds: [],
    conceptIds: ['dollar', 'fixed-exchange-rate', 'imf', 'reserve-currency', 'international-finance'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-oil-shock',
    order: 8,
    title: '오일쇼크와 스태그플레이션',
    description: '에너지 가격 급등이 물가와 경기에 동시에 영향을 준 과정을 알아봐요.',
    periodLabel: '1970년대',
    itemIds: [],
    conceptIds: ['oil-shock', 'inflation', 'stagflation', 'base-rate', 'commodity'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-korea-growth',
    order: 9,
    title: '한국의 고도성장과 금융 발전',
    description: '수출 중심 산업화와 저축, 도시화가 한국 경제를 바꾼 과정을 알아봐요.',
    periodLabel: '1960~1980년대',
    itemIds: [],
    conceptIds: ['export', 'economic-growth-rate', 'industrialization', 'savings-rate', 'real-estate'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-asian-financial-crisis',
    order: 10,
    title: '1997년 아시아 외환위기',
    description: '외화유동성 부족과 환율 급등이 한국 경제에 미친 영향을 알아봐요.',
    periodLabel: '1997~1998년',
    itemIds: [],
    conceptIds: ['currency-crisis', 'exchange-rate-and-foreign-assets', 'foreign-debt', 'foreign-reserves', 'imf'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-dotcom-bubble',
    order: 11,
    title: '닷컴버블과 자산가격 거품',
    description: '새로운 기술에 대한 기대가 투자 과열과 거품 붕괴로 이어진 과정을 알아봐요.',
    periodLabel: '1990년대 말~2000년대 초',
    itemIds: [],
    conceptIds: ['asset-bubble', 'corporate-value', 'expected-return', 'volatility', 'speculation'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-global-financial-crisis',
    order: 12,
    title: '2008년 세계금융위기',
    description: '주택대출의 부실이 세계 금융시장으로 확산된 과정을 알아봐요.',
    estimatedMinutes: 8,
    periodLabel: '2007~2009년',
    itemIds: ['history-global-financial-crisis-body', 'history-global-financial-crisis-quiz'],
    conceptIds: ['mortgage', 'securitization', 'credit-risk', 'financial-crisis', 'quantitative-easing'],
    sourceIds: ['bok-economic-history', 'fss-financial-history'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-european-debt-crisis',
    order: 13,
    title: '유럽 재정위기와 국가부채',
    description: '국가부채와 국채금리가 경제에 미치는 영향을 알아봐요.',
    periodLabel: '2010년대 초',
    itemIds: [],
    conceptIds: ['government-bond', 'national-debt', 'fiscal-deficit', 'austerity', 'credit-rating'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-covid-economy',
    order: 14,
    title: '코로나19와 세계경제',
    description: '생산과 소비의 충격, 정책 대응과 이후 물가상승의 흐름을 알아봐요.',
    periodLabel: '2020년~',
    itemIds: [],
    conceptIds: ['supply-chain', 'liquidity', 'fiscal-policy', 'inflation', 'base-rate'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-digital-finance',
    order: 15,
    title: '디지털 금융과 가상자산',
    description: '모바일 금융과 블록체인, 가상자산이 등장한 배경과 위험을 알아봐요.',
    periodLabel: '2000년대~',
    itemIds: [],
    conceptIds: ['electronic-payment', 'fintech', 'blockchain', 'digital-asset', 'volatility'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-reading-economy',
    order: 16,
    title: '지금의 경제를 읽는 법',
    description: '금리, 물가, 환율과 경기지표를 연결해 현재 경제를 읽는 방법을 알아봐요.',
    estimatedMinutes: 7,
    periodLabel: '지금',
    itemIds: ['history-reading-economy-body', 'history-reading-economy-quiz'],
    conceptIds: [
      'base-rate',
      'consumer-price-index',
      'exchange-rate-and-foreign-assets',
      'economic-growth-rate',
      'unemployment',
    ],
    sourceIds: ['bok-edu', 'kostat-info'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
]

export const ECONOMIC_HISTORY_CONTENTS: LearningContent[] = [
  { id: 'history-origin-of-money-body', curriculumId: 'history-origin-of-money', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-24' },
  { id: 'history-origin-of-money-quiz', curriculumId: 'history-origin-of-money', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-24',
    quiz: {
      question: '물물교환보다 화폐를 쓰는 거래가 더 편리해진 가장 중요한 이유는 무엇일까요?',
      choices: [
        '화폐가 있으면 상대방이 마침 내가 가진 물건을 원하지 않아도 거래할 수 있기 때문이에요',
        '화폐는 항상 금으로 만들어졌기 때문이에요',
        '화폐를 쓰면 물건값이 절대 오르지 않기 때문이에요',
      ],
      correctIndex: 0,
      explanation: '물물교환은 서로 원하는 게 딱 맞아떨어져야 거래가 성립하는데(욕구의 이중 일치 문제), 화폐는 그 중간 매개 역할을 해서 이 문제를 해결해줘요.',
    },
  },

  { id: 'history-banks-interest-body', curriculumId: 'history-banks-interest', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-24' },
  { id: 'history-banks-interest-quiz', curriculumId: 'history-banks-interest', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-24',
    quiz: {
      question: '초기 은행이 예금 전액이 아니라 일부만 남기고 나머지를 빌려줄 수 있었던 이유로 가장 알맞은 것은?',
      choices: [
        '모든 예치자가 동시에 돈을 찾으러 오지는 않는다는 걸 알았기 때문이에요',
        '법으로 반드시 그렇게 하도록 정해져 있었기 때문이에요',
        '예금에는 원래 이자가 붙지 않았기 때문이에요',
      ],
      correctIndex: 0,
      explanation: '이런 방식(부분지급준비)은 평소엔 문제없이 돌아가지만, 많은 사람이 한꺼번에 예금을 찾으려 하면 문제가 될 수 있어 이후 예금자보호 같은 제도가 함께 발전했어요.',
    },
  },

  { id: 'history-gold-standard-central-bank-body', curriculumId: 'history-gold-standard-central-bank', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-24' },
  { id: 'history-gold-standard-central-bank-quiz', curriculumId: 'history-gold-standard-central-bank', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-24',
    quiz: {
      question: '금본위제에서는 중앙은행이 화폐를 마음대로 늘리기 어려웠던 이유는 무엇일까요?',
      choices: [
        '화폐를 늘리려면 그만큼 금을 추가로 보유하고 있어야 했기 때문이에요',
        '금본위제 시기에는 화폐를 아예 발행할 수 없었기 때문이에요',
        '금값이 항상 일정하게 유지되도록 법으로 정해져 있었기 때문이에요',
      ],
      correctIndex: 0,
      explanation: '금본위제 아래서는 화폐 발행량이 보유한 금의 양에 묶여 있어, 경기 대응을 위해 통화량을 자유롭게 늘리기 어려웠다는 제약이 있었어요.',
    },
  },

  { id: 'history-great-depression-body', curriculumId: 'history-great-depression', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-24' },
  { id: 'history-great-depression-quiz', curriculumId: 'history-great-depression', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-24',
    quiz: {
      question: '은행이 잇따라 문을 닫으면 기업과 가계가 돈을 빌리기 어려워지는 이유는 무엇일까요?',
      choices: [
        '돈을 맡아 대출을 중개하던 은행이 사라지면서, 자금이 흘러가는 통로 자체가 줄어들기 때문이에요',
        '정부가 그 시기에 모든 대출을 법으로 금지했기 때문이에요',
        '기업과 가계가 더 이상 돈이 필요하지 않았기 때문이에요',
      ],
      correctIndex: 0,
      explanation: '은행은 예금을 모아 필요한 곳에 빌려주는 자금 중개 역할을 해요. 은행이 문을 닫으면 이 중개 기능이 사라져 신용경색(돈이 잘 돌지 않는 상황)이 심해질 수 있어요.',
    },
  },

  { id: 'history-global-financial-crisis-body', curriculumId: 'history-global-financial-crisis', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-24' },
  { id: 'history-global-financial-crisis-quiz', curriculumId: 'history-global-financial-crisis', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-24',
    quiz: {
      question: '위험이 큰 주택담보대출을 묶어 만든 증권의 부실이 전 세계로 빠르게 번질 수 있었던 이유로 가장 알맞은 것은?',
      choices: [
        '그 증권이 세계 여러 나라의 금융회사와 투자자에게 널리 팔려 있었기 때문이에요',
        '미국이 세계에서 집값이 가장 비싼 나라였기 때문이에요',
        '그 시기에는 국가 간 금융 거래가 전면 금지되어 있었기 때문이에요',
      ],
      correctIndex: 0,
      explanation: '증권화된 대출 상품은 위험을 여러 투자자에게 나눠 파는 구조인데, 반대로 문제가 생기면 그 부실도 여러 투자자·나라로 함께 퍼질 수 있다는 점이 이 위기에서 드러났어요.',
    },
  },

  { id: 'history-reading-economy-body', curriculumId: 'history-reading-economy', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-24' },
  { id: 'history-reading-economy-quiz', curriculumId: 'history-reading-economy', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-24',
    quiz: {
      question: '기준금리가 오르면 일반적으로 나타나는 경향으로 가장 알맞은 것은?',
      choices: [
        '대출 이자 부담이 커지고, 예금 이자는 늘어나는 경향이 있어요',
        '모든 물가가 그 즉시 함께 내려가요',
        '실업률이 그 즉시 0%가 돼요',
      ],
      correctIndex: 0,
      explanation: '기준금리는 대출·예금 금리에 직접 영향을 주는 대표적인 지표예요. 다만 물가·환율·고용에 미치는 영향은 시차를 두고 나타나며, 다른 요인들과 함께 작용해요.',
    },
  },
]

export interface HistoryModuleBody {
  whatHappened: string[]
  whyItHappened: string[]
  dailyLifeImpact: string
  todayConnection: string
  keyScene: string
  takeaway: string
  relatedConceptIds: string[]
}

// §9의 8단 구성 중 ①②③④를 whatHappened/whyItHappened/dailyLifeImpact/todayConnection에,
// ⑤는 모듈의 conceptIds로(본문에 정의를 복제하지 않음), ⑥⑧은 keyScene/takeaway에 담는다.
// ⑦확인 문제는 위 ECONOMIC_HISTORY_CONTENTS의 quiz 항목이 담당한다.
export const HISTORY_BODIES: Record<string, HistoryModuleBody> = {
  'history-origin-of-money': {
    whatHappened: [
      '사람들은 처음엔 필요한 물건을 직접 맞바꾸는 물물교환으로 거래했어요. 하지만 "내가 원하는 걸 가진 사람이 마침 내가 가진 걸 원해야" 거래가 성립하는 한계(욕구의 이중 일치 문제)가 있었어요.',
      '여러 문명에서 조개껍데기, 가축, 곡물, 금속처럼 "많은 사람이 가치를 인정하는 물건"이 교환 매개로 쓰이기 시작했어요.',
      '금속화폐(동전)가 등장하면서 무게와 순도를 표준화해 신뢰를 확보하려는 시도가 이어졌고, 이후 국가가 화폐 발행을 관리하는 형태로 발전했어요.',
      '종이돈(지폐)은 처음엔 금·은 같은 실물 자산을 맡겼다는 증표로 출발했다가, 점차 그 자체로 신뢰받는 화폐로 자리잡았어요.',
    ],
    whyItHappened: [
      '경제적 배경 — 물물교환의 비효율(욕구의 이중 일치 문제)을 해결할 필요가 있었어요.',
      '사회적 배경 — 공동체 규모가 커지고 거래 상대가 낯선 사람으로 확장되면서, 서로를 몰라도 믿고 거래할 수 있는 공통 매개가 필요해졌어요.',
      '기술적 배경 — 금속 세공, 인쇄술 등 화폐를 표준화된 형태로 만들 수 있는 기술이 발전했어요.',
      '하나의 지역에서 화폐가 발명됐다기보다, 여러 문명에서 비슷한 필요에 따라 독립적으로 비슷한 해법이 나타났다는 해석이 있어요.',
    ],
    dailyLifeImpact:
      '화폐가 등장하면서 사람들은 자신이 만든 것을 직접 필요한 물건과 맞바꾸지 않고, 화폐로 판 뒤 원하는 걸 살 수 있게 되어 분업(각자 잘하는 일에 집중)이 훨씬 쉬워졌다는 해석이 있어요. 화폐를 매개로 한 시장 거래가 확대되면서, 상인처럼 교환 자체를 직업으로 삼는 사람들도 늘어났어요.',
    todayConnection:
      '지금 우리가 쓰는 현금, 계좌 속 숫자, 카드 결제도 결국 "여러 사람이 그 가치를 믿고 받아준다"는 화폐의 기본 원리 위에 서 있어요. 화폐가 가치를 잘 저장하고 있는지(물가), 교환 수단으로 잘 기능하는지는 지금도 중앙은행과 정부가 계속 관리하는 과제예요.',
    keyScene: '물물교환 → 조개·가축 등 물품화폐 → 금속화폐(동전) → 금 보관증에서 출발한 지폐 → 오늘날의 전자화된 화폐',
    takeaway: '화폐는 사람들이 서로 믿고 주고받을 수 있다는 신뢰 위에서 작동하는, 거래를 쉽게 만들어주는 도구예요.',
    relatedConceptIds: ['money', 'medium-of-exchange', 'store-of-value', 'price', 'inflation-and-purchasing-power'],
  },

  'history-banks-interest': {
    whatHappened: [
      '초기 은행의 뿌리는 귀금속(금·은)을 안전하게 보관해주던 금세공업자·환전상으로 거슬러 올라간다고 설명돼요. 이들은 보관증을 발행했고, 이 보관증이 실제 금 대신 거래되기 시작했어요.',
      '보관업자들은 모든 예치자가 동시에 금을 찾으러 오지는 않는다는 걸 알아채고, 맡아둔 금의 일부를 다른 사람에게 빌려주고 이자를 받기 시작했어요 — 오늘날 은행업(부분지급준비)의 원형으로 설명돼요.',
      '중세~근대 유럽에서는 이탈리아 도시국가(피렌체, 베네치아 등)의 상인 가문들이 환전·대출·송금을 겸하는 초기 은행업을 발전시켰어요.',
      '이자를 받는 행위(대금업)는 종교·사회적으로 오랫동안 논쟁의 대상이었고, 시대와 지역에 따라 금지되거나 제한되기도 했어요.',
    ],
    whyItHappened: [
      '경제적 배경 — 무역이 확대되면서 먼 거리의 상인들 사이에 신용거래·송금 수단이 필요해졌어요.',
      '신뢰의 문제 — 귀금속을 직접 들고 다니는 위험을 피하려는 필요가 있었어요.',
      '해석의 차이 — 은행업의 기원을 "보관업의 자연스러운 확장"으로 보는 해석과, "상업 신용(외상 거래)의 발전"에서 찾는 해석이 함께 존재해요.',
    ],
    dailyLifeImpact:
      '은행이 생기면서 상인과 개인이 목돈을 안전하게 맡기고, 필요할 때 빌릴 수 있는 길이 열렸어요. 대출을 통해 사업 자금을 마련할 수 있게 되면서 새로운 사업을 시작하는 문턱이 낮아졌다는 해석이 있어요. 다만 갚지 못하면 빚에 시달리는 위험도 함께 커졌어요.',
    todayConnection:
      '지금의 예금·대출·이자 구조는 이 시기에 만들어진 기본 틀을 여전히 이어받고 있어요. 은행이 예금의 일부만 남기고 나머지를 대출해주는 구조는 오늘날에도 유지되며, 이 때문에 예금자보호제도 같은 안전장치가 함께 발전했어요.',
    keyScene: '예치자(금을 맡김) ↔ 보관업자·은행(보관증 발행, 일부를 대출) ↔ 차입자(돈을 빌려 사업·소비에 사용)',
    takeaway: '은행은 맡은 돈의 일부를 빌려주고 이자를 받는 구조로 발전했고, 이 구조 덕분에 돈이 필요한 곳으로 흘러갈 수 있게 됐어요.',
    relatedConceptIds: ['bank', 'deposit', 'loan', 'interest', 'credit'],
  },

  'history-gold-standard-central-bank': {
    whatHappened: [
      '19세기부터 여러 나라가 자국 화폐 가치를 정해진 양의 금과 연동하는 금본위제를 채택했어요. 영국이 비교적 이른 시기에 이 제도를 정착시켰고, 이후 여러 나라가 뒤따랐다고 설명돼요.',
      '각국은 화폐 발행과 금융 시스템을 관리할 기관으로 중앙은행을 세우기 시작했어요. 스웨덴 릭스방크, 영국 영란은행이 이른 시기의 사례로 꼽히고, 한국은행은 1950년에 설립됐어요.',
      '금본위제 아래서는 화폐를 찍어내려면 그만큼 금을 보유해야 했기 때문에 통화량 조절에 자연스러운 제약이 있었어요.',
      '20세기 들어 여러 나라가 전쟁 비용 조달, 대공황 대응 등을 거치며 금본위제에서 점차 벗어났어요(이후 브레턴우즈 체제, 1971년 금-달러 태환 정지로 이어져요).',
    ],
    whyItHappened: [
      '경제적 배경 — 국제 무역이 늘면서 서로 다른 화폐 가치를 비교·신뢰할 수 있는 공통 기준이 필요해졌어요.',
      '제도적 배경 — 화폐 발행을 국가가 관리하고, 은행 시스템의 안정을 책임질 기관이 필요하다는 인식이 커졌어요.',
      '해석의 차이 — 금본위제가 화폐 가치를 안정시켰다는 평가가 있는 한편, 경기 대응 수단을 지나치게 제약했다는 비판적 해석도 함께 존재해요.',
    ],
    dailyLifeImpact:
      '금본위제 시기에는 물가가 상대적으로 안정적이었다는 평가가 있지만, 금 보유량에 묶여 있어 경기 침체에 유연하게 대응하기 어려웠다는 지적도 있어요. 중앙은행이 자리 잡으면서 은행 위기 때 자금을 공급하는 최종 대부자 역할이 점차 자리 잡아, 은행 줄도산 같은 충격을 줄이는 데 기여했다는 평가가 있어요.',
    todayConnection:
      '지금은 대부분 나라가 금과 연동되지 않은 화폐(불태환 화폐)를 쓰고, 중앙은행이 기준금리 등으로 통화량과 물가를 관리해요. 한국은행을 비롯한 각국 중앙은행이 발표하는 기준금리 결정은 이 시기에 자리 잡은 "중앙은행이 통화를 관리한다"는 틀 위에서 이뤄져요.',
    keyScene: '금본위제(화폐=금과 연동, 통화량 제약 큼) → 관리통화제(중앙은행이 재량으로 통화량·금리 조절)',
    takeaway: '화폐를 금에 묶어두던 시대에서, 중앙은행이 재량으로 통화를 관리하는 시대로 바뀌어 왔어요.',
    relatedConceptIds: ['gold-standard', 'central-bank', 'money-supply', 'reserve', 'financial-stability'],
  },

  'history-great-depression': {
    whatHappened: [
      '1929년 10월 미국 뉴욕 증권시장에서 주가가 급락했어요(흔히 "검은 목요일"로 불리는 사건이 포함돼요).',
      '주가 급락 이후 은행들이 잇따라 문을 닫았고(은행 줄도산), 예금을 잃은 사람들과 신용 경색으로 기업 활동이 크게 위축됐어요.',
      '1930년대 내내 미국을 비롯한 여러 나라에서 대량 실업과 생산 위축이 이어졌어요. 미국의 실업률은 한때 20%를 넘어섰다고 알려져 있어요.',
      '미국 정부는 뉴딜(New Deal) 정책을 통해 공공사업, 금융 규제, 사회보장제도 도입 등 정부가 경제에 적극 개입하는 방향으로 정책을 전환했어요.',
    ],
    whyItHappened: [
      '금융적 배경 — 과도한 주식 투기와 신용을 이용한 매수(레버리지)가 자산가격 거품을 키웠다는 해석이 있어요.',
      '정책적 배경 — 은행 위기 초기에 중앙은행과 정부의 대응이 충분히 빠르지 않았다는 해석이 있어요(이 부분은 경제학자들 사이에서도 해석이 갈려요).',
      '국제적 배경 — 여러 나라가 보호무역(관세 인상)으로 대응하면서 세계 무역이 위축되어 위기가 더 깊어졌다는 해석도 있어요.',
      '하나의 원인으로 단정하기보다, 금융 과열·정책 대응·국제 무역 위축이 겹쳤다는 해석이 일반적이에요.',
    ],
    dailyLifeImpact:
      '대량 실업으로 많은 가정이 소득을 잃었고, 소비와 저축 여력이 크게 줄었어요. 예금을 잃은 경험은 사람들의 은행에 대한 신뢰를 크게 흔들었고, 이 시기를 거치며 실업보험·노후 연금 같은 사회안전망 제도가 여러 나라에서 도입되거나 확대됐어요.',
    todayConnection:
      '대공황 이후 만들어진 예금자보호제도, 금융 규제, 중앙은행의 최종 대부자 역할은 지금도 금융 시스템의 기본 틀로 이어지고 있어요. 경기가 나빠지면 정부가 재정정책(지출 확대)으로 대응하는 방식도 이 시기의 경험에서 비롯된 접근으로 설명돼요.',
    keyScene: '주가 급락 → 은행 줄도산·신용 경색 → 기업 도산·대량 실업 → 소비·투자 위축(총수요 감소) → 정부의 적극적 개입(뉴딜)',
    takeaway: '금융시장의 충격은 은행과 신용을 통해 실제 생활(고용·소비)로 번질 수 있고, 이 경험은 정부의 경제 개입 방식을 바꿔놓았어요.',
    relatedConceptIds: ['great-depression', 'recession', 'unemployment', 'fiscal-policy', 'aggregate-demand'],
  },

  'history-global-financial-crisis': {
    whatHappened: [
      '2000년대 미국에서는 신용도가 낮은 차입자에게도 주택담보대출(서브프라임 모기지)을 적극적으로 내주는 관행이 확산됐어요.',
      '이런 대출들은 여러 개로 묶여 증권화된 뒤 전 세계 투자자에게 팔려나갔어요.',
      '2007년경 미국 주택 가격 상승세가 꺾이면서 대출 연체가 늘기 시작했고, 2008년 9월 대형 투자은행 리먼브라더스가 파산하면서 위기가 전 세계 금융시장으로 빠르게 번졌어요.',
      '각국 정부와 중앙은행은 금융회사에 대한 긴급 자금 지원, 기준금리 인하, 양적완화 등으로 대응했어요.',
    ],
    whyItHappened: [
      '금융적 배경 — 위험이 큰 대출이 증권화 과정을 거치며 위험이 잘 드러나지 않는 상품으로 팔린 점이 지목돼요.',
      '규제적 배경 — 금융 상품과 기관에 대한 감독·규제가 변화의 속도를 따라가지 못했다는 해석이 있어요.',
      '심리적 배경 — "집값은 계속 오른다"는 낙관이 널리 퍼지면서 위험을 과소평가하는 분위기가 있었다는 해석도 있어요.',
      '이 역시 단일 원인이 아니라 여러 요인이 겹친 결과로 설명돼요.',
    ],
    dailyLifeImpact:
      '미국에서는 집값 하락으로 대출금이 집값보다 커지는 가구가 늘었고, 압류(주택 강제 처분)가 급증했어요. 세계 여러 나라에서 기업 투자와 고용이 위축되며 실업률이 올랐고, 위기 이후 예금·투자에 대한 사람들의 위험 인식이 높아졌다는 평가가 있어요.',
    todayConnection:
      '이 위기 이후 은행의 자기자본 규제가 강화되고(바젤III 등), 금융 시스템 전반의 위험을 감시하는 체계가 여러 나라에서 정비됐어요. 중앙은행의 양적완화 정책은 이후 다른 위기 대응에서도 다시 활용되는 정책 수단으로 자리 잡았어요.',
    keyScene:
      '위험이 큰 주택담보대출 확산 → 대출을 묶은 증권 확산 → 집값 하락·연체 증가 → 대형 금융회사 부실·파산 → 신용경색이 전 세계로 확산 → 각국 정부·중앙은행의 긴급 대응(금리 인하, 양적완화)',
    takeaway: '금융위기는 한 기관의 문제가 신용과 연결망을 통해 확산될 때 더 커질 수 있어요.',
    relatedConceptIds: ['mortgage', 'securitization', 'credit-risk', 'financial-crisis', 'quantitative-easing'],
  },

  'history-reading-economy': {
    whatHappened: [
      '이 과정은 특정 사건이 아니라, 앞선 15개 과정에서 살펴본 지표들을 지금 어떻게 함께 읽을지 정리해요.',
      '기준금리, 물가, 환율, 실업률, 경제성장률 같은 지표들은 따로따로 움직이지 않고 서로 영향을 주고받아요.',
      '예를 들어 물가가 많이 오르면 중앙은행이 기준금리를 올리는 경우가 많고, 기준금리가 오르면 대출 이자 부담이 커지고 소비가 줄어드는 경향이 있다고 설명돼요.',
    ],
    whyItHappened: [
      '지표 하나만 보면 전체 흐름을 오해하기 쉬워요. 예를 들어 기준금리만 보고 "돈을 빌리기 좋은 시기"라고 단정하기보다, 물가와 내 상환 능력을 함께 고려하는 게 안전해요.',
      '지표들은 시차를 두고 서로에게 영향을 준다고 설명돼요(예: 기준금리 인상 효과가 소비·물가에 반영되기까지 시간이 걸려요).',
    ],
    dailyLifeImpact:
      '기준금리가 오르면 대출 이자 부담이 커지고 예금 이자는 늘어나는 경향이 있어, 저축과 대출 계획에 함께 영향을 줘요. 물가가 오르면 같은 소득으로 살 수 있는 양이 줄어, 생활비 계획에도 영향을 줘요.',
    todayConnection:
      '재무 브리핑에서 다루는 기준금리·물가·환율 소식들은 이 과정에서 다룬 지표들이 실제로 매달 발표되는 것이에요. 특정 지표 하나만 보고 투자·대출 결정을 내리기보다, 여러 지표를 함께 보는 습관이 도움이 된다고 설명되며, 이 과정은 특정 자산가격의 방향을 예측하지 않아요.',
    keyScene: '중앙은행(기준금리) ↔ 물가·환율 ↔ 가계의 소비·저축·대출 ↔ 기업의 투자·고용',
    takeaway: '경제 지표는 따로 보지 말고 서로 어떻게 연결되는지 함께 살펴보면, 지금의 경제 흐름을 더 잘 이해할 수 있어요.',
    relatedConceptIds: ['base-rate', 'consumer-price-index', 'exchange-rate-and-foreign-assets', 'economic-growth-rate', 'unemployment'],
  },
}
