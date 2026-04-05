export type ProductCategory = 'produce' | 'dairy' | 'meat' | 'bakery' | 'packaged' | 'other'

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
  type: 'daily_expiring' | 'revenue_opportunity' | 'missed_opportunity'
  title: string
  message: string
  count?: number
  potentialRevenue?: number
  timestamp: string
  read: boolean
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
