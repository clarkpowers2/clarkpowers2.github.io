export type ProductCategory = 'fruit' | 'dairy' | 'meat' | 'dry-goods'

export type ProductStatus = 'pending' | 'discounted' | 'labeled' | 'sold' | 'expired'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  originalPrice: number
  expiryDate: string
  status: ProductStatus
  dateAdded: string
  storeId: string
  customDiscountPercentage?: number
  discountedBy?: string
  discountedAt?: string
  labeledBy?: string
  labeledAt?: string
  soldAt?: string
}

export interface DiscountInfo {
  daysUntilExpiry: number
  discountPercentage: number
  discountedPrice: number
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low' | 'expired'
  categoryModifier: number
  timeModifier: number
}

export interface Store {
  id: string
  name: string
  location: string
  createdAt: string
}

export interface Activity {
  id: string
  storeId: string
  productId: string
  productName: string
  action: 'discount_applied' | 'label_printed' | 'product_added' | 'product_sold' | 'product_removed'
  staffMember: string
  timestamp: string
  metadata?: {
    originalPrice?: number
    discountedPrice?: number
    discountPercentage?: number
  }
}

export interface Notification {
  id: string
  storeId: string
  type: 'daily_expiring' | 'revenue_opportunity' | 'missed_opportunity' | 'staff_alert'
  title: string
  message: string
  count?: number
  potentialRevenue?: number
  timestamp: string
  read: boolean
  productIds?: string[]
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export interface AIDiscountSuggestion {
  suggestedDiscount: number
  reasoning: string
  confidence: number
  factors: {
    daysUntilExpiry: number
    categoryRisk: string
    timeOfDay: string
    marketDemand: string
  }
}

export interface RevenueMetrics {
  today: number
  week: number
  month: number
  itemsSoldToday: number
  itemsSoldWeek: number
  itemsSoldMonth: number
  missedOpportunities: number
  topCategories: Array<{
    category: ProductCategory
    revenue: number
    count: number
  }>
}

export interface WeeklyReport {
  id: string
  storeId: string
  weekStartDate: string
  weekEndDate: string
  totalRecovered: number
  itemsSold: number
  missedOpportunities: number
  topCategories: Array<{
    category: ProductCategory
    revenue: number
    count: number
  }>
  staffPerformance: Array<{
    staffMember: string
    discountsApplied: number
    revenueGenerated: number
  }>
  generatedAt: string
}

export interface PrinterUsageStats {
  id: string
  storeId: string
  printerType: 'thermal' | 'label-machine' | 'standard' | 'browser'
  labelsPrinted: number
  labelSize: string
  costPerLabel: number
  totalCost: number
  timestamp: string
  productId: string
  productName: string
}

export interface LabelCostSettings {
  storeId: string
  costs: {
    'thermal-small': number
    'thermal-medium': number
    'thermal-large': number
    'standard': number
  }
  currency: string
  updatedAt: string
}
