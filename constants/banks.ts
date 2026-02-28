/**
 * Canonical list of Thai bank names.
 * Single source of truth for all bankName fields across the app.
 * Used in: TransactionForm.vue, transaction-recording.vue (favorites form)
 */
export const BANK_LIST = [
  'ธนาคารกสิกรไทย (KBank)',
  'ธนาคารกรุงไทย (KTB)',
  'ธนาคารกรุงเทพ (BBL)',
  'ธนาคารไทยพาณิชย์ (SCB)',
  'ธนาคารกรุงศรีอยุธยา (BAY)',
  'ธนาคารออมสิน (GSB)',
  'ธนาคารอาคารสงเคราะห์ (GHB)',
  'ธนาคารเพื่อการเกษตรและสหกรณ์ (BAAC)',
  'ธนาคารทหารไทยธนชาต (TTB)',
  'ธนาคาร UOB',
  'ธนาคาร CIMB',
  'ธนาคาร LH Bank',
  'ธนาคารทิสโก้ (TISCO)',
  'ธนาคารเกียรตินาคินภัทร (KKP)',
  'ธนาคารอื่นๆ',
] as const

export type BankName = (typeof BANK_LIST)[number]
