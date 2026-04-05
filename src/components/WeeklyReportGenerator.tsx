import { useState, useMemo } from 'react'
import { Product, Activity, WeeklyReport, PrinterUsageStats } from '@/lib/types'
import { calculateDiscountInfo } from '@/lib/productUtils'
import { calculateTotalPrinterCosts, calculateROI } from '@/lib/printerAnalytics'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, Download, TrendUp, TrendDown, Package, 
  CurrencyDollar, Printer, Users, WarningCircle, CheckCircle
} from '@phosphor-icons/react'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns'
import { toast } from 'sonner'

interface WeeklyReportGeneratorProps {
  products: Product[]
  activities: Activity[]
  printerUsageStats: PrinterUsageStats[]
  storeId: string
  storeName: string
}

export function WeeklyReportGenerator({
  products,
  activities,
  printerUsageStats,
  storeId,
  storeName
}: WeeklyReportGeneratorProps) {
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())

  const weekStart = useMemo(() => startOfWeek(selectedWeek), [selectedWeek])
  const weekEnd = useMemo(() => endOfWeek(selectedWeek), [selectedWeek])

  const weeklyReport = useMemo((): WeeklyReport => {
    const weekInterval = { start: weekStart, end: weekEnd }

    const weekProducts = products.filter(p => {
      if (!p.soldAt) return false
      try {
        const soldDate = parseISO(p.soldAt)
        return isWithinInterval(soldDate, weekInterval)
      } catch {
        return false
      }
    })

    const totalRecovered = weekProducts.reduce((sum, p) => {
      const info = calculateDiscountInfo(p)
      return sum + info.discountedPrice
    }, 0)

    const itemsSold = weekProducts.length

    const missedOpportunities = products.filter(p => {
      if (p.status !== 'expired') return false
      try {
        const expiryDate = parseISO(p.expiryDate)
        return isWithinInterval(expiryDate, weekInterval)
      } catch {
        return false
      }
    }).length

    const categoryStats: Record<string, { revenue: number; count: number }> = {}
    weekProducts.forEach(p => {
      if (!categoryStats[p.category]) {
        categoryStats[p.category] = { revenue: 0, count: 0 }
      }
      const info = calculateDiscountInfo(p)
      categoryStats[p.category].revenue += info.discountedPrice
      categoryStats[p.category].count++
    })

    const topCategories = Object.entries(categoryStats)
      .map(([category, data]) => ({
        category: category as any,
        revenue: data.revenue,
        count: data.count
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const weekActivities = activities.filter(a => {
      try {
        const activityDate = parseISO(a.timestamp)
        return isWithinInterval(activityDate, weekInterval)
      } catch {
        return false
      }
    })

    const staffStats: Record<string, { discountsApplied: number; revenueGenerated: number }> = {}
    weekActivities.forEach(activity => {
      if (activity.action === 'discount_applied') {
        const staff = activity.staffMember || 'Unknown'
        if (!staffStats[staff]) {
          staffStats[staff] = { discountsApplied: 0, revenueGenerated: 0 }
        }
        staffStats[staff].discountsApplied++
        if (activity.metadata?.discountedPrice) {
          staffStats[staff].revenueGenerated += activity.metadata.discountedPrice
        }
      }
    })

    const staffPerformance = Object.entries(staffStats)
      .map(([staffMember, data]) => ({
        staffMember,
        discountsApplied: data.discountsApplied,
        revenueGenerated: data.revenueGenerated
      }))
      .sort((a, b) => b.revenueGenerated - a.revenueGenerated)

    return {
      id: `report-${storeId}-${weekStart.toISOString()}`,
      storeId,
      weekStartDate: weekStart.toISOString(),
      weekEndDate: weekEnd.toISOString(),
      totalRecovered,
      itemsSold,
      missedOpportunities,
      topCategories,
      staffPerformance,
      generatedAt: new Date().toISOString()
    }
  }, [products, activities, weekStart, weekEnd, storeId])

  const printerCosts = useMemo(() => {
    const weekInterval = { start: weekStart, end: weekEnd }
    const weekPrinterStats = printerUsageStats.filter(stat => {
      try {
        const statDate = parseISO(stat.timestamp)
        return isWithinInterval(statDate, weekInterval)
      } catch {
        return false
      }
    })
    return calculateTotalPrinterCosts(weekPrinterStats)
  }, [printerUsageStats, weekStart, weekEnd])

  const roi = useMemo(() => {
    const weekInterval = { start: weekStart, end: weekEnd }
    
    const weekProducts = products.filter(p => {
      if (!p.soldAt) return false
      try {
        const soldDate = parseISO(p.soldAt)
        return isWithinInterval(soldDate, weekInterval)
      } catch {
        return false
      }
    })

    const weekPrinterStats = printerUsageStats.filter(stat => {
      try {
        const statDate = parseISO(stat.timestamp)
        return isWithinInterval(statDate, weekInterval)
      } catch {
        return false
      }
    })

    return calculateROI(weekProducts, weekPrinterStats)
  }, [products, printerUsageStats, weekStart, weekEnd])

  const handlePrint = () => {
    window.print()
    toast.success('Print dialog opened')
  }

  const handleDownloadPDF = () => {
    toast.info('PDF download feature', {
      description: 'In production, this would generate a PDF report'
    })
  }

  const handlePreviousWeek = () => {
    setSelectedWeek(prev => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() - 7)
      return newDate
    })
  }

  const handleNextWeek = () => {
    setSelectedWeek(prev => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + 7)
      return newDate
    })
  }

  const handleCurrentWeek = () => {
    setSelectedWeek(new Date())
  }

  const isCurrentWeek = useMemo(() => {
    const now = new Date()
    const currentWeekStart = startOfWeek(now)
    return weekStart.getTime() === currentWeekStart.getTime()
  }, [weekStart])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FileText size={28} weight="bold" className="text-primary" />
            Weekly Revenue Report
          </h2>
          <p className="text-muted-foreground mt-1">
            {storeName} · {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            Previous Week
          </Button>
          {!isCurrentWeek && (
            <Button variant="outline" size="sm" onClick={handleCurrentWeek}>
              Current Week
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleNextWeek} disabled={isCurrentWeek}>
            Next Week
          </Button>
          <Separator orientation="vertical" className="h-8 mx-2" />
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download size={16} weight="bold" className="mr-2" />
            PDF
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint}>
            <Printer size={16} weight="bold" className="mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Recovered</p>
            <CurrencyDollar size={20} weight="bold" className="text-primary" />
          </div>
          <p className="text-3xl font-bold text-primary">${weeklyReport.totalRecovered.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">This week</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
            <Package size={20} weight="bold" className="text-success" />
          </div>
          <p className="text-3xl font-bold text-success">{weeklyReport.itemsSold}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {roi.revenuePerLabel > 0 ? `$${roi.revenuePerLabel.toFixed(2)} per label` : 'No labels'}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Label Costs</p>
            <Printer size={20} weight="bold" className="text-warning" />
          </div>
          <p className="text-3xl font-bold text-warning">${printerCosts.totalCost.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {printerCosts.totalLabels} labels printed
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Missed Opportunities</p>
            <WarningCircle size={20} weight="bold" className="text-destructive" />
          </div>
          <p className="text-3xl font-bold text-destructive">{weeklyReport.missedOpportunities}</p>
          <p className="text-xs text-muted-foreground mt-1">Expired items</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendUp size={20} weight="bold" className="text-success" />
            ROI Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Gross Revenue</span>
              <span className="text-lg font-bold">${roi.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Label Costs</span>
              <span className="text-lg font-medium text-warning">-${roi.totalLabelCost.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Net Revenue</span>
              <span className="text-2xl font-bold text-primary">${roi.netRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
              <span className="text-sm font-medium">Return on Investment</span>
              <div className="flex items-center gap-2">
                <TrendUp size={20} weight="bold" className="text-success" />
                <span className="text-2xl font-bold text-success">{roi.roi.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package size={20} weight="bold" className="text-primary" />
            Top Categories
          </h3>
          {weeklyReport.topCategories.length > 0 ? (
            <div className="space-y-3">
              {weeklyReport.topCategories.map((cat, index) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium capitalize">{cat.category.replace('-', ' ')}</p>
                      <p className="text-xs text-muted-foreground">{cat.count} items</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold">${cat.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package size={32} weight="thin" className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sales this week</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users size={20} weight="bold" className="text-accent" />
          Staff Performance
        </h3>
        {weeklyReport.staffPerformance.length > 0 ? (
          <div className="space-y-3">
            {weeklyReport.staffPerformance.map((staff, index) => (
              <div key={staff.staffMember} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    <span className="font-bold">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{staff.staffMember}</p>
                    <p className="text-sm text-muted-foreground">
                      {staff.discountsApplied} discount{staff.discountsApplied !== 1 ? 's' : ''} applied
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${staff.revenueGenerated.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">revenue generated</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users size={32} weight="thin" className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No staff activity this week</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Printer size={20} weight="bold" className="text-info" />
          Printer Usage Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">By Printer Type</p>
            {Object.keys(printerCosts.byPrinterType).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(printerCosts.byPrinterType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-sm capitalize">{type.replace('-', ' ')}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold">{data.labels} labels</p>
                      <p className="text-xs text-muted-foreground">${data.cost.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No printer usage</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">By Label Size</p>
            {Object.keys(printerCosts.byLabelSize).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(printerCosts.byLabelSize).map(([size, data]) => (
                  <div key={size} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-sm">{size}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold">{data.labels} labels</p>
                      <p className="text-xs text-muted-foreground">${data.cost.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No label usage</p>
            )}
          </div>
        </div>
        {printerCosts.averageCostPerLabel > 0 && (
          <div className="mt-4 p-3 bg-info/10 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">Average Cost Per Label</span>
            <span className="text-lg font-bold text-info">${printerCosts.averageCostPerLabel.toFixed(3)}</span>
          </div>
        )}
      </Card>

      <Card className="p-6 print-only hidden">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Weekly Revenue Report</h1>
          <p className="text-lg text-muted-foreground">{storeName}</p>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, 'MMMM d, yyyy')} - {format(weekEnd, 'MMMM d, yyyy')}
          </p>
        </div>
        <Separator className="my-6" />
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Total Revenue Recovered:</span>
            <span className="font-bold">${weeklyReport.totalRecovered.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Items Sold:</span>
            <span className="font-bold">{weeklyReport.itemsSold}</span>
          </div>
          <div className="flex justify-between">
            <span>Label Costs:</span>
            <span className="font-bold">${printerCosts.totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Net Revenue:</span>
            <span className="font-bold">${roi.netRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>ROI:</span>
            <span className="font-bold">{roi.roi.toFixed(0)}%</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
