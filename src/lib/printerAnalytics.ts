import { PrinterUsageStats, LabelCostSettings, Product } from './types'
import { calculateDiscountInfo } from './productUtils'

export const DEFAULT_LABEL_COSTS: LabelCostSettings['costs'] = {
  'thermal-small': 0.03,
  'thermal-medium': 0.05,
  'thermal-large': 0.08,
  'standard': 0.12
}

export function calculateLabelCost(
  labelSize: string,
  printerType: string,
  quantity: number = 1,
  costs: LabelCostSettings['costs'] = DEFAULT_LABEL_COSTS
): number {
  let costPerLabel = 0

  if (printerType === 'standard' || printerType === 'browser') {
    costPerLabel = costs['standard']
  } else if (labelSize === '2x1' || labelSize === 'small') {
    costPerLabel = costs['thermal-small']
  } else if (labelSize === '3x2' || labelSize === 'medium') {
    costPerLabel = costs['thermal-medium']
  } else {
    costPerLabel = costs['thermal-large']
  }

  return Math.round(costPerLabel * quantity * 100) / 100
}

export function createPrinterUsageRecord(
  storeId: string,
  product: Product,
  printerType: 'thermal' | 'label-machine' | 'standard' | 'browser',
  labelSize: string,
  quantity: number = 1,
  costs: LabelCostSettings['costs'] = DEFAULT_LABEL_COSTS
): PrinterUsageStats {
  const costPerLabel = calculateLabelCost(labelSize, printerType, 1, costs)
  const totalCost = calculateLabelCost(labelSize, printerType, quantity, costs)

  return {
    id: `printer-usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    storeId,
    printerType,
    labelsPrinted: quantity,
    labelSize,
    costPerLabel,
    totalCost,
    timestamp: new Date().toISOString(),
    productId: product.id,
    productName: product.name
  }
}

export function calculateTotalPrinterCosts(usageStats: PrinterUsageStats[]): {
  totalCost: number
  totalLabels: number
  byPrinterType: Record<string, { cost: number; labels: number }>
  byLabelSize: Record<string, { cost: number; labels: number }>
  averageCostPerLabel: number
} {
  if (!usageStats || usageStats.length === 0) {
    return {
      totalCost: 0,
      totalLabels: 0,
      byPrinterType: {},
      byLabelSize: {},
      averageCostPerLabel: 0
    }
  }

  let totalCost = 0
  let totalLabels = 0
  const byPrinterType: Record<string, { cost: number; labels: number }> = {}
  const byLabelSize: Record<string, { cost: number; labels: number }> = {}

  usageStats.forEach(stat => {
    totalCost += stat.totalCost
    totalLabels += stat.labelsPrinted

    if (!byPrinterType[stat.printerType]) {
      byPrinterType[stat.printerType] = { cost: 0, labels: 0 }
    }
    byPrinterType[stat.printerType].cost += stat.totalCost
    byPrinterType[stat.printerType].labels += stat.labelsPrinted

    if (!byLabelSize[stat.labelSize]) {
      byLabelSize[stat.labelSize] = { cost: 0, labels: 0 }
    }
    byLabelSize[stat.labelSize].cost += stat.totalCost
    byLabelSize[stat.labelSize].labels += stat.labelsPrinted
  })

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    totalLabels,
    byPrinterType,
    byLabelSize,
    averageCostPerLabel: totalLabels > 0 ? Math.round((totalCost / totalLabels) * 100) / 100 : 0
  }
}

export function calculateROI(
  products: Product[],
  printerUsageStats: PrinterUsageStats[]
): {
  totalRevenue: number
  totalLabelCost: number
  netRevenue: number
  roi: number
  revenuePerLabel: number
} {
  const soldProducts = products.filter(p => p.status === 'sold')
  
  const totalRevenue = soldProducts.reduce((sum, product) => {
    const discountInfo = calculateDiscountInfo(product)
    return sum + discountInfo.discountedPrice
  }, 0)

  const printerCostData = calculateTotalPrinterCosts(printerUsageStats)
  const totalLabelCost = printerCostData.totalCost

  const netRevenue = totalRevenue - totalLabelCost

  const roi = totalLabelCost > 0 ? (netRevenue / totalLabelCost) * 100 : 0

  const revenuePerLabel = printerCostData.totalLabels > 0
    ? totalRevenue / printerCostData.totalLabels
    : 0

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalLabelCost: Math.round(totalLabelCost * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    revenuePerLabel: Math.round(revenuePerLabel * 100) / 100
  }
}
