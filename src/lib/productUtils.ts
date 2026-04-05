import { Product, DiscountInfo } from './types'

export function calculateDaysUntilExpiry(expiryDate: string): number {
  try {
    if (!expiryDate) return 0
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const expiry = new Date(expiryDate)
    
    if (isNaN(expiry.getTime())) {
      console.warn('Invalid expiry date:', expiryDate)
      return 0
    }
    
    expiry.setHours(0, 0, 0, 0)
    
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (error) {
    console.error('Error calculating days until expiry:', error)
    return 0
  }
}

export function getCategoryModifier(category: Product['category']): number {
  const modifiers: Record<Product['category'], number> = {
    meat: 20,
    fruit: 15,
    dairy: 10,
    'dry-goods': 0
  }
  return modifiers[category]
}

export function getTimeModifier(): number {
  const hour = new Date().getHours()
  
  if (hour >= 18 && hour <= 21) {
    return 10
  }
  
  if (hour >= 15 && hour <= 17) {
    return 5
  }
  
  return 0
}

export function getBaseDiscountPercentage(daysUntilExpiry: number): number {
  if (daysUntilExpiry <= 0) return 0
  if (daysUntilExpiry === 1) return 50
  if (daysUntilExpiry === 2) return 30
  if (daysUntilExpiry === 3) return 15
  return 5
}

export function calculateDiscountInfo(product: Product): DiscountInfo {
  try {
    const daysUntilExpiry = calculateDaysUntilExpiry(product.expiryDate)
    const baseDiscount = getBaseDiscountPercentage(daysUntilExpiry)
    const categoryModifier = getCategoryModifier(product.category)
    const timeModifier = getTimeModifier()
    
    const totalDiscount = product.customDiscountPercentage !== undefined 
      ? Math.min(Math.max(product.customDiscountPercentage, 0), 100)
      : Math.min(baseDiscount + categoryModifier + timeModifier, 75)
    
    const discountedPrice = Math.max(product.originalPrice * (1 - totalDiscount / 100), 0.01)
    
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
      discountPercentage: Math.round(totalDiscount * 10) / 10,
      discountedPrice: Math.round(discountedPrice * 100) / 100,
      urgencyLevel,
      categoryModifier,
      timeModifier
    }
  } catch (error) {
    console.error('Error calculating discount info:', error)
    return {
      daysUntilExpiry: 0,
      discountPercentage: 0,
      discountedPrice: product.originalPrice || 0,
      urgencyLevel: 'expired',
      categoryModifier: 0,
      timeModifier: 0
    }
  }
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function getCategoryIcon(category: Product['category']): string {
  const icons: Record<Product['category'], string> = {
    fruit: 'Apple',
    dairy: 'Drop',
    meat: 'Fish',
    'dry-goods': 'Package'
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
