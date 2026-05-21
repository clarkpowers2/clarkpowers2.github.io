import { Product, Activity, PrinterUsageStats, Store } from './types'
import { calculateRevenueMetrics } from './analytics'

export interface EmailRecipient {
  id: string
  email: string
  name: string
  role: 'owner' | 'manager' | 'staff'
  storeIds: string[]
  receiveWeeklyReport: boolean
  receiveDailySummary: boolean
}

export interface EmailSchedule {
  id: string
  storeId: string
  type: 'weekly' | 'daily' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  timeOfDay: string
  enabled: boolean
  recipientIds: string[]
  lastSent?: string
  nextScheduled?: string
}

export interface EmailReport {
  id: string
  scheduleId: string
  storeId: string
  storeName: string
  reportType: 'weekly' | 'daily' | 'monthly'
  generatedAt: string
  sentAt?: string
  status: 'pending' | 'sent' | 'failed'
  recipientEmails: string[]
  subject: string
  htmlContent: string
  metadata: {
    totalRecovered: number
    itemsSold: number
    missedOpportunities: number
    printerCosts: number
  }
}

export function calculateNextScheduledTime(schedule: EmailSchedule): Date {
  const now = new Date()
  const [hours, minutes] = schedule.timeOfDay.split(':').map(Number)
  
  const nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)
  
  if (schedule.type === 'weekly' && schedule.dayOfWeek !== undefined) {
    const daysUntilTarget = (schedule.dayOfWeek - now.getDay() + 7) % 7
    if (daysUntilTarget === 0 && now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes) {
      nextRun.setDate(nextRun.getDate() + 7)
    } else {
      nextRun.setDate(nextRun.getDate() + daysUntilTarget)
    }
  } else if (schedule.type === 'daily') {
    if (now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
  } else if (schedule.type === 'monthly' && schedule.dayOfMonth !== undefined) {
    nextRun.setDate(schedule.dayOfMonth)
    if (nextRun < now) {
      nextRun.setMonth(nextRun.getMonth() + 1)
    }
  }
  
  return nextRun
}

