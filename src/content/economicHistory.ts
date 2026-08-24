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
    estimatedMinutes: 8,
    periodLabel: '근대',
    itemIds: ['history-joint-stock-market-body', 'history-joint-stock-market-quiz'],
    conceptIds: ['stock', 'joint-stock-company', 'limited-liability', 'shareholder', 'stock-market'],
    sourceIds: ['voc-history'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-industrial-revolution',
    order: 4,
    title: '산업혁명과 자본주의의 확대',
    description: '기계화와 대량생산이 노동과 생활을 바꾼 과정을 알아봐요.',
    estimatedMinutes: 7,
    periodLabel: '18~19세기',
    itemIds: ['history-industrial-revolution-body', 'history-industrial-revolution-quiz'],
    conceptIds: ['capital', 'labor', 'wage', 'productivity'],
    sourceIds: ['eh-net-industrial-revolution'],
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
    estimatedMinutes: 7,
    periodLabel: '1944~1970년대',
    itemIds: ['history-bretton-woods-body', 'history-bretton-woods-quiz'],
    conceptIds: ['dollar', 'fixed-exchange-rate', 'imf', 'reserve-currency', 'international-finance'],
    sourceIds: ['fed-history-bretton-woods'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-oil-shock',
    order: 8,
    title: '오일쇼크와 스태그플레이션',
    description: '에너지 가격 급등이 물가와 경기에 동시에 영향을 준 과정을 알아봐요.',
    estimatedMinutes: 7,
    periodLabel: '1970년대',
    itemIds: ['history-oil-shock-body', 'history-oil-shock-quiz'],
    conceptIds: ['oil-shock', 'inflation', 'stagflation', 'commodity'],
    sourceIds: ['history-go-kr-oil-shock'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-korea-growth',
    order: 9,
    title: '한국의 고도성장과 금융 발전',
    description: '수출 중심 산업화와 저축, 도시화가 한국 경제를 바꾼 과정을 알아봐요.',
    estimatedMinutes: 8,
    periodLabel: '1960~1980년대',
    itemIds: ['history-korea-growth-body', 'history-korea-growth-quiz'],
    conceptIds: ['export', 'economic-growth-rate', 'industrialization', 'savings-rate', 'real-estate'],
    sourceIds: ['archives-go-kr-economic-plan'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-asian-financial-crisis',
    order: 10,
    title: '1997년 아시아 외환위기',
    description: '외화유동성 부족과 환율 급등이 한국 경제에 미친 영향을 알아봐요.',
    estimatedMinutes: 8,
    periodLabel: '1997~1998년',
    itemIds: ['history-asian-financial-crisis-body', 'history-asian-financial-crisis-quiz'],
    conceptIds: ['currency-crisis', 'exchange-rate-and-foreign-assets', 'foreign-debt', 'foreign-reserves', 'imf'],
    sourceIds: ['history-go-kr-imf-crisis'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-dotcom-bubble',
    order: 11,
    title: '닷컴버블과 자산가격 거품',
    description: '새로운 기술에 대한 기대가 투자 과열과 거품 붕괴로 이어진 과정을 알아봐요.',
    estimatedMinutes: 7,
    periodLabel: '1990년대 말~2000년대 초',
    itemIds: ['history-dotcom-bubble-body', 'history-dotcom-bubble-quiz'],
    conceptIds: ['asset-bubble', 'corporate-value', 'expected-return', 'volatility', 'speculation'],
    sourceIds: ['fss-edu'],
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
    estimatedMinutes: 8,
    periodLabel: '2010년대 초',
    itemIds: ['history-european-debt-crisis-body', 'history-european-debt-crisis-quiz'],
    conceptIds: ['government-bond', 'national-debt', 'fiscal-deficit', 'austerity', 'credit-rating'],
    sourceIds: ['kdi-eiec-europe-debt'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-covid-economy',
    order: 14,
    title: '코로나19와 세계경제',
    description: '생산과 소비의 충격, 정책 대응과 이후 물가상승의 흐름을 알아봐요.',
    estimatedMinutes: 8,
    periodLabel: '2020년~',
    itemIds: ['history-covid-economy-body', 'history-covid-economy-quiz'],
    conceptIds: ['supply-chain', 'liquidity', 'fiscal-policy', 'inflation', 'base-rate'],
    sourceIds: ['bok-covid-rate-cut', 'bok-monetary-report-2022'],
    curriculumVersion: ECONOMIC_HISTORY_VERSION,
  },
  {
    id: 'history-digital-finance',
    order: 15,
    title: '디지털 금융과 가상자산',
    description: '모바일 금융과 블록체인, 가상자산이 등장한 배경과 위험을 알아봐요.',
    estimatedMinutes: 8,
    periodLabel: '2000년대~',
    itemIds: ['history-digital-finance-body', 'history-digital-finance-quiz'],
    conceptIds: ['electronic-payment', 'fintech', 'blockchain', 'digital-asset', 'volatility'],
    sourceIds: ['fsc-virtual-asset-registration'],
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

  { id: 'history-joint-stock-market-body', curriculumId: 'history-joint-stock-market', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'history-joint-stock-market-quiz', curriculumId: 'history-joint-stock-market', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '초기 주식회사와 주식시장이 등장한 핵심 이유로 가장 알맞은 것은?',
      choices: [
        '정부가 모든 국민에게 반드시 주식을 사도록 의무화했기 때문이에요',
        '여러 사람이 위험과 자본을 나눠 큰 사업에 함께 투자할 수 있는 구조가 필요했기 때문이에요',
        '은행이 사라지면서 그 대안으로 주식시장이 만들어졌기 때문이에요',
      ],
      correctIndex: 1,
      explanation: '향신료 무역처럼 큰 자본과 위험이 따르는 사업을 한 사람이 전부 떠안기 어려워, 여러 투자자가 지분을 나눠 갖고 유한책임을 지는 주식회사 구조가 발전했어요.',
    },
  },

  { id: 'history-industrial-revolution-body', curriculumId: 'history-industrial-revolution', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'history-industrial-revolution-quiz', curriculumId: 'history-industrial-revolution', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '산업혁명 시기에 아동노동을 비롯한 열악한 노동환경에 대응해 나타난 변화로 가장 알맞은 것은?',
      choices: [
        '정부가 모든 공장을 폐쇄하고 수공업으로 되돌아갔어요',
        '노동자들이 자동으로 더 높은 임금을 받게 되는 법이 산업혁명 초기부터 있었어요',
        '공장법 같은 노동 규제와 노동조합이 점차 발전해 노동환경을 개선해갔어요',
      ],
      correctIndex: 2,
      explanation: '영국은 1833년 공장법으로 9세 미만 고용을 금지하고 노동시간을 제한하는 등 실효성 있는 규제를 처음 도입했고, 이 시기를 거치며 노동조합도 함께 발전했어요.',
    },
  },

  { id: 'history-bretton-woods-body', curriculumId: 'history-bretton-woods', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'history-bretton-woods-quiz', curriculumId: 'history-bretton-woods', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '브레턴우즈 체제에서 다른 나라 통화가 달러에 고정되고, 달러는 다시 금에 고정됐던 구조가 1971년에 끝나게 된 계기는 무엇일까요?',
      choices: [
        '미국이 더 이상 달러를 금으로 바꿔주지 않겠다고 선언했기 때문이에요(금태환 정지)',
        '전 세계 모든 나라가 동시에 금본위제로 돌아가기로 합의했기 때문이에요',
        'IMF가 해체되면서 국제 통화 질서 자체가 사라졌기 때문이에요',
      ],
      correctIndex: 0,
      explanation: '1971년 미국이 달러의 금태환을 정지하면서(닉슨 쇼크) 달러-금 고정이 무너졌고, 이후 각국은 점차 변동환율제로 옮겨가며 브레턴우즈 체제가 사실상 막을 내렸어요.',
    },
  },

  { id: 'history-oil-shock-body', curriculumId: 'history-oil-shock', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'history-oil-shock-quiz', curriculumId: 'history-oil-shock', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '오일쇼크 시기에 물가와 경기를 동시에 관리하기가 특히 어려웠던 이유는 무엇일까요?',
      choices: [
        '정부가 모든 경제정책 수단을 사용하지 못하도록 법으로 금지했기 때문이에요',
        '물가를 잡으려고 금리를 올리면 경기가 더 나빠질 수 있고, 경기를 살리려고 금리를 낮추면 물가가 더 오를 수 있었기 때문이에요',
        '이 시기에는 아예 중앙은행이 존재하지 않았기 때문이에요',
      ],
      correctIndex: 1,
      explanation: '물가 상승과 경기 침체가 동시에 나타나는 스태그플레이션 상황에서는, 한쪽 문제를 해결하려는 정책이 다른 쪽 문제를 악화시킬 수 있어 정책 대응이 특히 어려웠어요.',
    },
  },

  { id: 'history-korea-growth-body', curriculumId: 'history-korea-growth', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'history-korea-growth-quiz', curriculumId: 'history-korea-growth', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '한국의 고도성장 배경을 설명할 때 가장 알맞은 관점은 무엇일까요?',
      choices: [
        '특정 한 기업의 노력만으로 이뤄낸 결과예요',
        '오직 정부의 계획만으로, 국민이나 국제 환경과는 무관하게 이뤄진 결과예요',
        '정부 정책, 노동자와 기업의 노력, 국제 환경과 해외 자본이 함께 맞물린 결과로 설명돼요',
      ],
      correctIndex: 2,
      explanation: '고도성장은 경제개발계획 같은 정부 정책뿐 아니라, 노동자들의 노력과 기업의 투자, 해외 차관과 국제 무역 환경 등 여러 요인이 함께 작용한 결과로 다뤄지는 게 일반적이에요.',
    },
  },

  { id: 'history-asian-financial-crisis-body', curriculumId: 'history-asian-financial-crisis', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'history-asian-financial-crisis-quiz', curriculumId: 'history-asian-financial-crisis', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '1997년 한국의 외환위기 원인을 설명할 때 가장 알맞은 것은?',
      choices: [
        '기업과 금융기관의 과도한 단기외채와 외화유동성 부족 등 구조적 문제가 겹쳐 나타났어요',
        '국민 개개인이 사치와 과소비를 했기 때문에 벌어진 일이에요',
        '이 시기 한국에는 수출 기업이 하나도 없었기 때문이에요',
      ],
      correctIndex: 0,
      explanation: '1997년 위기는 개인의 소비 습관이 아니라, 기업의 과잉 차입과 단기외채 구조, 외환·금융감독 체계의 허점 등 구조적인 요인이 겹쳐 나타난 것으로 설명돼요.',
    },
  },

  { id: 'history-dotcom-bubble-body', curriculumId: 'history-dotcom-bubble', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'history-dotcom-bubble-quiz', curriculumId: 'history-dotcom-bubble', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '닷컴버블 사례가 보여주는 교훈으로 가장 알맞은 것은?',
      choices: [
        '인터넷 기술은 처음부터 아무 가치가 없었다는 것을 보여줘요',
        '정부가 미리 개입했다면 주가가 절대 떨어지지 않았을 거예요',
        '기술 자체의 장기적 가치와, 특정 시점에 투자자들이 매긴 가격은 서로 다를 수 있다는 것을 보여줘요',
      ],
      correctIndex: 2,
      explanation: '닷컴버블 붕괴 이후에도 인터넷 기술과 관련 산업은 계속 성장했지만, 거품 시기에 과도하게 높았던 개별 기업의 가격은 정당화되지 못하고 무너졌어요. 이는 기술의 가치와 그 순간의 가격이 다른 문제라는 걸 보여줘요.',
    },
  },

  { id: 'history-european-debt-crisis-body', curriculumId: 'history-european-debt-crisis', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'history-european-debt-crisis-quiz', curriculumId: 'history-european-debt-crisis', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '유로존이 재정위기에 대응하기 어려웠던 구조적 이유로 가장 알맞은 것은?',
      choices: [
        '유로존에는 애초에 중앙은행이 없었기 때문이에요',
        '통화정책은 ECB가 공동으로 결정하지만, 재정정책은 각 나라가 따로 운영하는 구조였기 때문이에요',
        '유로존 국가들은 서로 무역을 전혀 하지 않았기 때문이에요',
      ],
      correctIndex: 1,
      explanation: '유로존은 하나의 통화정책을 공유하지만 재정정책(세금·지출)은 국가별로 운영돼, 재정이 어려운 나라가 스스로 통화가치를 조정해 대응하기 어려운 구조적 한계가 있었어요.',
    },
  },

  { id: 'history-covid-economy-body', curriculumId: 'history-covid-economy', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'history-covid-economy-quiz', curriculumId: 'history-covid-economy', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '코로나19 이후(2021~2022년) 세계적인 물가 상승의 원인을 설명할 때 가장 알맞은 것은?',
      choices: [
        '공급망 차질, 에너지 가격 상승, 수요 회복, 정책 대응 등 여러 요인이 함께 작용한 것으로 설명돼요',
        '오직 중앙은행이 통화를 많이 찍어냈기 때문이라는 단 하나의 이유로만 설명돼요',
        '전 세계 모든 나라의 물가가 코로나19 이전 수준으로 곧바로 돌아갔기 때문이에요',
      ],
      correctIndex: 0,
      explanation: '한국은행은 이 시기 물가 상승의 배경으로 에너지·식료품 가격 상승, 원자재·환율에 따른 수입물가 상승, 소비 회복에 따른 수요측 압력을 함께 짚었어요. 여러 요인이 겹친 결과로 이해하는 게 안전해요.',
    },
  },

  { id: 'history-digital-finance-body', curriculumId: 'history-digital-finance', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'history-digital-finance-quiz', curriculumId: 'history-digital-finance', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '법정화폐, 전자화폐, 가상자산의 차이를 설명할 때 가장 알맞은 것은?',
      choices: [
        '셋 다 정부가 발행하고 가치를 보장한다는 점에서 동일해요',
        '법정화폐와 전자화폐는 정부·법정화폐 가치에 기반하지만, 가상자산은 정부가 발행·보장하지 않고 시장 수요와 공급으로 가격이 정해져요',
        '가상자산은 법정화폐보다 항상 가격이 안정적이에요',
      ],
      correctIndex: 1,
      explanation: '법정화폐는 국가가 발행·보장하고, 전자화폐는 그 법정화폐 가치를 전자적으로 옮겨놓은 것이지만, 가상자산은 정부의 발행·보장 없이 시장에서 가격이 정해져 변동성이 크다는 차이가 있어요.',
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

  'history-joint-stock-market': {
    whatHappened: [
      '16~17세기 유럽에서는 향신료 무역처럼 큰 이익을 낼 수 있지만 배가 난파되거나 도둑을 만나는 등 위험도 큰 사업이 많았어요. 한 사람이 이 위험을 전부 떠안기 어려워, 여러 사람이 돈을 나눠 내고 그만큼 지분(주식)을 나눠 갖는 방식이 나타났어요.',
      '1602년 네덜란드에서는 서로 경쟁하던 여러 무역회사를 합쳐 네덜란드 동인도회사(VOC)를 세웠어요. VOC는 일반 시민도 참여할 수 있도록 지분을 팔았고, 약 1,143명의 투자자가 참여해 자본을 모았다고 알려져 있어요 — 세계 최초로 일반인에게 주식을 공개 판매한 사례로 꼽혀요.',
      'VOC 주주들이 자신의 지분을 서로 사고팔기 시작하면서, 암스테르담에 세계 최초의 조직화된 주식거래소가 생겨났어요. 주식을 발행해 자본을 모으는 시장(발행시장)과, 이미 발행된 주식을 투자자끼리 사고파는 시장(유통시장)이 함께 자리잡은 거예요.',
      'VOC는 자체 군대와 함선을 운영하며 전쟁을 벌이고, 조약을 맺고, 식민지를 개척할 권한까지 가진, "국가 안의 또 다른 국가"로 불릴 만큼 커졌어요.',
    ],
    whyItHappened: [
      '경제적 배경 — 향신료 무역처럼 큰 자본과 긴 항해가 필요한 사업의 위험을 여러 사람이 나눠 감당할 방법이 필요했어요.',
      '제도적 배경 — 투자자가 회사가 진 빚 전부를 책임지지 않고 자신이 낸 돈만큼만 책임지는 유한책임 원칙이 자리잡으면서, 낯선 사람들끼리도 안심하고 함께 투자할 수 있게 됐어요.',
      '정치적 배경 — 네덜란드 정부가 VOC에 특정 지역과의 무역을 독점할 권리를 법으로 보장해줬어요.',
    ],
    dailyLifeImpact:
      '주식회사와 주식시장 덕분에 개인은 배 한 척을 통째로 살 필요 없이, 적은 돈으로도 큰 사업에 참여해 이익을 나눠 가질 수 있게 됐어요. 하지만 이 성장의 이면에는 어두운 역사도 있어요. VOC 같은 초기 무역회사는 향신료 생산지를 독점하기 위해 현지 주민에게 강제로 특정 작물만 재배하게 하거나, 저항하는 지역 주민을 몰아내는 등 식민지 수탈을 함께 벌였어요. 1621년 반다 제도에서는 육두구 무역을 독점하려는 VOC에 의해 현지 주민 대부분이 목숨을 잃거나 삶의 터전을 잃었다고 알려져 있어요. 초기 주식회사의 성장을 순수한 경영 혁신으로만 보기보다는, 이런 식민주의적 수탈과 함께 일어난 일이라는 걸 함께 기억할 필요가 있어요.',
    todayConnection:
      '지금 우리가 아는 주식·주주·주식시장의 기본 틀(지분을 나눠 갖고, 유한책임을 지고, 시장에서 사고판다)은 이 시기에 자리잡은 구조를 이어받고 있어요. 다만 지금의 주식회사는 강제노동이나 무역 독점권 없이, 법과 제도 안에서 운영된다는 점이 근본적으로 달라요.',
    keyScene: '향신료 무역의 큰 위험 → 여러 투자자가 지분을 나눠 갖는 회사(VOC, 1602) → 지분을 사고파는 시장의 등장(암스테르담 거래소) → 유한책임·주주총회 등 오늘날 주식회사 구조의 원형',
    takeaway: '주식회사는 여러 사람이 위험과 이익을 나눠 갖도록 해준 혁신이었지만, 그 초기 역사에는 식민지 수탈이라는 무거운 사회적 비용도 함께 있었어요.',
    relatedConceptIds: ['stock', 'joint-stock-company', 'limited-liability', 'shareholder', 'stock-market'],
  },

  'history-industrial-revolution': {
    whatHappened: [
      '18세기 후반 영국에서 증기기관이 널리 쓰이기 시작하면서, 사람이나 동물의 힘 대신 기계로 옷감을 짜고 물건을 만드는 공장제 생산이 확산됐어요.',
      '기계화 덕분에 한 사람이 만들 수 있는 물건의 양(생산성)이 크게 늘었고, 이는 대량생산으로 이어졌어요. 대량생산된 옷감·생활용품은 이전보다 값싸게 공급될 수 있었어요.',
      '공장이 몰린 도시로 많은 사람이 일자리를 찾아 이동하면서 도시화가 빠르게 진행됐고, 자기 땅에서 농사짓던 사람들이 공장에서 시간당 임금을 받고 일하는 임금노동자로 바뀌어갔어요.',
      '공장을 세우고 기계를 사려면 큰돈이 필요했는데, 은행과 금융시장이 이런 자본을 모아 산업에 공급하는 역할을 하며 함께 성장했어요.',
    ],
    whyItHappened: [
      '기술적 배경 — 증기기관 등 새로운 동력 기술이 개발되면서 사람 손으로 하던 일을 기계가 대신할 수 있게 됐어요.',
      '경제적 배경 — 늘어난 생산량을 팔 수 있는 시장(국내외 무역)과, 공장에 투자할 자본이 함께 필요했어요.',
      '사회적 배경 — 도시로 인구가 몰리며 값싼 노동력을 구하기 쉬워진 점도 공장제 생산 확산에 영향을 줬다고 설명돼요.',
    ],
    dailyLifeImpact:
      '생활용품 가격이 낮아지고 새로운 일자리가 생겼지만, 그 이면에는 무거운 사회적 비용이 있었어요. 초기 공장 노동자들은 하루 12시간이 넘는 장시간 노동에 시달렸고, 어린아이들도 예외가 아니었어요 — 나이가 어릴수록 몸집이 작아 좁은 갱도나 기계 틈에서 일을 시키기 쉽다는 이유로 4살 정도의 아동까지 공장·광산에 고용된 사례가 있었다고 기록돼 있어요. 영국은 1833년 공장법을 통해 9세 미만 고용을 금지하고 노동시간을 제한하며 감독관을 두는 등, 처음으로 실효성 있는 규제를 마련했어요. 이런 열악한 노동환경에 맞서 노동자들이 스스로 목소리를 내는 노동조합이 발전하기 시작한 것도 이 시기예요.',
    todayConnection:
      "지금의 최저 노동연령 제한, 최대 노동시간 규제, 노동조합을 통한 권리 보장 같은 제도들은 산업혁명 시기의 열악한 노동환경에 대한 대응에서 출발해 발전해온 것으로 설명돼요. 또한 이 시기에 자리잡은 '자본을 모아 생산설비에 투자하고, 그 성과를 나눠 갖는' 구조는 지금의 기업·금융시장으로 이어지고 있어요.",
    keyScene: '증기기관·기계화 → 공장제 생산·대량생산 확산 → 도시화·임금노동 확대(+아동노동·장시간노동 등 노동문제) → 노동조합·공장법 등 보호 제도 발전',
    takeaway: '산업혁명은 생산성을 크게 높이고 생활용품을 값싸게 만들었지만, 동시에 아동노동과 열악한 노동환경이라는 큰 사회적 비용을 남겼고 이는 이후 노동자 보호 제도가 발전하는 계기가 됐어요.',
    relatedConceptIds: ['capital', 'labor', 'wage', 'productivity'],
  },

  'history-bretton-woods': {
    whatHappened: [
      '제2차 세계대전이 끝나갈 무렵인 1944년 7월, 44개국 대표들이 미국 뉴햄프셔주 브레턴우즈에 모여 전후 국제통화질서를 새로 설계하는 회의를 열었어요.',
      '이 회의에서 각국 통화의 가치를 미국 달러에 고정하고(조정 가능한 고정환율), 달러는 다시 금 1온스당 35달러로 금과 연결하는 체제(금환본위제)를 만들기로 합의했어요.',
      '국제 통화 문제를 살피고 일시적으로 자금을 빌려주는 국제통화기금(IMF)과, 전쟁으로 파괴된 나라들의 재건과 개발을 지원하는 국제부흥개발은행(오늘날의 World Bank)이 이 회의를 계기로 설립됐어요.',
      '달러가 금과 연결된 유일한 통화였기 때문에, 다른 나라들은 자연스럽게 달러를 대외 거래와 준비자산으로 널리 사용하게 됐고, 달러는 세계의 대표적인 기축통화(준비통화) 자리를 차지했어요.',
      '1971년 미국은 더 이상 달러를 금으로 바꿔주지 않겠다고 선언했어요(금태환 정지, 이른바 "닉슨 쇼크"). 이후 각국은 점차 환율을 시장에서 자유롭게 움직이도록 하는 변동환율제로 옮겨갔고, 브레턴우즈 체제는 사실상 막을 내렸어요.',
    ],
    whyItHappened: [
      '역사적 배경 — 두 차례의 세계대전과 그 사이의 대공황을 겪으며, 국가 간 통화 가치가 불안정하면 무역과 경제 전반이 함께 흔들린다는 교훈이 있었어요.',
      '경제적 배경 — 전후 복구를 위해 국제적으로 자금을 융통하고 무역을 안정적으로 이어갈 공통의 기준이 필요했어요.',
      '국제정치적 배경 — 전쟁 이후 미국이 세계 최대 금 보유국이자 경제 규모를 가진 나라로 부상하면서, 달러를 중심에 둔 체제가 현실적인 대안으로 채택됐어요.',
    ],
    dailyLifeImpact:
      '브레턴우즈 체제 아래서 여러 나라의 환율이 비교적 안정적으로 유지되면서 국제무역이 활발해질 수 있었다고 설명돼요. 다만 이 체제가 모든 나라에 똑같이 유리했던 것은 아니에요. 환율과 통화정책의 중심이 미국 달러에 맞춰져 있다 보니, 다른 나라들은 자국 경제 상황과 다르게 움직이는 미국의 통화정책에도 영향을 받을 수밖에 없었다는 한계가 함께 지적돼요.',
    todayConnection:
      '지금은 대부분 나라가 금과 연결되지 않은 통화를 쓰고 환율도 시장에서 정해지지만, 달러는 여전히 국제 무역과 금융에서 가장 널리 쓰이는 통화 중 하나로 남아 있어요. IMF와 World Bank도 지금까지 국제 금융 안정과 개발 지원이라는 원래 설립 목적을 이어가는 국제기구로 활동하고 있어요. 다만 국제금융 질서가 특정 통화 하나에 크게 의존하는 구조에는 여전히 여러 한계와 논쟁이 있다고 설명돼요.',
    keyScene: '브레턴우즈 회의(1944) → 달러=금 고정(35달러/온스), 다른 통화=달러에 고정 → IMF·World Bank 설립 → 달러의 기축통화화 → 1971년 금태환 정지(닉슨 쇼크) → 변동환율제로 전환',
    takeaway: '브레턴우즈 체제는 전후 세계 경제에 안정적인 통화 질서를 만들어줬지만, 달러 하나에 의존하는 구조는 처음부터 한계와 논쟁을 함께 안고 있었어요.',
    relatedConceptIds: ['dollar', 'fixed-exchange-rate', 'imf', 'reserve-currency', 'international-finance'],
  },

  'history-oil-shock': {
    whatHappened: [
      '1973년 10월, 이집트·시리아가 이스라엘을 공격하며 제4차 중동전쟁(욤키푸르 전쟁)이 벌어졌어요. 미국을 비롯한 서방국가들이 이스라엘을 지원하자, 아랍 산유국들의 모임인 OAPEC은 이들 나라에 대한 석유 수출을 줄이거나 중단하는 금수 조치를 발표했어요.',
      '이 조치와 함께 국제유가가 짧은 기간에 크게 뛰어올랐어요(전쟁 전 배럴당 약 2.9달러에서 1974년 초 약 11.65달러까지, 대략 4배 수준으로 오른 것으로 알려져 있어요) — 이를 1차 오일쇼크라고 불러요.',
      '1978~1979년에는 이란에서 혁명이 일어나며 원유 생산과 수출이 크게 줄었고, 국제유가가 다시 급등했어요 — 2차 오일쇼크예요.',
      '원유는 운송, 공장 가동, 난방 등 거의 모든 산업의 원가에 영향을 주기 때문에, 유가 급등은 곧바로 생산비 상승과 생활물가 상승으로 이어졌어요.',
      '문제는 물가만 오른 게 아니라 경기까지 함께 나빠졌다는 점이었어요 — 물가상승(인플레이션)과 경기침체가 동시에 나타나는 이런 상황을 스태그플레이션이라고 불러요.',
    ],
    whyItHappened: [
      '지정학적 배경 — 제4차 중동전쟁과 아랍 산유국의 석유 무기화(금수 조치)가 1차 오일쇼크의 직접적인 계기였어요.',
      '정치적 배경 — 2차 오일쇼크는 이란 혁명이라는 한 나라의 정치적 격변이 원유 공급 전체를 흔들면서 벌어졌어요.',
      '구조적 배경 — 당시 세계 경제가 중동산 원유에 크게 의존하고 있었던 점도 충격을 키운 배경으로 함께 거론돼요.',
    ],
    dailyLifeImpact:
      '가정에서는 기름값과 생활물가가 함께 뛰면서 실질적인 생활 부담이 커졌어요. 기업들은 생산비 상승과 소비 위축을 동시에 겪었고, 각국 정부와 중앙은행은 어려운 선택에 놓였어요 — 금리를 올려 물가를 잡으려 하면 이미 나빠진 경기가 더 나빠질 수 있고, 경기를 살리려 금리를 낮추면 물가가 더 오를 수 있었기 때문이에요. 이 경험을 계기로 여러 나라가 에너지 절약 기술과 대체 에너지에 투자하고, 에너지를 많이 쓰는 산업 구조를 바꾸려는 노력을 시작했어요. 원유 대부분을 수입에 의존하던 한국 경제도 두 차례의 오일쇼크로 물가 상승과 경상수지 악화 등 큰 영향을 받았다고 설명돼요.',
    todayConnection:
      '에너지 가격이 급등하면 물가와 경기에 동시에 영향을 줄 수 있다는 오일쇼크의 교훈은 지금도 유효해요. 최근에도 국제 정세 변화로 에너지·원자재 가격이 출렁일 때마다 비슷한 우려가 제기되곤 해요. 다만 그때그때의 원인과 정도는 시기마다 달라, 특정 시기의 물가 상승을 오일쇼크와 똑같은 상황이라고 단정할 수는 없어요.',
    keyScene: '제4차 중동전쟁·석유 금수(1973) → 1차 오일쇼크(유가 약 4배 상승) → 이란 혁명(1978~79) → 2차 오일쇼크 → 생산비·물가 상승 + 경기침체(스태그플레이션) → 에너지 절약·산업구조 전환',
    takeaway: '오일쇼크는 에너지 가격이라는 하나의 요인이 물가와 경기를 동시에 흔들 수 있다는 것을, 그리고 그 원인은 대개 여러 국제적 사건이 겹쳐 나타난다는 것을 보여준 사건이에요.',
    relatedConceptIds: ['oil-shock', 'stagflation', 'inflation', 'commodity'],
  },

  'history-korea-growth': {
    whatHappened: [
      '한국전쟁(1950~1953)으로 산업 기반 대부분이 파괴된 뒤, 한국은 세계에서 가장 가난한 나라 중 하나였다고 알려져 있어요.',
      '정부는 1962년부터 경제개발 5개년계획을 추진했어요. 1차 계획(1962~1966)은 "자립경제 달성을 위한 기반 구축"을 목표로 내걸고, 전력·에너지 공급 확대, 농업생산력 증대, 사회간접자본 확충, 수출 증대 등을 핵심 과제로 삼았어요.',
      '자본과 기술이 부족했던 초기에는 해외 차관(외국에서 빌려온 자금)이 산업 투자의 중요한 재원이 됐고, 정부는 은행을 통해 이 자금과 국민 저축을 특정 산업에 집중적으로 배분하는 방식을 활용했어요.',
      '섬유·신발 같은 경공업에서 시작한 산업구조는 1970년대 이후 철강·조선·자동차·화학 같은 중화학공업으로 점차 옮겨갔어요.',
      '이 과정에서 도시화와 교육 확대가 함께 진행됐고, 수출이 늘면서 소득도 빠르게 늘어났다고 설명돼요.',
    ],
    whyItHappened: [
      '정책적 배경 — 정부가 수출 중심 산업화 전략을 세우고, 은행과 기업을 정책적으로 조율하며 자원을 특정 산업에 집중했어요.',
      '국제적 배경 — 냉전 시기 우방국의 지원과 국제 무역 환경, 해외 차관 도입이 자본 부족 문제를 일부 완화해줬어요.',
      '사회적 배경 — 높은 교육열과 노동력, 국민들의 높은 저축률이 함께 뒷받침됐다고 설명돼요.',
      '이 성과는 정부 정책 하나만의 결과가 아니라, 노동자들의 노력, 기업의 투자, 국제 환경, 해외 자본이 함께 맞물린 결과로 다뤄지는 게 일반적이에요.',
    ],
    dailyLifeImpact:
      '수출과 산업화가 진행되며 일자리가 늘고 소득 수준이 전반적으로 높아졌다고 알려져 있어요. 하지만 이 성장의 이면에는 무거운 사회적 비용도 있었어요. 노동자들은 장시간 노동과 산업재해 위험에 자주 노출됐고, 성장의 혜택이 모든 지역과 계층에 고르게 돌아가지는 않아 도시와 농촌, 대기업과 중소기업 사이의 격차가 벌어졌어요. 소수의 대기업집단(재벌) 중심으로 경제력이 집중되는 구조도 이 시기에 자리잡았고, 도시로 인구가 몰리면서 부동산 가격이 오르고 주거 문제도 함께 불거졌어요. 1987년 민주화를 거치며 노동자의 권리와 목소리가 점차 확대된 것도 이런 배경과 맞닿아 있어요.',
    todayConnection:
      '지금 한국 경제의 수출 중심 구조, 대기업집단(재벌) 중심의 산업 지형, 높은 교육열은 모두 이 시기에 뿌리를 두고 있다고 설명돼요. 당시에 쌓인 재벌 중심 구조나 지역 격차 같은 과제들은 지금도 여전히 논의되는 주제예요.',
    keyScene: '한국전쟁 이후 빈곤 → 경제개발 5개년계획(1962~) → 수출 중심 경공업 → 중화학공업으로 전환(1970년대~) → 도시화·소득 증가(+장시간노동·재벌 집중·지역격차 등 비용) → 1987년 민주화·노동권 확대',
    takeaway: '한국의 고도성장은 정부 정책, 노동자, 기업, 국제환경이 함께 맞물려 만들어낸 결과였고, 그 과정에는 실질적인 사회적 비용도 함께 따랐어요.',
    relatedConceptIds: ['industrialization', 'export', 'real-estate', 'economic-growth-rate', 'savings-rate'],
  },

  'history-asian-financial-crisis': {
    whatHappened: [
      '1997년 태국의 통화(바트화) 가치 급락을 시작으로 아시아 여러 나라에서 외국 자본이 빠르게 빠져나가는 금융 불안이 번져갔어요.',
      '한국에서는 1997년 초 대기업 한보의 부도를 시작으로 여러 대기업이 잇따라 무너졌어요. 이들 기업과 금융기관은 짧은 기간에 갚아야 하는 단기 외채를 과도하게 끌어다 썼고, 이 자금을 회수하려는 움직임이 겹치며 외화유동성(당장 쓸 수 있는 외화)이 크게 부족해졌어요.',
      '원/달러 환율이 가파르게 올라, 1997년 11월 10일 달러당 1,000원을 넘어선 뒤 같은 해 12월에는 크게 더 오른 것으로 기록돼 있어요.',
      '결국 정부는 1997년 11월 21일 IMF에 구제금융을 요청하겠다고 공식 발표했고, 12월 3일 협상이 타결됐어요. IMF와 주요국은 대규모 자금 조기지원을 약속했어요.',
      '그 대가로 한국은 기업 구조조정, 부실 금융기관 정리, 노동시장 유연화 등 강도 높은 구조개혁을 받아들여야 했어요.',
    ],
    whyItHappened: [
      '대외적 배경 — 1993년 이후 단기 외채 도입 규제가 완화되며 대규모 단기 자본이 들어왔는데, 1997년 여름 해외 자금이 한꺼번에 빠져나가기 시작했어요.',
      '대내적 배경 — 기업들의 과도한 차입 경영, 외환정책과 금융감독의 허점 등 국내 대응 체계의 취약성이 함께 지적돼요.',
      '이 위기는 국민 개개인의 소비 습관이나 특정 국민성 때문이 아니라, 단기외채 구조와 금융감독 체계의 허점이 겹친 구조적 문제로 설명되는 게 일반적이에요.',
    ],
    dailyLifeImpact:
      "기업 구조조정과 대량 실업으로 많은 가정이 큰 어려움을 겪었어요. 이 시기를 거치며 정규직 대신 비정규직 고용이 크게 늘어나는 등 노동시장의 구조 자체가 바뀌었다고 설명돼요. 한편 국민들이 자발적으로 집에 있는 금을 모아 나라에 내놓은 '금 모으기 운동'은 국민적 참여의 상징적 의미가 컸다고 평가되지만, 위기를 실제로 해결한 주된 힘은 IMF 등 국제기구의 자금 지원과 기업·금융 구조개혁 정책이었다는 점도 함께 이해할 필요가 있어요.",
    todayConnection:
      '이 위기 이후 한국은 외환보유액을 훨씬 넉넉하게 관리하고, 금융감독 체계를 강화하는 방향으로 제도를 정비했어요. 지금 재무 브리핑에서 자주 언급되는 외환보유액, 금융감독원의 역할 등은 이 시기의 경험에서 비롯된 제도적 대응과 맞닿아 있어요.',
    keyScene: '태국 바트화 위기 → 아시아 전역으로 확산 → 한국 대기업 연쇄 부도(한보 등) → 단기외채·외화유동성 부족 → 환율 급등 → IMF 구제금융 요청(1997.11) → 기업·금융 구조조정',
    takeaway: '1997년 외환위기는 단기외채에 과도하게 의존한 구조와 금융감독의 허점이 겹쳐 벌어졌고, 이후 한국의 외환·금융 감독 체계를 크게 바꿔놓은 계기가 됐어요.',
    relatedConceptIds: ['currency-crisis', 'foreign-debt', 'foreign-reserves', 'imf', 'exchange-rate-and-foreign-assets'],
  },

  'history-dotcom-bubble': {
    whatHappened: [
      '1990년대 후반 인터넷이 빠르게 보급되면서, 인터넷을 활용한 새로운 사업(닷컴 기업)에 대한 기대가 커졌어요.',
      '벤처투자 자금이 몰리면서 아직 뚜렷한 수익 모델이 없는 기업들까지도 주가가 가파르게 올랐어요. 낮은 금리와 풍부한 유동성, 투자자들의 낙관적인 심리가 이런 상승을 뒷받침했다고 설명돼요.',
      '미국 나스닥 지수는 2000년 3월 10일 5,048.62까지 올랐다가, 이후 2002년 10월까지 고점 대비 70%대 하락한 것으로 알려져 있어요 — 이 급락과 그 과정을 흔히 닷컴버블 붕괴라고 불러요.',
      '많은 인터넷 기업이 문을 닫았고, 투자자들은 큰 손실을 입었어요. 하지만 이 시기에 살아남은 일부 기술기업은 이후 수십 년에 걸쳐 크게 성장했고, 인터넷을 기반으로 한 경제 자체는 장기적으로 계속 커졌어요.',
    ],
    whyItHappened: [
      '기술적 배경 — 인터넷이라는 새로운 기술에 대한 진짜 기대가 있었어요.',
      '금융적 배경 — 낮은 금리와 풍부한 자금이 투자를 부추겼고, 투자자들의 낙관적인 심리가 가격 상승에 상승이 이어지는 분위기를 만들었어요.',
      '구조적 배경 — 수익이 나지 않는 기업도 "미래 성장 가능성"만으로 높은 가치를 인정받는 경우가 많아, 실제 사업 성과와 주가 사이의 간격이 크게 벌어졌어요.',
    ],
    dailyLifeImpact:
      "닷컴버블 붕괴로 많은 투자자와 종업원이 일자리와 투자금을 잃었어요. 동시에 이 사건은 중요한 구분을 하나 남겼어요 — '기술 자체의 장기적 가치'와 '그 시점에 투자자들이 개별 기업에 매긴 가격'은 서로 다른 문제라는 점이에요. 인터넷이라는 기술은 이후에도 계속 발전했지만, 당시 거품 속에서 과도하게 높은 가격이 매겨졌던 개별 기업 다수는 그 가격을 정당화하지 못하고 사라졌어요.",
    todayConnection:
      "닷컴버블은 자산 거품이 실시간으로는 확인하기 어렵고, 대개 가격이 크게 꺾인 뒤에야(사후적으로) '그때가 거품이었다'고 설명된다는 점을 보여준 대표 사례예요. 지금도 새로운 기술이나 자산에 대한 기대가 클 때마다 비슷한 논쟁이 반복되곤 하지만, 특정 시점의 가격이 거품인지 아닌지를 미리 단정하기는 여전히 어려워요.",
    keyScene: '인터넷 보급·기대 확산 → 벤처투자·주가 급등(불확실한 기업까지) → 나스닥 고점(2000.3) → 급락(2000~2002, 고점 대비 70%대 하락) → 다수 기업 폐업, 일부 기업은 장기 성장',
    takeaway: '닷컴버블은 새로운 기술에 대한 진짜 가능성과, 그 시점의 시장이 매긴 가격이 서로 다를 수 있다는 것을 보여준 사건이에요.',
    relatedConceptIds: ['asset-bubble', 'speculation', 'expected-return', 'volatility', 'corporate-value'],
  },

  'history-european-debt-crisis': {
    whatHappened: [
      '1999년(현금 유통은 2002년) 유럽 여러 나라가 공동으로 유로화를 도입했어요. 유로존 국가들은 유럽중앙은행(ECB)이 결정하는 하나의 통화정책을 함께 쓰지만, 세금을 걷고 예산을 쓰는 재정정책은 각 나라가 따로 결정한다는 독특한 구조를 가지고 있었어요.',
      '2008년 세계금융위기 이후 여러 나라의 재정 부담이 커진 가운데, 그리스의 재정 상태가 특히 심각한 것으로 드러났어요. 2009년 그리스의 재정적자는 처음 알려진 수치보다 훨씬 큰, GDP 대비 약 12.7%에 이르는 것으로 다시 집계됐고 이후 더 높게 수정되기도 했어요.',
      '그리스를 비롯한 일부 유로존 국가의 국채 금리가 크게 뛰어올랐어요(투자자들이 그 나라가 빚을 못 갚을 위험이 커졌다고 본 거예요). 국채를 많이 보유한 은행들도 함께 부실해지며, 부실한 은행을 정부가 지원해야 하는 상황과 정부 재정이 나빠지는 상황이 서로를 더 나쁘게 만드는 악순환이 나타났어요.',
      '유럽중앙은행(ECB), 유럽연합(EU), IMF가 함께 지원 프로그램을 마련했고, 그 조건으로 여러 나라가 긴축정책(정부 지출을 줄이고 세금을 늘리는 정책)을 시행했어요.',
    ],
    whyItHappened: [
      '구조적 배경 — 유로존은 통화정책은 공동으로, 재정정책은 국가별로 운영하는 구조라, 재정이 취약한 나라가 스스로 통화가치를 조정해 대응할 수단이 제한적이었어요.',
      '경제적 배경 — 회원국 간 재정 상태와 산업 경쟁력 차이가 컸는데, 2008년 금융위기가 이 차이를 한꺼번에 드러냈다고 설명돼요.',
      '그리스의 경우 재정 통계가 처음에 실제보다 낮게 보고됐다는 점이 위기감을 더 키운 요인으로 꼽혀요.',
    ],
    dailyLifeImpact:
      '긴축정책으로 정부 지출과 공공 부문 일자리가 줄고 복지 혜택이 축소되면서, 특히 그리스에서는 실업률이 크게 오르고 사회적 갈등과 시위가 이어졌어요. 긴축은 재정 건전성을 회복하려는 목적이 있었지만, 그 과정에서 실업과 생활고 같은 실질적인 사회적 비용이 따랐다고 평가돼요.',
    todayConnection:
      "이 위기는 '국가부채가 크다'는 사실 하나만으로 그 나라가 위험하다고 단정할 수 없다는 점을 보여줘요 — 그 나라가 빚을 갚을 수 있는 능력(경제 성장, 세금을 걷는 능력), 통화정책을 스스로 조정할 수 있는지 등을 함께 봐야 한다고 설명돼요. 통화는 공동으로 쓰면서 재정정책은 각자 운영하는 유로존의 구조적 특징은 지금도 유럽 경제를 이해하는 데 중요한 배경으로 다뤄져요.",
    keyScene: '유로화 도입(통화정책 공동, 재정정책은 개별) → 2008년 금융위기로 재정 부담 확대 → 그리스 재정적자 재집계(약 12.7%) → 국채금리 급등·은행 부실 악순환 → ECB·EU·IMF 지원+긴축정책 → 실업·사회적 비용',
    takeaway: '유럽 재정위기는 통화는 하나로 묶여 있지만 재정정책은 나라마다 따로인 유로존의 구조적 특징이 위기 대응을 더 어렵게 만들었다는 것을 보여줘요.',
    relatedConceptIds: ['government-bond', 'national-debt', 'fiscal-deficit', 'austerity', 'credit-rating'],
  },

  'history-covid-economy': {
    whatHappened: [
      '2020년 코로나19 감염병이 전 세계로 확산되며 각국 정부가 이동제한·봉쇄 조치를 시행했어요. 여행·외식·공연 같은 서비스업이 특히 큰 타격을 입었고, 공장 가동과 소비 전반이 위축됐어요.',
      '부품 공급이 끊기거나 물류가 막히는 글로벌 공급망 차질이 여러 산업에서 나타났어요.',
      '각국 정부는 재난지원금 등 대규모 재정지원을 시행했고, 한국은행을 비롯한 여러 나라 중앙은행은 기준금리를 큰 폭으로 낮추고 시중에 유동성을 넉넉히 공급했어요. 한국은행은 2020년 3월 기준금리를 1.25%에서 0.75%로 0.5%포인트 낮췄어요.',
      '온라인 쇼핑, 배달, 비대면 서비스 산업이 빠르게 성장했고, 이후 방역 조치가 완화되며 억눌렸던 소비가 살아나는 회복 국면이 이어졌어요.',
      '2021년부터 2022년 사이 세계적으로 물가가 크게 올랐어요(인플레이션). 한국은행은 이 시기 물가 상승의 배경으로 우크라이나 사태 장기화 등에 따른 에너지·식료품 가격 상승, 국제유가·원자재 가격과 환율 상승에 따른 수입물가 상승, 그리고 사회적 거리두기 해제 이후 소비 회복에 따른 수요측 압력이 함께 작용했다고 설명했어요.',
    ],
    whyItHappened: [
      '보건적 배경 — 감염병 확산을 막기 위한 이동제한 조치가 생산과 소비를 동시에 위축시켰어요.',
      '정책적 배경 — 경기 침체를 막기 위해 각국이 대규모 재정·통화 부양책을 함께 시행했어요.',
      '공급 측 배경 — 팬데믹과 이후의 국제정세 변화(전쟁 등)로 공급망과 에너지 가격이 함께 흔들렸어요.',
      '회복기 물가 상승은 통화량 증가 하나만이 아니라, 공급망 차질·에너지 가격·수요 회복·확장적 정책이 겹친 결과로 설명되는 게 일반적이에요.',
    ],
    dailyLifeImpact:
      '업종과 직종에 따라 타격의 크기가 크게 달랐어요. 여행·공연·외식업 종사자들은 소득이 크게 줄었지만, 온라인·배달·비대면 관련 산업은 오히려 성장했어요. 재난지원금 등 정책 지원이 있었지만, 소득 계층과 고용 형태에 따라 그 충격을 견디는 정도도 서로 달랐다고 평가돼요.',
    todayConnection:
      '코로나19 이후의 물가 상승과 금리 인상 흐름은 지금의 기준금리·물가 관련 소식을 이해하는 배경이 돼요. 다만 이 시기의 장기적인 영향(공급망 재편, 재택근무 확산 등)이 앞으로 얼마나 지속될지는 아직 확정적으로 말하기 어려운 부분도 있다고 설명돼요.',
    keyScene: '팬데믹 확산·이동제한 → 생산·소비 위축, 공급망 차질 → 재정지원·기준금리 인하(한국은행 2020.3, 1.25%→0.75%) → 비대면 산업 성장 → 방역 완화 후 수요 회복 → 공급망·에너지·수요 복합 요인으로 물가 상승(2021~2022)',
    takeaway: '코로나19 이후의 물가 상승은 통화량 하나만이 아니라 공급망, 에너지 가격, 수요 회복, 정책 대응이 함께 겹친 결과로 설명돼요.',
    relatedConceptIds: ['supply-chain', 'liquidity', 'fiscal-policy', 'inflation', 'base-rate'],
  },

  'history-digital-finance': {
    whatHappened: [
      '인터넷과 스마트폰이 보급되며 인터넷뱅킹과 모바일뱅킹이 자리잡았고, 은행 창구에 가지 않고도 대부분의 금융 업무를 처리할 수 있게 됐어요.',
      '간편결제·전자결제 서비스가 확산되고, 기술과 금융을 결합한 핀테크 기업들이 송금·자산관리·대출 등 다양한 금융 서비스를 새롭게 선보였어요. 이런 변화는 금융 접근성과 편의성을 크게 높였지만, 개인정보·보안 위험과 디지털 기기 이용이 어려운 사람들이 소외되는 문제도 함께 낳았어요.',
      '이런 흐름 속에서 블록체인이라는 기술이 등장했어요. 블록체인은 거래 기록을 한 곳에 모아두지 않고 여러 참여자가 나눠 보관하며, 기록을 임의로 바꾸기 어렵게 설계된 분산 장부 기술이에요.',
      '2009년 비트코인을 시작으로, 블록체인 기술을 바탕으로 한 가상자산(암호자산)이 등장했어요. 정부가 발행하고 가치를 보장하는 법정화폐, 법정화폐를 전자적으로 옮겨놓은 전자화폐(선불카드 등)와 달리, 가상자산은 정부가 발행하거나 가치를 보장하지 않고 시장의 수요와 공급에 따라 가격이 정해져요.',
      '가상자산은 가격 변동성이 크고, 지갑 비밀키 분실이나 거래소 해킹 같은 보관 위험도 함께 따른다고 알려져 있어요. 한국은 특정금융정보법에 따라 가상자산사업자가 금융정보분석원에 신고하도록 하는 등 이용자 보호를 위한 제도를 운영하고 있어요.',
    ],
    whyItHappened: [
      '기술적 배경 — 인터넷·모바일 기술과 블록체인 기술의 발전이 새로운 금융 서비스와 자산을 가능하게 했어요.',
      '수요 측 배경 — 더 빠르고 편리한 결제·송금에 대한 수요가 핀테크 서비스 확산을 이끌었어요.',
      '제도적 배경 — 새로운 기술이 빠르게 퍼지면서, 이용자 보호와 자금세탁 방지를 위한 제도도 뒤따라 마련되고 있는 중이에요(계속 발전하는 영역이라는 점에 유의할 필요가 있어요).',
    ],
    dailyLifeImpact:
      '디지털 금융 덕분에 언제 어디서든 송금·결제·투자가 가능해졌지만, 그만큼 개인정보 유출이나 피싱 같은 보안 위험에 노출될 가능성도 커졌어요. 디지털 기기 사용이 익숙하지 않은 고령층 등이 금융 서비스 이용에서 소외되는 디지털 소외 문제도 함께 지적돼요. 가상자산에 투자하는 사람이 늘면서, 가격이 급등락하는 경험을 하거나 보관 실수·해킹으로 자산을 잃는 사례도 함께 알려져 있어요.',
    todayConnection:
      '지금도 핀테크 서비스와 가상자산 관련 제도는 계속 변화하고 있어요. 한국은행은 중앙은행이 직접 발행하는 디지털화폐(CBDC)에 대한 연구와 모의실험을 진행해왔는데, 이는 민간이 만든 가상자산과 달리 중앙은행이 발행하고 가치를 보장한다는 점에서 근본적으로 다른 개념이에요. CBDC는 아직 연구·실험 단계에 있는 내용과, 이미 시행 중인 가상자산사업자 신고제도 같은 현재 제도를 구분해서 이해하는 것이 중요해요.',
    keyScene: '인터넷·모바일뱅킹 확산 → 간편결제·핀테크 성장 → 블록체인 기술 등장 → 비트코인 등 가상자산 등장(2009~) → 가격 변동성·보관 위험+이용자 보호 제도(신고제) → 중앙은행 디지털화폐(CBDC) 연구',
    takeaway: '디지털 금융은 편의성을 크게 높였지만, 보안·소외 위험이 함께 따르고, 특히 가상자산은 법정화폐와 근본적으로 다른 자산이라는 점을 이해하고 접근할 필요가 있어요.',
    relatedConceptIds: ['electronic-payment', 'fintech', 'blockchain', 'digital-asset', 'volatility'],
  },
}
