import { Product, RevenueMetrics, ProductCategory } from './types'
import { calculateDiscountInfo } from './productUtils'
import { startOfDay, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns'

export function calculateRevenueMetrics(products: Product[]): RevenueMetrics {
  try {
    if (!products || products.length === 0) {
      return {
        today: 0,
        week: 0,
        month: 0,
        itemsSoldToday: 0,
        itemsSoldWeek: 0,
        itemsSoldMonth: 0,
        missedOpportunities: 0,
        topCategories: []
      }
    }

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
      fruit: { revenue: 0, count: 0 },
      dairy: { revenue: 0, count: 0 },
      meat: { revenue: 0, count: 0 },
      'dry-goods': { revenue: 0, count: 0 }
    }

    products.forEach(product => {
      try {
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
      } catch (error) {
        console.error('Error processing product in revenue metrics:', product.id, error)
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
      today: Math.round(revenueToday * 100) / 100,
      week: Math.round(revenueWeek * 100) / 100,
      month: Math.round(revenueMonth * 100) / 100,
      itemsSoldToday,
      itemsSoldWeek,
      itemsSoldMonth,
      missedOpportunities,
      topCategories
    }
  } catch (error) {
    console.error('Error calculating revenue metrics:', error)
    return {
      today: 0,
      week: 0,
      month: 0,
      itemsSoldToday: 0,
      itemsSoldWeek: 0,
      itemsSoldMonth: 0,
      missedOpportunities: 0,
      topCategories: []
    }
  }
}

export function calculatePotentialRevenue(products: Product[]): number {
  try {
    if (!products || products.length === 0) return 0
    
    const potential = products
      .filter(p => p && p.status !== 'expired' && p.status !== 'sold')
      .reduce((sum, p) => {
        try {
          const discountInfo = calculateDiscountInfo(p)
          return sum + (discountInfo.discountedPrice || 0)
        } catch (error) {
          console.error('Error calculating potential for product:', p.id, error)
          return sum
        }
      }, 0)
    
    return Math.round(potential * 100) / 100
  } catch (error) {
    console.error('Error calculating potential revenue:', error)
    return 0
  }
}

export function generateRevenueChartData(products: Product[], days: number = 7) {
  try {
    if (!products || products.length === 0) {
      const emptyData = []
      const now = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        emptyData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: 0
        })
      }
      return emptyData
    }

    const data: Array<{ date: string; revenue: number }> = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      try {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dayStart = startOfDay(date)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)

        const dayRevenue = products
          .filter(p => {
            if (!p || p.status !== 'sold' || !p.soldAt) return false
            try {
              const soldDate = parseISO(p.soldAt)
              return soldDate >= dayStart && soldDate < dayEnd
            } catch (error) {
              return false
            }
          })
          .reduce((sum, p) => {
            try {
              const discountInfo = calculateDiscountInfo(p)
              return sum + (discountInfo.discountedPrice || 0)
            } catch (error) {
              return sum
            }
          }, 0)

        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: Math.round(dayRevenue * 100) / 100
        })
      } catch (error) {
        console.error('Error processing chart day:', error)
      }
    }

    return data
  } catch (error) {
    console.error('Error generating revenue chart data:', error)
    return []
  }
}
