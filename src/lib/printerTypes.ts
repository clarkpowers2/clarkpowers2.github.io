export type PrinterType = 'thermal' | 'laser' | 'inkjet' | 'label'

export type PrinterStatus = 'online' | 'offline' | 'printing' | 'error' | 'paper-low' | 'paper-out'

export interface NetworkPrinter {
  id: string
  name: string
  type: PrinterType
  ipAddress: string
  port: number
  model?: string
  location?: string
  status: PrinterStatus
  isDefault: boolean
  labelWidth?: number
  labelHeight?: number
  addedAt: string
}

export interface PrintJob {
  id: string
  productIds: string[]
  printerId: string
  status: 'pending' | 'printing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  copies: number
  errorMessage?: string
}

export interface BulkPrintSettings {
  printerId: string
  copies: number
  autoPrint: boolean
  includeBarcode: boolean
  includeQRCode: boolean
  labelSize: 'small' | 'medium' | 'large'
  orientation: 'portrait' | 'landscape'
}
