/**
 * Shared formatting utilities and label maps for the money transfer service.
 * Single source of truth — used across transaction-recording.vue, TransactionForm.vue
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

  /**
   * Returns the recipient/account name for a transaction.
   * - bank/other channel → accountName
   * - promptpay channel  → promptpayAccountName, fallback to accountName
   * - owner_deposit / no channel → '-'
   */
  function getAccountName(txn: {
    transactionType: string
    channel?: string
    accountName?: string
    promptpayAccountName?: string
  }): string {
    if (txn.transactionType === 'owner_deposit') return '-'
    if (txn.channel === 'promptpay') return txn.promptpayAccountName || txn.accountName || '-'
    return txn.accountName || '-'
  }

  /**
   * Returns the subtitle (2nd line) under account name in the table.
   * - promptpay channel  → 'พร้อมเพย์'
   * - bank/other channel → bankName
   * - owner_deposit      → '' (hidden)
   */
  function getChannelSubtitle(txn: {
    transactionType: string
    channel?: string
    bankName?: string
  }): string {
    if (txn.transactionType === 'owner_deposit') return ''
    if (txn.channel === 'promptpay') return 'พร้อมเพย์'
    return txn.bankName || ''
  }

  /**
   * Format a numeric diff value for display in cash verification tables.
   * Returns '✅ ตรงกัน' for zero, '+X ฿' / '-X ฿' for non-zero, '-' for null.
   */
  function formatDiff(diff: number | null): string {
    if (diff === null) return '-'
    if (diff === 0) return '✅ ตรงกัน'
    return (diff > 0 ? '+' : '') + formatCurrency(diff)
  }

  return {
    formatCurrency,
    formatTime,
    formatDatetime,
    getTransactionTypeLabel,
    getChannelLabel,
    getStatusBadgeVariant,
    getStatusLabel,
    getAccountName,
    getChannelSubtitle,
    formatDiff,
  }
}
