import { NetworkPrinter, PrinterStatus, PrinterType } from './printerTypes'

export const discoverNetworkPrinters = async (): Promise<NetworkPrinter[]> => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const mockPrinters: NetworkPrinter[] = [
    {
      id: 'printer-1',
      name: 'Zebra ZD620 (Front Counter)',
      type: 'thermal',
      ipAddress: '192.168.1.101',
      port: 9100,
      model: 'ZD620',
      location: 'Front Counter',
      status: 'online',
      isDefault: true,
      labelWidth: 4,
      labelHeight: 6,
      addedAt: new Date().toISOString()
    },
    {
      id: 'printer-2',
      name: 'Brother QL-820NWB (Produce)',
      type: 'label',
      ipAddress: '192.168.1.102',
      port: 9100,
      model: 'QL-820NWB',
      location: 'Produce Department',
      status: 'online',
      isDefault: false,
      labelWidth: 2.4,
      labelHeight: 3.5,
      addedAt: new Date().toISOString()
    },
    {
      id: 'printer-3',
      name: 'Dymo LabelWriter 450 (Meat)',
      type: 'label',
      ipAddress: '192.168.1.103',
      port: 9100,
      model: 'LabelWriter 450',
      location: 'Meat Department',
      status: 'online',
      isDefault: false,
      labelWidth: 2.125,
      labelHeight: 4,
      addedAt: new Date().toISOString()
    },
    {
      id: 'printer-4',
      name: 'HP LaserJet (Back Office)',
      type: 'laser',
      ipAddress: '192.168.1.104',
      port: 9100,
      model: 'LaserJet Pro M404',
      location: 'Back Office',
      status: 'paper-low',
      isDefault: false,
      labelWidth: 8.5,
      labelHeight: 11,
      addedAt: new Date().toISOString()
    }
  ]
  
  return mockPrinters
}

export const testPrinterConnection = async (printer: NetworkPrinter): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 800))
  return printer.status === 'online' || printer.status === 'paper-low'
}

export const getPrinterStatus = (printerId: string): PrinterStatus => {
  const statuses: PrinterStatus[] = ['online', 'offline', 'printing', 'error', 'paper-low']
  return statuses[Math.floor(Math.random() * statuses.length)]
}

export const sendToPrinter = async (
  printer: NetworkPrinter,
  labelData: string,
  copies: number = 1
): Promise<{ success: boolean; error?: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1000 + (copies * 200)))
  
  if (printer.status === 'offline') {
    return { success: false, error: 'Printer is offline' }
  }
  
  if (printer.status === 'error') {
    return { success: false, error: 'Printer error - check device' }
  }
  
  if (printer.status === 'paper-out') {
    return { success: false, error: 'Out of paper - please refill' }
  }
  
  return { success: true }
}

export const generateZPL = (productData: {
  name: string
  originalPrice: number
  discountedPrice: number
  discountPercentage: number
  expiryDate: string
  barcode?: string
}): string => {
  return `^XA
^FO50,50^A0N,50,50^FDSALE!^FS
^FO50,120^A0N,30,30^FD${productData.name}^FS
^FO50,170^A0N,25,25^FDWas: $${productData.originalPrice.toFixed(2)}^FS
^FO50,210^A0N,40,40^FD$${productData.discountedPrice.toFixed(2)}^FS
^FO50,270^A0N,25,25^FD${productData.discountPercentage}% OFF^FS
^FO50,310^A0N,20,20^FDExp: ${productData.expiryDate}^FS
${productData.barcode ? `^FO50,350^BCN,100,Y,N,N^FD${productData.barcode}^FS` : ''}
^XZ`
}

export const generateESCPOS = (productData: {
  name: string
  originalPrice: number
  discountedPrice: number
  discountPercentage: number
  expiryDate: string
}): string => {
  return `
    ESC @
    ESC E 1
    SALE!
    ESC E 0
    
    ${productData.name}
    
    Was: $${productData.originalPrice.toFixed(2)}
    NOW: $${productData.discountedPrice.toFixed(2)}
    
    ${productData.discountPercentage}% OFF
    Exp: ${productData.expiryDate}
    
    ESC d 3
  `
}

export const formatPrinterName = (name: string, maxLength: number = 30): string => {
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength - 3) + '...'
}

export const getPrinterTypeIcon = (type: PrinterType): string => {
  switch (type) {
    case 'thermal':
      return '🖨️'
    case 'label':
      return '🏷️'
    case 'laser':
      return '📄'
    case 'inkjet':
      return '🖨️'
    default:
      return '🖨️'
  }
}

export const getPrinterStatusColor = (status: PrinterStatus): string => {
  switch (status) {
    case 'online':
      return 'text-success'
    case 'offline':
      return 'text-muted-foreground'
    case 'printing':
      return 'text-info'
    case 'error':
      return 'text-destructive'
    case 'paper-low':
      return 'text-warning'
    case 'paper-out':
      return 'text-destructive'
    default:
      return 'text-muted-foreground'
  }
}

export const getPrinterStatusBadgeVariant = (status: PrinterStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'online':
      return 'default'
    case 'printing':
      return 'secondary'
    case 'offline':
      return 'outline'
    case 'error':
    case 'paper-out':
      return 'destructive'
    case 'paper-low':
      return 'secondary'
    default:
      return 'outline'
  }
}
