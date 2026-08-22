import { useToast } from '../../components/toast/useToast'
import { transactionsRepo } from '../../db'

export function useDeleteTransactionWithUndo(onChange?: () => void) {
  const { showToast } = useToast()

  return async function remove(id: string) {
    const removed = await transactionsRepo.deleteTransaction(id)
    if (!removed) return
    onChange?.()
    showToast({
      message: '삭제되었습니다.',
      actionLabel: '실행취소',
      durationMs: 5000,
      onAction: async () => {
        await transactionsRepo.restoreTransaction(removed)
        onChange?.()
      },
    })
  }
}