export function generateWeeklyEmailReport(
  store: Store,
  products: Product[],
  activities: Activity[],
  printerUsageStats: PrinterUsageStats[],
  weekStartDate: Date
): string {
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 7)
  
  const weekProducts = products.filter(p => {
    const addedDate = new Date(p.dateAdded)
    return addedDate >= weekStartDate && addedDate < weekEndDate
  })
  
  const metrics = calculateRevenueMetrics(weekProducts)
  
  const printerCosts = printerUsageStats
    .filter(s => {
      const statDate = new Date(s.timestamp)
      return statDate >= weekStartDate && statDate < weekEndDate
    })
    .reduce((sum, stat) => sum + stat.totalCost, 0)
  
  const staffPerformance = activities
    .filter(a => {
      const activityDate = new Date(a.timestamp)
      return activityDate >= weekStartDate && activityDate < weekEndDate && a.action === 'discount_applied'
    })
    .reduce((acc, activity) => {
      const existing = acc.find(s => s.staffMember === activity.staffMember)
      if (existing) {
        existing.count++
        if (activity.metadata?.discountedPrice) {
          existing.revenue += activity.metadata.discountedPrice
        }
      } else {
        acc.push({
          staffMember: activity.staffMember,
          count: 1,
          revenue: activity.metadata?.discountedPrice || 0
        })
      }
      return acc
    }, [] as Array<{ staffMember: string; count: number; revenue: number }>)
    .sort((a, b) => b.revenue - a.revenue)
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Analytics Report - ${store.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0891b2;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #0891b2;
      font-size: 28px;
    }
    .header p {
      margin: 8px 0 0 0;
      color: #666;
      font-size: 14px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: #f8fafc;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #0891b2;
    }
    .metric-card.success {
      border-left-color: #10b981;
    }
    .metric-card.warning {
      border-left-color: #f59e0b;
    }
    .metric-card.danger {
      border-left-color: #ef4444;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #0891b2;
      margin: 0;
    }
    .metric-card.success .metric-value {
      color: #10b981;
    }
    .metric-card.warning .metric-value {
      color: #f59e0b;
    }
    .metric-card.danger .metric-value {
      color: #ef4444;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 18px;
      color: #333;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f8fafc;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .category-name {
      font-weight: 600;
      color: #333;
      text-transform: capitalize;
    }
    .category-stats {
      text-align: right;
    }
    .category-revenue {
      font-size: 18px;
      font-weight: bold;
      color: #10b981;
    }
    .category-count {
      font-size: 12px;
      color: #666;
    }
    .staff-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f8fafc;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .staff-name {
      font-weight: 600;
      color: #333;
    }
    .staff-stats {
      text-align: right;
    }
    .staff-revenue {
      font-size: 16px;
      font-weight: bold;
      color: #0891b2;
    }
    .staff-count {
      font-size: 12px;
      color: #666;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .cta-button {
      display: inline-block;
      background: #0891b2;
      color: white;
      padding: 12px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
    @media only screen and (max-width: 600px) {
      .metric-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Analytics Report</h1>
      <p>${store.name}</p>
      <p>${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}</p>
    </div>
    
    <div class="metric-grid">
      <div class="metric-card success">
        <div class="metric-label">Revenue Recovered</div>
        <div class="metric-value">$${metrics.week.toFixed(2)}</div>
      </div>
      
      <div class="metric-card success">
        <div class="metric-label">Items Sold</div>
        <div class="metric-value">${metrics.itemsSoldWeek}</div>
      </div>
      
      <div class="metric-card danger">
        <div class="metric-label">Missed Opportunities</div>
        <div class="metric-value">${metrics.missedOpportunities}</div>
      </div>
      
      <div class="metric-card warning">
        <div class="metric-label">Printer Costs</div>
        <div class="metric-value">$${printerCosts.toFixed(2)}</div>
      </div>
    </div>
    
    ${metrics.topCategories.length > 0 ? `
    <div class="section">
      <h2>Top Performing Categories</h2>
      ${metrics.topCategories.map(cat => `
        <div class="category-item">
          <span class="category-name">${cat.category.replace('-', ' ')}</span>
          <div class="category-stats">
            <div class="category-revenue">$${cat.revenue.toFixed(2)}</div>
            <div class="category-count">${cat.count} items</div>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${staffPerformance.length > 0 ? `
    <div class="section">
      <h2>Staff Performance</h2>
      ${staffPerformance.slice(0, 5).map((staff, index) => `
        <div class="staff-item">
          <span class="staff-name">${index === 0 ? '🏆 ' : ''}${staff.staffMember}</span>
          <div class="staff-stats">
            <div class="staff-revenue">$${staff.revenue.toFixed(2)}</div>
            <div class="staff-count">${staff.count} discounts applied</div>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <div class="section">
      <h2>Key Insights</h2>
      <ul style="color: #666; line-height: 1.8;">
        ${metrics.week > 0 ? `<li>Successfully recovered <strong style="color: #10b981;">$${metrics.week.toFixed(2)}</strong> in revenue this week</li>` : ''}
        ${metrics.itemsSoldWeek > 0 ? `<li>Prevented <strong>${metrics.itemsSoldWeek}</strong> items from going to waste</li>` : ''}
        ${metrics.missedOpportunities > 0 ? `<li><strong style="color: #ef4444;">${metrics.missedOpportunities}</strong> items expired before discount - potential improvement area</li>` : ''}
        ${printerCosts > 0 ? `<li>Label printing costs: $${printerCosts.toFixed(2)} (${((printerCosts / metrics.week) * 100).toFixed(1)}% of recovered revenue)</li>` : ''}
        ${metrics.topCategories[0] ? `<li>Top category: <strong>${metrics.topCategories[0].category.replace('-', ' ')}</strong> with $${metrics.topCategories[0].revenue.toFixed(2)} recovered</li>` : ''}
      </ul>
    </div>
    
    <div class="footer">
      <p>This is an automated weekly report from FreshSave Pro</p>
      <p>Generated on ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function generateDailyEmailReport(
  store: Store,
  products: Product[],
  activities: Activity[]
): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayProducts = products.filter(p => {
    const addedDate = new Date(p.dateAdded)
    addedDate.setHours(0, 0, 0, 0)
    return addedDate.getTime() === today.getTime()
  })
  
  const expiringToday = products.filter(p => {
    const expiryDate = new Date(p.expiryDate)
    expiryDate.setHours(0, 0, 0, 0)
    return expiryDate.getTime() === today.getTime() && p.status === 'pending'
  })
  
  const metrics = calculateRevenueMetrics(products)
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Summary - ${store.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0891b2;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .urgent-alert {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .urgent-alert h3 {
      color: #ef4444;
      margin: 0 0 8px 0;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Daily Summary</h1>
      <p>${store.name} - ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    ${expiringToday.length > 0 ? `
    <div class="urgent-alert">
      <h3>⚠️ ${expiringToday.length} Items Expiring Today</h3>
      <p>These items need immediate attention to prevent waste.</p>
    </div>
    ` : ''}
    
    <h2>Today's Performance</h2>
    <p><strong>Revenue Recovered:</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">$${metrics.today.toFixed(2)}</span></p>
    <p><strong>Items Sold:</strong> ${metrics.itemsSoldToday}</p>
    <p><strong>Items Added:</strong> ${todayProducts.length}</p>
  </div>
</body>
</html>
  `.trim()
}
