import type { Category, Transaction } from '../../types/models'
import { toCsvLine } from './csv'

const CSV_HEADER = [
  'date',
  'time',
  'type',
  'category',
  'amount',
  'memo',
  'paymentMethod',
  'sourceId',
]

export function buildTransactionsCsv(transactions: Transaction[], categories: Category[]): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
  const lines = [toCsvLine(CSV_HEADER)]

  for (const t of [...transactions].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  )) {
    lines.push(
      toCsvLine([
        t.date,
        t.time,
        t.type,
        categoryMap.get(t.categoryId) ?? '',
        String(t.amount),
        t.memo ?? '',
        t.paymentMethod ?? '',
        t.id,
      ]),
    )
  }

  return lines.join('\n')
}
