/**
 * Shared formatting utilities and label maps for the money transfer service.
 * Single source of truth — used across transaction-recording.vue, cash-counting.vue, TransactionForm.vue
 */
export function useMoneyTransferHelpers() {
  function formatCurrency(amount: number): string {
    return (
      new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + ' ฿'
    )
  }

  function formatTime(datetime: string | Date): string {
    return new Date(datetime).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatDatetime(datetime: string | Date): string {
    const d = new Date(datetime)
    const date = d.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    return `${date} ${time}`
  }

  function getTransactionTypeLabel(type: string): string {
    const map: Record<string, string> = {
      transfer: 'โอนเงิน',
      withdrawal: 'ถอนเงิน',
      owner_deposit: 'ฝากเงิน',
    }
    return map[type] || type
  }

  function getChannelLabel(channel?: string): string {
    if (!channel) return '-'
    const map: Record<string, string> = {
      promptpay: 'พร้อมเพย์',
      bank: 'โอนธนาคาร',
      other: 'อื่นๆ',
    }
    return map[channel] || channel
  }

  function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
    const map: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      completed: 'success',
      draft: 'warning',
      failed: 'error',
      cancelled: 'default',
    }
    return map[status] ?? 'default'
  }

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      completed: 'สำเร็จ',
      draft: 'รอดำเนินการ',
      failed: 'ล้มเหลว',
      cancelled: 'ยกเลิก',
    }
    return map[status] || status
  }

  return {
    formatCurrency,
    formatTime,
    formatDatetime,
    getTransactionTypeLabel,
    getChannelLabel,
    getStatusBadgeVariant,
    getStatusLabel,
  }
}
