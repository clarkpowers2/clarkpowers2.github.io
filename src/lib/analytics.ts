import { Product, RevenueMetrics, ProductCategory } from './types'
import { calculateDiscountInfo } from './productUtils'
import { startOfDay, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns'

export function calculateRevenueMetrics(products: Product[]): RevenueMetrics {
  const now = new Date()
  const todayStart = startOfDay(now)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  let revenueToday = 0
  let revenueWeek = 0
  let revenueMonth = 0
  let itemsSoldToday = 0
  let itemsSoldWeek = 0
  let itemsSoldMonth = 0
  let missedOpportunities = 0

  const categoryRevenue: Record<ProductCategory, { revenue: number; count: number }> = {
    produce: { revenue: 0, count: 0 },
    dairy: { revenue: 0, count: 0 },
    meat: { revenue: 0, count: 0 },
    bakery: { revenue: 0, count: 0 },
    packaged: { revenue: 0, count: 0 },
    other: { revenue: 0, count: 0 }
  }

  products.forEach(product => {
    const discountInfo = calculateDiscountInfo(product)
    const revenue = discountInfo.discountedPrice

    if (product.status === 'sold' && product.soldAt) {
      const soldDate = parseISO(product.soldAt)

      if (isAfter(soldDate, todayStart)) {
        revenueToday += revenue
        itemsSoldToday++
      }

      if (isAfter(soldDate, weekStart)) {
        revenueWeek += revenue
        itemsSoldWeek++
      }

      if (isAfter(soldDate, monthStart)) {
        revenueMonth += revenue
        itemsSoldMonth++
        categoryRevenue[product.category].revenue += revenue
        categoryRevenue[product.category].count++
      }
    }

    if (product.status === 'expired') {
      missedOpportunities++
    }
  })

  const topCategories = Object.entries(categoryRevenue)
    .map(([category, data]) => ({
      category: category as ProductCategory,
      revenue: data.revenue,
      count: data.count
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return {
    today: revenueToday,
    week: revenueWeek,
    month: revenueMonth,
    itemsSoldToday,
    itemsSoldWeek,
    itemsSoldMonth,
    missedOpportunities,
    topCategories
  }
}

export function calculatePotentialRevenue(products: Product[]): number {
  return products
    .filter(p => p.status !== 'expired' && p.status !== 'sold')
    .reduce((sum, p) => {
      const discountInfo = calculateDiscountInfo(p)
      return sum + discountInfo.discountedPrice
    }, 0)
}

export function generateRevenueChartData(products: Product[], days: number = 7) {
  const data: Array<{ date: string; revenue: number }> = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayStart = startOfDay(date)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const dayRevenue = products
      .filter(p => {
        if (p.status !== 'sold' || !p.soldAt) return false
        const soldDate = parseISO(p.soldAt)
        return soldDate >= dayStart && soldDate < dayEnd
      })
      .reduce((sum, p) => {
        const discountInfo = calculateDiscountInfo(p)
        return sum + discountInfo.discountedPrice
      }, 0)

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dayRevenue
    })
  }

  return data
}
