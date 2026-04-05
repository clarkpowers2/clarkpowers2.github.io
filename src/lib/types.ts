export type ProductCategory = 'produce' | 'dairy' | 'meat' | 'bakery' | 'packaged' | 'other'

export type ProductStatus = 'pending' | 'discounted' | 'labeled' | 'expired'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  originalPrice: number
  expiryDate: string
  status: ProductStatus
  dateAdded: string
}

export interface DiscountInfo {
  daysUntilExpiry: number
  discountPercentage: number
  discountedPrice: number
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low' | 'expired'
}
