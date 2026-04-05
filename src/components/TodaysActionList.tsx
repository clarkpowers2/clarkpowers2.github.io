import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Product } from '@/lib/types'
import { calculateDiscountInfo, calculateDaysUntilExpiry } from '@/lib/productUtils'
import { ClockCountdown, Tag, Package, CurrencyDollar } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface TodaysActionListProps {
  products: Product[]
  onViewProducts: () => void
}

export function TodaysActionList({ products, onViewProducts }: TodaysActionListProps) {
  const criticalItems = products.filter(p => {
    const days = calculateDaysUntilExpiry(p.expiryDate)
    return days <= 1 && p.status === 'pending'
  })

  const highUrgencyItems = products.filter(p => {
    const days = calculateDaysUntilExpiry(p.expiryDate)
    return days === 2 && p.status === 'pending'
  })

  const mediumUrgencyItems = products.filter(p => {
    const days = calculateDaysUntilExpiry(p.expiryDate)
    return days === 3 && p.status === 'pending'
  })

  const potentialRevenue = criticalItems.reduce((sum, p) => {
    const info = calculateDiscountInfo(p)
    return sum + info.discountedPrice
  }, 0)

  const needsDiscount = criticalItems.filter(p => p.status === 'pending').length
  const needsLabeling = products.filter(p => p.status === 'discounted').length

  if (criticalItems.length === 0 && highUrgencyItems.length === 0) {
    return (
      <Card className="p-6 bg-success/5 border-success/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-success/20 rounded-full">
            <Package size={24} weight="bold" className="text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">All caught up!</h3>
            <p className="text-sm text-muted-foreground">No urgent actions needed today</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border-warning bg-gradient-to-br from-warning/5 to-warning/10">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning/20 rounded-full">
              <ClockCountdown size={28} weight="bold" className="text-warning" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Today's Action List</h2>
              <p className="text-sm text-muted-foreground">Items requiring immediate attention</p>
            </div>
          </div>
          <Button onClick={onViewProducts} variant="outline" size="sm">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-destructive/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Critical</span>
              <Badge className="bg-destructive text-destructive-foreground">
                {criticalItems.length}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{criticalItems.length} items</p>
            <p className="text-xs text-muted-foreground mt-1">Expires today or expired</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-accent/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">High Priority</span>
              <Badge className="bg-accent text-accent-foreground">
                {highUrgencyItems.length}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{highUrgencyItems.length} items</p>
            <p className="text-xs text-muted-foreground mt-1">Expires tomorrow</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-info/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Medium Priority</span>
              <Badge className="bg-info text-info-foreground">
                {mediumUrgencyItems.length}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{mediumUrgencyItems.length} items</p>
            <p className="text-xs text-muted-foreground mt-1">Expires in 3 days</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-3 p-3 bg-background/50 backdrop-blur-sm rounded-lg border">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Tag size={20} weight="bold" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Needs Discount</p>
              <p className="text-lg font-bold">{needsDiscount} products</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-background/50 backdrop-blur-sm rounded-lg border">
            <div className="p-2 bg-success/10 rounded-lg">
              <CurrencyDollar size={20} weight="bold" className="text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potential Revenue</p>
              <p className="text-lg font-bold">${potentialRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {needsLabeling > 0 && (
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={20} weight="bold" className="text-accent" />
              <span className="text-sm font-medium">
                {needsLabeling} {needsLabeling === 1 ? 'product' : 'products'} ready for labeling
              </span>
            </div>
            <Badge variant="secondary">{needsLabeling}</Badge>
          </div>
        )}
      </div>
    </Card>
  )
}
