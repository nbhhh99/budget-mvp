import type { CurriculumModule, LearningContent } from '../types/models'

export const REAL_LIFE_ECONOMY_VERSION = 'real-life-economy-v1'

// 12개 과정. 금리·환율·자원가격·정부정책 같은 경제 변화가 장보기·월급·대출·주거·취업·저축과
// 투자로 전달되는 경로를 다룬다. 용어 재정의(돈 개념 사전)나 역사 반복(차근차근 경제사)이
// 아니라 "전달경로"가 중심이라, 개념은 conceptIds로만 연결하고 본문에 정의를 복제하지 않는다.
// 공급망·국제분쟁·기후변화·전기가스요금 4개 과정은 이번 버전에 포함하지 않는다(향후 확장분).
export const REAL_LIFE_ECONOMY_MODULES: CurriculumModule[] = [
  {
    id: 'life-economy-intro',
    order: 1,
    title: '경제는 어떻게 내 생활까지 올까',
    description: '국제 사건과 정책 변화가 금리·환율·물가를 거쳐 내 생활에 오는 전체 경로를 알아봐요.',
    estimatedMinutes: 6,
    itemIds: ['life-economy-intro-body', 'life-economy-intro-quiz'],
    conceptIds: ['money', 'interest-rate', 'exchange-rate-and-foreign-assets', 'commodity', 'inflation', 'unemployment'],
    sourceIds: ['bok-edu', 'fss-edu'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
  {
    id: 'life-economy-base-rate',
    order: 2,
    title: '기준금리가 오르면 내 생활은 어떻게 달라질까',
    description: '기준금리 변화가 내 대출과 예금 이자에 어떻게 이어지는지 알아봐요.',
    estimatedMinutes: 7,
    itemIds: ['life-economy-base-rate-body', 'life-economy-base-rate-quiz'],
    conceptIds: ['base-rate', 'market-rate', 'fixed-rate', 'floating-rate', 'mortgage'],
    sourceIds: ['bok-edu', 'bok-ecos'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
  {
    id: 'life-economy-exchange-rate',
    order: 3,
    title: '환율이 오르면 왜 장바구니가 달라질까',
    description: '환율 변화가 수입 물가와 생활비에 어떻게 이어지는지 알아봐요.',
    estimatedMinutes: 7,
    itemIds: ['life-economy-exchange-rate-body', 'life-economy-exchange-rate-quiz'],
    conceptIds: ['exchange-rate-and-foreign-assets', 'foreign-currency-asset', 'commodity'],
    sourceIds: ['bok-edu', 'bok-fx-reserves'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
  {
    id: 'life-economy-oil-price',
    order: 4,
    title: '석유 가격은 왜 거의 모든 물가에 영향을 줄까',
    description: '국제유가 변화가 연료비를 넘어 여러 물가에 어떻게 퍼지는지 알아봐요.',
    estimatedMinutes: 6,
    itemIds: ['life-economy-oil-price-body', 'life-economy-oil-price-quiz'],
    conceptIds: ['commodity', 'oil-shock', 'exchange-rate-and-foreign-assets'],
    sourceIds: ['opinet-info', 'bok-edu'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
  {
    id: 'life-economy-grain-price',
    order: 5,
    title: '곡물 가격이 식탁까지 오는 과정',
    description: '국제 곡물 가격 변화가 장보기·외식비로 이어지는 과정을 알아봐요.',
    estimatedMinutes: 6,
    itemIds: ['life-economy-grain-price-body', 'life-economy-grain-price-quiz'],
    conceptIds: ['commodity', 'inflation'],
    sourceIds: ['fao-food-price-index', 'kostat-info'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
  {
    id: 'life-economy-tax-policy',
    order: 6,
    title: '세금과 정부정책이 내 지갑에 오는 과정',
    description: '세금과 정부정책이 내 지갑과 생활에 어떻게 연결되는지 알아봐요.',
    estimatedMinutes: 7,
    itemIds: ['life-economy-tax-policy-body', 'life-economy-tax-policy-quiz'],
    conceptIds: ['tax', 'income-tax', 'vat', 'tax-credit'],
    sourceIds: ['nts-info', 'moef-fiscal-balance'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'periodic',
  },
  {
    id: 'life-economy-wage-inflation',
    order: 7,
    title: '물가는 오르는데 왜 내 월급은 바로 오르지 않을까',
    description: '물가와 임금이 서로 다른 속도로 움직이는 이유를 알아봐요.',
    estimatedMinutes: 6,
    itemIds: ['life-economy-wage-inflation-body', 'life-economy-wage-inflation-quiz'],
    conceptIds: ['wage', 'consumer-price-index', 'inflation-and-purchasing-power'],
    sourceIds: ['kostat-info', 'bok-ecos'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
  {
    id: 'life-economy-recession-jobs',
    order: 8,
    title: '경기가 나빠지면 취업과 회사는 어떻게 달라질까',
    description: '경기 변화가 취업과 회사 생활에 어떻게 이어지는지 알아봐요.',
    estimatedMinutes: 6,
    itemIds: ['life-economy-recession-jobs-body', 'life-economy-recession-jobs-quiz'],
    conceptIds: ['recession', 'unemployment', 'business-cycle', 'economic-growth-rate'],
    sourceIds: ['kosis-business-cycle', 'kostat-info'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
  {
    id: 'life-economy-housing',
    order: 9,
    title: '집값·전세·월세는 무엇 때문에 움직일까',
    description: '금리·공급·정책 같은 여러 요인이 집값·전세·월세에 어떻게 작용하는지 알아봐요.',
    estimatedMinutes: 8,
    itemIds: ['life-economy-housing-body', 'life-economy-housing-quiz'],
    conceptIds: ['mortgage', 'jeonse-loan', 'base-rate', 'real-estate'],
    sourceIds: ['reb-info', 'hf-repayment'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
  {
    id: 'life-economy-reading-news',
    order: 10,
    title: '경제뉴스를 내 생활의 언어로 바꾸는 법',
    description: '경제뉴스를 순서대로 읽어 내 생활의 언어로 옮기는 방법을 알아봐요.',
    estimatedMinutes: 6,
    itemIds: ['life-economy-reading-news-body', 'life-economy-reading-news-quiz'],
    conceptIds: ['consumer-price-index', 'base-rate', 'exchange-rate-and-foreign-assets'],
    sourceIds: ['bok-edu', 'kostat-info'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
  {
    id: 'life-economy-stock-market',
    order: 11,
    title: '주식시장은 왜 실물경제와 다르게 움직일까',
    description: '주식시장이 실물경제와 다르게 움직이는 이유를 알아봐요.',
    estimatedMinutes: 7,
    itemIds: ['life-economy-stock-market-body', 'life-economy-stock-market-quiz'],
    conceptIds: ['stock', 'stock-index', 'corporate-value', 'expected-return', 'liquidity'],
    sourceIds: ['krx-kind', 'bok-edu'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
  {
    id: 'life-economy-government-finance',
    order: 12,
    title: '정부재정은 내 생활과 어떻게 연결될까',
    description: '정부재정이 지원·세금·국가부채를 통해 내 생활과 어떻게 연결되는지 알아봐요.',
    estimatedMinutes: 7,
    itemIds: ['life-economy-government-finance-body', 'life-economy-government-finance-quiz'],
    conceptIds: ['fiscal-policy', 'fiscal-deficit', 'government-bond', 'national-debt'],
    sourceIds: ['moef-fiscal-balance', 'bok-ecos'],
    curriculumVersion: REAL_LIFE_ECONOMY_VERSION,
    freshness: 'stable',
  },
]

export const REAL_LIFE_ECONOMY_CONTENTS: LearningContent[] = [
  { id: 'life-economy-intro-body', curriculumId: 'life-economy-intro', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-intro-quiz', curriculumId: 'life-economy-intro', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '경제 변화가 내 생활에 전달되는 경로를 설명할 때 가장 알맞은 것은?',
      choices: [
        '국제 사건이나 정책 변화는 금리·환율·물가 등 여러 통로를 거쳐 시차를 두고 내 생활에 영향을 줘요.',
        '경제 뉴스는 항상 내 생활과 무관해서 신경 쓸 필요가 없어요.',
        '경제지표 하나만 확인하면 앞으로 내 생활이 어떻게 변할지 정확히 예측할 수 있어요.',
      ],
      correctIndex: 0,
      explanation: '경제는 여러 요인이 서로 연결된 구조라, 하나의 사건이나 지표만으로 내 생활에 대한 영향을 단정하기 어렵고, 영향이 나타나는 시점도 통로마다 달라요.',
    },
  },

  { id: 'life-economy-base-rate-body', curriculumId: 'life-economy-base-rate', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-base-rate-quiz', curriculumId: 'life-economy-base-rate', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '기준금리 인상이 가계에 미치는 영향을 설명할 때 가장 알맞은 것은?',
      choices: [
        '기준금리가 오르면 모든 물가가 그 즉시 함께 내려가요.',
        '변동금리 대출의 이자 부담은 커질 수 있지만, 물가에 미치는 영향은 시차를 두고 다른 요인과 함께 나타나요.',
        '기준금리는 예금금리에는 영향을 주지 않고 대출금리에만 영향을 줘요.',
      ],
      correctIndex: 1,
      explanation: '대출·예금 금리는 비교적 빠르게 영향을 받는 편이지만, 물가는 소비·투자가 줄어드는 과정을 거쳐야 해서 시차를 두고, 다른 요인들과 함께 작용해요.',
    },
  },

  { id: 'life-economy-exchange-rate-body', curriculumId: 'life-economy-exchange-rate', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-exchange-rate-quiz', curriculumId: 'life-economy-exchange-rate', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '환율이 올랐을 때(원화 가치 하락) 나타날 수 있는 영향을 설명할 때 가장 알맞은 것은?',
      choices: [
        '환율 상승은 예외 없이 모든 수출기업에 이득이 돼요.',
        '환율은 해외여행이나 해외직구 비용에는 영향을 주지 않아요.',
        '수입 원자재를 많이 쓰는 기업의 비용 부담이 커질 수 있고, 그 영향이 상품 가격에 시차를 두고 반영될 수 있어요.',
      ],
      correctIndex: 2,
      explanation: '환율 상승은 수입 비용 부담을 키우는 경향이 있지만, 그 영향이 상품 가격에 반영되기까지는 시차가 있고, 기업마다(수입 원자재·외화부채 비중에 따라) 영향의 방향과 크기가 달라요.',
    },
  },

  { id: 'life-economy-oil-price-body', curriculumId: 'life-economy-oil-price', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-oil-price-quiz', curriculumId: 'life-economy-oil-price', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '국제유가 상승이 국내 물가 전반에 넓게 영향을 줄 수 있는 이유로 가장 알맞은 것은?',
      choices: [
        '원유가 연료뿐 아니라 플라스틱 등 여러 산업의 원료로도 쓰이기 때문이에요.',
        '국제유가는 국내 주유소 가격에만 영향을 주고 다른 상품에는 전혀 영향이 없기 때문이에요.',
        '원유는 반드시 원화로만 거래되기 때문이에요.',
      ],
      correctIndex: 0,
      explanation: '원유는 에너지원이면서 동시에 여러 산업의 원료로도 쓰여서, 유가 변화가 운송비·생산비 등 폭넓은 영역에 영향을 줄 수 있어요.',
    },
  },

  { id: 'life-economy-grain-price-body', curriculumId: 'life-economy-grain-price', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-grain-price-quiz', curriculumId: 'life-economy-grain-price', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '국제 곡물 가격 상승이 국내 식탁 물가로 이어지는 경로를 설명할 때 가장 알맞은 것은?',
      choices: [
        '국제 곡물 가격은 국내 식료품 가격과는 전혀 무관해요.',
        '가뭄·분쟁·수출 제한 등으로 국제 공급이 줄면 곡물·사료 가격이 오르고, 이는 가공식품·축산물 원가를 거쳐 장보기 비용에 영향을 줄 수 있어요.',
        '식료품 물가는 항상 단 하나의 사건만으로 설명할 수 있어요.',
      ],
      correctIndex: 1,
      explanation: '국제 곡물 시장의 변화는 사료·가공식품 원가를 거쳐 국내 장보기·외식비에 시차를 두고 영향을 줄 수 있고, 보통 여러 요인이 함께 작용해요.',
    },
  },

  { id: 'life-economy-tax-policy-body', curriculumId: 'life-economy-tax-policy', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-tax-policy-quiz', curriculumId: 'life-economy-tax-policy', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '세금이 가계에 영향을 주는 경로를 설명할 때 가장 알맞은 것은?',
      choices: [
        '세금은 정부 재원과는 아무 관련이 없어요.',
        '감세는 어떤 상황에서도 항상 좋은 결과만 가져와요.',
        '소득세는 가처분소득을, 소비 관련 세금은 상품가격을 통해 각각 다른 경로로 가계에 영향을 줘요.',
      ],
      correctIndex: 2,
      explanation: '세목마다 가계에 영향을 주는 경로가 다르고, 세금은 가계 부담뿐 아니라 정부가 공공서비스에 쓸 재원과도 연결돼 있어요.',
    },
  },

  { id: 'life-economy-wage-inflation-body', curriculumId: 'life-economy-wage-inflation', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-wage-inflation-quiz', curriculumId: 'life-economy-wage-inflation', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '명목임금과 실질임금의 관계를 가장 잘 설명한 것은?',
      choices: [
        '명목임금이 올라도 물가가 더 많이 오르면 실질임금(구매력)은 줄어들 수 있어요.',
        '명목임금과 실질임금은 항상 같은 크기로 움직여요.',
        '물가가 오르면 실질임금은 항상 함께 올라요.',
      ],
      correctIndex: 0,
      explanation: '명목임금은 금액 자체를, 실질임금은 그 금액으로 실제 살 수 있는 양을 나타내기 때문에 물가상승률에 따라 둘의 방향이 달라질 수 있어요.',
    },
  },

  { id: 'life-economy-recession-jobs-body', curriculumId: 'life-economy-recession-jobs', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-recession-jobs-quiz', curriculumId: 'life-economy-recession-jobs', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '경기침체가 고용에 영향을 주는 경로를 설명할 때 가장 알맞은 것은?',
      choices: [
        '경기침체는 모든 업종에 정확히 같은 크기로 영향을 줘요.',
        '소비 감소가 기업의 매출·투자 축소로 이어지고, 이것이 다시 채용과 소득 감소로 연결될 수 있어요.',
        '경기와 고용은 서로 아무런 시차 없이 동시에 변해요.',
      ],
      correctIndex: 1,
      explanation: '소비-매출-투자-고용으로 이어지는 흐름에는 시차와 업종별 차이가 있어, 경기침체의 영향이 모두에게 똑같이, 동시에 나타나지는 않아요.',
    },
  },

  { id: 'life-economy-housing-body', curriculumId: 'life-economy-housing', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-housing-quiz', curriculumId: 'life-economy-housing', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '집값·전세·월세를 움직이는 요인을 설명할 때 가장 알맞은 것은?',
      choices: [
        '집값은 오직 기준금리 하나로만 결정돼요.',
        '전세 제도는 금리 변화와 전혀 관련이 없어요.',
        '금리, 공급량, 인구·일자리 분포, 세금·규제, 기대심리 등 여러 요인이 함께 작용해요.',
      ],
      correctIndex: 2,
      explanation: '주택 가격과 임대 형태는 금리를 포함한 여러 요인이 동시에 작용한 결과로 설명되며, 단일 요인만으로 방향을 단정하기는 어려워요.',
    },
  },

  { id: 'life-economy-reading-news-body', curriculumId: 'life-economy-reading-news', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-reading-news-quiz', curriculumId: 'life-economy-reading-news', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '경제 뉴스를 읽을 때 가장 먼저 확인하면 도움이 되는 것은?',
      choices: [
        '정확히 무엇이 바뀌었는지, 그리고 기준일·비교 대상이 무엇인지부터 확인해요.',
        '제목만 보고 바로 결론을 내려요.',
        '전망과 이미 확정된 사실을 구분하지 않고 그대로 받아들여요.',
      ],
      correctIndex: 0,
      explanation: '무엇이, 언제를 기준으로 바뀌었는지부터 확인해야 그 다음 단계(영향 경로, 시차, 반대 요인 등)를 제대로 짚어볼 수 있어요.',
    },
  },

  { id: 'life-economy-stock-market-body', curriculumId: 'life-economy-stock-market', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-stock-market-quiz', curriculumId: 'life-economy-stock-market', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '주가와 실물경제가 항상 같은 방향으로 움직이지 않을 수 있는 이유로 가장 알맞은 것은?',
      choices: [
        '주가는 오직 그 순간의 기업 실적 발표에만 반응하기 때문이에요.',
        '주가는 현재 실적뿐 아니라 미래에 대한 기대, 금리, 유동성 등 여러 요소를 함께 반영하기 때문이에요.',
        '실물경제와 주식시장은 서로 완전히 무관한 별개의 세계이기 때문이에요.',
      ],
      correctIndex: 1,
      explanation: '주가는 현재 실적과 더불어 미래 기대, 금리(할인율), 유동성, 투자심리 등을 함께 반영해서 정해지기 때문에, 실물경제 지표와 반드시 같은 방향으로 움직이지는 않아요.',
    },
  },

  { id: 'life-economy-government-finance-body', curriculumId: 'life-economy-government-finance', type: 'example', title: '본문 읽기', body: '', required: true, order: 1, version: 1, reviewedAt: '2026-08-25' },
  { id: 'life-economy-government-finance-quiz', curriculumId: 'life-economy-government-finance', type: 'quiz', title: '확인 문제', body: '', required: true, order: 2, version: 1, reviewedAt: '2026-08-25',
    quiz: {
      question: '정부재정과 국가부채에 대한 설명으로 가장 알맞은 것은?',
      choices: [
        '자국 통화가 있는 국가는 국가부채를 아무리 늘려도 문제가 되지 않아요.',
        '정부지출을 늘리면 예외 없이 경제가 항상 크게 성장해요.',
        '정부지출은 경기를 뒷받침할 수 있지만 재정적자·국가부채를 늘릴 수 있어, 편익과 비용을 함께 살펴봐야 해요.',
      ],
      correctIndex: 2,
      explanation: '정부지출은 소비·고용을 뒷받침하는 효과가 있을 수 있지만, 그만큼 재정적자·국가부채가 늘어날 수 있어 편익과 비용을 함께 고려해야 해요. 국가부채는 가계부채와 다른 조건을 갖지만 무한정 늘려도 된다는 뜻은 아니에요.',
    },
  },
]

export interface LifeImpactExample {
  situation: string
  impact: string
}

export interface AudienceComparison {
  groupA: string
  groupAImpact: string
  groupB: string
  groupBImpact: string
}

export interface MythCorrection {
  myth: string
  correction: string
}

// §7의 10단 구성 중 ①~④는 todayQuestion/quickAnswer/transmissionPath/whyItHappens에,
// ⑤⑥⑦⑧은 lifeExamples/audienceComparisons/myths/checkItems에 담는다. ⑨관련 개념은
// 본문에 정의를 복제하지 않고 모듈의 conceptIds로만 연결하고, ⑩확인 문제는 위
// REAL_LIFE_ECONOMY_CONTENTS의 quiz 항목이 담당한다.
export interface RealLifeEconomyModuleBody {
  todayQuestion: string
  quickAnswer: string
  transmissionPath: string[]
  whyItHappens: string[]
  lifeExamples: LifeImpactExample[]
  audienceComparisons?: AudienceComparison[]
  myths: MythCorrection[]
  checkItems: string[]
  closingCta?: { label: string; to: string }
}

export const REAL_LIFE_ECONOMY_BODIES: Record<string, RealLifeEconomyModuleBody> = {
  'life-economy-intro': {
    todayQuestion: '뉴스에서 금리가 오르고 환율이 움직였다는 소식을 들었을 때, 이게 결국 내 생활과 어떤 상관이 있을까요?',
    quickAnswer:
      '국제 사건과 정부·중앙은행의 정책은 금리·환율·원자재 가격 같은 몇 가지 통로를 거쳐 기업의 비용과 매출에 영향을 주고, 그 영향이 다시 물가·고용·임금을 거쳐 우리의 소비·저축·대출로 이어져요. 각 단계에는 시차가 있고, 사람마다 영향을 받는 정도도 달라요.',
    transmissionPath: [
      '국제 사건·정부 정책',
      '금리·환율·원자재 가격',
      '기업의 비용과 매출',
      '물가·고용·임금',
      '가계의 소비·저축·대출',
    ],
    whyItHappens: [
      '경제는 정부, 중앙은행, 기업, 가계가 서로 주고받는 관계로 이어져 있어요. 정부는 세금을 걷고 지출하며, 중앙은행은 금리로 돈의 흐름을 조절하고, 기업은 그 조건 속에서 생산·고용을 결정하고, 가계는 소득을 벌어 소비·저축·대출을 해요.',
      '금리·환율·원자재·물가·고용은 서로 연결돼 있어서, 하나가 바뀌면 다른 것들도 정도 차이는 있지만 함께 움직이는 경향이 있어요.',
      '어떤 변화는 가격에 거의 바로 반영되지만(예: 환율에 따라 즉시 바뀌는 해외 결제 금액), 어떤 변화는 몇 달에서 몇 년에 걸쳐 서서히 나타나요(예: 임금 협상, 신규 투자 결정).',
      '같은 경제 변화라도 대출이 있는 사람과 예금이 많은 사람, 수출기업과 수입기업처럼 처한 상황에 따라 받는 영향의 방향과 크기가 달라질 수 있어요.',
    ],
    lifeExamples: [
      { situation: '장보기를 할 때', impact: '환율이나 원자재 가격 변화가 수입 재료를 쓰는 식품·생필품 가격에 시차를 두고 반영될 수 있어요.' },
      { situation: '월급을 받을 때', impact: '경기와 기업 실적에 따라 임금 인상 폭이나 채용 규모가 달라질 수 있어요.' },
      { situation: '대출을 갚을 때', impact: '기준금리 변화가 시장금리를 거쳐 변동금리 대출의 이자 부담에 영향을 줄 수 있어요.' },
    ],
    myths: [
      {
        myth: '경제지표 하나만 보면 지금 경제 상황을 알 수 있다?',
        correction: '금리·물가·고용 같은 지표는 서로 다른 것을 보여주기 때문에, 하나의 지표만으로 전체 경제 상황이나 내 생활에 대한 영향을 단정하기는 어려워요.',
      },
    ],
    checkItems: ['최근에 본 경제 뉴스가 나의 소비·소득·대출 중 어디에 영향을 줄 수 있는지 떠올려보기', '그 영향이 바로 나타날지, 시간이 걸릴지 생각해보기'],
  },

  'life-economy-base-rate': {
    todayQuestion: '기준금리가 올랐다는 뉴스를 보면, 내 대출과 예금은 어떻게 달라질까요?',
    quickAnswer:
      '기준금리가 오르면 은행의 예금·대출 금리도 대체로 함께 오르는 경향이 있어서, 대출이 있는 사람은 이자 부담이 커지고 예금이 있는 사람은 이자 수익이 늘어날 수 있어요. 다만 그 정도와 시점은 대출 종류(고정·변동금리)와 개별 상품마다 달라요.',
    transmissionPath: [
      '기준금리 인상',
      '시장금리·예금·대출금리 상승',
      '가계 이자 부담 변화',
      '기업 투자·채용 조정',
      '소비와 물가에 시차를 둔 영향',
    ],
    whyItHappens: [
      '기준금리는 은행 간 자금 거래의 기준이 되는 정책금리라서, 이 금리가 바뀌면 은행들이 고객에게 제시하는 예금·대출 금리도 대체로 같은 방향으로 움직이는 경향이 있어요.',
      '대출금리가 오르면 변동금리 대출을 쓰는 가계의 이자 부담이 곧바로 늘어날 수 있지만, 고정금리 대출은 계약 기간 동안 영향을 받지 않아요.',
      '기업 입장에서는 돈을 빌리는 비용이 늘어나 신규 투자나 채용을 줄이는 방향으로 움직일 수 있는데, 이 영향은 대출 결정 직후가 아니라 몇 달에서 1년 이상 시차를 두고 나타나는 경우가 많아요.',
      '물가에 미치는 영향도 소비와 투자가 줄어드는 과정을 거쳐야 나타나기 때문에 즉각적이지 않고, 다른 요인(환율, 원자재 가격 등)과 함께 작용해요.',
    ],
    lifeExamples: [
      { situation: '주택담보대출이 있다면', impact: '변동금리라면 다음 금리 조정일부터 매달 갚는 이자가 늘어날 수 있어요.' },
      { situation: '전세대출이 있다면', impact: '대부분 변동금리로 실행되는 경우가 많아, 기준금리 변화가 이자 부담에 비교적 빠르게 반영될 수 있어요.' },
      { situation: '예금·적금을 가지고 있다면', impact: '새로 나오는 예금·적금 상품의 금리가 오르는 경향이 있어요.' },
      { situation: '취업을 준비 중이라면', impact: '기업들이 자금 조달 비용 부담으로 신규채용을 조정할 수 있어, 채용 시장 분위기가 달라질 수 있어요.' },
    ],
    audienceComparisons: [{ groupA: '대출자', groupAImpact: '이자 부담이 커질 수 있어요.', groupB: '예금자', groupBImpact: '이자 수익이 늘어날 수 있어요.' }],
    myths: [
      {
        myth: '기준금리가 오르면 모든 물가가 즉시 내려간다?',
        correction: '기준금리 인상이 물가에 영향을 주기까지는 소비와 투자가 줄어드는 과정을 거쳐야 해서 시차가 있고, 물가는 금리 외에도 환율·원자재 가격 같은 다른 요인의 영향을 함께 받아요.',
      },
    ],
    checkItems: ['내 대출이 고정금리인지 변동금리인지 확인하기', '변동금리라면 다음 금리 조정일이 언제인지 확인하기', '예금·적금 만기가 돌아오면 새 금리 조건을 비교해보기'],
  },

  'life-economy-exchange-rate': {
    todayQuestion: '환율이 올랐다는데 왜 빵과 기름값도 달라질까요?',
    quickAnswer:
      '원화 가치가 낮아지면(환율 상승) 해외에서 원자재나 부품을 사올 때 같은 양을 사는 데 더 많은 원화가 필요해져요. 이 늘어난 비용이 기업의 생산비를 거쳐 일부 상품·서비스 가격에 시차를 두고 반영될 수 있어요.',
    transmissionPath: [
      '원화 가치 하락(환율 상승)',
      '수입 원자재·부품 비용 상승',
      '기업 생산비 상승',
      '일부 상품·서비스 가격 반영',
      '가계 생활비 변화',
    ],
    whyItHappens: [
      '환율이 오르면(원화 약세) 원유, 곡물, 부품처럼 해외에서 수입하는 물건을 사올 때 같은 외화 금액이라도 더 많은 원화가 필요해져요.',
      '기업은 늘어난 수입 비용을 그대로 떠안기도 하고, 상품 가격에 일부 반영하기도 하는데, 어느 쪽을 택할지는 업종과 경쟁 상황에 따라 다르고, 가격에 반영되기까지도 시차가 있어요.',
      '반대로 수출기업은 같은 양의 제품을 해외에 팔았을 때 원화로 환산한 매출이 늘어날 수 있지만, 수입 원자재나 외화 부채가 많은 기업이라면 환율 상승이 오히려 비용 부담으로 작용할 수 있어요.',
      '해외여행·유학·해외직구처럼 개인이 직접 외화를 쓰는 경우는 환율 변화가 결제 시점에 거의 바로 반영돼요.',
    ],
    lifeExamples: [
      { situation: '해외여행이나 해외직구를 할 때', impact: '환율이 오르면 같은 물건이라도 원화로 환산한 결제 금액이 늘어나요.' },
      { situation: '유학 자금을 보낼 때', impact: '환율에 따라 같은 원화로 보낼 수 있는 외화 금액이 달라져요.' },
      { situation: '장보기를 할 때', impact: '수입 곡물·원자재를 많이 쓰는 가공식품·외식 가격에 환율 변화가 시차를 두고 반영될 수 있어요.' },
      { situation: '해외자산을 갖고 있다면', impact: '해외 주식·외화예금의 원화 환산 가치가 환율에 따라 달라질 수 있어요.' },
    ],
    audienceComparisons: [
      { groupA: '수출기업', groupAImpact: '원화 환산 매출이 늘어날 수 있지만, 수입 원자재 비중이 크면 비용 부담도 함께 커질 수 있어요.', groupB: '수입기업', groupBImpact: '수입 비용 부담이 커지는 경향이 있어요.' },
    ],
    myths: [
      {
        myth: '환율이 오르면 모든 수출기업에 유리하다?',
        correction: '수입 원재료와 외화부채가 많은 기업은 환율이 올라도 비용 부담이 함께 커질 수 있어요.',
      },
    ],
    checkItems: ['해외 결제나 외화 지출 계획이 있는지 확인하기', '해외자산을 갖고 있다면 환율 변화가 원화 환산 가치에 어떻게 반영되는지 살펴보기'],
  },

  'life-economy-oil-price': {
    todayQuestion: '국제유가가 올랐다는 뉴스는 왜 기름값뿐 아니라 다른 물가에도 영향을 줄까요?',
    quickAnswer:
      '원유는 연료로도 쓰이지만 플라스틱·화학제품 같은 여러 산업의 원료이기도 해서, 국제유가가 오르면 연료비뿐 아니라 운송비·생산비 전반에 영향을 줄 수 있어요. 다만 국내 주유소 가격은 국제유가와 정확히 같은 시점에 같은 비율로 움직이지는 않아요.',
    transmissionPath: [
      '국제유가 상승',
      '원유 수입 비용 상승(환율 영향도 함께)',
      '정유·유통 과정을 거친 국내 판매가 반영',
      '운송비·생산비 상승',
      '여러 상품·서비스 가격에 확산',
    ],
    whyItHappens: [
      '원유는 휘발유·경유 같은 연료뿐 아니라 플라스틱, 화학제품 등 여러 산업의 원료로도 쓰여서, 국제유가 변화가 넓은 범위의 생산비에 영향을 줄 수 있어요.',
      '원유는 대부분 달러로 거래되기 때문에, 국제유가뿐 아니라 원/달러 환율도 국내 수입 비용에 함께 영향을 줘요.',
      '국내 주유소 가격은 국제유가에 정유·유통 비용, 유류세가 더해지고, 기존에 들여온 재고 물량이 소진되는 데 걸리는 시간까지 겹쳐서, 국제유가와 정확히 같은 시점·같은 비율로 움직이지 않는 경우가 많아요.',
      '운송·항공처럼 연료비 비중이 큰 업종은 유가 변화의 영향을 비교적 빠르게 받는 반면, 최종 소비재 가격에 반영되기까지는 시차가 더 클 수 있어요.',
    ],
    lifeExamples: [
      { situation: '차로 출퇴근한다면', impact: '주유비 부담이 국제유가와 환율 변화에 따라 달라질 수 있어요.' },
      { situation: '택배·배달을 자주 이용한다면', impact: '운송업체의 연료비 부담이 배송비에 시차를 두고 반영될 수 있어요.' },
      { situation: '겨울철 난방을 한다면', impact: '난방용 연료 비용이 국제유가 흐름의 영향을 받을 수 있어요.' },
      { situation: '플라스틱·화학제품이 들어간 생필품을 살 때', impact: '원료비 상승이 시차를 두고 제품 가격에 반영될 수 있어요.' },
    ],
    myths: [
      {
        myth: '국제유가가 오르면 국내 주유소 가격도 그 즉시 같은 비율로 오른다?',
        correction: '환율, 유류세, 정제·유통비용, 기존 재고 소진 시점 등이 겹쳐 국내 가격은 국제유가와 다른 시점·다른 폭으로 움직일 수 있어요.',
      },
    ],
    checkItems: ['자동차 이용 빈도와 연료비 지출 비중을 확인해보기', '난방·전기 요금 중 에너지 가격에 민감한 항목이 있는지 살펴보기'],
  },

  'life-economy-grain-price': {
    todayQuestion: '가뭄이나 전쟁 뉴스가 왜 우리 집 식탁 물가에까지 영향을 줄까요?',
    quickAnswer:
      '밀·옥수수·콩 같은 주요 곡물은 세계 여러 나라가 서로 사고파는 국제 상품이라, 특정 지역의 가뭄이나 분쟁, 수출 제한이 국제 곡물 가격을 끌어올리면 그 영향이 사료·식용유·가공식품 원가를 거쳐 장보기와 외식비에까지 이어질 수 있어요.',
    transmissionPath: [
      '가뭄·분쟁·수출 제한 등',
      '국제 곡물 공급 감소',
      '곡물·사료 가격 상승',
      '가공식품·축산물 원가 상승',
      '장보기·외식비 영향',
    ],
    whyItHappens: [
      '밀, 옥수수, 콩, 쌀 같은 주요 곡물은 몇몇 국가가 대규모로 생산해 세계 여러 나라로 수출하는 구조라, 그 나라의 날씨나 정세가 국제 가격에 영향을 줄 수 있어요.',
      '가뭄·홍수 같은 기상이변, 전쟁 등 국제분쟁, 주요 생산국의 수출 제한 조치는 각각 다른 경로로 공급을 줄여 가격 상승 압력을 만들 수 있어요.',
      '운송비와 환율도 수입 곡물 가격에 함께 영향을 줘서, 국제 곡물 가격이 같더라도 운송비나 환율 상황에 따라 국내 수입 비용은 달라질 수 있어요.',
      '곡물 가격 상승은 밀가루·식용유 같은 가공식품 원가뿐 아니라, 곡물을 사료로 쓰는 축산물(육류·달걀·유제품) 가격에도 시차를 두고 영향을 줄 수 있어요.',
    ],
    lifeExamples: [
      { situation: '장보기를 할 때', impact: '밀가루·식용유가 들어간 가공식품, 육류·달걀·유제품 가격이 시차를 두고 오를 수 있어요.' },
      { situation: '외식을 할 때', impact: '식당의 재료비 부담이 늘어나면 메뉴 가격에 반영될 수 있어요.' },
      { situation: '저소득 가구라면', impact: '전체 생활비에서 식료품이 차지하는 비중이 상대적으로 커서, 식료품 물가 변화에 더 크게 영향받을 수 있어요.' },
    ],
    myths: [
      {
        myth: '식료품 물가 상승은 항상 한 가지 사건 때문에 일어난다?',
        correction: '날씨, 분쟁, 수출 제한, 운송비, 환율 등 여러 요인이 겹쳐서 나타나는 경우가 많아 한 가지 사건만으로 전체 흐름을 설명하기는 어려워요.',
      },
    ],
    checkItems: ['식료품·외식비가 전체 생활비에서 차지하는 비중을 확인해보기', '자주 사는 가공식품에 밀가루·식용유가 주재료로 들어가는지 살펴보기'],
  },

  'life-economy-tax-policy': {
    todayQuestion: '세금이 바뀌면 정확히 내 지갑의 어디에서, 어떻게 영향을 느끼게 될까요?',
    quickAnswer:
      '소득세는 내가 실제로 쓸 수 있는 소득(가처분소득)에, 부가가치세 같은 소비 관련 세금은 물건 가격에, 유류세는 기름값과 물류비에 각각 다른 경로로 영향을 줘요. 세금이 늘거나 줄면 정부가 쓸 수 있는 재원도 함께 달라져요.',
    transmissionPath: [
      '세금·세율 변경',
      '가계의 가처분소득 또는 상품가격 변화',
      '소비·저축 행동 변화',
      '정부 재원(세수) 변화',
      '공공서비스·지원정책 변화',
    ],
    whyItHappens: [
      '소득세는 벌어들인 소득에서 직접 걷혀 가처분소득(실제로 쓸 수 있는 돈)을 줄이는 방식으로 영향을 주고, 부가가치세 같은 소비 관련 세금은 상품·서비스 가격에 포함되어 소비할 때마다 영향을 줘요.',
      '유류세는 기름값에 바로 반영되고, 이는 다시 운송·물류비를 거쳐 여러 상품 가격에 간접적으로 영향을 줄 수 있어요.',
      '세액공제·소득공제나 지원금·보조금은 반대로 가계의 실질 소득을 늘려주는 방향으로 작용해, 소비나 저축 여력에 영향을 줄 수 있어요.',
      '세금은 가격이나 임금 협상 과정에서 일부가 다른 쪽(소비자나 근로자)에 전가될 가능성도 있다고 설명되며, 세수는 도로·교육·의료 같은 공공서비스의 재원이 되므로 세금을 줄이면 그만큼 재원 마련 방법도 함께 고민해야 해요.',
    ],
    lifeExamples: [
      { situation: '급여명세서를 볼 때', impact: '소득세·사회보험료가 원천징수되어 실수령액이 정해져요.' },
      { situation: '주유할 때', impact: '유류세가 기름값에 포함되어 있어요.' },
      { situation: '물건을 살 때', impact: '가격에 부가가치세가 포함되어 있는 경우가 많아요.' },
      { situation: '연말정산을 할 때', impact: '소득공제·세액공제 항목에 따라 실제로 내는 세금이 달라져요.' },
    ],
    myths: [
      {
        myth: '감세는 항상 좋고 증세는 항상 나쁘다?',
        correction: '감세는 가계·기업의 여유자금을 늘릴 수 있지만 정부 재원이 줄어들 수 있고, 증세는 재원을 늘릴 수 있지만 가계·기업의 부담이 커질 수 있어요. 어느 쪽이든 편익과 비용이 함께 따라와요.',
      },
    ],
    checkItems: ['급여명세서에서 세금·사회보험료로 얼마가 빠지는지 확인해보기', '올해 받을 수 있는 소득공제·세액공제 항목이 있는지 살펴보기'],
  },

  'life-economy-wage-inflation': {
    todayQuestion: '뉴스에서 물가가 많이 올랐다는데, 왜 내 월급은 그만큼 바로 오르지 않을까요?',
    quickAnswer:
      '월급(명목임금)이 올라도 물가가 그보다 더 많이 오르면, 실제로 살 수 있는 양(실질임금·구매력)은 오히려 줄어들 수 있어요. 임금은 보통 계약이나 협상 주기에 따라 정해지기 때문에 물가 변화에 바로 반응하지 않는 경우가 많아요.',
    transmissionPath: [
      '물가 상승',
      '기업의 비용·이익 변화',
      '임금 협상·계약 시점 도래',
      '명목임금 조정',
      '실질임금(구매력) 변화',
    ],
    whyItHappens: [
      '명목임금은 통장에 찍히는 금액 그대로의 임금이고, 실질임금은 그 금액으로 실제 살 수 있는 양을 물가로 나눠본 개념이에요. 물가상승률이 임금 인상률보다 높으면 명목임금은 늘어도 실질임금은 줄어들 수 있어요.',
      '임금은 보통 연간 협상이나 계약 갱신 시점에 정해지기 때문에, 물가가 오르는 시점과 임금이 조정되는 시점 사이에 시차가 생겨요.',
      '기업 입장에서는 물가 상승으로 비용이 늘면 이익이 줄어들 수 있어, 임금 인상 여력도 함께 영향을 받을 수 있어요. 다만 생산성이 오르는 기업은 물가 상승분 이상으로 임금을 올릴 여력이 있을 수도 있어요.',
      '정규직과 비정규직, 근로자와 자영업자는 임금·소득이 정해지는 방식과 협상력이 달라서, 같은 물가 상승이라도 실질 구매력에 받는 영향의 크기가 다를 수 있어요.',
    ],
    lifeExamples: [
      { situation: '월급을 받는 직장인이라면', impact: '명목 월급이 올라도 생활비 상승분이 더 크면 실질 구매력은 줄어들 수 있어요.' },
      { situation: '자영업을 한다면', impact: '재료비·인건비 상승이 소득에 바로 영향을 줄 수 있고, 가격 인상 여부는 스스로 결정해야 해요.' },
      { situation: '저축 계획을 세울 때', impact: '물가상승률을 고려하지 않으면 저축한 돈의 실질 가치가 예상보다 줄어들 수 있어요.' },
    ],
    audienceComparisons: [
      { groupA: '정규직·고정소득자', groupAImpact: '임금 협상 주기에 따라 물가 반영 시차가 있지만 비교적 예측 가능해요.', groupB: '비정규직·자영업자', groupBImpact: '소득이 매출·계약 상황에 더 직접적으로 좌우돼 물가 변화의 영향을 다르게 받을 수 있어요.' },
    ],
    myths: [
      {
        myth: '물가가 오르면 월급도 항상 같은 비율로 오른다?',
        correction: '임금은 협상·계약 주기, 기업의 지불 여력, 생산성 등 여러 요인에 따라 정해져서 물가 상승률과 항상 같이 움직이지는 않아요.',
      },
    ],
    checkItems: ['최근 몇 년간 내 소득 증가율과 생활비 증가 체감을 비교해보기', '저축·투자 계획에 물가상승률을 함께 고려하고 있는지 확인해보기'],
  },

  'life-economy-recession-jobs': {
    todayQuestion: '경기가 나빠졌다는 뉴스가 나오면, 취업 준비나 회사 생활에는 어떤 영향이 있을까요?',
    quickAnswer:
      '소비가 줄면 기업의 매출과 재고 상황이 나빠지고, 이는 투자와 채용을 줄이는 방향으로 이어질 수 있어요. 이 흐름은 업종마다 속도와 크기가 다르고, 소득이 다시 줄어드는 악순환으로 이어질 수도 있어요.',
    transmissionPath: [
      '소비 감소',
      '기업 매출·재고 악화',
      '생산·투자 축소',
      '채용·소득 감소',
      '소비가 다시 줄어들 가능성',
    ],
    whyItHappens: [
      '가계 소비가 줄면 기업의 매출이 줄고 재고가 쌓이는데, 기업은 이에 대응해 생산과 신규 투자를 줄이는 경우가 많아요.',
      '투자와 생산이 줄면 기업은 신규채용을 줄이거나 기존 인력 조정을 검토할 수 있고, 이는 다시 가계 소득과 소비 여력을 줄여 경기 둔화가 이어지는 흐름으로 연결될 수 있어요.',
      '경기와 고용 사이에는 시차가 있어서, 경기가 나빠졌다고 바로 대규모 실업이 나타나는 것은 아니고, 채용 축소나 성과급 감소처럼 완만한 형태로 먼저 나타나는 경우가 많아요.',
      '제조업·수출업처럼 경기에 민감한 업종과, 필수 소비재처럼 상대적으로 덜 민감한 업종은 같은 경기침체에도 받는 영향의 크기가 다를 수 있어요. GDP 같은 전체 지표와 개인이 느끼는 체감경기가 다를 수 있는 것도 이 때문이에요.',
    ],
    lifeExamples: [
      { situation: '취업을 준비 중이라면', impact: '기업들의 신규채용 규모가 줄어드는 시기와 맞물릴 수 있어요.' },
      { situation: '회사에 다니고 있다면', impact: '성과급이나 임금 인상 폭이 줄어들 수 있어요.' },
      { situation: '자영업을 한다면', impact: '손님이 줄어 매출이 감소할 수 있어요.' },
      { situation: '대출이 있다면', impact: '소득이 줄어드는 시기에는 상환 계획을 다시 점검해볼 필요가 있어요.' },
    ],
    myths: [
      {
        myth: '경기침체는 모든 업종과 사람에게 똑같이 나타난다?',
        correction: '업종별로 경기에 민감한 정도가 다르고, 고용 형태·소득 구조에 따라 받는 영향의 크기와 시점이 달라질 수 있어요.',
      },
    ],
    checkItems: ['내가 속한 업종이 경기 변화에 민감한 편인지 생각해보기', '소득이 줄어드는 상황에 대비한 비상자금이 있는지 확인해보기'],
  },

  'life-economy-housing': {
    todayQuestion: '집값이나 전세금은 도대체 무엇 때문에 오르내리는 걸까요?',
    quickAnswer:
      '집값과 전세·월세는 금리, 대출 가능 규모, 공급량, 인구·일자리 분포, 세금·규제, 사람들의 기대심리 같은 여러 요인이 함께 작용해 움직여요. 어느 한 가지 정책이나 요인만으로 방향이 정해진다고 보기는 어려워요.',
    transmissionPath: [
      '금리·대출 조건 변화',
      '대출 가능 규모와 자금 여력 변화',
      '주택 수요·공급 변화',
      '매매·전세 가격 변화',
      '월세 전환 등 주거비 구조 변화',
    ],
    whyItHappens: [
      '기준금리가 낮아지면 대출 이자 부담이 줄어 대출을 더 받을 여력이 생기는 경향이 있고, 반대로 금리가 오르면 대출 여력이 줄어드는 경향이 있어요. 다만 집값은 금리 외에도 여러 요인이 함께 작용해요.',
      '주택 공급량, 인구와 가구 수 변화, 지역별 일자리·교통·교육 환경은 특정 지역의 수요와 공급에 영향을 줘서 지역별로 가격 움직임이 다르게 나타날 수 있어요.',
      '전세 제도는 목돈을 맡기고 그 이자 성격의 이익을 집주인이 얻는 한국 특유의 구조라, 금리가 오르면 전세보다 월세를 선호하는 집주인이 늘어나는 등 월세 전환이 나타날 수 있다고 설명돼요.',
      '세금·규제 정책과 앞으로 가격이 오르내릴 것이라는 사람들의 기대심리도 실제 거래에 영향을 줄 수 있어, 특정 정책 하나가 집값의 방향을 항상 결정짓는다고 보기는 어려워요.',
    ],
    lifeExamples: [
      { situation: '집을 사기 위해 주택담보대출을 알아본다면', impact: '금리 수준에 따라 대출 가능 금액과 매달 상환 부담이 달라져요.' },
      { situation: '전세로 살고 있다면', impact: '전세대출 금리와 계약 만료 시 보증금 반환 여부를 함께 고려하게 돼요.' },
      { situation: '월세로 살고 있다면', impact: '전세 대비 월세 비중이 어떻게 형성되는지에 따라 매달 주거비 부담이 달라져요.' },
      { situation: '이사를 계획 중이라면', impact: '지역별 가격 차이와 대출 가능 규모를 함께 따져보게 돼요.' },
    ],
    audienceComparisons: [
      { groupA: '무주택자', groupAImpact: '집값·전세금 변화가 내 집 마련 계획과 주거비 부담에 직접 영향을 줘요.', groupB: '주택보유자', groupBImpact: '보유 주택의 평가 가치와 대출 상환 부담이 함께 달라질 수 있어요.' },
    ],
    myths: [
      {
        myth: '금리가 내리면 집값이 반드시 오른다?',
        correction: '금리는 집값에 영향을 주는 여러 요인 중 하나일 뿐이고, 공급량·인구·지역 여건·정책·심리 등이 함께 작용하기 때문에 금리 하나만으로 집값의 방향을 단정할 수 없어요.',
      },
    ],
    checkItems: ['내 대출(주택담보대출·전세대출)이 고정금리인지 변동금리인지 확인하기', '전세로 산다면 보증금 반환 관련 안전장치를 확인해보기', '주거비가 전체 생활비에서 차지하는 비중을 점검해보기'],
  },

  'life-economy-reading-news': {
    todayQuestion: '경제 뉴스를 볼 때마다 헷갈리는데, 어떤 순서로 읽으면 도움이 될까요?',
    quickAnswer:
      '무엇이 바뀌었는지, 무엇과 비교한 수치인지, 사실과 전망이 구분되어 있는지부터 확인하고, 그다음 누구에게 어떤 경로로 얼마나 걸려 영향을 주는지, 반대로 작용하는 요인은 없는지까지 순서대로 짚어보면 뉴스를 내 생활의 언어로 옮기기 쉬워져요.',
    transmissionPath: [
      '무엇이 바뀌었나 확인',
      '기준일·비교 대상 확인',
      '사실과 전망 구분',
      '영향받는 대상과 경로 확인',
      '내 생활 반영 여부 판단',
    ],
    whyItHappens: [
      '경제 뉴스는 숫자와 전문용어가 많아 한 번에 이해하기 어렵지만, 정해진 순서로 짚어보면 핵심을 놓치지 않을 수 있어요: ①정확히 무엇이 변했나 ②기준일과 비교 대상은 무엇인가 ③사실과 전망이 구분되어 있는가 ④왜 변했다고 설명하는가 ⑤누구에게 직접 영향을 주는가 ⑥어떤 경로로 내 생활에 오는가 ⑦영향이 나타나는 데 얼마나 걸리는가 ⑧반대 방향으로 작용하는 요인은 무엇인가 ⑨내가 공식 자료에서 확인할 것은 무엇인가.',
      '"전월비"인지 "전년동월비"인지에 따라 같은 숫자도 다른 의미를 가질 수 있어서, 비교 기준을 확인하는 것이 중요해요.',
      '뉴스에는 이미 발표된 사실과, 전문가나 기관의 전망·예측이 섞여 나오는 경우가 많아 이 둘을 구분해서 읽는 습관이 도움이 돼요.',
      '앞선 과정들에서 살펴본 기준금리·환율·유가·곡물·세금·임금·경기·주택 관련 뉴스도 모두 이 순서로 다시 읽어볼 수 있어요.',
    ],
    lifeExamples: [
      { situation: '기준금리 인상 뉴스를 볼 때', impact: '내 대출·예금 금리에 영향을 줄 수 있는 통로인지 확인해볼 수 있어요.' },
      { situation: '환율 급등 뉴스를 볼 때', impact: '해외 결제나 수입 물가에 영향을 줄 수 있는지 확인해볼 수 있어요.' },
      { situation: '실업률·물가 발표 뉴스를 볼 때', impact: '전월비인지 전년동월비인지부터 확인하면 숫자의 의미를 더 정확히 이해할 수 있어요.' },
    ],
    myths: [
      {
        myth: '경제 뉴스의 숫자 하나만 보면 전체 상황을 알 수 있다?',
        correction: '기준일·비교 대상·사실과 전망의 구분을 함께 확인해야 숫자 하나가 실제로 무엇을 의미하는지 더 정확히 이해할 수 있어요.',
      },
    ],
    checkItems: ['다음에 보는 경제 뉴스에서 기준일과 비교 대상이 무엇인지 찾아보기', '그 뉴스가 사실을 전하는지 전망을 전하는지 구분해보기'],
    closingCta: { label: '재무 브리핑에서 확인하기', to: '/learn/briefing' },
  },

  'life-economy-stock-market': {
    todayQuestion: '경기가 안 좋다는 뉴스가 나오는데 주가는 오히려 오르기도 하던데, 왜 그럴까요?',
    quickAnswer:
      '주가는 지금 당장의 실적뿐 아니라 앞으로에 대한 기대, 금리 수준, 시장에 풀린 자금 같은 여러 요소를 함께 반영해서 정해져요. 그래서 실물경제 상황과 주가지수가 항상 같은 방향으로 움직이지는 않아요.',
    transmissionPath: [
      '현재 기업실적 + 미래 실적 기대',
      '금리와 위험 인식',
      '시장에 풀린 자금(유동성)',
      '투자자들의 매수·매도 판단',
      '현재 주가에 반영',
    ],
    whyItHappens: [
      '주가는 기업의 현재 실적뿐 아니라 앞으로의 실적에 대한 시장의 기대를 함께 반영한다고 설명돼요. 그래서 지금 경기가 나빠도 "앞으로 나아질 것"이라는 기대가 강하면 주가가 오를 수 있고, 반대로 지금 경기가 좋아도 이미 좋은 소식이 가격에 반영됐거나 앞으로 나빠질 것이라는 기대가 있으면 주가가 내릴 수 있어요.',
      '금리는 기업가치를 평가할 때 미래에 벌어들일 돈의 현재 가치를 계산하는 데 쓰이는데(할인율), 금리가 낮아지면 같은 미래 이익이라도 현재가치로 환산했을 때 더 커 보이는 경향이 있어, 주가에 영향을 줄 수 있다고 설명돼요.',
      '시장에 자금이 풍부하게 풀려 있는지(유동성)와 투자자들이 위험을 어떻게 인식하는지도 주가에 영향을 줘요. 같은 경제 상황이라도 투자 심리에 따라 주가 반응이 달라질 수 있어요.',
      '환율도 수출기업과 수입기업의 예상 실적에 다르게 영향을 줘서 개별 기업 주가에 영향을 줄 수 있고, 주가지수(시장 전체 평균)와 개별 종목, 그리고 개인이 체감하는 경기는 서로 다른 것을 나타낸다는 점도 함께 이해해두면 도움이 돼요.',
    ],
    lifeExamples: [
      { situation: '뉴스에서 주가지수 움직임을 볼 때', impact: '주가지수는 시장 전체의 평균적인 움직임을 보여줄 뿐, 개별 기업이나 내가 체감하는 경기와 항상 같지는 않다는 점을 참고할 수 있어요.' },
      { situation: '투자 상품에 가입했거나 가입을 고민 중이라면', impact: '단기 주가 변동이 기업의 장기 가치와 다를 수 있다는 점을 함께 고려해볼 수 있어요.' },
      { situation: '경제 뉴스를 볼 때', impact: '"실적이 좋다"는 소식과 "주가가 오른다"는 소식이 항상 같은 시점에 나타나지 않을 수 있다는 점을 참고할 수 있어요.' },
    ],
    myths: [
      {
        myth: '금리가 내리면 주가는 반드시 오른다?',
        correction: '금리는 주가에 영향을 주는 여러 요소 중 하나일 뿐이라, 기업실적·투자심리·환율 등 다른 요인에 따라 결과가 달라질 수 있어요.',
      },
      {
        myth: '경제성장률이 높으면 주가지수도 반드시 오른다?',
        correction: '주가는 미래에 대한 기대를 이미 반영하고 있는 경우가 많아, 실제 성장률 발표 시점에는 다르게 반응할 수 있어요.',
      },
    ],
    checkItems: ['투자 상품에 가입했다면 단기 가격 변동과 장기 목표를 구분해서 보고 있는지 점검해보기', '뉴스의 주가 관련 소식이 사실(이미 일어난 일)인지 전망(앞으로에 대한 기대)인지 구분해보기'],
  },

  'life-economy-government-finance': {
    todayQuestion: '정부가 돈을 많이 쓰거나 세금을 걷는 게 내 생활과 무슨 상관이 있을까요?',
    quickAnswer:
      '정부지출은 지원금·공공일자리·사회간접자본 같은 형태로 가계와 기업에 자금을 공급해 소비·고용을 뒷받침할 수 있지만, 그만큼 재정적자나 국가부채가 늘어날 수도 있어요. 정부재정은 지금 세대와 미래 세대가 함께 나눠 지는 비용과 편익의 문제로 이해할 수 있어요.',
    transmissionPath: [
      '정부지출 확대(또는 세금 조정)',
      '가계·기업·기관에 자금 공급',
      '소비·고용·투자 영향',
      '경기 방어 효과',
      '재정적자·국가부채 변화',
    ],
    whyItHappens: [
      '정부는 세금으로 수입을 얻고, 이를 지원금·실업급여·복지서비스·교육·의료 예산·사회간접자본(도로·철도 등)·공공일자리 형태로 지출해요. 이 지출은 가계 소득과 기업 매출로 이어져 소비·고용에 영향을 줄 수 있어요.',
      '경기침체기에 정부지출을 늘리면 소비와 고용을 뒷받침하는 방어 효과가 있을 수 있지만, 이미 경기가 과열된 상태에서 지출을 더 늘리면 물가 상승 부담을 키울 수도 있어요.',
      '정부가 지출을 수입보다 많이 하면 재정적자가 생기고, 이를 메우기 위해 국채를 발행하면 국가부채가 늘어나요. 국채금리가 오르면 정부가 갚아야 할 이자 부담도 함께 커질 수 있어요.',
      '국가부채는 가계부채와 성격이 달라요 — 정부는 세금을 걷을 수 있는 지속적인 권한과 자국 통화 발행 능력 같은 가계와 다른 조건을 갖고 있지만(다만 통화 발행을 남용하면 물가 부담으로 이어질 수 있어요), 그렇다고 부채를 무한정 늘려도 된다는 뜻은 아니며, 지금 지출한 비용의 일부는 미래 세대의 부담으로 남을 수 있어요.',
    ],
    lifeExamples: [
      { situation: '경기침체기에 지원금이나 고용지원 정책이 시행될 때', impact: '가계 소비 여력이나 구직 지원에 직접적인 도움이 될 수 있어요.' },
      { situation: '실업 상태일 때', impact: '실업급여 같은 사회안전망이 소득 공백을 일부 메워줄 수 있어요.' },
      { situation: '자녀 교육이나 의료 서비스를 이용할 때', impact: '교육·의료 예산이 공공서비스의 질과 비용 부담에 영향을 줘요.' },
      { situation: '국채금리 관련 뉴스를 볼 때', impact: '국채금리가 오르면 정부의 이자 부담이 커지고, 이는 장기적으로 재정 운용 여력에 영향을 줄 수 있어요.' },
    ],
    myths: [
      {
        myth: '국가부채가 늘면 국가가 바로 파산한다?',
        correction: '정부는 세금을 걷을 지속적인 권한이 있고 가계와는 다른 조건에서 부채를 운용하기 때문에, 국가부채 증가가 곧바로 파산으로 이어진다고 단정할 수는 없어요. 다만 부채 상환·이자 부담이 계속 커지면 재정 운용의 부담이 커질 수 있어요.',
      },
      {
        myth: '정부지출은 늘리기만 하면 경제에 항상 좋다?',
        correction: '경기침체기에는 소비·고용을 뒷받침하는 효과가 있을 수 있지만, 경기가 이미 과열된 상태에서 지출을 늘리면 물가 부담을 키울 수 있어, 시기와 상황에 따라 효과와 비용이 달라져요.',
      },
    ],
    checkItems: ['최근 정부 지원정책이나 세제 변화가 내 생활과 어떤 경로로 연결되는지 생각해보기', '국채금리·재정적자 관련 뉴스를 볼 때 지금 세대와 미래 세대에 미치는 영향을 함께 생각해보기'],
  },
}
