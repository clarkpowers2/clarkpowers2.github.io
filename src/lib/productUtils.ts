import { Product, DiscountInfo } from './types'

export function calculateDaysUntilExpiry(expiryDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

export function getDiscountPercentage(daysUntilExpiry: number): number {
  if (daysUntilExpiry <= 0) return 0
  if (daysUntilExpiry === 1) return 50
  if (daysUntilExpiry === 2) return 25
  if (daysUntilExpiry >= 3) return 10
  return 0
}

export function calculateDiscountInfo(product: Product): DiscountInfo {
  const daysUntilExpiry = calculateDaysUntilExpiry(product.expiryDate)
  const discountPercentage = getDiscountPercentage(daysUntilExpiry)
  const discountedPrice = product.originalPrice * (1 - discountPercentage / 100)
  
  let urgencyLevel: DiscountInfo['urgencyLevel'] = 'low'
  
  if (daysUntilExpiry <= 0) {
    urgencyLevel = 'expired'
  } else if (daysUntilExpiry === 1) {
    urgencyLevel = 'critical'
  } else if (daysUntilExpiry === 2) {
    urgencyLevel = 'high'
  } else if (daysUntilExpiry === 3) {
    urgencyLevel = 'medium'
  }
  
  return {
    daysUntilExpiry,
    discountPercentage,
    discountedPrice,
    urgencyLevel
  }
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function getCategoryIcon(category: Product['category']): string {
  const icons: Record<Product['category'], string> = {
    produce: 'Apple',
    dairy: 'Drop',
    meat: 'Fish',
    bakery: 'Bread',
    packaged: 'Package',
    other: 'ShoppingCart'
  }
  return icons[category]
}

export function getUrgencyColor(urgencyLevel: DiscountInfo['urgencyLevel']): string {
  const colors = {
    critical: 'border-l-destructive',
    high: 'border-l-accent',
    medium: 'border-l-warning',
    low: 'border-l-info',
    expired: 'border-l-muted-foreground'
  }
  return colors[urgencyLevel]
}

export function getUrgencyBadgeColor(urgencyLevel: DiscountInfo['urgencyLevel']): string {
  const colors = {
    critical: 'bg-destructive text-destructive-foreground',
    high: 'bg-accent text-accent-foreground',
    medium: 'bg-warning text-warning-foreground',
    low: 'bg-info text-info-foreground',
    expired: 'bg-muted text-muted-foreground'
  }
  return colors[urgencyLevel]
}
