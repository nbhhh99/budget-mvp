import { v4 as uuidv4 } from 'uuid'
import type { Category, CategoryGroup } from '../types/models'
import { CATEGORY_PALETTE } from '../constants/palette'

const FIXED_EXPENSE_NAMES = new Set(['이자', '관리비·주차비', '월세', '보험', '구독비', '통신비'])

function makeCategory(group: CategoryGroup, name: string, order: number): Category {
  return {
    id: uuidv4(),
    group,
    name,
    order,
    color: CATEGORY_PALETTE[order % CATEGORY_PALETTE.length],
    hidden: false,
    isFixed: group === 'expense' ? FIXED_EXPENSE_NAMES.has(name) : undefined,
    createdAt: new Date().toISOString(),
  }
}

const INCOME_NAMES = ['급여', '부수입', '용돈', '환급', '기타']

const EXPENSE_NAMES = [
  '이자',
  '관리비·주차비',
  '월세',
  '보험',
  '교통',
  '구독비',
  '통신비',
  '식비',
  '카페·간식',
  '생활용품',
  '쇼핑',
  '의료·건강',
  '운동',
  '문화·여가',
  '교육',
  '경조사·약속·선물',
  '데이트',
  '기타',
]

const SAVING_NAMES = ['예금·적금', '주식', 'ISA', '코인', 'CMA', 'AXA', 'IBKR', '기타 투자']

const TRANSFER_NAMES = ['카드대금', '계좌이체', '기타']

export function buildDefaultCategories(): Category[] {
  return [
    ...INCOME_NAMES.map((name, i) => makeCategory('income', name, i)),
    ...EXPENSE_NAMES.map((name, i) => makeCategory('expense', name, i)),
    ...SAVING_NAMES.map((name, i) => makeCategory('saving', name, i)),
    ...TRANSFER_NAMES.map((name, i) => makeCategory('transfer', name, i)),
  ]
}
